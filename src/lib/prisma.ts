import { PrismaClient } from '@prisma/client';

/**
 * Standard Next.js Prisma singleton pattern: in dev, the module graph gets
 * re-evaluated on every hot reload, which would otherwise create a fresh
 * PrismaClient (and a fresh connection pool) per reload. Stashing the
 * instance on `globalThis` survives the reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
