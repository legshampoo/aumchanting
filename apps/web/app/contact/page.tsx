import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "../components/ContactForm";

export const metadata: Metadata = {
  title: "Contact — AUM Chanting",
  description: "Get in touch with the team.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl px-6 py-16">
        <Link
          href="/"
          className="text-xs tracking-[0.14em] text-muted uppercase transition-colors hover:text-foreground"
        >
          ← Back to circle
        </Link>

        <h1 className="mt-6 font-display text-4xl font-medium text-foreground">
          Contact
        </h1>
        <p className="mt-2 text-sm text-muted">
          Questions, feedback, or ideas — send us a message and we&apos;ll get
          back to you.
        </p>

        <div className="mt-8">
          <ContactForm />
        </div>
      </main>
    </div>
  );
}
