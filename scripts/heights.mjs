#!/usr/bin/env node
/** Print each chapter's length in screens (pin spacers included). Usage: node scripts/heights.mjs [--mobile] */
import { chromium } from "playwright";

const mobile = process.argv.includes("--mobile");
const b = await chromium.launch();
const p = await b.newPage({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  isMobile: mobile,
  hasTouch: mobile,
});
await p.goto("http://localhost:3100/?noloader=1", {
  waitUntil: "networkidle",
  timeout: 120000,
});
await p.waitForTimeout(2500);
const r = await p.evaluate(() =>
  [...document.querySelectorAll("[data-section]")].map((el) => {
    const box = el.parentElement?.classList.contains("pin-spacer")
      ? el.parentElement
      : el;
    const h = box.getBoundingClientRect().height;
    return `${el.dataset.section} ${(h / innerHeight).toFixed(1)}`;
  }),
);
const total = (
  await p.evaluate(() => document.documentElement.scrollHeight / innerHeight)
).toFixed(1);
console.log(
  `${mobile ? "mobile" : "desktop"}: ${r.join(" · ")}  | total ${total} screens`,
);
await b.close();
