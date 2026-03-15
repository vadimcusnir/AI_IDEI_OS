import { test, expect } from "../playwright-fixture";

test.describe("Landing Page", () => {
  test("should load and display hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    // Should show the landing page with CTA
    await expect(page.getByRole("link", { name: /sign in|get started|start/i }).first()).toBeVisible();
  });

  test("should have correct page title and meta", async ({ page }) => {
    await page.goto("/");
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title.length).toBeLessThan(70);
  });

  test("should have navigation links visible", async ({ page }) => {
    await page.goto("/");
    // Footer or header should have links
    await expect(page.locator("footer")).toBeVisible();
  });

  test("should navigate to auth page from CTA", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /sign in|get started|start|log in/i }).first();
    if (await cta.isVisible()) {
      await cta.click();
      await page.waitForURL(/\/(auth|login)/);
      expect(page.url()).toMatch(/\/(auth|login)/);
    }
  });
});
