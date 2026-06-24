"use client";

import { useState } from "react";

type FormStatus = "idle" | "submitting" | "success" | "error";

const inputClassName =
  "mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-gold";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const resp = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = (await resp.json()) as { error?: string };

      if (!resp.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      setName("");
      setEmail("");
      setMessage("");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-border bg-white p-6 text-center">
        <p className="font-medium text-foreground">Message sent</p>
        <p className="mt-2 text-sm text-muted">
          Thanks for reaching out. We&apos;ll get back to you soon.
        </p>
        <button
          type="button"
          className="mt-4 cursor-pointer text-sm text-muted underline hover:text-foreground"
          onClick={() => setStatus("idle")}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-medium text-foreground"
        >
          Name
        </label>
        <input
          id="contact-name"
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
          htmlFor="contact-email"
          className="block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="contact-email"
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

      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-medium text-foreground"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputClassName} resize-y`}
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
        className="h-11 w-full cursor-pointer rounded-full bg-foreground text-xs font-semibold tracking-[0.12em] text-background uppercase disabled:cursor-not-allowed disabled:opacity-50 sm:w-40"
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
