import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { signUpAndVerify, uniqueEmail } from "./helpers";

const registered = readFileSync(
  join(process.cwd(), "tests/fixtures/certificates/sample.registered.json"),
  "utf8",
);

test("the dashboard verifier validates a genuine certificate", async ({ page }) => {
  await signUpAndVerify(page, uniqueEmail());

  await page.getByLabel("Certificate").fill(registered);
  await page.getByLabel(/published text to match/i).fill("hello world");
  await page.getByRole("button", { name: /verify certificate/i }).click();

  // Scope to the result panel so we don't match the pasted JSON in the textarea.
  const result = page.getByRole("status");
  await expect(result.getByText("Signature valid", { exact: true })).toBeVisible();
  await expect(result.getByText("Registered", { exact: true })).toBeVisible();
  await expect(result.getByText("Text matches", { exact: true })).toBeVisible();
  await expect(result.getByText(/No-Bulk-Paste/)).toBeVisible();
});
