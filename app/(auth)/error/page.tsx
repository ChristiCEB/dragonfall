import Link from "next/link";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function AuthErrorPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <div className="card space-y-4 text-center">
      <h1 className="text-xl font-bold text-amber-400">Sign in failed</h1>
      <p className="text-amber-200/80">
        {error === "auth_failed" && "Invalid or expired sign-in attempt."}
        {error === "token_exchange_failed" && "Could not complete sign-in with Roblox."}
        {error === "userinfo_failed" && "Could not load your Roblox profile."}
        {!error && "Something went wrong. Please try again."}
      </p>
      <Link href="/login" className="btn-primary inline-block">
        Try again
      </Link>
      <p className="text-sm text-amber-200/60">
        <Link href="/" className="link-gold">Back to home</Link>
      </p>
    </div>
  );
}
