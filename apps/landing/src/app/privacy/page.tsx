import type { Metadata } from "next";
import { LegalLayout, Section } from "../_components/legal-layout";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Helia handles your data.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="privacy policy" updated="2026-05-25">
      <Section heading="who we are">
        <p>
          Helia is operated by Lucas Neves Pereira, trading as{" "}
          <strong>Snowztech</strong> (SIREN 907 666 887), a French sole
          proprietorship. As the operator of gethelia.dev, app.gethelia.dev,
          and api.gethelia.dev, we are the data controller for the personal
          data described below. Contact:{" "}
          <a className="text-fg underline" href="mailto:gethelia@protonmail.com">
            gethelia@protonmail.com
          </a>
          .
        </p>
      </Section>

      <Section heading="what we collect">
        <p>
          <strong>Account data.</strong> Email address, a bcrypt hash of your
          password, optional display name, and the name of the workspace you
          create. We never store your password in plain text.
        </p>
        <p>
          <strong>Workspace data.</strong> Sources you upload (PDFs, pasted
          text, crawled pages), tool configurations and the encrypted headers
          you provide, widget branding (colour, copy, suggestions), and the
          identity-signing secret for your widget (encrypted at rest with
          AES-256-GCM).
        </p>
        <p>
          <strong>Conversation data.</strong> Messages your end-users send to
          the assistant, the assistant's replies, the tool calls and search
          queries the assistant performs, and the snippets it cites. When
          your widget passes a signed user identity, the verified user id
          and name are stored alongside the conversation.
        </p>
        <p>
          <strong>Usage data.</strong> Token counts per message, request
          timestamps, and request paths. Used for billing, quotas, and
          diagnostics.
        </p>
        <p>
          <strong>Technical data.</strong> IP address (for rate limiting and
          abuse prevention), user-agent string, and the session cookie that
          keeps you logged in (httpOnly, secure, same-site).
        </p>
      </Section>

      <Section heading="how we use it">
        <p>
          We process this data only to run the service: authenticate you,
          generate replies, enforce monthly token quotas, send transactional
          emails (verification, password reset), surface usage and
          conversation history in your admin, and protect the service from
          abuse and fraud.
        </p>
        <p>
          We do not run analytics scripts, advertising pixels, or
          third-party trackers on any Helia surface. We do not profile users
          or use conversations for any purpose other than serving the next
          turn.
        </p>
      </Section>

      <Section heading="legal basis (gdpr article 6)">
        <p>
          <strong>Performance of a contract.</strong> Authenticating you,
          generating replies, processing payment when paid plans are active.
        </p>
        <p>
          <strong>Legitimate interest.</strong> Security, abuse prevention,
          rate limiting, and aggregated reliability metrics.
        </p>
        <p>
          <strong>Legal obligation.</strong> Retaining billing records for
          the periods required by French and EU tax law (when paid plans are
          active).
        </p>
      </Section>

      <Section heading="what we do not do">
        <p>
          We do not train models on your data. We do not sell your data. We
          do not share data across workspaces. Your end-users' conversations
          are visible only to you (and only to the workspace members you
          invite, once that feature ships).
        </p>
      </Section>

      <Section heading="subprocessors and international transfers">
        <p>
          We use the following subprocessors. Each receives only the data
          required to perform its function. Several are located in the
          United States; transfers rely on the Standard Contractual Clauses
          (SCCs) adopted by the European Commission.
        </p>
        <ul className="space-y-1 pt-1 pl-5 list-disc">
          <li>
            <strong>OpenAI Ireland Ltd</strong> (Ireland), LLM inference and
            embeddings.
          </li>
          <li>
            <strong>Neon Inc.</strong> (USA), Postgres database hosting.
          </li>
          <li>
            <strong>Railway Corp.</strong> (USA), application and API
            hosting.
          </li>
          <li>
            <strong>Vercel Inc.</strong> (USA), marketing site hosting.
          </li>
          <li>
            <strong>Resend Inc.</strong> (USA), transactional email
            delivery.
          </li>
        </ul>
      </Section>

      <Section heading="retention">
        <p>
          <strong>Active accounts.</strong> Account, workspace, and
          conversation data are kept for as long as your account is active.
        </p>
        <p>
          <strong>Deleted accounts.</strong> When you delete your account
          from settings, all associated data (workspace, sources, tools,
          conversations) is purged from our primary database within 30 days.
          Backups roll over within 90 days.
        </p>
        <p>
          <strong>Email verification and reset tokens.</strong> Expire after
          24 hours and 1 hour respectively, and are deleted from the
          database after use.
        </p>
        <p>
          <strong>Diagnostic logs.</strong> Application logs containing IP
          addresses and request paths are kept for 90 days.
        </p>
      </Section>

      <Section heading="your rights">
        <p>
          Under GDPR you can request access to your data, correct it,
          delete it, restrict its processing, port it to another service,
          and object to its processing. Most of these are available
          directly from your settings page (edit profile, export
          conversations, delete account). For anything else, email us.
        </p>
        <p>
          You also have the right to lodge a complaint with the French data
          protection authority, the{" "}
          <a className="text-fg underline" href="https://www.cnil.fr/">
            CNIL
          </a>
          .
        </p>
      </Section>

      <Section heading="security">
        <p>
          Passwords are hashed with bcrypt. Identity-signing secrets and
          tool headers are encrypted at rest with AES-256-GCM. All traffic
          uses HTTPS. Session cookies are httpOnly, secure, and same-site.
          Database access is limited to the operator.
        </p>
      </Section>

      <Section heading="cookies and local storage">
        <p>
          We use one cookie (<code>helia_session</code>) to keep you logged
          in. It is strictly necessary and exempt from consent requirements
          under EU ePrivacy rules. We store your theme preference (light or
          dark) in your browser's localStorage, and the embedded widget
          stores a conversation id in sessionStorage to group messages
          during a visit. None of these are used for tracking or
          advertising.
        </p>
      </Section>

      <Section heading="children">
        <p>
          Helia is not directed at children under 16. If we learn we have
          collected data from a child under 16 without parental consent, we
          will delete it.
        </p>
      </Section>

      <Section heading="changes">
        <p>
          We will email account holders before making material changes to
          this policy. The "last updated" date at the top reflects the most
          recent revision.
        </p>
      </Section>

      <Section heading="contact">
        <p>
          Questions, or to exercise your rights:{" "}
          <a className="text-fg underline" href="mailto:gethelia@protonmail.com">
            gethelia@protonmail.com
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
