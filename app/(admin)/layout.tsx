import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { ToastProvider } from "@/components/admin/ToastContext";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await requireAdmin();
  if ("error" in result) {
    if (result.error.status === 401) redirect("/login");
    redirect("/");
  }
  return (
    <ToastProvider>
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:border-r lg:border-amber-800/50 lg:bg-stone-900/50">
        <div className="p-4 border-b border-amber-800/50">
          <Link href="/admin" className="text-lg font-bold text-amber-400">
            Admin
          </Link>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          <AdminNav />
        </nav>
      </aside>

      {/* Mobile topbar + main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-10 relative flex items-center gap-2 border-b border-amber-800/50 bg-stone-900/95 px-4 py-3">
          <AdminNav mobile />
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
    </ToastProvider>
  );
}
