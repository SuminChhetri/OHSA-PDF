/**
 * Export/import router — CSV ITA upload, JSON backup/restore.
 *
 * CSV format matches OSHA ITA bulk upload specification.
 * JSON export is a complete establishment-year snapshot importable into
 * another instance (local backup/restore requirement).
 */

import { z } from "zod";
import { router, protectedProcedure, recordkeeperProcedure, adminProcedure } from "../trpc.js";

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

  /**
   * Export Forms 300 and 301 case data as CSV for ITA bulk submission.
   * Applies field exclusions per 1904.41(c):
   *   - Form 300: employee name excluded
   *   - Form 301: employee name, home address, physician name, facility info excluded
   */
  csvITA300And301: protectedProcedure
    .input(z.object({ reportingYearId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ry = await ctx.prisma.reportingYear.findUniqueOrThrow({
        where: { id: input.reportingYearId },
        include: { establishment: true },
      });

      const cases = await ctx.prisma.case.findMany({
        where: { reportingYearId: input.reportingYearId, isRecordable: true },
        orderBy: { caseNumber: "asc" },
      });

      const headers300 = [
        "case_number", "job_title", "date_of_injury",
        "where_event_occurred", "what_happened",
        "outcome", "days_away", "days_restricted", "case_type",
        // employee_name excluded per 1904.41(c)(1)
      ];

      const rows300 = cases.map((c) => [
        c.caseNumber,
        `"${c.employeeJobTitle}"`,
        new Date(c.dateOfInjury).toISOString().slice(0, 10),
        `"${c.whereEventOccurred.replace(/"/g, '""')}"`,
        c.isPrivacyCase ? '"description withheld"' : `"${c.whatHappened.replace(/"/g, '""')}"`,
        c.outcome,
        c.daysAway,
        c.daysRestricted,
        c.caseType,
      ]);

      const csv300 = [headers300.join(","), ...rows300.map((r) => r.join(","))].join("\n");

      const headers301 = [
        "case_number", "job_title", "date_of_birth", "date_hired",
        "date_of_injury", "time_of_injury",
        "where_event_occurred", "what_employee_was_doing", "what_happened",
        "body_part_affected", "object_or_substance",
        "treated_in_er", "hospitalized_overnight",
        // employee_name, home_address, physician_name, facility info excluded per 1904.41(c)(2)
      ];

      const rows301 = cases.map((c) => [
        c.caseNumber,
        `"${c.employeeJobTitle}"`,
        c.employeeDOB ? new Date(c.employeeDOB).toISOString().slice(0, 10) : "",
        c.employeeHireDate ? new Date(c.employeeHireDate).toISOString().slice(0, 10) : "",
        new Date(c.dateOfInjury).toISOString().slice(0, 10),
        c.timeOfInjury ?? "",
        `"${c.whereEventOccurred.replace(/"/g, '""')}"`,
        `"${c.whatEmployeeWasDoing.replace(/"/g, '""')}"`,
        c.isPrivacyCase ? '"description withheld"' : `"${c.whatHappened.replace(/"/g, '""')}"`,
        `"${c.bodyPartAffected}"`,
        `"${c.objectOrSubstance}"`,
        c.treatedInEmergencyRoom ? "Y" : "N",
        c.hospitalizedOvernight ? "Y" : "N",
      ]);

      const csv301 = [headers301.join(","), ...rows301.map((r) => r.join(","))].join("\n");

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "EXPORT",
          entityType: "ITA_300_301_CSV",
          entityId: input.reportingYearId,
          reason: "ITA 300/301 CSV export",
        },
      });

      return {
        csv300,
        csv301,
        filename300: `ITA_300_${ry.year}.csv`,
        filename301: `ITA_301_${ry.year}.csv`,
        excludedFieldsNote: "Employee name, home address, physician name, and facility info are excluded per 29 CFR 1904.41(c).",
      };
    }),

  /**
   * JSON backup — export the complete establishment-year snapshot.
   * Importable into another instance for local backup/restore.
   */
  jsonBackup: adminProcedure
    .input(z.object({ reportingYearId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ry = await ctx.prisma.reportingYear.findUniqueOrThrow({
        where: { id: input.reportingYearId },
        include: {
          establishment: true,
          cases: true,
          certifications: true,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "EXPORT",
          entityType: "JSON_BACKUP",
          entityId: input.reportingYearId,
          reason: "Full JSON backup export",
        },
      });

      return {
        schemaVersion: "1",
        exportedAt: new Date().toISOString(),
        reportingYear: ry,
        filename: `backup_${ry.establishment.name.replace(/\s+/g, "_")}_${ry.year}.json`,
      };
    }),

  /**
   * JSON restore — import a backup snapshot.
   * Creates a new establishment and reporting year from the backup payload.
   * Admin only.
   */
  jsonRestore: adminProcedure
    .input(
      z.object({
        payload: z.object({
          schemaVersion: z.string(),
          reportingYear: z.object({
            year: z.number(),
            avgEmployees: z.number().optional().nullable(),
            totalHoursWorked: z.number().optional().nullable(),
            establishment: z.object({
              name: z.string(),
              street: z.string(),
              city: z.string(),
              state: z.string(),
              zip: z.string(),
              naicsCode: z.string(),
              sicCode: z.string().optional().nullable(),
            }),
            cases: z.array(z.any()),
          }),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const src = input.payload.reportingYear;

      const establishment = await ctx.prisma.establishment.create({
        data: src.establishment,
      });

      const ry = await ctx.prisma.reportingYear.create({
        data: {
          establishmentId: establishment.id,
          year: src.year,
          avgEmployees: src.avgEmployees ?? undefined,
          totalHoursWorked: src.totalHoursWorked ?? undefined,
        },
      });

      let restored = 0;
      for (const c of src.cases) {
        const { id: _id, reportingYearId: _ry, createdAt: _ca, updatedAt: _ua, ...caseData } = c;
        await ctx.prisma.case.create({
          data: {
            ...caseData,
            reportingYearId: ry.id,
            createdById: ctx.session.user.id,
            updatedById: ctx.session.user.id,
          },
        });
        restored++;
      }

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "CREATE",
          entityType: "JSON_RESTORE",
          entityId: ry.id,
          reason: `Restored ${restored} cases from JSON backup`,
        },
      });

      return { establishmentId: establishment.id, reportingYearId: ry.id, casesRestored: restored };
    }),
});
