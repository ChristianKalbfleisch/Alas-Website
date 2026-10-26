"use client";

import clsx from "clsx";
import { type FormEvent, useId, useState } from "react";

type Status = "idle" | "sending" | "done" | "error";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** One underlined line. Posts { email, source: "footer" } to /api/subscribe. */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const inputId = useId();
  const messageId = useId();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, source: "footer" }),
      });
      if (!res.ok) throw new Error(`subscribe ${res.status}`);
      setStatus("done");
      setMessage("Thank you. You are on the list.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage(
        "We could not add you just now. Please try again in a moment, or write to admin@alassaltco.com.",
      );
    }
  };

  return (
    <form noValidate onSubmit={onSubmit} className="mt-8 max-w-xl">
      <label htmlFor={inputId} className="sr-only">
        Email address
      </label>
      <div
        className={clsx(
          "flex items-center gap-3 border-b-2 transition-colors duration-500",
          status === "error"
            ? "border-[var(--c-sale)]"
            : "border-[var(--c-line-strong)] focus-within:border-ink",
        )}
      >
        <input
          id={inputId}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="Your email address"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status === "error") {
              setStatus("idle");
              setMessage("");
            }
          }}
          aria-invalid={status === "error"}
          aria-describedby={messageId}
          className="font-display h-14 min-w-0 flex-1 bg-transparent text-[1.35rem] text-ink outline-none placeholder:text-ink-3 focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="group font-mono text-[0.6875rem] font-medium uppercase tracking-[0.1em] inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-ink px-5 text-white transition-[background-color,transform] duration-500 hover:bg-[#0c2238] active:scale-[0.97] disabled:opacity-50"
        >
          {status === "sending" ? "Joining" : "Join"}
          <span
            aria-hidden
            className="transition-transform duration-500 ease-[var(--ease-out)] group-hover:translate-x-0.5"
          >
            →
          </span>
        </button>
      </div>
      <p
        id={messageId}
        aria-live="polite"
        className={clsx(
          "mt-3 min-h-[1.5em] text-[0.9rem]",
          status === "error" ? "text-[#b3122f]" : "text-ink-2",
        )}
      >
        {message}
      </p>
    </form>
  );
}
