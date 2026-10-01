import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // The CI runner renders WebGL in software on two shared cores: run serially and retry flakes twice.
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
  // On CI also write an HTML report, uploaded as an artifact when the job fails.
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Headless Chromium needs SwiftShader for WebGL on machines without a GPU (CI).
        launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] },
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    url: 'http://localhost:4321/pt/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
