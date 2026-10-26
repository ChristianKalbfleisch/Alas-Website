#!/usr/bin/env node
/**
 * Film the whole page as a strip of frames, for reviewing the scroll journey.
 *
 *   node scripts/journey.mjs --out shots/journey [--mobile] [--step 0.6] [--path /]
 *
 * Steps through the page every --step viewports (default 0.6), waits for scrubbed
 * animations to settle, saves numbered frames and contact sheets (6 per sheet)
 * so many frames can be looked at quickly. Prints console and page errors.
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

const mobile = opt("mobile", false) === true;
const vw = mobile ? 390 : 1440;
const vh = mobile ? 844 : 900;
const step = Number(opt("step", 0.6));
const wait = Number(opt("wait", 1300));
const route = opt("path", "/");
const base = opt("base", "http://localhost:3100");
const out = opt("out", `shots/journey-${mobile ? "mobile" : "desktop"}`);
fs.rmSync(out, { recursive: true, force: true });
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
url.searchParams.set("noloader", "1");
await page.goto(url.toString(), { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(1500);

const frames = [];
let y = 0;
let index = 0;
for (;;) {
  const total = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  if (y > total) y = total;
  await page.evaluate((y) => {
    if (window.__lenis)
      window.__lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  }, y);
  await page.waitForTimeout(wait);
  const section = await page.evaluate(() => {
    const mid = window.innerHeight / 2;
    const els = [...document.querySelectorAll("[data-section]")];
    const hit = els.find((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= mid && r.bottom >= mid;
    });
    return hit?.getAttribute("data-section") ?? "-";
  });
  const file = path.join(
    out,
    `${String(index).padStart(3, "0")}-${section}-${Math.round(y)}.png`,
  );
  await page.screenshot({ path: file });
  frames.push({ file, y, section });
  index += 1;
  if (y >= total) break;
  y += Math.round(vh * step);
}

// Contact sheets: frames scaled down, 3 columns x 2 rows, labelled.
const sheetPage = await context.newPage();
for (let s = 0; s < frames.length; s += 6) {
  const group = frames.slice(s, s + 6);
  const cells = group
    .map((f) => {
      const data = fs.readFileSync(f.file).toString("base64");
      return `<figure><img src="data:image/png;base64,${data}"/><figcaption>${path.basename(f.file)}</figcaption></figure>`;
    })
    .join("");
  const cellW = mobile ? 300 : 600;
  await sheetPage.setViewportSize({ width: cellW * 3 + 40, height: 800 });
  await sheetPage.setContent(
    `<html><body style="margin:0;padding:10px;background:#222;display:grid;grid-template-columns:repeat(3,${cellW}px);gap:10px;font:12px monospace;color:#ddd">${cells}</body><style>figure{margin:0}img{width:100%;display:block}figcaption{padding:4px 0}</style></html>`,
  );
  const sheet = path.join(out, `sheet-${String(s / 6).padStart(2, "0")}.png`);
  await sheetPage.screenshot({ path: sheet, fullPage: true });
}

console.log(
  `${frames.length} frames, page scroll ${frames.at(-1)?.y ?? 0}px -> ${out}`,
);
if (problems.length) {
  console.log("\nPROBLEMS:");
  for (const p of [...new Set(problems)]) console.log(`  ${p}`);
}
await browser.close();
