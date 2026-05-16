/**
 * GET /api/pdf/300/[yearId]
 * Fills the official OSHA Form 300 with case data and returns it.
 *
 * Query params:
 *   ?download=1  → attachment + locked (force download, non-fillable)
 *   ?lock=1      → inline + locked (View Only — no download prompt)
 *   (default)    → inline + fillable
 */

import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { appRouter } from "@/server/routers/_app";
import { createInnerTRPCContext } from "@/server/context";
import { fill300 } from "@/lib/pdf/osha-filler";

export async function GET(
  req: NextRequest,
  { params }: { params: { yearId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await createInnerTRPCContext(session);
  const caller = appRouter.createCaller(ctx);

  try {
    const data = await caller.forms.get300Log({ reportingYearId: params.yearId });

    if (!data?.establishment) {
      return NextResponse.json({ error: "Reporting year not found" }, { status: 404 });
    }
    const sp = req.nextUrl.searchParams;
    const forceDownload = sp.get("download") === "1";
    const lockOnly = sp.get("lock") === "1";
    const lock = forceDownload || lockOnly;

    await ctx.prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: forceDownload ? "DOWNLOAD_UNREDACTED" : "PDF_VIEW",
        entityType: "Form300",
        entityId: params.yearId,
        reason: forceDownload ? "Form 300 PDF downloaded" : "Form 300 PDF viewed inline",
      },
    });

    const pdfBytes = await fill300(
      {
        establishment: {
          name: data.establishment.name,
          city: data.establishment.city,
          state: data.establishment.state,
          naicsCode: data.establishment.naicsCode,
        },
        year: data.year,
        cases: data.rows.map((r) => ({
          caseNumber: r.caseNumber,
          employeeName: r.employeeName ?? "",
          employeeJobTitle: r.employeeJobTitle ?? "",
          dateOfInjury: r.dateOfInjury,
          whereEventOccurred: r.whereEventOccurred ?? "",
          whatHappened: r.whatHappened ?? "",
          isPrivacyCase: r.isPrivacyCase ?? false,
          outcome: r.outcome ?? "",
          daysAway: r.daysAway ?? 0,
          daysRestricted: r.daysRestricted ?? 0,
          caseType: r.caseType ?? "",
        })),
      },
      lock
    );

    const filename = `OSHA-300-${data.establishment.name.replace(/[^a-z0-9]/gi, "_")}-${data.year}.pdf`;

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
    console.error("fill300 error:", err);
    return NextResponse.json(
      { error: `Failed to fill OSHA Form 300: ${String(err)}` },
      { status: 500 }
    );
  }
}
