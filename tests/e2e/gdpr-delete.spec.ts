import { test, expect } from "@playwright/test";
import { signUpAndVerify, uniqueEmail } from "./helpers";

test("a user can export their data and delete their account", async ({ page }) => {
  const email = uniqueEmail("gdpr");
  await signUpAndVerify(page, email);

  await page.goto("/account");

  // Export returns a JSON download of the user's own data.
  const res = await page.request.get("/api/account/export");
  expect(res.status(), await res.text()).toBe(200);
  const body = await res.json();
  expect(body.profile.email).toBe(email);

  // Delete clears the session and blocks protected routes afterwards.
  await page.getByLabel(/confirm delete/i).fill("DELETE");
  await page.getByRole("button", { name: /delete my account/i }).click();
  await expect(page).toHaveURL(/\/$|\/login/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
