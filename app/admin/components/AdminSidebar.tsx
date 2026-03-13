"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/app/components/Logo";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "dashboard.svg" },
  { href: "/admin/users", label: "User Management", icon: "User Management.svg" },
  { href: "/admin/providers", label: "Service Providers", icon: "Service Providers.svg" },
  { href: "/admin/categories", label: "Categories & Content", icon: "Categories & Content.svg" },
  { href: "/admin/bookings", label: "Bookings & Orders", icon: "Bookings & Orders.svg" },
  { href: "/admin/disputes", label: "Dispute Resolution", icon: "Dispute Resolution.svg" },
  { href: "/admin/financials", label: "Financials & Reporting", icon: "Financials & Reporting.svg" },
  { href: "/admin/notifications", label: "Notifications", icon: "Notifications.svg" },
  { href: "/admin/subscriptions", label: "Subscriptions & Promos", icon: "Subscriptions & Promotions.svg" },
  { href: "/admin/settings", label: "Security & System", icon: "Security & System.svg" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-[#03474A] text-[var(--sidebar-text)]">
      <div className="border-b border-white/10 px-4 py-3">
        <Logo variant="sidebar" className="text-white" />
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-[var(--sidebar-text-muted)] hover:bg-white/10 hover:text-[var(--sidebar-text)]"
                  }`}
                >
                  <span className="flex h-5 w-5 flex-shrink-0 [filter:brightness(0)_invert(1)]" aria-hidden>
                    <img
                      src={`/assets/icons/${encodeURIComponent(item.icon)}`}
                      alt=""
                      className="h-5 w-5 object-contain"
                    />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-white/10 px-4 py-3 text-xs text-[var(--sidebar-text-muted)]">
        Highland Care LLC • Super Admin
      </div>
    </aside>
  );
}
