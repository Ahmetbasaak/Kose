import { defineConfig, devices } from '@playwright/test';

export const E2E_PRO_KEY = 'e2e-only-key';

export default defineConfig({
  testDir: 'tests/e2e',
  // Turkish browser locale: the app picks its language from it.
  use: { baseURL: 'http://localhost:4173', trace: 'off', locale: 'tr-TR' },
  webServer: {
    // Test build only: the dev Pro key lets e2e reach Pro screens. Never deploy this build.
    command: 'npx vite build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    // Test mode off so the Pro gates themselves are exercised.
    env: { VITE_DEV_PRO_KEY: E2E_PRO_KEY, VITE_TEST_MODE: '0' },
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
