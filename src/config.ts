export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';

export const isConfiguredAdminEmail = (email?: string | null) => {
  return Boolean(ADMIN_EMAIL) && email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
};
