"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";

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

function YearRow({
  ry,
  estId,
  estName,
  isAdmin,
}: {
  ry: RetentionYear;
  estId: string;
  estName: string;
  isAdmin: boolean;
}) {
  const exportQuery = trpc.export.jsonBackup.useQuery({ reportingYearId: ry.id });
  const csvQuery = trpc.export.csvITA300A.useQuery({ reportingYearId: ry.id });

  async function handleJsonExport() {
    const result = await exportQuery.refetch();
    if (result.data) {
      const json = JSON.stringify(result.data.reportingYear, null, 2);
      downloadString(json, result.data.filename);
    }
  }

  async function handleCsvExport() {
    const result = await csvQuery.refetch();
    if (result.data) {
      downloadString(result.data.csv, result.data.filename);
    }
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{estName}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{ry.year}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{ry._count.cases}</td>
      <td className="px-4 py-3">
        {ry.mustRetain ? (
          <span className="badge bg-orange-100 text-orange-800">Must Retain</span>
        ) : (
          <span className="badge bg-green-100 text-green-800">Safe to Archive</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {ry.mustRetain
          ? `Retain through ${ry.retentionExpiresAfter}`
          : `Expired after ${ry.retentionExpiresAfter}`}
        <span className="ml-1 text-xs text-gray-400">{ry.cfr}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/forms/300a/${ry.id}`}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            View 300A
          </Link>
          {isAdmin && (
            <button
              onClick={handleJsonExport}
              disabled={exportQuery.isFetching}
              className="text-xs text-blue-600 hover:underline font-medium disabled:opacity-50"
            >
              {exportQuery.isFetching ? "Exporting…" : "JSON Backup"}
            </button>
          )}
          <button
            onClick={handleCsvExport}
            disabled={csvQuery.isFetching}
            className="text-xs text-blue-600 hover:underline font-medium disabled:opacity-50"
          >
            {csvQuery.isFetching ? "…" : "300A CSV"}
          </button>
        </div>
      </td>
    </tr>
  );
}

function EstablishmentArchiveRow({ estId, estName, isAdmin }: { estId: string; estName: string; isAdmin: boolean }) {
  const { data: retentionData, isLoading } = trpc.reportingYears.retentionStatus.useQuery({
    establishmentId: estId,
  });

  if (isLoading) {
    return (
      <tr>
        <td colSpan={6} className="px-4 py-3 text-center text-gray-400 text-sm">Loading…</td>
      </tr>
    );
  }

  if (!retentionData || retentionData.length === 0) {
    return (
      <tr>
        <td className="px-4 py-3 text-sm font-medium text-gray-900">{estName}</td>
        <td colSpan={5} className="px-4 py-3 text-sm text-gray-400 italic">No reporting years</td>
      </tr>
    );
  }

  return (
    <>
      {retentionData.map((ry, idx) => (
        <YearRow
          key={ry.id}
          ry={ry}
          estId={estId}
          estName={idx === 0 ? estName : ""}
          isAdmin={isAdmin}
        />
      ))}
    </>
  );
}

export default function ArchivePage() {
  const { data: establishments, isLoading, error } = trpc.establishments.list.useQuery();
  const { data: session } = useSession();
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Archive</h1>
        <p className="mt-1 text-sm text-gray-500">
          All establishments and reporting years. Records must be retained for 5 years per 29 CFR 1904.33.
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <span className="font-semibold">Retention Rule — 29 CFR 1904.33:</span> OSHA records must be retained
        and maintained for 5 years following the end of the calendar year that these records cover.
        The current year is {CURRENT_YEAR}; records for {CURRENT_YEAR - 5} and earlier may be safely archived.
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {establishments && establishments.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No establishments found.</p>
        </div>
      )}

      {establishments && establishments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Establishment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cases</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retention</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {establishments.map((est) => (
                  <EstablishmentArchiveRow key={est.id} estId={est.id} estName={est.name} isAdmin={isAdmin} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
