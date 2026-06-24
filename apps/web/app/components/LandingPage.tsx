"use client";

import { useState } from "react";
import { landingConfig } from "../landing-config";
import { BetaTestButton } from "./BetaTestButton";
import {
  FeatureIconChant,
  FeatureIconGlobe,
  FeatureIconHeart,
  FeatureIconJoin,
} from "./FeatureIcons";
import { RoomCTAs } from "./RoomCTAs";
import { useGlobalAumRoom } from "./useGlobalAumRoom";
import { useRoomStats } from "./useRoomStats";

const COUNTRIES_COUNT = 71;

const features = [
  {
    title: "Join Anytime",
    description: "The circle is open 24/7. Come as you are.",
    Icon: FeatureIconJoin,
  },
  {
    title: "Chant or Listen",
    description: "Use your mic to chant or simply listen.",
    Icon: FeatureIconChant,
  },
  {
    title: "Global Community",
    description: "One sound. Many voices. All countries. One circle.",
    Icon: FeatureIconGlobe,
  },
  {
    title: "Transform Together",
    description: "Shared intention. Shared vibration.",
    Icon: FeatureIconHeart,
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Join",
    description:
      "Enter the live circle anytime, from anywhere in the world.",
  },
  {
    step: "02",
    title: "Chant or Listen",
    description:
      "Chant with your mic on, or listen and be present in silence.",
  },
  {
    step: "03",
    title: "Connect",
    description:
      "Be part of a global community united by one sacred sound.",
  },
  {
    step: "04",
    title: "Transform",
    description:
      "Experience peace, presence, and connection that stays with you.",
  },
];

function GraphicImage({
  pngSrc,
  svgSrc,
  alt,
  className,
}: {
  pngSrc: string;
  svgSrc: string;
  alt: string;
  className?: string;
}) {
  const [src, setSrc] = useState(pngSrc);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        if (src !== svgSrc) setSrc(svgSrc);
      }}
    />
  );
}

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

export function LandingPage() {
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

  const roomStats = useRoomStats();

  const listeners = isJoined ? participants : roomStats.listeners;
  const chanters = isJoined
    ? activeSpeakerCount + (micEnabled ? 1 : 0)
    : roomStats.chanters;

  const ctaProps = {
    status,
    isJoined,
    micAvailable,
    onJoinWithMic: () => join({ withMic: true }),
    onListenOnly: () => join({ withMic: false }),
    onLeave: leave,
  };

  return (
    <div className="flex flex-1 flex-col">
      <main>
        {/* Hero */}
        <section
          id="join"
          className={`mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:py-24 ${
            landingConfig.showHeroGraphic
              ? "lg:grid-cols-2 lg:items-center"
              : ""
          }`}
        >
          <div>
            <h1 className="font-display text-5xl leading-[1.05] font-medium tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              One Sound. One Breath.{" "}
              <span className="text-gold">One Global Circle.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
              A live, global chanting circle. Join anytime. Chant, listen, or
              simply be present. You are always welcome.
            </p>
            <p className="mt-3 text-sm text-muted">
              Use headphones when chanting to prevent audio feedback.
            </p>
            <RoomCTAs {...ctaProps} className="mt-8" align="start" />
            <p className="mt-4 text-xs tracking-[0.16em] text-muted uppercase">
              Free · No account required
            </p>

            {isJoined || status === "error" ? (
              <div className="mt-8 w-full max-w-lg rounded-xl border border-border bg-white p-4 text-left text-sm">
                <div className="flex items-center justify-between">
                  <div className="text-muted">Status</div>
                  <div className="font-medium text-foreground">{status}</div>
                </div>
                {isJoined ? (
                  <>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-muted">Participants</div>
                      <div className="font-medium text-foreground">
                        {participants}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-muted">Mic</div>
                      <div className="font-medium text-foreground">
                        {micEnabled ? "on" : "off"}
                      </div>
                    </div>
                    {micEnabled ? (
                      <div className="mt-2 flex items-center justify-between gap-4">
                        <div className="text-muted">Mic level</div>
                        <div className="flex-1">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                            <div
                              className="h-full bg-foreground"
                              style={{
                                width: `${Math.min(100, Math.round(micLevel * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-muted">Active chanters</div>
                      <div className="font-medium text-foreground">
                        {activeSpeakerCount + (micEnabled ? 1 : 0)}
                      </div>
                    </div>
                  </>
                ) : null}
                {error ? (
                  <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-red-700">
                    {error}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {landingConfig.showHeroGraphic ? (
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <GraphicImage
              pngSrc="/hero-graphic.png"
              svgSrc="/hero-graphic.svg"
              alt="Global chanting circle"
              className="mx-auto w-full max-w-md"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-xs tracking-[0.2em] text-gold uppercase">
                Live now
              </p>
              <p className="font-display mt-2 text-5xl font-medium text-foreground">
                {formatCount(listeners)}
              </p>
              <p className="mt-1 text-sm text-muted">people in the circle</p>
            </div>
          </div>
          ) : null}
        </section>

        {/* Stats bar */}
        <section className="border-y border-border bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-8 sm:grid-cols-4">
            {[
              { label: "Listening now", value: formatCount(listeners) },
              {
                label: "Chanting now",
                value: formatCount(chanters),
                highlight: true,
              },
              { label: "Countries", value: String(COUNTRIES_COUNT) },
              { label: "Always open", value: "24/7" },
            ].map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <p
                  className={`font-display text-3xl font-medium ${
                    stat.highlight ? "text-gold" : "text-foreground"
                  }`}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-xs tracking-[0.16em] text-muted uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {landingConfig.showWaveform ? (
        <section className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] text-gold uppercase">
                Live sound
              </p>
              <p className="mt-1 text-sm text-muted">Recorded in real time</p>
            </div>
            <button
              type="button"
              className="h-11 cursor-pointer self-start rounded-full border border-border px-6 text-xs font-semibold tracking-[0.12em] text-foreground uppercase disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
              onClick={() => join({ withMic: false })}
              disabled={status === "joining" || isJoined}
            >
              Listen only
            </button>
          </div>
          <GraphicImage
            pngSrc="/waveform.png"
            svgSrc="/waveform.svg"
            alt="Live audio waveform"
            className="mt-6 w-full"
          />
        </section>
        ) : null}

        {/* Features */}
        <section className="border-t border-border bg-white py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ title, description, Icon }) => (
              <div key={title} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center">
                  <Icon />
                </div>
                <h2 className="mt-4 font-display text-xl font-medium text-foreground">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center font-display text-4xl font-medium text-foreground">
            Simple. Open. Always On.
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((step) => (
              <div key={step.step}>
                <p className="text-xs tracking-[0.2em] text-gold uppercase">
                  {step.step}
                </p>
                <h3 className="mt-3 font-display text-xl font-medium text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* App stores */}
        <section className="border-y border-border bg-white py-16">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 text-center lg:flex-row lg:justify-between lg:text-left">
            <div className="max-w-md">
              <h2 className="font-display text-3xl font-medium text-foreground">
                Take the circle with you
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Thousands around the world. One sound. One intention. Come as
                you are. Stay as long as you like.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-end">
              <span className="inline-flex h-11 items-center rounded-full border border-border px-6 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                App Store — Coming soon
              </span>
              <span className="inline-flex h-11 items-center rounded-full border border-border px-6 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                Google Play — Coming soon
              </span>
              <a
                href="#join"
                className="inline-flex h-11 items-center rounded-full border border-foreground px-6 text-xs font-semibold tracking-[0.12em] text-foreground uppercase"
              >
                Open in web app
              </a>
            </div>
          </div>
        </section>

        {/* Android beta */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="rounded-2xl border border-border bg-white p-8 text-center sm:p-12">
            <p className="text-xs tracking-[0.2em] text-gold uppercase">
              Android beta
            </p>
            <h2 className="mt-3 font-display text-3xl font-medium text-foreground">
              Test the mobile app
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
              Join the Android beta to get early access to the AUM Chanting app.
              We&apos;ll email you a download link.
            </p>
            <BetaTestButton className="mx-auto mt-8" />
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-border bg-white py-16">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <p className="font-display text-3xl font-medium text-foreground">
              One sound. One breath. One global circle.
            </p>
            <RoomCTAs {...ctaProps} className="mt-8" align="center" />
          </div>
        </section>
      </main>

      <div
        ref={audioBinRef}
        className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden"
      />
    </div>
  );
}
