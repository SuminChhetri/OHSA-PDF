"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";

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

  const { data: ryDetail } = trpc.reportingYears.get.useQuery({ id: yearId });

  const itaQuery = trpc.itaCheck.getEligibility.useQuery({
    establishmentId: data?.establishment?.id ?? "",
    reportingYear: data?.year ?? new Date().getFullYear(),
    totalEmployeesInYear: data?.avgEmployees ?? 0,
    peakEmployeeCountPriorYear: data?.avgEmployees ?? 0,
  });

  const certifyMutation = trpc.reportingYears.certify300A.useMutation({
    onSuccess: () => {
      setShowCertifyForm(false);
      setCertifyForm({ signerName: "", signerTitle: "" });
      refetch();
    },
  });

  const [showCertifyForm, setShowCertifyForm] = useState(false);
  const [certifyForm, setCertifyForm] = useState({ signerName: "", signerTitle: "" });

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
      <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
        {error.message}
      </div>
    );
  }

  if (!data) return null;

  const { establishment, year, avgEmployees, totalHoursWorked, totals, certification, postingRequirement } = data;

  const summaryRows = [
    { label: "Total number of deaths (G)", value: totals.totalDeaths },
    { label: "Total cases with days away from work (H)", value: totals.totalDaysAwayFromWork },
    { label: "Total cases with job transfer or restriction (I)", value: totals.totalJobTransferOrRestriction },
    { label: "Total other recordable cases (J)", value: totals.totalOtherRecordable },
    { label: "Total days away from work (K)", value: totals.totalDaysAway },
    { label: "Total days of job transfer or restriction (L)", value: totals.totalDaysRestricted },
  ];

  const illnessRows = [
    { label: "Injuries (M1)", value: totals.totalInjuries },
    { label: "Skin disorders (M2)", value: totals.totalSkinDisorders },
    { label: "Respiratory conditions (M3)", value: totals.totalRespiratoryConditions },
    { label: "Poisonings (M4)", value: totals.totalPoisonings },
    { label: "Hearing loss (M5)", value: totals.totalHearingLoss },
    { label: "All other illnesses (M6)", value: totals.totalAllOtherIllnesses },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/establishments" className="hover:text-blue-600">Establishments</Link>
            <span>/</span>
            <Link href={`/establishments/${establishment.id}`} className="hover:text-blue-600">
              {establishment.name}
            </Link>
            <span>/</span>
            <span className="text-gray-700">{year} 300A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            OSHA Form 300A — Annual Summary ({year})
          </h1>
          <p className="mt-1 text-xs text-gray-500">Rev. 01/2004 · 29 CFR 1904.32</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/pdf/300a/${yearId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Download Form 300A PDF
          </a>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Print
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-3">
        <p className="text-sm font-semibold text-orange-800">
          Posting Requirement — 29 CFR 1904.32(b)(6)
        </p>
        <p className="mt-1 text-sm text-orange-700">
          This form must be posted in a visible location from February 1 through April 30 ({year + 1}).
          It must remain posted even if no injuries or illnesses occurred.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">OSHA&apos;s Form 300A (Rev. 01/2004)</h2>
          <p className="text-sm font-semibold text-gray-700 mt-1">Summary of Work-Related Injuries and Illnesses</p>
        </div>

        <div className="p-6 space-y-4 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Establishment Name</p>
              <p className="font-semibold text-gray-900">{establishment.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Street</p>
              <p className="text-gray-900">{establishment.street}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">City, State, ZIP</p>
              <p className="text-gray-900">{establishment.city}, {establishment.state} {establishment.zip}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">NAICS Code</p>
              <p className="text-gray-900">{establishment.naicsCode}</p>
            </div>
            {establishment.sicCode && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">SIC Code</p>
                <p className="text-gray-900">{establishment.sicCode}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Reporting Year</p>
              <p className="text-gray-900">{year}</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Case Totals</h3>
          <table className="w-full text-sm border border-gray-300">
            <tbody>
              {summaryRows.map((row) => (
                <tr key={row.label} className="border-b border-gray-200">
                  <td className="px-4 py-2 text-gray-700 border-r border-gray-200">{row.label}</td>
                  <td className="px-4 py-2 text-right font-bold text-gray-900 w-20">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Illness Type Totals (M1–M6)</h3>
          <table className="w-full text-sm border border-gray-300">
            <tbody>
              {illnessRows.map((row) => (
                <tr key={row.label} className="border-b border-gray-200">
                  <td className="px-4 py-2 text-gray-700 border-r border-gray-200">{row.label}</td>
                  <td className="px-4 py-2 text-right font-bold text-gray-900 w-20">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Employment Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Annual Average Employees</p>
              <p className="font-semibold text-gray-900">{avgEmployees?.toLocaleString() ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Total Hours Worked by All Employees</p>
              <p className="font-semibold text-gray-900">{totalHoursWorked?.toLocaleString() ?? "—"}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Certification — 29 CFR 1904.32(b)(3)
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            I certify that I have examined this document and that to the best of my knowledge the entries are true, accurate,
            and complete. Only company executives, owners, officers, or the highest ranking company official may certify.
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
          ) : (
            <div>
              {canCertify ? (
                <div>
                  {!showCertifyForm ? (
                    <button onClick={() => setShowCertifyForm(true)} className="btn-primary">
                      Certify This 300A
                    </button>
                  ) : (
                    <form onSubmit={handleCertify} className="space-y-3 max-w-sm">
                      {certifyMutation.error && (
                        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                          {certifyMutation.error.message}
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        <button type="button" onClick={() => setShowCertifyForm(false)} className="px-4 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                  <p className="text-sm text-yellow-800">
                    Not yet certified. Only EXECUTIVE or ADMIN users may certify this form.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {itaQuery.data && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            ITA Electronic Submission — 29 CFR 1904.41
          </h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Tier: </span>
              <span className={`badge ${
                itaQuery.data.ita.tier === "NONE"
                  ? "bg-gray-100 text-gray-700"
                  : itaQuery.data.ita.tier === "300A_ONLY"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-orange-100 text-orange-800"
              }`}>
                {itaQuery.data.ita.tier === "NONE"
                  ? "Not Required"
                  : itaQuery.data.ita.tier === "300A_ONLY"
                  ? "300A Only"
                  : "300A + 300 + 301"}
              </span>
            </p>
            <p className="text-gray-600">{itaQuery.data.summary}</p>
            {itaQuery.data.ita.tier !== "NONE" && (
              <p className="text-gray-500">
                Submission deadline:{" "}
                <span className="font-medium text-gray-900">
                  {new Date(itaQuery.data.ita.submissionDeadline).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
