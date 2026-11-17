"use client";

import clsx from "clsx";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCountdown } from "@/components/campaign/countdown";
import { Button } from "@/components/ui/button";
import { Close } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { CAMPAIGN } from "@/data/campaign";
import {
  ANSWER_BONUS,
  countWord,
  GIFT_ANSWERED,
  GIFT_QUESTIONS,
  GIFT_TIERS,
  GIFT_TOP,
  type GiftAnswers,
  PHONE_BONUS,
  tierForAnswers,
} from "@/data/gift";
import { PHOTOS } from "@/data/photos";
import { useCart } from "@/lib/cart/cart-context";
import { useShopper } from "@/lib/cart/shopper";
import { FoundingForm } from "./founding-form";
import { savePreferences } from "./signup";
import {
  claimedCode,
  earnedTier,
  joinGift,
  onOpenGift,
  updateGift,
  useGift,
} from "./store";

/** The offer opens on its own once per visitor, never again after that. */
const OFFERED = "alas-gift-offered";
const AUTO_OPEN_MS = 25_000;
const EXIT_AFTER_MS = 8_000;
/** Answers given after joining are sent together, a moment after the last one. */
const SYNC_AFTER_MS = 1500;

type Stage = "ask" | "claim" | "phone" | "done";

/** "Three quick questions take it to 20%" / "One more question takes it to 20%" */
function questionsLine(left: number, first: boolean) {
  const count = countWord(left);
  return `${count[0].toUpperCase()}${count.slice(1)} ${first ? "quick" : "more"} question${left === 1 ? " takes" : "s take"} it to ${GIFT_ANSWERED.percent}%`;
}

/** The steps of the offer in a row, filled as far as the visitor has come. */
function Ladder({ percent }: { percent: number }) {
  return (
    <div
      role="img"
      aria-label={`${percent}% off so far, of up to ${GIFT_TOP.percent}%`}
      className="grid auto-cols-fr grid-flow-col gap-1.5"
    >
      {GIFT_TIERS.map((tier) => {
        const reached = tier.percent <= percent;
        return (
          <div key={tier.percent} aria-hidden className="grid gap-2">
            <span
              className={clsx(
                "h-2 rounded-full transition-colors duration-300",
                reached ? "bg-navy" : "bg-mist-2",
              )}
            />
            <span
              className={clsx(
                "t-price text-[0.9375rem] leading-none transition-colors duration-300",
                reached ? "font-bold text-ink" : "text-ink-3",
              )}
            >
              {tier.percent}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Becoming a Founding Member, in a native modal dialog. The discount is a
 * ladder: it opens on the base, each of the questions answered adds a step, an
 * email claims what has been earned and a phone number adds the last step. It
 * opens from any "Founding Member" button, and once on its own for a visitor
 * who has looked around for a while without buying (or is leaving the window on
 * a desktop).
 */
export function FoundingDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const prompt = useRef<HTMLHeadingElement>(null);
  const pathname = usePathname();
  const gift = useGift();
  const { isOpen: cartOpen } = useCart();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("gift");
  const [typedPhone, setTypedPhone] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [addingPhone, setAddingPhone] = useState(false);
  const [copied, setCopied] = useState(false);
  const live = useRef({ open, cartOpen });
  live.current = { open, cartOpen };

  const email = useShopper().email;
  const over = useCountdown()?.over ?? false;
  const campaign = CAMPAIGN && !over ? CAMPAIGN : null;
  const earned = earnedTier(gift);
  const code = claimedCode(gift);
  const question = GIFT_QUESTIONS.find((q) => !gift.answers[q.id]);
  const left = GIFT_QUESTIONS.filter((q) => !gift.answers[q.id]).length;
  const stage: Stage = gift.joined
    ? addingPhone
      ? "phone"
      : "done"
    : question && !skipped
      ? "ask"
      : "claim";
  // The step on show: what is earned, plus the phone step while a number is
  // being typed or added.
  const shown =
    stage === "phone" || (stage === "claim" && typedPhone)
      ? tierForAnswers(gift.answers, true)
      : earned;

  // Answers given after joining go to the store together, not one by one.
  const unsent = useRef<{ email: string; answers: GiftAnswers } | null>(null);
  const timer = useRef<number | null>(null);
  const flush = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
    const waiting = unsent.current;
    unsent.current = null;
    if (waiting) void savePreferences(waiting.email, waiting.answers);
  }, []);

  function answer(questionId: string, choiceId: string) {
    const answers = { ...gift.answers, [questionId]: choiceId };
    updateGift({ answers });
    if (gift.joined && email) {
      unsent.current = { email, answers };
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, SYNC_AFTER_MS);
    }
    // The next question takes the place of this one; read it out from its start.
    requestAnimationFrame(() =>
      (prompt.current ?? title.current)?.focus({ preventScroll: true }),
    );
  }

  useEffect(
    () =>
      onOpenGift((from) => {
        setSource(from);
        setOpen(true);
      }),
    [],
  );

  // Once per visitor: after a while on the page, or on leaving the window.
  const joined = gift.joined;
  useEffect(() => {
    if (joined || pathname.startsWith("/wholesale")) return;
    try {
      if (window.localStorage.getItem(OFFERED)) return;
    } catch {
      return;
    }
    const start = Date.now();
    let offered = false;
    const offer = () => {
      if (offered || live.current.open || live.current.cartOpen) return false;
      // Not over a field someone is typing in: it waits for the next chance.
      if (document.activeElement?.matches("input, textarea, select")) {
        return false;
      }
      offered = true;
      try {
        window.localStorage.setItem(OFFERED, "1");
      } catch {
        // Without storage it may offer again next visit; nothing else breaks.
      }
      setSource("popup");
      setOpen(true);
      return true;
    };
    const interval = window.setInterval(() => {
      const scrolled = window.scrollY > window.innerHeight * 1.5;
      if (Date.now() - start >= AUTO_OPEN_MS && scrolled && offer()) {
        window.clearInterval(interval);
      }
    }, 1000);
    const onLeave = (event: MouseEvent) => {
      if (event.relatedTarget || event.clientY > 0) return;
      if (Date.now() - start >= EXIT_AFTER_MS && offer()) {
        window.clearInterval(interval);
      }
    };
    document.addEventListener("mouseout", onLeave);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("mouseout", onLeave);
    };
  }, [joined, pathname]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      setCopied(false);
      setAddingPhone(false);
      setSkipped(false);
      setTypedPhone(false);
      d.showModal();
      requestAnimationFrame(() =>
        title.current?.focus({ preventScroll: true }),
      );
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  // A new stage starts from its top, with its heading read out.
  const lastStage = useRef(stage);
  useEffect(() => {
    if (lastStage.current === stage) return;
    lastStage.current = stage;
    scroller.current?.scrollTo({ top: 0 });
    requestAnimationFrame(() => title.current?.focus({ preventScroll: true }));
  }, [stage]);

  // Leaving the page with answers still waiting sends them first.
  useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [flush]);

  const close = useCallback(() => {
    flush();
    setOpen(false);
  }, [flush]);

  async function copyCode() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const heading =
    stage === "ask"
      ? left === GIFT_QUESTIONS.length
        ? `Start with ${earned.percent}% off.`
        : `${earned.percent}% off so far.`
      : stage === "claim"
        ? `Claim your ${shown.percent}% off.`
        : stage === "phone"
          ? `Make it ${shown.percent}% off.`
          : "Welcome, Founding Member.";

  const lead =
    stage === "ask"
      ? left === GIFT_QUESTIONS.length
        ? `${questionsLine(left, true)}${
            PHONE_BONUS
              ? `, and a phone number makes it ${GIFT_TOP.percent}%`
              : ""
          }.${campaign ? ` ${campaign.name} ends ${campaign.endsLabel}.` : ""}`
        : `${questionsLine(left, false)}.`
      : stage === "claim"
        ? "Enter your email and the code is yours, with a free Welcome Box at launch and better prices on later orders."
        : stage === "phone"
          ? `Add a phone number for texts and your code becomes ${shown.code}.`
          : `${earned.percent}% off your pre-order. Checkout adds your code for you; it is here if you need it.`;

  const questions = question && (
    <div>
      <h3
        ref={prompt}
        tabIndex={-1}
        className="text-[1.0625rem] leading-snug font-bold outline-none"
      >
        {stage === "done" && (
          <span className="font-normal text-ink-2">
            Add {ANSWER_BONUS}% more.{" "}
          </span>
        )}
        {question.prompt}
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {question.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => answer(question.id, choice.id)}
            className="min-h-11 rounded-full border border-line px-4 py-2 text-[1rem] transition-colors hover:border-navy hover:bg-mist"
          >
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Esc closes a modal dialog natively; this click only catches the backdrop
    <dialog
      ref={dialog}
      aria-labelledby="founding-title"
      data-founding-stage={stage}
      data-founding-percent={shown.percent}
      onClose={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="mx-auto mt-[max(0.75rem,7dvh)] mb-auto w-[min(56rem,calc(100vw-1.5rem))] max-w-none overflow-hidden rounded-[var(--radius-panel)] bg-paper p-0 text-ink shadow-[var(--shadow-pop)] backdrop:bg-navy/60 open:animate-[pop-in_0.35s_var(--ease-out)]"
    >
      {/* Pinned to the top with a steady size, so the heading stays put from one question to the next. */}
      <div
        ref={scroller}
        className="grid max-h-[calc(100dvh-max(0.75rem,7dvh)-0.75rem)] overflow-y-auto md:min-h-[34rem] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]"
      >
        <div className="relative isolate hidden flex-col justify-between overflow-hidden bg-navy p-8 text-white md:flex">
          <Image
            src={PHOTOS.range.src}
            alt=""
            placeholder="blur"
            // A wide picture filling a tall panel: it is shown far wider than the panel.
            sizes="64rem"
            className="absolute inset-0 -z-10 size-full object-cover object-[75%_100%]"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgb(1_21_36/0.82)_0%,rgb(1_21_36/0.35)_42%,rgb(1_21_36/0)_62%)]"
          />
          <div className="flex items-start justify-between gap-4">
            <Logo title="" className="h-12 w-auto" />
            {campaign && (
              <span className="chip chip-white">{campaign.name}</span>
            )}
          </div>
          <p className="mb-auto pt-8">
            <span
              key={shown.percent}
              className="block text-[4.5rem] leading-[0.95] tracking-[-0.04em] motion-safe:animate-[step-up_0.4s_var(--ease-out)]"
            >
              {shown.percent}% off
            </span>
            <span className="t-lead mt-3 block text-white/85">
              your pre-order, as a Founding Member
            </span>
          </p>
        </div>

        <div className="relative p-6 sm:p-9">
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-3 right-3 grid size-11 place-items-center rounded-full text-ink-2 hover:bg-mist hover:text-ink"
          >
            <Close size={20} />
          </button>

          {campaign && stage !== "done" && (
            <p className="mb-4 md:hidden">
              <span className="chip chip-navy">{campaign.name}</span>
            </p>
          )}
          <h2
            id="founding-title"
            ref={title}
            tabIndex={-1}
            className={clsx(
              "t-h2 pr-8 outline-none",
              stage === "done" ? "max-w-[18ch]" : "max-w-[13ch]",
            )}
          >
            {heading}
          </h2>
          <p className="t-body mt-3 text-ink-2">{lead}</p>
          <p aria-live="polite" className="sr-only">
            {stage === "done" ? "" : `${shown.percent}% off so far.`}
          </p>

          <div className="mt-6">
            <Ladder percent={shown.percent} />
          </div>

          {stage === "ask" && (
            <>
              <div className="mt-7">{questions}</div>
              <button
                type="button"
                onClick={() => setSkipped(true)}
                className="link t-body mt-6"
              >
                Skip and claim {earned.percent}%
              </button>
            </>
          )}

          {(stage === "claim" || stage === "phone") && (
            <>
              <div className="mt-7">
                <FoundingForm
                  source={source}
                  answers={gift.answers}
                  phoneNeeded={stage === "phone"}
                  onPhoneChange={setTypedPhone}
                  onDone={(joinedWith) => {
                    joinGift(joinedWith);
                    setAddingPhone(false);
                  }}
                />
              </div>
              {stage === "phone" ? (
                <button
                  type="button"
                  onClick={() => setAddingPhone(false)}
                  className="link t-body mt-5"
                >
                  Keep {earned.percent}%
                </button>
              ) : (
                question && (
                  <button
                    type="button"
                    onClick={() => setSkipped(false)}
                    className="link t-body mt-5"
                  >
                    Back to the questions
                  </button>
                )
              )}
            </>
          )}

          {stage === "done" && (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span
                  key={code}
                  className="t-price rounded-xl border border-line bg-mist px-5 py-3 text-[1.25rem] font-bold tracking-[0.06em] motion-safe:animate-[step-up_0.4s_var(--ease-out)]"
                >
                  {code}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="link t-body"
                >
                  {copied ? "Copied" : "Copy code"}
                </button>
              </div>
              {questions && (
                <div className="mt-7 border-line border-t pt-6">
                  {questions}
                </div>
              )}
              {!gift.phone && PHONE_BONUS > 0 && (
                <button
                  type="button"
                  onClick={() => setAddingPhone(true)}
                  className="link t-body mt-6 block"
                >
                  Add a phone number for {PHONE_BONUS}% more
                </button>
              )}
              <div className="mt-8">
                <Button href="/#shop" onClick={close} arrow>
                  Shop now
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
