const os = require('node:os');
const path = require('node:path');
const { createRequire } = require('node:module');

const requireFromTests = createRequire(path.join(__dirname, 'tests/package.json'));
const { defineConfig, devices } = requireFromTests('@playwright/test');

const port = Number(process.env.PLAYWRIGHT_PORT || 4317);
const baseURL = `http://127.0.0.1:${port}`;

module.exports = defineConfig({
  testDir: './tests',
  outputDir: path.join(os.tmpdir(), 'moona-studio-playwright-results'),
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list']],
  use: {
    baseURL,
    headless: true,
    reducedMotion: 'no-preference',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: 'node test-server.js',
    cwd: __dirname,
    url: `${baseURL}/__health`,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
    timeout: 15_000
  }
});
