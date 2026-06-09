import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Aumchanting",
  description: "Terms of service for the Aumchanting app and website.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-2xl px-6 py-16 text-zinc-800 dark:text-zinc-200">
        <Link
          href="/"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Back to Aumchanting
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: June 6, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Agreement
            </h2>
            <p className="mt-2">
              By using Aumchanting at aumchanting.com or our mobile apps, you
              agree to these Terms of Service and our{" "}
              <Link
                href="/privacy"
                className="underline hover:text-zinc-950 dark:hover:text-zinc-50"
              >
                Privacy Policy
              </Link>
              . If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              The service
            </h2>
            <p className="mt-2">
              Aumchanting provides a global live audio room where users may
              listen or join with a microphone to chant together. The service is
              offered as-is and may change, pause, or end at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Eligibility
            </h2>
            <p className="mt-2">
              You must be at least 18 years old to use Aumchanting. The service
              is not directed at children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Acceptable use
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                Use the room respectfully. Do not harass, threaten, or abuse
                other participants.
              </li>
              <li>
                Do not transmit unlawful, hateful, sexually explicit, or
                otherwise harmful content through your microphone.
              </li>
              <li>
                Do not attempt to disrupt the service, impersonate others, or
                interfere with other users&apos; experience.
              </li>
              <li>
                You are responsible for audio you transmit when you enable the
                microphone.
              </li>
            </ul>
            <p className="mt-2">
              We may restrict or terminate access if we believe these terms are
              violated or if needed to protect the service or other users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              No accounts
            </h2>
            <p className="mt-2">
              The service does not require registration. Guest session identifiers
              are assigned automatically so you can join the live room.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Disclaimers
            </h2>
            <p className="mt-2">
              Aumchanting is provided &quot;as is&quot; without warranties of any
              kind. We do not guarantee uninterrupted access, audio quality, or
              that the service will meet your expectations. Participation in a
              live group audio room is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Limitation of liability
            </h2>
            <p className="mt-2">
              To the fullest extent permitted by law, Aumchanting and its
              operators will not be liable for indirect, incidental, special, or
              consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Third-party services
            </h2>
            <p className="mt-2">
              Real-time audio is delivered through third-party infrastructure
              (including LiveKit). Your use of the service is also subject to
              those providers&apos; terms and policies where applicable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Changes
            </h2>
            <p className="mt-2">
              We may update these terms from time to time. The &quot;Last
              updated&quot; date at the top reflects the current version.
              Continued use after changes means you accept the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Contact
            </h2>
            <p className="mt-2">
              Questions about these terms:{" "}
              <a
                href="mailto:degen.moonboi@gmail.com"
                className="underline hover:text-zinc-950 dark:hover:text-zinc-50"
              >
                degen.moonboi@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
