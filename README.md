# Human Made — Early-Access Platform

The public beta launch surface for **Human Made**, a privacy-preserving authorship
certificate for writers. This web app runs the early-access programme: a landing
page, passwordless sign-in, a user dashboard (queue position, private referrals,
and a **certificate verifier**), GDPR self-service, and a minimal admin portal.

> Human Made certifies **how a piece was written** (the observed writing process).
> It is **not** an AI detector and does not claim to prove the absence of AI
> assistance. The companion desktop capture app + offline verifier live in the
> sibling `human-made` repo.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Prisma 7** + PostgreSQL (Neon / Vercel Postgres in prod; a local PGlite dev DB via `prisma dev`)
- Passwordless **magic-link** auth — JWT (`jose`) in an httpOnly cookie
- Email via **Resend** (falls back to console + a dev outbox when unset)
- **Jest + React Testing Library** (unit/component) and **Playwright** (E2E)
- Deploys on **Vercel**

The certificate verifier reuses the desktop project's offline verifier
(`lib/verify/verify.ts`, vendored) — Ed25519 signature + registration hash-chain
+ text-hash binding, all checked in a stateless Node API route that persists and
logs nothing.

## Architecture notes

Business rules live in **pure functions** (queue ranking, referral progress +
guards, token/session helpers, GDPR transforms, consent validation) under `lib/`,
unit-tested without a database. Prisma is a thin persistence layer; DB-backed
flows are covered by Playwright E2E against a real server.

- `app/` — routes & pages (landing, login, dashboard, account, admin, `api/*`)
- `lib/` — domain logic, auth, verifier, db singleton, generated Prisma client
- `proxy.ts` — edge auth gate for `/dashboard`, `/account`, `/admin`
- `prisma/` — schema + migrations
- `tests/` — `unit/`, `component/`, `e2e/`, `fixtures/`

## Local development

```bash
npm install

# 1. Start the local Postgres (Prisma 7 ships a PGlite-backed dev server).
#    Copy the printed DATABASE_URL into .env (see .env.example).
npx prisma dev

# 2. Sync the schema to the local DB (the PGlite dev DB supports db push).
npm run db:push

# 3. Run the app.
npm run dev
```

No `RESEND_API_KEY`? Magic links are printed to the server console and exposed
in dev at `GET /api/dev/last-link?email=…` (disabled in production).

## Tests

```bash
npm test          # Jest unit + component
npm run test:e2e  # Playwright end-to-end (starts the dev server)
```

## Environment

See `.env.example`. Required in production: `DATABASE_URL`, `DIRECT_URL`,
`JWT_SECRET`, `APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAILS`,
`CRON_SECRET` (plus optional `REFERRAL_GOAL`, `REFERRAL_BOOST_PER_CONVERSION`).

## Deploy (Vercel)

- Provision a Postgres (Neon / Vercel Postgres); set `DATABASE_URL` (pooled) and
  `DIRECT_URL` (direct).
- Set all env vars in the Vercel project (Production + Preview).
- The `vercel-build` script runs `prisma generate && prisma migrate deploy &&
  next build`, so migrations apply on deploy.
- A daily cron (`vercel.json`) calls `/api/cron/purge` to hard-delete
  soft-deleted accounts after a 30-day grace period (auth via `CRON_SECRET`).
