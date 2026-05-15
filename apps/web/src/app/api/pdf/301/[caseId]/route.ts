/**
 * API route: GET /api/pdf/301/[caseId]
 * Generates a server-side PDF of OSHA Form 301 (Injury and Illness Incident Report).
 * Letter portrait (8.5in × 11in) · 29 CFR 1904.29(b)
 *
 * Query params:
 *   ?redacted=1   Force redacted output (overrides role-based logic).
 *                 Roles without canDownloadUnredacted always get the redacted version.
 */

import { type NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { appRouter } from "@/server/routers/_app";
import { createInnerTRPCContext } from "@/server/context";
import { Form301Pdf, type Form301CaseData } from "@/lib/pdf/form301";
import { canDownloadUnredacted, redactCase } from "@/lib/redact";

export async function GET(
  _req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await createInnerTRPCContext(session);
  const caller = appRouter.createCaller(ctx);

  const c = await caller.cases.get({ id: params.caseId });

  if (!c) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const redactedParam = _req.nextUrl.searchParams.get("redacted");
  const role = session.user.role;
  const useRedacted = redactedParam === "1" || !canDownloadUnredacted(role);

  // Log the download event to the audit trail
  await ctx.prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: useRedacted ? "DOWNLOAD_REDACTED" : "DOWNLOAD_UNREDACTED",
      entityType: "Form301",
      entityId: params.caseId,
      caseId: params.caseId,
      reason: `Form 301 PDF downloaded (${useRedacted ? "redacted" : "unredacted"})`,
    },
  });

  const finalCaseData = useRedacted ? redactCase(c as Record<string, unknown>) : c;

  const caseData: Form301CaseData = {
    caseNumber: finalCaseData.caseNumber as string,
    employeeName: (finalCaseData.employeeName as string) ?? "",
    employeeJobTitle: (finalCaseData.employeeJobTitle as string) ?? "",
    employeeDOB: finalCaseData.employeeDOB as Date | null | undefined,
    employeeHireDate: finalCaseData.employeeHireDate as Date | null | undefined,
    employeeStreet: finalCaseData.employeeStreet as string | null | undefined,
    employeeCity: finalCaseData.employeeCity as string | null | undefined,
    employeeState: finalCaseData.employeeState as string | null | undefined,
    employeeZip: finalCaseData.employeeZip as string | null | undefined,
    dateOfInjury: finalCaseData.dateOfInjury as Date,
    timeOfInjury: finalCaseData.timeOfInjury as string | null | undefined,
    whereEventOccurred: (finalCaseData.whereEventOccurred as string) ?? "",
    whatEmployeeWasDoing: (finalCaseData.whatEmployeeWasDoing as string) ?? "",
    whatHappened: (finalCaseData.whatHappened as string) ?? "",
    bodyPartAffected: (finalCaseData.bodyPartAffected as string) ?? "",
    objectOrSubstance: (finalCaseData.objectOrSubstance as string) ?? "",
    treatedInEmergencyRoom: (finalCaseData.treatedInEmergencyRoom as boolean) ?? false,
    hospitalizedOvernight: (finalCaseData.hospitalizedOvernight as boolean) ?? false,
    physicianName: finalCaseData.physicianName as string | null | undefined,
    facilityName: finalCaseData.facilityName as string | null | undefined,
    facilityStreet: finalCaseData.facilityStreet as string | null | undefined,
    facilityCity: finalCaseData.facilityCity as string | null | undefined,
    facilityState: finalCaseData.facilityState as string | null | undefined,
    facilityZip: finalCaseData.facilityZip as string | null | undefined,
    outcome: (finalCaseData.outcome as string) ?? "",
    daysAway: (finalCaseData.daysAway as number) ?? 0,
    daysRestricted: (finalCaseData.daysRestricted as number) ?? 0,
    caseType: (finalCaseData.caseType as string) ?? "",
    isPrivacyCase: (finalCaseData.isPrivacyCase as boolean) ?? false,
    privacyReason: finalCaseData.privacyReason as string | null | undefined,
    severityLevel: finalCaseData.severityLevel as string | null | undefined,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(React.createElement(Form301Pdf, { caseData }) as any);

  const filename = `OSHA-301-Case-${c.caseNumber}${useRedacted ? "-redacted" : ""}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.byteLength),
    },
  });
}
