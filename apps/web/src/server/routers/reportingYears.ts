import { z } from "zod";
import { router, protectedProcedure, recordkeeperProcedure, executiveProcedure } from "../trpc.js";
import { TRPCError } from "@trpc/server";

export const reportingYearsRouter = router({
  /** List reporting years for an establishment (newest first). */
  list: protectedProcedure
    .input(z.object({ establishmentId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.reportingYear.findMany({
        where: { establishmentId: input.establishmentId },
        orderBy: { year: "desc" },
        include: {
          _count: { select: { cases: true } },
          certifications: {
            orderBy: { certifiedAt: "desc" },
            take: 1,
            include: { certifiedBy: { select: { name: true, role: true } } },
          },
        },
      });
    }),

  /** Get a single reporting year with full stats needed for 300A. */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const ry = await ctx.prisma.reportingYear.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          establishment: true,
          certifications: {
            orderBy: { certifiedAt: "desc" },
            include: { certifiedBy: { select: { name: true, role: true } } },
          },
          _count: { select: { cases: true } },
        },
      });
      return ry;
    }),

  /** Create a reporting year for an establishment. */
  create: recordkeeperProcedure
    .input(
      z.object({
        establishmentId: z.string(),
        year: z.number().int().min(2000).max(2100),
        avgEmployees: z.number().int().min(0).optional(),
        totalHoursWorked: z.number().int().min(0).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.reportingYear.create({ data: input });
    }),

  /** Update employment stats (needed for TRIR/DART calculation). */
  updateStats: recordkeeperProcedure
    .input(
      z.object({
        id: z.string(),
        avgEmployees: z.number().int().min(0),
        totalHoursWorked: z.number().int().min(0),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.reportingYear.update({ where: { id }, data });
    }),

  /**
   * Certify the 300A annual summary. Per 1904.32(b)(3), only a company executive,
   * owner, officer, or highest-ranking company official may certify.
   * Enforced by executiveProcedure middleware (EXECUTIVE or ADMIN role).
   */
  certify300A: executiveProcedure
    .input(
      z.object({
        reportingYearId: z.string(),
        signerName: z.string().min(1),
        signerTitle: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ry = await ctx.prisma.reportingYear.findUniqueOrThrow({
        where: { id: input.reportingYearId },
        include: { _count: { select: { cases: true } } },
      });

      const cert = await ctx.prisma.certificationRecord.create({
        data: {
          reportingYearId: ry.id,
          certifiedById: ctx.session.user.id,
          signerName: input.signerName,
          signerTitle: input.signerTitle,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "CERTIFY",
          entityType: "ReportingYear",
          entityId: ry.id,
          after: JSON.stringify({ certificationId: cert.id, signerName: cert.signerName }),
          reason: `300A annual summary certified for year ${ry.year}`,
        },
      });

      return cert;
    }),

  /**
   * Enforce 5-year retention: returns reporting years that are safe to archive
   * (older than 5 years) vs. years that must be retained per 1904.33.
   */
  retentionStatus: protectedProcedure
    .input(z.object({ establishmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentYear = new Date().getUTCFullYear();
      const retentionCutoff = currentYear - 5; // Must retain years >= cutoff

      const years = await ctx.prisma.reportingYear.findMany({
        where: { establishmentId: input.establishmentId },
        orderBy: { year: "desc" },
        select: { id: true, year: true, _count: { select: { cases: true } } },
      });

      return years.map((y) => ({
        ...y,
        mustRetain: y.year >= retentionCutoff,
        retentionExpiresAfter: y.year + 5,
        cfr: "29 CFR 1904.33",
      }));
    }),

  /** Permanently delete a reporting year. Only allowed if outside retention window. */
  delete: recordkeeperProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ry = await ctx.prisma.reportingYear.findUniqueOrThrow({
        where: { id: input.id },
      });

      const currentYear = new Date().getUTCFullYear();
      const retentionCutoff = currentYear - 5;

      if (ry.year >= retentionCutoff) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            `Reporting year ${ry.year} is within the 5-year retention window (must retain through ${ry.year + 5}). ` +
            "Deletion is prohibited under 29 CFR 1904.33.",
        });
      }

      return ctx.prisma.reportingYear.delete({ where: { id: input.id } });
    }),
});
