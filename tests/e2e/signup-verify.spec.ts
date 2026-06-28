import { test, expect } from "@playwright/test";
import { signUpAndVerify, uniqueEmail } from "./helpers";

test("a new user can sign up, confirm their email, and see a queue position", async ({ page }) => {
  await signUpAndVerify(page, uniqueEmail());
  await expect(page.getByText(/your place in line/i)).toBeVisible();
  await expect(page.getByText(/^#\d+/)).toBeVisible();
});

test("an expired or bogus magic link sends the user to login", async ({ page }) => {
  await page.goto("/api/auth/callback?token=not-a-real-token");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText(/expired or was already used/i)).toBeVisible();
});
