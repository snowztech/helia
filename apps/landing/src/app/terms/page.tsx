import type { Metadata } from "next";
import { LegalLayout, Section } from "../_components/legal-layout";

export const metadata: Metadata = {
  title: "Terms — Helia",
  description: "Helia's terms of service.",
};

/**
 * Placeholder structure. Same workflow as /privacy: generate real terms
 * from Termly (or have a lawyer review) and paste into the sections.
 */
export default function TermsPage() {
  return (
    <LegalLayout title="terms of service" updated="2026-05-25">
      <p className="rounded-md border border-line bg-muted-bg px-3 py-2 text-xs text-muted">
        Placeholder copy. Generate the production text with Termly or
        equivalent and replace each section below.
      </p>

      <Section heading="who these apply to">
        <p>
          Anyone using Helia ("the service"), whether on the hosted version
          at gethelia.dev or via the open-source AGPL-3.0 distribution.
        </p>
      </Section>

      <Section heading="your account">
        <p>
          You're responsible for keeping your credentials safe and for the
          activity in your workspace. One person per account. Workspaces can
          have multiple members.
        </p>
      </Section>

      <Section heading="acceptable use">
        <p>
          Don't use Helia to break the law, harass people, distribute
          malware, or train derivative models on data you don't own. We can
          suspend accounts that do.
        </p>
      </Section>

      <Section heading="content and data">
        <p>
          You own your sources, conversations, and tool configurations. You
          grant us a limited license to process them for the purpose of
          running the service. We don't claim ownership and won't use them
          for any other purpose (see Privacy).
        </p>
      </Section>

      <Section heading="payments">
        <p>
          Paid plans are billed monthly in advance. Cancel anytime from your
          settings; cancellation takes effect at the end of the current
          billing period. Refunds are at our discretion within 14 days of
          the most recent charge.
        </p>
      </Section>

      <Section heading="service availability">
        <p>
          Helia is provided "as is" without uptime guarantees on free or
          starter plans. The Scale tier includes SLA terms negotiated
          separately.
        </p>
      </Section>

      <Section heading="open-source license">
        <p>
          The Helia source code is licensed under AGPL-3.0. You are free to
          self-host. The hosted service runs the same code.
        </p>
      </Section>

      <Section heading="termination">
        <p>
          You can delete your account at any time. We can terminate accounts
          that violate these terms, with reasonable notice unless the
          violation is severe.
        </p>
      </Section>

      <Section heading="changes">
        <p>
          We'll email account holders before making material changes. The
          "last updated" date above reflects the most recent revision.
        </p>
      </Section>

      <Section heading="contact">
        <p>
          Questions:{" "}
          <a className="text-fg underline" href="mailto:gethelia@protonmail.com">
            gethelia@protonmail.com
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
