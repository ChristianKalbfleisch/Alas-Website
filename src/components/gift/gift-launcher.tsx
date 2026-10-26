"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { art } from "@/data/art";
import { useCart } from "@/lib/cart/cart-context";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion/gsap";
import { GiftDialog } from "./gift-dialog";
import { onOpenGift, useGift } from "./gift-store";

/** True while a pinned scene is active or a full-screen image/video sits under the corner. */
function screenIsHeld(): boolean {
  if (ScrollTrigger.getAll().some((t) => t.pin && t.isActive)) return true;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  for (const el of document.elementsFromPoint(40, vh - 40)) {
    if (el.closest("[data-gift-launcher]")) continue;
    if (
      el instanceof HTMLImageElement ||
      el instanceof HTMLVideoElement ||
      el instanceof HTMLCanvasElement
    ) {
      const r = el.getBoundingClientRect();
      if (r.width >= vw * 0.85 && r.height >= vh * 0.6) return true;
    }
  }
  return false;
}

/**
 * "A gift from the Aegean": a small liquid glass control, bottom left (a circle on
 * phones). It appears once the how-to chapter is behind the visitor, and steps aside
 * near the footer, while the cart is open, while pinned scenes or full-screen imagery
 * hold the screen, and while a section that is itself an ask (`[data-gift-avoid]`)
 * holds the centre. It never opens anything on its own.
 */
export function GiftLauncher() {
  const pathname = usePathname();
  const gift = useGift();
  const { isOpen: cartOpen } = useCart();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("gift");
  const [past, setPast] = useState(false);
  const [avoid, setAvoid] = useState(false);
  const [footer, setFooter] = useState(false);
  const pill = useRef<HTMLSpanElement>(null);
  const sweep = useRef<HTMLSpanElement>(null);
  const greeted = useRef(false);

  useEffect(
    () =>
      onOpenGift((from) => {
        setSource(from);
        setOpen(true);
      }),
    [],
  );

  // Visible once the visitor has passed the how-to chapter (else the hero, else a
  // screen). Hidden while a pinned scene or full-screen imagery holds the screen.
  const [covered, setCovered] = useState(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-query the DOM per route.
  useEffect(() => {
    const gate =
      document.querySelector('[data-section="howto"]') ??
      document.querySelector('[data-section="hero"]');
    let raf = 0;
    const measure = () => {
      raf = 0;
      const vh = window.innerHeight;
      if (gate) {
        const box = gate.parentElement?.classList.contains("pin-spacer")
          ? gate.parentElement
          : gate;
        setPast(box.getBoundingClientRect().bottom < vh * 0.35);
      } else {
        setPast(window.scrollY > vh * 0.6);
      }
      setCovered(screenIsHeld());
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-query the DOM per route.
  useEffect(() => {
    const zones = new Map<Element, boolean>();
    const centre = new IntersectionObserver(
      (entries) => {
        for (const e of entries) zones.set(e.target, e.isIntersecting);
        setAvoid([...zones.values()].some(Boolean));
      },
      { rootMargin: "-38% 0px -38% 0px" },
    );
    for (const el of document.querySelectorAll("[data-gift-avoid]"))
      centre.observe(el);

    const end = new IntersectionObserver(([entry]) =>
      setFooter(entry.isIntersecting),
    );
    const foot = document.querySelector('[data-section="footer"]');
    if (foot) end.observe(foot);
    return () => {
      centre.disconnect();
      end.disconnect();
    };
  }, [pathname]);

  // Small screens: tuck away while reading down, return on the way back up.
  const [tucked, setTucked] = useState(false);
  useEffect(() => {
    const small = window.matchMedia("(max-width: 639px)");
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setTucked(small.matches && y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visible = past && !avoid && !footer && !cartOpen && !tucked && !covered;

  // One light sweep across the glass the first time it appears.
  useEffect(() => {
    if (!visible || greeted.current || prefersReducedMotion()) return;
    greeted.current = true;
    gsap.fromTo(
      sweep.current,
      { xPercent: -140 },
      { xPercent: 260, duration: 1.8, delay: 0.5, ease: "power2.inOut" },
    );
  }, [visible]);

  const onMove = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "mouse" || prefersReducedMotion()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    gsap.to(pill.current, {
      x: Math.max(-6, Math.min(6, dx * 0.08)),
      y: Math.max(-5, Math.min(5, dy * 0.18)),
      duration: 0.6,
      ease: "power3.out",
    });
  }, []);

  const onLeave = useCallback(() => {
    gsap.to(pill.current, { x: 0, y: 0, duration: 0.9, ease: "expo.out" });
  }, []);

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        data-gift-launcher
        aria-label={
          gift.revealed ? "Your gift from the Aegean" : "A gift from the Aegean"
        }
        inert={!visible}
        data-visible={visible}
        onClick={() => {
          setSource("gift");
          setOpen(true);
        }}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="group fixed bottom-[calc(0.9rem+env(safe-area-inset-bottom))] left-[max(0.9rem,env(safe-area-inset-left))] z-[var(--z-gift)] rounded-full transition-[transform,opacity] duration-[1100ms,600ms] ease-[var(--ease-out)] focus-visible:outline-offset-4 data-[visible=false]:pointer-events-none data-[visible=false]:translate-y-[170%] data-[visible=false]:opacity-0 sm:bottom-6 sm:left-6"
      >
        <span
          ref={pill}
          className="glass relative flex h-12 items-center overflow-hidden rounded-full p-1.5 transition-[background-color,box-shadow,padding] duration-500 ease-[var(--ease-out)] group-hover:bg-white/70 group-hover:pr-5 group-hover:shadow-[0_14px_40px_rgb(18_49_77_/_0.14)] group-focus-visible:pr-5 sm:pr-5"
        >
          <span
            ref={sweep}
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[140%] bg-[linear-gradient(100deg,transparent,rgb(255_255_255_/_0.6),transparent)]"
          />
          <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-[#cfd9dc] shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.7),0_2px_6px_rgb(18_49_77_/_0.18)]">
            <Image
              src={art.photo.fleurMacro.src}
              alt=""
              width={370}
              height={247}
              sizes="370px"
              className="absolute max-w-none transition-transform duration-[1200ms] ease-[var(--ease-out)] group-hover:scale-[1.12]"
              style={{
                width: 370,
                height: 247,
                maxWidth: "none",
                left: -270,
                top: -102,
                transformOrigin: "288px 120px",
              }}
            />
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgb(255_255_255_/_0.55),transparent_55%)]" />
          </span>
          <span className="relative max-w-0 overflow-hidden whitespace-nowrap font-mono text-[11px] text-ink uppercase tracking-[0.1em] opacity-0 transition-[max-width,opacity,margin] duration-700 ease-[var(--ease-out)] group-hover:ml-3 group-hover:max-w-[16rem] group-hover:opacity-100 group-focus-visible:ml-3 group-focus-visible:max-w-[16rem] group-focus-visible:opacity-100 sm:ml-3 sm:max-w-[16rem] sm:opacity-100">
            {gift.revealed ? "Your gift" : "A gift from the Aegean"}
          </span>
        </span>
      </button>
      <GiftDialog open={open} source={source} onClosed={() => setOpen(false)} />
    </>
  );
}
