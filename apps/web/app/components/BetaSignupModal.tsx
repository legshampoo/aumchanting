"use client";

import { useEffect, useState } from "react";

type BetaSignupModalProps = {
  open: boolean;
  onClose: () => void;
};

type FormStatus = "idle" | "submitting" | "success" | "error";

const inputClassName =
  "mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-gold";

const secondaryButtonClassName =
  "h-11 cursor-pointer rounded-full border border-border px-6 text-xs font-semibold tracking-[0.12em] text-foreground uppercase";

export function BetaSignupModal({ open, onClose }: BetaSignupModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setStatus("idle");
      setErrorMessage(null);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const resp = await fetch("/api/beta-signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = (await resp.json()) as { error?: string };

      if (!resp.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="beta-signup-title"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="beta-signup-title"
            className="font-display text-xl font-medium text-foreground"
          >
            Join the Android Beta Test
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-sm text-muted hover:text-foreground"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        {status === "success" ? (
          <div className="mt-4 text-center">
            <p className="font-medium text-foreground">Thank you!</p>
            <p className="mt-2 text-sm text-muted">
              Keep an eye out for an email with the app download link.
            </p>
            <button
              type="button"
              onClick={onClose}
              className={`${secondaryButtonClassName} mt-6`}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <p className="text-sm text-muted">
              Sign up to test the AUM Chanting Android app.
            </p>

            <div>
              <label
                htmlFor="beta-name"
                className="block text-sm font-medium text-foreground"
              >
                Name
              </label>
              <input
                id="beta-name"
                type="text"
                name="name"
                required
                maxLength={100}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor="beta-email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="beta-email"
                type="email"
                name="email"
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClassName}
              />
            </div>

            {errorMessage ? (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="h-11 w-full cursor-pointer rounded-full bg-foreground text-xs font-semibold tracking-[0.12em] text-background uppercase disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "submitting" ? "Submitting…" : "Submit"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
