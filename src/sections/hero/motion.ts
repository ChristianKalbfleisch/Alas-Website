"use client";

import { type RefObject, useEffect } from "react";
import {
  EASE,
  gsap,
  prefersReducedMotion,
  ScrollTrigger,
} from "@/lib/motion/gsap";
import { createRipple, type Ripple } from "./ripple";

const reveal = (nodes: Element[]) => {
  for (const node of nodes) (node as HTMLElement).dataset.reveal = "done";
};

/**
 * The hero's own entrance. After the intro the lockup is already in place (the
 * intro hands it over), so only the water settles and the words rise; on a
 * skipped intro the lockup surfaces first, the same way the intro does it.
 */
export function playEntrance(el: HTMLElement) {
  const q = gsap.utils.selector(el);
  const afterIntro = window.__alasIntro === "play";

  const tl = gsap.timeline({ defaults: { ease: EASE.out } });
  const settle = q("[data-settle]");
  tl.to(
    settle,
    { scale: 1, duration: afterIntro ? 3 : 2.4, ease: "expo.out" },
    0,
  );
  if (afterIntro) {
    tl.to(
      settle,
      {
        filter: "blur(0px)",
        duration: 1.4,
        ease: "power2.out",
        clearProps: "filter",
      },
      0,
    );
  }

  const mark = q("[data-in='mark']");
  reveal(mark);
  if (!afterIntro) {
    tl.fromTo(
      mark,
      { opacity: 0, filter: "blur(14px)", y: 6, scale: 0.965 },
      {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        scale: 1,
        duration: 1.15,
        clearProps: "filter,transform,opacity",
      },
      0.05,
    );
  }

  // After the intro the haze clears top-down, so the words rise as it passes.
  const start = afterIntro ? 0.42 : 0.45;
  const eyebrow = q("[data-in='eyebrow']");
  reveal(eyebrow);
  tl.fromTo(
    eyebrow,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 1, clearProps: "transform" },
    start - 0.1,
  );
  const lines = q("[data-line]");
  reveal(lines);
  tl.fromTo(
    lines,
    { yPercent: 112 },
    { yPercent: 0, duration: 1.25, stagger: 0.1 },
    start,
  );
  const support = q("[data-in='support']");
  reveal(support);
  tl.fromTo(
    support,
    { yPercent: 105 },
    { yPercent: 0, duration: 1.2 },
    start + 0.22,
  );
  const ctas = q("[data-in='ctas']");
  reveal(ctas);
  tl.fromTo(
    ctas,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 1.1, clearProps: "transform" },
    start + 0.36,
  );
  const cue = q("[data-in='cue']");
  reveal(cue);
  tl.fromTo(
    cue,
    { opacity: 0 },
    { opacity: 1, duration: 1.2, ease: "power2.out" },
    start + 0.8,
  );
  return tl;
}

/**
 * Leaving: text never scrubs. Each block switches out (fade, 24 px up, 0.98)
 * in 0.5 s as it reaches the top 15% of the screen, and back in on the way up.
 * Only the water and the chalk light scrub, lightly.
 */
export function setupExit(el: HTMLElement) {
  const q = gsap.utils.selector(el);
  for (const target of q(
    "[data-out='mark'], [data-out='eyebrow'], [data-out='title'], [data-out='support'], [data-out='ctas']",
  )) {
    const tween = gsap.to(target, {
      opacity: 0,
      y: -24,
      scale: 0.98,
      duration: 0.5,
      ease: "power2.out",
      paused: true,
    });
    ScrollTrigger.create({
      trigger: target,
      start: "top 15%",
      onEnter: () => tween.play(),
      onLeaveBack: () => tween.reverse(),
    });
  }
  const cue = gsap.to(q("[data-out='cue']"), {
    opacity: 0,
    duration: 0.5,
    ease: "power2.out",
    paused: true,
  });
  ScrollTrigger.create({
    trigger: el,
    start: "top top-=12",
    onEnter: () => cue.play(),
    onLeaveBack: () => cue.reverse(),
  });

  gsap
    .timeline({
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: "bottom top",
        scrub: 0.3,
      },
    })
    .to(
      q("[data-out='stage']"),
      { yPercent: 26, scale: 1.1, duration: 1, ease: "none" },
      0,
    )
    .to(
      q("[data-out='veil']"),
      { opacity: 0.35, duration: 0.5, ease: "none" },
      0,
    )
    .to(
      q("[data-out='dissolve']"),
      { yPercent: -9, duration: 1, ease: "none" },
      0,
    );
}

/**
 * The living layer: the loop plays only while the hero is on screen (never
 * under reduced motion). On pointer devices the water ripples under the cursor
 * (WebGL, when the GPU allows), a warm light follows it, the water and type
 * separate a little in depth, and the buttons lean towards the pointer.
 */
export function useHeroLife(
  root: RefObject<HTMLElement | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  sunRef: RefObject<HTMLDivElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  useEffect(() => {
    const el = root.current;
    const video = videoRef.current;
    const sun = sunRef.current;
    const canvas = canvasRef.current;
    if (!el || !video || !sun || prefersReducedMotion()) return;

    let inView = true;
    let ripple: Ripple | null = null;
    video.muted = true;
    const onPlaying = () => {
      video.dataset.playing = "true";
    };
    video.addEventListener("playing", onPlaying);
    const play = () => {
      video.play().catch(() => {
        // Autoplay refused (e.g. low power mode): the poster stays.
      });
    };

    const fine = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    if (fine && canvas) {
      try {
        ripple = createRipple(canvas, video, () => {
          canvas.dataset.live = "true";
        });
      } catch {
        ripple = null;
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView) {
          play();
          ripple?.start();
        } else {
          video.pause();
          ripple?.stop();
        }
      },
      { threshold: 0 },
    );
    io.observe(el);

    const onResize = () => ripple?.resize();
    window.addEventListener("resize", onResize);

    if (!fine) {
      return () => {
        io.disconnect();
        video.removeEventListener("playing", onPlaying);
        window.removeEventListener("resize", onResize);
      };
    }

    const drift = el.querySelector<HTMLElement>("[data-drift]");
    const depth = el.querySelector<HTMLElement>("[data-depth]");
    const ease = { duration: 1.4, ease: "power3.out" };
    const driftX = drift ? gsap.quickTo(drift, "x", ease) : null;
    const driftY = drift ? gsap.quickTo(drift, "y", ease) : null;
    const depthX = depth ? gsap.quickTo(depth, "x", ease) : null;
    const depthY = depth ? gsap.quickTo(depth, "y", ease) : null;
    const sunX = gsap.quickTo(sun, "x", { duration: 1.8, ease: "power3.out" });
    const sunY = gsap.quickTo(sun, "y", { duration: 1.8, ease: "power3.out" });
    gsap.set(sun, { x: window.innerWidth * 0.3, y: window.innerHeight * 0.25 });

    const magnets = [...el.querySelectorAll<HTMLElement>("[data-magnet]")].map(
      (node) => ({
        node,
        x: gsap.quickTo(node, "x", { duration: 0.7, ease: "power3.out" }),
        y: gsap.quickTo(node, "y", { duration: 0.7, ease: "power3.out" }),
      }),
    );

    let lastX = -1;
    let lastY = -1;
    const onMove = (event: PointerEvent) => {
      // Hold still until the intro has handed its lockup over, or the swap jumps.
      if (
        !inView ||
        (window.__alasIntro === "play" && !window.__alasIntroEnded)
      )
        return;
      const { clientX: cx, clientY: cy } = event;
      const nx = cx / window.innerWidth - 0.5;
      const ny = cy / window.innerHeight - 0.5;
      driftX?.(nx * -26);
      driftY?.(ny * -18);
      depthX?.(nx * 8);
      depthY?.(ny * 6);
      sunX(cx);
      sunY(cy);
      sun.dataset.on = "true";

      for (const m of magnets) {
        const r = m.node.getBoundingClientRect();
        const dx = cx - (r.left + r.width / 2);
        const dy = cy - (r.top + r.height / 2);
        const reach = r.width / 2 + 70;
        const inside = Math.hypot(dx, dy) < reach;
        m.x(inside ? dx * 0.22 : 0);
        m.y(inside ? dy * 0.32 : 0);
      }

      if (ripple && lastX >= 0) {
        const dist = Math.hypot(cx - lastX, cy - lastY);
        const steps = Math.min(4, Math.floor(dist / 14));
        const strength = Math.min(0.16, 0.04 + dist * 0.004);
        for (let i = 1; i <= steps; i++) {
          ripple.drop(
            lastX + ((cx - lastX) * i) / steps,
            lastY + ((cy - lastY) * i) / steps,
            strength,
          );
        }
        if (steps > 0) {
          lastX = cx;
          lastY = cy;
        }
      } else {
        lastX = cx;
        lastY = cy;
      }
    };
    const onLeave = () => {
      sun.dataset.on = "false";
      for (const m of magnets) {
        m.x(0);
        m.y(0);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      io.disconnect();
      ripple?.dispose();
      video.removeEventListener("playing", onPlaying);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [root, videoRef, sunRef, canvasRef]);
}
