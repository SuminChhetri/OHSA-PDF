/**
 * API route: GET /api/pdf/301/[caseId]
 * Generates a server-side PDF of OSHA Form 301 (Injury and Illness Incident Report).
 * Letter portrait (8.5in × 11in) · 29 CFR 1904.29(b)
 */

import { type NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { appRouter } from "@/server/routers/_app";
import { createInnerTRPCContext } from "@/server/context";
import { Form301Pdf, type Form301CaseData } from "@/lib/pdf/form301";

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

  const caseData: Form301CaseData = {
    caseNumber: c.caseNumber,
    employeeName: c.employeeName ?? "",
    employeeJobTitle: c.employeeJobTitle ?? "",
    employeeDOB: c.employeeDOB,
    employeeHireDate: c.employeeHireDate,
    employeeStreet: c.employeeStreet,
    employeeCity: c.employeeCity,
    employeeState: c.employeeState,
    employeeZip: c.employeeZip,
    dateOfInjury: c.dateOfInjury,
    timeOfInjury: c.timeOfInjury,
    whereEventOccurred: c.whereEventOccurred ?? "",
    whatEmployeeWasDoing: c.whatEmployeeWasDoing ?? "",
    whatHappened: c.whatHappened ?? "",
    bodyPartAffected: c.bodyPartAffected ?? "",
    objectOrSubstance: c.objectOrSubstance ?? "",
    treatedInEmergencyRoom: c.treatedInEmergencyRoom ?? false,
    hospitalizedOvernight: c.hospitalizedOvernight ?? false,
    physicianName: c.physicianName,
    facilityName: c.facilityName,
    facilityStreet: c.facilityStreet,
    facilityCity: c.facilityCity,
    facilityState: c.facilityState,
    facilityZip: c.facilityZip,
    outcome: c.outcome ?? "",
    daysAway: c.daysAway ?? 0,
    daysRestricted: c.daysRestricted ?? 0,
    caseType: c.caseType ?? "",
    isPrivacyCase: c.isPrivacyCase ?? false,
    privacyReason: c.privacyReason,
    severityLevel: c.severityLevel,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(React.createElement(Form301Pdf, { caseData }) as any);

  const filename = `OSHA-301-Case-${c.caseNumber}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.byteLength),
    },
  });
}
