type FormStatus = "DRAFT" | "IN_REVIEW" | "NEEDS_CHANGES" | "APPROVED" | "FINALIZED" | "ARCHIVED";

const STATUS_CONFIG: Record<FormStatus, { label: string; cls: string }> = {
  DRAFT:         { label: "Draft",          cls: "bg-slate-100 text-slate-700 border-slate-300" },
  IN_REVIEW:     { label: "In Review",      cls: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  NEEDS_CHANGES: { label: "Needs Changes",  cls: "bg-orange-100 text-orange-800 border-orange-300" },
  APPROVED:      { label: "Approved",       cls: "bg-green-100 text-green-800 border-green-300" },
  FINALIZED:     { label: "Finalized",      cls: "bg-blue-100 text-blue-800 border-blue-300" },
  ARCHIVED:      { label: "Archived",       cls: "bg-slate-200 text-slate-600 border-slate-400" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as FormStatus] ?? STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
