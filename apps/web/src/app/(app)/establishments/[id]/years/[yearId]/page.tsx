"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { LogTable } from "@/components/log/LogTable";
import { usePdfViewer } from "@/lib/hooks/usePdfViewer";
import { PdfViewerPanel } from "@/components/PdfViewerPanel";
import { StatusBadge } from "@/components/StatusBadge";

interface YearLogPageProps {
  params: { id: string; yearId: string };
}

export default function YearLogPage({ params }: YearLogPageProps) {
  const { id, yearId } = params;
  const router = useRouter();
  const pdfViewer = usePdfViewer();

  const { data: cases, isLoading, error } = trpc.cases.list.useQuery({
    reportingYearId: yearId,
  });

  const { data: ry } = trpc.reportingYears.get.useQuery({ id: yearId });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error.message}
      </div>
    );
  }

  const totalCases = cases?.length ?? 0;
  const totalDaysAway = cases?.reduce((s, c) => s + (c.daysAway ?? 0), 0) ?? 0;
  const totalDaysRestricted = cases?.reduce((s, c) => s + (c.daysRestricted ?? 0), 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/establishments" className="hover:text-blue-600">Establishments</Link>
            <span>/</span>
            <Link href={`/establishments/${id}`} className="hover:text-blue-600">
              {ry?.establishment?.name ?? id}
            </Link>
            <span>/</span>
            <span className="text-slate-700">{ry?.year ?? yearId} Log</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">OSHA Form 300 — {ry?.year ?? ""} Log</h1>
            {ry?.status && <StatusBadge status={ry.status} />}
          </div>
          {ry?.establishment && (
            <p className="mt-1 text-sm text-slate-500">{ry.establishment.name}</p>
          )}
        </div>
        <div className="flex gap-2 self-start sm:self-center flex-wrap">
          <button
            onClick={() => pdfViewer.fetchPdf(`/api/pdf/300/${yearId}?lock=1`)}
            className="btn-secondary text-sm"
          >
            View Form 300 PDF
          </button>
          <a
            href={`/api/pdf/300/${yearId}?download=1`}
            className="btn-secondary text-sm"
          >
            Download PDF
          </a>
          <Link
            href={`/cases/new?ryid=${yearId}`}
            className="btn-primary"
          >
            Add New Case
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Total Cases</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCases}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Days Away</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalDaysAway}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Days Restricted</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalDaysRestricted}</p>
        </div>
      </div>

      <LogTable
        cases={cases ?? []}
        onAddCase={() => router.push(`/cases/new?ryid=${yearId}`)}
      />

      <PdfViewerPanel
        title={`Form 300 — ${ry?.year ?? ""} Log`}
        blobUrl={pdfViewer.blobUrl}
        loading={pdfViewer.loading}
        onClose={pdfViewer.close}
        downloadUrl={`/api/pdf/300/${yearId}?download=1`}
      />
    </div>
  );
}
