"use client";

import clsx from "clsx";
import Image from "next/image";
import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { art } from "@/data/art";
import { EASE, gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";
import {
  ABOUT_PROMPT,
  LETTERS,
  QUESTIONS,
  RITUALS,
  type RitualId,
  verdict,
} from "./quiz-data";
import {
  GiftToken,
  Keys,
  RitualPick,
  renderStory,
  StoryCard,
} from "./quiz-parts";

/** Steps: 0 intro · 1 about you · 2 to 5 questions · 6 your ritual. */
const DRIFT = [0, 0.7, 1.4, 2.1, 2.8, 3.5, 4.2];

export function Quiz() {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [showFact, setShowFact] = useState(false);
  const [score, setScore] = useState(0);
  const [ritualId, setRitualId] = useState<RitualId | null>(null);
  const [live, setLive] = useState("");
  const [shared, setShared] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const pool = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const timer = useRef(0);
  const moved = useRef(false);

  const question = step >= 2 && step <= 5 ? QUESTIONS[step - 2] : null;
  const ritual = RITUALS.find((r) => r.id === ritualId) ?? null;
  const answered =
    step === 0
      ? 0
      : step === 1
        ? picked === null
          ? 0
          : 1
        : step <= 5
          ? step - 1 + (picked === null ? 0 : 1)
          : 5;
  const view = `${step}-${showFact ? "fact" : "ask"}`;

  // Images scrub (lightly); text never does. Headline and window leave together.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        pool.current,
        { clipPath: "inset(6% 4% 6% 4% round 40px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 28px)",
          ease: "none",
          scrollTrigger: {
            trigger: pool.current,
            start: "top 95%",
            end: "top 35%",
            scrub: 0.3,
          },
        },
      );
      gsap.fromTo(
        photo.current,
        { scale: 1.14 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: pool.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.3,
          },
        },
      );
      const leaving = [
        ...document.querySelectorAll<HTMLElement>("#quiz [data-exit]"),
        pool.current,
      ];
      for (const el of leaving) {
        if (!el) continue;
        gsap.to(el, {
          autoAlpha: 0,
          y: -24,
          scale: 0.98,
          duration: 0.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "bottom 15%",
            toggleActions: "play none none reverse",
          },
        });
      }
    },
    { scope: root },
  );

  // The card's height follows its content, eased, so states never jump.
  useEffect(() => {
    const s = shell.current;
    const i = inner.current;
    if (!s || !i) return;
    let first = true;
    const ro = new ResizeObserver(() => {
      s.style.transition =
        first || prefersReducedMotion()
          ? "none"
          : "height 0.75s cubic-bezier(0.22,1,0.36,1)";
      s.style.height = `${i.offsetHeight}px`;
      first = false;
    });
    ro.observe(i);
    return () => ro.disconnect();
  }, []);

  // Each new view rises in; focus moves to its heading.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs per view.
  useLayoutEffect(() => {
    const el = content.current;
    if (!el) return;
    gsap.set(el, { autoAlpha: 1, y: 0 });
    if (!moved.current) return;
    moved.current = false;
    heading.current?.focus({ preventScroll: true });
    if (prefersReducedMotion()) return;
    gsap.fromTo(
      el.querySelectorAll("[data-rise]"),
      { y: 22, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.9, ease: EASE.out, stagger: 0.05 },
    );
    const top = card.current?.getBoundingClientRect().top ?? 0;
    if (top < 0 && card.current) {
      window.__lenis?.scrollTo(card.current, { offset: -88, duration: 1.1 });
    }
  }, [view]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const swap = useCallback((apply: () => void) => {
    moved.current = true;
    const el = content.current;
    if (!el || prefersReducedMotion()) {
      apply();
      return;
    }
    gsap.to(el, {
      autoAlpha: 0,
      y: -12,
      duration: 0.3,
      ease: "power2.in",
      onComplete: apply,
    });
  }, []);

  function chooseAbout(index: number) {
    if (picked !== null) return;
    const r = RITUALS[index];
    setPicked(index);
    setRitualId(r.id);
    setLive("Noted. Now four quick questions.");
    timer.current = window.setTimeout(
      () =>
        swap(() => {
          setPicked(null);
          setStep(2);
        }),
      prefersReducedMotion() ? 200 : 520,
    );
  }

  function choose(index: number) {
    if (!question || picked !== null) return;
    const choice = question.choices[index];
    const answer = question.choices.find((c) => c.correct)?.label ?? "";
    setPicked(index);
    if (choice.correct) setScore((s) => s + 1);
    setLive(
      `${choice.correct ? "Right." : `Not quite. The answer is ${answer}.`} ${question.fact}`,
    );
    timer.current = window.setTimeout(
      () => swap(() => setShowFact(true)),
      prefersReducedMotion() ? 250 : 700,
    );
  }

  function next() {
    swap(() => {
      setPicked(null);
      setShowFact(false);
      setStep((s) => s + 1);
      if (step === 5 && ritual) {
        setLive(`Your ritual is ${ritual.name}.`);
      }
    });
  }

  function restart() {
    swap(() => {
      setScore(0);
      setPicked(null);
      setShowFact(false);
      setRitualId(null);
      setShared("");
      setStep(1);
    });
  }

  async function share() {
    if (!ritual) return;
    const text = `My ALAS ritual: ${ritual.name}. Find yours: ${window.location.origin}/#quiz`;
    try {
      setShared("Preparing");
      const blob = await renderStory(ritual, score);
      const file = new File([blob], "my-alas-ritual.png", {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My ALAS ritual", text });
        setShared("");
        return;
      }
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = "my-alas-ritual.png";
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(href), 4000);
      setShared("Saved for Stories");
    } catch {
      setShared("");
    }
  }

  function onOptionKeys(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const buttons = [...event.currentTarget.querySelectorAll("button")];
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const to =
      event.key === "ArrowDown"
        ? (at + 1) % buttons.length
        : (at - 1 + buttons.length) % buttons.length;
    buttons[to]?.focus();
    event.preventDefault();
  }

  const options = (
    labels: string[],
    onPick: (i: number) => void,
    correctIndex = -1,
  ) => (
    <ul className="mt-6 sm:mt-8" onKeyDown={onOptionKeys}>
      {labels.map((label, i) => {
        const isPicked = picked === i;
        const isAnswer = picked !== null && i === correctIndex;
        const tag = isAnswer
          ? isPicked
            ? "Right"
            : "Answer"
          : isPicked && correctIndex >= 0
            ? "Your pick"
            : "";
        return (
          <li
            key={label}
            data-rise
            className="border-[var(--c-line)] border-t last:border-b"
          >
            <button
              type="button"
              aria-disabled={picked !== null}
              onClick={() => onPick(i)}
              className={clsx(
                "group/opt flex w-full items-center gap-4 py-3 text-left transition-opacity duration-500 sm:gap-5 sm:py-3.5",
                picked !== null && !isPicked && !isAnswer && "opacity-35",
                picked === null && "cursor-pointer",
              )}
            >
              <span
                className={clsx(
                  "grid size-9 shrink-0 place-items-center rounded-full font-display text-[1.05rem] ring-1 ring-inset transition-colors duration-300",
                  isAnswer || (isPicked && correctIndex < 0)
                    ? "bg-ink text-white ring-ink"
                    : isPicked
                      ? "bg-[var(--c-stone)] text-ink ring-[var(--c-line-strong)]"
                      : "text-ink ring-[var(--c-line-strong)] group-hover/opt:bg-ink group-hover/opt:text-white group-focus-visible/opt:bg-ink group-focus-visible/opt:text-white",
                )}
              >
                {LETTERS[i]}
              </span>
              <span className="min-w-0 flex-1 font-display text-[1.25rem] text-ink leading-tight transition-transform duration-500 ease-[var(--ease-out)] group-hover/opt:translate-x-1 sm:text-[1.45rem]">
                {label}
              </span>
              {tag && (
                <span className="eyebrow shrink-0 !text-ink">/ {tag}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const h3 =
    "font-display text-[1.85rem] leading-[1.06] text-ink sm:text-[2.4rem]";

  let body: ReactNode = null;
  if (step === 0) {
    body = (
      <div>
        <h3
          ref={heading}
          tabIndex={-1}
          style={{ outline: "none" }}
          data-rise
          className="font-display text-[2rem] text-ink leading-[1.04] sm:text-[2.6rem]"
        >
          One question about you. Four about the sea and its salt.
        </h3>
        <p data-rise className="mt-4 max-w-[44ch] text-[15px] text-ink-2">
          Find your ritual, learn a word or two, and earn a gift from the
          Aegean.
        </p>
        <div data-rise className="mt-8">
          <Button size="lg" onClick={() => swap(() => setStep(1))}>
            Begin
          </Button>
        </div>
      </div>
    );
  } else if (step === 1) {
    body = (
      <div>
        <h3
          ref={heading}
          tabIndex={-1}
          style={{ outline: "none" }}
          data-rise
          className={h3}
        >
          {ABOUT_PROMPT}
        </h3>
        {options(
          RITUALS.map((r) => r.label),
          chooseAbout,
        )}
      </div>
    );
  } else if (question && !showFact) {
    body = (
      <div>
        <h3
          ref={heading}
          tabIndex={-1}
          style={{ outline: "none" }}
          data-rise
          className={h3}
        >
          {question.prompt}
        </h3>
        {options(
          question.choices.map((c) => c.label),
          choose,
          question.choices.findIndex((c) => c.correct),
        )}
      </div>
    );
  } else if (question && showFact && picked !== null) {
    const choice = question.choices[picked];
    const tag = choice.correct ? "Right" : choice.close ? "Close" : "Not quite";
    const headline = choice.correct
      ? question.right
      : choice.close && question.close
        ? question.close
        : question.wrong;
    body = (
      <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] sm:gap-9">
        <div
          data-rise
          className="relative flex aspect-[16/9] flex-col items-center justify-center overflow-hidden rounded-[14px] bg-[#f9f6f0] px-4 text-center text-ink ring-1 ring-[var(--c-line)] ring-inset sm:aspect-[4/5]"
        >
          <span
            className={clsx(
              "font-display leading-none",
              question.plate.big.length > 6
                ? "text-[3rem] sm:text-[3.4rem]"
                : "text-[5rem] sm:text-[6.5rem]",
            )}
          >
            {question.plate.big}
          </span>
          <span className="eyebrow mt-4">{question.plate.caption}</span>
        </div>
        <div>
          <p data-rise className="eyebrow">
            / {tag}
          </p>
          <h3
            ref={heading}
            tabIndex={-1}
            style={{ outline: "none" }}
            data-rise
            className="mt-3 font-display text-[1.9rem] text-ink leading-[1.04] sm:text-[2.4rem]"
          >
            {headline}
          </h3>
          <p data-rise className="mt-4 text-[15px] text-ink-2 leading-relaxed">
            {question.fact}
          </p>
          <div data-rise className="mt-7">
            <Button onClick={next}>
              {step === 5 ? "See my ritual" : "Next question"}
            </Button>
          </div>
        </div>
      </div>
    );
  } else if (step === 6 && ritual) {
    body = (
      <div className="grid items-start gap-7 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:gap-10">
        <div data-rise className="mx-auto w-full max-w-[300px] md:max-w-none">
          <StoryCard ritual={ritual} score={score} className="w-full" />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:justify-start">
            <button
              type="button"
              onClick={share}
              className="eyebrow border-[var(--c-line-strong)] border-b pb-0.5 !text-ink hover:border-ink"
            >
              {shared || "Share to Stories"}
            </button>
            <button
              type="button"
              onClick={restart}
              className="eyebrow border-transparent border-b pb-0.5 hover:border-[var(--c-line-strong)]"
            >
              Take it again
            </button>
          </div>
        </div>
        <div>
          <p data-rise className="eyebrow">
            / Your ritual · {score} / 4 · {verdict(score)}
          </p>
          <h3
            ref={heading}
            tabIndex={-1}
            style={{ outline: "none" }}
            data-rise
            className="mt-3 font-display text-[2.4rem] text-ink leading-[1] sm:text-[3.2rem]"
          >
            {ritual.name}
          </h3>
          <p
            data-rise
            className="mt-4 max-w-[46ch] text-[15px] text-ink-2 leading-relaxed"
          >
            {ritual.line}
          </p>
          <div data-rise className="mt-7 border-[var(--c-line)] border-t pt-6">
            <RitualPick ritual={ritual} />
          </div>
          <div data-rise className="mt-7 border-[var(--c-line)] border-t pt-6">
            <GiftToken />
          </div>
        </div>
      </div>
    );
  }

  const label =
    step === 0
      ? "Quiz / 5 questions"
      : step === 1
        ? "Question 1 / 5 · About you"
        : step <= 5
          ? `Question ${step} / 5`
          : "Your ritual";

  return (
    <div ref={root}>
      <div
        ref={pool}
        className="relative mt-10 overflow-hidden rounded-[22px] sm:mt-14 sm:rounded-[28px]"
      >
        <div ref={photo} className="absolute inset-0 will-change-transform">
          <div
            className="absolute inset-y-0 -right-[10%] -left-[110%] transition-transform duration-[2600ms] ease-[var(--ease-out)] motion-reduce:transition-none"
            style={{ transform: `translate3d(-${DRIFT[step] ?? 0}%,0,0)` }}
          >
            <Image
              src={art.photo.cove.src}
              alt=""
              fill
              sizes="(min-width: 1440px) 3000px, 220vw"
              className="object-cover object-[85%_50%]"
            />
          </div>
        </div>
        <p className="eyebrow absolute bottom-4 left-5 z-10 hidden !text-ink/70 md:block">
          / Shallow water, from above
        </p>
        <div className="relative z-10 flex min-h-[min(88svh,860px)] items-center justify-center p-3 sm:p-8 lg:p-12">
          <div
            ref={card}
            className={clsx(
              "glass w-full rounded-[20px] sm:rounded-[24px]",
              step === 6 ? "max-w-[980px]" : "max-w-[700px]",
            )}
            style={{
              background:
                "linear-gradient(180deg, rgb(255 255 255 / 0.86) 0%, rgb(255 255 255 / 0.74) 100%)",
            }}
          >
            <div ref={shell} className="overflow-hidden">
              <div ref={inner} className="p-5 pb-6 sm:p-9">
                <div className="flex items-center justify-between gap-4 border-[var(--c-line)] border-b pb-4">
                  <p className="eyebrow">{label}</p>
                  <Keys done={answered} />
                </div>
                <div ref={content} className="pt-6 sm:pt-8">
                  {body}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {live}
      </p>
    </div>
  );
}
