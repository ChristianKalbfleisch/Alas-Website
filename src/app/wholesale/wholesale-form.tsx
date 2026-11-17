"use client";

import clsx from "clsx";
import { type FormEvent, type ReactNode, useId, useRef, useState } from "react";
import { useEmailHint } from "@/components/founding/signup";
import { Button } from "@/components/ui/button";
import { Check, Chevron } from "@/components/ui/icons";
import {
  checkApplication,
  WHOLESALE_PRODUCTS,
  WHOLESALE_TYPES,
  WHOLESALE_VOLUMES,
  type WholesaleError,
} from "@/data/wholesale";

type Fields = {
  business: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  type: string;
  location: string;
  volume: string;
  products: string[];
  message: string;
  updates: boolean;
};

const EMPTY: Fields = {
  business: "",
  name: "",
  email: "",
  phone: "",
  website: "",
  type: "",
  location: "",
  volume: "",
  products: [],
  message: "",
  updates: false,
};

const MESSAGES: Record<WholesaleError | "store", string> = {
  missing_business: "Please add your business name.",
  missing_name: "Please add your name.",
  invalid_email: "That email does not look quite right.",
  invalid_phone:
    "That number does not look quite right. Add your country code if you are outside the US.",
  invalid_type: "Please choose the kind of business.",
  missing_location: "Please add where you are.",
  too_long: "That is a little long. Please shorten your message.",
  store:
    "We could not send it just now. Please try again in a moment, or write to admin@alassaltco.com.",
};

/** The field that needs another look, for each error. */
const FIELD_FOR: Partial<Record<WholesaleError, keyof Fields>> = {
  missing_business: "business",
  missing_name: "name",
  invalid_email: "email",
  invalid_phone: "phone",
  invalid_type: "type",
  missing_location: "location",
  too_long: "message",
};

/** A choice drawn as a pill; it fills when the hidden input before it is checked. */
const CHOICE =
  "inline-flex min-h-11 items-center rounded-full border bg-paper px-4 text-[1rem] transition-colors hover:border-ink-3 peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sea";

const OPTIONAL = <span className="font-normal text-ink-2">(optional)</span>;

function Field({
  id,
  label,
  optional,
  problem,
  className,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  /** What is wrong with this field, shown right under it. */
  problem?: string | null;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label flex items-center gap-1">
        {label}
        {optional && OPTIONAL}
      </label>
      {children}
      {problem && (
        <p id={`${id}-problem`} className="t-small mt-1.5 text-error">
          {problem}
        </p>
      )}
    </div>
  );
}

/**
 * Takes focus as the confirmation appears. The form above it has just
 * collapsed, so this is what brings the confirmation back into view.
 */
const focusOnMount = (el: HTMLElement | null) => {
  el?.focus();
};

/** "Did you mean …?", with the likely address as a button that fills it in. */
function Suggestion({ email, onUse }: { email: string; onUse: () => void }) {
  return (
    <>
      Did you mean{" "}
      <button type="button" className="link font-bold" onClick={onUse}>
        {email}
      </button>
      ?
    </>
  );
}

/**
 * The application: the essentials first, the rest optional. Checked with the
 * same rules as the endpoint, so a problem is named next to its field.
 */
export function WholesaleForm() {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<WholesaleError | "store" | null>(null);
  const [sent, setSent] = useState("");
  const typo = useEmailHint();

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((f) => ({ ...f, [key]: value }));
    if (error && FIELD_FOR[error as WholesaleError] === key) setError(null);
  };

  const focus = (key: keyof Fields) =>
    form.current
      ?.querySelector<HTMLElement>(`[name="${key}"]`)
      ?.focus({ preventScroll: false });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const checked = checkApplication(fields);
    if (!checked.ok) {
      setError(checked.error);
      const key = FIELD_FOR[checked.error];
      if (key) focus(key);
      return;
    }
    if (typo.hold(fields.email.trim())) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/wholesale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.ok && data.ok) {
        setSent(checked.value.email);
        return;
      }
      const known = data.error && data.error in MESSAGES;
      setError(known ? (data.error as WholesaleError) : "store");
    } catch {
      setError("store");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        ref={focusOnMount}
        tabIndex={-1}
        className="mt-8 border-line border-t pt-8 outline-none"
      >
        <span className="grid size-14 place-items-center rounded-full bg-navy text-white">
          <Check size={28} strokeWidth={2} />
        </span>
        <p className="t-h2 mt-6">Thank you.</p>
        <p className="t-body mt-3 max-w-[32rem] text-ink-2">
          Your application is in. We will write back to {sent}.
        </p>
      </div>
    );
  }

  /** The message for a field, when the current error belongs to it. */
  const problem = (key: keyof Fields) =>
    error && error !== "store" && FIELD_FOR[error] === key
      ? MESSAGES[error]
      : null;

  /** The attributes every text control shares. */
  const control = (key: keyof Fields) => ({
    id: `${id}-${key}`,
    name: key,
    className: "field",
    "aria-invalid": problem(key) ? true : undefined,
    "aria-describedby": problem(key) ? `${id}-${key}-problem` : undefined,
  });

  const applyHint = () => {
    if (!typo.hint) return;
    set("email", typo.hint);
    typo.clear();
  };

  return (
    <form
      ref={form}
      noValidate
      onSubmit={onSubmit}
      className="mt-8 grid gap-x-5 gap-y-6 sm:grid-cols-2"
    >
      <Field
        id={`${id}-business`}
        label="Business name"
        problem={problem("business")}
      >
        <input
          {...control("business")}
          autoComplete="organization"
          value={fields.business}
          onChange={(e) => set("business", e.target.value)}
        />
      </Field>
      <Field id={`${id}-name`} label="Your name" problem={problem("name")}>
        <input
          {...control("name")}
          autoComplete="name"
          value={fields.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </Field>
      <Field id={`${id}-email`} label="Email" problem={problem("email")}>
        <input
          {...control("email")}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={fields.email}
          onChange={(e) => {
            set("email", e.target.value);
            typo.clear();
          }}
          onBlur={() => typo.check(fields.email)}
        />
        {typo.hint && !problem("email") && (
          <p className="t-small mt-1.5 text-ink-2">
            <Suggestion email={typo.hint} onUse={applyHint} />
          </p>
        )}
      </Field>
      <Field
        id={`${id}-phone`}
        label="Phone"
        optional
        problem={problem("phone")}
      >
        <input
          {...control("phone")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={fields.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
      </Field>
      <Field
        id={`${id}-location`}
        label="City and state, or country"
        problem={problem("location")}
      >
        <input
          {...control("location")}
          autoComplete="address-level2"
          value={fields.location}
          onChange={(e) => set("location", e.target.value)}
        />
      </Field>
      <Field id={`${id}-website`} label="Website or Instagram" optional>
        <input
          {...control("website")}
          autoComplete="url"
          autoCapitalize="none"
          value={fields.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </Field>

      <fieldset
        className="sm:col-span-2"
        aria-describedby={problem("type") ? `${id}-type-problem` : undefined}
      >
        <legend className="label">Kind of business</legend>
        <div className="flex flex-wrap gap-2">
          {WHOLESALE_TYPES.map((t) => (
            <label key={t.id} className="cursor-pointer">
              <input
                type="radio"
                name="type"
                value={t.id}
                checked={fields.type === t.id}
                onChange={() => set("type", t.id)}
                className="peer sr-only"
              />
              <span
                className={clsx(
                  CHOICE,
                  problem("type") ? "border-error" : "border-line",
                )}
              >
                {t.label}
              </span>
            </label>
          ))}
        </div>
        {problem("type") && (
          <p id={`${id}-type-problem`} className="t-small mt-2 text-error">
            {problem("type")}
          </p>
        )}
      </fieldset>

      <Field id={`${id}-volume`} label="Monthly order, roughly" optional>
        <div className="relative">
          <select
            {...control("volume")}
            value={fields.volume}
            onChange={(e) => set("volume", e.target.value)}
            className="field appearance-none pr-12"
          >
            <option value="">Choose one</option>
            {WHOLESALE_VOLUMES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <Chevron
            size={20}
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-ink-2"
          />
        </div>
      </Field>

      <fieldset>
        <legend className="label">Interested in {OPTIONAL}</legend>
        <div className="flex flex-wrap gap-2">
          {WHOLESALE_PRODUCTS.map((p) => {
            const on = fields.products.includes(p.id);
            return (
              <label key={p.id} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="products"
                  value={p.id}
                  checked={on}
                  onChange={() =>
                    set(
                      "products",
                      on
                        ? fields.products.filter((x) => x !== p.id)
                        : [...fields.products, p.id],
                    )
                  }
                  className="peer sr-only"
                />
                <span className={clsx(CHOICE, "border-line")}>{p.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Field
        id={`${id}-message`}
        label="Anything else"
        optional
        problem={problem("message")}
        className="sm:col-span-2"
      >
        <textarea
          {...control("message")}
          rows={4}
          maxLength={1500}
          value={fields.message}
          onChange={(e) => set("message", e.target.value)}
          className="field block resize-y"
        />
      </Field>

      <label className="t-body flex cursor-pointer items-start gap-3 text-ink-2 sm:col-span-2">
        <input
          type="checkbox"
          name="updates"
          checked={fields.updates}
          onChange={(e) => set("updates", e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-navy"
        />
        Email me wholesale news and new products. Unsubscribe anytime.
      </label>

      <div className="sm:col-span-2">
        <Button
          type="submit"
          size="lg"
          disabled={sending}
          className="w-full sm:w-auto"
        >
          {sending ? "Sending…" : "Send application"}
        </Button>
        <p
          aria-live="polite"
          className={clsx(
            "t-small mt-3 min-h-[1.4rem]",
            error ? "text-error" : "text-ink-2",
          )}
        >
          {error ? (
            MESSAGES[error]
          ) : typo.hint ? (
            <Suggestion email={typo.hint} onUse={applyHint} />
          ) : null}
        </p>
      </div>
    </form>
  );
}
