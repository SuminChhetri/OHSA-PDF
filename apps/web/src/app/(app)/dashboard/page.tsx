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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Dashboard — {currentYear}
        </h1>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
          <p className="text-blue-800 font-medium">
            Select an establishment and reporting year to view metrics.
          </p>
          <p className="mt-1 text-sm text-blue-600">
            Go to{" "}
            <a href="/establishments" className="underline font-medium">
              Establishments
            </a>{" "}
            to choose a reporting year.
          </p>
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard — {currentYear}</h1>
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {dashboardError}
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const fmt = (n: number | null | undefined) =>
    n == null ? "N/A" : n.toFixed(2);

  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard — {dashboardData.establishmentName} ({dashboardData.year})
        </h1>
        <a
          href="/establishments"
          className="text-sm text-blue-600 hover:underline"
        >
          Change establishment
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Trend — {dashboardData.year}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cases</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">DART</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Days Away</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trendData.map((row) => {
                  const [, monthNum] = row.month.split("-");
                  const mName = monthNames[parseInt(monthNum, 10) - 1];
                  return (
                    <tr key={row.month} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{mName}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{row.total}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{row.dart}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{row.daysAway}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td className="px-4 py-2 font-semibold text-gray-900">Total</td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">
                    {trendData.reduce((s, r) => s + r.total, 0)}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">
                    {trendData.reduce((s, r) => s + r.dart, 0)}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">
                    {trendData.reduce((s, r) => s + r.daysAway, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {multiYearData && multiYearData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Multi-Year Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Recordable</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">DART Cases</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">TRIR</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">DART Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Employees</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {multiYearData.map((row) => (
                  <tr key={row.year} className={`hover:bg-gray-50 ${row.year === dashboardData!.year ? "bg-blue-50" : ""}`}>
                    <td className="px-4 py-2 font-medium text-gray-900">{row.year}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{row.totalRecordable}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{row.dartCases}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{fmt(row.trir)}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{fmt(row.dartRate)}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{row.avgEmployees ?? "—"}</td>
                    <td className="px-4 py-2 text-right text-gray-700">
                      {row.totalHoursWorked?.toLocaleString() ?? "—"}
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
