"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/app/components/Logo";
import { getAuthKey } from "@/app/admin/components/AdminAuthGuard";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) return { valid: false, message: "Password must be at least 8 characters" };
  if (!/[A-Z]/.test(password)) return { valid: false, message: "Password must contain at least 1 uppercase letter" };
  if (!/[0-9]/.test(password)) return { valid: false, message: "Password must contain at least 1 number" };
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, message: "Password must contain at least 1 special character" };
  return { valid: true };
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(getAuthKey()) === "true") {
      router.replace("/admin");
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    const next: { email?: string; password?: string } = {};

    if (!email.trim()) {
      next.email = "Email is required";
    } else if (!emailRegex.test(email.trim())) {
      next.email = "Enter a valid email address";
    }

    const pwdResult = validatePassword(password);
    if (!pwdResult.valid) {
      next.password = pwdResult.message;
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    if (typeof window !== "undefined") {
      sessionStorage.setItem(getAuthKey(), "true");
    }
    router.push("/admin");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--highland-surface)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo variant="default" className="text-[var(--highland-primary)]" />
        </div>
        <div className="admin-content-card p-6">
          <h1 className="text-xl font-semibold text-[var(--highland-primary)]">Admin login</h1>
          <p className="mt-1 text-sm text-[var(--highland-muted)]">Sign in to access the dashboard.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--highland-primary)]">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--content-card-border)] bg-transparent px-3 py-2 text-sm"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--highland-primary)]">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[var(--content-card-border)] bg-transparent py-2 pl-3 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--highland-muted)] hover:text-[var(--highland-primary)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              <p className="mt-1 text-xs text-[var(--highland-muted)]">
                Min 8 characters, 1 uppercase, 1 number, 1 special character
              </p>
            </div>
            {submitError && <p className="text-sm text-red-600">{submitError}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-[#03474A] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
