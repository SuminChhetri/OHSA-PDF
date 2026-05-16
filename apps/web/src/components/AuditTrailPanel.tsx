"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

const ACTION_LABELS: Record<string, string> = {
  CREATE:              "Created",
  UPDATE:              "Updated",
  DELETE:              "Deleted (soft)",
  CERTIFY:             "Certified 300A",
  STATUS_CHANGE:       "Status changed",
  DOWNLOAD_UNREDACTED: "Downloaded (normal)",
  DOWNLOAD_REDACTED:   "Downloaded (redacted)",
  VIEW_PRIVACY_CASE:   "Viewed privacy case",
  PDF_VIEW:            "Viewed PDF",
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN:       "Admin",
  RECORDKEEPER:"Recordkeeper",
  REVIEWER:    "Reviewer",
  EXECUTIVE:   "Executive",
};

const ROLE_CLS: Record<string, string> = {
  ADMIN:        "bg-red-100 text-red-700",
  EXECUTIVE:    "bg-purple-100 text-purple-700",
  REVIEWER:     "bg-blue-100 text-blue-700",
  RECORDKEEPER: "bg-slate-100 text-slate-700",
};

function parseDiff(before?: string | null, after?: string | null): string | null {
  if (!before && !after) return null;
  try {
    const b = before ? JSON.parse(before) : {};
    const a = after  ? JSON.parse(after)  : {};
    const parts: string[] = [];
    const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
    for (const k of keys) {
      if (b[k] !== a[k]) {
        parts.push(`${k}: ${b[k] ?? "—"} → ${a[k] ?? "—"}`);
      }
    }
    return parts.length ? parts.join(", ") : null;
  } catch {
    return null;
  }
}

interface AuditTrailPanelProps {
  reportingYearId: string;
}

export function AuditTrailPanel({ reportingYearId }: AuditTrailPanelProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading, error } = trpc.audit.forYear.useQuery(
    { reportingYearId },
    { enabled: open }
  );

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-sm font-semibold text-slate-900">Activity &amp; Audit Trail</span>
          {data && (
            <span className="text-xs text-slate-400">({data.length} events)</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4">
          {isLoading && (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600">{error.message}</p>
          )}
          {data && data.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No activity recorded yet.</p>
          )}
          {data && data.length > 0 && (
            <ol className="relative border-l-2 border-slate-200 space-y-0 ml-2">
              {data.map((entry) => {
                const diff = parseDiff(entry.before, entry.after);
                return (
                  <li key={entry.id} className="ml-5 pb-5">
                    <span className="absolute -left-[9px] mt-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 border-slate-300" />
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-slate-800">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ROLE_CLS[entry.user.role] ?? "bg-slate-100 text-slate-600"}`}>
                        {ROLE_LABELS[entry.user.role] ?? entry.user.role}
                      </span>
                      <span className="text-xs text-slate-500">{entry.user.name}</span>
                    </div>
                    {diff && <p className="text-xs text-slate-500 mt-0.5">{diff}</p>}
                    {entry.reason && (
                      <p className="text-xs text-slate-400 italic mt-0.5">&ldquo;{entry.reason}&rdquo;</p>
                    )}
                    <time className="text-[11px] text-slate-400 mt-0.5 block">
                      {new Date(entry.timestamp).toLocaleString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "numeric", minute: "2-digit",
                      })}
                    </time>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
