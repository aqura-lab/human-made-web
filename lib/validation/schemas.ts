import { z } from "zod";

// Each consent box must be explicitly ticked (double opt-in) — the server never
// trusts the client to have enforced this.
const mustConsent = z.literal(true);

// Optional password at signup / on the account page. Length-based policy
// (NIST-style): 10..200 chars, no forced complexity. Kept in sync with
// validatePassword() in lib/auth/password.ts.
const passwordField = z.string().min(10, "Password must be at least 10 characters").max(200);

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  reason: z.string().trim().max(2000).optional(),
  consentGdpr: mustConsent,
  consentTerms: mustConsent,
  consentPrivacy: mustConsent,
  ref: z.string().trim().max(64).optional(),
  password: passwordField.optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export const setPasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200).optional(),
  newPassword: passwordField,
});

export const feedbackSchema = z.object({
  body: z.string().trim().min(1, "Feedback can't be empty").max(5000),
  tag: z.enum(["UX", "ETHICS", "BUGS"]),
});

export const requestLinkSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export const publishCertificateSchema = z.object({
  json: z.string().min(1).max(50_000),
  articleUrl: z.string().trim().url().max(2000).optional(),
});

export const unpublishCertificateSchema = z.object({
  id: z.string().trim().min(1).max(128),
});

export const updateAccountSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  reason: z.string().trim().max(2000).optional(),
});
