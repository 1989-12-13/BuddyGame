import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e', testMatch: '**/*.e2e.ts', fullyParallel: false,
  timeout: 60000, outputDir: 'artifacts/playwright', reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev:vite -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
})
