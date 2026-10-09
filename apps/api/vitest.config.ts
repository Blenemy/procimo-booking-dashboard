import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

if (existsSync('.env')) process.loadEnvFile();

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/global-setup.ts'],
    fileParallelism: false,
    env: { TZ: 'Pacific/Auckland' },
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
