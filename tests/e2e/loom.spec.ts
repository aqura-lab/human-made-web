import { test, expect } from "@playwright/test";
import { signUpAndVerify } from "./helpers";

test("admin sets a Loom URL and it renders on the dashboard", async ({ page }) => {
  await signUpAndVerify(page, "alberto@aqurastudio.com", { name: "Alberto" });
  await page.goto("/admin");
  await page.getByLabel("loom url").fill("https://www.loom.com/share/deadbeefcafe");
  await page.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByText(/^Saved$/)).toBeVisible();

  await page.goto("/dashboard");
  const frame = page.locator('iframe[title="Human Made explainer"]');
  await expect(frame).toHaveAttribute("src", "https://www.loom.com/embed/deadbeefcafe");
});
