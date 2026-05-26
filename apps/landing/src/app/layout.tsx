import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gethelia.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.gethelia.dev";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono-loaded",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Helia: open-source AI assistant for your website",
    template: "%s · Helia",
  },
  description:
    "Open-source AI assistant for your site. Connects to your docs and APIs. Answers questions, takes actions. Self-hostable. Free to start.",
  keywords: [
    "AI assistant",
    "AI agent",
    "AI chatbot",
    "customer support AI",
    "RAG",
    "retrieval augmented generation",
    "open source AI",
    "self-hosted AI assistant",
    "AI widget",
    "knowledge base AI",
    "OpenAI",
  ],
  authors: [{ name: "Snowztech", url: SITE_URL }],
  creator: "Snowztech",
  publisher: "Snowztech",
  category: "technology",
  icons: { icon: "/favicon.svg" },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Helia",
    title: "Helia: open-source AI assistant for your website",
    description:
      "Connects to your docs and APIs. Answers questions, takes actions. Self-hostable. Free to start.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Helia: open-source AI assistant for your website",
    description:
      "Connects to your docs and APIs. Answers questions, takes actions. Self-hostable. Free to start.",
    creator: "@snowztech",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const themeBootstrap = `
try {
  var t = localStorage.getItem('theme');
  if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
} catch (e) {}
`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Helia",
  description:
    "Open-source AI assistant for your website. Connects to your docs and APIs. Answers questions, takes actions. Self-hostable.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free tier available. Paid plans from $29/mo.",
  },
  url: SITE_URL,
  sameAs: ["https://github.com/snowztech/helia"],
  author: {
    "@type": "Organization",
    name: "Snowztech",
    url: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={mono.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="canonical" href={SITE_URL} />
      </head>
      <body className="bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}
