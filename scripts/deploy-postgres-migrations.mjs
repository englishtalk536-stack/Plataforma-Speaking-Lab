import { spawnSync } from 'node:child_process';

function isNeonPostgres(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return ['postgres:', 'postgresql:'].includes(url.protocol) && url.hostname.endsWith('.neon.tech');
  } catch {
    return false;
  }
}

if (process.env.NEON_MIGRATION_CONFIRM !== 'APPLY_POSTGRES_MIGRATIONS') {
  console.error('Refusing to migrate. Set NEON_MIGRATION_CONFIRM=APPLY_POSTGRES_MIGRATIONS explicitly after verifying the Neon target.');
  process.exit(1);
}
if (!isNeonPostgres(process.env.DATABASE_URL) || !isNeonPostgres(process.env.DIRECT_URL)) {
  console.error('Refusing to migrate. DATABASE_URL and DIRECT_URL must both target Neon PostgreSQL.');
  process.exit(1);
}

const result = spawnSync('npx', ['prisma', 'migrate', 'deploy', '--schema', 'prisma/postgresql/schema.prisma'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (result.error) {
  console.error('Could not start Prisma migration.');
  process.exit(1);
}
process.exit(result.status ?? 1);
