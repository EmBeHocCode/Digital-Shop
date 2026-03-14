import "server-only";

export type UserRole = "CUSTOMER" | "STAFF" | "MANAGER" | "ADMIN" | "SUPERADMIN";

export const ROLE_HIERARCHY = {
  CUSTOMER: 0,
  STAFF: 1,
  MANAGER: 2,
  ADMIN: 3,
  SUPERADMIN: 4,
} as const;

export const MANAGEMENT_ROLES: UserRole[] = ["STAFF", "MANAGER", "ADMIN", "SUPERADMIN"];
export const CUSTOMER_ROLES: UserRole[] = ["CUSTOMER"];

/**
 * Check if a role has management dashboard access
 */
export function canAccessManagementDashboard(role?: UserRole | null): boolean {
  if (!role) return false;
  return MANAGEMENT_ROLES.includes(role);
}

/**
 * Check if a role can access customer account area
 */
export function canAccessCustomerAccount(role?: UserRole | null): boolean {
  if (!role) return false;
  return role === "CUSTOMER" || canAccessManagementDashboard(role);
}

/**
 * Check if a role can manage orders
 */
export function canManageOrders(role?: UserRole | null): boolean {
  if (!role) return false;
  return ["STAFF", "MANAGER", "ADMIN", "SUPERADMIN"].includes(role);
}

/**
 * Check if a role can manage products
 */
export function canManageProducts(role?: UserRole | null): boolean {
  if (!role) return false;
  return ["MANAGER", "ADMIN", "SUPERADMIN"].includes(role);
}

/**
 * Check if a role can manage users/customers
 */
export function canManageUsers(role?: UserRole | null): boolean {
  if (!role) return false;
  return ["ADMIN", "SUPERADMIN"].includes(role);
}

/**
 * Check if a role can manage billing
 */
export function canManageBilling(role?: UserRole | null): boolean {
  if (!role) return false;
  return ["MANAGER", "ADMIN", "SUPERADMIN"].includes(role);
}

/**
 * Check if a role can manage system settings
 */
export function canManageSystemSettings(role?: UserRole | null): boolean {
  if (!role) return false;
  return ["ADMIN", "SUPERADMIN"].includes(role);
}

/**
 * Check if one role has higher or equal privilege than another
 */
export function hasHigherOrEqualPrivilege(
  userRole: UserRole | undefined,
  requiredRole: UserRole
): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get allowed dashboard sections for a role
 */
export function getAllowedDashboardSections(role?: UserRole | null): string[] {
  if (!role) return [];

  const sections: string[] = [];

  if (role === "CUSTOMER") {
    sections.push("profile", "orders", "wallet", "purchased-products", "billing", "settings");
  } else if (role === "STAFF") {
    sections.push("orders");
  } else if (role === "MANAGER") {
    sections.push("orders", "products", "billing");
  } else if (role === "ADMIN" || role === "SUPERADMIN") {
    sections.push("overview", "orders", "products", "customers", "billing", "settings");
  }

  return sections;
}

/**
 * Check if a user can access a specific dashboard section
 */
export function canAccessDashboardSection(
  role: UserRole | undefined,
  section: string
): boolean {
  const allowedSections = getAllowedDashboardSections(role);
  return allowedSections.includes(section);
}
