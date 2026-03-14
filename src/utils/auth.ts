export function getRoleLabel(role: string) {
  if (role === "ADMIN") {
    return "Quản trị viên";
  }

  if (role === "STAFF") {
    return "Nhân viên";
  }

  return "Khách hàng";
}

export function isAdminRole(role: string | undefined) {
  return role === "ADMIN";
}

export function isManagementRole(role: string | undefined) {
  return role === "ADMIN" || role === "STAFF";
}

export function getDashboardHrefByRole(role: string | undefined) {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "STAFF") {
    return "/staff";
  }

  return undefined;
}

export function getAccountHrefByRole(role: string | undefined) {
  if (role === "ADMIN") {
    return "/admin/account";
  }

  if (role === "STAFF") {
    return "/staff/account";
  }

  return "/profile/account";
}

export function getSecurityHrefByRole(role: string | undefined) {
  if (role === "ADMIN") {
    return "/admin/security";
  }

  if (role === "STAFF") {
    return "/staff/security";
  }

  return "/profile/security";
}
