"use client";

import { AdminTable } from "../components/AdminTable";
import {
  onboardingQueue,
  providerDirectory,
  commissionRates,
} from "../data/dummy";

export default function ProvidersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Service Provider Management</h1>
        <p className="mt-1">Onboarding queue, provider directory, performance metrics, commissions, ledgers, incentives & sanctions.</p>
      </div>

      <div className="admin-content-card p-6">
        <h2 className="mb-4 font-medium">Onboarding Queue</h2>
        <p className="mb-4 text-sm">Review, verify documents, Approve or Reject new provider applications.</p>
        <AdminTable
          columns={[
            { key: "id", header: "Application ID" },
            { key: "name", header: "Business name" },
            { key: "category", header: "Category" },
            { key: "submitted", header: "Submitted" },
            { key: "documents", header: "Documents" },
            { key: "actions", header: "Actions", render: () => <><button type="button" className="mr-2 text-sm font-medium underline">Approve</button><button type="button" className="text-sm font-medium underline">Reject</button></> },
          ]}
          data={onboardingQueue}
          pageSize={10}
        />
      </div>

      <div className="admin-content-card p-6">
        <h2 className="mb-4 font-medium">Provider Directory</h2>
        <p className="mb-4 text-sm">Filters: category, location, rating, status. Performance: acceptance rate, rating, response time, cancellation rate.</p>
        <AdminTable
          columns={[
            { key: "id", header: "ID" },
            { key: "name", header: "Name" },
            { key: "category", header: "Category" },
            { key: "location", header: "Location" },
            { key: "rating", header: "Rating" },
            { key: "status", header: "Status" },
            { key: "acceptanceRate", header: "Acceptance %", render: (r) => `${r.acceptanceRate}%` },
            { key: "actions", header: "Actions", render: () => <button type="button" className="text-sm font-medium underline">View / Ledger</button> },
          ]}
          data={providerDirectory}
          pageSize={10}
        />
      </div>

      <div className="admin-content-card p-6">
        <h2 className="mb-4 font-medium">Platform commission rates by category</h2>
        <AdminTable
          columns={[
            { key: "category", header: "Category" },
            { key: "rate", header: "Commission %", render: (r) => `${r.rate}%` },
          ]}
          data={commissionRates}
        />
      </div>
    </div>
  );
}
