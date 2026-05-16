"use client";

import Link from "next/link";

type CaseRow = {
  id: string;
  caseNumber: string;
  employeeName: string;
  employeeJobTitle: string;
  dateOfInjury: Date | string;
  whereEventOccurred: string;
  whatHappened: string;
  isPrivacyCase: boolean;
  outcome: string;
  daysAway: number;
  daysRestricted: number;
  caseType: string;
};

interface LogTableProps {
  cases: CaseRow[];
  onAddCase: () => void;
}

const outcomeMap: Record<string, { col: string; label: string }> = {
  DEATH: { col: "G", label: "Death" },
  DAYS_AWAY: { col: "H", label: "Days Away" },
  RESTRICTED_TRANSFER: { col: "I", label: "Restricted/Transfer" },
  OTHER_RECORDABLE: { col: "J", label: "Other Recordable" },
};

const caseTypeMap: Record<string, string> = {
  INJURY: "M1",
  SKIN_DISORDER: "M2",
  RESPIRATORY: "M3",
  POISONING: "M4",
  HEARING_LOSS: "M5",
  ALL_OTHER_ILLNESS: "M6",
};

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <div
      className={`inline-flex items-center justify-center w-4 h-4 border rounded-sm text-xs font-bold ${
        checked
          ? "bg-gray-900 border-gray-900 text-white"
          : "border-slate-300 bg-white"
      }`}
    >
      {checked ? "✓" : ""}
    </div>
  );
}

export function LogTable({ cases, onAddCase }: LogTableProps) {
  if (cases.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="text-center py-16 text-slate-500">
          <p className="font-medium">No cases recorded yet.</p>
          <p className="mt-1 text-sm">Click "Add New Case" to record the first case.</p>
          <button onClick={onAddCase} className="mt-4 btn-primary">
            Add New Case
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
        Log of Work-Related Injuries and Illnesses — OSHA Form 300
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b-2 border-slate-300">
              <th className="border border-slate-200 px-2 py-2 text-left font-semibold text-slate-700 whitespace-nowrap">
                (A) Case #
              </th>
              <th className="border border-slate-200 px-2 py-2 text-left font-semibold text-slate-700 min-w-[120px]">
                (B) Employee Name
              </th>
              <th className="border border-slate-200 px-2 py-2 text-left font-semibold text-slate-700 min-w-[100px]">
                (C) Job Title
              </th>
              <th className="border border-slate-200 px-2 py-2 text-left font-semibold text-slate-700 whitespace-nowrap">
                (D) Date
              </th>
              <th className="border border-slate-200 px-2 py-2 text-left font-semibold text-slate-700 min-w-[120px]">
                (E) Location
              </th>
              <th className="border border-slate-200 px-2 py-2 text-left font-semibold text-slate-700 min-w-[160px]">
                (F) Description
              </th>
              <th className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-700 w-8" title="Death">
                G
              </th>
              <th className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-700 w-8" title="Days Away">
                H
              </th>
              <th className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-700 w-8" title="Restricted/Transfer">
                I
              </th>
              <th className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-700 w-8" title="Other Recordable">
                J
              </th>
              <th className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-700 w-12">
                (K) Away
              </th>
              <th className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-700 w-12">
                (L) Restr.
              </th>
              <th className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-700 w-8" title="Injury">
                M1
              </th>
              <th className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-700 w-8" title="Skin Disorder">
                M2
              </th>
              <th className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-700 w-8" title="Respiratory">
                M3
              </th>
              <th className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-700 w-8" title="Poisoning">
                M4
              </th>
              <th className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-700 w-8" title="Hearing Loss">
                M5
              </th>
              <th className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-700 w-8" title="All Other Illness">
                M6
              </th>
              <th className="border border-slate-200 px-2 py-2 text-center font-semibold text-slate-700">
                View
              </th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const isFatal = c.outcome === "DEATH";
              const isPrivacy = c.isPrivacyCase;
              const rowClass = isFatal
                ? "bg-red-50"
                : isPrivacy
                ? "bg-yellow-50"
                : "hover:bg-slate-50";

              return (
                <tr key={c.id} className={`border-b border-slate-100 ${rowClass}`}>
                  <td className="border border-slate-200 px-2 py-1.5 text-slate-900 font-mono whitespace-nowrap">
                    {c.caseNumber}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-slate-800">
                    <div className="flex items-center gap-1">
                      {isPrivacy && (
                        <span title="Privacy case — 1904.29(b)(6)" className="text-yellow-600">
                          🔒
                        </span>
                      )}
                      <span className={isPrivacy ? "italic text-slate-500" : ""}>
                        {c.employeeName}
                      </span>
                    </div>
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-slate-700">
                    {c.employeeJobTitle}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-slate-700 whitespace-nowrap">
                    {new Date(c.dateOfInjury).toLocaleDateString("en-US")}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-slate-700">
                    {c.whereEventOccurred}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-slate-700 max-w-[200px] truncate" title={c.whatHappened}>
                    {c.whatHappened}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center">
                    <CheckBox checked={c.outcome === "DEATH"} />
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center">
                    <CheckBox checked={c.outcome === "DAYS_AWAY"} />
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center">
                    <CheckBox checked={c.outcome === "RESTRICTED_TRANSFER"} />
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center">
                    <CheckBox checked={c.outcome === "OTHER_RECORDABLE"} />
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-700">
                    {c.daysAway > 0 ? c.daysAway : "—"}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-700">
                    {c.daysRestricted > 0 ? c.daysRestricted : "—"}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center">
                    <CheckBox checked={c.caseType === "INJURY"} />
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center">
                    <CheckBox checked={c.caseType === "SKIN_DISORDER"} />
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center">
                    <CheckBox checked={c.caseType === "RESPIRATORY"} />
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center">
                    <CheckBox checked={c.caseType === "POISONING"} />
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center">
                    <CheckBox checked={c.caseType === "HEARING_LOSS"} />
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center">
                    <CheckBox checked={c.caseType === "ALL_OTHER_ILLNESS"} />
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center">
                    <Link
                      href={`/cases/${c.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 text-xs text-gray-400 border-t border-slate-100">
        G=Death · H=Days Away · I=Restricted/Transfer · J=Other Recordable · K=Days Away Count · L=Days Restricted Count · M1–M6=Case Type
        {" · "}
        <span className="inline-block w-3 h-3 bg-yellow-50 border border-yellow-200 rounded-sm align-middle mr-1" />Privacy case
        {" · "}
        <span className="inline-block w-3 h-3 bg-red-50 border border-red-200 rounded-sm align-middle mr-1" />Fatality
      </div>
    </div>
  );
}
