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
import { router, protectedProcedure } from "../trpc";
import { decryptCaseFields } from "../../lib/crypto";

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

      const logRows = cases.map((c) => {
        const d = decryptCaseFields(c);
        return {
          ...d,
          // 300 Log always shows "privacy case" — never the real name. 1904.29(b)(6).
          employeeName: d.isPrivacyCase ? "privacy case" : d.employeeName,
          // Description may be sanitized for privacy cases per 1904.29(b)(9).
          whatHappened: d.isPrivacyCase
            ? "Description withheld — privacy case per 1904.29(b)(9)"
            : d.whatHappened,
        };
      });

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
          preparedBy: { select: { id: true, name: true, role: true } },
          reviewedBy: { select: { id: true, name: true, role: true } },
          approvedBy: { select: { id: true, name: true, role: true } },
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
        // Workflow
        status: ry.status ?? "DRAFT",
        reviewerComment: ry.reviewerComment,
        version: ry.version ?? 1,
        finalizedAt: ry.finalizedAt,
        preparedBy: ry.preparedBy,
        reviewedBy: ry.reviewedBy,
        approvedBy: ry.approvedBy,
      };
    }),

});
