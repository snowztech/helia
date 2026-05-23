import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Helia",
  description:
    "Your own AI assistant. Upload your docs, plug in your APIs, drop one script tag.",
};

// Inline FOUC guard: applies the persisted theme before React hydrates,
// so the page paints in the right palette on first paint.
const themeBootstrap = `
try {
  var t = localStorage.getItem('theme');
  if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
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
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
