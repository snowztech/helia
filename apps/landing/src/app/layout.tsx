import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Helia — the open AI assistant for small teams",
  description:
    "Helia turns your docs, website, and business data into an AI assistant your customers can actually chat with. Drop one snippet on your site — you keep the conversations.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cream text-ink antialiased">{children}</body>
    </html>
  );
}
