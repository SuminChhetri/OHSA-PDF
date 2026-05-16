import { z } from "zod";
import { router, protectedProcedure, recordkeeperProcedure, executiveProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

// Valid form-status values
export type FormStatus = "DRAFT" | "IN_REVIEW" | "NEEDS_CHANGES" | "APPROVED" | "FINALIZED" | "ARCHIVED";
const FORM_STATUS = z.enum(["DRAFT", "IN_REVIEW", "NEEDS_CHANGES", "APPROVED", "FINALIZED", "ARCHIVED"]);

// Which roles may trigger each target status
const TRANSITION_ROLES: Record<FormStatus, string[]> = {
  DRAFT:         ["ADMIN"],                              // reopen — admin only
  IN_REVIEW:     ["RECORDKEEPER", "REVIEWER", "EXECUTIVE", "ADMIN"],
  NEEDS_CHANGES: ["REVIEWER", "EXECUTIVE", "ADMIN"],
  APPROVED:      ["REVIEWER", "EXECUTIVE", "ADMIN"],
  FINALIZED:     ["EXECUTIVE", "ADMIN"],
  ARCHIVED:      ["ADMIN"],
};

// Which source statuses may flow into each target status
const VALID_FROM: Record<FormStatus, FormStatus[]> = {
  DRAFT:         ["IN_REVIEW", "NEEDS_CHANGES", "APPROVED", "FINALIZED", "ARCHIVED"], // admin reopen
  IN_REVIEW:     ["DRAFT", "NEEDS_CHANGES"],
  NEEDS_CHANGES: ["IN_REVIEW"],
  APPROVED:      ["IN_REVIEW"],
  FINALIZED:     ["APPROVED"],
  ARCHIVED:      ["FINALIZED"],
};

export const reportingYearsRouter = router({
  /** List reporting years for an establishment (newest first). */
  list: protectedProcedure
    .input(z.object({ establishmentId: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.reportingYear.findMany({
        where: { establishmentId: input.establishmentId },
        orderBy: { year: "desc" },
        include: {
          _count: { select: { cases: { where: { isRecordable: true } } } },
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
          preparedBy: { select: { id: true, name: true, role: true } },
          reviewedBy: { select: { id: true, name: true, role: true } },
          approvedBy: { select: { id: true, name: true, role: true } },
        },
      });
      return ry;
    }),

  /**
   * Move a reporting year through the approval workflow.
   * Role-based transition rules enforced server-side.
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: FORM_STATUS,
        comment: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const role = ctx.session.user.role as FormStatus extends string ? string : never;
      const userId = ctx.session.user.id;

      const ry = await ctx.prisma.reportingYear.findUniqueOrThrow({
        where: { id: input.id },
      });

      const currentStatus = (ry.status ?? "DRAFT") as FormStatus;
      const targetStatus = input.status;

      // Validate role
      if (!TRANSITION_ROLES[targetStatus].includes(role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Your role (${role}) cannot set status to ${targetStatus}.`,
        });
      }

      // Validate source → target transition
      const validFrom = VALID_FROM[targetStatus];
      if (!validFrom.includes(currentStatus)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition from ${currentStatus} to ${targetStatus}.`,
        });
      }

      const updateData: Record<string, unknown> = {
        status: targetStatus,
        reviewerComment: input.comment ?? ry.reviewerComment,
      };

      // Track who performed each workflow action
      if (targetStatus === "IN_REVIEW" && !ry.preparedById) {
        updateData.preparedById = userId;
      }
      if (["NEEDS_CHANGES", "APPROVED"].includes(targetStatus)) {
        updateData.reviewedById = userId;
        if (targetStatus === "APPROVED") updateData.approvedById = userId;
      }
      if (targetStatus === "FINALIZED") {
        updateData.finalizedAt = new Date();
        updateData.version = (ry.version ?? 1) + 1;
      }
      // Clear finalizedAt when reopening a finalized/archived form
      if (targetStatus === "DRAFT" && (currentStatus === "FINALIZED" || currentStatus === "ARCHIVED")) {
        updateData.finalizedAt = null;
      }

      const updated = await ctx.prisma.reportingYear.update({
        where: { id: input.id },
        data: updateData,
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId,
          action: "STATUS_CHANGE",
          entityType: "ReportingYear",
          entityId: input.id,
          before: JSON.stringify({ status: currentStatus }),
          after: JSON.stringify({ status: targetStatus }),
          reason: input.comment,
        },
      });

      return updated;
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
        select: { id: true, year: true, _count: { select: { cases: { where: { isRecordable: true } } } } },
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
