import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: [
    {
      command: 'node scripts/e2e-server.mjs',
      cwd: '../BACKEND',
      url: 'http://127.0.0.1:3011/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000
    },
    {
      command:
        'npm run dev -- --host localhost --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        VITE_BACKEND_DEV_URL: 'http://127.0.0.1:3011',
        VITE_PUBLIC_SHORT_URL: 'http://localhost:5173',
        VITE_APP_URL: 'http://127.0.0.1:3011'
      }
    }
  ]
});
