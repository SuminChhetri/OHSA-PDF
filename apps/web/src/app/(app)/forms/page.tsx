"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { usePdfViewer } from "@/lib/hooks/usePdfViewer";
import { PdfViewerPanel } from "@/components/PdfViewerPanel";
import { StatusBadge } from "@/components/StatusBadge";

function FormInfoCard({ title, subtitle, description, color }: {
  title: string; subtitle: string; description: string; color: string;
}) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="text-sm font-bold">{title}</p>
      <p className="text-xs font-semibold mt-0.5">{subtitle}</p>
      <p className="text-xs mt-1.5 opacity-75">{description}</p>
    </div>
  );
}

type FormType = "300" | "300a" | "301";

interface ActiveForm {
  url: string;
  title: string;
  yearId: string;
  formType: FormType;
}

export default function FormsPage() {
  const [selectedEstId, setSelectedEstId] = useState("");
  const [activeForm, setActiveForm] = useState<ActiveForm | null>(null);
  const { blobUrl, loading, fetchPdf, close } = usePdfViewer();

  const { data: establishments, isLoading: estLoading } = trpc.establishments.list.useQuery();
  const { data: years, isLoading: yearsLoading } = trpc.reportingYears.list.useQuery(
    { establishmentId: selectedEstId },
    { enabled: !!selectedEstId }
  );

  function openPdf(url: string, title: string, yearId: string, formType: FormType) {
    setActiveForm({ url, title, yearId, formType });
    fetchPdf(`${url}?lock=1`);
  }

  function closePdf() {
    setActiveForm(null);
    close();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">OSHA Forms</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and download Form 300, 300A, and 301 for any establishment and reporting year.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FormInfoCard
          title="OSHA Form 300"
          subtitle="Log of Work-Related Injuries and Illnesses"
          description="Records each work-related injury and illness that occurred during the year."
          color="border-blue-200 bg-blue-50 text-blue-900"
        />
        <FormInfoCard
          title="OSHA Form 300A"
          subtitle="Annual Summary"
          description="Summarizes totals for the year. Must be posted Feb 1–Apr 30."
          color="border-indigo-200 bg-indigo-50 text-indigo-900"
        />
        <FormInfoCard
          title="OSHA Form 301"
          subtitle="Injury and Illness Incident Report"
          description="Detailed incident report completed for each recordable case within 7 days."
          color="border-violet-200 bg-violet-50 text-violet-900"
        />
      </div>

      {/* Establishment selector */}
      <div className="card p-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Establishment
        </label>
        {estLoading ? (
          <div className="h-10 bg-slate-100 animate-pulse rounded-lg w-64" />
        ) : (
          <select
            value={selectedEstId}
            onChange={(e) => { setSelectedEstId(e.target.value); closePdf(); }}
            className="form-input max-w-sm"
          >
            <option value="">Choose an establishment…</option>
            {establishments?.map((e) => (
              <option key={e.id} value={e.id}>{e.name} — {e.city}, {e.state}</option>
            ))}
          </select>
        )}
        {establishments?.length === 0 && (
          <p className="mt-2 text-sm text-slate-500">
            No establishments yet.{" "}
            <Link href="/establishments" className="text-blue-600 hover:underline">Add one</Link> first.
          </p>
        )}
      </div>

      {/* Reporting years table */}
      {selectedEstId && (
        yearsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : years && years.length === 0 ? (
          <div className="card p-8 text-center text-slate-500 text-sm">
            No reporting years for this establishment.{" "}
            <Link href={`/establishments/${selectedEstId}`} className="text-blue-600 hover:underline">
              Add a reporting year
            </Link>
          </div>
        ) : years && years.length > 0 ? (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Status</th>
                  <th className="text-right">Cases</th>
                  <th className="text-right">Form 300</th>
                  <th className="text-right">Form 300A</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {years.map((ry) => {
                  const isLocked = ry.status === "FINALIZED" || ry.status === "ARCHIVED";
                  return (
                    <tr key={ry.id} className={activeForm?.yearId === ry.id ? "bg-blue-50" : ""}>
                      <td className="font-semibold text-slate-900">{ry.year}</td>
                      <td><StatusBadge status={ry.status ?? "DRAFT"} /></td>
                      <td className="text-right text-slate-600">{ry._count.cases}</td>
                      <td className="text-right">
                        <button
                          onClick={() => openPdf(`/api/pdf/300/${ry.id}`, `Form 300 — ${ry.year}`, ry.id, "300")}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                        >
                          View
                        </button>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => openPdf(`/api/pdf/300a/${ry.id}`, `Form 300A — ${ry.year}`, ry.id, "300a")}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                        >
                          View
                        </button>
                        <span className="mx-2 text-slate-300">|</span>
                        <Link
                          href={`/forms/300a/${ry.id}`}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline"
                        >
                          Manage
                        </Link>
                      </td>
                      <td className="text-right">
                        {isLocked ? (
                          <span className="text-xs text-slate-400">Locked</span>
                        ) : (
                          <Link
                            href={`/cases/new?ryid=${ry.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                          >
                            + Add Case
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null
      )}

      {/* Inline PDF viewer */}
      {activeForm && (
        <PdfViewerPanel
          title={activeForm.title}
          blobUrl={blobUrl}
          loading={loading}
          onClose={closePdf}
          downloadUrl={`${activeForm.url}?download=1`}
          redactedDownloadUrl={activeForm.formType === "300a" ? `${activeForm.url}?download=1&redacted=1` : undefined}
        />
      )}

      {!selectedEstId && establishments && establishments.length > 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
          Select an establishment above to view its forms and reporting years.
        </div>
      )}
    </div>
  );
}
