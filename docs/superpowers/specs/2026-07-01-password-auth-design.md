# Password Authentication — Design

**Date:** 2026-07-01
**Repo:** `human-made-web`
**Status:** Approved design, pending implementation plan
**Branch:** `feat/password-auth`

## Context

Today the only way in is a **magic link**: sign up (or log in) with an email, receive a
single-use link, click it. This is fine for first-time verification but slow for returning
users, who must round-trip through their inbox every visit. We're adding **password login** as
a faster path, while keeping magic links fully working.

Existing auth (unchanged in spirit):
- **Sessions:** a 30-day `HS256` JWT in an httpOnly, `sameSite=lax`, secure cookie
  (`hm_session`), signed with `JWT_SECRET`. Set via `setSessionCookie({sub,email,isAdmin})`
  in `lib/auth/session.ts`.
- **Magic links:** `MagicLinkToken` table stores only a SHA-256 hash of the raw token
  (`lib/auth/token.ts`), single-use, 15-min TTL. `POST /api/auth/request` issues one;
  `GET /api/auth/callback` consumes it and sets the session.
- **Double opt-in (GDPR):** `User.emailVerified` must be set before a user is "confirmed."
  Signup sends the verification email; clicking the link sets `emailVerified`.
- Crypto convention: the codebase uses **Node's built-in `node:crypto`** (`randomBytes`,
  `createHash`) — not a third-party lib.

## Approved decisions

1. **Password is login-only; email verification stays required.** Setting a password does not
   replace double opt-in — a password doesn't prove email ownership. Signup still sends the
   confirmation email.
2. **Existing users can set a password from their account page** (they log in once via magic
   link, then set a password for fast future logins).
3. **Brute-force defense = essentials + a lightweight Postgres lockout** (generic errors,
   constant-time verify, min length, plus an attempt counter that locks login for ~15 min
   after 8 failures). No new infrastructure.
4. **Login page defaults to password entry**, with "Email me a link instead" one click away.
5. **Password at signup is optional.**

## Hashing — `node:crypto` scrypt (no new dependency)

`node:crypto` provides native `scrypt`/`scryptSync`, `randomBytes`, and `timingSafeEqual` —
faster than pure-JS and consistent with `lib/auth/token.ts`.

New pure module `lib/auth/password.ts`:

- **Params:** `N = 16384 (2^14)`, `r = 8`, `p = 1`, `keylen = 64`, 16-byte random salt.
- **Encoding (self-describing, so params can evolve):**
  `scrypt$16384$8$1$<saltHex>$<hashHex>`.
- `async hashPassword(plain: string): Promise<string>` — random salt → scrypt → encoded string.
- `async verifyPassword(plain: string, encoded: string): Promise<boolean>` — parse params +
  salt, re-derive, compare with `timingSafeEqual` (constant time). Returns `false` (never
  throws) on malformed input.
- `validatePassword(plain: string): { ok: true } | { ok: false; error: string }` — **min 10**,
  **max 200** chars (NIST-style: length over forced complexity). No symbol/case rules.

All three are pure and unit-tested (no DB, no HTTP).

## Lockout — `lib/auth/lockout.ts` (pure)

- Constants: `MAX_ATTEMPTS = 8`, `LOCK_MINUTES = 15`.
- `isLocked(user: {lockedUntil: Date|null}, now: Date): boolean` — `lockedUntil` in the future.
- `nextFailureState(count: number, now: Date): { failedLoginCount: number; lockedUntil: Date|null }`
  — increments; when the incremented count reaches `MAX_ATTEMPTS`, sets
  `lockedUntil = now + LOCK_MINUTES` and resets the count to 0; otherwise `lockedUntil = null`.
- `resetState(): { failedLoginCount: 0; lockedUntil: null }` — applied on any successful login.

Unit-tested as a state machine.

## Data model (`User` additions)

```prisma
passwordHash     String?    // scrypt-encoded; null = magic-link-only
failedLoginCount Int      @default(0)
lockedUntil      DateTime?
```

Migration `0003_password_auth` adds the three nullable/defaulted columns (no backfill;
existing users are simply password-less).

**GDPR:** `buildSoftDelete` in `lib/account/gdpr.ts` additionally scrubs the credential and
resets the lock: `passwordHash: null, failedLoginCount: 0, lockedUntil: null`. The
`SoftDeleteUpdate` type gains these fields.

## Flows & API

### Signup (optional password) — `app/api/signup/route.ts`, `components/landing/SignupForm.tsx`
- The Zod body gains an optional `password`. When present: `validatePassword` → 400 on failure;
  else `hashPassword` and store on the created user.
- **Email verification unchanged** — the confirmation email still sends; `emailVerified` still
  gates "confirmed." Signup confirmation copy may note "once you confirm your email, you can log
  in with your password."
- `SignupForm` gains one optional password input labeled for fast-login intent.

### Login — new `app/api/auth/login/route.ts` + reworked `app/login/page.tsx`
`POST /api/auth/login { email, password }`:
1. Lowercase email; load the user (`passwordHash, emailVerified, failedLoginCount, lockedUntil,
   deletedAt, isAdmin-derivation inputs`).
2. If `isLocked` → `429`-style generic "Too many attempts. Try again in a few minutes."
3. Resolve credentials: user must exist, not be soft-deleted, have a `passwordHash`, and
   `verifyPassword` must pass. **Any failure → identical generic 401 "Invalid email or
   password."** On failure, apply `nextFailureState` and persist.
4. If credentials pass but `emailVerified` is null → do **not** create a session; respond
   "Please confirm your email first" and offer to resend the link (reuses `issueMagicLink`).
5. On success → `resetState`, persist, `setSessionCookie`. (`isAdmin` derived exactly as the
   magic-link callback does today.)

Login page: email + password by default with a primary "Log in" button; a secondary
"Email me a link instead" switches to the existing magic-link request (`/api/auth/request`).
Both paths share the page.

### Set / change password — new `app/api/account/password/route.ts` + account page section
`POST /api/account/password { currentPassword?, newPassword }`, session-authenticated:
- Load the current user. If they already have a `passwordHash`, `currentPassword` is required
  and must `verifyPassword` (else 400, generic). If they have none (magic-link-only), it may be
  set directly (they are already authenticated by session).
- `validatePassword(newPassword)` → 400 on failure; else `hashPassword` and store; `resetState`.
- Account page gains a "Set / change password" form (current shown only when a password exists).

## Non-goals

- No password *reset by email* flow (a magic-link user who forgets a password can still log in
  via magic link, then change it on the account page). Can be added later.
- No IP/global rate limiting or new infra (Redis/KV) — the DB lockout is the beta measure.
- No password strength meter / breach-list check.
- No change to sessions, magic-link mechanics, referral/queue, or admin authorization.

## Security invariants

- `passwordHash` is **never** returned to any client or included in any serialized payload.
- Credential errors are **generic and identical** (no account enumeration); verification is
  **constant-time** (`timingSafeEqual`).
- Password login requires `emailVerified` (double opt-in preserved) and refuses soft-deleted
  accounts.
- Lockout state is server-side only; success resets it.
- Cookie flags unchanged (httpOnly, secure in prod, sameSite=lax).

## Testing

**Unit (Jest, no DB):**
- `password.ts`: hash→verify round-trip true; wrong password false; tampered/malformed encoded
  string false (no throw); `validatePassword` at boundaries (9 fails, 10 ok, 200 ok, 201 fails).
- `lockout.ts`: count increments; 8th failure sets `lockedUntil` and resets count; `isLocked`
  true/false around the boundary; `resetState` clears.

**E2E (Playwright):**
- Signup with a password → verify email → log out → **log in with password** → dashboard.
- Wrong password → generic error; repeated failures → **locked** message.
- Password login **blocked before email verification** (correct password, unverified → prompt).
- Existing magic-link user (no password) → **set password on account page** → log in with it.
- **Magic-link login still works** unchanged.

Full suite (lint, Jest, build, Playwright) stays green; any test pinned to changed login-page
copy is updated in lockstep.
