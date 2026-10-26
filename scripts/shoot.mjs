#!/usr/bin/env node
/**
 * Screenshot a page at several scroll positions, to check scroll choreography.
 *
 *   node scripts/shoot.mjs --path /lab/myth --out shots/myth --at 0%,25%,50%,75%,100%
 *
 * --path    route on the dev server (default /)
 * --base    dev server origin (default http://localhost:3100)
 * --out     folder for PNGs (default shots/<route name>)
 * --at      comma list. "40%" = progress through the section's whole pass
 *           (0% = its top touches the viewport bottom, 100% = its bottom leaves
 *           the top). A plain number = absolute scrollY in px. Default 0.
 * --section data-section key to measure % against (default: first [data-section])
 * --mobile  390x844 touch viewport (default 1440x900)
 * --vw/--vh custom viewport
 * --reduced emulate prefers-reduced-motion
 * --wait    ms to wait after each scroll (default 1600)
 * --hover   CSS selector to hover before each shot
 * --click   CSS selector to click once before shooting
 * --full    one full-page screenshot instead of positions
 * --loader  keep the first-load intro (it is skipped by default)
 *
 * Prints console errors and page errors, which you must fix.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = args[i + 1];
  return !next || next.startsWith("--") ? true : next;
};

const route = opt("path", "/");
const base = opt("base", "http://localhost:3100");
const mobile = opt("mobile", false) === true;
const vw = Number(opt("vw", mobile ? 390 : 1440));
const vh = Number(opt("vh", mobile ? 844 : 900));
const wait = Number(opt("wait", 1600));
const name = route.replace(/^\/+|\/+$/g, "").replace(/\//g, "-") || "home";
const out = opt("out", `shots/${name}`);
const at = String(opt("at", "0")).split(",");
const sectionKey = opt("section", null);
const keepLoader = opt("loader", false) === true;

fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: vw, height: vh },
  deviceScaleFactor: 1,
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: opt("reduced", false) === true ? "reduce" : "no-preference",
});
const page = await context.newPage();
const problems = [];
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console: ${m.text()}`);
});
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));

const url = new URL(route, base);
if (!keepLoader) url.searchParams.set("noloader", "1");
await page.goto(url.toString(), { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(1200);

if (opt("click", null)) {
  await page.click(opt("click"));
  await page.waitForTimeout(800);
}

if (opt("full", false) === true) {
  const file = path.join(out, `${name}-${vw}x${vh}-full.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(file);
} else {
  for (const raw of at) {
    const y = await page.evaluate(
      ({ raw, sectionKey }) => {
        const vhNow = window.innerHeight;
        if (!raw.endsWith("%")) return Number(raw);
        const el = sectionKey
          ? document.querySelector(`[data-section="${sectionKey}"]`)
          : document.querySelector("[data-section]");
        if (!el) return 0;
        // Measure the outermost box (pin spacers wrap pinned sections).
        const box = el.parentElement?.classList.contains("pin-spacer")
          ? el.parentElement
          : el;
        const rect = box.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const startY = top - vhNow;
        const endY = top + rect.height;
        const p = Number(raw.slice(0, -1)) / 100;
        return Math.max(0, startY + (endY - startY) * p);
      },
      { raw, sectionKey },
    );
    await page.evaluate((y) => {
      if (window.__lenis)
        window.__lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
    }, y);
    await page.waitForTimeout(wait);
    if (opt("hover", null)) {
      await page.hover(opt("hover")).catch(() => {});
      await page.waitForTimeout(600);
    }
    const tag = raw.replace("%", "pct");
    const file = path.join(out, `${name}-${vw}x${vh}-${tag}.png`);
    await page.screenshot({ path: file });
    console.log(`${file}  (scrollY ${Math.round(y)})`);
  }
}

if (problems.length) {
  console.log("\nPROBLEMS:");
  for (const p of [...new Set(problems)]) console.log(`  ${p}`);
}
await browser.close();
