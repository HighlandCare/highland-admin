"use client";

import {
  dashboardKpis,
  bookingCountByCategory,
  userAcquisitionTrend,
  financialSummary,
} from "./data/dummy";

const maxBookings = Math.max(...bookingCountByCategory.map((c) => c.count));
const maxUsers = Math.max(...userAcquisitionTrend.map((u) => u.users));

const CHART_COLORS = ["#62B2FD", "#9BDFC4", "#F99BAB", "#FFB44F", "#9F97F7"];
const CHART_COLORS_REVERSE = [...CHART_COLORS].reverse();

export default function AdminDashboardPage() {
  const kpis = [
    { label: "Total Active Users", value: dashboardKpis.totalActiveUsers.toLocaleString(), sub: "Real-time" },
    { label: "Total Verified Providers", value: dashboardKpis.totalVerifiedProviders.toLocaleString(), sub: "All categories" },
    { label: "Total Bookings", value: dashboardKpis.totalBookings.toLocaleString(), sub: "With category breakdown" },
    { label: "Platform Revenue", value: `$${dashboardKpis.platformRevenue.toLocaleString()}`, sub: "Commissions / ads" },
    { label: "Open Dispute Cases", value: dashboardKpis.openDisputeCases.toString(), sub: "Requires attention" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard & Analytics</h1>
        <p className="mt-1">Executive overview and real-time KPIs across the platform.</p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-medium">Key performance indicators</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="admin-content-card p-5">
              <p className="text-sm font-medium">{kpi.label}</p>
              <p className="mt-2 text-2xl font-bold">{kpi.value}</p>
              <p className="mt-1 text-xs">{kpi.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Charts</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="admin-content-card min-h-[280px] p-6">
            <p className="text-sm font-medium">User acquisition trends</p>
            <div className="mt-4 flex h-48 items-end justify-between gap-1">
              {userAcquisitionTrend.map((d, i) => (
                <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${(d.users / maxUsers) * 120}px`,
                      minHeight: 4,
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                  <span className="text-xs">{d.month}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="admin-content-card min-h-[280px] p-6">
            <p className="text-sm font-medium">Booking volume by category</p>
            <div className="mt-4 flex h-48 items-end justify-between gap-1">
              {bookingCountByCategory.map((d, i) => (
                <div key={d.category} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${(d.count / maxBookings) * 120}px`,
                      minHeight: 4,
                      backgroundColor: CHART_COLORS_REVERSE[i % CHART_COLORS_REVERSE.length],
                    }}
                  />
                  <span className="text-center text-xs">{d.category}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="admin-content-card min-h-[200px] p-6">
            <p className="text-sm font-medium">Financial summary</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Gross transaction volume</span>
                <span className="font-medium">${financialSummary.grossVolume.toLocaleString()}</span>
              </li>
              <li className="flex justify-between">
                <span>Commission earned</span>
                <span className="font-medium">${financialSummary.commissionEarned.toLocaleString()}</span>
              </li>
              <li className="flex justify-between">
                <span>Net revenue</span>
                <span className="font-medium">${financialSummary.netRevenue.toLocaleString()}</span>
              </li>
              <li className="flex justify-between">
                <span>Payouts</span>
                <span className="font-medium">${financialSummary.payouts.toLocaleString()}</span>
              </li>
            </ul>
          </div>
          <div className="admin-content-card min-h-[200px] p-6">
            <p className="text-sm font-medium">Provider performance metrics</p>
            <p className="mt-4 text-sm">Acceptance rate, rating, response time, cancellation rate — connect to provider API for live metrics.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
