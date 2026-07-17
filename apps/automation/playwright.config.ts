import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir: './tests', reporter: [['html'], ['./reporters/ado-reporter.ts']], use: { trace: 'retain-on-failure' } });
