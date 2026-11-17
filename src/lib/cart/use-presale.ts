"use client";

import { useEffect, useState } from "react";
import { PRESALE } from "@/data/presale";

const KEY = "alas-presale-preview";

/** ?presale=1 starts a preview for this tab, ?presale=0 ends it. */
function previewing(): boolean {
  try {
    const flag = new URL(window.location.href).searchParams.get("presale");
    if (flag === "1") window.sessionStorage.setItem(KEY, "1");
    if (flag === "0") window.sessionStorage.removeItem(KEY);
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Whether pre-launch mode shows: switched on in src/data/presale.ts, or previewed. */
export function usePresale(): boolean {
  const [on, setOn] = useState(PRESALE.on);
  useEffect(() => {
    if (!PRESALE.on) setOn(previewing());
  }, []);
  return on;
}
