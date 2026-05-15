/**
 * Forms router — data assembly for OSHA Forms 300, 300A, and 301.
 *
 * This router returns structured data for each form. Actual PDF generation
 * is handled by the pdf/ service layer (Phase 7). This layer applies:
 *   - Privacy masking (1904.29(b)(6)) on the 300 Log
 *   - ITA field exclusions for electronic submission (1904.41(c))
 *   - 300A totals derived from the 300 Log
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { EXCLUDED_FIELDS_300, EXCLUDED_FIELDS_301 } from "@osha/regulatory-logic";

export const formsRouter = router({
  /**
   * Assemble OSHA Form 300 (Log of Work-Related Injuries and Illnesses) data
   * for a reporting year.
   *
   * Privacy: employee names are replaced with "privacy case" for all privacy cases
   * regardless of user role — the 300 Log is the public-facing form.
   */
  get300Log: protectedProcedure
    .input(z.object({ reportingYearId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ry = await ctx.prisma.reportingYear.findUniqueOrThrow({
        where: { id: input.reportingYearId },
        include: { establishment: true },
      });

      const cases = await ctx.prisma.case.findMany({
        where: { reportingYearId: input.reportingYearId, isRecordable: true },
        orderBy: { caseNumber: "asc" },
        select: {
          id: true,
          caseNumber: true,
          employeeName: true,
          employeeJobTitle: true,
          dateOfInjury: true,
          whereEventOccurred: true,
          whatHappened: true,
          isPrivacyCase: true,
          privacyReason: true,
          outcome: true,
          daysAway: true,
          daysRestricted: true,
          caseType: true,
        },
      });

      const logRows = cases.map((c) => ({
        ...c,
        // 300 Log always shows "privacy case" — never the real name. 1904.29(b)(6).
        employeeName: c.isPrivacyCase ? "privacy case" : c.employeeName,
        // Description may be sanitized for privacy cases per 1904.29(b)(9).
        whatHappened: c.isPrivacyCase
          ? "Description withheld — privacy case per 1904.29(b)(9)"
          : c.whatHappened,
      }));

      return {
        establishment: ry.establishment,
        year: ry.year,
        rows: logRows,
        privacyCaseCount: cases.filter((c) => c.isPrivacyCase).length,
        cfr: "29 CFR 1904.29",
      };
    }),

  /**
   * Assemble OSHA Form 300A (Annual Summary) data.
   *
   * Totals are derived automatically from the 300 Log.
   * Must be certified by a company executive per 1904.32(b)(3).
   * Must be posted February 1 – April 30. 1904.32(b)(6).
   */
  get300A: protectedProcedure
    .input(z.object({ reportingYearId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ry = await ctx.prisma.reportingYear.findUniqueOrThrow({
        where: { id: input.reportingYearId },
        include: {
          establishment: true,
          certifications: {
            orderBy: { certifiedAt: "desc" },
            take: 1,
            include: { certifiedBy: { select: { name: true } } },
          },
        },
      });

      const cases = await ctx.prisma.case.findMany({
        where: { reportingYearId: input.reportingYearId, isRecordable: true },
        select: {
          outcome: true,
          daysAway: true,
          daysRestricted: true,
          caseType: true,
        },
      });

      // 300A totals
      const totals = {
        totalDeaths: cases.filter((c) => c.outcome === "DEATH").length,
        totalDaysAwayFromWork: cases.filter((c) => c.outcome === "DAYS_AWAY").length,
        totalJobTransferOrRestriction: cases.filter((c) => c.outcome === "RESTRICTED_TRANSFER").length,
        totalOtherRecordable: cases.filter((c) => c.outcome === "OTHER_RECORDABLE").length,
        totalDaysAway: cases.reduce((s, c) => s + c.daysAway, 0),
        totalDaysRestricted: cases.reduce((s, c) => s + c.daysRestricted, 0),
        // Case type columns
        totalInjuries: cases.filter((c) => c.caseType === "INJURY").length,
        totalSkinDisorders: cases.filter((c) => c.caseType === "SKIN_DISORDER").length,
        totalRespiratoryConditions: cases.filter((c) => c.caseType === "RESPIRATORY").length,
        totalPoisonings: cases.filter((c) => c.caseType === "POISONING").length,
        totalHearingLoss: cases.filter((c) => c.caseType === "HEARING_LOSS").length,
        totalAllOtherIllnesses: cases.filter((c) => c.caseType === "ALL_OTHER_ILLNESS").length,
      };

      const latestCert = ry.certifications[0] ?? null;

      return {
        establishment: ry.establishment,
        year: ry.year,
        avgEmployees: ry.avgEmployees,
        totalHoursWorked: ry.totalHoursWorked,
        totals,
        certification: latestCert
          ? {
              signerName: latestCert.signerName,
              signerTitle: latestCert.signerTitle,
              certifiedAt: latestCert.certifiedAt,
            }
          : null,
        postingRequirement: {
          start: `${ry.year + 1}-02-01`,
          end: `${ry.year + 1}-04-30`,
          cfr: "29 CFR 1904.32(b)(6)",
        },
        cfr: "29 CFR 1904.32",
      };
    }),

  /**
   * Get OSHA Form 301 (Injury and Illness Incident Report) data for one case.
   *
   * Privacy: full PII is included here because the 301 is the confidential record.
   * Government representatives may request access per 1904.40.
   * Access is logged in the audit trail.
   */
  get301: protectedProcedure
    .input(z.object({ caseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const c = await ctx.prisma.case.findUniqueOrThrow({ where: { id: input.caseId } });

      // Log access to any 301 (contains PII)
      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "VIEW_PRIVACY",
          entityType: "Form301",
          entityId: c.id,
          caseId: c.id,
          reason: "Form 301 viewed",
        },
      });

      return { case: c, cfr: "29 CFR 1904.29(b)" };
    }),

  /**
   * Build a CSV payload for ITA electronic submission.
   *
   * Applies field exclusions required by 1904.41(c):
   *   - Form 300: excludes employee name (column B)
   *   - Form 301: excludes employee name, home address, physician name, facility info
   */
  buildITACsv: protectedProcedure
    .input(
      z.object({
        reportingYearId: z.string(),
        formType: z.enum(["300A", "300", "301"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const ry = await ctx.prisma.reportingYear.findUniqueOrThrow({
        where: { id: input.reportingYearId },
        include: { establishment: true },
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "EXPORT",
          entityType: "ITACsv",
          entityId: input.reportingYearId,
          reason: `ITA CSV export requested for Form ${input.formType}`,
        },
      });

      if (input.formType === "300A") {
        return { formType: "300A", excludedFields: [], ry };
      }

      return {
        formType: input.formType,
        excludedFields:
          input.formType === "300"
            ? [...EXCLUDED_FIELDS_300]
            : [...EXCLUDED_FIELDS_301],
        cfr: "29 CFR 1904.41(c)",
        ry,
      };
    }),
});
