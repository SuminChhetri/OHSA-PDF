/**
 * GET /api/pdf/300a/[yearId]
 * Fetches the official OSHA Form 300A PDF from osha.gov, fills it with
 * real data from the database, and returns it.
 *
 * Query params:
 *   ?download=1           → Content-Disposition: attachment + locked (non-fillable)
 *   ?download=1&redacted=1 → attachment + locked + establishment details redacted
 *   ?lock=1               → inline + locked (View Only — no download prompt)
 *   (default)             → inline + fillable (for Edit Directly on PDF)
 */

import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { appRouter } from "@/server/routers/_app";
import { createInnerTRPCContext } from "@/server/context";
import { fill300A } from "@/lib/pdf/osha-filler";

export async function GET(
  req: NextRequest,
  { params }: { params: { yearId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await createInnerTRPCContext(session);
  const caller = appRouter.createCaller(ctx);
  const data = await caller.forms.get300A({ reportingYearId: params.yearId });

  if (!data?.establishment) {
    return NextResponse.json({ error: "Reporting year not found" }, { status: 404 });
  }

  await ctx.prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DOWNLOAD_UNREDACTED",
      entityType: "Form300A",
      entityId: params.yearId,
      reason: "Form 300A PDF viewed/downloaded",
    },
  });

  try {
    const sp = req.nextUrl.searchParams;
    const forceDownload = sp.get("download") === "1";
    const lockOnly = sp.get("lock") === "1";
    const redacted = sp.get("redacted") === "1";

    // Lock when downloading (always) or when explicitly requested for view-only
    const lock = forceDownload || lockOnly;

    const pdfBytes = await fill300A(
      {
        establishment: data.establishment,
        year: data.year,
        avgEmployees: data.avgEmployees,
        totalHoursWorked: data.totalHoursWorked,
        totals: data.totals,
        certification: data.certification,
      },
      lock,
      redacted
    );

    const safeName = data.establishment.name.replace(/[^a-z0-9]/gi, "_");
    const filename = redacted
      ? `OSHA-300A-Redacted-${data.year}.pdf`
      : `OSHA-300A-${safeName}-${data.year}.pdf`;

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
    console.error("fill300A error:", err);
    return NextResponse.json(
      { error: `Failed to fill OSHA Form 300A: ${String(err)}` },
      { status: 500 }
    );
  }
}
