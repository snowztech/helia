import type { Metadata } from "next";
import { LegalLayout, Section } from "../_components/legal-layout";

export const metadata: Metadata = {
  title: "Legal notices — Helia",
  description: "Legal notices for Helia (Snowztech, EI).",
};

/**
 * Required information under French LCEN law (loi pour la confiance dans
 * l'économie numérique). Anyone running a commercial site from France must
 * publish this. Written in English to match the rest of the product, which
 * is what the law actually cares about (availability, not language).
 */
export default function LegalPage() {
  return (
    <LegalLayout title="legal notices" updated="2026-05-25">
      <Section heading="publisher">
        <p>
          Helia is published by Lucas Neves Pereira, a French sole proprietor
          (Entreprise Individuelle) operating under the trade name{" "}
          <strong>Snowztech</strong>.
        </p>
        <ul className="space-y-1 pt-1">
          <li>SIREN: 907 666 887</li>
          <li>Legal form: Entreprise Individuelle (EI)</li>
          <li>
            Contact:{" "}
            <a className="text-fg underline" href="mailto:gethelia@protonmail.com">
              gethelia@protonmail.com
            </a>
          </li>
        </ul>
        <p className="pt-2 text-xs">
          Postal address available on request, in accordance with article 1,
          II of French law no. 2004-575 of 21 June 2004 (LCEN).
        </p>
      </Section>

      <Section heading="publication director">
        <p>Lucas Neves Pereira.</p>
      </Section>

      <Section heading="hosting">
        <p>
          Marketing site (gethelia.dev): <strong>Vercel Inc.</strong>, 440 N
          Barranca Ave #4133, Covina, CA 91723, USA.
        </p>
        <p>
          Application and API (app.gethelia.dev, api.gethelia.dev):{" "}
          <strong>Railway Corp.</strong>, 80 Madison Avenue, Floor 3, Suite
          304, New York, NY 10016, USA.
        </p>
        <p>
          Database: <strong>Neon Inc.</strong>, 209 Park Road, Burlingame, CA
          94010, USA.
        </p>
      </Section>

      <Section heading="intellectual property">
        <p>
          The Helia source code is distributed under the AGPL-3.0 license,
          available at{" "}
          <a
            className="text-fg underline"
            href="https://github.com/snowztech/helia"
          >
            github.com/snowztech/helia
          </a>
          . The <strong>Helia</strong> brand and the <strong>Snowztech</strong>{" "}
          trade name belong to Lucas Neves Pereira.
        </p>
      </Section>

      <Section heading="personal data">
        <p>
          Processing of personal data is described in our{" "}
          <a className="text-fg underline" href="/privacy">
            privacy policy
          </a>
          . Under GDPR, you have the right to access, correct, and delete
          your data. Email us to exercise these rights.
        </p>
      </Section>

      <Section heading="governing law">
        <p>
          This site is governed by French law. Any dispute that cannot be
          resolved amicably falls under the jurisdiction of the courts
          competent for the registered office of Snowztech.
        </p>
      </Section>
    </LegalLayout>
  );
}
