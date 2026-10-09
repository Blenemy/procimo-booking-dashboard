import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/server.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node22',
  sourcemap: true,
  shims: true,
  deps: { alwaysBundle: () => true },
});
