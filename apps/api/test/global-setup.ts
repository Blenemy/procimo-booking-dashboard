import { execSync } from 'node:child_process';
import { testDatabaseUrl } from './helpers/db';

export default function setup() {
  execSync('pnpm exec prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
  });
}
