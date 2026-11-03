import { PrismaClient } from '@prisma/client';
import { loadPostgresCatalog, validatePostgresCatalogTarget } from '../prisma/postgresql/catalog-loader';

async function main() {
  try {
    validatePostgresCatalogTarget(process.env);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Refusing to load catalog.');
    process.exitCode = 1;
    return;
  }

  const prisma = new PrismaClient();
  try {
    const counts = await prisma.$transaction((transaction) => loadPostgresCatalog(transaction));
    console.log(`Loaded ${counts.parentNodes} parent nodes, ${counts.practices} practices, and ${counts.missions} mission templates.`);
    console.log('No users, classrooms, assignments, progress, submissions, feedback, or balances were loaded.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('PostgreSQL catalog load failed:', error);
  process.exitCode = 1;
});