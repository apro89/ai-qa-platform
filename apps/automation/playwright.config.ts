import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { resolve } from 'node:path';

// Repository commands and CI execute Playwright from the workspace root.
dotenv.config({ path: resolve(process.cwd(), '.env') });

const numberFromEnv = (name: string, fallback: number): number => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: numberFromEnv('PLAYWRIGHT_RETRIES', process.env.CI ? 2 : 0),
  workers: numberFromEnv('PLAYWRIGHT_WORKERS', process.env.CI ? 2 : 4),
  timeout: numberFromEnv('PLAYWRIGHT_TIMEOUT_MS', 30_000),
  expect: { timeout: numberFromEnv('PLAYWRIGHT_EXPECT_TIMEOUT_MS', 5_000) },
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'results/junit.xml' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'https://www.saucedemo.com',
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  outputDir: 'test-results',
});
