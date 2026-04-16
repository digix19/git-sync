import { defineConfig, devices } from "@playwright/test";

const systemChromium = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath: systemChromium,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "cd ../.. && set -a && source .env.local && set +a && bun run apps/sync-worker/src/platform/server.bun.ts",
      url: "http://localhost:8787/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        DASHBOARD_ORIGIN: process.env.DASHBOARD_ORIGIN || "http://localhost:3000",
      },
    },
    {
      command: "bun run dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      env: {
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8787",
      },
    },
  ],
});
