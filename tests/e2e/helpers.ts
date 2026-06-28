import { type Page, expect } from "@playwright/test";

let counter = 0;

/** A unique email per call so parallel/repeat runs don't collide. */
export function uniqueEmail(prefix = "e2e"): string {
  counter += 1;
  return `${prefix}+${Date.now()}_${counter}@example.test`;
}

/** Complete the signup form on the landing page (optionally via a referral link). */
export async function signUp(
  page: Page,
  email: string,
  opts: { name?: string; ref?: string } = {},
) {
  await page.goto(opts.ref ? `/?ref=${opts.ref}` : "/");
  await page.getByLabel("Name").fill(opts.name ?? "E2E Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/data processing/i).check();
  await page.getByLabel(/terms/i).check();
  await page.getByLabel(/privacy/i).check();
  await page.getByRole("button", { name: /request early access/i }).click();
  await expect(page.getByText(/check your inbox/i)).toBeVisible();
}

/** Fetch the dev magic link for an email and follow it to establish a session. */
export async function verifyEmail(page: Page, email: string) {
  const res = await page.request.get(`/api/dev/last-link?email=${encodeURIComponent(email)}`);
  const { url } = await res.json();
  expect(url, "expected a dev magic link").toBeTruthy();
  await page.goto(url);
}

/** Sign up and verify in one step, landing on the dashboard. */
export async function signUpAndVerify(
  page: Page,
  email: string,
  opts: { name?: string; ref?: string } = {},
) {
  await signUp(page, email, opts);
  await verifyEmail(page, email);
  await expect(page).toHaveURL(/\/dashboard/);
}
