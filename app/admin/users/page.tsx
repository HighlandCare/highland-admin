"use client";

import { useState } from "react";
import { AdminTable } from "../components/AdminTable";
import { users } from "../data/dummy";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">User Management</h1>
        <p className="mt-1">View, search, filter, and manage all registered user accounts.</p>
      </div>

      <div className="admin-content-card p-6">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <input
            type="search"
            placeholder="Search by name, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-[var(--content-card-border)] bg-transparent px-3 py-2 text-sm min-w-[200px]"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[var(--content-card-border)] bg-transparent px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
        <AdminTable
          columns={[
            { key: "id", header: "ID" },
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "status", header: "Status", render: (r) => <span className={r.status === "Active" ? "" : "opacity-80"}>{r.status}</span> },
            { key: "joined", header: "Joined" },
            { key: "bookings", header: "Bookings" },
            { key: "actions", header: "Actions", render: () => <button type="button" className="text-sm font-medium underline">View profile</button> },
          ]}
          data={filtered}
          emptyMessage="No users match your filters."
          pageSize={10}
        />
      </div>
    </div>
  );
}
