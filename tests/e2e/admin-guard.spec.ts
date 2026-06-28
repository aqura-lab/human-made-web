import { test, expect } from "@playwright/test";
import { signUpAndVerify, uniqueEmail } from "./helpers";

test("a non-admin user is redirected away from /admin", async ({ page }) => {
  await signUpAndVerify(page, uniqueEmail("nonadmin"));
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard/);
});

test("the allow-listed admin can reach the admin portal", async ({ page }) => {
  // alberto@aqurastudio.com is in ADMIN_EMAILS; signup is idempotent for repeats.
  await signUpAndVerify(page, "alberto@aqurastudio.com", { name: "Alberto" });
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByText(/early-access control/i)).toBeVisible();
  await expect(page.getByText(/feedback moderation/i)).toBeVisible();
});

test("an unauthenticated visitor is sent to login from a protected route", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
