// Pure structural validation of a public certificate id (from the /c/[id] URL or
// a certificate's own `id` field). No DB — safe to import anywhere, including
// prisma-free unit tests and the badge image route.

// Accept the desktop app's UUID ids, plus a conservative slug shape, so obvious
// garbage is rejected early without coupling to one exact id format.
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

export function isValidCertificateId(id: string): boolean {
  return ID_PATTERN.test(id);
}
