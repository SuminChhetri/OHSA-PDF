/**
 * tRPC v10 server initialisation.
 *
 * Exports:
 *   router        — create type-safe routers
 *   publicProcedure    — no auth required
 *   protectedProcedure — requires authenticated session
 *   adminProcedure     — requires ADMIN role
 *   recordkeeperProcedure — requires ADMIN or RECORDKEEPER
 *   executiveProcedure    — requires ADMIN or EXECUTIVE
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { type Context } from "./context.js";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// ── Auth middleware ───────────────────────────────────────────────────────────

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { session: ctx.session } });
});

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user || ctx.session.user.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required." });
  }
  return next({ ctx: { session: ctx.session } });
});

const isRecordkeeperOrAdmin = t.middleware(({ ctx, next }) => {
  const role = ctx.session?.user?.role;
  if (!role || !["ADMIN", "RECORDKEEPER"].includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Recordkeeper or Admin access required." });
  }
  return next({ ctx: { session: ctx.session! } });
});

const isExecutiveOrAdmin = t.middleware(({ ctx, next }) => {
  const role = ctx.session?.user?.role;
  if (!role || !["ADMIN", "EXECUTIVE"].includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Executive or Admin access required." });
  }
  return next({ ctx: { session: ctx.session! } });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdmin);
export const recordkeeperProcedure = t.procedure.use(isRecordkeeperOrAdmin);
export const executiveProcedure = t.procedure.use(isExecutiveOrAdmin);
