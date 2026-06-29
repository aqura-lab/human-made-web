// Pure GDPR transforms. Soft-delete scrubs identifying fields and tombstones the
// (unique) email so the row can stay for the grace period before a cron purge.
// Feedback is anonymised separately (userId set null) so product insight survives
// erasure of identity. Magic links and community votes (personal data) are deleted
// explicitly in the transaction — FK cascade only fires on the hard purge cron.

export function tombstoneEmail(userId: string): string {
  return `deleted+${userId}@deleted.invalid`;
}

export type SoftDeleteUpdate = {
  deletedAt: Date;
  email: string;
  name: string;
  reason: null;
  consentIp: null;
  consentUA: null;
};

export function buildSoftDelete(userId: string, now: Date): SoftDeleteUpdate {
  return {
    deletedAt: now,
    email: tombstoneEmail(userId),
    name: "",
    reason: null,
    consentIp: null,
    consentUA: null,
  };
}

type ExportableUser = {
  id: string;
  name: string;
  email: string;
  reason: string | null;
  createdAt: Date;
  emailVerified: Date | null;
  referralCode: string;
  priorityBoost: number;
  consentGdpr: boolean;
  consentTerms: boolean;
  consentPrivacy: boolean;
  consentAt: Date | null;
};

type ExportableFeedback = { body: string; tag: string; createdAt: Date };

export function buildExport(user: ExportableUser, feedback: ExportableFeedback[]) {
  return {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      reason: user.reason,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
      referralCode: user.referralCode,
      priorityBoost: user.priorityBoost,
    },
    consent: {
      gdpr: user.consentGdpr,
      terms: user.consentTerms,
      privacy: user.consentPrivacy,
      at: user.consentAt,
    },
    feedback: feedback.map((f) => ({ body: f.body, tag: f.tag, createdAt: f.createdAt })),
    note: "Human Made never stores your draft text or keystrokes; those remain on your device.",
  };
}
