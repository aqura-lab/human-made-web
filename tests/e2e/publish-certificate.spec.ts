import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { signUpAndVerify, uniqueEmail } from "./helpers";

const fixture = readFileSync(
  join(process.cwd(), "tests/fixtures/certificates/sample.registered.json"),
  "utf8",
);
const CERT_ID = "11111111-2222-3333-4444-555555555555";

test("publish a certificate so /c/[id] renders it live, then unpublish", async ({ page }) => {
  await signUpAndVerify(page, uniqueEmail("pub"));

  // Publish from the dashboard.
  await page.goto("/dashboard");
  await page.getByLabel("Certificate JSON").fill(fixture);
  await page.getByRole("button", { name: /^Publish certificate$/ }).click();
  await expect(page.getByText(/published! public link/i)).toBeVisible();

  // The public landing page now renders the verified certificate (not the fallback).
  await page.goto(`/c/${CERT_ID}`);
  await expect(page.getByText(/records a human writing process/i)).toBeVisible();
  await expect(page.getByText(/Signature valid/i)).toBeVisible();

  // Unpublish returns it to the honest not-found fallback — and leaves clean state.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: /^Unpublish$/ }).click();
  await expect(page.getByRole("button", { name: /^Unpublish$/ })).toHaveCount(0);

  await page.goto(`/c/${CERT_ID}`);
  await expect(page.getByText(/isn't on the registry/i)).toBeVisible();
});

test("an invalid or tampered certificate is rejected (nothing stored)", async ({ page }) => {
  await signUpAndVerify(page, uniqueEmail("pubbad"));

  await page.goto("/dashboard");
  await page
    .getByLabel("Certificate JSON")
    .fill('{"certificate":{"id":"deadbeef1234"},"algorithm":"ed25519","signature":"not-a-real-signature","registration":null}');
  await page.getByRole("button", { name: /^Publish certificate$/ }).click();

  await expect(
    page.getByText(/could not be verified|missing a valid id|doesn't look like|could not publish/i),
  ).toBeVisible();
});
