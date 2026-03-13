"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AUTH_KEY = "highland_admin_auth";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const ok = typeof window !== "undefined" && sessionStorage.getItem(AUTH_KEY) === "true";
    if (!ok) {
      router.replace("/login");
      return;
    }
    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--highland-surface)]">
        <p className="text-sm text-[var(--highland-muted)]">Checking access...</p>
      </div>
    );
  }

  return <>{children}</>;
}

export function getAuthKey() {
  return AUTH_KEY;
}
