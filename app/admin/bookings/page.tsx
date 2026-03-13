"use client";

import { useState } from "react";
import { AdminTable } from "../components/AdminTable";
import { bookingsList } from "../data/dummy";

export default function BookingsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = bookingsList.filter(
    (b) => statusFilter === "all" || b.status === statusFilter
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Booking & Order Management</h1>
        <p className="mt-1">Master bookings list, detailed booking inspector, admin intervention (cancel, refunds, notes, escalate to dispute).</p>
      </div>

      <div className="admin-content-card p-6">
        <h2 className="mb-4 font-medium">Master Bookings List</h2>
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[var(--content-card-border)] bg-transparent px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="Completed">Completed</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <AdminTable
          columns={[
            { key: "id", header: "Booking ID" },
            { key: "user", header: "User" },
            { key: "provider", header: "Provider" },
            { key: "category", header: "Category" },
            { key: "date", header: "Date" },
            { key: "status", header: "Status" },
            { key: "payment", header: "Payment" },
            { key: "actions", header: "Actions", render: () => <button type="button" className="text-sm font-medium underline">Open inspector</button> },
          ]}
          data={filtered}
          pageSize={10}
        />
      </div>
    </div>
  );
}
