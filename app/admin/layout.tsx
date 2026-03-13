import { AdminAuthGuard } from "./components/AdminAuthGuard";
import { AdminShell } from "./components/AdminShell";

export const metadata = {
  title: "Admin | Highland Care",
  description: "Super Admin Dashboard for Highland Care platform",
};

export default function AdminLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminShell>{children}</AdminShell>
    </AdminAuthGuard>
  );
}
