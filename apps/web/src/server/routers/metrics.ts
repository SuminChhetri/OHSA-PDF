/**
 * Metrics router — OSHA dashboard calculations.
 *
 * Metrics implemented:
 *
 *   TRIR (Total Recordable Incident Rate) / TCIR:
 *     = (total recordable cases × 200,000) / total hours worked
 *     Standardized to 100 full-time employees working 2,000 hrs/yr.
 *
 *   DART rate (Days Away, Restricted, or Transferred):
 *     = (cases with ≥1 day away OR ≥1 day restricted/transfer × 200,000)
 *       / total hours worked
 *
 *   Severity rate (lost workday rate):
 *     = (total days away × 200,000) / total hours worked
 *
 *   Trailing 12-month trend:
 *     Aggregates month-by-month incident counts for the chart.
 *
 * All rates use 200,000 as the base (100 employees × 2,000 hours/year).
 */

import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { TRPCError } from "@trpc/server";

const BASE_HOURS = 200_000; // 100 FTE × 2,000 hrs/yr

function rate(numerator: number, hoursWorked: number): number | null {
  if (hoursWorked <= 0) return null;
  return (numerator * BASE_HOURS) / hoursWorked;
}

export const metricsRouter = router({
  /**
   * Dashboard summary metrics for a single reporting year.
   * Returns TRIR, DART, severity rate, and case counts by outcome.
   */
  dashboard: protectedProcedure
    .input(z.object({ reportingYearId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ry = await ctx.prisma.reportingYear.findUniqueOrThrow({
        where: { id: input.reportingYearId },
        include: { establishment: true },
      });

      if (!ry.totalHoursWorked) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Total hours worked must be set on the reporting year before calculating rates.",
        });
      }

      const cases = await ctx.prisma.case.findMany({
        where: { reportingYearId: input.reportingYearId, isRecordable: true },
        select: {
          outcome: true,
          daysAway: true,
          daysRestricted: true,
          caseType: true,
          dateOfInjury: true,
        },
      });

      const totalRecordable = cases.length;

      // DART cases: those with ≥1 day away OR ≥1 day restricted/transfer
      const dartCases = cases.filter(
        (c) => c.daysAway > 0 || c.daysRestricted > 0
      ).length;

      const totalDaysAway = cases.reduce((sum, c) => sum + c.daysAway, 0);
      const totalDaysRestricted = cases.reduce((sum, c) => sum + c.daysRestricted, 0);

      // By outcome
      const byOutcome = {
        DEATH: cases.filter((c) => c.outcome === "DEATH").length,
        DAYS_AWAY: cases.filter((c) => c.outcome === "DAYS_AWAY").length,
        RESTRICTED_TRANSFER: cases.filter((c) => c.outcome === "RESTRICTED_TRANSFER").length,
        OTHER_RECORDABLE: cases.filter((c) => c.outcome === "OTHER_RECORDABLE").length,
      };

      // By type (injury vs illness)
      const injuries = cases.filter((c) => c.caseType === "INJURY").length;
      const illnesses = cases.filter((c) => c.caseType !== "INJURY").length;

      return {
        establishmentName: ry.establishment.name,
        year: ry.year,
        avgEmployees: ry.avgEmployees,
        totalHoursWorked: ry.totalHoursWorked,
        totalRecordable,
        dartCases,
        totalDaysAway,
        totalDaysRestricted,
        byOutcome,
        injuries,
        illnesses,
        rates: {
          trir: rate(totalRecordable, ry.totalHoursWorked),
          dart: rate(dartCases, ry.totalHoursWorked),
          severityRate: rate(totalDaysAway, ry.totalHoursWorked),
          daysRestrictedRate: rate(totalDaysRestricted, ry.totalHoursWorked),
        },
        baseHours: BASE_HOURS,
      };
    }),

  /**
   * Trailing 12-month trend — returns monthly case counts for the last 12 months
   * ending in the month of the latest case in the given reporting year.
   */
  trend: protectedProcedure
    .input(z.object({ reportingYearId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ry = await ctx.prisma.reportingYear.findUniqueOrThrow({
        where: { id: input.reportingYearId },
      });

      const cases = await ctx.prisma.case.findMany({
        where: { reportingYearId: input.reportingYearId, isRecordable: true },
        select: { dateOfInjury: true, outcome: true, daysAway: true, daysRestricted: true },
        orderBy: { dateOfInjury: "asc" },
      });

      // Build month buckets for the full reporting year
      const months: Record<string, { month: string; total: number; dart: number; daysAway: number }> = {};
      for (let m = 0; m < 12; m++) {
        const key = `${ry.year}-${String(m + 1).padStart(2, "0")}`;
        months[key] = { month: key, total: 0, dart: 0, daysAway: 0 };
      }

      for (const c of cases) {
        const d = new Date(c.dateOfInjury);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        if (months[key]) {
          months[key].total++;
          if (c.daysAway > 0 || c.daysRestricted > 0) months[key].dart++;
          months[key].daysAway += c.daysAway;
        }
      }

      return Object.values(months);
    }),

  /**
   * Multi-year comparison for an establishment — returns TRIR and DART
   * for each available reporting year (useful for trend analysis).
   */
  multiYear: protectedProcedure
    .input(z.object({ establishmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const years = await ctx.prisma.reportingYear.findMany({
        where: { establishmentId: input.establishmentId },
        orderBy: { year: "asc" },
        include: {
          cases: {
            where: { isRecordable: true },
            select: { outcome: true, daysAway: true, daysRestricted: true },
          },
        },
      });

      return years.map((ry) => {
        const total = ry.cases.length;
        const dart = ry.cases.filter((c) => c.daysAway > 0 || c.daysRestricted > 0).length;
        const hours = ry.totalHoursWorked ?? 0;
        return {
          year: ry.year,
          totalRecordable: total,
          dartCases: dart,
          trir: rate(total, hours),
          dartRate: rate(dart, hours),
          totalHoursWorked: ry.totalHoursWorked,
          avgEmployees: ry.avgEmployees,
        };
      });
    }),
});
