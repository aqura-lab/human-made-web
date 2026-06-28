import { z } from "zod";

// Each consent box must be explicitly ticked (double opt-in) — the server never
// trusts the client to have enforced this.
const mustConsent = z.literal(true);

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  reason: z.string().trim().max(2000).optional(),
  consentGdpr: mustConsent,
  consentTerms: mustConsent,
  consentPrivacy: mustConsent,
  ref: z.string().trim().max(64).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const feedbackSchema = z.object({
  body: z.string().trim().min(1, "Feedback can't be empty").max(5000),
  tag: z.enum(["UX", "ETHICS", "BUGS"]),
});

export const requestLinkSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export const updateAccountSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  reason: z.string().trim().max(2000).optional(),
});
