/**
 * Frontend-local mirror of the backend's Prisma enums used by dashboard
 * components. Kept as plain string unions here (rather than importing
 * `@prisma/client` into the frontend package) so the web app has no build
 * dependency on the backend's generated client.
 */
export type NodeStatus = 'LOCKED' | 'UNLOCKED' | 'COMPLETED';
