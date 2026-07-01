import { test, expect } from "@playwright/test";
import { signUpAndVerify, verifyEmail, uniqueEmail } from "./helpers";

/** Sign up filling the optional password field (does not verify the email). */
async function signUpWithPassword(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/");
  await page.getByLabel("Name").fill("Pw User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/data processing/i).check();
  await page.getByLabel(/terms/i).check();
  await page.getByLabel(/privacy/i).check();
  await page.getByLabel(/set a password/i).fill(password);
  await page.getByRole("button", { name: /request early access/i }).click();
  await expect(page.getByText(/check your inbox/i)).toBeVisible();
}

test("sign up with a password, verify email, then log in with the password", async ({ page }) => {
  const email = uniqueEmail("pw");
  const password = "correct horse battery staple";

  await signUpWithPassword(page, email, password);
  await verifyEmail(page, email); // magic link confirms email + establishes a session
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByRole("button", { name: /sign out/i }).click();

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("password login is blocked until the email is verified", async ({ page }) => {
  const email = uniqueEmail("unverified");
  const password = "an unverified password";

  await signUpWithPassword(page, email, password); // NOT verified

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^Log in$/ }).click();

  await expect(page.getByText(/confirm your email/i)).toBeVisible();
  await expect(page).not.toHaveURL(/\/dashboard/);
});

test("wrong password is rejected generically and locks out after repeated failures", async ({ page }) => {
  const email = uniqueEmail("lock");
  const password = "the genuine password";

  await signUpWithPassword(page, email, password);
  await verifyEmail(page, email);
  await page.getByRole("button", { name: /sign out/i }).click();

  await page.goto("/login");
  // 8 wrong attempts: each is a generic failure; the 8th sets the lock.
  for (let i = 0; i < 8; i++) {
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("definitely not it");
    await page.getByRole("button", { name: /^Log in$/ }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  }
  // Now locked — even the correct password is refused with the lockout message.
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await expect(page.getByText(/too many attempts/i)).toBeVisible();
  await expect(page).not.toHaveURL(/\/dashboard/);
});

test("a magic-link user can set a password on their account and then log in with it", async ({ page }) => {
  const email = uniqueEmail("setpw");
  const password = "freshly chosen password";

  await signUpAndVerify(page, email); // magic-link only, on the dashboard

  await page.goto("/account");
  await page.getByLabel(/^Password$/).fill(password); // "Set a password" (no current password required)
  await page.getByRole("button", { name: /^Set password$/ }).click();
  await expect(page.getByText(/password updated/i)).toBeVisible();

  await page.getByRole("button", { name: /sign out/i }).click();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /^Log in$/ }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});
