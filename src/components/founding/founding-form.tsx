"use client";

import clsx from "clsx";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  answeredCount,
  type GiftAnswers,
  PHONE_BONUS,
  percentFor,
} from "@/data/gift";
import { SHOPIFY_DOMAIN } from "@/data/products";
import { useShopper } from "@/lib/cart/shopper";
import { normalisePhone } from "@/lib/signup/phone";
import { EMAIL, subscribe, useEmailHint } from "./signup";

type FoundingFormProps = {
  source: string;
  answers?: GiftAnswers;
  /** Adding a number to a membership joined with an email alone: the phone is needed. */
  phoneNeeded?: boolean;
  /** Told whether the phone field holds anything, so the offer shown can follow it. */
  onPhoneChange?: (given: boolean) => void;
  /** Called once the endpoint accepted the sign-up; says whether a number came with it. */
  onDone: (joined: { phone: boolean }) => void;
};

const PRIVACY = `https://${SHOPIFY_DOMAIN}/policies/privacy-policy`;

/**
 * Joins the Founding Members: an email (needed) and a phone number for texts
 * (optional, worth the offer's last step, with the consent the law asks for
 * written next to it). The answers given so far go along, since each is worth a
 * step. The email starts filled in when the visitor gave it before on this
 * device.
 */
export function FoundingForm({
  source,
  answers = {},
  phoneNeeded = false,
  onPhoneChange,
  onDone,
}: FoundingFormProps) {
  const id = useId();
  const emailInput = useRef<HTMLInputElement>(null);
  const phoneInput = useRef<HTMLInputElement>(null);
  const remembered = useShopper().email;
  const [email, setEmail] = useState(remembered ?? "");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<"" | "email" | "phone" | "store">("");
  const typo = useEmailHint();
  const given = Boolean(phone.trim());
  const answered = answeredCount(answers);
  const withPhone = percentFor({ answers: answered, phone: true });
  const percent = percentFor({
    answers: answered,
    phone: given || phoneNeeded,
  });

  const report = useRef(onPhoneChange);
  report.current = onPhoneChange;
  useEffect(() => {
    report.current?.(given);
  }, [given]);
  useEffect(
    () => () => {
      report.current?.(false);
    },
    [],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setError("email");
      emailInput.current?.focus();
      return;
    }
    const number = given ? normalisePhone(phone) : null;
    if ((given || phoneNeeded) && !number) {
      setError("phone");
      phoneInput.current?.focus();
      return;
    }
    if (typo.hold(value)) return;
    setSending(true);
    setError("");
    const outcome = await subscribe(value, source, {
      phone: number ?? undefined,
      answers,
    });
    setSending(false);
    if (outcome === "ok") {
      typo.clear();
      onDone({ phone: Boolean(number) });
      return;
    }
    setError(
      outcome === "invalid"
        ? "email"
        : outcome === "invalid-phone"
          ? "phone"
          : "store",
    );
  }

  const message =
    error === "email"
      ? "That email does not look quite right."
      : error === "phone"
        ? given
          ? "That number does not look quite right. Add your country code if you are outside the US."
          : `Add a phone number to make it ${withPhone}%.`
        : error === "store"
          ? "We could not add you just now. Please try again in a moment."
          : "";

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-4">
      <div>
        <label htmlFor={`${id}-email`} className="label">
          Email
        </label>
        <input
          ref={emailInput}
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
            typo.clear();
            if (error === "email") setError("");
          }}
          onBlur={() => typo.check(email)}
          aria-invalid={error === "email" || undefined}
          aria-describedby={`${id}-status`}
          className="field"
        />
      </div>
      <div>
        <label htmlFor={`${id}-phone`} className="label">
          Phone{" "}
          <span className="font-normal text-ink-2">
            {phoneNeeded || !PHONE_BONUS
              ? phoneNeeded
                ? "for texts"
                : "(optional, for texts)"
              : `(optional, makes it ${withPhone}%)`}
          </span>
        </label>
        <input
          ref={phoneInput}
          id={`${id}-phone`}
          type="tel"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
          required={phoneNeeded}
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            if (error === "phone") setError("");
          }}
          aria-invalid={error === "phone" || undefined}
          aria-describedby={`${id}-sms ${id}-status`}
          className="field"
        />
      </div>
      <Button type="submit" size="lg" full disabled={sending}>
        {sending ? "Sending…" : `Get ${percent}% off my pre-order`}
      </Button>
      <p
        id={`${id}-status`}
        aria-live="polite"
        className={clsx(
          "t-small empty:hidden",
          error ? "text-error" : "text-ink-2",
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
                emailInput.current?.focus();
              }}
            >
              {typo.hint}
            </button>
            ?
          </>
        ) : (
          message || null
        )}
      </p>
      <p id={`${id}-sms`} className="t-fine text-ink-3">
        You agree to emails from ALAS; unsubscribe anytime. By adding your
        number you agree to receive recurring automated marketing texts from
        ALAS Salt Co. at that number. Consent is not a condition of purchase.
        Msg and data rates may apply. Msg frequency varies. Reply STOP to
        cancel, HELP for help.{" "}
        <a href={PRIVACY} target="_blank" rel="noreferrer" className="link">
          Privacy policy
        </a>
      </p>
    </form>
  );
}
