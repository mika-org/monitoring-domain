import { PrismaClient } from '@prisma/client';

// Polyfill BigInt serialization for Next.js JSON responses
if (typeof BigInt !== 'undefined') {
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Check that the cached Prisma client has latest models (e.g. server, website, etc.)
const isUpToDate =
  globalForPrisma.prisma &&
  'server' in globalForPrisma.prisma &&
  'website' in globalForPrisma.prisma &&
  'alert' in globalForPrisma.prisma;

export const prisma =
  (isUpToDate ? globalForPrisma.prisma : undefined) ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
