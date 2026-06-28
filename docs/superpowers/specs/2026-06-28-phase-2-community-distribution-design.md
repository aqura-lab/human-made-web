# Phase 2 — Community, Distribution & Onboarding polish

**Date:** 2026-06-28
**Repo:** `human-made-web`
**Status:** Approved design, pending implementation plan

## Context

Phase 1 shipped the Human Made early-access platform: editorial landing page,
GDPR double-opt-in signup, passwordless magic-link auth, dashboard (queue
position, private referral, certificate verifier, feedback, locked "coming
soon" download), GDPR export/delete, and a whitelist-gated admin portal.

Phase 2 builds the four items deliberately deferred during Phase 1 scoping:

1. **Community page** with upvotable ideas
2. **Asset / DMG upload** — replace the locked download placeholder with a real
   gated desktop-app release
3. **Loom embed** — explainer video on the dashboard
4. **Feedback upvoting**

## Strategic guardrails (non-negotiable)

These come from the PRD non-goals, the PABS strategy, and the saved
`gamification-conflicts-strategy` memory. They constrain the design:

- **Rank ideas, not people.** The community board ranks *ideas* by aggregate
  votes. It never shows the author of an idea, never shows who upvoted, and
  never shows any per-person vote tally, clout score, or public profile.
- **No public leaderboard of people, no "humanity points," no social-trust
  graph.** These were explicitly dropped in Phase 1 as contrary to the PRD
  non-goal *identity reputation network*.
- **Private feedback stays private.** Feedback is submitted with an
  admin-only expectation. Nothing becomes public automatically — an admin must
  curate it onto the public board, and can set a clean public title so private
  phrasing or PII is never exposed verbatim.
- **Verifier acceptance remains the load-bearing open question.** Phase 2 is
  growth/distribution polish; it does not claim to resolve the strategic
  blocker (whether editors/professors/clients accept the certificate claim).

## Data model (Prisma)

Extends `prisma/schema.prisma`. No raw draft text or keystroke data ever lives
in this database — that invariant is unchanged.

### `Feedback` — additions

| Field         | Type        | Purpose                                          |
|---------------|-------------|--------------------------------------------------|
| `public`      | `Boolean @default(false)` | True once an admin promotes the item to the community board |
| `publicTitle` | `String?`   | Clean, admin-authored label shown publicly instead of raw body |
| `promotedAt`  | `DateTime?` | When it was promoted                             |

Community board query: `public = true AND status != HIDDEN`, ordered by vote
count desc, then `promotedAt` desc.

### `FeedbackVote` — new

```
model FeedbackVote {
  id         String   @id @default(cuid())
  feedbackId String
  feedback   Feedback @relation(fields: [feedbackId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([feedbackId, userId]) // one vote per user per idea
  @@index([feedbackId])
}
```

- `@@unique([feedbackId, userId])` enforces one vote per user per idea at the DB
  level; the toggle endpoint is idempotent on top of it.
- `onDelete: Cascade` on the user relation — votes are personal data and vanish
  on account deletion (GDPR). Only aggregate counts survive, and those counts
  carry no identity.

### `User` — addition

| Field                | Type        | Purpose                                     |
|----------------------|-------------|---------------------------------------------|
| `downloadReleasedAt` | `DateTime?` | Set by an admin to unlock the desktop download for this specific user (per-user release gate, consistent with the existing queue/priority model) |

### `Release` — new

```
model Release {
  id        String   @id @default(cuid())
  version   String
  fileName  String
  blobUrl   String   // Vercel Blob URL of the uploaded DMG
  sizeBytes Int?
  sha256    String?  // integrity digest, surfaced to the user
  notes     String?  // release notes shown on the dashboard
  isCurrent Boolean  @default(true)
  createdAt DateTime @default(now())

  @@index([isCurrent])
}
```

Uploading a new build marks prior releases `isCurrent = false`. The dashboard
and download endpoint reference the single current release.

### `Setting` — new

```
model Setting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}
```

Generic admin-set key/value config. Phase 2 uses one key: `loom_dashboard_url`.

## Feature architecture

### Feedback upvoting

- `POST /api/community/ideas/[id]/vote` — create a vote for the current user;
  idempotent (no-op if it already exists).
- `DELETE /api/community/ideas/[id]/vote` — remove the current user's vote.
- Voting is allowed only on `public = true` feedback. Vote counts computed via
  Prisma aggregate; the GET ideas endpoint annotates each idea with
  `voteCount` and `votedByMe` (boolean for the current user) — `votedByMe`
  drives the UI toggle state and is never exposed for any *other* user.

### Community page

- Route: `app/community/page.tsx`, authed (beta users only), behind the same
  session gate as the dashboard via `proxy.ts`.
- Renders the Ideas board: each card shows `publicTitle` (fallback to a
  truncated body only if no title), tag, aggregate vote count, and an upvote
  toggle. No author, no voter identities.
- Short "how this works" note: votes help prioritize what we build; ideas are
  curated from feedback; this is not a public ranking of people.

### Admin promotion

- `POST /api/admin/feedback/[id]/promote` — set `public`, `publicTitle`,
  `promotedAt`; supports un-promoting (`public = false`).
- The existing `FeedbackModeration` admin UI gains a "Promote to community"
  action with an editable public title field.

### Asset / DMG upload + gated download

- **Upload:** Vercel Blob **client upload** (`@vercel/blob/client`), because a
  DMG exceeds the serverless request body limit. An admin-gated token route
  (`handleUpload`) authorizes the upload; on completion the admin form submits
  metadata to `POST /api/admin/release`, which creates the `Release` row and
  flips prior releases to `isCurrent = false`.
- **Download:** `GET /api/download` — authed. If the user has
  `downloadReleasedAt != null` and a current release exists, respond `302` to
  `blobUrl`; otherwise respond locked (403 / locked state). Gating is enforced
  server-side at the redirect. Blob URLs are unguessable but public-if-known —
  acceptable for a beta DMG; noted as redirect-gating rather than signed-URL
  gating, to revisit if stronger gating is needed later.
- **Per-user release:** `POST /api/admin/users/[id]/release-download` toggles
  `downloadReleasedAt`. Admin user table gains the toggle.
- **Dashboard:** `DownloadLocked` is replaced by `DownloadCard`, which reads
  download state and renders either the locked placeholder (unchanged copy) or
  a live download with version, notes, and sha256.

### Loom embed

- `Setting` key `loom_dashboard_url`, set via `POST /api/admin/settings`.
- Dashboard renders the Loom embed when the value is present; renders nothing
  when empty. No analytics/tracking added.

## API surface (new)

| Method | Path                                      | Auth   | Purpose                          |
|--------|-------------------------------------------|--------|----------------------------------|
| GET    | `/api/community/ideas`                    | user   | List public ideas + counts + votedByMe |
| POST   | `/api/community/ideas/[id]/vote`          | user   | Add vote (idempotent)            |
| DELETE | `/api/community/ideas/[id]/vote`          | user   | Remove vote                      |
| POST   | `/api/admin/feedback/[id]/promote`        | admin  | Promote / un-promote to board    |
| GET    | `/api/admin/release`                      | admin  | Current release                  |
| POST   | `/api/admin/release`                      | admin  | Create current release (post-upload) |
| POST   | `/api/admin/release/upload`               | admin  | Vercel Blob client-upload token route |
| POST   | `/api/admin/users/[id]/release-download`  | admin  | Toggle per-user download release |
| GET    | `/api/download`                           | user   | Gated 302 to current release blob |
| POST   | `/api/admin/settings`                     | admin  | Set a setting (Loom URL)         |

All admin routes re-check the whitelist server-side (matching the existing
admin guard); they never trust the client.

## Privacy & GDPR

- `FeedbackVote` cascade-deletes with the user; aggregate counts remain but
  carry no identity.
- The community board exposes no author or voter identity and no per-person
  tally — structurally incapable of becoming a people-ranking.
- Admin-set `publicTitle` ensures private feedback text/PII is never published
  verbatim.
- Vercel Blob stores only the uploaded DMG, never user content.
- Download gating is enforced server-side.

## Testing

Matches the existing split: Jest for domain logic / components, Playwright for
end-to-end flows. (Note: the existing suite uses Playwright rather than Jest for
flows that touch Prisma's WASM query engine.)

### Unit / component
- Vote toggle: one vote per user, idempotent add, clean remove, count accuracy.
- Promotion visibility: only `public && status != HIDDEN` appears; author is
  never present in the serialized idea payload.
- Download gating: locked when `downloadReleasedAt` null, locked when no current
  release, live when both present.
- Settings get/set round-trip; dashboard hides Loom when unset.

### End-to-end (Playwright)
- Admin promotes a feedback item → it appears on `/community` anonymously →
  a user upvotes then un-upvotes → count increments then decrements.
- Admin uploads a release and releases user A → user A's dashboard shows the
  live download; user B (not released) still sees the locked placeholder.
- Admin sets the Loom URL → the embed renders on the dashboard.

## New dependency

- `@vercel/blob`

## Out of scope (Phase 2)

- Public ranking of people, profiles, humanity points, social-trust graph.
- Signed-URL / fully private download gating (redirect-gating is sufficient for
  beta).
- Resolving verifier acceptance (separate strategic workstream).
- Vercel deployment (intentionally sequenced after Phase 2).
