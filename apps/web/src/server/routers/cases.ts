/**
 * Cases router — OSHA Form 301 CRUD with 300 Log field management.
 *
 * Privacy enforcement:
 *   - employeeName and PII fields are always stored in the DB.
 *   - On read, if isPrivacyCase is true and the user is not ADMIN, the
 *     employeeName is replaced with "privacy case" and PII fields are stripped.
 *   - Accessing the real name on a privacy case is logged as VIEW_PRIVACY.
 *
 * Audit trail:
 *   - Every create/update/delete is written to audit_logs (append-only).
 *   - The 'before' snapshot is captured before every update.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, recordkeeperProcedure } from "../trpc.js";
import {
  CaseOutcome,
  CaseType,
  PrivacyReason,
  SeverityLevel,
} from "@osha/regulatory-logic";
import { encryptCaseFields, decryptCaseFields } from "../../lib/crypto.js";
import { canViewSensitiveData, redactCase } from "../../lib/redact.js";

// Zod enum helpers derived from regulatory-logic enums
const zCaseOutcome = z.enum([
  CaseOutcome.DEATH,
  CaseOutcome.DAYS_AWAY,
  CaseOutcome.RESTRICTED_TRANSFER,
  CaseOutcome.OTHER_RECORDABLE,
]);

const zCaseType = z.enum([
  CaseType.INJURY,
  CaseType.SKIN_DISORDER,
  CaseType.RESPIRATORY,
  CaseType.POISONING,
  CaseType.HEARING_LOSS,
  CaseType.ALL_OTHER_ILLNESS,
]);

const zPrivacyReason = z.enum([
  PrivacyReason.INTIMATE_BODY_PART,
  PrivacyReason.SEXUAL_ASSAULT,
  PrivacyReason.MENTAL_ILLNESS,
  PrivacyReason.HIV_HEPATITIS_TB,
  PrivacyReason.NEEDLESTICK,
  PrivacyReason.EMPLOYEE_REQUEST,
]).optional();

const zSeverityLevel = z.enum([
  SeverityLevel.FATALITY,
  SeverityLevel.HOSPITALIZATION,
  SeverityLevel.AMPUTATION,
  SeverityLevel.EYE_LOSS,
]).optional();

const CaseUpsertInput = z.object({
  // 301 — Employee
  employeeName: z.string().min(1),
  employeeJobTitle: z.string().min(1),
  employeeDOB: z.date().optional(),
  employeeHireDate: z.date().optional(),
  employeeStreet: z.string().optional(),
  employeeCity: z.string().optional(),
  employeeState: z.string().optional(),
  employeeZip: z.string().optional(),
  // 301 — Incident
  dateOfInjury: z.date(),
  timeOfInjury: z.string().optional(),
  whereEventOccurred: z.string().min(1),
  whatEmployeeWasDoing: z.string().min(1),
  whatHappened: z.string().min(1),
  bodyPartAffected: z.string().min(1),
  objectOrSubstance: z.string().min(1),
  // 301 — Medical
  treatedInEmergencyRoom: z.boolean().default(false),
  hospitalizedOvernight: z.boolean().default(false),
  physicianName: z.string().optional(),
  facilityName: z.string().optional(),
  facilityStreet: z.string().optional(),
  facilityCity: z.string().optional(),
  facilityState: z.string().optional(),
  facilityZip: z.string().optional(),
  // 300 Log
  isPrivacyCase: z.boolean().default(false),
  privacyReason: zPrivacyReason,
  outcome: zCaseOutcome,
  daysAway: z.number().int().min(0).max(180).default(0),
  daysRestricted: z.number().int().min(0).max(180).default(0),
  caseType: zCaseType,
  isRecordable: z.boolean().default(true),
  wizardAnswers: z.string().optional(), // JSON
  // 1904.39
  severityLevel: zSeverityLevel,
  severeReportedAt: z.date().optional(),
  severeReportMethod: z.string().optional(),
});

/** Strip PII from a case before returning it for non-admin privacy cases. */
function applyPrivacyMask<T extends { isPrivacyCase: boolean; employeeName: string }>(
  c: T,
  userRole: string
): T {
  if (!c.isPrivacyCase) return c;
  if (userRole === "ADMIN") return c;
  return {
    ...c,
    employeeName: "privacy case",
    employeeDOB: null,
    employeeHireDate: null,
    employeeStreet: null,
    employeeCity: null,
    employeeState: null,
    employeeZip: null,
  };
}

export const casesRouter = router({
  /** List all cases for a reporting year (300 Log view). */
  list: protectedProcedure
    .input(z.object({ reportingYearId: z.string() }))
    .query(async ({ ctx, input }) => {
      const cases = await ctx.prisma.case.findMany({
        where: { reportingYearId: input.reportingYearId },
        orderBy: { caseNumber: "asc" },
      });
      const role = ctx.session.user.role;
      return cases.map((c) => {
        const decrypted = decryptCaseFields(applyPrivacyMask(c, role));
        return canViewSensitiveData(role) ? decrypted : redactCase(decrypted);
      });
    }),

  /** Get a single case (Form 301 view). Logs VIEW_PRIVACY for admin access to privacy cases. */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const c = await ctx.prisma.case.findUniqueOrThrow({ where: { id: input.id } });
      const role = ctx.session.user.role;

      if (c.isPrivacyCase && role === "ADMIN") {
        await ctx.prisma.auditLog.create({
          data: {
            userId: ctx.session.user.id,
            action: "VIEW_PRIVACY",
            entityType: "Case",
            entityId: c.id,
            caseId: c.id,
            reason: "Admin viewed privacy case PII",
          },
        });
      }

      const decrypted = decryptCaseFields(applyPrivacyMask(c, role));
      return canViewSensitiveData(role) ? decrypted : redactCase(decrypted);
    }),

  /**
   * Get the confidential privacy case roster for a reporting year.
   * Per 1904.29(b)(6): maintain a separate list of case numbers and employee names
   * for privacy cases, available to government representatives upon request.
   * Admin-only access.
   */
  getPrivacyRoster: protectedProcedure
    .input(z.object({ reportingYearId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required to view privacy roster." });
      }

      const privacyCases = await ctx.prisma.case.findMany({
        where: { reportingYearId: input.reportingYearId, isPrivacyCase: true },
        select: { id: true, caseNumber: true, employeeName: true, privacyReason: true, dateOfInjury: true },
        orderBy: { caseNumber: "asc" },
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "VIEW_PRIVACY",
          entityType: "PrivacyRoster",
          entityId: input.reportingYearId,
          reason: "Admin accessed privacy case roster",
        },
      });

      return privacyCases;
    }),

  /** Create a new case (Form 301 entry). Auto-assigns case number. */
  create: recordkeeperProcedure
    .input(
      z.object({
        reportingYearId: z.string(),
        caseData: CaseUpsertInput,
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate next sequential case number within the reporting year
      const ry = await ctx.prisma.reportingYear.findUniqueOrThrow({
        where: { id: input.reportingYearId },
      });
      const existingCount = await ctx.prisma.case.count({
        where: { reportingYearId: input.reportingYearId },
      });
      const caseNumber = `${ry.year}-${String(existingCount + 1).padStart(3, "0")}`;

      const encryptedData = encryptCaseFields({ ...input.caseData });

      const created = await ctx.prisma.case.create({
        data: {
          ...encryptedData,
          reportingYearId: input.reportingYearId,
          caseNumber,
          createdById: ctx.session.user.id,
          updatedById: ctx.session.user.id,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "CREATE",
          entityType: "Case",
          entityId: created.id,
          caseId: created.id,
          after: JSON.stringify({ caseNumber, outcome: created.outcome }),
          reason: "New case created",
        },
      });

      return created;
    }),

  /** Update a case. Records before/after snapshot in audit log. */
  update: recordkeeperProcedure
    .input(
      z.object({
        id: z.string(),
        caseData: CaseUpsertInput.partial(),
        reason: z.string().min(1, "A reason for the update is required per 1904.33 update obligations."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const before = await ctx.prisma.case.findUniqueOrThrow({ where: { id: input.id } });

      const encryptedData = encryptCaseFields({ ...input.caseData });

      const updated = await ctx.prisma.case.update({
        where: { id: input.id },
        data: { ...encryptedData, updatedById: ctx.session.user.id },
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "UPDATE",
          entityType: "Case",
          entityId: input.id,
          caseId: input.id,
          before: JSON.stringify(before),
          after: JSON.stringify(updated),
          reason: input.reason,
        },
      });

      return updated;
    }),

  /**
   * Soft-delete a case (marks isRecordable = false and logs deletion).
   * Hard deletion is NOT performed — the audit log must be retained per 1904.33.
   */
  delete: recordkeeperProcedure
    .input(
      z.object({
        id: z.string(),
        reason: z.string().min(1, "A reason is required."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const before = await ctx.prisma.case.findUniqueOrThrow({ where: { id: input.id } });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.session.user.id,
          action: "DELETE",
          entityType: "Case",
          entityId: input.id,
          caseId: input.id,
          before: JSON.stringify(before),
          reason: input.reason,
        },
      });

      // Soft delete — update rather than destroy; audit trail remains intact
      return ctx.prisma.case.update({
        where: { id: input.id },
        data: { isRecordable: false, updatedById: ctx.session.user.id },
      });
    }),
});
