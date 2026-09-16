export const ADMIN_ROLES = ['lead_sommelier', 'admin', 'super_admin'] as const;

export type AdminRole = typeof ADMIN_ROLES[number];

export const isAdminRole = (role?: string | null): role is AdminRole =>
  ADMIN_ROLES.includes(role as AdminRole);
