"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EASE, gsap, prefersReducedMotion } from "@/lib/motion/gsap";
import { useLenis } from "@/lib/motion/smooth-scroll";
import { GIFT, updateGift, useGift } from "./gift-store";
import { ScratchCard, type ScratchHandle } from "./scratch-card";
import { SubscribeForm } from "./subscribe-form";

type GiftDialogProps = {
  open: boolean;
  source: string;
  onClosed: () => void;
};

/**
 * The gift, in a native modal dialog (top layer, inert page, Esc to close).
 * Lenis stops while it is open; focus lands on the title and returns on close.
 */
export function GiftDialog({ open, source, onClosed }: GiftDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const scratch = useRef<ScratchHandle>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closing = useRef(false);
  const lenis = useLenis();
  const gift = useGift();
  const [announce, setAnnounce] = useState("");
  const [copied, setCopied] = useState(false);

  const lock = useCallback(
    (on: boolean) => {
      if (lenis) {
        if (on) lenis.stop();
        else lenis.start();
      } else {
        document.documentElement.style.overflow = on ? "hidden" : "";
      }
    },
    [lenis],
  );

  useEffect(() => {
    const d = dialog.current;
    if (!open || !d || d.open) return;
    opener.current = document.activeElement as HTMLElement | null;
    closing.current = false;
    setCopied(false);
    d.showModal();
    lock(true);
    if (!prefersReducedMotion()) {
      gsap.fromTo(
        veil.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: EASE.soft },
      );
      gsap.fromTo(
        panel.current,
        { y: 36, opacity: 0, scale: 0.985 },
        { y: 0, opacity: 1, scale: 1, duration: 1, ease: EASE.out },
      );
    }
    requestAnimationFrame(() => title.current?.focus({ preventScroll: true }));
  }, [open, lock]);

  const close = useCallback(() => {
    const d = dialog.current;
    if (!d || closing.current) return;
    closing.current = true;
    const done = () => {
      d.close();
      lock(false);
      opener.current?.focus?.({ preventScroll: true });
      onClosed();
    };
    if (prefersReducedMotion()) {
      done();
      return;
    }
    gsap.to(panel.current, {
      y: 24,
      opacity: 0,
      duration: 0.42,
      ease: "power2.in",
    });
    gsap.to(veil.current, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.in",
      onComplete: done,
    });
  }, [lock, onClosed]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onCancel = (event: Event) => {
      event.preventDefault();
      close();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, [close]);

  useEffect(() => () => lock(false), [lock]);

  const onReveal = useCallback(() => {
    updateGift({ revealed: true });
    setAnnounce(`Your gift: ${GIFT.title}. Code ${GIFT.code}.`);
  }, []);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(GIFT.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const stage = gift.sent ? "sent" : gift.revealed ? "revealed" : "salt";

  return (
    <dialog
      ref={dialog}
      aria-labelledby="gift-title"
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-ink backdrop:bg-transparent"
    >
      <div
        ref={veil}
        aria-hidden
        onClick={close}
        className="absolute inset-0 bg-[rgb(243_240_233_/_0.66)] backdrop-blur-[12px]"
      />
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-8">
        <div
          ref={panel}
          className="glass pointer-events-auto relative max-h-dvh w-full max-w-[940px] overflow-y-auto rounded-t-[28px] px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-[28px] sm:p-8"
          style={{
            background:
              "linear-gradient(180deg, rgb(255 255 255 / 0.86) 0%, rgb(250 248 244 / 0.74) 100%)",
          }}
        >
          <div className="flex items-center justify-between border-[var(--c-line)] border-b pb-3 sm:pb-4">
            <p className="eyebrow">/ A gift from the Aegean</p>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="-mr-1 grid size-10 place-items-center rounded-full text-ink transition-colors duration-300 hover:bg-white/80"
            >
              <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
                <path
                  d="M3 3l10 10M13 3 3 13"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  fill="none"
                />
              </svg>
            </button>
          </div>

          <div className="mt-5 grid items-center gap-6 sm:mt-7 sm:grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)] sm:gap-10">
            <ScratchCard
              ref={scratch}
              revealed={gift.revealed}
              onReveal={onReveal}
              className="aspect-[1/0.92] w-full sm:aspect-[16/11]"
            />

            <div className="min-w-0">
              <h2
                id="gift-title"
                ref={title}
                tabIndex={-1}
                style={{ outline: "none" }}
                className="font-display text-[2.1rem] leading-[1.02] sm:text-[2.6rem]"
              >
                {stage === "salt"
                  ? "Brush away the salt."
                  : stage === "revealed"
                    ? "Yours, from the Aegean."
                    : "On its way."}
              </h2>

              {stage === "salt" && (
                <>
                  <p className="mt-3 max-w-[30ch] text-[15px] text-ink-2">
                    Something is waiting underneath. Use your finger or your
                    mouse, gently.
                  </p>
                  <button
                    type="button"
                    onClick={() => scratch.current?.reveal()}
                    className="eyebrow mt-6 inline-flex items-center gap-2 border-[var(--c-line-strong)] border-b pb-1 !text-ink transition-colors hover:border-ink"
                  >
                    Or reveal it now
                  </button>
                </>
              )}

              {stage === "revealed" && (
                <>
                  <p className="mt-3 max-w-[34ch] text-[15px] text-ink-2">
                    {GIFT.title}, yours for joining. Send it to yourself and it
                    will be waiting when you are ready.
                  </p>
                  <SubscribeForm
                    source={source}
                    label="Send it to me"
                    className="mt-6"
                    onDone={() => {
                      updateGift({ sent: true });
                      setAnnounce(
                        "Sent. Your code is on its way to your inbox.",
                      );
                      requestAnimationFrame(() =>
                        title.current?.focus({ preventScroll: true }),
                      );
                    }}
                  />
                </>
              )}

              {stage === "sent" && (
                <>
                  <p className="mt-3 max-w-[34ch] text-[15px] text-ink-2">
                    Look for it in your inbox. Use the code at checkout,
                    whenever you are ready.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-white/80 px-5 py-3 font-mono text-[14px] tracking-[0.18em] ring-1 ring-[var(--c-line)] ring-inset">
                      {GIFT.code}
                    </span>
                    <button
                      type="button"
                      onClick={copyCode}
                      className="eyebrow border-[var(--c-line-strong)] border-b pb-1 !text-ink hover:border-ink"
                    >
                      {copied ? "Copied" : "Copy code"}
                    </button>
                  </div>
                  <Button variant="ghost" className="mt-7" onClick={close}>
                    Back to the Aegean
                  </Button>
                </>
              )}
            </div>
          </div>
          <p aria-live="polite" className="sr-only">
            {announce}
          </p>
        </div>
      </div>
    </dialog>
  );
}
