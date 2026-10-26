// Fast-scroll through the origin scenes and print the most captions and map
// lines visible at the same moment. Both must be 1: two means text is stacking.
//   node scripts/captions.mjs [base] [--mobile]

import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3100";
const mobile = process.argv.includes("--mobile");
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  isMobile: mobile,
  hasTouch: mobile,
});
const page = await context.newPage();
await page.goto(`${base}/?noloader=1`, {
  waitUntil: "networkidle",
  timeout: 90000,
});
await page.waitForTimeout(1200);

await page.evaluate(() => {
  window.__worst = { caps: 0, lines: 0, at: [] };
  const seen = (el) => {
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && Number(cs.opacity) > 0.15;
  };
  const inMask = (el) => {
    const r = el.getBoundingClientRect();
    const m = el.parentElement.getBoundingClientRect();
    const overlap = Math.min(r.bottom, m.bottom) - Math.max(r.top, m.top);
    return overlap > r.height * 0.35;
  };
  const tick = () => {
    const caps = [
      ...document.querySelectorAll("[data-origin-film] [data-cap]"),
    ].filter(seen).length;
    const lines = [
      ...document.querySelectorAll("[data-origin-chart] [data-line]"),
    ].filter((el) => seen(el) && inMask(el)).length;
    if (caps > window.__worst.caps || lines > window.__worst.lines) {
      window.__worst.at.push({ y: Math.round(scrollY), caps, lines });
    }
    window.__worst.caps = Math.max(window.__worst.caps, caps);
    window.__worst.lines = Math.max(window.__worst.lines, lines);
    setTimeout(tick, 40);
  };
  tick();
});

const range = await page.evaluate(() => {
  const a = document.querySelector("#origin");
  const top = a.getBoundingClientRect().top + scrollY;
  return { top: top - innerHeight, end: top + a.offsetHeight };
});

const jump = async (y) => {
  await page.evaluate((y) => {
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true });
    else window.scrollTo(0, y);
  }, y);
};

// Three passes: steady, fast flicks, and back-and-forth.
for (let y = range.top; y < range.end; y += 140) {
  await jump(y);
  await page.waitForTimeout(60);
}
for (let y = range.end; y > range.top; y -= 600) {
  await jump(y);
  await page.waitForTimeout(90);
}
for (let k = 0; k < 40; k++) {
  const y = range.top + ((k * 977) % (range.end - range.top));
  await jump(y);
  await page.waitForTimeout(k % 3 === 0 ? 30 : 120);
}
await page.waitForTimeout(800);
const worst = await page.evaluate(() => window.__worst);
console.log(
  mobile ? "mobile" : "desktop",
  JSON.stringify({
    maxCaptions: worst.caps,
    maxLines: worst.lines,
    firstWorst: worst.at.slice(-3),
  }),
);
await browser.close();
