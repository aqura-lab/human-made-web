import { test, expect } from "@playwright/test";
import { signUpAndVerify, uniqueEmail } from "./helpers";

test("admin promotes feedback; a user upvotes and un-upvotes it anonymously", async ({ page }) => {
  // A normal user submits feedback.
  await signUpAndVerify(page, uniqueEmail("fb"));
  await page.goto("/dashboard");
  await page.getByLabel("Your feedback").fill("Please add a Windows build");
  await page.getByRole("button", { name: /send feedback/i }).click();
  await expect(page.getByText(/we read every note/i)).toBeVisible();

  // Admin promotes it with a clean public title.
  await signUpAndVerify(page, "alberto@aqurastudio.com", { name: "Alberto" });
  await page.goto("/admin");
  const lastTitleInput = page.getByLabel(/public title for/i).first();
  await lastTitleInput.fill("Windows build");
  await page.getByRole("button", { name: /^Promote$/ }).first().click();

  // Back as a user, the idea shows on /community with no author, and voting toggles.
  await page.goto("/community");
  const upvote = page.getByRole("button", { name: /upvote Windows build/i });
  await expect(upvote).toBeVisible();
  await expect(page.getByText("Please add a Windows build")).toHaveCount(0); // raw body never shown
  await upvote.click();
  await expect(upvote).toContainText("1");
  await upvote.click();
  await expect(upvote).toContainText("0");
});
