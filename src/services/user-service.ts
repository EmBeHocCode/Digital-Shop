import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { runSafeDbQuery } from "@/services/db-utils";
import { mapPrismaUser } from "@/services/sql-mappers";
import type { User, UserRole as DomainUserRole } from "@/types/domain";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getUserByEmailFromDb(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });
}

export async function getDomainUserByEmail(email: string) {
  return runSafeDbQuery<User | null>(null, async () => {
    const user = await getUserByEmailFromDb(email);
    return user ? mapPrismaUser(user) : null;
  });
}

export async function getDomainUserById(id: string) {
  return runSafeDbQuery<User | null>(null, async () => {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? mapPrismaUser(user) : null;
  });
}

export async function getUsers() {
  return runSafeDbQuery<User[]>([], async () => {
    const users = await prisma.user.findMany({
      orderBy: [{ createdAt: "desc" }]
    });
    return users.map(mapPrismaUser);
  });
}

export async function getLatestUsers(limit = 5) {
  return runSafeDbQuery<User[]>([], async () => {
    const users = await prisma.user.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: limit
    });

    return users.map(mapPrismaUser);
  });
}

export async function authenticateUser(email: string, password: string, role?: DomainUserRole) {
  const user = await getUserByEmailFromDb(email);
  if (!user || user.status !== UserStatus.ACTIVE || (role && user.role !== role)) {
    return null;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return null;
  }

  return mapPrismaUser(user);
}

export async function registerUser(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: DomainUserRole;
}) {
  const existedUser = await getUserByEmailFromDb(input.email);
  if (existedUser) {
    return { error: "Email đã tồn tại trong hệ thống." as const };
  }

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash: await hashPassword(input.password),
      fullName: input.fullName,
      phone: input.phone,
      avatarUrl: null,
      role: (input.role ?? "USER") as UserRole,
      status: UserStatus.ACTIVE,
      notificationsEnabled: true
    }
  });

  return { user: mapPrismaUser(user) };
}

export async function createUserSession(userId: string) {
  const sessionToken = `session_${crypto.randomBytes(24).toString("hex")}`;
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await prisma.session.create({
    data: {
      userId,
      sessionToken,
      expires
    }
  });

  return {
    token: sessionToken,
    expiresAt: expires.toISOString()
  };
}

export async function getUserBySessionToken(sessionToken: string) {
  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: true
    }
  });

  if (!session) {
    return null;
  }

  if (session.expires.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { sessionToken } }).catch(() => undefined);
    return null;
  }

  return mapPrismaUser(session.user);
}

export async function updateUserProfile(
  userId: string,
  input: {
    fullName: string;
    phone: string;
  }
) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!existingUser) {
    return null;
  }

  const updatedUser = await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.update({
      where: { id: userId },
      data: {
        fullName: input.fullName.trim(),
        phone: input.phone.trim()
      }
    });

    await transaction.auditLog.create({
      data: {
        actorId: userId,
        action: "UPDATE_PROFILE",
        resource: "User",
        resourceId: userId,
        detail: `Cập nhật thông tin tài khoản: ${input.fullName.trim()} / ${input.phone.trim()}.`
      }
    });

    return user;
  });

  return mapPrismaUser(updatedUser);
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return { error: "Không tìm thấy tài khoản cần đổi mật khẩu." as const };
  }

  const passwordMatches = await comparePassword(currentPassword, user.passwordHash);

  if (!passwordMatches) {
    return { error: "Mật khẩu hiện tại chưa đúng." as const };
  }

  const reusedPassword = await comparePassword(newPassword, user.passwordHash);

  if (reusedPassword) {
    return { error: "Mật khẩu mới cần khác mật khẩu hiện tại." as const };
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { id: userId },
      data: {
        passwordHash: await hashPassword(newPassword)
      }
    });

    await transaction.auditLog.create({
      data: {
        actorId: userId,
        action: "CHANGE_PASSWORD",
        resource: "User",
        resourceId: userId,
        detail: "Người dùng đã tự đổi mật khẩu tài khoản."
      }
    });
  });

  return { success: true as const };
}

export async function deleteSession(sessionToken: string) {
  if (!sessionToken) {
    return;
  }

  await prisma.session.deleteMany({
    where: { sessionToken }
  });
}

export async function createPasswordReset(email: string) {
  const user = await getUserByEmailFromDb(email);
  if (!user) {
    return null;
  }

  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null
    },
    data: {
      usedAt: new Date()
    }
  });

  const token = `reset_${crypto.randomBytes(20).toString("hex")}`;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  const resetToken = await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt
    }
  });

  return {
    token: resetToken.token,
    email: user.email,
    expiresAt: resetToken.expiresAt.toISOString()
  };
}

export async function resetPasswordWithToken(token: string, password: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() <= Date.now()) {
    return { error: "Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." as const };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash: await hashPassword(password)
      }
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: {
        usedAt: new Date()
      }
    }),
    prisma.session.deleteMany({
      where: { userId: resetToken.userId }
    })
  ]);

  return {
    success: true as const,
    user: mapPrismaUser(resetToken.user)
  };
}
