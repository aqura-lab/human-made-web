import { test, expect } from "@playwright/test";
import { signUpAndVerify, uniqueEmail } from "./helpers";

test("deleting an account removes that user's community votes", async ({ page, browser }) => {
  // Unique per run so rows accumulated from prior runs can't make locators ambiguous.
  const idea = `Add a CLI ${Date.now()}`;
  const body = `Please ${idea}`;

  // 1. A normal user submits feedback.
  const fbUser = uniqueEmail("gv");
  await signUpAndVerify(page, fbUser);
  await page.goto("/dashboard");
  await page.getByLabel("Your feedback").fill(body);
  await page.getByRole("button", { name: /send feedback/i }).click();
  await expect(page.getByText(/we read every note/i)).toBeVisible();

  // 2. Admin promotes it with the unique idea as the public title.
  const adminCtx = await browser.newContext();
  const ap = await adminCtx.newPage();
  await signUpAndVerify(ap, "alberto@aqurastudio.com", { name: "Alberto" });
  await ap.goto("/admin");
  await ap.getByLabel(/public title for/i).first().fill(idea);
  await ap.getByRole("button", { name: /^Promote$/ }).first().click();
  // Wait for the optimistic flip and then for the server write to settle
  // so the promoted idea is in the DB before the fb user navigates to /community.
  await expect(ap.getByRole("button", { name: /^Unpromote$/ }).first()).toBeVisible();
  await ap.waitForLoadState("networkidle");
  await adminCtx.close();

  // 3. The fb user upvotes the promoted idea.
  // Wait for the vote API response to confirm the vote is actually written to the DB
  // (optimistic UI alone is insufficient — we need the server round-trip to succeed).
  await page.goto("/community");
  const upvote = page.getByRole("button", { name: new RegExp(`upvote ${idea}`, "i") });
  const [, voteResp] = await Promise.all([
    upvote.click(),
    page.waitForResponse(
      (r) => r.url().includes("/vote") && r.request().method() === "POST",
    ),
  ]);
  expect(voteResp.status(), "vote API must succeed so the vote exists in the DB").toBe(200);
  await expect(upvote).toContainText("1");

  // 4. The fb user deletes their account.
  // Selectors copied from gdpr-delete.spec.ts to match the real UI.
  await page.goto("/account");
  await page.getByLabel(/confirm delete/i).fill("DELETE");
  await page.getByRole("button", { name: /delete my account/i }).click();
  await expect(page).toHaveURL(/\/$|\/login/);

  // 5. A fresh user views /community and sees 0 votes — the deleted user's vote is gone.
  // This assertion fails without the deleteMany in the soft-delete transaction.
  const otherCtx = await browser.newContext();
  const op = await otherCtx.newPage();
  await signUpAndVerify(op, uniqueEmail("gv2"));
  await op.goto("/community");
  await expect(
    op.getByRole("button", { name: new RegExp(`upvote ${idea}`, "i") }),
  ).toContainText("0");
  await otherCtx.close();
}, 90_000);
