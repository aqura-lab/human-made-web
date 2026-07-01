# Publish Certificates — Design

**Date:** 2026-07-01
**Repo:** `human-made-web`
**Status:** Approved design, pending implementation plan
**Branch:** `feat/publish-certificates`
**Closes:** GitHub issue #3

## Context

The embeddable badge (PR #2) links to a public landing page `/c/[id]`. That page's
**"found"** branch is fully built — it renders the certificate's claims and verifies the
Ed25519 signature live — but it never fires, because `lib/certificate/registry.ts →
getPublishedCertificate(id)` returns `null`: this app verifies certificates *statelessly* and
stores nothing. So a reader who clicks an embedded badge gets the honest explainer + a manual
"paste to verify" fallback, not a live certificate.

This closes that loop: let a writer **publish** a certificate so `/c/[id]` renders it
automatically. That makes the badge a real, one-click-verifiable proof — the shareable artifact
that drives virality (publish → badge → embed on your article → readers click → live proof).

Key facts from the codebase:
- `getPublishedCertificate(id)` already returns the exact shape the page needs:
  `{ id, signed: SignedCertificate, articleUrl?, publishedAt? }`. **No call site changes** when
  a store is wired.
- `SignedCertificate` (`lib/verify/verify.ts`) holds the certificate claims, the Ed25519
  signature, and a registration receipt — plus a **SHA-256 hash** of the final text, **never
  the raw text/keystrokes**. It is safe to persist.
- `verifySignature(signed)` / `verifyRegistration(signed)` verify statelessly; `parseSigned(raw)`
  parses a JSON string into a `SignedCertificate`.
- A real signed fixture exists at `tests/fixtures/certificates/sample.registered.json`
  (already used by `verifier.spec.ts`).
- The dashboard already has a preview-only `BadgeEmbed` (turns a cert id into a badge snippet);
  this design gives it a real publish→badge loop.

## Approved decisions

1. **Publish path = dashboard paste/upload** (self-contained; no desktop-app or cross-app auth).
2. **Storage = Prisma `Certificate` model** in Neon (small JSON; needs ownership, lookup,
   unpublish).
3. **GDPR = keep-but-anonymize.** On account deletion the published certificate survives with
   its `userId` nulled — consistent with how the app already anonymizes feedback, it removes the
   personal link while keeping badges embedded on third-party articles working. The stored JSON
   carries no PII.

## Data model

```prisma
model Certificate {
  id          String   @id             // the certificate's own signed UUID = the public /c/[id] handle
  signedJson  String                   // the already-public signed JSON, stored verbatim (no raw text)
  articleUrl  String?
  userId      String?                  // publisher; nulled if they delete their account
  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  publishedAt DateTime @default(now())

  @@index([userId])
}
```

- `User` gains `certificates Certificate[]`.
- Migration `0004_certificates` creates the table + FK (`ON DELETE SET NULL`) + index.
- `signedJson` is stored **verbatim** (the exact text the writer submitted, post-validation) so
  nothing about the signature is disturbed. It is re-parsed and re-verified on read.

## Publish / lookup

### `lib/certificate/publish.ts` (pure, unit-tested)
`preparePublish(rawJson: string): { ok: true; signed: SignedCertificate; certId: string } | { ok: false; error: string }`
- `parseSigned(rawJson)` (guarded — malformed → `{ok:false}`).
- `verifySignature(signed)` **must pass** (invalid/tampered → `{ok:false}`). Only
  cryptographically valid certs are ever stored.
- `certId = signed.certificate.id`; reject if missing/not a valid id shape
  (`isValidCertificateId`).

### `lib/certificate/store.ts` (thin Prisma layer)
- `publishCertificate({ userId, rawJson, certId, articleUrl })` — **upsert by `id`**. If a row
  with that id exists and its `userId` is a *different* non-null user → throw a typed
  "already owned" error (route maps to 409). Otherwise create/update with the current `userId`.
- `unpublishCertificate({ userId, id })` — deletes only if owned by `userId`.
- `listUserCertificates(userId)` — the writer's published certs (id, articleUrl, publishedAt).

`getPublishedCertificate(id)` **stays in `registry.ts`** (unchanged import path, so the
`/c/[id]` page is untouched); its body changes from `return null` to: load the row via the
store, `parseSigned(signedJson)`, and return `{ id, signed, articleUrl ?? undefined,
publishedAt }` (or `null` if absent/unparseable).

### API routes (all `runtime = "nodejs"`)
- `POST /api/certificate/publish` — authed (`getCurrentUser`). Body
  `{ json: string, articleUrl?: string }` via a Zod schema (json ≤ 50 KB; articleUrl a valid
  URL, optional). `preparePublish` → 400 on invalid signature/parse. Store (409 on ownership
  clash). Returns `{ id, url: "/c/<id>" }`.
- `POST /api/certificate/unpublish` — authed, owner-only. Body `{ id }`. Returns `{ ok: true }`.

## Dashboard UI

A **"Publish your certificate"** panel:
- Paste the signed JSON into a textarea **or** upload the `.json` file (read client-side into the
  same field); optional "Article URL".
- On success: show the live **`/c/<id>`** link and a **copy-ready badge embed snippet** (the same
  `<a><img>` markup the homepage badge uses, pointing at `/api/badge/<id>`).
- A **"Your published certificates"** list (from `listUserCertificates`) with each cert's link,
  optional article URL, and an **Unpublish** button.

The existing preview-only `BadgeEmbed` is folded into this flow (a badge snippet is only useful
once the certificate is actually published and resolvable).

## Privacy / security invariants

- Only the already-public signed JSON is stored — no raw text/keystrokes (the type has none).
- Every `/c/[id]` render **re-verifies** the signature; the store is a convenience cache, never a
  source of trust. A tampered stored payload fails verification and shows as invalid.
- Publish/unpublish require authentication and ownership; `/c/[id]` is intentionally public.
- Payload size cap (50 KB) on publish; `articleUrl` validated as a URL.
- **GDPR:** account soft-delete additionally runs `certificate.updateMany({ where: { userId },
  data: { userId: null } })` inside the existing delete transaction (immediate anonymization,
  mirroring feedback); the `ON DELETE SET NULL` FK is the backstop at the hard-purge cron.

## Testing

**Unit (Jest, no DB):**
- `preparePublish`: the real `sample.registered.json` fixture → `{ok:true}` with the fixture's
  `certId`; a byte-tampered signature → `{ok:false}`; non-JSON / missing fields → `{ok:false}`.

**E2E (Playwright):**
- A logged-in user pastes the fixture on the dashboard → success shows the `/c/<id>` link +
  badge snippet → visiting `/c/<id>` now renders the **verified** certificate (not the fallback).
- **Unpublish** → `/c/<id>` returns to the not-found fallback.
- Pasting an invalid/tampered certificate is rejected with an error (nothing stored).
- (Ownership 409 is covered at the store unit level rather than E2E.)

Full suite (lint, Jest, build, Playwright) stays green.

## Non-goals

- Desktop-app auto-publish (dashboard is the MVP; the publish API is reusable later).
- Editing a published certificate's contents (re-publish replaces it; certs are immutable
  signed artifacts anyway).
- Public discovery/listing of all certificates (each is reachable only by its id).
- Analytics on badge clicks.
