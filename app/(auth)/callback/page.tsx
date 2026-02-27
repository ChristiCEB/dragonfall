import { redirect } from "next/navigation";
import Link from "next/link";

export default function CallbackPage() {
  return (
    <div className="card space-y-4 text-center">
      <p className="text-amber-200/80">Completing sign in…</p>
      <p className="text-sm text-amber-200/60">
        If you are not redirected, <Link href="/" className="link-gold">go home</Link>.
      </p>
    </div>
  );
}
