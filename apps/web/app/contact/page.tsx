import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "../components/ContactForm";

export const metadata: Metadata = {
  title: "Contact — A living global chant",
  description: "Get in touch with the team.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-2xl px-6 py-16 text-zinc-800 dark:text-zinc-200">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Back to home
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Contact
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
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
