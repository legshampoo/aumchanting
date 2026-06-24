import type { Metadata } from "next";
import Link from "next/link";
import { SessionCards } from "../components/SessionCards";

export const metadata: Metadata = {
  title: "Sessions — AUM Chanting",
  description:
    "Guided OM chanting sessions and special events hosted around the world.",
};

export default function SessionsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-6xl px-6 py-16">
        <Link
          href="/"
          className="text-xs tracking-[0.14em] text-muted uppercase transition-colors hover:text-foreground"
        >
          ← Back to circle
        </Link>

        <h1 className="mt-6 font-display text-4xl font-medium text-foreground sm:text-5xl">
          Guided Sessions &amp; Special Events
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
          Scheduled OM chanting circles hosted by practitioners around the world.
          Join a live session led by an experienced guide in their local time
          zone.
        </p>

        <div className="mt-12">
          <SessionCards />
        </div>
      </main>
    </div>
  );
}
