"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Menu01Icon,
  Cancel01Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "overview", exact: true },
  { href: "/sources", match: ["/sources", "/upload"], label: "sources" },
  { href: "/tools", match: ["/tools"], label: "tools" },
  { href: "/conversations", match: ["/conversations"], label: "conversations" },
  { href: "/widget", match: ["/widget"], label: "widget" },
] as const;

/**
 * Mobile-only hamburger. Toggles a slide-down panel with the same nav
 * items as the desktop header. Closes itself on route change so the
 * panel doesn't stay open after navigation.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <HugeiconsIcon
          icon={open ? Cancel01Icon : Menu01Icon}
          size={18}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 top-[57px] z-30 bg-background/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <nav className="fixed inset-x-0 top-[57px] z-40 border-b border-border bg-background px-6 py-4">
            <ul className="space-y-1">
              {ITEMS.map((item) => {
                const active = "exact" in item
                  ? pathname === item.href
                  : item.match.some((m) => pathname.startsWith(m));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li className="pt-1">
                <Link
                  href="/settings"
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    pathname.startsWith("/settings")
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <HugeiconsIcon icon={Settings02Icon} size={14} />
                  settings
                </Link>
              </li>
            </ul>
          </nav>
        </>
      )}
    </div>
  );
}
