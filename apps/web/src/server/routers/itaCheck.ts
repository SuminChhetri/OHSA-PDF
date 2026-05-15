/**
 * ITA eligibility check router.
 *
 * Returns the exact set of forms an establishment must submit electronically,
 * the deadline, and a plain-language explanation — citing the specific CFR section.
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { checkITAEligibility, checkExemption } from "@osha/regulatory-logic";

export const itaCheckRouter = router({
  /**
   * Compute ITA electronic submission requirements for an establishment
   * in a given reporting year.
   *
   * Returns:
   *   - Which forms must be submitted (300A / 300+301 / none)
   *   - The March 2 deadline
   *   - Whether recordkeeping exemptions apply (separate from ITA)
   *   - Plain-language summary for the UI
   */
  getEligibility: protectedProcedure
    .input(
      z.object({
        establishmentId: z.string(),
        reportingYear: z.number().int().min(2000).max(2100),
        totalEmployeesInYear: z.number().int().min(0),
        peakEmployeeCountPriorYear: z.number().int().min(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const est = await ctx.prisma.establishment.findUniqueOrThrow({
        where: { id: input.establishmentId },
      });

      const ita = checkITAEligibility({
        totalEmployeesInYear: input.totalEmployeesInYear,
        naicsCode: est.naicsCode,
        reportingYear: input.reportingYear,
      });

      const exemption = checkExemption({
        peakEmployeeCountPriorYear: input.peakEmployeeCountPriorYear,
        naicsCode: est.naicsCode,
      });

      const deadlineStr = ita.submissionDeadline.toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      });

      let summary: string;
      if (exemption.isExempt && ita.tier === "NONE") {
        summary =
          `${est.name} is exempt from routine recordkeeping (${exemption.cfr}) ` +
          "AND has no ITA electronic submission requirement for this reporting year. " +
          "NOTE: Severe injury reporting (1904.39) still applies.";
      } else if (ita.tier === "NONE") {
        summary =
          `${est.name} has no ITA electronic submission requirement for ${input.reportingYear}. ` +
          "(Employee count below threshold.)";
      } else if (ita.tier === "300A_ONLY") {
        summary =
          `${est.name} must submit Form 300A to OSHA's Injury Tracking Application ` +
          `by ${deadlineStr}. ${ita.cfr}.`;
      } else {
        summary =
          `${est.name} must submit Forms 300A, 300 (Log), and 301 (Incident Reports) ` +
          `to OSHA's Injury Tracking Application by ${deadlineStr}. ` +
          `Note: Employee name and other PII fields are excluded from submission per 1904.41(c). ${ita.cfr}.`;
      }

      return {
        establishment: est,
        reportingYear: input.reportingYear,
        ita,
        exemption,
        summary,
        itaUrl: "https://www.osha.gov/injuryreporting",
      };
    }),
});
