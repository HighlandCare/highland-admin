"use client";

import { useRouter } from "next/navigation";
import { getAuthKey } from "./AdminAuthGuard";

export function AdminHeader({ title }: { title: string }) {
  const router = useRouter();

  function handleLogout() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(getAuthKey());
    }
    router.push("/login");
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#03474A] px-6">
      <h1 className="text-lg font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-white/80">Super Admin</span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20"
        >
          Log out
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/20 text-sm font-medium text-white">
          A
        </div>
      </div>
    </header>
  );
}
