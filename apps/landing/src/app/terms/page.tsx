import type { Metadata } from "next";
import { LegalLayout, Section } from "../_components/legal-layout";

export const metadata: Metadata = {
  title: "Terms",
  description: "Helia's terms of service.",
};

export default function TermsPage() {
  return (
    <LegalLayout title="terms of service" updated="2026-05-25">
      <Section heading="who these apply to">
        <p>
          These terms govern your use of Helia ("the service"), operated by
          Lucas Neves Pereira (trading as <strong>Snowztech</strong>, SIREN
          907 666 887), a French sole proprietorship. They cover both the
          hosted version at gethelia.dev and the open-source AGPL-3.0
          distribution. By creating an account or using the service, you
          accept these terms.
        </p>
      </Section>

      <Section heading="your account">
        <p>
          You must be at least 16 years old to create an account, and you
          are responsible for keeping your credentials safe. One person per
          account. You are responsible for activity in your workspace,
          including any end-user traffic to the widget you embed on your
          site.
        </p>
      </Section>

      <Section heading="acceptable use">
        <p>You agree not to use Helia to:</p>
        <ul className="space-y-1 pt-1 pl-5 list-disc">
          <li>Break the law, harass people, or distribute malware.</li>
          <li>
            Train derivative models on data you do not own or are not
            licensed to use.
          </li>
          <li>
            Scrape, mirror, or reverse-engineer the hosted service outside
            the rights granted by the AGPL-3.0 license.
          </li>
          <li>
            Send the agent personal data of third parties without a lawful
            basis to process it.
          </li>
          <li>
            Bypass the quota system, rate limits, or any security
            mechanism.
          </li>
        </ul>
        <p>We can suspend or terminate accounts that violate these rules.</p>
      </Section>

      <Section heading="your content and data">
        <p>
          You own the sources, configurations, and conversations in your
          workspace. You grant us a limited, non-exclusive license to host,
          process, and transmit them only for the purpose of running the
          service for you. We do not claim ownership and we do not use your
          data for any other purpose (see{" "}
          <a className="text-fg underline" href="/privacy">
            privacy policy
          </a>
          ).
        </p>
        <p>
          You are responsible for the legality of the content you ingest.
          Helia is a processor on your behalf.
        </p>
      </Section>

      <Section heading="end-user identity">
        <p>
          If you pass a signed user identity to the widget on behalf of
          your end-users, you confirm you have a lawful basis to share that
          identity with us. You remain the controller for your end-users'
          personal data. We act as a processor for that data and use it
          only to deliver the assistant's replies and to populate your
          admin's conversation views.
        </p>
      </Section>

      <Section heading="payments">
        <p>
          Paid plans (when available) are billed monthly in advance in USD.
          Prices on the pricing page exclude applicable VAT, which is added
          at checkout based on your billing country.
        </p>
        <p>
          You can cancel anytime from your settings. Cancellation takes
          effect at the end of the current billing period. Time already
          consumed is not refunded except where French consumer law
          requires it, or at our discretion within 14 days of a charge.
        </p>
      </Section>

      <Section heading="service availability">
        <p>
          We aim for high availability but provide the service "as is"
          without uptime guarantees on free or Pro plans. Scale tier
          customers may negotiate a written SLA.
        </p>
      </Section>

      <Section heading="open-source license">
        <p>
          The Helia source code is licensed under the GNU Affero General
          Public License v3.0 (AGPL-3.0), available at{" "}
          <a
            className="text-fg underline"
            href="https://github.com/snowztech/helia"
          >
            github.com/snowztech/helia
          </a>
          . You are free to self-host under those terms. The hosted service
          at gethelia.dev is also subject to these terms.
        </p>
      </Section>

      <Section heading="warranty disclaimer">
        <p>
          To the extent permitted by law, the service is provided "as is"
          and "as available," without warranties of any kind, express or
          implied. We do not warrant that the assistant's answers are
          accurate, complete, or fit for any particular purpose. You are
          responsible for verifying outputs before relying on them.
        </p>
      </Section>

      <Section heading="limitation of liability">
        <p>
          To the maximum extent permitted by law, Snowztech's total
          liability for any claim arising out of or related to the service
          is capped at the amount you paid us in the 12 months preceding
          the claim, or 100 EUR if no payment was made. Neither party is
          liable for indirect, incidental, or consequential damages. Nothing
          in these terms limits liability that cannot be limited by French
          law.
        </p>
      </Section>

      <Section heading="indemnification">
        <p>
          You agree to indemnify and hold Snowztech harmless from any claim
          arising out of (a) your content, (b) your violation of these
          terms, or (c) your violation of any third-party right, including
          the rights of your end-users.
        </p>
      </Section>

      <Section heading="termination">
        <p>
          You can delete your account at any time from settings. We can
          terminate accounts that violate these terms, with reasonable
          notice unless the violation is severe (illegal use, fraud,
          security threat). On termination, your data is deleted as
          described in the privacy policy.
        </p>
      </Section>

      <Section heading="changes">
        <p>
          We will email account holders before making material changes. The
          "last updated" date at the top reflects the most recent revision.
          Continued use after a change means you accept it.
        </p>
      </Section>

      <Section heading="governing law">
        <p>
          These terms are governed by French law. Any dispute that cannot
          be resolved amicably falls under the jurisdiction of the courts
          competent for the registered office of Snowztech. Consumers
          retain the protections of the mandatory rules of their country of
          residence.
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
