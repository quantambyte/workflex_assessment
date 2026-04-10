import { Role, Permission } from "../types/rbac.types";

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.HR_ADMIN]: [
    Permission.VIEW_ALL_USERS,
    Permission.VIEW_REGIONAL_USERS,
    Permission.MANAGE_USERS,
    Permission.VIEW_REPORTS,
  ],
  [Role.REGIONAL_MANAGER]: [
    Permission.VIEW_REGIONAL_USERS,
    Permission.VIEW_REPORTS,
  ],
  [Role.MANAGER]: [Permission.VIEW_REGIONAL_USERS],
  [Role.EMPLOYEE]: [],
};
