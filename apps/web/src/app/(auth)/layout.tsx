import { ThemeToggle } from "@/components/ui/theme-toggle";
import { HeliaWordmark } from "@/components/helia-wordmark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <a href="https://gethelia.dev" aria-label="Helia">
          <HeliaWordmark />
        </a>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
