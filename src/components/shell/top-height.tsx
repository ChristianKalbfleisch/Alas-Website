"use client";

import { useEffect } from "react";

/** The page's own name for how tall the bar and the header stand together. */
const HEIGHT = "--top-h";

/** Sets it from the box just before the script, while the page is being read. */
const AT_ONCE = `document.documentElement.style.setProperty("${HEIGHT}",document.currentScript.previousElementSibling.offsetHeight+"px")`;

/**
 * Tells the page how tall the bar and the header really stand, so the first
 * screen fills exactly what is left under them (globals.css). The bar's line
 * takes two rows on a narrow phone, which no fixed figure allows for. A line
 * of script in the page sets the height before the first screen is drawn, so
 * nothing moves afterwards; from then on it follows every change of size. It
 * stands straight after the box it measures.
 */
export function TopHeight() {
  useEffect(() => {
    const top = document.querySelector<HTMLElement>("[data-site-top]");
    if (!top) return;
    const tell = () =>
      document.documentElement.style.setProperty(
        HEIGHT,
        `${top.offsetHeight}px`,
      );
    tell();
    const sized = new ResizeObserver(tell);
    sized.observe(top);
    return () => sized.disconnect();
  }, []);
  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: a fixed line of script with nothing from a visitor in it
      dangerouslySetInnerHTML={{ __html: AT_ONCE }}
    />
  );
}
