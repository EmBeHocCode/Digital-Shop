import type { UserRole } from "@/types/domain";
import {
  authenticateUser,
  createPasswordReset,
  getDomainUserByEmail,
  registerUser,
  resetPasswordWithToken
} from "@/services/user-service";

export async function authenticateCredentials(
  email: string,
  password: string,
  role?: UserRole
) {
  return authenticateUser(email, password, role);
}

export async function registerCredentials(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
}) {
  return registerUser(input);
}

export async function getRuntimeUserByEmail(email: string) {
  return getDomainUserByEmail(email);
}

export async function requestPasswordReset(email: string) {
  return createPasswordReset(email);
}

export async function resetPassword(token: string, password: string) {
  return resetPasswordWithToken(token, password);
}
