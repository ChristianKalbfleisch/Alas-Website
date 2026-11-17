// Browser checks for the site: what a visitor sees and the paths to checkout.
//   node scripts/site-checks.mjs [base]     (default http://localhost:3100)
// Uses the installed Chrome. Exits non-zero when a check fails.
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3100";

// The offer in force, read from the site's own settings.
const settings = readFileSync(
  new URL("../src/data/campaign.ts", import.meta.url),
  "utf8",
);
const block = (name) =>
  settings.slice(settings.indexOf(`export const ${name}`)).split("};")[0];
const campaignOn = /on: true/.test(block("BLACK_FRIDAY"));
const offerText = block(campaignOn ? "BLACK_FRIDAY" : "STANDING");
// The ladder: the base for joining, a step for each answer, a last one for a phone.
const [BASE, PER_ANSWER, PHONE_STEP] = offerText
  .match(/ladder:\s*\{\s*base:\s*(\d+),\s*perAnswer:\s*(\d+),\s*phone:\s*(\d+)/)
  .slice(1)
  .map(Number);
const CODE = offerText.match(/code: "(\w+)"/)[1];
const QUESTIONS = readFileSync(
  new URL("../src/data/gift.ts", import.meta.url),
  "utf8",
).match(/prompt: "/g).length;
const step = (answers, phone = false) => {
  const percent = BASE + answers * PER_ANSWER + (phone ? PHONE_STEP : 0);
  return { percent, code: `${CODE}${percent}` };
};
const OFFER = {
  start: step(0),
  answered: step(QUESTIONS),
  top: step(QUESTIONS, true),
};
const browser = await chromium.launch({ channel: "chrome" });
const results = [];
const check = (name, ok, detail = "") =>
  results.push({ name, ok: Boolean(ok), detail: String(detail).slice(0, 220) });

const PHONE = {
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
};
const DESKTOP = { viewport: { width: 1440, height: 900 } };
let visitor = 0;

/** A fresh visitor; the offer pop-up is marked as already shown unless asked for. */
async function open(path, device = DESKTOP, { popup = false } = {}) {
  visitor += 1;
  const context = await browser.newContext({
    ...device,
    extraHTTPHeaders: { "x-forwarded-for": `203.0.113.${visitor}` },
  });
  if (!popup) {
    await context.addInitScript(() =>
      localStorage.setItem("alas-gift-offered", "1"),
    );
  }
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const response = await page.goto(base + path, { waitUntil: "networkidle" });
  return { context, page, errors, status: response?.status() };
}

/** Every piece of visible text: its size and the first font in its stack. */
const typeAudit = () => {
  const out = { small: [], fonts: new Set(), upper: [] };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = node.textContent.trim();
    const el = node.parentElement;
    if (!text || !el || el.closest("script,style,noscript,[hidden]")) continue;
    const box = el.getBoundingClientRect();
    if (!box.width || !box.height) continue;
    const style = getComputedStyle(el);
    if (
      style.visibility === "hidden" ||
      style.clip === "rect(0px, 0px, 0px, 0px)"
    )
      continue;
    if (parseFloat(style.fontSize) < 13)
      out.small.push(`${text.slice(0, 30)} (${style.fontSize})`);
    out.fonts.add(style.fontFamily.split(",")[0].replace(/"/g, "").trim());
    if (style.textTransform === "uppercase") out.upper.push(text.slice(0, 30));
  }
  return { small: out.small, fonts: [...out.fonts], upper: out.upper };
};

// 1. Pages load cleanly, on a computer and on a phone.
const PAGES = [
  "/",
  "/products/classic-pouch",
  "/products/lemon-pouch",
  "/products/sticks-15",
  "/products/lemon-sticks-5",
  "/products/discover-set",
  "/science-and-history",
  "/wholesale",
];
// SKIP=/wholesale,/account leaves pages out while they are being worked on.
const skip = new Set((process.env.SKIP ?? "").split(",").filter(Boolean));
for (const path of PAGES.filter((p) => !skip.has(p))) {
  for (const [label, device] of [
    ["desktop", DESKTOP],
    ["phone", PHONE],
  ]) {
    const { context, page, errors, status } = await open(path, device);
    check(`${path} ${label}: loads`, status === 200, status);
    check(`${path} ${label}: no script errors`, errors.length === 0, errors[0]);
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    check(`${path} ${label}: no sideways scroll`, over <= 0, `${over}px`);
    const audit = await page.evaluate(typeAudit);
    check(
      `${path} ${label}: no text under 13px`,
      audit.small.length === 0,
      audit.small.slice(0, 3).join(" | "),
    );
    check(
      `${path} ${label}: one typeface`,
      audit.fonts.length === 1,
      audit.fonts.join(", "),
    );
    check(
      `${path} ${label}: no all-caps labels`,
      audit.upper.length === 0,
      audit.upper.slice(0, 3).join(" | "),
    );
    const faces = await page.evaluate(async () => {
      await document.fonts.ready;
      const own = getComputedStyle(document.documentElement)
        .getPropertyValue("--font-alas")
        .split(",")[0]
        .replace(/["']/g, "")
        .trim();
      return [...document.fonts]
        .filter((face) => face.status === "loaded")
        .map((face) => face.family.replace(/["']/g, ""))
        .filter((family) => family === own).length;
    });
    check(
      `${path} ${label}: the site's own typeface is loaded`,
      faces >= 1,
      faces,
    );
    const backdrops = await page.evaluate(() => [
      ...new Set(
        [...document.querySelectorAll(".stage")].map(
          (stage) => getComputedStyle(stage).backgroundColor,
        ),
      ),
    ]);
    check(
      `${path} ${label}: every pack sits on one backdrop`,
      backdrops.length <= 1,
      backdrops.join(" | "),
    );
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    await page.waitForLoadState("networkidle");
    const broken = await page.evaluate(() =>
      [...document.images]
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src),
    );
    check(
      `${path} ${label}: every image loads`,
      broken.length === 0,
      broken[0],
    );
    // The width the server sent (the w= in the picture's address) against the
    // pixels the frame needs, allowing for the crop when shapes differ.
    const soft = await page.evaluate(() =>
      [...document.querySelectorAll(".photo > img")]
        .filter((img) => {
          const sent = /[?&]w=(\d+)/.exec(img.currentSrc);
          if (!sent || !img.naturalWidth) return false;
          const box = img.getBoundingClientRect();
          const shape = img.naturalWidth / img.naturalHeight;
          const needed =
            Math.max(box.width, box.height * shape) * devicePixelRatio;
          return Number(sent[1]) < needed * 0.7;
        })
        .map((img) => img.alt.slice(0, 40)),
    );
    check(
      `${path} ${label}: no photograph is stretched soft`,
      soft.length === 0,
      soft[0],
    );
    await context.close();
  }
}

// 2. The home page says what it is and sells from the first screen.
{
  const { context, page } = await open("/", PHONE);
  const h1 = (await page.locator("h1").innerText()).replace(/\s+/g, " ");
  check("home: headline reads plainly", h1 === "Salt your water.", h1);
  const text = await page.locator("main").innerText();
  check(
    "home: no Aegean, no old names",
    !/Aegean|Mikr|Megal|Hydration Element/i.test(text),
  );
  check("home: no game", !/brush away|scratch|reveal it/i.test(text));
  const order = await page.evaluate(() =>
    [...document.querySelectorAll("main > section")].map(
      (s) => s.querySelector("h1,h2")?.textContent?.trim().slice(0, 24) ?? "",
    ),
  );
  check(
    "home: eleven sections in order",
    order.length === 11,
    order.join(" / "),
  );
  const photos = await page.locator("main .photo > img").count();
  check("home: the sections carry photographs", photos >= 13, photos);
  const shopTop = await page.evaluate(
    () =>
      document.querySelector("#shop").getBoundingClientRect().top /
      window.innerHeight,
  );
  check("home: shop within two phone screens", shopTop < 2, shopTop.toFixed(2));
  check(
    "home: nothing in the hero that Lemon contradicts",
    !/One ingredient\. Nothing added/.test(text),
  );
  const first = await page.evaluate(() => {
    const box = (el) => el?.getBoundingClientRect();
    const shots = box(document.querySelector(".hero-shots"));
    const shown = document.querySelector('.hero-shot[data-on="true"] img');
    const button = box(document.querySelector(".hero-actions .btn"));
    const tabs = box(document.querySelector(".hero-tabs"));
    // What stands on the ledge fills the lower 66% of every hero photograph.
    const subjectTop = shots.top + shots.height * 0.34;
    const walker = document.createTreeWalker(
      document.querySelector(".hero-copy"),
      NodeFilter.SHOW_TEXT,
    );
    const onSubject = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const el = node.parentElement;
      if (!node.textContent.trim() || el.closest("[inert]")) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width && rect.bottom > subjectTop + 2)
          onSubject.push(node.textContent.trim().slice(0, 30));
      }
    }
    return {
      photoLoaded: shown?.complete && shown.naturalWidth > 0,
      photoWidth: shown?.naturalWidth,
      buttonAbovePacks: button.bottom <= subjectTop + 2,
      buttonInView: button.bottom <= window.innerHeight,
      tabsInView: tabs.bottom <= window.innerHeight + 1,
      tabs: document.querySelectorAll(".hero-tab").length,
      headings: document.querySelectorAll(".hero-title").length,
      onSubject,
    };
  });
  check(
    "hero: the first photograph is loaded",
    first.photoLoaded,
    first.photoWidth,
  );
  check("hero: the button sits above the packs", first.buttonAbovePacks);
  check(
    "hero: the button is inside the first phone screen",
    first.buttonInView,
  );
  check("hero: the tabs are inside the first phone screen", first.tabsInView);
  check(
    "hero: four scenes, each with its headline and its tab",
    first.tabs === 4 && first.headings === 4,
    `${first.tabs} tabs, ${first.headings} headlines`,
  );
  check(
    "hero: no words on what stands on the ledge",
    first.onSubject.length === 0,
    first.onSubject[0],
  );
  const chip = await page.locator(".hero-copy button").first().innerText();
  check(
    "hero: the button carries the offer",
    chip.includes(`${OFFER.top.percent}%`),
    chip,
  );
  const priced = await page.locator('.hero-price[data-on="true"]').innerText();
  check(
    "hero: the first screen names a price",
    priced.includes("from") && priced.includes("24.00"),
    priced,
  );
  check(
    "hero: no faces in the first screen's pictures",
    (await page.locator(".hero-shot img").first().getAttribute("alt")).includes(
      "pouches",
    ),
  );
  await context.close();
}

// 2a. In every window shape the words leave the packs alone and nothing scrolls sideways.
for (const [width, height] of [
  [821, 617],
  [821, 900],
  [1024, 768],
  [1149, 863],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
]) {
  const { context, page } = await open("/", {
    viewport: { width, height },
  });
  const state = await page.evaluate(() => {
    const shots = document.querySelector(".hero-shots").getBoundingClientRect();
    // The packs stand right of centre in the photograph, in its lower 66%.
    const packs = {
      left: shots.left + shots.width * 0.51,
      right: shots.left + shots.width * 0.94,
      top: shots.top + shots.height * 0.34,
      bottom: shots.bottom,
    };
    const boxes = [];
    const walker = document.createTreeWalker(
      document.querySelector(".hero-copy"),
      NodeFilter.SHOW_TEXT,
    );
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim() || node.parentElement.closest("[inert]"))
        continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      boxes.push(...range.getClientRects());
    }
    boxes.push(
      document.querySelector(".hero-actions .btn").getBoundingClientRect(),
    );
    const hit = boxes.some(
      (b) =>
        b.width &&
        b.right > packs.left + 2 &&
        b.left < packs.right - 2 &&
        b.bottom > packs.top + 2 &&
        b.top < packs.bottom - 2,
    );
    const hero = document.querySelector(".hero").getBoundingClientRect();
    return {
      hit,
      packsTall: Math.round(shots.height * 0.45),
      fits: hero.bottom <= window.innerHeight + 1,
      over: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  const at = `${width}x${height}`;
  check(`hero at ${at}: no words or button on the packs`, !state.hit);
  check(
    `hero at ${at}: the pouches are large enough`,
    state.packsTall >= 150,
    `${state.packsTall}px tall`,
  );
  check(`hero at ${at}: it fits the first screen`, state.fits);
  check(
    `home at ${at}: no sideways scroll`,
    state.over <= 0,
    `${state.over}px`,
  );
  await context.close();
}

// 2a, on phones and tablets held upright: tall screens, and the short ones a
// phone's browser leaves once its own bars are up. The photograph runs out to
// both edges of the screen, and the words leave what stands on the ledge alone.
for (const [width, height] of [
  [320, 568],
  [360, 640],
  [375, 667],
  [390, 844],
  [393, 656],
  [412, 915],
  [430, 740],
  [768, 1024],
  [820, 1180],
]) {
  const { context, page } = await open("/", {
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const state = await page.evaluate(() => {
    const shots = document.querySelector(".hero-shots").getBoundingClientRect();
    const words = [];
    const walker = document.createTreeWalker(
      document.querySelector(".hero-copy"),
      NodeFilter.SHOW_TEXT,
    );
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (
        !node.textContent.trim() ||
        node.parentElement.closest('[inert], [aria-hidden="true"]')
      )
        continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      words.push(...range.getClientRects());
    }
    words.push(
      document.querySelector(".hero-actions .btn").getBoundingClientRect(),
    );
    // What stands on the ledge: right of centre in the photograph, in its lower 66%.
    const top = shots.top + shots.height * 0.34;
    const lowest = Math.max(...words.map((box) => box.bottom));
    return {
      left: Math.round(shots.left),
      short: Math.round(window.innerWidth - shots.right),
      under: Math.round(lowest - top),
      over: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  const at = `${width}x${height}`;
  check(
    `hero at ${at}: the photograph runs out to both edges of the screen`,
    state.left <= 0 && state.short <= 0,
    `starts ${state.left}px in, stops ${state.short}px short`,
  );
  check(
    `hero at ${at}: the words end above what stands on the ledge`,
    state.under <= 2,
    `${state.under}px over`,
  );
  check(
    `home at ${at}: no sideways scroll`,
    state.over <= 0,
    `${state.over}px`,
  );
  await context.close();
}

// 2c. The offer is said the same way in the bar, the shop and the offer block.
{
  const { context, page } = await open("/");
  const bar = await page.locator("body > div.sticky p").first().innerText();
  check(
    "offer bar: names the offer and stays with the header",
    bar.includes(`${OFFER.top.percent}%`),
    bar,
  );
  if (campaignOn) {
    check("offer bar: counts down", /\d+h \d+m \d+s/.test(bar), bar);
    check(
      "offer block: shows the countdown",
      (await page.locator('#offer [role="timer"]').count()) === 1,
    );
  }
  const struck = await page.locator("#shop article s").count();
  check(
    "shop: every card shows the regular price struck through",
    struck === 3,
    struck,
  );
  const buttons = await page.locator("#shop article .btn").allInnerTexts();
  check(
    "shop: a card names its price once, not again on the button",
    buttons.length === 3 && buttons.every((label) => !label.includes("$")),
    buttons.join(" / "),
  );
  const notes = await page
    .locator("#shop article")
    .getByRole("button", { name: /Founding Member price/ })
    .count();
  check(
    "shop: every card says how the lower price is reached",
    notes === 3,
    notes,
  );
  const ticks = await page.locator("#shop").innerText();
  check(
    "shop: the three promises are said once, under the cards",
    ticks.split("Free US shipping").length === 2 &&
      ticks.includes("30-day guarantee"),
  );
  const fits = await page.evaluate(() => {
    const most = Math.max(
      ...[...document.querySelectorAll("#shop article")].map(
        (card) => card.getBoundingClientRect().height,
      ),
    );
    const room =
      window.innerHeight -
      document.querySelector("body > div.sticky").getBoundingClientRect()
        .height;
    return { most: Math.round(most), room: Math.round(room) };
  });
  check(
    "shop: a card shows its pack and its button on one screen",
    fits.most <= fits.room,
    `${fits.most}px tall, ${fits.room}px of room`,
  );
  await context.close();
}

// 2b. The first screen is alive: the sea in the photograph drifts, the scenes
// turn by themselves, and both rest for a visitor who asks for less motion.
{
  const { context, page, errors } = await open("/", DESKTOP);
  const current = () =>
    page.evaluate(() =>
      [...document.querySelectorAll(".hero-tab")].findIndex(
        (tab) => tab.getAttribute("aria-current") === "true",
      ),
    );
  const sea = page.locator(".hero-sea");
  await page
    .waitForFunction(
      () => document.querySelector(".hero-sea")?.dataset.on === "true",
      null,
      { timeout: 8000 },
    )
    .catch(() => {});
  check(
    "hero: the sea starts once the page has loaded",
    (await sea.getAttribute("data-on")) === "true",
  );
  const lies = await page.evaluate(() => {
    const shots = document.querySelector(".hero-shots").getBoundingClientRect();
    const band = document.querySelector(".hero-sea").getBoundingClientRect();
    return (
      Math.abs(band.left - shots.left) < 1 &&
      Math.abs(band.width - shots.width) < 1 &&
      band.top > shots.top + shots.height * 0.5 &&
      band.bottom < shots.bottom
    );
  });
  check("hero: the moving sea lies inside its photograph", lies);
  await page.locator(".hero-pause").click();
  const one = await sea.screenshot();
  await page.waitForTimeout(1500);
  const two = await sea.screenshot();
  check("hero: the sea keeps moving", Buffer.compare(one, two) !== 0);
  check(
    "hero: paused, the scene stays where it is",
    (await current()) === 0 &&
      (await page.locator(".hero-pause").getAttribute("aria-label")) ===
        "Play the scenes",
  );
  await page.locator(".hero-pause").click();
  await page.mouse.move(700, 400);
  await page.waitForTimeout(8200);
  check(
    "hero: the scenes turn by themselves",
    (await current()) === 1,
    await current(),
  );
  check(
    "hero: the second scene shows its own headline",
    (await page
      .locator('.hero-words[data-on="true"] .hero-title')
      .innerText()) === "A pinch in your glass.",
  );
  check(
    "hero: only the scene on show can be read or focused",
    (await page.locator(".hero-words:not([inert])").count()) === 1,
  );
  await page.locator(".hero-tab").nth(3).click();
  check("hero: a tab opens its scene", (await current()) === 3);
  await page.keyboard.press("ArrowRight");
  check("hero: the arrow keys turn the scenes", (await current()) === 0);
  check(
    "hero: one main heading, whatever the scene",
    (await page.locator("h1").count()) === 1,
  );
  check("hero: no errors while it plays", errors.length === 0, errors[0]);
  await context.close();
}
// 2c. One place, four scenes: the ledge, the sea and the sky are the same in
// every photograph, the scene leaving goes before the next one is there, and
// the water goes on while they change.
{
  const { context, page, errors } = await open("/", DESKTOP);
  await page
    .waitForFunction(
      () =>
        document.querySelector(".hero-sea")?.dataset.on === "true" &&
        document.querySelector(".hero")?.dataset.plate === "true",
      null,
      { timeout: 8000 },
    )
    .catch(() => {});
  await page.locator(".hero-pause").click();
  check(
    "hero: the empty ledge lies under the scenes",
    (await page.locator(".hero").getAttribute("data-plate")) === "true",
  );
  // The left of every photograph, where nothing ever stands, read off the pictures themselves.
  const apart = await page.evaluate(async () => {
    const shots = [...document.querySelectorAll(".hero-shot img")];
    await Promise.all(shots.map((img) => img.decode().catch(() => {})));
    const read = (img) => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 200;
      const pen = canvas.getContext("2d");
      pen.drawImage(img, 0, 0, 400, 200);
      return pen.getImageData(0, 0, 170, 200).data;
    };
    const first = read(shots[0]);
    return shots.slice(1).map((img) => {
      const next = read(img);
      let sum = 0;
      for (let i = 0; i < next.length; i += 4) {
        sum +=
          Math.abs(next[i] - first[i]) +
          Math.abs(next[i + 1] - first[i + 1]) +
          Math.abs(next[i + 2] - first[i + 2]);
      }
      return sum / ((next.length / 4) * 3);
    });
  });
  check(
    "hero: every scene shows the same ledge, sea and sky",
    apart.length === 3 && apart.every((gap) => gap < 2),
    apart.map((gap) => gap.toFixed(2)).join(" "),
  );
  // A patch of open sea that nothing stands in front of in any scene.
  const patch = await page.evaluate(() => {
    const shots = document.querySelector(".hero-shots").getBoundingClientRect();
    const band = document.querySelector(".hero-sea").getBoundingClientRect();
    return {
      x: Math.round(shots.left + shots.width * 0.41),
      y: Math.round(band.top + band.height * 0.2),
      width: Math.round(shots.width * 0.08),
      height: Math.round(band.height * 0.4),
    };
  });
  const shown = () =>
    page.evaluate(() => {
      const sea = document.querySelector(".hero-sea");
      const leaving = document.querySelector('.hero-shot[data-under="true"]');
      return {
        sea: sea.dataset.on === "true" && getComputedStyle(sea).opacity === "1",
        leaving: leaving ? Number(getComputedStyle(leaving).opacity) : null,
      };
    });
  // The water comes up once, as the page opens; after that it never leaves.
  await page
    .waitForFunction(
      () =>
        getComputedStyle(document.querySelector(".hero-sea")).opacity === "1",
      null,
      { timeout: 5000 },
    )
    .catch(() => {});
  await page.locator(".hero-tab").nth(2).click();
  await page.mouse.move(700, 300);
  const moments = [];
  for (const wait of [180, 200, 200]) {
    await page.waitForTimeout(wait);
    moments.push({
      ...(await shown()),
      sea_now: await page.screenshot({ clip: patch }),
    });
  }
  check(
    "hero: the sea stays on show while one scene gives way to the next",
    moments.every((moment) => moment.sea),
  );
  check(
    "hero: the sea goes on moving through the change",
    Buffer.compare(moments[0].sea_now, moments[1].sea_now) !== 0 &&
      Buffer.compare(moments[1].sea_now, moments[2].sea_now) !== 0,
  );
  check(
    "hero: the scene leaving fades from the ledge",
    moments[0].leaving !== null && moments[2].leaving < 0.5,
    moments.map((moment) => moment.leaving).join(" "),
  );
  await page.waitForTimeout(1200);
  const settled = await page.evaluate(() =>
    [...document.querySelectorAll(".hero-shot")].map((shot) =>
      Number(getComputedStyle(shot).opacity),
    ),
  );
  check(
    "hero: after the change only the new scene is on show",
    settled.join(" ") === "0 0 1 0",
    settled.join(" "),
  );
  check(
    "hero: no errors while the scene changes",
    errors.length === 0,
    errors[0],
  );
  await context.close();
}
{
  const { context, page } = await open("/", PHONE);
  const current = () =>
    page.evaluate(() =>
      [...document.querySelectorAll(".hero-tab")].findIndex(
        (tab) => tab.getAttribute("aria-current") === "true",
      ),
    );
  const swipe = (from, to) =>
    page.evaluate(
      ([a, b]) => {
        const hero = document.querySelector(".hero");
        const fire = (type, x) =>
          hero.dispatchEvent(
            new PointerEvent(type, {
              bubbles: true,
              pointerType: "touch",
              clientX: x,
              clientY: 520,
            }),
          );
        fire("pointerdown", a);
        fire("pointerup", b);
      },
      [from, to],
    );
  await swipe(300, 120);
  check("hero: a swipe shows the next scene", (await current()) === 1);
  await swipe(120, 300);
  check("hero: a swipe the other way goes back", (await current()) === 0);
  await context.close();
}
{
  visitor += 1;
  const context = await browser.newContext({
    ...PHONE,
    extraHTTPHeaders: { "x-forwarded-for": `203.0.113.${visitor}` },
  });
  // A browser that cannot draw the moving water at all.
  await context.addInitScript(() => {
    localStorage.setItem("alas-gift-offered", "1");
    const real = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
      return /webgl/.test(kind) ? null : real.call(this, kind, ...rest);
    };
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const state = await page.evaluate(() => {
    const photo = document.querySelector('.hero-shot[data-on="true"] img');
    return {
      still: getComputedStyle(document.querySelector(".hero-sea")).opacity,
      photo: photo.complete && photo.naturalWidth > 0,
    };
  });
  check(
    "hero: without the moving water the photograph stands, with no error",
    state.still === "0" && state.photo && errors.length === 0,
    errors[0],
  );
  await context.close();
}
{
  visitor += 1;
  const context = await browser.newContext({
    ...DESKTOP,
    reducedMotion: "reduce",
    extraHTTPHeaders: { "x-forwarded-for": `203.0.113.${visitor}` },
  });
  await context.addInitScript(() =>
    localStorage.setItem("alas-gift-offered", "1"),
  );
  const page = await context.newPage();
  const water = [];
  page.on("request", (request) => {
    if (/\/hero\/(sea|shallows)-/.test(request.url()))
      water.push(request.url());
  });
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(8200);
  check(
    "hero: less motion asked for means the scenes stay put",
    await page.evaluate(
      () =>
        document.querySelector(".hero-tab").getAttribute("aria-current") ===
          "true" && !document.querySelector(".hero-pause"),
    ),
  );
  await page.evaluate(() => document.querySelector("#shop").scrollIntoView());
  await page.waitForTimeout(1200);
  check(
    "less motion asked for means no moving water is fetched",
    water.length === 0,
    water[0],
  );
  await page.locator(".hero-tab").nth(2).click({ force: true });
  check(
    "hero: the tabs still work with less motion",
    await page.evaluate(
      () =>
        document
          .querySelectorAll(".hero-tab")[2]
          .getAttribute("aria-current") === "true",
    ),
  );
  await context.close();
}
{
  const { context, page, errors } = await open("/", DESKTOP);
  await page.evaluate(() => document.querySelector("#shop").scrollIntoView());
  await page
    .waitForFunction(
      () => document.querySelector("#shop canvas")?.dataset.on === "true",
      null,
      { timeout: 8000 },
    )
    .catch(() => {});
  check(
    "shop: the water behind it moves once it comes into view",
    (await page.locator("#shop canvas").getAttribute("data-on")) === "true",
  );
  check("shop: no errors from the water", errors.length === 0, errors[0]);
  await context.close();
}

// 2d. The scenes wait while a pointer rests on the tabs and behind an open cart.
{
  const { context, page } = await open("/", DESKTOP);
  const current = () =>
    page.evaluate(() =>
      [...document.querySelectorAll(".hero-tab")].findIndex(
        (tab) => tab.getAttribute("aria-current") === "true",
      ),
    );
  await page.locator(".hero-tab").nth(1).hover();
  await page.waitForTimeout(8600);
  check(
    "hero: it waits while the pointer rests on the tabs",
    (await current()) === 0,
    await current(),
  );
  await page.mouse.move(700, 300);
  await page.getByRole("button", { name: /^Cart/ }).click();
  await page.locator("dialog[open]").waitFor({ state: "visible" });
  const before = await current();
  await page.waitForTimeout(8600);
  check(
    "hero: it waits behind an open cart",
    (await current()) === before,
    `${before} -> ${await current()}`,
  );
  await context.close();
}
// 2e. The header wears the first screen's navy while that screen is under it.
{
  const { context, page } = await open("/", DESKTOP);
  const dark = () =>
    page.evaluate(() => document.querySelector("header").dataset.dark);
  check("header: navy over the first screen", (await dark()) === "true");
  await page.evaluate(() => document.querySelector("#shop").scrollIntoView());
  await page.waitForTimeout(500);
  check(
    "header: white once the first screen has gone",
    (await dark()) === "false",
  );
  await page.goto(`${base}/products/classic-pouch`, {
    waitUntil: "networkidle",
  });
  check("header: white on the other pages", (await dark()) === "false");
  await context.close();
}

// 3. Two taps to checkout from the hero; one from a ?shop= link.
{
  const { context, page } = await open("/", PHONE);
  await page
    .getByRole("button", { name: /Pre-order, up to/ })
    .first()
    .click();
  const buy = page.locator('[data-quick-item="classic-pouch"] a');
  await buy.waitFor({ state: "visible" });
  const href = await buy.getAttribute("href");
  check(
    "quick shop: Pre-order now goes straight to Shopify checkout",
    href?.includes("alassaltco.myshopify.com/cart/42949692293225:1"),
    href,
  );
  await context.close();
}
{
  const { context, page } = await open("/?shop=sticks-30", PHONE);
  const first = page.locator("[data-quick-item]").first();
  await first.waitFor({ state: "visible" });
  check(
    "?shop= link opens the quick shop on that product",
    (await first.getAttribute("data-quick-item")) === "sticks-30",
  );
  await context.close();
}

// 4. A shop card: switch flavour, add to cart, check out.
{
  const { context, page } = await open("/");
  const card = page.locator("#shop article").first();
  await card.getByRole("button", { name: "Add to cart" }).click();
  const drawer = page.locator("dialog[open]");
  await drawer.waitFor({ state: "visible" });
  check(
    "card: Classic pouch lands in the cart",
    (await drawer.innerText()).includes("Classic Pouch"),
  );
  const checkout = await drawer
    .getByRole("link", { name: /Checkout/ })
    .getAttribute("href");
  check(
    "cart: checkout link carries the pouch",
    checkout?.includes("/cart/42949692293225:1"),
    checkout,
  );
  await page.keyboard.press("Escape");
  await card.getByRole("button", { name: /2\s*pouches/ }).click();
  check(
    "card: two pouches show twice the price",
    (await card.locator("s").innerText()).includes("64"),
    await card.locator("s").innerText(),
  );
  // The picture shows as many pouches as are picked.
  const pictured = (of = card) => of.locator("img").first().getAttribute("src");
  check(
    "card: two pouches are pictured",
    (await pictured())?.includes("pouch-classic-2-studio"),
    await pictured(),
  );
  await card.getByRole("button", { name: /3\s*pouches/ }).click();
  check(
    "card: three pouches are pictured",
    (await pictured())?.includes("pouch-classic-3-studio"),
    await pictured(),
  );
  await card.getByRole("button", { name: /1\s*pouch\b/ }).click();
  check(
    "card: one pouch is pictured again",
    (await pictured())?.includes("pouch-classic-studio"),
    await pictured(),
  );
  await card.getByRole("button", { name: "Lemon" }).click();
  check(
    "card: Lemon shows its own pack",
    (await card.locator("img").first().getAttribute("alt"))?.includes("Lemon"),
  );
  // Lemon is sold exactly as Classic is: the same prices, the same button, the same cart.
  check(
    "card: Lemon costs what Classic costs",
    (await card.locator("s").innerText()).includes("32"),
    await card.locator("s").innerText(),
  );
  check(
    "card: Lemon is pre-ordered with the same button as Classic",
    (await card.getByRole("button", { name: "Add to cart" }).count()) === 1 &&
      !/Reserve/.test(await card.innerText()),
  );
  await card.getByRole("button", { name: /2\s*pouches/ }).click();
  check(
    "card: two Lemon pouches are pictured",
    (await pictured())?.includes("pouch-lemon-2-studio"),
    await pictured(),
  );
  await card.getByRole("button", { name: "Add to cart" }).click();
  await drawer.waitFor({ state: "visible" });
  const lines = await drawer
    .locator("[data-cart-line]")
    .evaluateAll((items) => items.map((item) => item.dataset.cartLine));
  check(
    "cart: Lemon lies in the cart beside Classic",
    lines.join(" ") === "classic-pouch lemon-pouch",
    lines.join(" "),
  );
  const byEmail = drawer.locator("[data-by-email]");
  const said = (await byEmail.innerText()).replace(/\s+/g, " ");
  check(
    "cart: what checkout cannot charge yet is pre-ordered by email, with no payment",
    said.includes("Lemon Pouch \u00d7 2") &&
      /nothing is charged now/i.test(said),
    said,
  );
  const paid = await drawer
    .getByRole("link", { name: /Checkout/ })
    .getAttribute("href");
  check(
    "cart: checkout carries only what the store holds",
    /\/cart\/42949692293225:1(\?|$)/.test(paid ?? ""),
    paid,
  );
  await byEmail.locator("input[type=email]").fill("ana@example.com");
  await byEmail.getByRole("button", { name: "Pre-order", exact: true }).click();
  await drawer.locator("[data-placed]").waitFor({ state: "visible" });
  const left = await drawer
    .locator("[data-cart-line]")
    .evaluateAll((items) => items.map((item) => item.dataset.cartLine));
  check(
    "cart: the Lemon pre-order is confirmed and leaves the cart",
    left.join(" ") === "classic-pouch" &&
      (await drawer.locator("[data-placed]").innerText()).includes(
        "ana@example.com",
      ),
    left.join(" "),
  );
  await page.keyboard.press("Escape");

  // The sticks card shows as many sticks as its pack holds.
  const sticks = page.locator("#shop article").nth(1);
  for (const [count, name] of [
    [5, "sticks-classic-studio"],
    [30, "sticks-classic-30-studio"],
    [15, "sticks-classic-15-studio"],
  ]) {
    await sticks
      .getByRole("button", { name: new RegExp(`^${count}\\s*sticks`) })
      .click();
    check(
      `card: ${count} sticks are pictured`,
      (await pictured(sticks))?.includes(`/packs/${name}.`),
      await pictured(sticks),
    );
  }
  check(
    "card: no picture is said to show fewer than were picked",
    !/\d+ of \d+ shown/.test(await page.locator("#shop").innerText()),
  );
  await context.close();
}

// 4a. A product page shows as many pouches as the quantity, and Lemon is
// bought there with the same two buttons as Classic.
{
  const { context, page } = await open("/products/classic-pouch");
  const pack = page.locator("main .stage img").first();
  const more = page.getByRole("button", { name: "One more", exact: true });
  check(
    "product: one pouch is pictured",
    (await pack.getAttribute("src"))?.includes("pouch-classic-studio"),
  );
  await more.click();
  check(
    "product: two pouches are pictured",
    (await pack.getAttribute("src"))?.includes("pouch-classic-2-studio"),
    await pack.getAttribute("src"),
  );
  await more.click();
  await more.click();
  check(
    "product: past three, three are pictured and the page says so",
    (await pack.getAttribute("src"))?.includes("pouch-classic-3-studio") &&
      (await page.locator("main .stage").first().innerText()).includes(
        "3 of 4 shown",
      ),
    await page.locator("main .stage").first().innerText(),
  );
  await page.goto(`${base}/products/lemon-sticks-30`, { waitUntil: "load" });
  check(
    "product: thirty Lemon sticks are pictured",
    (await pack.getAttribute("src"))?.includes("sticks-lemon-30-studio"),
    await pack.getAttribute("src"),
  );
  const buttons = await page
    .locator("main .btn")
    .evaluateAll((items) => items.map((item) => item.textContent.trim()));
  check(
    "product: Lemon is bought with the same buttons as Classic",
    buttons.includes("Add to cart") &&
      buttons.includes("Pre-order now") &&
      !buttons.some((label) => /Reserve/.test(label)),
    buttons.join(" / "),
  );
  await context.close();
}

// 4b. On a short phone the cart's foot is tall: the email step lies in the
// list, a line by the total leads to it, and the confirmation comes into view.
{
  const { context, page } = await open("/", {
    ...PHONE,
    viewport: { width: 393, height: 656 },
  });
  const card = page.locator("#shop article").first();
  await card.scrollIntoViewIfNeeded();
  await card.getByRole("button", { name: "Add to cart" }).click();
  const drawer = page.locator("dialog[open]");
  await drawer.waitFor({ state: "visible" });
  await page.keyboard.press("Escape");
  await card.getByRole("button", { name: "Lemon" }).click();
  await card.getByRole("button", { name: "Add to cart" }).click();
  await drawer.waitFor({ state: "visible" });
  const shown = (selector) =>
    drawer.locator(selector).evaluate((item) => {
      const list = item.closest(".overflow-y-auto");
      const a = item.getBoundingClientRect();
      const b = list.getBoundingClientRect();
      return a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
    });
  const total = drawer.locator("footer");
  check(
    "phone cart: the foot says what its total leaves out",
    /Not in this total: Lemon Pouch/.test(
      (await total.innerText()).replace(/\s+/g, " "),
    ),
  );
  check(
    "phone cart: checkout is on screen without scrolling",
    await total.getByRole("link", { name: /Checkout/ }).isVisible(),
  );
  await drawer.locator("[data-by-email-note] button").click();
  await page.waitForTimeout(900);
  const field = drawer.locator("[data-by-email] input[type=email]");
  check(
    "phone cart: the line by the total leads to the email step",
    await field.evaluate((input) => {
      const list = input.closest(".overflow-y-auto").getBoundingClientRect();
      const box = input.getBoundingClientRect();
      return box.top >= list.top && box.bottom <= list.bottom;
    }),
  );
  await field.fill("ana@example.com");
  await drawer
    .locator("[data-by-email]")
    .getByRole("button", { name: "Pre-order", exact: true })
    .click();
  await drawer.locator("[data-placed]").waitFor({ state: "visible" });
  await page.waitForTimeout(400);
  check(
    "phone cart: the confirmation comes into view",
    await shown("[data-placed]"),
  );
  await context.close();
}

// 5. The Founding Member offer: a ladder. The base for joining, a step for each
// answer, a last step for a phone number, and a code that reaches checkout.
{
  const { context, page } = await open("/");
  await page.getByRole("button", { name: "Claim it" }).first().click();
  const dialog = page.locator("dialog[data-founding-stage]");
  await dialog.waitFor({ state: "visible" });
  const stage = () => dialog.getAttribute("data-founding-stage");
  const percent = async () =>
    Number(await dialog.getAttribute("data-founding-percent"));
  check("offer: opens on the first question", (await stage()) === "ask");
  check(
    "offer: starts at the base before anything is answered",
    (await percent()) === OFFER.start.percent &&
      (await dialog.innerText()).includes(
        `Start with ${OFFER.start.percent}% off`,
      ),
    await percent(),
  );
  check(
    "offer: no canvas, no game",
    (await dialog.locator("canvas").count()) === 0,
  );
  const audit = await dialog.evaluate((el) => {
    const small = [];
    const upper = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode.textContent.trim();
      const parent = walker.currentNode.parentElement;
      if (!text || !parent) continue;
      const box = parent.getBoundingClientRect();
      const style = getComputedStyle(parent);
      if (!box.width || style.clip === "rect(0px, 0px, 0px, 0px)") continue;
      if (parseFloat(style.fontSize) < 13) small.push(text.slice(0, 24));
      if (style.textTransform === "uppercase") upper.push(text.slice(0, 24));
    }
    return { small, upper };
  });
  check(
    "offer: nothing in it is under 13px or in capitals",
    !audit.small.length && !audit.upper.length,
    [...audit.small, ...audit.upper].join(" | "),
  );
  const headingTop = () =>
    dialog
      .locator("#founding-title")
      .evaluate((el) => Math.round(el.getBoundingClientRect().top));
  // The dialog rises into place as it opens; measure once it has settled.
  await dialog.evaluate((el) =>
    Promise.all(el.getAnimations().map((a) => a.finished)),
  );
  const before = await headingTop();
  await dialog.getByRole("button", { name: "Training and sport" }).click();
  check(
    "offer: an answer adds a step and brings the next question",
    (await percent()) === OFFER.start.percent + PER_ANSWER &&
      (await dialog.innerText()).includes("Which flavour"),
    await percent(),
  );
  check(
    "offer: the heading stays put from one question to the next",
    Math.abs((await headingTop()) - before) <= 1,
    `${before} → ${await headingTop()}`,
  );
  await dialog.getByRole("button", { name: "Lemon", exact: true }).click();
  await dialog.getByRole("button", { name: "Offers and launches" }).click();
  check(
    "offer: every answer given, it asks for the email",
    (await stage()) === "claim" && (await percent()) === OFFER.answered.percent,
    `${await stage()} ${await percent()}`,
  );
  const submit = dialog.locator("button[type=submit]");
  check(
    "offer: the button says what the email claims",
    (await submit.innerText()).includes(`${OFFER.answered.percent}%`),
    await submit.innerText(),
  );
  await dialog.locator("input[type=email]").fill("ana@example.com");
  await submit.click();
  await dialog
    .getByText(OFFER.answered.code, { exact: true })
    .waitFor({ state: "visible" });
  check(`offer: three answers and an email earn ${OFFER.answered.code}`, true);
  await page.waitForLoadState("networkidle");
  const picture = await dialog
    .locator("img")
    .first()
    .evaluate((img) => {
      const sent = /[?&]w=(\d+)/.exec(img.currentSrc);
      const box = img.getBoundingClientRect();
      const shape = img.naturalWidth / img.naturalHeight;
      const needed = Math.max(box.width, box.height * shape) * devicePixelRatio;
      return { sent: Number(sent?.[1] ?? 0), needed: Math.round(needed) };
    });
  check(
    "offer: its picture is not stretched soft",
    picture.sent >= picture.needed * 0.7,
    JSON.stringify(picture),
  );
  if (PHONE_STEP) {
    await dialog.getByRole("button", { name: /Add a phone number/ }).click();
    await dialog.locator("input[type=tel]").fill("512 555 0147");
    await dialog.locator("button[type=submit]").click();
    await dialog
      .getByText(OFFER.top.code, { exact: true })
      .waitFor({ state: "visible" });
    check(`offer: a phone number makes it ${OFFER.top.code}`, true);
  }
  await page.keyboard.press("Escape");
  await page
    .locator("#shop article")
    .first()
    .getByRole("button", { name: "Add to cart" })
    .click();
  const cartText = (await page.locator("dialog[open]").innerText())
    .split(/\s+/)
    .join(" ");
  const paid = (Math.round(32 * (100 - OFFER.top.percent)) / 100).toFixed(2);
  check(
    "cart: a member's total shows the discount, not only a note about it",
    cartText.includes(`Your ${OFFER.top.percent}% off`) &&
      cartText.includes("Total at checkout") &&
      cartText.includes(paid),
    cartText.slice(-260),
  );
  const link = await page
    .locator("dialog[open]")
    .getByRole("link", { name: /Checkout/ })
    .getAttribute("href");
  check(
    "offer: checkout carries the code and the email",
    link?.includes(`discount=${OFFER.top.code}`) &&
      link.includes("checkout%5Bemail%5D=ana%40example.com"),
    link,
  );
  await context.close();
}
// The short way, on a phone: skip the questions, then build it up afterwards.
{
  const { context, page } = await open("/", PHONE);
  await page.getByRole("button", { name: "Claim it" }).first().click();
  const dialog = page.locator("dialog[data-founding-stage]");
  await dialog.waitFor({ state: "visible" });
  await dialog.getByRole("button", { name: /Skip and claim/ }).click();
  check(
    "offer: skipping the questions still claims the base",
    (await dialog.getAttribute("data-founding-stage")) === "claim" &&
      (await dialog.locator("button[type=submit]").innerText()).includes(
        `${OFFER.start.percent}%`,
      ),
  );
  await dialog.locator("input[type=email]").fill("ben@example.com");
  await dialog.locator("button[type=submit]").click();
  await dialog
    .getByText(OFFER.start.code, { exact: true })
    .waitFor({ state: "visible" });
  check(`offer: an email alone earns ${OFFER.start.code}`, true);
  await dialog.getByRole("button", { name: "A daily ritual" }).click();
  const raised = step(1);
  await dialog
    .getByText(raised.code, { exact: true })
    .waitFor({ state: "visible" });
  check(`offer: an answer after joining raises it to ${raised.code}`, true);
  const fit = await dialog.evaluate((el) => {
    const box = el.getBoundingClientRect();
    return {
      inside: box.left >= 0 && box.right <= window.innerWidth,
      sideways: el.firstElementChild.scrollWidth > el.clientWidth + 1,
    };
  });
  check(
    "offer: fits a phone screen without scrolling sideways",
    fit.inside && !fit.sideways,
    JSON.stringify(fit),
  );
  // A member is shown the price at the step they have reached.
  await page.keyboard.press("Escape");
  const price = page
    .locator("#shop article")
    .first()
    .locator("p.t-price", { has: page.locator("s") });
  const shown = (await price.innerText()).replace(/\s+/g, " ");
  const regular = Number(
    (await price.locator("s").innerText()).replace(/[^\d.]/g, ""),
  );
  const mine = (Math.round(regular * (100 - raised.percent)) / 100).toFixed(2);
  check(
    "shop: a member sees their own price, not the best there is",
    shown.includes(mine) && !/from/i.test(shown),
    shown,
  );
  await context.close();
}
// Joining from the footer leads straight on to the ladder.
{
  const { context, page } = await open("/");
  const footer = page.locator("footer");
  await footer.scrollIntoViewIfNeeded();
  await footer.locator("input[type=email]").fill("cy@example.com");
  await footer.getByRole("button", { name: "Join" }).click();
  const dialog = page.locator('dialog[data-founding-stage="done"]');
  await dialog.waitFor({ state: "visible" });
  check(
    "footer: joining opens the offer on the base code with the questions",
    (await dialog.innerText()).includes(OFFER.start.code) &&
      (await dialog.innerText()).includes("What brings you"),
  );
  await context.close();
}

// 6. A product page: its choices and its buy bar on a phone.
{
  const { context, page } = await open("/products/sticks-15", PHONE);
  check(
    "product: names itself",
    (await page.locator("h1").innerText()) === "Classic Sticks",
  );
  await page.getByRole("link", { name: "Lemon" }).first().click();
  await page.waitForURL("**/products/lemon-sticks-15");
  check("product: flavour switch keeps the pack size", true);
  await page.getByRole("link", { name: /30 sticks/ }).click();
  await page.waitForURL("**/products/lemon-sticks-30");
  check("product: size switch keeps the flavour", true);
  await page.goto(`${base}/products/classic-pouch`, {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => window.scrollTo(0, 2200));
  await page.waitForTimeout(500);
  const bar = page.locator("div.fixed.bottom-0").last();
  check(
    "product: buy bar shows once the button scrolls away",
    (await bar.getAttribute("aria-hidden")) === "false",
  );
  const text = await page.locator("main").innerText();
  check(
    "product: Lemon's sample nutrition never shows",
    !/MOCK|SAMPLE ONLY/i.test(text),
  );
  check(
    "product: the pre-production line sits under the pictures",
    text.includes("Pre-production packaging shown. Final packs may vary."),
  );
  check(
    "product: the sale price sits beside the regular one",
    (await page.locator("main s").count()) >= 1,
  );
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: /Show image 2/ }).click();
  check(
    "product: the gallery holds photographs with a line on each",
    (await page.locator("figure.photo figcaption").first().innerText()).length >
      8,
  );
  await context.close();
}

await browser.close();
for (const r of results) {
  console.log(
    `${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok || !r.detail ? "" : `  (${r.detail})`}`,
  );
}
const failed = results.filter((r) => !r.ok).length;
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
