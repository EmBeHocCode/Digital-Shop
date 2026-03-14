import type { User } from "@/types/domain";

export type SessionUserCookie = Pick<
  User,
  "id" | "fullName" | "email" | "phone" | "role" | "avatar"
>;

export const sessionUserUpdatedEventName = "meowmarket-session-user-updated";

export function getUserAvatarInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function getCurrentUser(_role: "USER" | "STAFF" | "ADMIN" = "USER") {
  return null;
}

export function getUserById(_id: string) {
  return null;
}

export function getUserByEmail(_email: string) {
  return null;
}

export function getCurrentUserFromSession(
  _sessionEmail?: string,
  _role?: "USER" | "STAFF" | "ADMIN"
) {
  return null;
}

export function serializeSessionUser(
  user: SessionUserCookie
) {
  return encodeURIComponent(
    JSON.stringify({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar
    })
  );
}

export function parseSessionUser(serialized?: string | null) {
  if (!serialized) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(serialized)) as SessionUserCookie;

    if (!parsed.email || !parsed.fullName || !parsed.role) {
      return null;
    }

    return {
      id: parsed.id ?? parsed.email,
      fullName: parsed.fullName,
      email: parsed.email,
      phone: parsed.phone ?? "",
      role: parsed.role,
      avatar: parsed.avatar || getUserAvatarInitials(parsed.fullName)
    };
  } catch {
    return null;
  }
}

export function authenticateMockUser(_email: string, _role: "USER" | "STAFF" | "ADMIN") {
  return null;
}
