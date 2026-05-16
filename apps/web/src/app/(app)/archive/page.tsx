"use client";

import { trpc } from "@/lib/trpc";

const CURRENT_YEAR = new Date().getFullYear();

function downloadString(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type RetentionYear = {
  id: string;
  year: number;
  mustRetain: boolean;
  retentionExpiresAfter: number;
  cfr: string;
  _count: { cases: number };
};

function YearRow({ ry, estName }: { ry: RetentionYear; estName: string }) {
  const csvQuery = trpc.export.csvITA300A.useQuery({ reportingYearId: ry.id }, { enabled: false });

  async function handleCsvExport() {
    const result = await csvQuery.refetch();
    if (result.data) downloadString(result.data.csv, result.data.filename);
  }

  return (
    <tr>
      <td className="font-medium text-slate-900">{estName}</td>
      <td className="text-slate-700">{ry.year}</td>
      <td className="text-slate-600">{ry._count.cases}</td>
      <td>
        {ry.mustRetain ? (
          <span className="badge bg-orange-100 text-orange-800">Must Retain</span>
        ) : (
          <span className="badge bg-green-100 text-green-800">Safe to Archive</span>
        )}
      </td>
      <td className="text-slate-600 text-sm">
        {ry.mustRetain
          ? `Retain through ${ry.retentionExpiresAfter}`
          : `Expired after ${ry.retentionExpiresAfter}`}
        <span className="ml-1 text-xs text-slate-400">{ry.cfr}</span>
      </td>
      <td>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/api/pdf/300a/${ry.id}?download=1`}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            Download 300A
          </a>
          <button
            onClick={handleCsvExport}
            disabled={csvQuery.isFetching}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline disabled:opacity-50"
          >
            {csvQuery.isFetching ? "…" : "300A CSV"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function EstablishmentArchiveRow({ estId, estName }: { estId: string; estName: string }) {
  const { data: retentionData, isLoading } = trpc.reportingYears.retentionStatus.useQuery({
    establishmentId: estId,
  });

  if (isLoading) {
    return (
      <tr>
        <td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-sm">Loading…</td>
      </tr>
    );
  }

  if (!retentionData || retentionData.length === 0) {
    return (
      <tr>
        <td className="font-medium text-slate-900">{estName}</td>
        <td colSpan={5} className="text-sm text-slate-400 italic">No reporting years</td>
      </tr>
    );
  }

  return (
    <>
      {retentionData.map((ry, idx) => (
        <YearRow key={ry.id} ry={ry} estName={idx === 0 ? estName : ""} />
      ))}
    </>
  );
}

export default function ArchivePage() {
  const { data: establishments, isLoading, error } = trpc.establishments.list.useQuery();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Archive</h1>
        <p className="mt-1 text-sm text-slate-500">
          All establishments and reporting years with retention status per 29 CFR 1904.33.
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <span className="font-semibold">Retention Rule — 29 CFR 1904.33:</span> OSHA records must be retained
        for 5 years following the end of the calendar year that these records cover.
        The current year is {CURRENT_YEAR}; records for {CURRENT_YEAR - 5} and earlier may be safely archived.
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {establishments && establishments.length === 0 && (
        <div className="card p-12 text-center text-slate-500">
          <p>No establishments found.</p>
        </div>
      )}

      {establishments && establishments.length > 0 && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Establishment</th>
                <th>Year</th>
                <th>Cases</th>
                <th>Status</th>
                <th>Retention</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {establishments.map((est) => (
                <EstablishmentArchiveRow key={est.id} estId={est.id} estName={est.name} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
