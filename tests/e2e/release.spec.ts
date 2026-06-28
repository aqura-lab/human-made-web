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
