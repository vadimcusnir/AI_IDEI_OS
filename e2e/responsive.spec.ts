import { test, expect } from "../playwright-fixture";

test.describe("Responsive Design", () => {
  test("mobile: landing page renders correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("h1")).toBeVisible();
  });

  test("tablet: landing page renders correctly", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("h1")).toBeVisible();
  });

  test("mobile: auth form is usable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/auth");
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    // Input should be reasonably wide on mobile
    const box = await emailInput.boundingBox();
    expect(box!.width).toBeGreaterThan(200);
  });
});
