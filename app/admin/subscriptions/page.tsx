"use client";

import { AdminTable } from "../components/AdminTable";
import { providerPlans, promoCampaigns } from "../data/dummy";

export default function SubscriptionsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Subscription & Promotional Management</h1>
        <p className="mt-1">Provider subscription plans; user promotional campaigns (discount codes, limited-time offers).</p>
      </div>

      <div className="admin-content-card p-6">
        <h2 className="mb-4 font-medium">Provider subscription plans</h2>
        <p className="mb-4 text-sm">e.g. Basic, Featured — profile highlighting, reduced commissions. Set pricing, billing cycles, features.</p>
        <AdminTable
          columns={[
            { key: "id", header: "ID" },
            { key: "name", header: "Plan" },
            { key: "price", header: "Price", render: (r) => r.price === 0 ? "Free" : `$${r.price}/mo` },
            { key: "features", header: "Features" },
            { key: "activeProviders", header: "Active providers" },
            { key: "actions", header: "Actions", render: () => <button type="button" className="text-sm font-medium underline">Edit</button> },
          ]}
          data={providerPlans}
          pageSize={10}
        />
      </div>

      <div className="admin-content-card p-6">
        <h2 className="mb-4 font-medium">User promotional campaigns</h2>
        <p className="mb-4 text-sm">Discount codes, expiry, applicable categories.</p>
        <AdminTable
          columns={[
            { key: "id", header: "ID" },
            { key: "code", header: "Code" },
            { key: "discount", header: "Discount" },
            { key: "expiry", header: "Expiry" },
            { key: "category", header: "Category" },
            { key: "actions", header: "Actions", render: () => <button type="button" className="text-sm font-medium underline">Edit</button> },
          ]}
          data={promoCampaigns}
          pageSize={10}
        />
      </div>
    </div>
  );
}
