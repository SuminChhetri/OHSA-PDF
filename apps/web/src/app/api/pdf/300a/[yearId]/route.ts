/**
 * API route: GET /api/pdf/300a/[yearId]
 * Generates a server-side PDF of OSHA Form 300A (Annual Summary).
 * Letter landscape (11in × 8.5in) · 29 CFR 1904.32
 */

import { type NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { appRouter } from "@/server/routers/_app";
import { createInnerTRPCContext } from "@/server/context";
import { Form300APdf, type Form300AData } from "@/lib/pdf/form300a";

export async function GET(
  _req: NextRequest,
  { params }: { params: { yearId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ctx = await createInnerTRPCContext(session);
  const caller = appRouter.createCaller(ctx);

  const data = await caller.forms.get300A({ reportingYearId: params.yearId });

  if (!data?.establishment) {
    return NextResponse.json({ error: "Reporting year not found" }, { status: 404 });
  }

  const props: Form300AData = {
    establishment: data.establishment,
    year: data.year,
    avgEmployees: data.avgEmployees,
    totalHoursWorked: data.totalHoursWorked,
    totals: data.totals,
    certification: data.certification,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(React.createElement(Form300APdf, props) as any);

  const filename = `OSHA-300A-${data.establishment.name.replace(/[^a-z0-9]/gi, "_")}-${data.year}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.byteLength),
    },
  });
}
