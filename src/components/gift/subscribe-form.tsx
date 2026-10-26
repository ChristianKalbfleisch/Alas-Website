"use client";

import clsx from "clsx";
import { type FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/button";

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

type Status = "idle" | "sending" | "error";

/** POST to the shared stand-in endpoint. Resolves true when the address was accepted. */
export async function subscribe(
  email: string,
  source: string,
): Promise<boolean> {
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, source }),
    });
    const data = (await res.json()) as { ok?: boolean };
    return res.ok && data.ok === true;
  } catch {
    return false;
  }
}

type SubscribeFormProps = {
  source: string;
  label: string;
  /** Called once the endpoint accepted the address. */
  onDone: (email: string) => void;
  className?: string;
  /** Visible field label (defaults to an sr-only "Email"). */
  fieldLabel?: string;
};

/**
 * One email field and one button. Pill on glass; stacks on narrow screens.
 * Validation is quiet and specific; the status line is announced politely.
 */
export function SubscribeForm({
  source,
  label,
  onDone,
  className,
  fieldLabel,
}: SubscribeFormProps) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setStatus("error");
      setMessage("That email does not look quite right.");
      return;
    }
    setStatus("sending");
    setMessage("");
    const ok = await subscribe(value, source);
    if (ok) {
      setStatus("idle");
      onDone(value);
    } else {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  const invalid = status === "error";

  return (
    <form noValidate onSubmit={onSubmit} className={clsx("w-full", className)}>
      <label
        htmlFor={`${id}-email`}
        className={fieldLabel ? "eyebrow mb-2 block" : "sr-only"}
      >
        {fieldLabel ?? "Email"}
      </label>
      <div
        className={clsx(
          "flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:bg-white/75 sm:p-1.5 sm:pl-6 sm:ring-1 sm:ring-inset",
          invalid ? "sm:ring-[#b4473f]/50" : "sm:ring-[var(--c-line)]",
        )}
      >
        <input
          id={`${id}-email`}
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          placeholder="you@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status === "error") setStatus("idle");
          }}
          aria-invalid={invalid || undefined}
          aria-describedby={`${id}-status`}
          className={clsx(
            "h-13 w-full min-w-0 rounded-full bg-white/75 px-5 text-[16px] text-ink ring-1 ring-inset outline-none placeholder:text-ink-3 focus-visible:ring-2 focus-visible:ring-cobalt sm:h-11 sm:w-auto sm:flex-1 sm:bg-transparent sm:px-0 sm:ring-0 sm:focus-visible:ring-0",
            invalid ? "ring-[#b4473f]/50" : "ring-[var(--c-line)]",
          )}
        />
        <Button
          type="submit"
          disabled={status === "sending"}
          className="w-full shrink-0 sm:w-auto"
        >
          {status === "sending" ? "Sending" : label}
        </Button>
      </div>
      <p
        id={`${id}-status`}
        aria-live="polite"
        className={clsx(
          "mt-2 min-h-[1.25rem] pl-1 text-[13px]",
          invalid ? "text-[#9c3a33]" : "text-ink-3",
        )}
      >
        {message}
      </p>
    </form>
  );
}
