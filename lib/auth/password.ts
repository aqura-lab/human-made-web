import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Password hashing with Node's native scrypt (memory-hard KDF). Matches the
// codebase's node:crypto convention (see token.ts). No third-party dependency.
// Stored form is self-describing so params can evolve: scrypt$N$r$p$saltHex$hashHex.

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const N = 16384; // 2^14
const R = 8;
const P = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;
const MAXMEM = 64 * 1024 * 1024; // headroom above 128*N*r (~16MB)

const MIN_LEN = 10;
const MAX_LEN = 200;

export function validatePassword(plain: string): { ok: true } | { ok: false; error: string } {
  if (typeof plain !== "string" || plain.length < MIN_LEN) {
    return { ok: false, error: `Password must be at least ${MIN_LEN} characters.` };
  }
  if (plain.length > MAX_LEN) {
    return { ok: false, error: `Password must be at most ${MAX_LEN} characters.` };
  }
  return { ok: true };
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await scrypt(plain, salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(plain: string, encoded: string): Promise<boolean> {
  try {
    const parts = encoded.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
    const n = Number(nStr);
    const r = Number(rStr);
    const p = Number(pStr);
    if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    if (salt.length === 0 || expected.length === 0) return false;
    const actual = await scrypt(plain, salt, expected.length, { N: n, r, p, maxmem: MAXMEM });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
