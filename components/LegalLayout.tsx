import Link from "next/link";

type LegalLayoutProps = {
  title: string;
  children: React.ReactNode;
};

export function LegalLayout({ title, children }: LegalLayoutProps) {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="mx-auto max-w-[800px] px-4 py-8">
      <Link
        href="/"
        className="mb-8 inline-block text-amber-400 hover:text-amber-300 transition-colors text-sm"
      >
        ← Back to home
      </Link>
      <h1 className="text-4xl font-bold text-amber-400 tracking-wide mb-10">
        {title}
      </h1>
      <div className="space-y-8 text-amber-100/90 leading-relaxed">
        {children}
      </div>
      <footer className="mt-12 pt-6 border-t border-amber-900/50 text-sm text-amber-200/60">
        Last updated: {lastUpdated}
      </footer>
    </article>
  );
}
