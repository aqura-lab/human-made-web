// Admin allowlist. The list comes from ADMIN_EMAILS (comma-separated). Admin
// status is baked into the session JWT at sign time AND re-checked server-side
// in every admin route — the cookie claim alone is never trusted for mutations.

export function parseAdminEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

export function isAdminEmail(email: string, allowlist: string[]): boolean {
  return allowlist.includes(email.trim().toLowerCase());
}

export function adminEmails(): string[] {
  return parseAdminEmails(process.env.ADMIN_EMAILS);
}
