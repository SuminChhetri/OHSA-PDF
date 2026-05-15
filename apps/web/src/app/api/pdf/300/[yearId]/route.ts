/**
 * API route: GET /api/pdf/300/[yearId]
 * Generates a server-side PDF of OSHA Form 300 (Log of Work-Related Injuries and Illnesses).
 * Legal landscape (14in × 8.5in) · 29 CFR 1904.29(b)
 */

import { type NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { appRouter } from "@/server/routers/_app";
import { createInnerTRPCContext } from "@/server/context";
import { Form300Pdf, type Form300PdfProps } from "@/lib/pdf/form300";

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

  const [cases, ry] = await Promise.all([
    caller.cases.list({ reportingYearId: params.yearId }),
    caller.reportingYears.get({ id: params.yearId }),
  ]);

  if (!ry?.establishment) {
    return NextResponse.json({ error: "Reporting year not found" }, { status: 404 });
  }

  const { establishment, year } = ry;

  const props: Form300PdfProps = {
    cases: cases.map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      employeeName: c.employeeName ?? "Privacy Case",
      employeeJobTitle: c.employeeJobTitle ?? "",
      dateOfInjury: c.dateOfInjury,
      whereEventOccurred: c.whereEventOccurred ?? "",
      whatHappened: c.whatHappened ?? "",
      isPrivacyCase: c.isPrivacyCase ?? false,
      outcome: c.outcome ?? "",
      daysAway: c.daysAway ?? 0,
      daysRestricted: c.daysRestricted ?? 0,
      caseType: c.caseType ?? "",
    })),
    establishment: {
      name: establishment.name,
      street: establishment.street,
      city: establishment.city,
      state: establishment.state,
      zip: establishment.zip,
      naicsCode: establishment.naicsCode,
      sicCode: establishment.sicCode,
    },
    year,
  };

  // renderToBuffer requires a ReactPDF Document element; cast via any to satisfy the overloaded type signature
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(React.createElement(Form300Pdf, props) as any);

  const filename = `OSHA-300-${establishment.name.replace(/[^a-z0-9]/gi, "_")}-${year}.pdf`;

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.byteLength),
    },
  });
}
