import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — AUM Chanting",
  description: "Privacy policy for the Aumchanting app and website.",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto w-full max-w-2xl px-6 py-16 text-foreground">
        <Link
          href="/"
          className="text-xs tracking-[0.14em] text-muted uppercase transition-colors hover:text-foreground"
        >
          ← Back to circle
        </Link>

        <h1 className="mt-6 font-display text-4xl font-medium text-foreground">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted">Last updated: June 6, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Overview
            </h2>
            <p className="mt-2">
              Aumchanting (&quot;we&quot;, &quot;us&quot;) provides a global live
              audio room where people can listen or join with a microphone to
              chant together. This policy describes how we handle information
              when you use our website at aumchanting.com and our iOS and Android
              apps. See also our{" "}
              <Link
                href="/terms"
                className="underline hover:text-zinc-950 dark:hover:text-zinc-50"
              >
                Terms of Service
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Information we collect
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong>Guest session ID.</strong> When you join the room, our
                server assigns a random guest identifier so the live audio
                service can connect you to the session. We do not require an
                account, email, or name.
              </li>
              <li>
                <strong>Microphone audio.</strong> If you choose &quot;Join +
                Mic&quot;, audio from your microphone is sent in real time to
                other participants in the room. We do not require the
                microphone for listen-only mode.
              </li>
              <li>
                <strong>Technical data.</strong> Our servers may receive standard
                connection information (such as IP address and request logs)
                needed to operate the service, protect against abuse, and keep
                the site running.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              How we use information
            </h2>
            <p className="mt-2">
              We use the information above only to operate the live audio room
              (connect you to the session, transmit audio when you enable the
              mic, and maintain the service). We do not use your audio or
              session data for advertising, marketing, or selling to third
              parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Third-party services
            </h2>
            <p className="mt-2">
              Real-time audio is delivered through{" "}
              <a
                href="https://livekit.io"
                className="underline hover:text-zinc-950 dark:hover:text-zinc-50"
                rel="noopener noreferrer"
                target="_blank"
              >
                LiveKit
              </a>
              , which processes session identifiers and audio streams on our
              behalf to provide the room. LiveKit&apos;s handling of data is
              governed by their policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Data retention
            </h2>
            <p className="mt-2">
              Live audio is transmitted in real time for the session. We do not
              intentionally store your voice recordings as part of the core
              service. Server logs may be retained for a limited period for
              security and operations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Your choices
            </h2>
            <p className="mt-2">
              You can use listen-only mode without granting microphone access.
              You can revoke microphone access at any time in your device
              settings (Settings → Aumchanting → Microphone on iOS).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Children
            </h2>
            <p className="mt-2">
              The service is not directed at children under 13, and we do not
              knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Changes
            </h2>
            <p className="mt-2">
              We may update this policy from time to time. The &quot;Last
              updated&quot; date at the top will reflect the latest version.
            </p>
          </section>

          <section id="delete-data">
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Request data deletion (Aumchanting)
            </h2>
            <p className="mt-2">
              You can ask us to delete data associated with your use of
              Aumchanting. To request deletion:
            </p>
            <ol className="mt-2 list-decimal space-y-2 pl-5">
              <li>
                Email{" "}
                <a
                  href="mailto:degen.moonboi@gmail.com?subject=Aumchanting%20data%20deletion%20request"
                  className="underline hover:text-zinc-950 dark:hover:text-zinc-50"
                >
                  degen.moonboi@gmail.com
                </a>{" "}
                with the subject line &quot;Aumchanting data deletion
                request&quot;.
              </li>
              <li>
                Include the approximate date and time you used the app (and your
                guest session ID if you have it) so we can locate related
                records.
              </li>
              <li>We will confirm when your request has been processed.</li>
            </ol>
            <p className="mt-2">
              <strong>What we delete:</strong> server logs and session
              identifiers we can reasonably associate with your request.
            </p>
            <p className="mt-2">
              <strong>What we do not store:</strong> live microphone audio is
              transmitted in real time and is not intentionally saved as
              recordings.
            </p>
            <p className="mt-2">
              <strong>Retention:</strong> operational and security logs may be
              kept for a limited period (typically up to 90 days) before
              automatic deletion. Deletion requests are handled within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
              Contact
            </h2>
            <p className="mt-2">
              Questions about this policy:{" "}
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
