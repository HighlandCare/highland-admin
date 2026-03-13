"use client";

import { useState } from "react";
import { AdminTable } from "../components/AdminTable";
import { financialSummary, transactionLedger } from "../data/dummy";

export default function FinancialsPage() {
  const [dateRange, setDateRange] = useState("30d");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Financial Management & Reporting</h1>
        <p className="mt-1">Commission config, payout schedules, financial reports, transaction ledger, reconciliation.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="admin-content-card p-6">
          <h2 className="mb-4 font-medium">Financial reports</h2>
          <div className="mb-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-lg border border-[var(--content-card-border)] bg-transparent px-3 py-2 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <ul className="space-y-2 text-sm">
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
        <div className="admin-content-card p-6">
          <h2 className="mb-4 font-medium">Platform financial settings</h2>
          <p className="text-sm">Commission % per category, payout schedules, fee structures. Configure in Service Provider Management → Commission rates.</p>
        </div>
      </div>

      <div className="admin-content-card p-6">
        <h2 className="mb-4 font-medium">Transaction ledger</h2>
        <p className="mb-4 text-sm">Auditable log: every payment, hold, commission, refund, payout. Reconcile with Stripe/bank records.</p>
        <AdminTable
          columns={[
            { key: "id", header: "TXN ID" },
            { key: "date", header: "Date" },
            { key: "type", header: "Type" },
            { key: "amount", header: "Amount", render: (r) => `$${Number(r.amount).toFixed(2)}` },
            { key: "bookingId", header: "Booking / Provider", render: (r) => ("bookingId" in r && r.bookingId) || ("providerId" in r && r.providerId) || "—" },
          ]}
          data={transactionLedger}
          pageSize={10}
        />
      </div>
    </div>
  );
}
