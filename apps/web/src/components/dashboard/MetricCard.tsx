interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  cfr: string;
  numericValue: number | null | undefined;
  thresholds: { green: number; yellow: number } | null;
}

export function MetricCard({ title, value, subtitle, cfr, numericValue, thresholds }: MetricCardProps) {
  type Status = "neutral" | "green" | "yellow" | "red";
  let status: Status = "neutral";

  if (thresholds !== null && numericValue !== null && numericValue !== undefined) {
    if (numericValue < thresholds.green) status = "green";
    else if (numericValue < thresholds.yellow) status = "yellow";
    else status = "red";
  }

  const statusStyles: Record<Status, { card: string; value: string; dot: string }> = {
    neutral: { card: "bg-white border-slate-200/80", value: "text-slate-900", dot: "bg-slate-300" },
    green:   { card: "bg-emerald-50 border-emerald-200/80", value: "text-emerald-800", dot: "bg-emerald-400" },
    yellow:  { card: "bg-amber-50 border-amber-200/80", value: "text-amber-800", dot: "bg-amber-400" },
    red:     { card: "bg-red-50 border-red-200/80", value: "text-red-800", dot: "bg-red-400" },
  };

  const s = statusStyles[status];

  return (
    <div className={`rounded-xl border p-5 ${s.card}`}
      style={{ boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.04)" }}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="section-label">{title}</p>
        {status !== "neutral" && (
          <div className={`w-2 h-2 rounded-full ${s.dot}`} />
        )}
      </div>
      <p className={`text-3xl font-bold tracking-tight ${s.value}`}>{value}</p>
      <p className="mt-1.5 text-xs text-slate-500">{subtitle}</p>
      <p className="mt-3 text-[10px] font-mono text-slate-400/80">{cfr}</p>
    </div>
  );
}
