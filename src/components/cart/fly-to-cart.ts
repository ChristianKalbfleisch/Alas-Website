"use client";

import { gsap, prefersReducedMotion } from "@/lib/motion/gsap";

/**
 * Where the cart lives on screen. The nav marks its cart button with
 * `data-cart-target`; until then we look for a header control that says "cart".
 */
function cartTargetRect(): DOMRect {
  const marked = document.querySelector<HTMLElement>("[data-cart-target]");
  const fallback = [
    ...document.querySelectorAll<HTMLElement>("header button, header a"),
  ].find((el) =>
    /cart|bag/i.test(`${el.textContent} ${el.getAttribute("aria-label")}`),
  );
  const el = marked ?? fallback;
  if (el) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0) return rect;
  }
  return new DOMRect(window.innerWidth - 64, 24, 40, 40);
}

/**
 * The add-to-cart flight: a copy of the product image lifts off its source and
 * arcs into the cart icon, shrinking as it goes. `onLand` fires on arrival, so
 * the nav count pulses exactly when the item lands. Reduced motion: lands at once.
 */
export function flyToCart(source: HTMLElement | null, onLand: () => void) {
  const img =
    source instanceof HTMLImageElement
      ? source
      : source?.querySelector<HTMLImageElement>("img");
  if (!source || !img || prefersReducedMotion()) {
    onLand();
    return;
  }
  const from = img.getBoundingClientRect();
  if (from.width === 0 || from.bottom < 0 || from.top > window.innerHeight) {
    onLand();
    return;
  }
  const to = cartTargetRect();

  const ghost = document.createElement("img");
  ghost.src = img.currentSrc || img.src;
  ghost.alt = "";
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    objectFit: getComputedStyle(img).objectFit || "contain",
    zIndex: "65",
    pointerEvents: "none",
    willChange: "transform, opacity",
    transformOrigin: "50% 50%",
    filter: "drop-shadow(0 22px 28px rgb(18 49 77 / 0.28))",
  });
  document.body.appendChild(ghost);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  // Control point above the straight line gives a soft arc.
  const cx = dx * 0.25;
  const cy = Math.min(dy, 0) - Math.min(220, Math.abs(dx) * 0.35 + 80);
  const endScale = Math.max(0.06, Math.min(0.22, 34 / from.height));
  const state = { t: 0 };

  const tl = gsap.timeline({
    onComplete: () => {
      ghost.remove();
      onLand();
    },
  });
  tl.to(ghost, { scale: 1.05, duration: 0.14, ease: "power2.out" });
  tl.to(
    state,
    {
      t: 1,
      duration: 0.82,
      ease: "power3.inOut",
      onUpdate: () => {
        const t = state.t;
        const u = 1 - t;
        const x = 2 * u * t * cx + t * t * dx;
        const y = 2 * u * t * cy + t * t * dy;
        const s = 1.05 + (endScale - 1.05) * t ** 1.4;
        gsap.set(ghost, {
          x,
          y,
          scale: s,
          rotation: 9 * t,
          opacity: t < 0.78 ? 1 : 1 - (t - 0.78) / 0.22,
        });
      },
    },
    0.08,
  );
}
