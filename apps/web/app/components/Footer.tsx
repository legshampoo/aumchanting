import Link from "next/link";

const footerLinks = [
  { href: "/sessions", label: "Sessions" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="font-display text-sm font-semibold tracking-[0.12em]">
          AUM CHANTING
        </p>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs tracking-[0.14em] text-muted uppercase transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-muted">
        © {new Date().getFullYear()} AUM Chanting. All rights reserved.
      </p>
    </footer>
  );
}
