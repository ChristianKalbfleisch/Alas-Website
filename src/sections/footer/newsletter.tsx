"use client";

import clsx from "clsx";
import { type FormEvent, useId, useRef, useState } from "react";
import { EmailHint, useEmailHint } from "@/components/gift/email-hint";
import { GIFT } from "@/components/gift/gift-store";
import { EMAIL, subscribe } from "@/components/gift/subscribe-form";

type Status = "idle" | "sending" | "done" | "error";

/**
 * One underlined line. Posts { email, source: "footer" } to /api/subscribe and,
 * once accepted, shows the 10% code the heading above promises.
 */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const inputId = useId();
  const messageId = useId();
  const input = useRef<HTMLInputElement>(null);
  const typo = useEmailHint();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    if (typo.hold(value)) return;
    setStatus("sending");
    setMessage("");
    const outcome = await subscribe(value, "footer");
    if (outcome === "ok") {
      setStatus("done");
      setMessage(`You are on the list. Your code is ${GIFT.code}.`);
      setEmail("");
      typo.clear();
    } else {
      setStatus("error");
      setMessage(
        outcome === "invalid"
          ? "Please enter a valid email address."
          : "We could not add you just now. Please try again in a moment, or write to admin@alassaltco.com.",
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
          ref={input}
          id={inputId}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="Your email address"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            typo.clear();
            if (status === "error") {
              setStatus("idle");
              setMessage("");
            }
          }}
          onBlur={() => typo.check(email)}
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
        {typo.hint && status !== "error" ? (
          <EmailHint
            suggestion={typo.hint}
            onUse={(fixed) => {
              setEmail(fixed);
              typo.clear();
              input.current?.focus();
            }}
          />
        ) : (
          message
        )}
      </p>
    </form>
  );
}
