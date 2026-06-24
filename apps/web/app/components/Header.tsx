"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Circle" },
  { href: "/sessions", label: "Sessions" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-[0.12em] text-foreground"
        >
          AUM CHANTING
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-medium tracking-[0.18em] uppercase transition-colors ${
                  active
                    ? "text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/#join"
            className="hidden h-10 items-center rounded-full bg-foreground px-5 text-xs font-semibold tracking-[0.14em] text-background uppercase transition-opacity hover:opacity-90 sm:inline-flex"
          >
            Join the Circle
          </Link>

          <button
            type="button"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-foreground hover:bg-border/60 md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="border-t border-border px-6 py-4 md:hidden">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block py-2 text-sm text-foreground"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/#join"
                className="mt-2 inline-flex h-10 items-center rounded-full bg-foreground px-5 text-xs font-semibold tracking-[0.14em] text-background uppercase"
                onClick={() => setMenuOpen(false)}
              >
                Join the Circle
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
