import { test, expect } from "@playwright/test";

const unique = Date.now().toString();
const email = `e2e-${unique}@example.com`;
const password = `E2ETest!${unique}`;

test.describe("Authentication", () => {
  test("user can register and is redirected to dashboard", async ({ page }) => {
    await page.goto("/register");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Register")');
    await page.waitForURL("/");
    await expect(page.locator("text=Dashboard")).toBeVisible();
  });

  test("user can logout and login again", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Login")');
    await page.waitForURL("/");
    await expect(page.locator("text=Welcome back")).toBeVisible();

    await page.click('text=Logout');
    await page.waitForURL("/login");
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });
});
