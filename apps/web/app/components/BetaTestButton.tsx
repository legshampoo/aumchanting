"use client";

import { useState } from "react";
import { BetaSignupModal } from "./BetaSignupModal";

const secondaryButtonClassName =
  "inline-flex h-11 items-center justify-center rounded-full border border-border px-6 text-xs font-semibold tracking-[0.12em] text-foreground uppercase";

type BetaTestButtonProps = {
  className?: string;
};

export function BetaTestButton({ className = "" }: BetaTestButtonProps) {
  const [betaModalOpen, setBetaModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`${secondaryButtonClassName} ${className}`}
        onClick={() => setBetaModalOpen(true)}
      >
        Join the Android Beta Test
      </button>
      <BetaSignupModal
        open={betaModalOpen}
        onClose={() => setBetaModalOpen(false)}
      />
    </>
  );
}
