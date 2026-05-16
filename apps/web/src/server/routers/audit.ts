import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

// Roles that can read full audit logs
const AUDIT_ROLES = ["ADMIN", "REVIEWER", "EXECUTIVE"];

export const auditRouter = router({
  /** List audit log entries. Admin, Reviewer, and Executive only. */
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
      if (!AUDIT_ROLES.includes(role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin, Reviewer, or Executive access required to view audit logs." });
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
      if (!AUDIT_ROLES.includes(role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.prisma.auditLog.findMany({
        where: { caseId: input.caseId },
        orderBy: { timestamp: "asc" },
        include: { user: { select: { name: true, role: true } } },
      });
    }),

  /**
   * Activity trail for a reporting year — status changes, PDF views,
   * downloads, certifications, and case-level events.
   * Accessible to ADMIN, REVIEWER, EXECUTIVE, and RECORDKEEPER.
   */
  forYear: protectedProcedure
    .input(z.object({ reportingYearId: z.string(), limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ ctx, input }) => {
      // Year-level events (status changes, PDF views, certifications)
      const yearLogs = await ctx.prisma.auditLog.findMany({
        where: {
          entityId: input.reportingYearId,
          entityType: { in: ["ReportingYear", "Form300A"] },
        },
        orderBy: { timestamp: "desc" },
        take: input.limit,
        include: { user: { select: { name: true, role: true } } },
      });

      // Case-level events for this year (limited sample)
      const caseLogs = await ctx.prisma.auditLog.findMany({
        where: {
          case: { reportingYearId: input.reportingYearId },
        },
        orderBy: { timestamp: "desc" },
        take: Math.min(20, input.limit),
        include: { user: { select: { name: true, role: true } } },
      });

      // Merge and sort by timestamp desc
      const all = [...yearLogs, ...caseLogs].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      // Deduplicate by id
      const seen = new Set<string>();
      return all.filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      }).slice(0, input.limit);
    }),
});
