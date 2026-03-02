import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LinkRobloxForm } from "@/components/LinkRobloxForm";

export default async function LinkRobloxPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <LinkRobloxForm />
    </div>
  );
}
