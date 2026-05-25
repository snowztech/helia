import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Helia — the open AI assistant for small teams",
  description:
    "Helia turns your docs, website, and business data into an AI assistant your customers can actually chat with. Drop one snippet on your site, you keep the conversations.",
  icons: { icon: "/favicon.svg" },
};

/**
 * Default = light. Persists user choice in localStorage under `theme`,
 * mirroring the admin so a visitor who flips to dark on the marketing
 * site stays in dark after signup.
 */
const themeBootstrap = `
try {
  var t = localStorage.getItem('theme');
  if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
} catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}
