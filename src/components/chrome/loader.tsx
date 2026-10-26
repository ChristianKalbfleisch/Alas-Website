"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/logo";
import { useLenis } from "@/lib/motion/smooth-scroll";
import {
  INTRO_DONE_EVENT,
  INTRO_END_EVENT,
  INTRO_SESSION_KEY,
  signalIntroDone,
} from "./intro-signal";
import "./loader.css";

const styles = {
  hole: "ai-hole",
  mark: "ai-mark",
  markInner: "ai-mark-inner",
  stage: "ai-stage",
  sun: "ai-sun",
  veil: "ai-veil",
} as const;

const GATE_STYLE_ID = "alas-intro-gate";
/** Intro clock, in ms from the moment the veil shows (see loader.module.css). */
const T_REVEAL = 1000;
const T_UNLOCK = 1450;
const FAILSAFE_MS = 3500;

/*
  Runs during HTML parsing, before first paint and before React. It decides
  whether the intro plays and, if so, injects one rule that shows the veil,
  keeps the hero's own lockup hidden until the hand-over, and fades the nav in.
  Nothing React renders depends on it, so hydration always matches.
*/
const GATE = `(function(){var w=window,d=document;w.__alasIntro="skip";w.__alasIntroDone=true;try{var l=location;if(l.pathname!=="/"||/[?&]noloader(=|&|$)/.test(l.search)||w.matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem("${INTRO_SESSION_KEY}"))return;sessionStorage.setItem("${INTRO_SESSION_KEY}","1");w.__alasIntro="play";w.__alasIntroDone=false;var s=d.createElement("style");s.id="${GATE_STYLE_ID}";s.textContent="[data-alas-intro]{display:block!important}[data-hero-mark]{visibility:hidden}[data-alas-nav]{animation:alas-nav-in .9s cubic-bezier(.22,1,.36,1) 1.35s both}@keyframes alas-nav-in{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}";d.head.appendChild(s)}catch(e){}})();`;

const SCROLL_KEYS = new Set([
  " ",
  "ArrowDown",
  "ArrowUp",
  "PageDown",
  "PageUp",
  "Home",
  "End",
]);

/**
 * First-load intro ("Surfacing"): warm lime-wash white, the ALAS lockup
 * surfaces where it will live in the hero, a narrow band of warm light crosses
 * it, then the haze clears top-down onto the real water. Home page only, once per session, skipped
 * with ?noloader and under reduced motion.
 */
export function Loader() {
  const veilRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(true);
  const [locked, setLocked] = useState(false);
  const lenis = useLenis();

  // Keep Lenis stopped while the intro holds the page (it may arrive late).
  useEffect(() => {
    if (!lenis) return;
    if (locked) lenis.stop();
    else lenis.start();
  }, [lenis, locked]);

  useEffect(() => {
    const veil = veilRef.current;
    if (window.__alasIntro !== "play" || !veil) {
      // Skipped: release anyone waiting, then drop the veil markup.
      window.__alasIntroDone = true;
      window.dispatchEvent(new Event(INTRO_DONE_EVENT));
      setMounted(false);
      return;
    }

    let raf = 0;
    let finished = false;
    let cancelled = false;
    const animations = veil.getAnimations?.({ subtree: true }) ?? [];
    const clock = veil.getAnimations?.().find((a) => a.currentTime !== null);

    const block = (event: Event) => {
      if (event instanceof KeyboardEvent && !SCROLL_KEYS.has(event.key)) return;
      event.preventDefault();
    };
    const hurry = () => {
      for (const animation of animations) animation.playbackRate = 2.5;
    };
    const release = () => {
      setLocked(false);
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", block);
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      signalIntroDone();
      release();
      // Hand-over in one frame: removing the gate rule hides this veil and
      // shows the hero's identical lockup underneath it.
      document.getElementById(GATE_STYLE_ID)?.remove();
      veil.style.display = "none";
      window.__alasIntroEnded = true;
      window.dispatchEvent(new Event(INTRO_END_EVENT));
      setMounted(false);
    };

    setLocked(true);
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", block);
    for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) {
      window.addEventListener(type, hurry, { once: true, passive: true });
    }

    const tick = () => {
      const time = Number(clock?.currentTime ?? 0);
      if (time >= T_REVEAL) {
        veil.style.pointerEvents = "none";
        signalIntroDone();
      }
      if (time >= T_UNLOCK) release();
      if (!finished) raf = requestAnimationFrame(tick);
    };

    if (clock) {
      raf = requestAnimationFrame(tick);
      const settle = () => {
        if (!cancelled) finish();
      };
      clock.finished.then(settle, settle);
    } else {
      // No Web Animations API: follow the CSS timings with plain timers.
      window.setTimeout(signalIntroDone, T_REVEAL);
      window.setTimeout(release, T_UNLOCK);
      window.setTimeout(() => !cancelled && finish(), 1950);
    }
    const failsafe = window.setTimeout(
      () => !cancelled && finish(),
      FAILSAFE_MS,
    );

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(failsafe);
      for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) {
        window.removeEventListener(type, hurry);
      }
      release();
    };
  }, []);

  return (
    <>
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static gate script, no user input.
        dangerouslySetInnerHTML={{ __html: GATE }}
      />
      {mounted && (
        <div
          ref={veilRef}
          data-alas-intro=""
          className={styles.veil}
          aria-hidden
        >
          <svg className={styles.stage} aria-hidden focusable="false">
            <defs>
              <linearGradient id="alas-intro-haze" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#000" />
                <stop offset="0.62" stopColor="#000" />
                <stop offset="1" stopColor="#fff" />
              </linearGradient>
              <mask
                id="alas-intro-mask"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="100%"
                height="100%"
              >
                <rect width="100%" height="100%" fill="#fff" />
                <rect
                  className={styles.hole}
                  width="100%"
                  height="160%"
                  fill="url(#alas-intro-haze)"
                />
              </mask>
            </defs>
            <g mask="url(#alas-intro-mask)">
              <rect width="100%" height="100%" fill="#faf8f4" />
            </g>
          </svg>
          <div className={styles.mark}>
            <span className={styles.markInner}>
              <Logo className="block w-full" title="" />
            </span>
          </div>
          <span className={styles.sun} />
        </div>
      )}
    </>
  );
}
