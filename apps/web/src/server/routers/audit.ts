import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { TRPCError } from "@trpc/server";

export const auditRouter = router({
  /** List audit log entries. Admin and Reviewer only. */
  list: protectedProcedure
    .input(
      z.object({
        caseId: z.string().optional(),
        entityType: z.string().optional(),
        action: z.string().optional(),
        limit: z.number().int().min(1).max(500).default(100),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const role = ctx.session.user.role;
      if (!["ADMIN", "REVIEWER"].includes(role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin or Reviewer access required to view audit logs." });
      }

      const entries = await ctx.prisma.auditLog.findMany({
        where: {
          ...(input.caseId ? { caseId: input.caseId } : {}),
          ...(input.entityType ? { entityType: input.entityType } : {}),
          ...(input.action ? { action: input.action } : {}),
        },
        orderBy: { timestamp: "desc" },
        take: input.limit + 1,
        ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
        include: {
          user: { select: { name: true, email: true, role: true } },
        },
      });

      const hasMore = entries.length > input.limit;
      const items = hasMore ? entries.slice(0, input.limit) : entries;

      return {
        items,
        nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
      };
    }),

  /** Get full audit history for a specific case. */
  forCase: protectedProcedure
    .input(z.object({ caseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const role = ctx.session.user.role;
      if (!["ADMIN", "REVIEWER"].includes(role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.prisma.auditLog.findMany({
        where: { caseId: input.caseId },
        orderBy: { timestamp: "asc" },
        include: { user: { select: { name: true, role: true } } },
      });
    }),
});
