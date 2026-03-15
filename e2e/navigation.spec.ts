import { test, expect } from "../playwright-fixture";

test.describe("Navigation & Routing", () => {
  test("should redirect unauthenticated users from protected routes", async ({ page }) => {
    await page.goto("/home");
    // Should redirect to auth or landing
    await page.waitForURL(/(\/auth|\/|\/landing)/, { timeout: 5000 });
    expect(page.url()).toMatch(/(\/auth|\/landing|\/$)/);
  });

  test("should show 404 for unknown routes", async ({ page }) => {
    await page.goto("/this-does-not-exist-xyz");
    await expect(page.locator("body")).toContainText(/not found|404|page.*exist/i);
  });

  test("should load docs page publicly", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.locator("body")).toBeVisible();
    // Docs should be accessible without auth
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
  });

  test("should load changelog page publicly", async ({ page }) => {
    await page.goto("/changelog");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load privacy policy", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should load terms of service", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("h1")).toBeVisible();
  });
});
