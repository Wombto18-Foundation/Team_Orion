import { auth } from "./auth";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "STATE_ADMIN"] as const;
type AdminRole = (typeof ADMIN_ROLES)[number];

export function getAdminSession() {
  const s = auth.getSession();
  if (!s) return null;
  if (!ADMIN_ROLES.includes(s.role as AdminRole)) return null;
  return s;
}

export function isSuperAdmin(): boolean {
  const s = auth.getSession();
  return s?.role === "SUPER_ADMIN" || s?.role === "ADMIN";
}

export function isStateAdmin(): boolean {
  return auth.getSession()?.role === "STATE_ADMIN";
}

export function getAdminState(): string | null {
  return auth.getSession()?.adminState ?? null;
}
