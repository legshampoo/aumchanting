"use client";

import { RoomCTAs } from "./RoomCTAs";
import { useGlobalAumRoom } from "./useGlobalAumRoom";

const howItWorks = [
  {
    title: "Listen",
    description: "Enter the circle and listen to the live chant.",
  },
  {
    title: "Chant",
    description: "Join with your microphone and contribute your voice.",
  },
  {
    title: "Connect",
    description:
      "Practice alongside people from different countries, traditions, and backgrounds.",
  },
];

type LandingPageProps = {
  children: React.ReactNode;
};

export function LandingPage({ children }: LandingPageProps) {
  const {
    status,
    error,
    isJoined,
    micAvailable,
    participants,
    micEnabled,
    micLevel,
    activeSpeakerCount,
    audioBinRef,
    join,
    leave,
  } = useGlobalAumRoom();

  const ctaProps = {
    status,
    isJoined,
    micAvailable,
    onJoinWithMic: () => join({ withMic: true }),
    onListenOnly: () => join({ withMic: false }),
    onLeave: leave,
  };

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-16 px-6 py-12 sm:py-16">
        <section className="w-full text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-6xl">
            A living global chant
          </h1>

          <div className="mx-auto mt-4 max-w-lg space-y-2 text-xl leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              Join a continuous OM chanting circle with people around the world.
            </p>
            <p>Listen quietly, add your voice, or simply be present.</p>
            <p>The chant is always open.</p>
          </div>

          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Use headphones when chanting to prevent audio feedback.
          </p>

          <RoomCTAs {...ctaProps} className="mt-8" />

          {isJoined || status === "error" ? (
            <div className="mt-8 w-full rounded-xl border border-zinc-200 p-4 text-left text-sm dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="text-zinc-600 dark:text-zinc-400">Status</div>
                <div className="font-medium text-zinc-950 dark:text-zinc-50">
                  {status}
                </div>
              </div>
              {isJoined ? (
                <>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-zinc-600 dark:text-zinc-400">
                      Participants
                    </div>
                    <div className="font-medium text-zinc-950 dark:text-zinc-50">
                      {participants}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-zinc-600 dark:text-zinc-400">Mic</div>
                    <div className="font-medium text-zinc-950 dark:text-zinc-50">
                      {micEnabled ? "on" : "off"}
                    </div>
                  </div>
                  {micEnabled ? (
                    <div className="mt-2 flex items-center justify-between gap-4">
                      <div className="text-zinc-600 dark:text-zinc-400">
                        Mic level
                      </div>
                      <div className="flex-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                          <div
                            className="h-full bg-zinc-950 dark:bg-zinc-50"
                            style={{
                              width: `${Math.min(100, Math.round(micLevel * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-zinc-600 dark:text-zinc-400">
                      Active chanters
                    </div>
                    <div className="font-medium text-zinc-950 dark:text-zinc-50">
                      {activeSpeakerCount}
                    </div>
                  </div>
                </>
              ) : null}
              {error ? (
                <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-red-700 dark:bg-red-950/30 dark:text-red-200">
                  {error}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="w-full text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Global Circle
          </h2>
          <div className="mx-auto mt-4 max-w-lg space-y-4 leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              A shared space for meditation, presence, and the sacred sound of
              OM.
            </p>
            <p>
              There is no schedule to follow and no experience required. Enter
              at any time and stay for as long as you like.
            </p>
            <p>
              Whether you chant for a minute or an hour, your voice becomes part
              of the collective resonance.
            </p>
          </div>
        </section>

        <section className="w-full text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            How It Works
          </h2>
          <ul className="mx-auto mt-8 flex max-w-lg flex-col gap-8">
            {howItWorks.map((step) => (
              <li key={step.title}>
                <h3 className="text-lg font-medium text-zinc-950 dark:text-zinc-50">
                  {step.title}
                </h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {step.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {children}

        <section className="w-full text-center">
          <p className="text-xl font-medium leading-relaxed text-zinc-950 dark:text-zinc-50">
            One sound. One breath. One global circle.
          </p>
          <RoomCTAs {...ctaProps} />
        </section>
      </main>

      <div
        ref={audioBinRef}
        className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden"
      />
    </div>
  );
}
