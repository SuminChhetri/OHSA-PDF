import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { type Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth.js";
import { prisma } from "@osha/db";

export interface Context {
  prisma: typeof prisma;
  session: Session | null;
  req?: CreateNextContextOptions["req"];
  res?: CreateNextContextOptions["res"];
}

/**
 * Creates the tRPC context for each request.
 * Attaches the Prisma client and the current session (if any).
 */
export async function createTRPCContext(
  opts: CreateNextContextOptions
): Promise<Context> {
  const session = await getServerSession(opts.req, opts.res, authOptions);
  return {
    prisma,
    session,
    req: opts.req,
    res: opts.res,
  };
}

/** Lightweight context for App Router route handlers (no req/res). */
export async function createInnerTRPCContext(session: Session | null): Promise<Context> {
  return { prisma, session };
}
