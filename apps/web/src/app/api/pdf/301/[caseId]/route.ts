/**
 * GET /api/pdf/301/[caseId]
 * Fills the official OSHA Form 301 with incident data and returns it.
 * ?download=1  → attachment (force download)
 * default      → inline (view in browser)
 */

import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { appRouter } from "@/server/routers/_app";
import { createInnerTRPCContext } from "@/server/context";
import { fill301 } from "@/lib/pdf/osha-filler";

export async function GET(
  req: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await createInnerTRPCContext(session);
  const caller = appRouter.createCaller(ctx);
  const c = await caller.cases.get({ id: params.caseId });

  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  await ctx.prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DOWNLOAD_UNREDACTED",
      entityType: "Form301",
      entityId: params.caseId,
      caseId: params.caseId,
      reason: "Form 301 PDF viewed/downloaded",
    },
  });

  try {
    const sp = req.nextUrl.searchParams;
    const forceDownload = sp.get("download") === "1";
    const lockOnly = sp.get("lock") === "1";
    const lock = forceDownload || lockOnly;
    const pdfBytes = await fill301({
      caseNumber: c.caseNumber as string,
      employeeName: (c.employeeName as string) ?? "",
      employeeJobTitle: (c.employeeJobTitle as string) ?? "",
      employeeDOB: c.employeeDOB as Date | null,
      employeeHireDate: c.employeeHireDate as Date | null,
      employeeStreet: c.employeeStreet as string | null,
      employeeCity: c.employeeCity as string | null,
      employeeState: c.employeeState as string | null,
      employeeZip: c.employeeZip as string | null,
      dateOfInjury: c.dateOfInjury as Date,
      timeOfInjury: c.timeOfInjury as string | null,
      whereEventOccurred: (c.whereEventOccurred as string) ?? "",
      whatEmployeeWasDoing: (c.whatEmployeeWasDoing as string) ?? "",
      whatHappened: (c.whatHappened as string) ?? "",
      bodyPartAffected: (c.bodyPartAffected as string) ?? "",
      objectOrSubstance: (c.objectOrSubstance as string) ?? "",
      treatedInEmergencyRoom: (c.treatedInEmergencyRoom as boolean) ?? false,
      hospitalizedOvernight: (c.hospitalizedOvernight as boolean) ?? false,
      physicianName: c.physicianName as string | null,
      facilityName: c.facilityName as string | null,
      facilityStreet: c.facilityStreet as string | null,
      facilityCity: c.facilityCity as string | null,
      facilityState: c.facilityState as string | null,
      facilityZip: c.facilityZip as string | null,
      outcome: (c.outcome as string) ?? "",
      daysAway: (c.daysAway as number) ?? 0,
      daysRestricted: (c.daysRestricted as number) ?? 0,
      caseType: (c.caseType as string) ?? "",
      isPrivacyCase: (c.isPrivacyCase as boolean) ?? false,
    }, lock);

    const filename = `OSHA-301-Case-${c.caseNumber}.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": forceDownload
          ? `attachment; filename="${filename}"`
          : `inline; filename="${filename}"`,
        "Content-Length": String(pdfBytes.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("fill301 error:", err);
    return NextResponse.json(
      { error: `Failed to fill OSHA Form 301: ${String(err)}` },
      { status: 500 }
    );
  }
}
