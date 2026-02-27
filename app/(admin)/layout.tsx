import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";

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
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-4 border-b border-amber-800/50 pb-4">
        <Link href="/admin" className="text-amber-400 hover:text-amber-300 font-semibold">Dashboard</Link>
        <Link href="/admin/users" className="text-amber-200/80 hover:text-amber-200">Users</Link>
        <Link href="/admin/bounties" className="text-amber-200/80 hover:text-amber-200">Bounties</Link>
        <Link href="/admin/logs" className="text-amber-200/80 hover:text-amber-200">Logs</Link>
      </nav>
      {children}
    </div>
  );
}
