import { defineConfig } from "@playwright/test";

const port = Number(process.env.TEST_PORT ?? 4322);
const baseURL = process.env.TEST_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  use: { baseURL, browserName: "chromium", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: "dark", reducedMotion: "reduce" } },
  ],
  webServer: process.env.TEST_BASE_URL ? undefined : {
    command: `npm run preview -- --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
