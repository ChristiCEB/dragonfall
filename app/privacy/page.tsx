import type { Metadata } from "next";
import { LegalLayout } from "@/components/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy — Dragonfall",
  description:
    "Privacy policy for Dragonfall, a companion website for a Roblox roleplay game. Learn how we collect and use your data.",
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

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <Section title="1. Introduction">
        <p>
          Dragonfall is a companion website for a Roblox roleplay game. This
          privacy policy explains how we collect, use, and protect your
          information when you use our site.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <p>We collect the following information when you sign in with Roblox:</p>
        <ul className="list-disc list-inside space-y-1 ml-2 text-amber-200/80">
          <li>Roblox User ID</li>
          <li>Roblox Username</li>
          <li>Avatar Thumbnail</li>
          <li>Login session cookies (to keep you signed in)</li>
        </ul>
      </Section>

      <Section title="3. How We Use Data">
        <p>We use this data to:</p>
        <ul className="list-disc list-inside space-y-1 ml-2 text-amber-200/80">
          <li>Link your Roblox account to the in-game economy</li>
          <li>Display leaderboards (e.g., Drogons currency and Houses)</li>
          <li>Show your player profile on the site</li>
          <li>Support admin moderation and exploit prevention</li>
        </ul>
      </Section>

      <Section title="4. Data Sharing">
        <p>
          We do <strong>not</strong> sell your data. We do <strong>not</strong>{" "}
          share your data with advertisers. Your information is used only
          internally for game moderation and site operation.
        </p>
      </Section>

      <Section title="5. Cookies">
        <p>
          We use session cookies that are required for login. These cookies are
          necessary to keep you signed in and are not used for advertising or
          tracking.
        </p>
      </Section>

      <Section title="6. Data Removal">
        <p>
          If you would like your data removed, you may request removal via our
          community Discord or by contacting staff. We will process reasonable
          requests in accordance with our operations.
        </p>
      </Section>

      <Section title="7. Roblox Disclaimer">
        <p>
          Dragonfall is not affiliated with, endorsed by, or sponsored by
          Roblox Corporation. Roblox is a trademark of Roblox Corporation.
        </p>
      </Section>
    </LegalLayout>
  );
}
