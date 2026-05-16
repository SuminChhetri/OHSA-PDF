import { getServerClient } from "@/lib/trpc-server";
import { MetricCard } from "@/components/dashboard/MetricCard";

interface DashboardPageProps {
  searchParams: { eid?: string; ryid?: string };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const currentYear = new Date().getFullYear();
  const { eid, ryid } = searchParams;

  if (!eid || !ryid) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="page-title mb-6">Dashboard — {currentYear}</h1>
        <div className="card">
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <p className="text-slate-700 font-medium">Select an establishment to get started</p>
            <p className="mt-1 text-sm text-slate-500">
              Go to{" "}
              <a href="/establishments" className="text-blue-600 hover:underline font-medium">
                Establishments
              </a>{" "}
              and choose a reporting year to view your metrics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const client = await getServerClient();

  let dashboardData: Awaited<ReturnType<typeof client.metrics.dashboard>> | null = null;
  let trendData: Awaited<ReturnType<typeof client.metrics.trend>> | null = null;
  let multiYearData: Awaited<ReturnType<typeof client.metrics.multiYear>> | null = null;
  let dashboardError: string | null = null;

  try {
    [dashboardData, trendData] = await Promise.all([
      client.metrics.dashboard({ reportingYearId: ryid }),
      client.metrics.trend({ reportingYearId: ryid }),
    ]);
    multiYearData = await client.metrics.multiYear({ establishmentId: eid });
  } catch (err: unknown) {
    dashboardError = err instanceof Error ? err.message : "Failed to load metrics.";
  }

  if (dashboardError) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="page-title mb-6">Dashboard — {currentYear}</h1>
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {dashboardError}
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const fmt = (n: number | null | undefined) =>
    n == null ? "N/A" : n.toFixed(2);

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="section-label mb-1">Safety Metrics</p>
          <h1 className="page-title">
            {dashboardData.establishmentName}
            <span className="text-slate-400 font-normal ml-2 text-2xl">— {dashboardData.year}</span>
          </h1>
        </div>
        <a href="/establishments" className="text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors">
          Change establishment →
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="TRIR"
          value={fmt(dashboardData.rates.trir)}
          subtitle="per 100 FTE"
          cfr="29 CFR 1904"
          numericValue={dashboardData.rates.trir}
          thresholds={{ green: 2, yellow: 5 }}
        />
        <MetricCard
          title="DART Rate"
          value={fmt(dashboardData.rates.dart)}
          subtitle="per 100 FTE"
          cfr="29 CFR 1904.7"
          numericValue={dashboardData.rates.dart}
          thresholds={{ green: 1.5, yellow: 3 }}
        />
        <MetricCard
          title="Severity Rate"
          value={fmt(dashboardData.rates.severityRate)}
          subtitle="days away per 100 FTE"
          cfr="29 CFR 1904.7"
          numericValue={dashboardData.rates.severityRate}
          thresholds={{ green: 20, yellow: 60 }}
        />
        <MetricCard
          title="Total Recordable"
          value={String(dashboardData.totalRecordable)}
          subtitle={`${dashboardData.injuries} injuries / ${dashboardData.illnesses} illnesses`}
          cfr="29 CFR 1904.4"
          numericValue={null}
          thresholds={null}
        />
      </div>

      {trendData && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <p className="section-label mb-0.5">Monthly Breakdown</p>
              <h2 className="text-base font-semibold text-slate-900">Trend — {dashboardData.year}</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="text-right">Cases</th>
                  <th className="text-right">DART</th>
                  <th className="text-right">Days Away</th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((row) => {
                  const [, monthNum] = row.month.split("-");
                  const mName = monthNames[parseInt(monthNum, 10) - 1];
                  return (
                    <tr key={row.month}>
                      <td className="font-medium text-slate-800">{mName}</td>
                      <td className="text-right">{row.total}</td>
                      <td className="text-right">{row.dart}</td>
                      <td className="text-right">{row.daysAway}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50/50">
                  <td className="px-4 py-2.5 font-semibold text-slate-900 text-sm">Total</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-900 text-sm">
                    {trendData.reduce((s, r) => s + r.total, 0)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-900 text-sm">
                    {trendData.reduce((s, r) => s + r.dart, 0)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-900 text-sm">
                    {trendData.reduce((s, r) => s + r.daysAway, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {multiYearData && multiYearData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <p className="section-label mb-0.5">Historical</p>
            <h2 className="text-base font-semibold text-slate-900">Multi-Year Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th className="text-right">Recordable</th>
                  <th className="text-right">DART Cases</th>
                  <th className="text-right">TRIR</th>
                  <th className="text-right">DART Rate</th>
                  <th className="text-right">Avg Employees</th>
                  <th className="text-right">Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {multiYearData.map((row) => (
                  <tr key={row.year}
                    className={row.year === dashboardData!.year ? "!bg-blue-50/60" : ""}>
                    <td className="font-semibold text-slate-800">
                      {row.year}
                      {row.year === dashboardData!.year && (
                        <span className="ml-2 text-[10px] font-semibold text-blue-600 bg-blue-100 rounded px-1.5 py-0.5 uppercase tracking-wide">Current</span>
                      )}
                    </td>
                    <td className="text-right">{row.totalRecordable}</td>
                    <td className="text-right">{row.dartCases}</td>
                    <td className="text-right">{fmt(row.trir)}</td>
                    <td className="text-right">{fmt(row.dartRate)}</td>
                    <td className="text-right">{row.avgEmployees ?? "—"}</td>
                    <td className="text-right">{row.totalHoursWorked?.toLocaleString() ?? "—"}</td>
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
