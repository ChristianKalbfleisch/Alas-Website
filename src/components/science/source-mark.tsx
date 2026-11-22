"use client";

import { useEffect } from "react";

/** The entry of the list an address ends in, e.g. "#source-13". */
const entryFor = (hash: string) =>
  /^#source-\d+$/.test(hash) ? document.getElementById(hash.slice(1)) : null;

/**
 * Marks the source the address points at. The browser marks an entry itself
 * only when the page is loaded at that address or a link on the same page is
 * pressed; a visitor who arrives from another page's link is moved to the
 * entry without it being marked. This reads the address as the list arrives
 * and whenever its ending changes.
 */
export function SourceMark() {
  useEffect(() => {
    let marked: HTMLElement | null = null;
    const mark = () => {
      marked?.removeAttribute("data-marked");
      marked = entryFor(window.location.hash);
      marked?.setAttribute("data-marked", "true");
    };
    mark();
    window.addEventListener("hashchange", mark);
    return () => {
      window.removeEventListener("hashchange", mark);
      marked?.removeAttribute("data-marked");
    };
  }, []);
  return null;
}
