import { test, expect } from "../playwright-fixture";

test.describe("SEO & Accessibility", () => {
  test("landing page has single H1", async ({ page }) => {
    await page.goto("/");
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
  });

  test("landing page has meta description", async ({ page }) => {
    await page.goto("/");
    const metaDesc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(metaDesc).toBeTruthy();
    expect(metaDesc!.length).toBeGreaterThan(50);
    expect(metaDesc!.length).toBeLessThan(170);
  });

  test("landing page has JSON-LD structured data", async ({ page }) => {
    await page.goto("/");
    const jsonLd = await page.locator('script[type="application/ld+json"]').count();
    expect(jsonLd).toBeGreaterThan(0);
  });

  test("images have alt attributes", async ({ page }) => {
    await page.goto("/");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt, `Image ${i} missing alt attribute`).toBeTruthy();
    }
  });

  test("auth page has proper title", async ({ page }) => {
    await page.goto("/auth");
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeLessThan(65);
  });
});
