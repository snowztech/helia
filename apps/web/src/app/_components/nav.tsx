"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", match: ["/", "/sources", "/upload"], label: "sources" },
  { href: "/tools", match: ["/tools"], label: "tools" },
  { href: "/widget", match: ["/widget", "/brand", "/install", "/chat"], label: "widget" },
] as const;

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 text-sm">
      {ITEMS.map((item) => {
        const active = item.match.some((m) =>
          m === "/" ? pathname === "/" : pathname.startsWith(m),
        );
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-2.5 py-1 transition-colors",
              active
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
