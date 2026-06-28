import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";

// Wire SHA-512 so signature verification is fully synchronous and offline,
// with no dependence on optional WebCrypto Ed25519 support.
ed.etc.sha512Sync = (...m: Uint8Array[]) =>
  sha512(ed.etc.concatBytes(...m));

export type PolicyTier =
  | "process-captured"
  | "no-bulk-paste"
  | "mixed-input-disclosed";

export type PolicyVerdict =
  | "eligible"
  | "eligible-with-disclosures"
  | "ineligible"
  | "insufficient-evidence";

export type CoverageLevel = "strong" | "partial" | "weak";
export type IssueState = "issuable" | "issuable-with-caveats";
export type DisclosureLevel = "validity-only" | "summary" | "expanded";

export interface Coverage {
  typed_chars: number;
  final_chars: number;
  ratio_pct: number;
  level: CoverageLevel;
}

export interface SessionSummary {
  keystrokes: number;
  typed_chars: number;
  deletions: number;
  paste_count: number;
  large_paste_count: number;
  interruptions: number;
  dictation_disclosed: boolean;
}

// Always-present core + optional fields revealed per disclosure level.
// Optional fields are OMITTED (not null) when not shared.
export interface Certificate {
  version: string;
  disclosure: DisclosureLevel;
  id: string;
  issued_at: string;
  issuer_pubkey: string;
  granted_tier: PolicyTier;
  verdict: PolicyVerdict;
  final_text_sha256: string;
  integrity: string;
  session_id?: string;
  label?: string;
  state?: IssueState;
  meaning?: string;
  coverage_level?: CoverageLevel;
  final_text_chars?: number;
  coverage?: Coverage;
  session_summary?: SessionSummary;
  disclosures?: string[];
  limitations?: string[];
}

export const DISCLOSURE_NAME: Record<DisclosureLevel, string> = {
  "validity-only": "Validity only",
  summary: "Basic summary",
  expanded: "Expanded summary",
};

export interface RegistrationReceipt {
  version: string;
  seq: number;
  registered_at: string;
  cert_sha256: string;
  final_text_sha256: string;
  prev_hash: string;
  entry_hash: string;
}

export interface SignedCertificate {
  certificate: Certificate;
  algorithm: string;
  signature: string;
  registration?: RegistrationReceipt;
}

export const TIER_NAME: Record<PolicyTier, string> = {
  "process-captured": "Process-Captured",
  "no-bulk-paste": "No-Bulk-Paste",
  "mixed-input-disclosed": "Mixed Input (Disclosed)",
};

export const VERDICT_NAME: Record<PolicyVerdict, string> = {
  eligible: "Eligible",
  "eligible-with-disclosures": "Eligible with disclosures",
  ineligible: "Lower tier granted",
  "insufficient-evidence": "Insufficient evidence",
};

/**
 * Rebuild the EXACT byte string the desktop app signed.
 *
 * The Rust app signs `serde_json::to_vec(&certificate)`, which is compact
 * (no whitespace) with keys in struct-declaration order. We reconstruct the
 * object here in that same order and `JSON.stringify` it compactly, so the
 * bytes match regardless of how the incoming JSON was formatted or reordered.
 */
export function canonicalBytes(c: Certificate): Uint8Array {
  // Reconstruct keys in the exact Rust struct order, INCLUDING ONLY the keys
  // present (omitted optional fields are absent, never null). This mirrors
  // serde's `skip_serializing_if = "Option::is_none"` output byte-for-byte.
  const o: Record<string, unknown> = {};
  o.version = c.version;
  o.disclosure = c.disclosure;
  o.id = c.id;
  o.issued_at = c.issued_at;
  o.issuer_pubkey = c.issuer_pubkey;
  o.granted_tier = c.granted_tier;
  o.verdict = c.verdict;
  o.final_text_sha256 = c.final_text_sha256;
  o.integrity = c.integrity;
  if (c.session_id !== undefined) o.session_id = c.session_id;
  if (c.label !== undefined) o.label = c.label;
  if (c.state !== undefined) o.state = c.state;
  if (c.meaning !== undefined) o.meaning = c.meaning;
  if (c.coverage_level !== undefined) o.coverage_level = c.coverage_level;
  if (c.final_text_chars !== undefined) o.final_text_chars = c.final_text_chars;
  if (c.coverage !== undefined)
    o.coverage = {
      typed_chars: c.coverage.typed_chars,
      final_chars: c.coverage.final_chars,
      ratio_pct: c.coverage.ratio_pct,
      level: c.coverage.level,
    };
  if (c.session_summary !== undefined)
    o.session_summary = {
      keystrokes: c.session_summary.keystrokes,
      typed_chars: c.session_summary.typed_chars,
      deletions: c.session_summary.deletions,
      paste_count: c.session_summary.paste_count,
      large_paste_count: c.session_summary.large_paste_count,
      interruptions: c.session_summary.interruptions,
      dictation_disclosed: c.session_summary.dictation_disclosed,
    };
  if (c.disclosures !== undefined) o.disclosures = c.disclosures;
  if (c.limitations !== undefined) o.limitations = c.limitations;
  return new TextEncoder().encode(JSON.stringify(o));
}

export type SignatureResult =
  | { ok: true }
  | { ok: false; reason: string };

export function verifySignature(signed: SignedCertificate): SignatureResult {
  if (signed.algorithm !== "ed25519") {
    return { ok: false, reason: `Unsupported algorithm: ${signed.algorithm}` };
  }
  let sig: Uint8Array;
  let pub: Uint8Array;
  try {
    sig = ed.etc.hexToBytes(signed.signature);
    pub = ed.etc.hexToBytes(signed.certificate.issuer_pubkey);
  } catch {
    return { ok: false, reason: "Malformed signature or public key encoding." };
  }
  if (pub.length !== 32) {
    return { ok: false, reason: "Issuer public key is not a valid Ed25519 key." };
  }
  if (sig.length !== 64) {
    return { ok: false, reason: "Signature is not a valid Ed25519 signature." };
  }
  try {
    const msg = canonicalBytes(signed.certificate);
    const valid = ed.verify(sig, msg, pub);
    return valid
      ? { ok: true }
      : {
          ok: false,
          reason:
            "Signature does not match the certificate contents. It was altered or signed by a different key.",
        };
  } catch (e) {
    return { ok: false, reason: `Verification error: ${String(e)}` };
  }
}

export function sha256Hex(text: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(text)));
}

/** Canonical content hash of a certificate (matches Rust `cert_sha256`). */
export function certSha256(c: Certificate): string {
  return bytesToHex(sha256(canonicalBytes(c)));
}

export type RegistrationResult =
  | { state: "none" }
  | { state: "registered"; seq: number; entryHash: string; registeredAt: string }
  | { state: "mismatch"; reason: string };

/**
 * Verify a tamper-evident registration receipt binds to this exact
 * certificate, by recomputing the cert content hash and the chained entry
 * hash. Detects any alteration of the certificate after registration.
 */
export function verifyRegistration(signed: SignedCertificate): RegistrationResult {
  const r = signed.registration;
  if (!r) return { state: "none" };
  const c = signed.certificate;
  const cs = certSha256(c);
  if (cs !== r.cert_sha256) {
    return {
      state: "mismatch",
      reason:
        "The certificate content does not match the registered hash — it was altered after registration.",
    };
  }
  if (c.final_text_sha256 !== r.final_text_sha256) {
    return {
      state: "mismatch",
      reason: "The final-text hash does not match the registered record.",
    };
  }
  const recomputed = bytesToHex(
    sha256(
      new TextEncoder().encode(
        `${r.seq}|${r.prev_hash}|${c.id}|${cs}|${c.final_text_sha256}|${r.registered_at}`,
      ),
    ),
  );
  if (recomputed !== r.entry_hash) {
    return {
      state: "mismatch",
      reason: "The registration entry hash is inconsistent with the certificate.",
    };
  }
  return {
    state: "registered",
    seq: r.seq,
    entryHash: r.entry_hash,
    registeredAt: r.registered_at,
  };
}

export function parseSigned(raw: string): SignedCertificate {
  const obj = JSON.parse(raw);
  if (
    !obj ||
    typeof obj !== "object" ||
    !obj.certificate ||
    typeof obj.signature !== "string" ||
    typeof obj.algorithm !== "string"
  ) {
    throw new Error(
      "This does not look like a Humanlit certificate (expected certificate, algorithm, signature).",
    );
  }
  return obj as SignedCertificate;
}
