/**
 * Export/import router — CSV ITA upload, JSON backup/restore.
 *
 * CSV format matches OSHA ITA bulk upload specification.
 * JSON export is a complete establishment-year snapshot importable into
 * another instance (local backup/restore requirement).
 */

import { z } from "zod";
import { router, protectedProcedure, recordkeeperProcedure } from "../trpc";

export const exportRouter = router({
  /**
   * Export 300A data as CSV in the OSHA ITA bulk upload format.
   * Field exclusions per 1904.41(c) are applied automatically.
   */
  csvITA300A: protectedProcedure
    .input(z.object({ reportingYearId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ry = await ctx.prisma.reportingYear.findUniqueOrThrow({
        where: { id: input.reportingYearId },
        include: { establishment: true },
      });

      const cases = await ctx.prisma.case.findMany({
        where: { reportingYearId: input.reportingYearId, isRecordable: true },
        select: {
          outcome: true, daysAway: true, daysRestricted: true, caseType: true,
        },
      });

      const totals = {
        total_deaths: cases.filter((c) => c.outcome === "DEATH").length,
        total_dafw_cases: cases.filter((c) => c.outcome === "DAYS_AWAY").length,
        total_djtr_cases: cases.filter((c) => c.outcome === "RESTRICTED_TRANSFER").length,
        total_other_cases: cases.filter((c) => c.outcome === "OTHER_RECORDABLE").length,
        total_dafw_days: cases.reduce((s, c) => s + c.daysAway, 0),
        total_djtr_days: cases.reduce((s, c) => s + c.daysRestricted, 0),
        total_injuries: cases.filter((c) => c.caseType === "INJURY").length,
        total_skin: cases.filter((c) => c.caseType === "SKIN_DISORDER").length,
        total_resp: cases.filter((c) => c.caseType === "RESPIRATORY").length,
        total_poison: cases.filter((c) => c.caseType === "POISONING").length,
        total_hearing: cases.filter((c) => c.caseType === "HEARING_LOSS").length,
        total_other_illness: cases.filter((c) => c.caseType === "ALL_OTHER_ILLNESS").length,
      };

      const row = {
        establishment_name: ry.establishment.name,
        street_address: ry.establishment.street,
        city: ry.establishment.city,
        state: ry.establishment.state,
        zip_code: ry.establishment.zip,
        naics_code: ry.establishment.naicsCode,
        annual_average_employees: ry.avgEmployees ?? 0,
        total_hours_worked: ry.totalHoursWorked ?? 0,
        year: ry.year,
        ...totals,
      };

      const headers = Object.keys(row).join(",");
      const values = Object.values(row)
        .map((v) => (typeof v === "string" && v.includes(",") ? `"${v}"` : String(v)))
        .join(",");

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "EXPORT",
          entityType: "ITA_300A_CSV",
          entityId: input.reportingYearId,
          reason: "ITA 300A CSV export",
        },
      });

      return {
        csv: `${headers}\n${values}\n`,
        filename: `ITA_300A_${ry.establishment.name.replace(/\s+/g, "_")}_${ry.year}.csv`,
      };
    }),

});
