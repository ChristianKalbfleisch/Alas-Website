"use client";

import Image from "next/image";
import { useRef } from "react";
import { onIntroDone } from "@/components/chrome/intro-signal";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { art } from "@/data/art";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";
import "./hero.css";
import { playEntrance, setupExit, useHeroLife } from "./motion";

const styles = {
  canvas: "ah-canvas",
  content: "ah-content",
  copy: "ah-copy",
  ctas: "ah-ctas",
  cue: "ah-cue",
  dissolve: "ah-dissolve",
  drift: "ah-drift",
  eyebrow: "ah-eyebrow",
  foot: "ah-foot",
  hero: "ah-hero",
  line: "ah-line",
  lineMask: "ah-line-mask",
  markPos: "ah-mark-pos",
  media: "ah-media",
  settle: "ah-settle",
  stage: "ah-stage",
  sun: "ah-sun",
  support: "ah-support",
  supportMask: "ah-support-mask",
  title: "ah-title",
  veil: "ah-veil",
  video: "ah-video",
} as const;

/**
 * Arrival, chapter 0. Wordmark on water: the Blender loop full-bleed, the ALAS
 * lockup large and centred (the intro hands over to it), one line that says
 * what it is and how you use it, and the way to buy.
 */
export default function HeroSection() {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useHeroLife(root, videoRef, sunRef, canvasRef);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const q = gsap.utils.selector(el);
      if (prefersReducedMotion()) {
        for (const node of q("[data-reveal]")) node.dataset.reveal = "done";
        return;
      }

      setupExit(el);

      // Under the intro veil the water waits deeper and out of focus, so the
      // reveal reads as surfacing into it.
      if (window.__alasIntro === "play" && window.__alasIntroDone === false) {
        gsap.set(q("[data-settle]"), { scale: 1.14, filter: "blur(12px)" });
        // The gate keeps this lockup hidden until the intro's identical one
        // hands over, so it must already be "revealed" underneath.
        for (const node of q("[data-in='mark']")) node.dataset.reveal = "done";
      }

      let cancelled = false;
      const stop = onIntroDone(() => {
        const fonts = document.fonts?.ready ?? Promise.resolve();
        const timeout = new Promise((resolve) => setTimeout(resolve, 700));
        Promise.race([fonts, timeout]).then(() => {
          if (!cancelled) playEntrance(el);
        });
      });
      return () => {
        cancelled = true;
        stop();
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="hero"
      data-section="hero"
      aria-labelledby="hero-title"
      className={styles.hero}
    >
      <div className={styles.stage} data-out="stage">
        <div className={styles.drift} data-drift>
          <div className={styles.settle} data-settle>
            <Image
              src={art.water.poster.src}
              alt={art.water.poster.alt}
              fill
              preload
              sizes="100vw"
              quality={85}
              className={styles.media}
            />
            <video
              ref={videoRef}
              className={styles.video}
              muted
              playsInline
              loop
              preload="auto"
              aria-hidden
              tabIndex={-1}
            >
              <source src={art.water.loopWebm} type="video/webm" />
              <source src={art.water.loopMp4} type="video/mp4" />
            </video>
            <canvas ref={canvasRef} className={styles.canvas} aria-hidden />
          </div>
        </div>
        <div ref={sunRef} className={styles.sun} aria-hidden />
      </div>

      <div className={styles.veil} data-out="veil" aria-hidden />
      <div className={styles.dissolve} data-out="dissolve" aria-hidden />

      <div className={styles.content} data-depth>
        <div className={styles.markPos} data-out="mark">
          <div data-hero-mark="" data-reveal="pending" data-in="mark">
            <Logo className="block w-full text-ink" title="ALAS Salt Co." />
          </div>
        </div>

        <div className={styles.copy}>
          <div data-out="eyebrow">
            <p
              className={`eyebrow ${styles.eyebrow}`}
              data-reveal="pending"
              data-in="eyebrow"
            >
              / Ancient elements of the Aegean
            </p>
          </div>
          <div data-out="title">
            <h1 id="hero-title" className={`font-display ${styles.title}`}>
              <span className={styles.lineMask}>
                <span className={styles.line} data-line data-reveal="pending">
                  A pinch of the Aegean
                </span>
              </span>{" "}
              <span className={styles.lineMask}>
                <span className={styles.line} data-line data-reveal="pending">
                  in your water.
                </span>
              </span>
            </h1>
          </div>
          <div data-out="support" className={styles.supportMask}>
            <p
              className={styles.support}
              data-reveal="pending"
              data-in="support"
            >
              Greek sea salt for your daily water.
            </p>
          </div>
          <div data-out="ctas">
            <div className={styles.ctas} data-reveal="pending" data-in="ctas">
              <span data-magnet className="inline-block">
                <Button href="#shop" variant="solid">
                  Shop
                </Button>
              </span>
              <span data-magnet className="inline-block">
                <Button href="#alas" variant="glass">
                  Discover
                </Button>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.foot} aria-hidden>
        <span data-out="cue" className="block">
          <span className={styles.cue} data-reveal="pending" data-in="cue" />
        </span>
      </div>
    </section>
  );
}
