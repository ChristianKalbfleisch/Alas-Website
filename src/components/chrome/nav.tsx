"use client";

import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Logo } from "@/components/ui/logo";
import { ANNOUNCEMENT } from "@/data/offers";
import { useCart } from "@/lib/cart/cart-context";
import { gsap, prefersReducedMotion } from "@/lib/motion/gsap";
import { scrollToTarget, useLenis } from "@/lib/motion/smooth-scroll";
import { RefractionFilter, useRefraction } from "./glass-refraction";
import { MenuSheet } from "./menu-sheet";
import "./nav.css";
import { NAV_LINKS } from "./nav-links";
import { useNavScroll } from "./use-nav-scroll";

const styles = {
  announce: "an-announce",
  bar: "an-bar",
  burger: "an-burger",
  capsule: "an-capsule",
  count: "an-count",
  divider: "an-divider",
  edge: "an-edge",
  header: "an-header",
  item: "an-item",
  label: "an-label",
  lens: "an-lens",
  links: "an-links",
  mark: "an-mark",
  material: "an-material",
  refract: "an-refract",
  rim: "an-rim",
  ripple: "an-ripple",
  row: "an-row",
  shop: "an-shop",
} as const;

const SHOP = NAV_LINKS.find((l) => l.id === "shop") ?? NAV_LINKS[0];

/** One floating liquid glass capsule. */
function Capsule({
  id,
  children,
  className,
  innerRef,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  innerRef?: RefObject<HTMLDivElement | null>;
}) {
  const own = useRef<HTMLDivElement>(null);
  const ref = innerRef ?? own;
  const { size, enabled } = useRefraction(ref);
  const refract = enabled && size !== null;
  return (
    <div
      ref={ref}
      className={clsx(styles.capsule, refract && styles.refract, className)}
      style={
        refract ? ({ "--refract": `url(#${id})` } as CSSProperties) : undefined
      }
    >
      <RefractionFilter id={id} size={refract ? size : null} />
      <span className={styles.material} aria-hidden />
      <span className={styles.edge} aria-hidden />
      <span className={styles.rim} aria-hidden />
      {children}
    </div>
  );
}

function PouchGlyph() {
  return (
    <svg
      viewBox="3.6 2.6 12.8 15.6"
      className="h-[17px] w-[14px] shrink-0"
      aria-hidden
    >
      <path
        d="M5.4 3.6h9.2l.9 12.1a1.5 1.5 0 0 1-1.5 1.6H6a1.5 1.5 0 0 1-1.5-1.6l.9-12.1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M5.7 6.4h8.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A grain of salt on its edge: the way to your account and grains. */
function GrainGlyph() {
  return (
    <svg viewBox="0 0 16 16" className="size-[16px]" aria-hidden>
      <path
        d="M8 1.8 13.4 5v6L8 14.2 2.6 11V5L8 1.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M2.6 5 8 8.2 13.4 5M8 8.2v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Liquid glass navigation, iOS 26 style, with Scorpios restraint: MENU left,
 * the lockup centred once the hero's own lockup has left, cart and SHOP right.
 */
export function Nav() {
  const { count, open: openCart, addedAt } = useCart();
  const lenis = useLenis();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [forced, setForced] = useState<string | null>(null);
  const nav = useNavScroll(menuOpen || pinned || focusWithin);

  const headerRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLSpanElement>(null);
  const lensPos = useRef({ l: 0, r: 0, on: false });
  const cartRef = useRef<HTMLButtonElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const forcedTimer = useRef<number | undefined>(undefined);

  const go = useCallback(
    (href: string) => {
      const target = document.querySelector(href);
      if (!target) {
        router.push(`/${href}`);
        return;
      }
      const id = NAV_LINKS.find((l) => l.href === href)?.id ?? null;
      setForced(id);
      window.clearTimeout(forcedTimer.current);
      forcedTimer.current = window.setTimeout(() => setForced(null), 1800);
      lenis?.start();
      scrollToTarget(href);
    },
    [lenis, router],
  );

  // Menu: lock scroll, Esc closes, focus moves in and comes back.
  useEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    lenis?.stop();
    const previousOverflow = root.style.overflow;
    if (!lenis) root.style.overflow = "hidden";
    const first = document.querySelector<HTMLElement>("#alas-menu a");
    first?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key !== "Tab" || !headerRef.current) return;
      const focusables = [
        ...headerRef.current.querySelectorAll<HTMLElement>("a, button"),
      ].filter((el) => !el.closest("[inert]") && el.offsetParent !== null);
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl?.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const menuButton = menuButtonRef.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = previousOverflow;
      lenis?.start();
      menuButton?.focus({ preventScroll: true });
    };
  }, [menuOpen, lenis]);

  // Cart: a soft pulse and a ring of light when something is added.
  useEffect(() => {
    if (!addedAt) return;
    setPinned(true);
    const timer = window.setTimeout(() => setPinned(false), 2600);
    if (!prefersReducedMotion() && cartRef.current && rippleRef.current) {
      gsap
        .timeline()
        .fromTo(
          cartRef.current,
          { scale: 1 },
          { scale: 1.08, duration: 0.22, ease: "power2.out" },
        )
        .to(cartRef.current, { scale: 1, duration: 0.6, ease: "power3.out" })
        .fromTo(
          rippleRef.current,
          { scale: 1, opacity: 0.9 },
          { scale: 1.55, opacity: 0, duration: 1.1, ease: "expo.out" },
          0,
        );
    }
    return () => window.clearTimeout(timer);
  }, [addedAt]);

  // Keyboard users never lose the bar while they are in it.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const onIn = () => setFocusWithin(true);
    const onOut = (event: FocusEvent) => {
      if (!header.contains(event.relatedTarget as Node | null))
        setFocusWithin(false);
    };
    header.addEventListener("focusin", onIn);
    header.addEventListener("focusout", onOut);
    return () => {
      header.removeEventListener("focusin", onIn);
      header.removeEventListener("focusout", onOut);
    };
  }, []);

  // The rim's highlight faces the pointer, like light moving across glass.
  useEffect(() => {
    const header = headerRef.current;
    if (!header || !window.matchMedia("(hover: hover)").matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      raf = 0;
      const cx = window.innerWidth / 2;
      const cy = 40;
      const angle = (Math.atan2(cx - x, -(cy - y)) * 180) / Math.PI;
      header.style.setProperty("--rim-angle", `${angle.toFixed(1)}deg`);
    };
    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  // The lens moves like a drop of liquid glass: the leading edge darts ahead,
  // the trailing edge lets go late, and the drop thins while it is stretched.
  const inlineActive = NAV_LINKS.find(
    (l) => l.inline && l.id === (forced ?? nav.active),
  )?.id;
  const lensTarget = hover ?? inlineActive ?? null;
  useLayoutEffect(() => {
    const lens = lensRef.current;
    const links = linksRef.current;
    if (!lens || !links) return;
    const el = lensTarget
      ? links.querySelector<HTMLElement>(`[data-link="${lensTarget}"]`)
      : null;
    const pos = lensPos.current;
    if (!el || el.offsetParent === null) {
      pos.on = false;
      lens.dataset.on = "false";
      return;
    }
    // A hair inside the label's box, so the lens never kisses the capsule edge.
    const l = el.offsetLeft + 2;
    const r = el.offsetLeft + el.offsetWidth - 2;
    const rest = r - l;
    const apply = () => {
      const width = Math.max(0, pos.r - pos.l);
      const stretch = Math.max(0, width / rest - 1);
      const thin = Math.max(0.8, 1 - stretch * 0.22);
      lens.style.transform = `translateX(${pos.l}px) scaleY(${thin.toFixed(3)})`;
      lens.style.width = `${width}px`;
    };
    gsap.killTweensOf(pos);
    if (!pos.on || prefersReducedMotion()) {
      pos.l = l;
      pos.r = r;
      pos.on = true;
      apply();
      lens.dataset.on = "true";
      return;
    }
    const right = l > pos.l;
    const lead = { duration: 0.32, ease: "power3.out" };
    const trail = { duration: 0.8, ease: "power3.inOut" };
    gsap.to(pos, { l, ...(right ? trail : lead), onUpdate: apply });
    gsap.to(pos, { r, ...(right ? lead : trail), onUpdate: apply });
  }, [lensTarget]);

  const glass = nav.glass || menuOpen;

  return (
    <header
      ref={headerRef}
      data-alas-nav=""
      data-top={String(nav.top && !menuOpen)}
      data-glass={String(glass)}
      data-hidden={String(nav.hidden)}
      data-mark={String(nav.mark || menuOpen)}
      data-open={String(menuOpen)}
      className={styles.header}
    >
      <MenuSheet
        open={menuOpen}
        onNavigate={(href) => {
          setMenuOpen(false);
          go(href);
        }}
        onLeave={() => setMenuOpen(false)}
      />
      <p className={styles.announce}>{ANNOUNCEMENT}</p>
      <div className={styles.bar}>
        <div className={clsx("container-x", styles.row)}>
          <div className="flex justify-start">
            <Capsule id="alas-refract-l">
              <button
                ref={menuButtonRef}
                type="button"
                className={clsx(styles.item, styles.label)}
                aria-expanded={menuOpen}
                aria-controls="alas-menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <span className={styles.burger} aria-hidden />
                <span className="max-[359px]:sr-only">
                  {menuOpen ? "Close" : "Menu"}
                </span>
              </button>
              <div
                ref={linksRef}
                className={clsx(styles.links, "hidden lg:flex")}
                onPointerLeave={() => setHover(null)}
              >
                <span className={styles.divider} aria-hidden />
                <span ref={lensRef} className={styles.lens} aria-hidden />
                {NAV_LINKS.filter((l) => l.inline).map((link) => (
                  <a
                    key={link.id}
                    href={`/${link.href}`}
                    data-link={link.id}
                    data-active={String(inlineActive === link.id)}
                    aria-current={
                      inlineActive === link.id ? "location" : undefined
                    }
                    className={clsx(styles.item, styles.label)}
                    onPointerEnter={() => setHover(link.id)}
                    onClick={(event) => {
                      event.preventDefault();
                      go(link.href);
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </Capsule>
          </div>

          <Capsule id="alas-refract-c" className={styles.mark}>
            <Link
              href="/"
              aria-label="ALAS Salt Co. home"
              className="grid h-full place-items-center px-1"
              tabIndex={nav.mark || menuOpen ? 0 : -1}
            >
              <Logo className="h-[30px] max-md:h-[27px]" title="" />
            </Link>
          </Capsule>

          <div className="flex justify-end">
            <Capsule id="alas-refract-r">
              <Link
                href="/account"
                className={clsx(styles.item, styles.label, "an-account")}
                aria-label="Your account and grains"
                title="Your grains"
              >
                <GrainGlyph />
              </Link>
              <button
                ref={cartRef}
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openCart();
                }}
                className={clsx(styles.item, styles.label, "relative")}
                data-cart-target=""
                aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
              >
                <span ref={rippleRef} className={styles.ripple} aria-hidden />
                <PouchGlyph />
                <span
                  className={styles.count}
                  data-filled={String(count > 0)}
                  aria-hidden
                >
                  {count}
                </span>
              </button>
              <a
                href={`/${SHOP.href}`}
                className={clsx(styles.shop, styles.label)}
                onClick={(event) => {
                  event.preventDefault();
                  setMenuOpen(false);
                  go(SHOP.href);
                }}
              >
                Shop
              </a>
            </Capsule>
          </div>
        </div>
      </div>
    </header>
  );
}
