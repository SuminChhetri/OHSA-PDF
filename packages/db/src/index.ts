/**
 * Prisma client singleton for the OSHA Recordkeeping application.
 *
 * In development (NODE_ENV !== "production"), a global singleton is used to
 * prevent exhausting the connection pool when Next.js hot-reloads modules.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env["NODE_ENV"] === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient } from "@prisma/client";
export type * from "@prisma/client";
