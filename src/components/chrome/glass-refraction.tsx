"use client";

import { type RefObject, useEffect, useState } from "react";

/**
 * Edge refraction for one glass capsule (Chromium only: it is the one engine
 * that accepts an SVG filter inside `backdrop-filter`). A displacement map the
 * size of the capsule leaves the middle untouched and bends the backdrop at the
 * rounded edges, like a real lens. Everywhere else the glass stays blur-only.
 */
export function useRefraction(ref: RefObject<HTMLElement | null>): {
  size: { w: number; h: number } | null;
  enabled: boolean;
} {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const chromium = /Chrome\/\d+/.test(ua) && !/Mobile|Android/.test(ua);
    if (!chromium) return;
    setEnabled(true);
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      const w = Math.round(box ? box.inlineSize : el.offsetWidth);
      const h = Math.round(box ? box.blockSize : el.offsetHeight);
      setSize((prev) =>
        prev && prev.w === w && prev.h === h ? prev : { w, h },
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return { size: enabled ? size : null, enabled };
}

function displacementMap(w: number, h: number): string {
  const r = h / 2;
  const edge = Math.max(5, Math.round(h * 0.16));
  const blur = Math.round(h * 0.14);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="x" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#f00"/></linearGradient><linearGradient id="y" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#00f"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="${blur}"/></filter></defs><rect width="${w}" height="${h}" fill="#000"/><rect width="${w}" height="${h}" rx="${r}" fill="url(#x)"/><rect width="${w}" height="${h}" rx="${r}" fill="url(#y)" style="mix-blend-mode:screen"/><rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="${r - edge}" fill="#808080" filter="url(#b)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function RefractionFilter({
  id,
  size,
}: {
  id: string;
  size: { w: number; h: number } | null;
}) {
  if (!size || size.w < 2 || size.h < 2) return null;
  const { w, h } = size;
  return (
    <svg
      width="0"
      height="0"
      className="absolute"
      aria-hidden
      focusable="false"
    >
      <filter
        id={id}
        x="0"
        y="0"
        width={w}
        height={h}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feImage
          href={displacementMap(w, h)}
          x="0"
          y="0"
          width={w}
          height={h}
          result="map"
          preserveAspectRatio="none"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="map"
          scale={-Math.round(h * 0.3)}
          xChannelSelector="R"
          yChannelSelector="B"
        />
      </filter>
    </svg>
  );
}
