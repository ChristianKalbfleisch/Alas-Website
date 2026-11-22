"use client";

import clsx from "clsx";
import { type FormEvent, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EMAIL, EMAIL_CONSENT, subscribe, useEmailHint } from "./signup";
import { useGift } from "./store";

type Sent = "ok" | "invalid" | "failed";

type EmailFormProps = {
  /** The button's label. */
  label: string;
  /** Called once the address went through. */
  onDone?: (email: string) => void;
  /** Called when the visitor changes the address. */
  onEdit?: () => void;
  /** On a dark background. */
  dark?: boolean;
  /** An address the visitor has already given, to start with. */
  initial?: string;
  /** What the visitor agrees to by sending it; the marketing line unless said otherwise. */
  consent?: string;
  /** An id for the form, so a button elsewhere can send it as it stands. */
  formId?: string;
  className?: string;
} & (
  | {
      /** Which form this is; becomes a tag on the sign-up. */
      source: string;
      send?: undefined;
    }
  | {
      /**
       * Sends the address in the caller's own way, in place of a plain sign-up.
       * "failed" leaves the form as it is: the caller says what went wrong.
       */
      send: (email: string) => Promise<Sent>;
      source?: undefined;
    }
);

/**
 * One email field and one button, side by side; stacked on narrow screens.
 * Every use of it signs the address up for emails, so it says so underneath.
 * It sends one request at a time, however it is pressed.
 */
export function EmailForm({
  source,
  label,
  onDone,
  onEdit,
  send,
  dark = false,
  initial = "",
  consent = EMAIL_CONSENT,
  formId,
  className,
}: EmailFormProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const [email, setEmail] = useState(initial);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const typo = useEmailHint();
  // Sent along, so the step the store records is the step the site shows.
  const answers = useGift().answers;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setError("That email does not look quite right.");
      input.current?.focus();
      return;
    }
    if (typo.hold(value)) return;
    busy.current = true;
    setSending(true);
    setError("");
    const outcome = send
      ? await send(value)
      : await subscribe(value, source, { answers });
    busy.current = false;
    setSending(false);
    if (outcome === "ok") {
      typo.clear();
      onDone?.(value);
      return;
    }
    if (outcome === "failed") return;
    setError(
      outcome === "invalid"
        ? "That email does not look quite right."
        : "Something went wrong. Please try again.",
    );
  }

  return (
    <form
      id={formId}
      noValidate
      onSubmit={onSubmit}
      className={clsx("w-full", className)}
    >
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
            onEdit?.();
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
                onEdit?.();
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
      <p className={clsx("t-fine", dark ? "text-white/75" : "text-ink-2")}>
        {consent}
      </p>
    </form>
  );
}
