interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  cfr: string;
  numericValue: number | null | undefined;
  thresholds: { green: number; yellow: number } | null;
}

export function MetricCard({
  title,
  value,
  subtitle,
  cfr,
  numericValue,
  thresholds,
}: MetricCardProps) {
  let colorClass = "bg-white border-gray-200";
  let valueColorClass = "text-gray-900";

  if (thresholds !== null && numericValue !== null && numericValue !== undefined) {
    if (numericValue < thresholds.green) {
      colorClass = "bg-green-50 border-green-200";
      valueColorClass = "text-green-800";
    } else if (numericValue < thresholds.yellow) {
      colorClass = "bg-yellow-50 border-yellow-200";
      valueColorClass = "text-yellow-800";
    } else {
      colorClass = "bg-red-50 border-red-200";
      valueColorClass = "text-red-800";
    }
  }

  return (
    <div className={`rounded-xl border shadow-sm p-5 ${colorClass}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${valueColorClass}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      <p className="mt-3 text-xs text-gray-400">{cfr}</p>
    </div>
  );
}
