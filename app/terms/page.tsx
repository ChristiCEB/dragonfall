import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Terms of Service — Dragonfall",
  description:
    "Terms of service for Dragonfall. By using the site you agree to these terms, Roblox policies, and our rules.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-amber-300 mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service">
      <Section title="1. Acceptance of Terms">
        <p>
          By using Dragonfall, you agree to these Terms of Service. If you do
          not agree, please do not use the site or linked services.
        </p>
      </Section>

      <Section title="2. Roblox Compliance">
        <p>
          You must comply with Roblox&apos;s Terms of Use and Community
          Standards at all times. Use of Dragonfall in connection with your
          Roblox account does not exempt you from those policies.
        </p>
      </Section>

      <Section title="3. Account Linking">
        <p>
          You sign in to Dragonfall using Roblox OAuth. We do not access, store,
          or handle your Roblox password. Account linking is subject to
          Roblox&apos;s authorization and our acceptance of your use of the
          site.
        </p>
      </Section>

      <Section title="4. Rules">
        <p>When using Dragonfall and the linked game experience, you must not:</p>
        <ul className="list-disc list-inside space-y-1 ml-2 text-amber-200/80">
          <li>Exploit, cheat, or use unauthorized automation or bots</li>
          <li>Abuse the economy (e.g., Drogons, bounties) in ways that harm other players or the game</li>
          <li>Impersonate staff or other users</li>
        </ul>
        <p>
          Violation of these rules may result in suspension of website access or
          in-game privileges.
        </p>
      </Section>

      <Section title="5. Economy Disclaimer">
        <p>
          &quot;Drogons&quot; and any other in-game currency or items are
          fictional and have no real-world value. They cannot be exchanged for
          cash or other consideration outside the game.
        </p>
      </Section>

      <Section title="6. Enforcement">
        <p>
          Admins may suspend or revoke your website access or in-game
          privileges for violations of these terms or our rules. Decisions are
          made at our discretion.
        </p>
      </Section>

      <Section title="7. Limitation of Liability">
        <p>
          We are not responsible for data loss, game resets, or any indirect
          or consequential damages arising from your use of Dragonfall or the
          linked game. Use is at your own risk.
        </p>
      </Section>
    </LegalLayout>
  );
}
