"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/StatusBadge";

interface EstablishmentDetailPageProps {
  params: { id: string };
}

export default function EstablishmentDetailPage({ params }: EstablishmentDetailPageProps) {
  const { id } = params;
  const { data: est, isLoading, error, refetch } = trpc.establishments.get.useQuery({ id });

  const createYearMutation = trpc.reportingYears.create.useMutation({
    onSuccess: () => {
      setShowYearForm(false);
      setYearForm({ year: new Date().getFullYear(), avgEmployees: undefined, totalHoursWorked: undefined });
      refetch();
    },
  });

  const complianceQuery = trpc.establishments.complianceStatus.useQuery({
    establishmentId: id,
    reportingYear: new Date().getFullYear(),
    peakEmployeeCountPriorYear: est?.reportingYears?.[0]?.avgEmployees ?? 0,
    totalEmployeesInYear: est?.reportingYears?.[0]?.avgEmployees ?? 0,
  });

  const [showYearForm, setShowYearForm] = useState(false);
  const [yearForm, setYearForm] = useState<{
    year: number;
    avgEmployees?: number;
    totalHoursWorked?: number;
  }>({
    year: new Date().getFullYear(),
    avgEmployees: undefined,
    totalHoursWorked: undefined,
  });

  function handleYearChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value === "" ? undefined : Number(e.target.value);
    setYearForm((prev) => ({ ...prev, [e.target.name]: val }));
  }

  async function handleYearSubmit(e: React.FormEvent) {
    e.preventDefault();
    createYearMutation.mutate({
      establishmentId: id,
      year: yearForm.year,
      avgEmployees: yearForm.avgEmployees,
      totalHoursWorked: yearForm.totalHoursWorked,
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

  if (!est) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/establishments" className="hover:text-blue-600">Establishments</Link>
            <span>/</span>
            <span className="text-slate-700">{est.name}</span>
          </div>
          <h1 className="page-title">{est.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {est.street}, {est.city}, {est.state} {est.zip} &mdash; NAICS {est.naicsCode}
            {est.sicCode ? ` / SIC ${est.sicCode}` : ""}
          </p>
        </div>
      </div>

      {complianceQuery.data && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-3">Compliance Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-slate-700">Recordkeeping Exemption</p>
              <p className="mt-1">
                {complianceQuery.data.exemption.isExempt ? (
                  <span className="badge bg-yellow-100 text-yellow-800">
                    Exempt — {complianceQuery.data.exemption.cfr}
                  </span>
                ) : (
                  <span className="badge bg-green-100 text-green-800">Required</span>
                )}
              </p>
              {complianceQuery.data.exemption.reason && (
                <p className="mt-1 text-slate-500 text-xs">{complianceQuery.data.exemption.reason}</p>
              )}
            </div>
            <div>
              <p className="font-medium text-slate-700">ITA Electronic Submission</p>
              <p className="mt-1">
                {complianceQuery.data.ita.tier === "NONE" ? (
                  <span className="badge bg-slate-100 text-slate-700">Not Required</span>
                ) : complianceQuery.data.ita.tier === "300A_ONLY" ? (
                  <span className="badge bg-blue-100 text-blue-800">300A Only</span>
                ) : (
                  <span className="badge bg-orange-100 text-orange-800">300A + 300 + 301</span>
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">{complianceQuery.data.ita.cfr}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Reporting Years</h2>
        <button
          onClick={() => setShowYearForm((v) => !v)}
          className="btn-primary"
        >
          {showYearForm ? "Cancel" : "New Year"}
        </button>
      </div>

      {showYearForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Add Reporting Year</h3>
          {createYearMutation.error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {createYearMutation.error.message}
            </div>
          )}
          <form onSubmit={handleYearSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Year <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="year"
                value={yearForm.year}
                onChange={handleYearChange}
                required
                min={2000}
                max={2100}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Avg Employees</label>
              <input
                type="number"
                name="avgEmployees"
                value={yearForm.avgEmployees ?? ""}
                onChange={handleYearChange}
                min={0}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Hours Worked</label>
              <input
                type="number"
                name="totalHoursWorked"
                value={yearForm.totalHoursWorked ?? ""}
                onChange={handleYearChange}
                min={0}
                className="form-input"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowYearForm(false)}
                className="px-4 py-2 rounded-md border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createYearMutation.isPending}
                className="btn-primary"
              >
                {createYearMutation.isPending ? "Saving…" : "Create Year"}
              </button>
            </div>
          </form>
        </div>
      )}

      {est.reportingYears.length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
          <p className="font-medium">No reporting years yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Year</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Employees</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total Hours</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Cases</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {est.reportingYears.map((ry) => (
                  <tr key={ry.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{ry.year}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {ry.avgEmployees?.toLocaleString() ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {ry.totalHoursWorked?.toLocaleString() ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {ry._count.cases}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={ry.status ?? "DRAFT"} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <Link
                          href={`/establishments/${id}/years/${ry.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                        >
                          View Log
                        </Link>
                        <Link
                          href={`/forms/300a/${ry.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                        >
                          Manage 300A
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
