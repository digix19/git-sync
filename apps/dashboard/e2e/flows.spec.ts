import { test, expect } from "@playwright/test";

const unique = `flows-${Date.now()}`;
const email = `${unique}@example.com`;
const password = `E2ETest!${unique}`;

test.describe("Core flows", () => {
  test.beforeAll(async ({ request }) => {
    // Ensure clean registration via API
    const res = await request.post("http://localhost:8787/api/auth/register", {
      data: { email, password },
    });
    if (!res.ok() && res.status() !== 409) {
      throw new Error(`Setup registration failed: ${res.status()}`);
    }
  });

  test.beforeEach(async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto("/login");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button:has-text("Login")');
    await page.waitForURL("/");
  });

  test("user can create an account and repository, then trigger sync", async ({ page }) => {
    // Create account
    await page.goto("/accounts");
    await page.selectOption("select", "other");
    await page.fill('input[placeholder="Nickname"]', `Test Account ${unique}`);
    await page.fill('input[type="password"][placeholder="Personal Access Token"]', "fake-pat-123");
    await page.click('button:has-text("Add Account")');
    await expect(page.locator(`text=Test Account ${unique}`)).toBeVisible();

    // Create repository
    await page.goto("/repositories");
    await page.selectOption('select:has-text("Select account")', { label: `Test Account ${unique}` });
    await page.fill('input[placeholder="Source URL"]', "https://github.com/test/repo.git");
    await page.click('button:has-text("Add Repository")');
    await expect(page.locator("text=https://github.com/test/repo.git")).toBeVisible();

    // Create destination
    await page.goto("/destinations");
    await page.selectOption('select:has-text("Select repository")', { label: "https://github.com/test/repo.git" });
    await page.selectOption('select:has-text("Select account")', { label: `Test Account ${unique}` });
    await page.fill('input[placeholder="Destination URL"]', "https://gitlab.com/test/mirror.git");
    await page.click('button:has-text("Add Destination")');
    await expect(page.locator("text=https://gitlab.com/test/mirror.git")).toBeVisible();

    // Trigger sync from repositories page
    await page.goto("/repositories");
    await page.click('text=Sync Now');
    // Alert is auto-accepted by the beforeEach dialog handler

    // View logs
    await page.goto("/logs");
    await expect(page.locator("text=Sync Logs")).toBeVisible();
    await expect(page.locator("text=pending")).toBeVisible();
  });

  test("user can update settings", async ({ page }) => {
    await page.goto("/settings");
    await page.fill('input[type="password"]', "bot-token-123");
    await page.locator('input[name="chatId"]').fill("chat-id-456");
    await page.uncheck('input[type="checkbox"]');
    await page.click('button:has-text("Save Settings")');
    // Alert is auto-accepted by the beforeEach dialog handler

    // Verify persistence
    await page.reload();
    await expect(page.locator('input[type="password"]')).toHaveValue("bot-token-123");
    await expect(page.locator('input[name="chatId"]')).toHaveValue("chat-id-456");
    await expect(page.locator('input[type="checkbox"]')).not.toBeChecked();
  });
});
