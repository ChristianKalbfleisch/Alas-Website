// Full-page screenshots for looking a change over.
//   node scripts/shots.mjs [base] [path ...]     (default base http://localhost:3100, path /)
// Writes shots/<name>-desktop.jpg and shots/<name>-phone.jpg (the folder is not committed).
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const [base = "http://localhost:3100", ...paths] = process.argv.slice(2);
const pages = paths.length ? paths : ["/"];
const SIZES = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  phone: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
};
const only = process.env.ONLY;
const fold = process.env.FOLD === "1";

await mkdir("shots", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
for (const path of pages) {
  const name =
    path === "/" ? "home" : path.replace(/^\//, "").replace(/[/?=&#]+/g, "-");
  for (const [label, device] of Object.entries(SIZES)) {
    if (only && only !== label) continue;
    const context = await browser.newContext(device);
    await context.addInitScript(() =>
      localStorage.setItem("alas-gift-offered", "1"),
    );
    const page = await context.newPage();
    await page.goto(base + path, { waitUntil: "networkidle" });
    // Walk the page once so everything that waits for scrolling has appeared.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
        window.scrollTo({ top: y, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 80));
      }
      window.scrollTo({ top: 0, behavior: "instant" });
    });
    // Blocks that rise in as they scroll into view would be blank in a full-page capture.
    await page.addStyleTag({ content: ".rise{animation:none!important}" });
    await page.waitForTimeout(1600);
    const file = `shots/${name}-${label}${fold ? "-fold" : ""}.jpg`;
    await page.screenshot({
      path: file,
      fullPage: !fold,
      type: "jpeg",
      quality: 88,
    });
    console.log(file);
    await context.close();
  }
}
await browser.close();
