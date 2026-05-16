"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { usePdfViewer } from "@/lib/hooks/usePdfViewer";
import { PdfViewerPanel } from "@/components/PdfViewerPanel";
import { WorkflowActions } from "@/components/WorkflowActions";
import { AuditTrailPanel } from "@/components/AuditTrailPanel";

interface Form300APageProps {
  params: { yearId: string };
}

export default function Form300APage({ params }: Form300APageProps) {
  const { yearId } = params;
  const { data: session } = useSession();
  const canCertify = session?.user.role === "EXECUTIVE" || session?.user.role === "ADMIN";

  const { data, isLoading, error, refetch } = trpc.forms.get300A.useQuery({
    reportingYearId: yearId,
  });

  const updateStatsMutation = trpc.reportingYears.updateStats.useMutation({
    onSuccess: () => {
      setSaveSuccess(true);
      setIsDirty(false);
      refetch();
    },
  });

  const certifyMutation = trpc.reportingYears.certify300A.useMutation({
    onSuccess: () => {
      setShowCertifyForm(false);
      setCertifyForm({ signerName: "", signerTitle: "" });
      refetch();
    },
  });

  // Editable 300A inputs
  const [avgEmployees, setAvgEmployees] = useState("");
  const [totalHoursWorked, setTotalHoursWorked] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // PDF viewer
  const [viewerTitle, setViewerTitle] = useState("");
  const pdfViewer = usePdfViewer();

  // Certify form
  const [showCertifyForm, setShowCertifyForm] = useState(false);
  const [certifyForm, setCertifyForm] = useState({ signerName: "", signerTitle: "" });

  // Sync inputs from DB on load
  useEffect(() => {
    if (data) {
      setAvgEmployees(data.avgEmployees != null ? String(data.avgEmployees) : "");
      setTotalHoursWorked(data.totalHoursWorked != null ? String(data.totalHoursWorked) : "");
      setIsDirty(false);
      setSaveSuccess(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.avgEmployees, data?.totalHoursWorked]);

  function openViewer(title: string, editable = false) {
    setViewerTitle(title);
    // editable=true → no lock param → AcroForm stays interactive (Edit Directly on PDF)
    // editable=false → ?lock=1 → fully flattened read-only PDF (View Only)
    const url = editable
      ? `/api/pdf/300a/${yearId}`
      : `/api/pdf/300a/${yearId}?lock=1`;
    pdfViewer.fetchPdf(url);
  }

  function closeViewer() {
    pdfViewer.close();
    setViewerTitle("");
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const emp = parseInt(avgEmployees, 10);
    const hrs = parseInt(totalHoursWorked, 10);
    updateStatsMutation.mutate({
      id: yearId,
      avgEmployees: isNaN(emp) ? 0 : emp,
      totalHoursWorked: isNaN(hrs) ? 0 : hrs,
    });
  }

  function handleCertify(e: React.FormEvent) {
    e.preventDefault();
    certifyMutation.mutate({
      reportingYearId: yearId,
      signerName: certifyForm.signerName,
      signerTitle: certifyForm.signerTitle,
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error.message}
      </div>
    );
  }

  if (!data) return null;

  const { establishment, year, certification, totals } = data;
  const role = session?.user.role ?? "";
  const isLocked = data.status === "FINALIZED" || data.status === "ARCHIVED";

  const hasSaved = data.avgEmployees != null || data.totalHoursWorked != null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <Link href="/forms" className="hover:text-blue-600">Forms</Link>
          <span>/</span>
          <span className="text-slate-700">{establishment.name} — {year} — Form 300A</span>
        </div>
        <h1 className="page-title">OSHA Form 300A — Annual Summary ({year})</h1>
        <p className="mt-1 text-xs text-slate-500">Rev. 01/2004 · 29 CFR 1904.32</p>
      </div>

      {/* ── Posting notice ──────────────────────────────────────────── */}
      <div className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-3">
        <p className="text-sm font-semibold text-orange-800">
          Posting Requirement — 29 CFR 1904.32(b)(6)
        </p>
        <p className="mt-0.5 text-sm text-orange-700">
          This form must be posted from February 1 through April 30, {year + 1}.
          It must remain posted even if no injuries or illnesses occurred.
        </p>
      </div>

      {/* ── Input section ───────────────────────────────────────────── */}
      <div className="card p-6 space-y-6">
        <h2 className="text-base font-semibold text-slate-900">Form 300A Data</h2>

        {/* Establishment details (read-only) */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Establishment / Company Details
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-500">Company Name</p>
              <p className="font-medium text-slate-900 mt-0.5">{establishment.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Street Address</p>
              <p className="text-slate-700 mt-0.5">{establishment.street}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">City</p>
              <p className="text-slate-700 mt-0.5">{establishment.city}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">State</p>
              <p className="text-slate-700 mt-0.5">{establishment.state}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">ZIP Code</p>
              <p className="text-slate-700 mt-0.5">{establishment.zip}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">NAICS Code</p>
              <p className="font-mono text-blue-600 mt-0.5">{establishment.naicsCode}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Reporting Year</p>
              <p className="font-semibold text-slate-900 mt-0.5">{year}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            To update establishment details,{" "}
            <Link href={`/establishments/${establishment.id}`} className="text-blue-600 hover:underline">
              edit the establishment
            </Link>.
          </p>
        </div>

        <hr className="border-slate-100" />

        {/* Editable employment fields */}
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Employment &amp; Hours Data (required for TRIR/DART)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Annual Average Number of Employees <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={avgEmployees}
                  onChange={(e) => {
                    setAvgEmployees(e.target.value);
                    setIsDirty(true);
                    setSaveSuccess(false);
                  }}
                  placeholder="e.g. 42"
                  className="form-input"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Average number of all employees during the year
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Total Hours Worked by All Employees <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalHoursWorked}
                  onChange={(e) => {
                    setTotalHoursWorked(e.target.value);
                    setIsDirty(true);
                    setSaveSuccess(false);
                  }}
                  placeholder="e.g. 85000"
                  className="form-input"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Total actual hours worked by all employees last year
                </p>
              </div>
            </div>
          </div>

          {/* Computed totals (derived from cases) */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Case Totals (auto-computed from recorded cases)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 uppercase">Number of Cases</p>
                <Row label="(G) Total deaths" value={totals.totalDeaths} />
                <Row label="(H) Cases — days away from work" value={totals.totalDaysAwayFromWork} />
                <Row label="(I) Cases — job transfer or restriction" value={totals.totalJobTransferOrRestriction} />
                <Row label="(J) Other recordable cases" value={totals.totalOtherRecordable} />
                <p className="text-xs font-semibold text-slate-600 uppercase mt-3">Number of Days</p>
                <Row label="(K) Days away from work" value={totals.totalDaysAway} />
                <Row label="(L) Days job transfer or restriction" value={totals.totalDaysRestricted} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-600 uppercase">Injury / Illness Types</p>
                <Row label="(M1) Injuries" value={totals.totalInjuries} />
                <Row label="(M2) Skin disorders" value={totals.totalSkinDisorders} />
                <Row label="(M3) Respiratory conditions" value={totals.totalRespiratoryConditions} />
                <Row label="(M4) Poisonings" value={totals.totalPoisonings} />
                <Row label="(M5) Hearing loss" value={totals.totalHearingLoss} />
                <Row label="(M6) All other illnesses" value={totals.totalAllOtherIllnesses} />
              </div>
            </div>
          </div>

          {/* Save + Edit Directly on PDF */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
            {isLocked ? (
              <p className="text-sm text-slate-500">
                Form is <span className="font-semibold">{data.status.toLowerCase()}</span> — data entry is locked. Ask an admin to reopen.
              </p>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={updateStatsMutation.isPending}
                  className="btn-primary"
                >
                  {updateStatsMutation.isPending ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => openViewer("Edit Directly on PDF", true)}
                  className="btn-secondary"
                >
                  Edit Directly on PDF
                </button>
              </>
            )}
            {saveSuccess && !isDirty && (
              <span className="text-sm text-green-600 font-medium">Saved successfully.</span>
            )}
            {updateStatsMutation.error && (
              <span className="text-sm text-red-600">{updateStatsMutation.error.message}</span>
            )}
          </div>
        </form>
      </div>

      {/* ── Post-save actions ────────────────────────────────────────── */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">PDF Actions</h2>
        {!hasSaved && !saveSuccess && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            Save annual average employees and total hours worked above to ensure the PDF is complete.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          {/* View Only — blob URL iframe, locked, never downloads */}
          <button
            onClick={() => openViewer("View Only — OSHA Form 300A")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Only
          </button>

          {/* Download Normal Version */}
          <a
            href={`/api/pdf/300a/${yearId}?download=1`}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Normal Version
          </a>

          {/* Download Redacted Version */}
          <a
            href={`/api/pdf/300a/${yearId}?download=1&redacted=1`}
            className="inline-flex items-center gap-2 rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            Download Redacted Version
          </a>
        </div>
      </div>

      {/* ── Workflow status & approval ───────────────────────────────── */}
      <WorkflowActions
        yearId={yearId}
        status={data.status}
        role={role}
        reviewerComment={data.reviewerComment}
        version={data.version}
        finalizedAt={data.finalizedAt}
        preparedBy={data.preparedBy}
        reviewedBy={data.reviewedBy}
        approvedBy={data.approvedBy}
        onStatusChanged={refetch}
      />

      {/* ── Embedded PDF preview area ────────────────────────────────── */}
      <PdfViewerPanel
        title={viewerTitle || "Form 300A"}
        blobUrl={pdfViewer.blobUrl}
        loading={pdfViewer.loading}
        error={pdfViewer.error}
        onClose={closeViewer}
        downloadUrl={`/api/pdf/300a/${yearId}?download=1`}
      />

      {/* ── Activity & Audit Trail ──────────────────────────────────── */}
      <AuditTrailPanel reportingYearId={yearId} />

      {/* ── Certification ────────────────────────────────────────────── */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">
          Certification — 29 CFR 1904.32(b)(3)
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          I certify that I have examined this document and that to the best of my knowledge the entries are true, accurate, and complete.
        </p>

        {certification ? (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm font-bold text-green-800">Certified</p>
            <p className="mt-1 text-sm text-green-700">
              {certification.signerName}, {certification.signerTitle}
            </p>
            <p className="mt-1 text-xs text-green-600">
              {new Date(certification.certifiedAt).toLocaleDateString("en-US")}
            </p>
          </div>
        ) : canCertify ? (
          <div>
            {!showCertifyForm ? (
              <button onClick={() => setShowCertifyForm(true)} className="btn-primary">
                Certify This 300A
              </button>
            ) : (
              <form onSubmit={handleCertify} className="space-y-3 max-w-sm">
                {certifyMutation.error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    {certifyMutation.error.message}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Signer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={certifyForm.signerName}
                    onChange={(e) => setCertifyForm((f) => ({ ...f, signerName: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={certifyForm.signerTitle}
                    onChange={(e) => setCertifyForm((f) => ({ ...f, signerTitle: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={certifyMutation.isPending} className="btn-primary">
                    {certifyMutation.isPending ? "Certifying…" : "Confirm Certification"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCertifyForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-sm text-yellow-800">
              Not yet certified. An executive must certify this form.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1 px-2 rounded bg-slate-50">
      <span className="text-slate-600 text-xs">{label}</span>
      <span className="font-semibold text-slate-900 text-sm tabular-nums">{value}</span>
    </div>
  );
}
