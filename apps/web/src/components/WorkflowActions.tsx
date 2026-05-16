"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/StatusBadge";

type FormStatus = "DRAFT" | "IN_REVIEW" | "NEEDS_CHANGES" | "APPROVED" | "FINALIZED" | "ARCHIVED";

// Which transitions each role can initiate
const ALLOWED_ACTIONS: Record<string, Array<{ to: FormStatus; label: string; variant: string; requiresComment?: boolean }>> = {
  DRAFT: [
    { to: "IN_REVIEW", label: "Submit for Review", variant: "primary" },
  ],
  IN_REVIEW: [
    { to: "APPROVED",       label: "Approve",          variant: "success" },
    { to: "NEEDS_CHANGES",  label: "Request Changes",  variant: "warning", requiresComment: true },
  ],
  NEEDS_CHANGES: [
    { to: "IN_REVIEW", label: "Resubmit for Review", variant: "primary" },
  ],
  APPROVED: [
    { to: "FINALIZED", label: "Finalize", variant: "success" },
  ],
  FINALIZED: [],
  ARCHIVED:  [],
};

// Which roles can trigger which target statuses
const ROLE_CAN: Record<FormStatus, string[]> = {
  DRAFT:         ["ADMIN"],
  IN_REVIEW:     ["RECORDKEEPER", "REVIEWER", "EXECUTIVE", "ADMIN"],
  NEEDS_CHANGES: ["REVIEWER", "EXECUTIVE", "ADMIN"],
  APPROVED:      ["REVIEWER", "EXECUTIVE", "ADMIN"],
  FINALIZED:     ["EXECUTIVE", "ADMIN"],
  ARCHIVED:      ["ADMIN"],
};

interface WorkflowActionsProps {
  yearId: string;
  status: string;
  role: string;
  reviewerComment?: string | null;
  version: number;
  finalizedAt?: Date | string | null;
  preparedBy?: { name: string; role: string } | null;
  reviewedBy?: { name: string; role: string } | null;
  approvedBy?: { name: string; role: string } | null;
  onStatusChanged: () => void;
}

const VARIANT_CLS: Record<string, string> = {
  primary: "btn-primary",
  success: "inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50",
  warning: "inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors disabled:opacity-50",
};

export function WorkflowActions({
  yearId, status, role, reviewerComment, version,
  finalizedAt, preparedBy, reviewedBy, approvedBy, onStatusChanged,
}: WorkflowActionsProps) {
  const currentStatus = status as FormStatus;
  const actions = (ALLOWED_ACTIONS[currentStatus] ?? []).filter(
    (a) => ROLE_CAN[a.to]?.includes(role)
  );

  const [activeAction, setActiveAction] = useState<FormStatus | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const updateStatus = trpc.reportingYears.updateStatus.useMutation({
    onSuccess: () => {
      setActiveAction(null);
      setComment("");
      setError("");
      onStatusChanged();
    },
    onError: (e) => setError(e.message),
  });

  function handleSubmit(target: FormStatus) {
    setError("");
    updateStatus.mutate({ id: yearId, status: target, comment: comment || undefined });
  }

  return (
    <div className="card p-5 space-y-4">
      {/* Status header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Form Status</p>
          <div className="flex items-center gap-3">
            <StatusBadge status={currentStatus} />
            {version > 1 && (
              <span className="text-xs text-slate-400">v{version}</span>
            )}
            {finalizedAt && (
              <span className="text-xs text-slate-400">
                Finalized {new Date(finalizedAt).toLocaleDateString("en-US")}
              </span>
            )}
          </div>
        </div>

        {/* Prepared / Reviewed / Approved by */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          {preparedBy && (
            <span>Prepared by <span className="font-medium text-slate-700">{preparedBy.name}</span></span>
          )}
          {reviewedBy && (
            <span>Reviewed by <span className="font-medium text-slate-700">{reviewedBy.name}</span></span>
          )}
          {approvedBy && (
            <span>Approved by <span className="font-medium text-slate-700">{approvedBy.name}</span></span>
          )}
        </div>
      </div>

      {/* Reviewer comment */}
      {reviewerComment && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-800 mb-0.5">Reviewer Note</p>
          <p className="text-sm text-amber-700">{reviewerComment}</p>
        </div>
      )}

      {/* Action buttons */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <button
              key={action.to}
              onClick={() => {
                if (action.requiresComment) {
                  setActiveAction(action.to);
                } else {
                  handleSubmit(action.to);
                }
              }}
              disabled={updateStatus.isPending}
              className={VARIANT_CLS[action.variant] ?? "btn-secondary"}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Comment form for actions that require a note */}
      {activeAction && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">Add a reviewer note (required)</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Describe what needs to be corrected…"
            className="form-input resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit(activeAction)}
              disabled={updateStatus.isPending || !comment.trim()}
              className="btn-primary"
            >
              {updateStatus.isPending ? "Saving…" : "Confirm"}
            </button>
            <button
              onClick={() => { setActiveAction(null); setComment(""); }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {currentStatus === "FINALIZED" && (
        <p className="text-xs text-slate-400">
          This form is finalized and locked. Contact an admin to reopen.
        </p>
      )}
    </div>
  );
}
