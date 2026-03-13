"use client";

import { AdminTable } from "../components/AdminTable";
import { notificationTemplates } from "../data/dummy";

export default function NotificationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Notification & Communication Management</h1>
        <p className="mt-1">Manage notification templates; broadcast messages to users or segments.</p>
      </div>

      <div className="admin-content-card p-6">
        <h2 className="mb-4 font-medium">Notification templates</h2>
        <p className="mb-4 text-sm">Push and email templates for booking confirmations, status updates, etc.</p>
        <AdminTable
          columns={[
            { key: "id", header: "ID" },
            { key: "name", header: "Template name" },
            { key: "channel", header: "Channel" },
            { key: "event", header: "Event" },
            { key: "actions", header: "Actions", render: () => <button type="button" className="text-sm font-medium underline">Edit</button> },
          ]}
          data={notificationTemplates}
          pageSize={10}
        />
      </div>

      <div className="admin-content-card p-6">
        <h2 className="mb-4 font-medium">Broadcast messaging</h2>
        <p className="mb-4 text-sm">Send announcements to all users or to targeted segments (e.g. city, provider category).</p>
        <div className="rounded-lg border border-dashed border-[var(--content-card-border)] bg-black/5 p-6">
          <p className="text-sm">Compose message</p>
          <textarea placeholder="Message content..." className="mt-2 w-full rounded border border-[var(--content-card-border)] bg-transparent p-3 text-sm min-h-[100px]" />
          <div className="mt-4 flex gap-2">
            <select className="rounded-lg border border-[var(--content-card-border)] bg-transparent px-3 py-2 text-sm">
              <option>All users</option>
              <option>By city</option>
              <option>Providers by category</option>
            </select>
            <button type="button" className="rounded-lg bg-[var(--highland-primary)] px-4 py-2 text-sm font-medium text-white">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}
