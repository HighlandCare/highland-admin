"use client";

import { AdminTable } from "../components/AdminTable";
import { auditLog } from "../data/dummy";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Security, Compliance & System Operations</h1>
        <p className="mt-1">Global platform settings, admin access controls, data privacy, system health.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="admin-content-card p-6">
          <h2 className="mb-4 font-medium">Global platform settings</h2>
          <p className="mb-4 text-sm">Countries/currencies, tax config, API keys (Maps, SMS, Payment Gateway).</p>
          <ul className="space-y-2 text-sm">
            <li>Countries: US, CA</li>
            <li>Currency: USD</li>
            <li>API keys: Configure in env / settings</li>
          </ul>
        </div>
        <div className="admin-content-card p-6">
          <h2 className="mb-4 font-medium">Admin access controls</h2>
          <p className="mb-4 text-sm">Role-based permissions (Support Agent, Finance Manager, Super Admin); audit logs.</p>
          <p className="text-xs">Roles: Super Admin, Finance Manager, Support Agent.</p>
        </div>
        <div className="admin-content-card p-6">
          <h2 className="mb-4 font-medium">Data privacy compliance</h2>
          <p className="text-sm">Data export and account deletion requests.</p>
        </div>
        <div className="admin-content-card p-6">
          <h2 className="mb-4 font-medium">System health</h2>
          <p className="text-sm">Server status, third-party API connectivity, error logs.</p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>API: OK</li>
            <li>Stripe: OK</li>
            <li>Last error log: —</li>
          </ul>
        </div>
      </div>

      <div className="admin-content-card p-6">
        <h2 className="mb-4 font-medium">Audit log (sample)</h2>
        <AdminTable
          columns={[
            { key: "time", header: "Time" },
            { key: "admin", header: "Admin" },
            { key: "action", header: "Action" },
          ]}
          data={auditLog}
          pageSize={10}
        />
      </div>
    </div>
  );
}
