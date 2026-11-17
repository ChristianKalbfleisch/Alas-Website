"use client";

import clsx from "clsx";
import { type FormEvent, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EMAIL, subscribe, useEmailHint } from "./signup";
import { useGift } from "./store";

type EmailFormProps = {
  /** Which form this is; becomes a tag on the sign-up. */
  source: string;
  /** The button's label. */
  label: string;
  /** Called once the endpoint accepted the address. */
  onDone: (email: string) => void;
  /** On a dark background. */
  dark?: boolean;
  /** An address the visitor has already given, to start with. */
  initial?: string;
  className?: string;
};

/** One email field and one button, side by side; stacked on narrow screens. */
export function EmailForm({
  source,
  label,
  onDone,
  dark = false,
  initial = "",
  className,
}: EmailFormProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(initial);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const typo = useEmailHint();
  // Sent along, so the step the store records is the step the site shows.
  const answers = useGift().answers;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setError("That email does not look quite right.");
      input.current?.focus();
      return;
    }
    if (typo.hold(value)) return;
    setSending(true);
    setError("");
    const outcome = await subscribe(value, source, { answers });
    setSending(false);
    if (outcome === "ok") {
      typo.clear();
      onDone(value);
      return;
    }
    setError(
      outcome === "invalid"
        ? "That email does not look quite right."
        : "Something went wrong. Please try again.",
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className={clsx("w-full", className)}>
      <label htmlFor={`${id}-email`} className="sr-only">
        Email
      </label>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          ref={input}
          id={`${id}-email`}
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="Email address"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            typo.clear();
            if (error) setError("");
          }}
          onBlur={() => typo.check(email)}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={`${id}-status`}
          className="field sm:flex-1"
        />
        <Button
          type="submit"
          tone={dark ? "white" : "navy"}
          disabled={sending}
          className="shrink-0"
        >
          {sending ? "Sending…" : label}
        </Button>
      </div>
      <p
        id={`${id}-status`}
        aria-live="polite"
        className={clsx(
          "t-small mt-2 min-h-[1.4rem]",
          error
            ? dark
              ? "text-[#ffb4ab]"
              : "text-error"
            : dark
              ? "text-white/75"
              : "text-ink-2",
        )}
      >
        {typo.hint && !error ? (
          <>
            Did you mean{" "}
            <button
              type="button"
              className="link font-bold"
              onClick={() => {
                setEmail(typo.hint ?? "");
                typo.clear();
                input.current?.focus();
              }}
            >
              {typo.hint}
            </button>
            ?
          </>
        ) : (
          error
        )}
      </p>
    </form>
  );
}
