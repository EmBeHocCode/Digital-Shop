import "server-only";

import { cookies } from "next/headers";
import { parseSessionUser } from "@/services/auth-service";
import { getDomainUserByEmail, getUserBySessionToken } from "@/services/user-service";
import type { User } from "@/types/domain";

export async function getCurrentSessionUser() {
  const cookieStore = cookies();
  const role = cookieStore.get("meowmarket-role")?.value as "CUSTOMER" | "STAFF" | "MANAGER" | "ADMIN" | "SUPERADMIN" | undefined;
  const parsedCookieUser = parseSessionUser(cookieStore.get("meowmarket-user")?.value);

  if (parsedCookieUser?.email) {
    const storedUser = await getDomainUserByEmail(parsedCookieUser.email);

    if (storedUser && (!role || storedUser.role === role)) {
      return storedUser;
    }

    return {
      id: parsedCookieUser.id ?? parsedCookieUser.email,
      fullName: parsedCookieUser.fullName,
      email: parsedCookieUser.email,
      phone: parsedCookieUser.phone,
      avatar: parsedCookieUser.avatar,
      role: parsedCookieUser.role,
      status: "ACTIVE",
      joinedAt: new Date().toISOString()
    } satisfies User;
  }

  const sessionToken = cookieStore.get("meowmarket-session")?.value;
  if (!sessionToken) {
    return null;
  }

  const sessionUser = await getUserBySessionToken(sessionToken);
  if (!sessionUser) {
    return null;
  }

  if (role && sessionUser.role !== role) {
    return null;
  }

  return sessionUser;
}
