/**
 * tRPC v10 server initialisation — updated for privacy-by-design role model.
 *
 * Roles (legacy → new):
 *   ADMIN / OWNER         Full access, invite users, manage establishment
 *   RECORDKEEPER / EDITOR Create and edit cases
 *   EXECUTIVE             Certify 300A (1904.32(b)(3))
 *   SENSITIVE_REVIEWER    View sensitive data, download unredacted PDF
 *   REVIEWER              Read-only, redacted view only
 *   DOWNLOAD_REVIEWER     Download permitted (redacted) version only
 *
 * Procedure tiers:
 *   publicProcedure           No auth
 *   protectedProcedure        Any authenticated user
 *   adminProcedure            ADMIN or OWNER
 *   recordkeeperProcedure     ADMIN, OWNER, RECORDKEEPER, or EDITOR
 *   executiveProcedure        ADMIN, OWNER, or EXECUTIVE
 *   sensitiveViewProcedure    All except REVIEWER and DOWNLOAD_REVIEWER
 *   ownerProcedure            OWNER or ADMIN only (invite users, manage permissions)
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { type Context } from "./context";

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

// ── Helpers ───────────────────────────────────────────────────────────────────

const OWNER_ROLES = ["ADMIN", "OWNER"];
const EDITOR_ROLES = ["ADMIN", "OWNER", "RECORDKEEPER", "EDITOR"];
const EXECUTIVE_ROLES = ["ADMIN", "OWNER", "EXECUTIVE"];
const SENSITIVE_ROLES = ["ADMIN", "OWNER", "RECORDKEEPER", "EDITOR", "EXECUTIVE", "SENSITIVE_REVIEWER"];

// ── Middleware ────────────────────────────────────────────────────────────────

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { session: ctx.session } });
});

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!OWNER_ROLES.includes(ctx.session?.user?.role ?? "")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Owner or Admin access required." });
  }
  return next({ ctx: { session: ctx.session! } });
});

const isRecordkeeperOrAdmin = t.middleware(({ ctx, next }) => {
  if (!EDITOR_ROLES.includes(ctx.session?.user?.role ?? "")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Editor or Admin access required." });
  }
  return next({ ctx: { session: ctx.session! } });
});

const isExecutiveOrAdmin = t.middleware(({ ctx, next }) => {
  if (!EXECUTIVE_ROLES.includes(ctx.session?.user?.role ?? "")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Executive or Admin access required." });
  }
  return next({ ctx: { session: ctx.session! } });
});

const canViewSensitive = t.middleware(({ ctx, next }) => {
  if (!SENSITIVE_ROLES.includes(ctx.session?.user?.role ?? "")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Sensitive data access not permitted for your role." });
  }
  return next({ ctx: { session: ctx.session! } });
});

// ── Exported procedures ───────────────────────────────────────────────────────

export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdmin);
export const ownerProcedure = t.procedure.use(isAdmin);           // alias for clarity
export const recordkeeperProcedure = t.procedure.use(isRecordkeeperOrAdmin);
export const executiveProcedure = t.procedure.use(isExecutiveOrAdmin);
export const sensitiveViewProcedure = t.procedure.use(canViewSensitive);
