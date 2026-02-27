import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ProfileContent } from "@/components/ProfileContent";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <ProfileContent session={session} />;
}
