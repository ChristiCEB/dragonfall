import type { Metadata } from "next";
import { Cinzel } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });

export const metadata: Metadata = {
  title: "Dragonfall — Realm Economy",
  description: "Dragonfall Realm Economy. Drogons, Houses, and Bounties.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cinzel.variable}>
      <body className="flex min-h-screen flex-col font-serif">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6">
          <Nav />
          <main className="mt-8 flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
