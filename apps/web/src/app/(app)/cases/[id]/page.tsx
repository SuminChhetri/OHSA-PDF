"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { CaseOutcome, CaseType, PrivacyReason } from "@osha/regulatory-logic";
import {
  OUTCOME_LABELS,
  OUTCOME_OPTIONS,
  CASE_TYPE_LABELS,
  CASE_TYPE_OPTIONS,
  PRIVACY_REASON_LABELS,
  PRIVACY_REASON_OPTIONS,
} from "@/lib/case-constants";
import { usePdfViewer } from "@/lib/hooks/usePdfViewer";
import { PdfViewerPanel } from "@/components/PdfViewerPanel";
import { StatusBadge } from "@/components/StatusBadge";

interface CaseDetailPageProps {
  params: { id: string };
}

function Field({ label, value }: { label: string; value?: string | boolean | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="mt-0.5 text-sm text-slate-900">
        {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
      </p>
    </div>
  );
}

export default function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { id } = params;
  const { data: session } = useSession();

  const {
    data: caseData,
    isLoading,
    error,
    refetch,
  } = trpc.cases.get.useQuery({ id });

  const { data: ryData } = trpc.reportingYears.get.useQuery(
    { id: caseData?.reportingYearId ?? "" },
    { enabled: !!caseData?.reportingYearId }
  );

  const { data: auditLogs } = trpc.audit.forCase.useQuery({ caseId: id });

  const isLocked = ryData?.status === "FINALIZED" || ryData?.status === "ARCHIVED";

  const updateMutation = trpc.cases.update.useMutation({
    onSuccess: () => {
      setEditMode(false);
      refetch();
    },
  });

  const [editMode, setEditMode] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const pdf301 = usePdfViewer();

  useEffect(() => {
    if (showPdf) {
      pdf301.fetchPdf(`/api/pdf/301/${id}?lock=1`);
    } else {
      pdf301.close();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPdf, id]);
  const [updateReason, setUpdateReason] = useState("");
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  function enterEditMode() {
    if (!caseData) return;
    setEditForm({
      employeeName: caseData.employeeName ?? "",
      employeeJobTitle: caseData.employeeJobTitle ?? "",
      dateOfInjury: caseData.dateOfInjury
        ? new Date(caseData.dateOfInjury).toISOString().slice(0, 10)
        : "",
      timeOfInjury: caseData.timeOfInjury ?? "",
      whereEventOccurred: caseData.whereEventOccurred ?? "",
      whatEmployeeWasDoing: caseData.whatEmployeeWasDoing ?? "",
      whatHappened: caseData.whatHappened ?? "",
      bodyPartAffected: caseData.bodyPartAffected ?? "",
      objectOrSubstance: caseData.objectOrSubstance ?? "",
      treatedInEmergencyRoom: caseData.treatedInEmergencyRoom ?? false,
      hospitalizedOvernight: caseData.hospitalizedOvernight ?? false,
      physicianName: caseData.physicianName ?? "",
      facilityName: caseData.facilityName ?? "",
      outcome: caseData.outcome ?? "OTHER_RECORDABLE",
      daysAway: caseData.daysAway ?? 0,
      daysRestricted: caseData.daysRestricted ?? 0,
      caseType: caseData.caseType ?? "INJURY",
      isPrivacyCase: caseData.isPrivacyCase ?? false,
      privacyReason: caseData.privacyReason ?? "",
    });
    setEditMode(true);
    setUpdateReason("");
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, type, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!updateReason.trim()) errors.reason = "A reason for the change is required per 29 CFR 1904.33.";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    updateMutation.mutate({
      id,
      caseData: {
        employeeName: editForm.employeeName as string,
        employeeJobTitle: editForm.employeeJobTitle as string,
        dateOfInjury: new Date(editForm.dateOfInjury as string),
        timeOfInjury: editForm.timeOfInjury as string | undefined,
        whereEventOccurred: editForm.whereEventOccurred as string,
        whatEmployeeWasDoing: editForm.whatEmployeeWasDoing as string,
        whatHappened: editForm.whatHappened as string,
        bodyPartAffected: editForm.bodyPartAffected as string,
        objectOrSubstance: editForm.objectOrSubstance as string,
        treatedInEmergencyRoom: editForm.treatedInEmergencyRoom as boolean,
        hospitalizedOvernight: editForm.hospitalizedOvernight as boolean,
        physicianName: editForm.physicianName as string | undefined,
        facilityName: editForm.facilityName as string | undefined,
        outcome: editForm.outcome as CaseOutcome,
        daysAway: Number(editForm.daysAway),
        daysRestricted: Number(editForm.daysRestricted),
        caseType: editForm.caseType as CaseType,
        isPrivacyCase: editForm.isPrivacyCase as boolean,
        privacyReason: editForm.privacyReason ? (editForm.privacyReason as PrivacyReason) : undefined,
      },
      reason: updateReason,
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

  if (!caseData) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="page-title">
            Case #{caseData.caseNumber}
          </h1>
          {caseData.isPrivacyCase && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-semibold">
              🔒 Privacy Case — 29 CFR 1904.29(b)(6)
            </div>
          )}
        </div>
        {!editMode && (
          <div className="flex flex-wrap items-center gap-2 self-start">
            {ryData?.status && <StatusBadge status={ryData.status} />}
            <button
              onClick={() => setShowPdf((v) => !v)}
              className="btn-secondary text-sm"
            >
              {showPdf ? "Hide Form 301" : "View Form 301 PDF"}
            </button>
            {!isLocked && (
              <button onClick={enterEditMode} className="btn-primary">
                Edit
              </button>
            )}
            {isLocked && (
              <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-md px-3 py-1.5">
                Form is {ryData?.status?.toLowerCase()} — editing locked
              </span>
            )}
          </div>
        )}
      </div>

      {/* Inline Form 301 viewer */}
      {showPdf && !editMode && (
        <PdfViewerPanel
          title={`Form 301 — Case #${caseData.caseNumber}`}
          blobUrl={pdf301.blobUrl}
          loading={pdf301.loading}
          error={pdf301.error}
          onClose={() => setShowPdf(false)}
          downloadUrl={`/api/pdf/301/${id}?download=1`}
        />
      )}

      {updateMutation.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {updateMutation.error.message}
        </div>
      )}

      {editMode ? (
        <form onSubmit={handleEditSubmit} className="space-y-6">
          <fieldset className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <legend className="text-base font-semibold text-slate-900 mb-4">Edit Case</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee Name</label>
                <input name="employeeName" value={editForm.employeeName as string} onChange={handleEditChange} required className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                <input name="employeeJobTitle" value={editForm.employeeJobTitle as string} onChange={handleEditChange} required className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Injury</label>
                <input type="date" name="dateOfInjury" value={editForm.dateOfInjury as string} onChange={handleEditChange} required className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                <input type="time" name="timeOfInjury" value={editForm.timeOfInjury as string} onChange={handleEditChange} className="form-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Where event occurred</label>
                <input name="whereEventOccurred" value={editForm.whereEventOccurred as string} onChange={handleEditChange} required className="form-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">What employee was doing</label>
                <textarea rows={2} name="whatEmployeeWasDoing" value={editForm.whatEmployeeWasDoing as string} onChange={handleEditChange} required className="form-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">What happened</label>
                <textarea rows={3} name="whatHappened" value={editForm.whatHappened as string} onChange={handleEditChange} required className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Body part affected</label>
                <input name="bodyPartAffected" value={editForm.bodyPartAffected as string} onChange={handleEditChange} required className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Object/substance</label>
                <input name="objectOrSubstance" value={editForm.objectOrSubstance as string} onChange={handleEditChange} required className="form-input" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="edit-er" name="treatedInEmergencyRoom" checked={editForm.treatedInEmergencyRoom as boolean} onChange={handleEditChange} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                <label htmlFor="edit-er" className="text-sm text-slate-700">Treated in Emergency Room</label>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="edit-hosp" name="hospitalizedOvernight" checked={editForm.hospitalizedOvernight as boolean} onChange={handleEditChange} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                <label htmlFor="edit-hosp" className="text-sm text-slate-700">Hospitalized Overnight</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Physician Name</label>
                <input name="physicianName" value={editForm.physicianName as string} onChange={handleEditChange} className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Facility Name</label>
                <input name="facilityName" value={editForm.facilityName as string} onChange={handleEditChange} className="form-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Outcome</label>
                <select name="outcome" value={editForm.outcome as string} onChange={handleEditChange} className="form-input">
                  {OUTCOME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Days Away</label>
                <input type="number" name="daysAway" value={editForm.daysAway as number} onChange={handleEditChange} min={0} max={180} className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Days Restricted</label>
                <input type="number" name="daysRestricted" value={editForm.daysRestricted as number} onChange={handleEditChange} min={0} max={180} className="form-input" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Case Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {CASE_TYPE_OPTIONS.map((ct) => (
                    <label key={ct.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="caseType" value={ct.value} checked={editForm.caseType === ct.value} onChange={handleEditChange} className="h-4 w-4 border-slate-300 text-blue-600" />
                      {ct.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="edit-priv" name="isPrivacyCase" checked={editForm.isPrivacyCase as boolean} onChange={handleEditChange} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                  <label htmlFor="edit-priv" className="text-sm text-slate-700">Privacy case</label>
                </div>
                {!!editForm.isPrivacyCase && (
                  <select name="privacyReason" value={editForm.privacyReason as string} onChange={handleEditChange} className="form-input">
                    <option value="">Select reason…</option>
                    {PRIVACY_REASON_OPTIONS.map((pr) => (
                      <option key={pr.value} value={pr.value}>{pr.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <legend className="text-base font-semibold text-slate-900 mb-4">Reason for Change — Required (29 CFR 1904.33)</legend>
            <textarea
              rows={3}
              value={updateReason}
              onChange={(e) => setUpdateReason(e.target.value)}
              required
              className="form-input"
              placeholder="Describe why this record is being updated…"
            />
            {formErrors.reason && <p className="mt-1 text-xs text-red-600">{formErrors.reason}</p>}
          </fieldset>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setEditMode(false)} className="px-4 py-2 rounded-md border btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-sm font-semibold section-label mb-3">Employee</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Name" value={caseData.employeeName} />
                <Field label="Job Title" value={caseData.employeeJobTitle} />
                <Field label="Date of Birth" value={caseData.employeeDOB ? new Date(caseData.employeeDOB).toLocaleDateString("en-US") : null} />
                <Field label="Date Hired" value={caseData.employeeHireDate ? new Date(caseData.employeeHireDate).toLocaleDateString("en-US") : null} />
                <Field
                  label="Address"
                  value={[caseData.employeeStreet, caseData.employeeCity, caseData.employeeState, caseData.employeeZip].filter(Boolean).join(", ") || null}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h2 className="text-sm font-semibold section-label mb-3">Incident</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Date of Injury" value={new Date(caseData.dateOfInjury).toLocaleDateString("en-US")} />
                <Field label="Time" value={caseData.timeOfInjury ?? null} />
                <Field label="Where Event Occurred" value={caseData.whereEventOccurred} />
                <div className="col-span-2 sm:col-span-3">
                  <Field label="What Employee Was Doing" value={caseData.whatEmployeeWasDoing} />
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <Field label="Description of Injury/Illness" value={caseData.whatHappened} />
                </div>
                <Field label="Body Part Affected" value={caseData.bodyPartAffected} />
                <Field label="Object/Substance" value={caseData.objectOrSubstance} />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h2 className="text-sm font-semibold section-label mb-3">Medical</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Treated in ER" value={caseData.treatedInEmergencyRoom} />
                <Field label="Hospitalized Overnight" value={caseData.hospitalizedOvernight} />
                <Field label="Physician" value={caseData.physicianName ?? null} />
                <Field label="Facility" value={caseData.facilityName ?? null} />
                <Field
                  label="Facility Address"
                  value={[caseData.facilityStreet, caseData.facilityCity, caseData.facilityState, caseData.facilityZip].filter(Boolean).join(", ") || null}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h2 className="text-sm font-semibold section-label mb-3">Classification (300 Log)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Field label="Outcome" value={OUTCOME_LABELS[caseData.outcome] ?? caseData.outcome} />
                <Field label="Days Away (K)" value={caseData.daysAway > 0 ? String(caseData.daysAway) : "0"} />
                <Field label="Days Restricted (L)" value={caseData.daysRestricted > 0 ? String(caseData.daysRestricted) : "0"} />
                <Field label="Case Type" value={CASE_TYPE_LABELS[caseData.caseType] ?? caseData.caseType} />
                <Field label="Recordable?" value={caseData.isRecordable ? "Yes" : "No"} />
              </div>
            </div>

            {caseData.isPrivacyCase && (
              <div className="border-t border-slate-100 pt-4">
                <h2 className="text-sm font-semibold section-label mb-3">Privacy</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Privacy Case" value="Yes" />
                  <Field label="Privacy Reason" value={caseData.privacyReason ? PRIVACY_REASON_LABELS[caseData.privacyReason] : null} />
                </div>
              </div>
            )}

            {caseData.severityLevel && (
              <div className="border-t border-slate-100 pt-4">
                <h2 className="text-sm font-semibold section-label mb-3">Severity — 1904.39</h2>
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm font-bold text-red-800">{caseData.severityLevel}</p>
                  {caseData.severeReportedAt && (
                    <p className="mt-1 text-xs text-red-600">
                      Reported: {new Date(caseData.severeReportedAt).toLocaleString("en-US")}
                      {caseData.severeReportMethod ? ` via ${caseData.severeReportMethod}` : ""}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {auditLogs && auditLogs.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-base font-semibold text-slate-900">Audit History</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {auditLogs.map((entry) => (
                  <div key={entry.id} className="px-6 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-700 uppercase">{entry.action}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="text-xs text-slate-500">{entry.user.name ?? entry.user.role}</span>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString("en-US")}
                      </span>
                    </div>
                    {entry.reason && (
                      <p className="mt-1 text-xs text-slate-600">{entry.reason}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
