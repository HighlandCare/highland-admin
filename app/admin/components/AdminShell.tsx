"use client";

import { usePathname } from "next/navigation";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

const pathToTitle: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "User Management",
  "/admin/providers": "Service Providers",
  "/admin/categories": "Categories & Content",
  "/admin/bookings": "Bookings & Orders",
  "/admin/disputes": "Dispute Resolution",
  "/admin/financials": "Financials & Reporting",
  "/admin/notifications": "Notifications",
  "/admin/subscriptions": "Subscriptions & Promos",
  "/admin/settings": "Security & System",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = pathToTitle[pathname] ?? "Admin";

  return (
    <div className="flex h-screen bg-[var(--background)]">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader title={title} />
        <main className="admin-content-section flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="admin-content-scroll min-h-0 flex-1 overflow-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
