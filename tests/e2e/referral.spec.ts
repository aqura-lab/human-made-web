import { test, expect } from "@playwright/test";
import { signUpAndVerify, uniqueEmail } from "./helpers";

test("a converted referral moves the inviter's private progress", async ({ browser }) => {
  // Inviter A signs up and reads their own referral link.
  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();
  await signUpAndVerify(pageA, uniqueEmail("inviter"));
  await expect(pageA.getByText(/0 of 5 invited/i)).toBeVisible();
  const link = await pageA.locator("input.code-pill").inputValue();
  const ref = new URL(link).searchParams.get("ref")!;
  expect(ref).toBeTruthy();

  // Invitee B signs up via the referral link and verifies — this converts.
  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  await signUpAndVerify(pageB, uniqueEmail("invitee"), { ref });

  // A's private progress now reflects the conversion (no leaderboard anywhere).
  await pageA.reload();
  await expect(pageA.getByText(/1 of 5 invited/i)).toBeVisible();
  expect((await pageA.content()).toLowerCase()).not.toContain("leaderboard");

  await ctxA.close();
  await ctxB.close();
});
