"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "./gsap";

declare global {
  interface Window {
    __lenis?: Lenis | null;
  }
}

const LenisContext = createContext<Lenis | null>(null);

/** The Lenis instance, or null when smooth scrolling is off (reduced motion). */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

/** Scroll to an element or y offset, smoothly when Lenis is running. */
export function scrollToTarget(target: string | HTMLElement | number) {
  const lenis = typeof window !== "undefined" ? window.__lenis : null;
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.6 });
    return;
  }
  if (typeof target === "number") {
    window.scrollTo({ top: target });
    return;
  }
  const el =
    typeof target === "string" ? document.querySelector(target) : target;
  el?.scrollIntoView();
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();

  // On the scroll story a sideways trackpad swipe must not count as Back or
  // Forward (it took the call demo to another page). Product pages keep it.
  useEffect(() => {
    document.documentElement.toggleAttribute(
      "data-immersive",
      pathname === "/",
    );
  }, [pathname]);

  useEffect(() => {
    let instance: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;

    if (!prefersReducedMotion()) {
      // Calm, not floaty: a trackpad swipe travels about a fifth less than the
      // browser's own, and the page settles quickly once the fingers stop.
      instance = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        wheelMultiplier: 0.78,
        touchMultiplier: 1,
        autoRaf: false,
      });
      instance.on("scroll", ScrollTrigger.update);
      tick = (time: number) => instance?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      window.__lenis = instance;
      setLenis(instance);
    }

    // Late images and fonts change page height; keep every ScrollTrigger in sync.
    let lastHeight = document.documentElement.scrollHeight;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => ScrollTrigger.refresh();
    const onRefresh = () => {
      lastHeight = document.documentElement.scrollHeight;
    };
    ScrollTrigger.addEventListener("refresh", onRefresh);
    const observer = new ResizeObserver(() => {
      const height = document.documentElement.scrollHeight;
      if (Math.abs(height - lastHeight) < 2) return;
      clearTimeout(timer);
      timer = setTimeout(refresh, 180);
    });
    observer.observe(document.body);
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("load", refresh);
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      if (tick) gsap.ticker.remove(tick);
      instance?.destroy();
      window.__lenis = null;
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}
