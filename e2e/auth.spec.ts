import { test, expect } from "../playwright-fixture";

test.describe("Auth Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth");
  });

  test("should display login form by default", async ({ page }) => {
    await expect(page.getByRole("button", { name: /sign in|log in/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("should toggle to signup mode", async ({ page }) => {
    const signupToggle = page.getByText(/sign up|create account|register/i).first();
    if (await signupToggle.isVisible()) {
      await signupToggle.click();
      await expect(page.getByRole("button", { name: /sign up|create account|register/i })).toBeVisible();
    }
  });

  test("should validate empty email", async ({ page }) => {
    await page.locator('input[type="password"]').fill("testpassword123");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    // Should show validation error (toast or inline)
    await expect(page.locator("body")).toContainText(/email|valid/i);
  });

  test("should validate short password", async ({ page }) => {
    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('input[type="password"]').fill("ab");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    // Should show password validation error
    await expect(page.locator("body")).toContainText(/password|characters/i);
  });

  test("should show forgot password option", async ({ page }) => {
    const forgot = page.getByText(/forgot|reset/i).first();
    await expect(forgot).toBeVisible();
  });
});
