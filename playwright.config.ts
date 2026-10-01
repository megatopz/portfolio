import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
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
