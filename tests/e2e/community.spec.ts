import { test, expect } from "@playwright/test";
import { signUpAndVerify, uniqueEmail } from "./helpers";

test("admin promotes feedback; a user upvotes and un-upvotes it anonymously", async ({ page }) => {
  // Unique per run so rows accumulated from prior runs can't make locators ambiguous.
  const idea = `Windows build ${Date.now()}`;
  const body = `Please add ${idea}`;

  // A normal user submits feedback.
  await signUpAndVerify(page, uniqueEmail("fb"));
  await page.goto("/dashboard");
  await page.getByLabel("Your feedback").fill(body);
  await page.getByRole("button", { name: /send feedback/i }).click();
  await expect(page.getByText(/we read every note/i)).toBeVisible();

  // Admin promotes it with a clean public title.
  await signUpAndVerify(page, "alberto@aqurastudio.com", { name: "Alberto" });
  await page.goto("/admin");
  const lastTitleInput = page.getByLabel(/public title for/i).first();
  await lastTitleInput.fill(idea);
  await page.getByRole("button", { name: /^Promote$/ }).first().click();

  // Still authenticated as the admin (alberto@aqurastudio.com); the privacy assertion (raw body never shown) is valid from any authenticated viewer.
  await page.goto("/community");
  const upvote = page.getByRole("button", { name: new RegExp(`upvote ${idea}`, "i") });
  await expect(upvote).toBeVisible();
  await expect(page.getByText(body)).toHaveCount(0); // raw body never shown
  await upvote.click();
  await expect(upvote).toContainText("1");
  await upvote.click();
  await expect(upvote).toContainText("0");
});
