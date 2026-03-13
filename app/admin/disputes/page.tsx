"use client";

import { useState } from "react";
import { AdminTable } from "../components/AdminTable";
import { disputesList } from "../data/dummy";

export default function DisputesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = disputesList.filter(
    (d) => statusFilter === "all" || d.status === statusFilter
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dispute Resolution Center</h1>
        <p className="mt-1">Manage and arbitrate disputes; unified case view; communicate with parties; binding rulings.</p>
      </div>

      <div className="admin-content-card p-6">
        <h2 className="mb-4 font-medium">Open & closed cases</h2>
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[var(--content-card-border)] bg-transparent px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="Open">Open</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <AdminTable
          columns={[
            { key: "id", header: "Case ID" },
            { key: "bookingId", header: "Booking ID" },
            { key: "category", header: "Category" },
            { key: "amount", header: "Amount", render: (r) => `$${r.amount.toFixed(2)}` },
            { key: "status", header: "Status" },
            { key: "raisedBy", header: "Raised by" },
            { key: "actions", header: "Actions", render: () => <button type="button" className="text-sm font-medium underline">Open case</button> },
          ]}
          data={filtered}
          pageSize={10}
        />
      </div>
    </div>
  );
}
