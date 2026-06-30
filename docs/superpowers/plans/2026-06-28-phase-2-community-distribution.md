# Phase 2 — Community, Distribution & Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the four deferred Phase 2 features — community idea board with upvoting, gated desktop-app (DMG) distribution, dashboard Loom embed, and feedback upvoting — on the existing `human-made-web` Next.js platform.

**Architecture:** Follow the established split: pure domain logic lives in `lib/` and is unit-tested with Jest; Prisma-touching data layers, API routes, and UI flows are covered by Playwright E2E (Prisma 7's WASM engine can't run under Jest). Admin routes re-check the allowlist server-side. The community board is structurally identity-free (no author/voter fields) to enforce "rank ideas, not people."

**Tech Stack:** Next.js 16 (App Router), TypeScript, Prisma 7 (`prisma-client` engine + `@prisma/adapter-pg`), Postgres, Zod, Jest, Playwright, `@vercel/blob` (new).

## Global Constraints

- **Rank ideas, not people.** The community board exposes idea text + tag + aggregate vote count ONLY. Never an author, never a voter identity, never a per-person vote tally. No public profiles, no leaderboard of people. (PRD non-goal: identity reputation network.)
- **Private feedback stays private.** Nothing is public until an admin promotes it; admin sets a clean `publicTitle` so raw private phrasing/PII is never published verbatim.
- **No raw draft text or keystrokes in the DB — ever.** Unchanged invariant.
- **Admin mutations re-check `isAdmin(user)` server-side** via `getCurrentUser()` — the cookie claim alone is never trusted.
- **API route handlers start with** `export const runtime = "nodejs";`.
- **Imports use the `@/` alias** (e.g. `@/lib/db`).
- **Soft-delete is a scrub, not a row delete** — related personal rows (incl. votes) must be removed explicitly inside the delete transaction; FK cascade only fires on the hard purge cron.
- **Down-the-line copy:** desktop app is "Human Made for Mac"; never use AI-detector / "prove you're human" framing.

---

### Task 1: Schema, migration & dependency foundation

**Files:**
- Modify: `package.json` (add `@vercel/blob`)
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/0002_phase2/migration.sql`
- Modify: `proxy.ts:8-10` (matcher — add `/community`)
- Modify: `.env.example` (add `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_*` not needed)

**Interfaces:**
- Produces: Prisma models `FeedbackVote`, `Release`, `Setting`; `Feedback.public/publicTitle/promotedAt`; `User.downloadReleasedAt`. Generated client types under `@/lib/generated/prisma/client`.

- [ ] **Step 1: Install dependency**

Run: `npm install @vercel/blob`
Expected: `@vercel/blob` appears in `package.json` dependencies; lockfile updates.

- [ ] **Step 2: Edit `prisma/schema.prisma`**

Add to the `Feedback` model (after `status`):

```prisma
  public      Boolean   @default(false) // admin-promoted to the community board
  publicTitle String? // clean public label set by admin on promotion
  promotedAt  DateTime?
  votes       FeedbackVote[]
```

Add to the `User` model (after `perkFreeYearGranted`):

```prisma
  downloadReleasedAt DateTime? // admin unlocks the desktop download for this user
```

And add `votes FeedbackVote[]` to the `User` model's relations block (near `feedback Feedback[]`).

Append new models:

```prisma
model FeedbackVote {
  id         String   @id @default(cuid())
  feedbackId String
  feedback   Feedback @relation(fields: [feedbackId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([feedbackId, userId])
  @@index([feedbackId])
}

model Release {
  id        String   @id @default(cuid())
  version   String
  fileName  String
  blobUrl   String
  sizeBytes Int?
  sha256    String?
  notes     String?
  isCurrent Boolean  @default(true)
  createdAt DateTime @default(now())

  @@index([isCurrent])
}

model Setting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

Also add an index on `Feedback` for the board query — add to the `Feedback` model's index block:

```prisma
  @@index([public])
```

- [ ] **Step 3: Write the migration SQL**

Create `prisma/migrations/0002_phase2/migration.sql`:

```sql
-- Feedback: community promotion fields
ALTER TABLE "Feedback" ADD COLUMN "public" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Feedback" ADD COLUMN "publicTitle" TEXT;
ALTER TABLE "Feedback" ADD COLUMN "promotedAt" TIMESTAMP(3);
CREATE INDEX "Feedback_public_idx" ON "Feedback"("public");

-- User: per-user download release gate
ALTER TABLE "User" ADD COLUMN "downloadReleasedAt" TIMESTAMP(3);

-- FeedbackVote
CREATE TABLE "FeedbackVote" (
  "id" TEXT NOT NULL,
  "feedbackId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeedbackVote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FeedbackVote_feedbackId_userId_key" ON "FeedbackVote"("feedbackId", "userId");
CREATE INDEX "FeedbackVote_feedbackId_idx" ON "FeedbackVote"("feedbackId");
ALTER TABLE "FeedbackVote" ADD CONSTRAINT "FeedbackVote_feedbackId_fkey"
  FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedbackVote" ADD CONSTRAINT "FeedbackVote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Release
CREATE TABLE "Release" (
  "id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "blobUrl" TEXT NOT NULL,
  "sizeBytes" INTEGER,
  "sha256" TEXT,
  "notes" TEXT,
  "isCurrent" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Release_isCurrent_idx" ON "Release"("isCurrent");

-- Setting
CREATE TABLE "Setting" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);
```

- [ ] **Step 4: Add `/community` to the middleware matcher**

In `proxy.ts`, change the `config.matcher` array to:

```ts
export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*", "/admin/:path*", "/community/:path*"],
};
```

- [ ] **Step 5: Add env key**

Append to `.env.example` under a new section:

```
# ─── Vercel Blob (desktop app DMG storage) ───────────────────────────────────
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxx"
```

- [ ] **Step 6: Apply migration + regenerate client**

Run: `npx prisma migrate deploy && npm run db:generate`
Expected: migration `0002_phase2` applies; Prisma Client regenerates with no errors.

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (no type errors from the new models).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json prisma/schema.prisma prisma/migrations/0002_phase2 proxy.ts .env.example
git commit -m "feat(phase2): add schema for votes, releases, settings + blob dep"
```

---

### Task 2: Community idea serializer (pure logic)

**Files:**
- Create: `lib/community/ideas.ts`
- Test: `tests/unit/community-ideas.test.ts`

**Interfaces:**
- Produces:
  - `type PublicIdea = { id: string; title: string; tag: string; voteCount: number; votedByMe: boolean }`
  - `type IdeaInput = { id: string; body: string; publicTitle: string | null; tag: string; public: boolean; status: string }`
  - `isVotableIdea(f: { public: boolean; status: string }): boolean`
  - `toPublicIdea(f: IdeaInput, voteCount: number, votedByMe: boolean): PublicIdea`
  - `byVoteCountDesc(a: PublicIdea, b: PublicIdea): number`

- [ ] **Step 1: Write the failing test**

```ts
import { isVotableIdea, toPublicIdea, byVoteCountDesc } from "@/lib/community/ideas";

const base = { id: "f1", body: "raw private text", publicTitle: "Add dark mode", tag: "UX", public: true, status: "NEW" };

describe("isVotableIdea", () => {
  it("true only when public and not hidden", () => {
    expect(isVotableIdea({ public: true, status: "NEW" })).toBe(true);
    expect(isVotableIdea({ public: true, status: "REVIEWED" })).toBe(true);
    expect(isVotableIdea({ public: false, status: "NEW" })).toBe(false);
    expect(isVotableIdea({ public: true, status: "HIDDEN" })).toBe(false);
  });
});

describe("toPublicIdea", () => {
  it("uses publicTitle and never leaks author/body identity", () => {
    const idea = toPublicIdea(base, 3, true);
    expect(idea).toEqual({ id: "f1", title: "Add dark mode", tag: "UX", voteCount: 3, votedByMe: true });
    // structural guarantee: no author/body/userId keys
    expect(Object.keys(idea).sort()).toEqual(["id", "tag", "title", "voteCount", "votedByMe"]);
  });

  it("falls back to a trimmed body snippet when no publicTitle", () => {
    const longBody = "x".repeat(200);
    const idea = toPublicIdea({ ...base, publicTitle: null, body: longBody }, 0, false);
    expect(idea.title.length).toBeLessThanOrEqual(80);
  });
});

describe("byVoteCountDesc", () => {
  it("orders higher vote counts first", () => {
    const a = toPublicIdea(base, 1, false);
    const b = toPublicIdea({ ...base, id: "f2" }, 5, false);
    expect([a, b].sort(byVoteCountDesc).map((i) => i.id)).toEqual(["f2", "f1"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- community-ideas`
Expected: FAIL — module `@/lib/community/ideas` not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/community/ideas.ts
export type PublicIdea = {
  id: string;
  title: string;
  tag: string;
  voteCount: number;
  votedByMe: boolean;
};

export type IdeaInput = {
  id: string;
  body: string;
  publicTitle: string | null;
  tag: string;
  public: boolean;
  status: string;
};

const MAX_FALLBACK_TITLE = 80;

export function isVotableIdea(f: { public: boolean; status: string }): boolean {
  return f.public && f.status !== "HIDDEN";
}

export function toPublicIdea(f: IdeaInput, voteCount: number, votedByMe: boolean): PublicIdea {
  const title =
    f.publicTitle && f.publicTitle.trim().length > 0
      ? f.publicTitle.trim()
      : f.body.trim().slice(0, MAX_FALLBACK_TITLE);
  return { id: f.id, title, tag: f.tag, voteCount, votedByMe };
}

export function byVoteCountDesc(a: PublicIdea, b: PublicIdea): number {
  return b.voteCount - a.voteCount;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- community-ideas`
Expected: PASS (all 4 tests green).

- [ ] **Step 5: Commit**

```bash
git add lib/community/ideas.ts tests/unit/community-ideas.test.ts
git commit -m "feat(phase2): identity-free community idea serializer"
```

---

### Task 3: Admin promote route + moderation UI

**Files:**
- Create: `app/api/admin/feedback/promote/route.ts`
- Modify: `components/admin/FeedbackModeration.tsx`
- Modify: `lib/admin.ts:getAdminFeedback` (select the new fields)

**Interfaces:**
- Consumes: `getCurrentUser`, `isAdmin` from `@/lib/auth/guards`; `prisma` from `@/lib/db`.
- Produces: `POST /api/admin/feedback/promote` accepting `{ id: string; public: boolean; publicTitle?: string }`.

- [ ] **Step 1: Write the promote route**

```ts
// app/api/admin/feedback/promote/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth/guards";

export const runtime = "nodejs";

const Body = z.object({
  id: z.string().min(1),
  public: z.boolean(),
  publicTitle: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = Body.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid promotion request" }, { status: 400 });
  }
  const { id, public: isPublic, publicTitle } = parsed.data;
  await prisma.feedback.update({
    where: { id },
    data: {
      public: isPublic,
      publicTitle: publicTitle ?? null,
      promotedAt: isPublic ? new Date() : null,
    },
  });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Extend `getAdminFeedback` select**

In `lib/admin.ts`, update the `getAdminFeedback` select to include the new fields:

```ts
export async function getAdminFeedback() {
  return prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, body: true, tag: true, status: true, anonymized: true, createdAt: true,
      public: true, publicTitle: true,
    },
  });
}
```

- [ ] **Step 3: Add promote controls to `FeedbackModeration.tsx`**

Extend the `Item` type with `public: boolean; publicTitle: string | null;`, add a title input + "Promote"/"Unpromote" button per row:

```tsx
// add to Item type: public: boolean; publicTitle: string | null;
async function promote(id: string, isPublic: boolean, publicTitle: string) {
  setRows((rs) => rs.map((r) => (r.id === id ? { ...r, public: isPublic, publicTitle } : r)));
  await fetch("/api/admin/feedback/promote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, public: isPublic, publicTitle }),
  });
}
```

Render, inside each row, below the status select:

```tsx
<div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
  <input
    aria-label={`public title for ${r.id}`}
    placeholder="Public idea title"
    defaultValue={r.publicTitle ?? ""}
    onBlur={(e) => { r.publicTitle = e.target.value; }}
    style={{ flex: 1, padding: "6px 8px", border: "1px solid var(--rule)", borderRadius: 3 }}
  />
  <button
    className="btn"
    type="button"
    onClick={() => promote(r.id, !r.public, r.publicTitle ?? "")}
  >
    {r.public ? "Unpromote" : "Promote"}
  </button>
</div>
```

- [ ] **Step 4: Pass the new fields from the admin page**

In `app/admin/page.tsx`, the `items` mapping already spreads `f`; confirm `public` and `publicTitle` flow through (they now come from the extended select). No change needed beyond the existing `{ ...f, createdAt: f.createdAt.toISOString() }`.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/feedback/promote/route.ts components/admin/FeedbackModeration.tsx lib/admin.ts
git commit -m "feat(phase2): admin promote-to-community control"
```

> E2E coverage for promotion is added in Task 4 (it needs the public board to observe the effect).

---

### Task 4: Community board data layer, routes, page & E2E

**Files:**
- Create: `lib/community/board.ts`
- Create: `app/api/community/ideas/route.ts`
- Create: `app/api/community/ideas/[id]/vote/route.ts`
- Create: `app/community/page.tsx`
- Create: `components/community/IdeaBoard.tsx`
- Modify: `components/dashboard/AuthedHeader.tsx` (add Community nav link)
- Test: `tests/e2e/community.spec.ts`

**Interfaces:**
- Consumes: `toPublicIdea`, `byVoteCountDesc`, `PublicIdea` from `@/lib/community/ideas`; `prisma`; `getCurrentUser`.
- Produces:
  - `getPublicIdeas(userId: string): Promise<PublicIdea[]>`
  - `GET /api/community/ideas` → `{ ideas: PublicIdea[] }`
  - `POST /api/community/ideas/[id]/vote` (idempotent add), `DELETE` (remove)

- [ ] **Step 1: Write the board data layer**

```ts
// lib/community/board.ts
import { prisma } from "@/lib/db";
import { toPublicIdea, byVoteCountDesc, type PublicIdea } from "@/lib/community/ideas";

export async function getPublicIdeas(userId: string): Promise<PublicIdea[]> {
  const rows = await prisma.feedback.findMany({
    where: { public: true, status: { not: "HIDDEN" } },
    select: {
      id: true, body: true, publicTitle: true, tag: true, public: true, status: true,
      _count: { select: { votes: true } },
      votes: { where: { userId }, select: { id: true } },
    },
  });
  return rows
    .map((r) => toPublicIdea(r, r._count.votes, r.votes.length > 0))
    .sort(byVoteCountDesc);
}
```

- [ ] **Step 2: Write the ideas GET route**

```ts
// app/api/community/ideas/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getPublicIdeas } from "@/lib/community/board";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const ideas = await getPublicIdeas(user.id);
  return NextResponse.json({ ideas });
}
```

- [ ] **Step 3: Write the vote toggle route**

```ts
// app/api/community/ideas/[id]/vote/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/guards";
import { isVotableIdea } from "@/lib/community/ideas";

export const runtime = "nodejs";

async function assertVotable(id: string): Promise<boolean> {
  const f = await prisma.feedback.findUnique({ where: { id }, select: { public: true, status: true } });
  return !!f && isVotableIdea(f);
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  if (!(await assertVotable(id))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Idempotent: unique([feedbackId,userId]) makes a duplicate a no-op.
  await prisma.feedbackVote.upsert({
    where: { feedbackId_userId: { feedbackId: id, userId: user.id } },
    create: { feedbackId: id, userId: user.id },
    update: {},
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  await prisma.feedbackVote.deleteMany({ where: { feedbackId: id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Write the IdeaBoard client component**

```tsx
// components/community/IdeaBoard.tsx
"use client";

import { useState } from "react";
import type { PublicIdea } from "@/lib/community/ideas";

export function IdeaBoard({ initial }: { initial: PublicIdea[] }) {
  const [ideas, setIdeas] = useState(initial);

  async function toggle(idea: PublicIdea) {
    const next = !idea.votedByMe;
    setIdeas((xs) =>
      xs.map((i) =>
        i.id === idea.id ? { ...i, votedByMe: next, voteCount: i.voteCount + (next ? 1 : -1) } : i,
      ),
    );
    await fetch(`/api/community/ideas/${idea.id}/vote`, { method: next ? "POST" : "DELETE" });
  }

  if (ideas.length === 0) return <p className="muted small">No community ideas yet — check back soon.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {ideas.map((i) => (
        <div key={i.id} className="panel" style={{ display: "flex", gap: 14, alignItems: "center", padding: 14 }}>
          <button
            type="button"
            className="btn"
            aria-pressed={i.votedByMe}
            aria-label={`upvote ${i.title}`}
            onClick={() => toggle(i)}
          >
            ▲ {i.voteCount}
          </button>
          <div>
            <p style={{ margin: 0 }}>{i.title}</p>
            <span className="badge">{i.tag}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Write the community page**

```tsx
// app/community/page.tsx
import { requireUser, isAdmin } from "@/lib/auth/guards";
import { getPublicIdeas } from "@/lib/community/board";
import { AuthedHeader } from "@/components/dashboard/AuthedHeader";
import { SiteFooter } from "@/components/Chrome";
import { IdeaBoard } from "@/components/community/IdeaBoard";

export const metadata = { title: "Community — Human Made" };

export default async function CommunityPage() {
  const user = await requireUser();
  const ideas = await getPublicIdeas(user.id);
  return (
    <>
      <AuthedHeader isAdmin={isAdmin(user)} />
      <main className="wrap" style={{ paddingTop: 40 }}>
        <p className="kicker">Community</p>
        <h1 style={{ marginBottom: 6 }}>Help shape what we build</h1>
        <p className="muted small" style={{ marginBottom: 18 }}>
          Upvote the ideas you want most. Votes help us prioritise — this is a ranking of ideas, not people.
        </p>
        <IdeaBoard initial={ideas} />
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 6: Add the Community nav link**

In `components/dashboard/AuthedHeader.tsx`, add a link to `/community` in the nav (match the existing link markup/classes used for dashboard/account links).

- [ ] **Step 7: Write the E2E spec**

```ts
// tests/e2e/community.spec.ts
import { test, expect } from "@playwright/test";
import { signUpAndVerify, uniqueEmail } from "./helpers";

test("admin promotes feedback; a user upvotes and un-upvotes it anonymously", async ({ page }) => {
  // A normal user submits feedback.
  await signUpAndVerify(page, uniqueEmail("fb"));
  await page.goto("/dashboard");
  await page.getByLabel("Your feedback").fill("Please add a Windows build");
  await page.getByRole("button", { name: /send feedback/i }).click();
  await expect(page.getByText(/we read every note/i)).toBeVisible();

  // Admin promotes it with a clean public title.
  await signUpAndVerify(page, "alberto@aqurastudio.com", { name: "Alberto" });
  await page.goto("/admin");
  const lastTitleInput = page.getByLabel(/public title for/i).first();
  await lastTitleInput.fill("Windows build");
  await page.getByRole("button", { name: /^Promote$/ }).first().click();

  // Back as a user, the idea shows on /community with no author, and voting toggles.
  await page.goto("/community");
  const upvote = page.getByRole("button", { name: /upvote Windows build/i });
  await expect(upvote).toBeVisible();
  await expect(page.getByText("Please add a Windows build")).toHaveCount(0); // raw body never shown
  await upvote.click();
  await expect(upvote).toContainText("1");
  await upvote.click();
  await expect(upvote).toContainText("0");
});
```

- [ ] **Step 8: Run the E2E spec**

Run: `npm run test:e2e -- community`
Expected: PASS. (Requires local Prisma dev DB running and `ADMIN_EMAILS` including `alberto@aqurastudio.com`.)

- [ ] **Step 9: Commit**

```bash
git add lib/community/board.ts app/api/community app/community components/community/IdeaBoard.tsx components/dashboard/AuthedHeader.tsx tests/e2e/community.spec.ts
git commit -m "feat(phase2): community idea board with upvoting"
```

---

### Task 5: Download gating decision (pure logic)

**Files:**
- Create: `lib/release/gating.ts`
- Test: `tests/unit/release-gating.test.ts`

**Interfaces:**
- Produces:
  - `type DownloadState = { available: boolean; version: string | null; notes: string | null; sha256: string | null; url: string | null }`
  - `decideDownload(input: { downloadReleasedAt: Date | null; release: { version: string; notes: string | null; sha256: string | null; blobUrl: string } | null }): DownloadState`

- [ ] **Step 1: Write the failing test**

```ts
import { decideDownload } from "@/lib/release/gating";

const rel = { version: "0.1.0", notes: "first build", sha256: "abc", blobUrl: "https://blob/x.dmg" };

describe("decideDownload", () => {
  it("locked when the user is not released", () => {
    expect(decideDownload({ downloadReleasedAt: null, release: rel }).available).toBe(false);
  });
  it("locked when there is no current release", () => {
    expect(decideDownload({ downloadReleasedAt: new Date(), release: null }).available).toBe(false);
  });
  it("available with metadata when released and a release exists", () => {
    const s = decideDownload({ downloadReleasedAt: new Date(), release: rel });
    expect(s).toEqual({ available: true, version: "0.1.0", notes: "first build", sha256: "abc", url: "https://blob/x.dmg" });
  });
  it("never exposes a url when locked", () => {
    expect(decideDownload({ downloadReleasedAt: null, release: rel }).url).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- release-gating`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/release/gating.ts
export type DownloadState = {
  available: boolean;
  version: string | null;
  notes: string | null;
  sha256: string | null;
  url: string | null;
};

export function decideDownload(input: {
  downloadReleasedAt: Date | null;
  release: { version: string; notes: string | null; sha256: string | null; blobUrl: string } | null;
}): DownloadState {
  const locked: DownloadState = { available: false, version: null, notes: null, sha256: null, url: null };
  if (!input.downloadReleasedAt || !input.release) return locked;
  const r = input.release;
  return { available: true, version: r.version, notes: r.notes, sha256: r.sha256, url: r.blobUrl };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- release-gating`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/release/gating.ts tests/unit/release-gating.test.ts
git commit -m "feat(phase2): pure download-gating decision"
```

---

### Task 6: Release store, admin release routes, download route, UI & E2E

**Files:**
- Create: `lib/release/store.ts`
- Create: `app/api/admin/release/route.ts`
- Create: `app/api/admin/release/upload/route.ts`
- Create: `app/api/admin/users/release-download/route.ts`
- Create: `app/api/download/route.ts`
- Create: `components/admin/ReleaseManager.tsx`
- Create: `components/dashboard/DownloadCard.tsx`
- Modify: `app/dashboard/page.tsx` (swap `DownloadLocked` → `DownloadCard`)
- Modify: `app/admin/page.tsx` (add Release manager + per-user release toggle column)
- Modify: `lib/admin.ts` (`AdminUserRow` gains `downloadReleased: boolean`)
- Delete: `components/dashboard/DownloadLocked.tsx`
- Test: `tests/e2e/release.spec.ts`

**Interfaces:**
- Consumes: `decideDownload`, `DownloadState` from `@/lib/release/gating`; `prisma`; guards.
- Produces:
  - `getCurrentRelease()`, `createRelease(input)`, `getDownloadStateForUser(userId)`, `setUserDownloadReleased(userId, released)`
  - `POST /api/admin/release` `{ version, fileName, blobUrl, sizeBytes?, sha256?, notes? }`
  - `POST /api/admin/release/upload` (Blob client-upload token route)
  - `POST /api/admin/users/release-download` `{ id, released }`
  - `GET /api/download` → 302 or locked JSON

- [ ] **Step 1: Write the release store**

```ts
// lib/release/store.ts
import { prisma } from "@/lib/db";
import { decideDownload, type DownloadState } from "@/lib/release/gating";

export async function getCurrentRelease() {
  return prisma.release.findFirst({ where: { isCurrent: true }, orderBy: { createdAt: "desc" } });
}

export async function createRelease(input: {
  version: string; fileName: string; blobUrl: string;
  sizeBytes?: number | null; sha256?: string | null; notes?: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.release.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
    return tx.release.create({ data: { ...input, isCurrent: true } });
  });
}

export async function setUserDownloadReleased(userId: string, released: boolean) {
  await prisma.user.update({
    where: { id: userId },
    data: { downloadReleasedAt: released ? new Date() : null },
  });
}

export async function getDownloadStateForUser(userId: string): Promise<DownloadState> {
  const [user, release] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { downloadReleasedAt: true } }),
    getCurrentRelease(),
  ]);
  return decideDownload({ downloadReleasedAt: user.downloadReleasedAt, release });
}
```

- [ ] **Step 2: Write the admin release create route**

```ts
// app/api/admin/release/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, isAdmin } from "@/lib/auth/guards";
import { createRelease, getCurrentRelease } from "@/lib/release/store";

export const runtime = "nodejs";

const Body = z.object({
  version: z.string().trim().min(1).max(40),
  fileName: z.string().trim().min(1).max(200),
  blobUrl: z.string().url(),
  sizeBytes: z.number().int().positive().optional(),
  sha256: z.string().trim().max(128).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ release: await getCurrentRelease() });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const parsed = Body.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid release" }, { status: 400 });
  const release = await createRelease(parsed.data);
  return NextResponse.json({ ok: true, release });
}
```

- [ ] **Step 3: Write the Blob client-upload token route**

```ts
// app/api/admin/release/upload/route.ts
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth/guards";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["application/x-apple-diskimage", "application/octet-stream"],
        maximumSizeInBytes: 500 * 1024 * 1024,
      }),
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
```

- [ ] **Step 4: Write the per-user release toggle route**

```ts
// app/api/admin/users/release-download/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, isAdmin } from "@/lib/auth/guards";
import { setUserDownloadReleased } from "@/lib/release/store";

export const runtime = "nodejs";

const Body = z.object({ id: z.string().min(1), released: z.boolean() });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const parsed = Body.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  await setUserDownloadReleased(parsed.data.id, parsed.data.released);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Write the gated download route**

```ts
// app/api/download/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { getDownloadStateForUser } from "@/lib/release/store";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const state = await getDownloadStateForUser(user.id);
  if (!state.available || !state.url) {
    return NextResponse.json({ error: "Download not available yet" }, { status: 403 });
  }
  return NextResponse.redirect(state.url, 302);
}
```

- [ ] **Step 6: Write the DownloadCard component**

```tsx
// components/dashboard/DownloadCard.tsx
import type { DownloadState } from "@/lib/release/gating";

export function DownloadCard({ state }: { state: DownloadState }) {
  if (!state.available) {
    return (
      <div className="panel locked">
        <p className="kicker">Desktop app</p>
        <h3>Human Made for Mac</h3>
        <p className="muted small">
          The capture app is where you record the writing process behind a piece. We&apos;ll unlock your
          download here the moment your spot opens up.
        </p>
        <button className="btn" type="button" disabled aria-disabled="true">Coming soon</button>
      </div>
    );
  }
  return (
    <div className="panel">
      <p className="kicker">Desktop app</p>
      <h3>Human Made for Mac · v{state.version}</h3>
      {state.notes && <p className="muted small">{state.notes}</p>}
      <a className="btn" href="/api/download">Download for Mac</a>
      {state.sha256 && <p className="muted small mono" style={{ marginTop: 8 }}>SHA-256: {state.sha256}</p>}
    </div>
  );
}
```

- [ ] **Step 7: Swap the dashboard to use DownloadCard**

In `app/dashboard/page.tsx`: replace the `DownloadLocked` import with `DownloadCard`, fetch state, and render it.

```tsx
import { DownloadCard } from "@/components/dashboard/DownloadCard";
import { getDownloadStateForUser } from "@/lib/release/store";
// inside the component, after getDashboardData:
const download = await getDownloadStateForUser(user.id);
// replace <DownloadLocked /> with:
<DownloadCard state={download} />
```

Then delete `components/dashboard/DownloadLocked.tsx`.

- [ ] **Step 8: Write the ReleaseManager admin component**

```tsx
// components/admin/ReleaseManager.tsx
"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";

export function ReleaseManager({ current }: { current: { version: string; fileName: string } | null }) {
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fileInput = e.currentTarget.elements.namedItem("dmg") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file || !version) return;
    setBusy(true);
    setStatus("Uploading…");
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/release/upload",
      });
      const res = await fetch("/api/admin/release", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ version, fileName: file.name, blobUrl: blob.url, sizeBytes: file.size, notes }),
      });
      setStatus(res.ok ? `Published v${version}` : "Failed to save release");
    } catch (err) {
      setStatus(`Upload failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onUpload} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {current && <p className="muted small">Current: {current.fileName} (v{current.version})</p>}
      <input aria-label="version" placeholder="Version e.g. 0.1.0" value={version} onChange={(e) => setVersion(e.target.value)} />
      <textarea aria-label="release notes" placeholder="Release notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      <input aria-label="dmg file" name="dmg" type="file" accept=".dmg,application/x-apple-diskimage" />
      <button className="btn" type="submit" disabled={busy || !version}>{busy ? "Working…" : "Publish release"}</button>
      {status && <p className="muted small" role="status">{status}</p>}
    </form>
  );
}
```

- [ ] **Step 9: Add per-user release toggle + ReleaseManager to admin page**

In `lib/admin.ts`, add `downloadReleased: boolean` to `AdminUserRow` and set it from `u.downloadReleasedAt !== null` (add `downloadReleasedAt: true` is already loaded since `findMany` returns full rows; map `downloadReleased: u.downloadReleasedAt !== null`).

In `app/admin/page.tsx`: import and render `<ReleaseManager current={...} />` in a new panel (fetch current release via `getCurrentRelease()`), add a "Download" column to the users table with a client toggle button that calls `POST /api/admin/users/release-download`. Implement the toggle as a small client component `components/admin/ReleaseToggle.tsx`:

```tsx
// components/admin/ReleaseToggle.tsx
"use client";
import { useState } from "react";
export function ReleaseToggle({ id, released }: { id: string; released: boolean }) {
  const [on, setOn] = useState(released);
  async function flip() {
    const next = !on;
    setOn(next);
    await fetch("/api/admin/users/release-download", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, released: next }),
    });
  }
  return <button type="button" className="btn" aria-pressed={on} onClick={flip}>{on ? "Released" : "Release"}</button>;
}
```

- [ ] **Step 10: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 11: Write the E2E spec (hermetic — injects a synthetic blobUrl, no real Blob upload)**

```ts
// tests/e2e/release.spec.ts
import { test, expect } from "@playwright/test";
import { signUpAndVerify, uniqueEmail } from "./helpers";

test("gated download: released user gets it, unreleased stays locked", async ({ page, browser }) => {
  const userEmail = uniqueEmail("dl");
  await signUpAndVerify(page, userEmail);
  await expect(page.getByRole("button", { name: /coming soon/i })).toBeVisible(); // locked initially

  // Admin publishes a release (synthetic blobUrl — bypasses real Blob upload) and releases the user.
  const admin = await browser.newContext();
  const ap = await admin.newPage();
  await signUpAndVerify(ap, "alberto@aqurastudio.com", { name: "Alberto" });
  const relRes = await ap.request.post("/api/admin/release", {
    data: { version: "0.1.0", fileName: "HumanMade.dmg", blobUrl: "https://example.test/HumanMade.dmg", notes: "beta" },
  });
  expect(relRes.ok()).toBeTruthy();

  // Find the user's id from the admin users API path is internal; release via admin page toggle.
  await ap.goto("/admin");
  // Release the most recent signup (the dl user). Use the row containing their email.
  const row = ap.locator("tr", { hasText: userEmail });
  await row.getByRole("button", { name: /^Release$/ }).click();
  await expect(row.getByRole("button", { name: /Released/ })).toBeVisible();

  // Back as the user: the live download appears and points at /api/download.
  await page.reload();
  const link = page.getByRole("link", { name: /download for mac/i });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/api/download");

  // A different, unreleased user still sees the locked state.
  const other = await browser.newContext();
  const op = await other.newPage();
  await signUpAndVerify(op, uniqueEmail("dl2"));
  await expect(op.getByRole("button", { name: /coming soon/i })).toBeVisible();
});
```

> Note: the admin users table must render each user's email in its row (it does) so the locator can find it. The Blob client-upload path (`upload()` → `/api/admin/release/upload`) is exercised only in real use; it is **not** covered by automated E2E because it needs a live `BLOB_READ_WRITE_TOKEN`. Verify it manually once before launch.

- [ ] **Step 12: Run the E2E spec**

Run: `npm run test:e2e -- release`
Expected: PASS.

- [ ] **Step 13: Commit**

```bash
git add lib/release app/api/admin/release app/api/admin/users/release-download app/api/download components/admin/ReleaseManager.tsx components/admin/ReleaseToggle.tsx components/dashboard/DownloadCard.tsx app/dashboard/page.tsx app/admin/page.tsx lib/admin.ts tests/e2e/release.spec.ts
git rm components/dashboard/DownloadLocked.tsx
git commit -m "feat(phase2): gated desktop-app distribution via Vercel Blob"
```

---

### Task 7: Loom URL normalization (pure logic)

**Files:**
- Create: `lib/settings/loom.ts`
- Test: `tests/unit/loom.test.ts`

**Interfaces:**
- Produces:
  - `LOOM_SETTING_KEY = "loom_dashboard_url"`
  - `loomEmbedUrl(raw: string | null | undefined): string | null` — returns an embeddable Loom URL or null.

- [ ] **Step 1: Write the failing test**

```ts
import { loomEmbedUrl, LOOM_SETTING_KEY } from "@/lib/settings/loom";

describe("loomEmbedUrl", () => {
  it("converts a share URL to an embed URL", () => {
    expect(loomEmbedUrl("https://www.loom.com/share/abc123")).toBe("https://www.loom.com/embed/abc123");
  });
  it("passes through an already-embed URL", () => {
    expect(loomEmbedUrl("https://www.loom.com/embed/abc123")).toBe("https://www.loom.com/embed/abc123");
  });
  it("returns null for empty or non-loom input", () => {
    expect(loomEmbedUrl("")).toBeNull();
    expect(loomEmbedUrl(null)).toBeNull();
    expect(loomEmbedUrl("https://evil.test/share/x")).toBeNull();
  });
  it("exports the canonical setting key", () => {
    expect(LOOM_SETTING_KEY).toBe("loom_dashboard_url");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- loom`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// lib/settings/loom.ts
export const LOOM_SETTING_KEY = "loom_dashboard_url";

export function loomEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const m = raw.trim().match(/^https:\/\/www\.loom\.com\/(share|embed)\/([A-Za-z0-9]+)/);
  if (!m) return null;
  return `https://www.loom.com/embed/${m[2]}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- loom`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/settings/loom.ts tests/unit/loom.test.ts
git commit -m "feat(phase2): loom embed URL normalization"
```

---

### Task 8: Settings store, admin setting route, Loom embed on dashboard & E2E

**Files:**
- Create: `lib/settings/store.ts`
- Create: `app/api/admin/settings/route.ts`
- Create: `components/admin/LoomSetting.tsx`
- Create: `components/dashboard/LoomEmbed.tsx`
- Modify: `app/dashboard/page.tsx` (render LoomEmbed when set)
- Modify: `app/admin/page.tsx` (render LoomSetting)
- Test: `tests/e2e/loom.spec.ts`

**Interfaces:**
- Consumes: `loomEmbedUrl`, `LOOM_SETTING_KEY`; `prisma`; guards.
- Produces:
  - `getSetting(key: string): Promise<string | null>`, `setSetting(key: string, value: string): Promise<void>`
  - `POST /api/admin/settings` `{ key, value }`

- [ ] **Step 1: Write the settings store**

```ts
// lib/settings/store.ts
import { prisma } from "@/lib/db";

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
}
```

- [ ] **Step 2: Write the admin settings route**

```ts
// app/api/admin/settings/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, isAdmin } from "@/lib/auth/guards";
import { setSetting } from "@/lib/settings/store";

export const runtime = "nodejs";

const Body = z.object({ key: z.string().min(1).max(80), value: z.string().max(2000) });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const parsed = Body.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid setting" }, { status: 400 });
  await setSetting(parsed.data.key, parsed.data.value);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Write the LoomEmbed component**

```tsx
// components/dashboard/LoomEmbed.tsx
export function LoomEmbed({ embedUrl }: { embedUrl: string }) {
  return (
    <div className="panel span-2">
      <p className="kicker">Watch</p>
      <h3>How Human Made works</h3>
      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, marginTop: 12 }}>
        <iframe
          src={embedUrl}
          title="Human Made explainer"
          allowFullScreen
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Render LoomEmbed on the dashboard when set**

In `app/dashboard/page.tsx`:

```tsx
import { LoomEmbed } from "@/components/dashboard/LoomEmbed";
import { getSetting } from "@/lib/settings/store";
import { loomEmbedUrl, LOOM_SETTING_KEY } from "@/lib/settings/loom";
// inside component:
const loom = loomEmbedUrl(await getSetting(LOOM_SETTING_KEY));
// in the grid, before the verifier panel:
{loom && <LoomEmbed embedUrl={loom} />}
```

- [ ] **Step 5: Write the LoomSetting admin component**

```tsx
// components/admin/LoomSetting.tsx
"use client";
import { useState } from "react";
import { LOOM_SETTING_KEY } from "@/lib/settings/loom";

export function LoomSetting({ current }: { current: string | null }) {
  const [value, setValue] = useState(current ?? "");
  const [status, setStatus] = useState<string | null>(null);
  async function save() {
    const res = await fetch("/api/admin/settings", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: LOOM_SETTING_KEY, value }),
    });
    setStatus(res.ok ? "Saved" : "Failed");
  }
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input aria-label="loom url" placeholder="https://www.loom.com/share/…" value={value} onChange={(e) => setValue(e.target.value)} style={{ flex: 1 }} />
      <button className="btn" type="button" onClick={save}>Save</button>
      {status && <span className="muted small" role="status">{status}</span>}
    </div>
  );
}
```

- [ ] **Step 6: Render LoomSetting on the admin page**

In `app/admin/page.tsx`, add a panel:

```tsx
import { LoomSetting } from "@/components/admin/LoomSetting";
import { getSetting } from "@/lib/settings/store";
import { LOOM_SETTING_KEY } from "@/lib/settings/loom";
// fetch alongside the others:
const loom = await getSetting(LOOM_SETTING_KEY);
// render:
<div className="panel" style={{ marginTop: 16 }}>
  <h3>Dashboard explainer video</h3>
  <LoomSetting current={loom} />
</div>
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 8: Write the E2E spec**

```ts
// tests/e2e/loom.spec.ts
import { test, expect } from "@playwright/test";
import { signUpAndVerify, uniqueEmail } from "./helpers";

test("admin sets a Loom URL and it renders on the dashboard", async ({ page }) => {
  await signUpAndVerify(page, "alberto@aqurastudio.com", { name: "Alberto" });
  await page.goto("/admin");
  await page.getByLabel("loom url").fill("https://www.loom.com/share/deadbeefcafe");
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByText(/^Saved$/)).toBeVisible();

  await page.goto("/dashboard");
  const frame = page.locator('iframe[title="Human Made explainer"]');
  await expect(frame).toHaveAttribute("src", "https://www.loom.com/embed/deadbeefcafe");
});
```

- [ ] **Step 9: Run the E2E spec**

Run: `npm run test:e2e -- loom`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add lib/settings/store.ts app/api/admin/settings components/admin/LoomSetting.tsx components/dashboard/LoomEmbed.tsx app/dashboard/page.tsx app/admin/page.tsx tests/e2e/loom.spec.ts
git commit -m "feat(phase2): admin-set Loom explainer on the dashboard"
```

---

### Task 9: GDPR — purge votes on account deletion

**Files:**
- Modify: `app/api/account/delete/route.ts` (delete votes in the soft-delete transaction)
- Modify: `lib/account/gdpr.ts` (update the module comment to mention votes)
- Test: `tests/e2e/community.spec.ts` (extend with a vote-cascade case) OR new `tests/e2e/gdpr-votes.spec.ts`

**Interfaces:**
- Consumes: existing delete transaction.

- [ ] **Step 1: Add vote deletion to the soft-delete transaction**

In `app/api/account/delete/route.ts`, inside the `prisma.$transaction` callback, add before the user update:

```ts
    // Votes are personal data; soft-delete scrubs identity, so remove the user's
    // votes explicitly (FK cascade only fires on the hard purge cron).
    await tx.feedbackVote.deleteMany({ where: { userId: user.id } });
```

- [ ] **Step 2: Update the gdpr.ts module comment**

In `lib/account/gdpr.ts`, extend the top comment to note: feedback is anonymised, magic links and community votes are deleted.

- [ ] **Step 3: Write the failing E2E spec**

```ts
// tests/e2e/gdpr-votes.spec.ts
import { test, expect } from "@playwright/test";
import { signUpAndVerify, uniqueEmail } from "./helpers";

test("deleting an account removes that user's community votes", async ({ page, browser }) => {
  // Admin promotes a feedback item to have something votable.
  const fbUser = uniqueEmail("gv");
  await signUpAndVerify(page, fbUser);
  await page.goto("/dashboard");
  await page.getByLabel("Your feedback").fill("Add a CLI");
  await page.getByRole("button", { name: /send feedback/i }).click();
  await expect(page.getByText(/we read every note/i)).toBeVisible();

  const admin = await browser.newContext();
  const ap = await admin.newPage();
  await signUpAndVerify(ap, "alberto@aqurastudio.com", { name: "Alberto" });
  await ap.goto("/admin");
  await ap.getByLabel(/public title for/i).first().fill("CLI");
  await ap.getByRole("button", { name: /^Promote$/ }).first().click();

  // The fb user votes, then deletes their account.
  await page.goto("/community");
  const upvote = page.getByRole("button", { name: /upvote CLI/i });
  await upvote.click();
  await expect(upvote).toContainText("1");
  await page.goto("/account");
  // Trigger account deletion (match the existing gdpr-delete.spec.ts interaction).
  await page.getByRole("button", { name: /delete my account/i }).click();
  await page.getByRole("button", { name: /confirm/i }).click();

  // A fresh user sees the idea at 0 votes (the deleted user's vote is gone).
  const other = await browser.newContext();
  const op = await other.newPage();
  await signUpAndVerify(op, uniqueEmail("gv2"));
  await op.goto("/community");
  await expect(op.getByRole("button", { name: /upvote CLI/i })).toContainText("0");
});
```

> Before writing the deletion clicks, open `tests/e2e/gdpr-delete.spec.ts` and copy its exact selectors for the delete confirmation flow so the names match the real UI.

- [ ] **Step 4: Run the E2E spec**

Run: `npm run test:e2e -- gdpr-votes`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/account/delete/route.ts lib/account/gdpr.ts tests/e2e/gdpr-votes.spec.ts
git commit -m "feat(phase2): purge community votes on account deletion (GDPR)"
```

---

### Task 10: Full regression + build

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit/component suite**

Run: `npm test`
Expected: all suites pass, including the new `community-ideas`, `release-gating`, `loom` tests.

- [ ] **Step 2: Run the full E2E suite**

Run: `npm run test:e2e`
Expected: all specs pass (existing + `community`, `release`, `loom`, `gdpr-votes`). Requires the local Prisma dev DB running.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: `next build` succeeds; new routes (`/community`, `/api/community/*`, `/api/download`, `/api/admin/*`) appear in the route list.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 5: Commit any incidental fixes**

```bash
git add -A
git commit -m "chore(phase2): regression fixes from full-suite run" || echo "nothing to commit"
```

---

## Self-Review

**Spec coverage:**
- Community page → Task 4. Feedback upvoting → Tasks 2 (pure) + 4 (routes/UI). Admin curation/promotion → Task 3. Asset/DMG upload → Task 6 (Blob client-upload + release store). Per-user download gating → Tasks 5 (pure) + 6. Loom embed → Tasks 7 (pure) + 8. Privacy/GDPR (identity-free board, vote purge) → Tasks 2 + 9. Schema/Setting/Release models → Task 1. New dependency `@vercel/blob` → Task 1. Out-of-scope items remain unbuilt. ✓ All spec sections map to a task.
- "Rank ideas, not people" is enforced structurally in Task 2's serializer (test asserts the exact key set — no author/body) and in Task 4's board query (no author selected). ✓

**Placeholder scan:** No TBD/TODO/"add error handling"/"similar to Task N". Every code step shows full code. Two explicit manual-verification notes (Blob upload needs a live token; copy exact delete-flow selectors) are flagged, not left as silent gaps. ✓

**Type consistency:** `PublicIdea`/`IdeaInput` (Task 2) consumed unchanged in Task 4. `DownloadState`/`decideDownload` (Task 5) consumed in Task 6. `loomEmbedUrl`/`LOOM_SETTING_KEY` (Task 7) consumed in Task 8. `createRelease`/`getCurrentRelease`/`getDownloadStateForUser`/`setUserDownloadReleased` defined and used consistently in Task 6. Route bodies match their Zod schemas. ✓

**Known limitations (intentional, from the spec):** download gating is redirect-based, not signed-URL; the Blob client-upload path is manually verified rather than E2E-covered (no local Blob token). Both are documented.
