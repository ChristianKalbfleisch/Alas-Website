// Browser checks for the site: what a visitor sees and the paths to checkout.
//   node scripts/site-checks.mjs [base]     (default http://localhost:3100)
// Uses the installed Chrome. Exits non-zero when a check fails.
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:3100";

// The two offers, read from the site's own settings: the campaign, which is in
// force until its last moment, and the standing offer that follows it.
const settings = readFileSync(
  new URL("../src/data/campaign.ts", import.meta.url),
  "utf8",
);
const block = (name) =>
  settings.slice(settings.indexOf(`export const ${name}`)).split("};")[0];
const QUESTIONS = readFileSync(
  new URL("../src/data/gift.ts", import.meta.url),
  "utf8",
).match(/prompt: "/g).length;
/** One offer spelled out: its ladder, its code, and the steps the checks name. */
function offerFrom(text) {
  // The ladder: the base for joining, a step for each answer, a last one for a phone.
  const [base, perAnswer, phoneStep] = text
    .match(
      /ladder:\s*\{\s*base:\s*(\d+),\s*perAnswer:\s*(\d+),\s*phone:\s*(\d+)/,
    )
    .slice(1)
    .map(Number);
  const code = text.match(/code: "(\w+)"/)[1];
  const step = (answers, phone = false) => {
    const percent = base + answers * perAnswer + (phone ? phoneStep : 0);
    return { percent, code: `${code}${percent}` };
  };
  return {
    code,
    perAnswer,
    phoneStep,
    step,
    start: step(0),
    answered: step(QUESTIONS),
    top: step(QUESTIONS, true),
  };
}
const FRIDAY = {
  ...offerFrom(block("BLACK_FRIDAY")),
  name: block("BLACK_FRIDAY").match(/name: "([^"]+)"/)[1],
  ends: Date.parse(block("BLACK_FRIDAY").match(/ends: "([^"]+)"/)[1]),
};
const STANDING = offerFrom(block("STANDING"));
// The offer in force right now, by this machine's clock, as the site works it out.
const campaignOn =
  /on: true/.test(block("BLACK_FRIDAY")) && Date.now() <= FRIDAY.ends;
const OFFER = campaignOn ? FRIDAY : STANDING;
const { perAnswer: PER_ANSWER, phoneStep: PHONE_STEP, step } = OFFER;
// The pouch's regular price, read from the catalogue, and a price as the site writes it.
const POUCH = Number(
  readFileSync(new URL("../src/data/products.ts", import.meta.url), "utf8")
    .split("function pouch(")[1]
    .match(/price: ([\d.]+)/)[1],
);
const usd = (value) => value.toFixed(2);
const discounted = (price, percent) =>
  Math.round(price * (100 - percent)) / 100;
/** A sticks pack's regular price, read from the catalogue. */
const STICKS = Object.fromEntries(
  [5, 15, 30].map((count) => [
    count,
    Number(
      readFileSync(
        new URL("../src/data/products.ts", import.meta.url),
        "utf8",
      ).match(new RegExp(`sticks\\("Classic", ${count}, ([\\d.]+)`))[1],
    ),
  ]),
);
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

/**
 * A fresh visitor; the offer pop-up is marked as already shown unless asked
 * for. `kept` is what the device already remembers (storage key to value);
 * `time` sets the page's own clock before anything loads.
 */
async function open(
  path,
  device = DESKTOP,
  { popup = false, kept = {}, time = null } = {},
) {
  visitor += 1;
  const context = await browser.newContext({
    ...device,
    extraHTTPHeaders: { "x-forwarded-for": `203.0.113.${visitor}` },
  });
  await context.addInitScript(
    ({ popup, kept }) => {
      if (!popup) localStorage.setItem("alas-gift-offered", "1");
      for (const [key, value] of Object.entries(kept)) {
        if (localStorage.getItem(key) === null) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }
    },
    { popup, kept },
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  if (time !== null) await page.clock.install({ time: new Date(time) });
  const response = await page.goto(base + path, { waitUntil: "networkidle" });
  return { context, page, errors, status: response?.status() };
}

/**
 * What a device remembers of a member whose sign-up the store has kept: the
 * answers given, and whether a phone number was.
 */
const member = (answers = {}, phone = false) => ({
  "alas-gift-v4": { answers, joined: true, phone, saved: true },
});
/** The name the cart is saved under, and a cart as a device holds it. */
const CART_KEY = "alas-cart-v2";
const cartOf = (...lines) => ({
  [CART_KEY]: lines.map(([handle, qty]) => ({ handle, qty })),
});
/** The server's own answer to a sign-up or a pre-order, with only "stored" set: a store that keeps it. */
const keepIt = async (route) => {
  const real = await route.fetch();
  await route.fulfill({
    response: real,
    json: { ...(await real.json()), stored: true },
  });
};
const ALL_ANSWERS = { goal: "training", flavour: "lemon", learn: "offers" };
/** What a device remembers of someone who looked at products on an earlier visit. */
const returning = (...viewed) => ({
  "alas-shopper-v1": {
    visits: 2,
    viewed,
    chapters: [],
    lastChapter: null,
    email: null,
  },
});
const squash = (text) => (text ?? "").replace(/\s+/g, " ").trim();
/** The sentences that explain an offer, as the site writes them. */
const wayUp = (offer) =>
  `Increase your discount to ${offer.top.percent}% by answering three quick questions${
    offer.phoneStep ? " and providing your phone number" : ""
  }.${offer.name ? ` ${offer.name} sale ends November 30.` : ""}`;
const joinLine = (offer) =>
  `Join the Founding Members with your email for ${offer.start.percent}% off, then build it to ${offer.top.percent}% with three quick answers${
    offer.phoneStep ? " and your phone number" : ""
  }.`;
const rangeLine = (offer) =>
  `Founding Members: ${offer.start.percent}% to ${offer.top.percent}% off. Join free`;
/** A price for an amount, in whole cents before the percentage, as the cart works it out. */
const priced = (price, qty, percent) =>
  usd(discounted((Math.round(price * 100) * qty) / 100, percent));

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
  "/products/discovery-set",
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
    !/Aegean|Mikr|Megal|Hydration Element|Discover Set/i.test(text),
  );
  check("home: no game", !/brush away|scratch|reveal it/i.test(text));
  const order = await page.evaluate(() =>
    [...document.querySelectorAll("main > section")].map(
      (s) => s.querySelector("h1,h2")?.textContent?.trim().slice(0, 24) ?? "",
    ),
  );
  check(
    "home: twelve sections in order",
    order.length === 12,
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
    priced.includes("from") &&
      priced.includes(usd(discounted(POUCH, OFFER.top.percent))),
    priced,
  );
  // The same price, written out: the pouch's regular price and the least a
  // Founding Member pays under each offer, as figures, not as a formula.
  check(
    "hero: the first screen's price is $37.49 while the campaign runs and $39.99 after it, beside $49.99",
    priced.includes(OFFER.top.percent === 25 ? "$37.49" : "$39.99") &&
      priced.includes("$49.99") &&
      [20, 25].includes(OFFER.top.percent),
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
  [720, 576],
  [740, 580],
  [790, 620],
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
      // Words set for a screen reader only are not on the picture.
      if (
        !node.textContent.trim() ||
        node.parentElement.closest("[inert], .sr-only")
      )
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
    const button = document.querySelector(".hero-actions .btn");
    const label = document.createRange();
    label.selectNodeContents(button);
    // Boxes on one line can start a pixel or two apart (the text, its
    // element and the arrow): a new row is one that starts a half line lower.
    const rows = new Set();
    for (const box of [...label.getClientRects()].filter((b) => b.width)) {
      if (![...rows].some((seen) => Math.abs(seen - box.top) < 8)) {
        rows.add(box.top);
      }
    }
    return {
      left: Math.round(shots.left),
      short: Math.round(window.innerWidth - shots.right),
      under: Math.round(lowest - top),
      over: document.documentElement.scrollWidth - window.innerWidth,
      heroEnd: Math.round(
        document.querySelector(".hero").getBoundingClientRect().bottom,
      ),
      tabsEnd: Math.round(
        document.querySelector(".hero-tabs").getBoundingClientRect().bottom,
      ),
      screen: window.innerHeight,
      pictureTall: Math.round(shots.height * 0.66),
      buttonRows: rows.size,
      buttonTall: Math.round(button.getBoundingClientRect().height),
    };
  });
  const at = `${width}x${height}`;
  check(
    `hero at ${at}: the whole first screen is in view, its tabs included`,
    state.heroEnd <= state.screen + 1 && state.tabsEnd <= state.screen + 1,
    `ends at ${state.heroEnd} of ${state.screen}`,
  );
  check(
    `hero at ${at}: the photograph keeps some height`,
    state.pictureTall >= 90,
    `${state.pictureTall}px of it above the tabs`,
  );
  check(
    `hero at ${at}: the button's label is on one line`,
    state.buttonRows === 1 && state.buttonTall <= 62,
    `${state.buttonRows} rows, ${state.buttonTall}px tall`,
  );
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
  const notes = (
    await page
      .locator("#shop article")
      .getByRole("button", { name: /Founding Members:/ })
      .allInnerTexts()
  ).map(squash);
  check(
    "shop: every card gives a visitor the whole range, not only its best end",
    notes.length === 3 && notes.every((note) => note === rangeLine(OFFER)),
    notes.join(" / "),
  );
  const spoken = await page
    .locator("#shop article s")
    .evaluateAll((items) => items.map((item) => item.textContent));
  check(
    "shop: a crossed-out price is said aloud as the regular price",
    spoken.length === 3 &&
      spoken.every((text) => /^Regular price \$\d/.test(text)),
    spoken.join(" / "),
  );
  // A tile carries the same figure as the large price, marked "from" for a
  // visitor: always for a screen reader, on screen where the tile has room.
  const tiles = (card) =>
    card
      .locator("fieldset")
      .first()
      .locator("button")
      .evaluateAll((items) =>
        items.map((item) => {
          const from = [...item.querySelectorAll("span")].find(
            (span) => span.textContent.trim() === "from",
          );
          const price = item.querySelector(".t-price");
          return {
            text: item.textContent.replace(/\s+/g, " ").trim(),
            fromOnScreen: from ? from.getBoundingClientRect().width > 2 : null,
            spills: price.scrollWidth > price.clientWidth + 1,
          };
        }),
      );
  const pouchTiles = await tiles(page.locator("#shop article").first());
  check(
    "shop: a visitor's pouch tiles carry the price from the top step, marked from",
    pouchTiles.map((tile) => tile.text).join(" | ") ===
      [1, 2, 3]
        .map(
          (n) =>
            `${n}${n === 1 ? "pouch" : "pouches"}from $${priced(POUCH, n, OFFER.top.percent)}`,
        )
        .join(" | "),
    pouchTiles.map((tile) => tile.text).join(" | "),
  );
  const stickTiles = await tiles(page.locator("#shop article").nth(1));
  const sticksWanted = [5, 15, 30]
    .map(
      (count) =>
        `${count}sticksfrom $${priced(STICKS[count], 1, OFFER.top.percent)}`,
    )
    .join(" | ");
  check(
    "shop: a visitor's sticks tiles carry the price from the top step, marked from",
    stickTiles.map((tile) => tile.text).join(" | ") === sticksWanted,
    stickTiles.map((tile) => tile.text).join(" | "),
  );
  check(
    "shop: no tile's price spills out of it, with or without the word from on screen",
    [...pouchTiles, ...stickTiles].every((tile) => !tile.spills),
  );
  // The same tiles on the product page say the same.
  await page.goto(`${base}/products/sticks-15`, { waitUntil: "networkidle" });
  const pageTiles = await page
    .locator('main a[href^="/products/sticks-"]')
    .filter({ hasText: "sticks" })
    .evaluateAll((items) =>
      items.map((item) => ({
        text: item.textContent.replace(/\s+/g, " ").trim(),
        fromOnScreen:
          [...item.querySelectorAll("span")]
            .find((span) => span.textContent.trim() === "from")
            ?.getBoundingClientRect().width > 2,
      })),
    );
  check(
    "product: the pack-size tiles show the same figures as the home card's",
    pageTiles.map((tile) => tile.text).join(" | ") === sticksWanted,
    pageTiles.map((tile) => tile.text).join(" | "),
  );
  check(
    "product: on a computer the tiles have room for the word from, and show it",
    pageTiles.every((tile) => tile.fromOnScreen),
  );
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
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

// 3. From the hero to the quick shop. For a visitor who has not joined,
// "Pre-order now" opens the cart, where the regular price and the way to join
// stand; for a member it goes straight to checkout with their code. One tap
// from a ?shop= link.
{
  const { context, page } = await open("/", PHONE);
  await page
    .getByRole("button", { name: /Pre-order for up to/ })
    .first()
    .click();
  const row = page.locator('[data-quick-item="classic-pouch"]');
  await row.waitFor({ state: "visible" });
  check(
    "quick shop: a visitor's Pre-order now is not a link to checkout",
    (await row.locator("a").count()) === 0,
  );
  await row.getByRole("button", { name: /^Pre-order .* now$/ }).click();
  const drawer = page.locator('dialog[aria-label="Your cart"][open]');
  await drawer.waitFor({ state: "visible" });
  const cart = squash(await drawer.innerText());
  const link = await drawer
    .getByRole("link", { name: /Checkout/ })
    .getAttribute("href");
  check(
    "quick shop: a visitor's Pre-order now opens the cart at the regular price, with the way to join",
    cart.includes(`Subtotal $${usd(POUCH)}`) &&
      cart.includes(
        `Founding Members save up to ${OFFER.top.percent}%. Join`,
      ) &&
      /\/cart\/42949692293225:1\?/.test(link ?? "") &&
      !/discount=/.test(link ?? ""),
    `${cart.slice(0, 160)} | ${link}`,
  );
  // Asked again, it opens the cart and adds nothing.
  await drawer.getByRole("link", { name: "Keep shopping" }).click();
  await page
    .getByRole("button", { name: /Pre-order for up to/ })
    .first()
    .click();
  await row.getByRole("button", { name: /^Pre-order .* now$/ }).click();
  await drawer.waitFor({ state: "visible" });
  const lines = await drawer
    .locator("[data-cart-line]")
    .evaluateAll((items) =>
      items.map(
        (item) =>
          `${item.dataset.cartLine} ${item.querySelector("[aria-live]").textContent}`,
      ),
    );
  check(
    "quick shop: Pre-order now twice leaves one in the cart",
    lines.join(" ") === "classic-pouch 1",
    lines.join(" "),
  );
  await context.close();
}
{
  const { context, page } = await open("/?shop=classic-pouch", PHONE, {
    kept: member({ goal: "training" }),
  });
  const buy = page.locator('[data-quick-item="classic-pouch"] a');
  await buy.waitFor({ state: "visible" });
  const href = await buy.getAttribute("href");
  const mine = step(1);
  check(
    "quick shop: a member's Pre-order now goes straight to Shopify checkout with their code",
    href?.includes("alassaltco.myshopify.com/cart/42949692293225:1") &&
      href.includes(`discount=${mine.code}`),
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
    (await card.locator("s").innerText()).includes(usd(POUCH * 2)),
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
    (await card.locator("s").innerText()).includes(usd(POUCH)),
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
  check(
    "cart: the foot says what goes to checkout now and what does not",
    /Going to checkout now: Classic Pouch \u00d7 1\./.test(
      await drawer.locator("[data-to-checkout]").innerText(),
    ) &&
      /Not in checkout: Lemon Pouch \u00d7 2\./.test(
        await drawer.locator("[data-by-email-note]").innerText(),
      ),
    await drawer.locator("footer").innerText(),
  );
  const cartLines = () =>
    drawer
      .locator("[data-cart-line]")
      .evaluateAll((items) => items.map((item) => item.dataset.cartLine));
  await byEmail.locator("input[type=email]").fill("ana@example.com");
  await byEmail.getByRole("button", { name: "Pre-order", exact: true }).click();
  // No store stands behind this server, so nothing is kept, and the cart says so.
  const refused = drawer.locator('[data-not-placed="unsaved"]');
  await refused.waitFor({ state: "visible" });
  check(
    "cart: a pre-order the store did not keep is not confirmed, and its lines stay",
    (await cartLines()).join(" ") === "classic-pouch lemon-pouch" &&
      (await drawer.locator("[data-placed]").count()) === 0 &&
      /was not saved/.test(await refused.innerText()),
    await refused.innerText(),
  );
  check(
    "cart: with no store connected it says where to write, and offers no Try again",
    squash(await refused.innerText()) ===
      "Your pre-order was not saved. This preview is not connected to the store yet. To pre-order today, write to admin@alassaltco.com." &&
      (await refused.getByRole("button").count()) === 0 &&
      (await refused
        .getByRole("link", { name: "admin@alassaltco.com" })
        .getAttribute("href")) === "mailto:admin@alassaltco.com",
    squash(await refused.innerText()),
  );
  // A store that keeps it: the server's own answer, with only "stored" set.
  await page.route("**/api/subscribe", keepIt);
  await byEmail.getByRole("button", { name: "Pre-order", exact: true }).click();
  await drawer.locator("[data-placed]").waitFor({ state: "visible" });
  const placed = (await drawer.locator("[data-placed]").innerText()).replace(
    /\s+/g,
    " ",
  );
  check(
    "cart: a kept pre-order is confirmed with its lines and amounts, and leaves the cart",
    (await cartLines()).join(" ") === "classic-pouch" &&
      placed.includes("ana@example.com") &&
      placed.includes("Lemon Pouch \u00d7 2") &&
      placed.includes(usd(POUCH * 2)),
    placed,
  );
  const afterwards = await drawer
    .getByRole("link", { name: /Checkout/ })
    .getAttribute("href");
  await drawer.getByRole("link", { name: /Checkout/ }).evaluate((link) => {
    link.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    link.click();
  });
  check(
    "cart: opening checkout removes nothing and marks nothing as bought",
    (await cartLines()).join(" ") === "classic-pouch" &&
      /\/cart\/42949692293225:1\?/.test(afterwards ?? "") &&
      !(await page.evaluate(() =>
        (localStorage.getItem("alas-shopper-v1") ?? "").includes("bought"),
      )),
    afterwards,
  );
  check(
    "cart: the checkout link marks the order as a pre-order from this site",
    new URL(afterwards).searchParams.get("attributes[Website]") === "Pre-order",
    afterwards,
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

// 4c. "Pre-order now" on a product page. A visitor who has not joined is taken
// to the cart with the amount picked, not to checkout; pressing it for a
// product that is already in the cart adds nothing.
{
  const { context, page } = await open("/products/classic-pouch");
  const main = page.locator("main");
  const drawer = page.locator('dialog[aria-label="Your cart"][open]');
  const inCart = () =>
    drawer
      .locator("[data-cart-line]")
      .evaluateAll((items) =>
        items.map(
          (item) =>
            `${item.dataset.cartLine} ${item.querySelector("[aria-live]").textContent}`,
        ),
      );
  await page.getByRole("button", { name: "One more", exact: true }).click();
  check(
    "product: a visitor's Pre-order now is not a link to checkout",
    (await main.getByRole("link", { name: "Pre-order now" }).count()) === 0,
  );
  await main.getByRole("button", { name: "Pre-order now" }).first().click();
  await drawer.waitFor({ state: "visible" });
  const cart = squash(await drawer.innerText());
  const link = await drawer
    .getByRole("link", { name: /Checkout/ })
    .getAttribute("href");
  check(
    "product: a visitor's Pre-order now opens the cart with the amount picked, at the regular price",
    (await inCart()).join(" ") === "classic-pouch 2" &&
      cart.includes(`Subtotal $${priced(POUCH, 2, 0)}`) &&
      cart.includes(
        `Founding Members save up to ${OFFER.top.percent}%. Join`,
      ) &&
      !link?.includes("discount="),
    `${(await inCart()).join(" ")} | ${link}`,
  );
  await page.keyboard.press("Escape");
  await main.getByRole("button", { name: "Pre-order now" }).first().click();
  await drawer.waitFor({ state: "visible" });
  check(
    "product: Pre-order now again leaves the cart as it was",
    (await inCart()).join(" ") === "classic-pouch 2",
    (await inCart()).join(" "),
  );
  await page.keyboard.press("Escape");
  // A product the store cannot charge yet: Add to cart, then Pre-order now.
  await page.goto(`${base}/products/lemon-pouch`, { waitUntil: "networkidle" });
  await main.getByRole("button", { name: "Add to cart" }).first().click();
  await drawer.waitFor({ state: "visible" });
  await page.keyboard.press("Escape");
  await main.getByRole("button", { name: "Pre-order now" }).first().click();
  await drawer.waitFor({ state: "visible" });
  check(
    "product: Add to cart then Pre-order now puts one Lemon pouch in the cart, not two",
    (await inCart()).join(" ") === "classic-pouch 2 lemon-pouch 1" &&
      squash(await drawer.innerText()).includes(
        "Pre-order by email: Lemon Pouch \u00d7 1",
      ),
    (await inCart()).join(" "),
  );
  await context.close();
}
// A member's price for an amount is the cart's own figure, to the cent, and
// their Pre-order now goes to checkout with their code.
{
  const { context, page } = await open("/products/sticks-15", DESKTOP, {
    kept: member({ goal: "training" }),
  });
  const mine = step(1);
  const more = page.getByRole("button", { name: "One more", exact: true });
  for (let i = 0; i < 4; i++) await more.click();
  const wanted = priced(STICKS[15], 5, mine.percent);
  const shown = squash(
    await page.locator("main p.t-price").first().innerText(),
  );
  const link = await page
    .locator("main")
    .getByRole("link", { name: "Pre-order now" })
    .first()
    .getAttribute("href");
  check(
    "product: a member's Pre-order now goes to checkout with the amount and their code",
    link?.includes(":5?") && link.includes(`discount=${mine.code}`),
    link,
  );
  await page
    .locator("main")
    .getByRole("button", { name: "Add to cart" })
    .first()
    .click();
  const foot = page.locator('dialog[aria-label="Your cart"][open] footer');
  await foot.waitFor({ state: "visible" });
  const total = squash(await foot.innerText());
  check(
    "product: five packs at a member's step cost on the page what the cart totals, to the cent",
    shown.startsWith(`$${wanted} `) &&
      total.includes(`Total before tax $${wanted}`),
    `page ${shown} | cart ${total.slice(0, 140)} | wanted ${wanted}`,
  );
  const memberTiles = await page
    .locator('main a[href^="/products/sticks-"]')
    .filter({ hasText: "sticks" })
    .evaluateAll((items) =>
      items.map((item) => item.textContent.replace(/\s+/g, " ").trim()),
    );
  check(
    "product: a member's tiles show their own price, with no from",
    memberTiles.join(" | ") ===
      [5, 15, 30]
        .map(
          (count) => `${count}sticks$${priced(STICKS[count], 1, mine.percent)}`,
        )
        .join(" | "),
    memberTiles.join(" | "),
  );
  await context.close();
}

// 4b. On a short screen the cart pins only the total and the Checkout button;
// everything else scrolls with the list, so the items and the email step have
// room.
/** True when a part of the cart lies wholly inside the part of the list that shows. */
const inList = (part) =>
  part.first().evaluate((item) => {
    const list = item.closest("[data-cart-list]").getBoundingClientRect();
    const box = item.getBoundingClientRect();
    return (
      box.height > 0 && box.top >= list.top - 1 && box.bottom <= list.bottom + 1
    );
  });
{
  const { context, page } = await open(
    "/?cart=open",
    { ...PHONE, viewport: { width: 393, height: 656 } },
    { kept: cartOf(["classic-pouch", 1], ["lemon-pouch", 1]) },
  );
  const drawer = page.locator('dialog[aria-label="Your cart"][open]');
  await drawer.waitFor({ state: "visible" });
  const foot = drawer.locator("footer");
  check(
    "phone cart: the pinned foot holds the total and the Checkout button, nothing else",
    squash(await foot.innerText()) === `Subtotal $${usd(POUCH)} Checkout`,
    squash(await foot.innerText()),
  );
  check(
    "phone cart: checkout is on screen without scrolling",
    await foot.getByRole("link", { name: /Checkout/ }).isVisible(),
  );
  const notes = drawer.locator("[data-cart-list] [data-cart-notes]");
  const said = squash(await notes.innerText());
  check(
    "phone cart: what the total leaves out, the way to join, the small print and Keep shopping scroll with the list",
    said.includes(`Founding Members save up to ${OFFER.top.percent}%. Join`) &&
      said.includes("Going to checkout now: Classic Pouch × 1.") &&
      said.includes(
        "Not in checkout: Lemon Pouch × 1. Leave your email above to pre-order it.",
      ) &&
      said.includes("Secure checkout by Shopify") &&
      said.includes("Keep shopping"),
    said,
  );
  await notes.locator("[data-by-email-note] button").click();
  await page.waitForTimeout(900);
  const step = drawer.locator("[data-by-email]");
  check(
    "phone cart: the line about what is not in checkout leads to the email step, field and button in view",
    (await inList(step.locator("input[type=email]"))) &&
      (await inList(step.locator("button[type=submit]"))),
  );
  await step.locator("input[type=email]").fill("ana@example.com");
  await page.route("**/api/subscribe", keepIt);
  await step.getByRole("button", { name: "Pre-order", exact: true }).click();
  await drawer.locator("[data-placed]").waitFor({ state: "visible" });
  await page.waitForTimeout(400);
  check(
    "phone cart: the confirmation comes into view",
    await inList(drawer.locator("[data-placed]")),
  );
  await context.close();
}

// 4d. A cart of four lines, one for checkout and three by email, on three short
// phones, for a visitor and for a member at the top step: the pinned foot is
// only the total and the button, and the email step's field, its typo hint,
// its consent line and its button can all be in view at once.
{
  const FOUR = cartOf(
    ["classic-pouch", 1],
    ["lemon-pouch", 1],
    ["discovery-set", 1],
    ["lemon-sticks-5", 2],
  );
  for (const [width, height] of [
    [393, 656],
    [375, 667],
    [320, 568],
  ]) {
    for (const [who, memory] of [
      ["visitor", {}],
      ["member", member(ALL_ANSWERS, Boolean(PHONE_STEP))],
    ]) {
      const label = `cart ${width}x${height}, ${who}`;
      const { context, page } = await open(
        "/?cart=open",
        { ...PHONE, viewport: { width, height } },
        { kept: { ...FOUR, ...memory } },
      );
      let posts = 0;
      page.on("request", (request) => {
        if (request.url().includes("/api/subscribe")) posts += 1;
      });
      const drawer = page.locator('dialog[aria-label="Your cart"][open]');
      await drawer.waitFor({ state: "visible" });
      const foot = drawer.locator("footer");
      const footText = squash(await foot.innerText());
      const paid = discounted(POUCH, OFFER.top.percent);
      check(
        `${label}: the pinned foot holds only the total and the Checkout button`,
        footText ===
          (who === "visitor"
            ? `Subtotal $${usd(POUCH)} Checkout`
            : `Subtotal $${usd(POUCH)} Your ${OFFER.top.percent}% off −$${usd(POUCH - paid)} Total before tax $${usd(paid)} Checkout`) &&
          (await foot
            .locator("[data-by-email-note], [data-to-checkout]")
            .count()) === 0,
        footText,
      );
      const room = await drawer.evaluate((sheet) => {
        const list = sheet
          .querySelector("[data-cart-list]")
          .getBoundingClientRect();
        const pinned = sheet.querySelector("footer").getBoundingClientRect();
        const form = sheet
          .querySelector("[data-by-email] form")
          .getBoundingClientRect();
        return {
          list: Math.round(list.height),
          form: Math.round(form.height),
          footEnds: Math.round(pinned.bottom),
          screen: window.innerHeight,
        };
      });
      check(
        `${label}: the foot ends on screen and the list has room for the whole email form`,
        room.footEnds <= room.screen + 1 && room.list >= room.form + 8,
        JSON.stringify(room),
      );
      const said = squash(
        await drawer.locator("[data-cart-list] [data-cart-notes]").innerText(),
      );
      check(
        `${label}: the lines about checkout scroll with the list`,
        said.includes("Going to checkout now: Classic Pouch × 1.") &&
          said.includes(
            "Not in checkout: Lemon Pouch × 1, Discovery Set × 1, Lemon Sticks (pack of 5) × 2. Leave your email above to pre-order them.",
          ) &&
          said.includes("Keep shopping"),
        said,
      );
      // The way there from the end of the list.
      await drawer.locator("[data-by-email-note] button").click();
      await page.waitForTimeout(900);
      const step = drawer.locator("[data-by-email]");
      const field = step.locator("input[type=email]");
      const button = step.locator("button[type=submit]");
      check(
        `${label}: the line about what is not in checkout brings the field and the Pre-order button into view`,
        (await inList(field)) && (await inList(button)),
      );
      // A likely typo: the first press is held and the hint is shown.
      await field.fill("ana@gmial.com");
      await button.click();
      const hint = step.getByRole("button", { name: "ana@gmail.com" });
      await hint.waitFor({ state: "visible" });
      await step
        .locator("form")
        .evaluate((form) => form.scrollIntoView({ block: "end" }));
      const consent = step.locator("form > p").last();
      check(
        `${label}: the field, the typo hint, the consent line and the Pre-order button are all in view at once`,
        (await inList(field)) &&
          (await inList(hint)) &&
          (await inList(consent)) &&
          (await inList(button)) &&
          squash(await consent.innerText()) ===
            "We email you about this pre-order. You also agree to marketing emails from ALAS; unsubscribe anytime." &&
          posts === 0,
        `posts ${posts} | ${squash(await consent.innerText())}`,
      );
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      const sheetOver = await drawer.evaluate((sheet) => {
        const list = sheet.querySelector("[data-cart-list]");
        return list.scrollWidth - list.clientWidth;
      });
      check(
        `${label}: nothing in the cart scrolls sideways`,
        over <= 0 && sheetOver <= 0,
        `${over}px, ${sheetOver}px`,
      );
      await context.close();
    }
  }
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
    "offer: opens on the way to the top step, in the owners' words",
    squash(await dialog.innerText()).includes(wayUp(OFFER)),
    squash(await dialog.innerText()).slice(0, 260),
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
      .locator("#offer-title")
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
  check(
    "offer: the email step ties the Welcome Box to a pre-order",
    squash(await dialog.innerText()).includes(
      "Enter your email and the code is yours. Pre-order with it and you also get a free Welcome Box at launch and better prices on later orders.",
    ),
    squash(await dialog.innerText()).slice(0, 260),
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
  const paid = usd(discounted(POUCH, OFFER.top.percent));
  check(
    "cart: a member's total shows the discount, not only a note about it",
    cartText.includes(`Your ${OFFER.top.percent}% off`) &&
      cartText.includes("Total before tax") &&
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
  check(
    "footer: says what an email gives and what takes it to the top",
    squash(await footer.innerText()).includes(joinLine(OFFER)),
    squash(await footer.innerText()).slice(0, 200),
  );
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

// 7. The welcome-back card for a product looked at on an earlier visit: its
// line is whole, on as many rows as it needs, with the price this visitor sees
// on the cards, and the way to the product's page in view.
for (const [label, device] of [
  ["computer", DESKTOP],
  ["phone", PHONE],
  ["small phone", { ...PHONE, viewport: { width: 320, height: 568 } }],
]) {
  for (const [who, kept, percent] of [
    ["a visitor", {}, OFFER.top.percent],
    ["a member", member({ goal: "training" }), step(1).percent],
  ]) {
    const { context, page } = await open("/", device, {
      kept: { ...returning("sticks-30"), ...kept },
    });
    const card = page.locator(".welcome-back");
    await card.waitFor({ state: "visible", timeout: 8000 });
    await card.evaluate((el) =>
      Promise.all(el.getAnimations().map((a) => a.finished)),
    );
    const seen = await card.evaluate((el) => {
      const detail = el.querySelector("[data-welcome-detail]");
      const see = [...el.querySelectorAll("a")].find(
        (a) => a.textContent.trim() === "See it",
      );
      const inView = (node) => {
        const box = node.getBoundingClientRect();
        return (
          box.width > 0 &&
          box.left >= 0 &&
          box.top >= 0 &&
          box.right <= window.innerWidth &&
          box.bottom <= window.innerHeight
        );
      };
      const heading = el.querySelector("p").getBoundingClientRect();
      const button = el.querySelector(".btn").getBoundingClientRect();
      return {
        detail: detail.textContent.replace(/\s+/g, " ").trim(),
        cut:
          detail.scrollWidth > detail.clientWidth + 1 ||
          detail.scrollHeight > detail.clientHeight + 1 ||
          getComputedStyle(detail).textOverflow === "ellipsis",
        seeInView: Boolean(see) && inView(see),
        cardInView: inView(el),
        headingClear:
          heading.bottom <= button.top || heading.right <= button.left,
        action: el.querySelector(".btn").tagName,
        href: el.querySelector(".btn").getAttribute("href") ?? "",
      };
    });
    const figure = priced(STICKS[30], 1, percent);
    check(
      `welcome back, ${label}, ${who}: the line is whole and carries the price they see elsewhere`,
      !seen.cut &&
        seen.detail.startsWith("30 Classic Sticks") &&
        seen.detail.includes(
          who === "a visitor" ? `from $${figure}` : `$${figure}`,
        ) &&
        (who === "a visitor" || !seen.detail.includes("from")) &&
        seen.detail.includes(`Regular price $${usd(STICKS[30])}`),
      JSON.stringify(seen),
    );
    check(
      `welcome back, ${label}, ${who}: See it is in view and the heading keeps clear of the button`,
      seen.seeInView && seen.cardInView && seen.headingClear,
      JSON.stringify(seen),
    );
    check(
      `welcome back, ${label}, ${who}: its button ${who === "a visitor" ? "opens the cart" : "goes to checkout with their code"}`,
      who === "a visitor"
        ? seen.action === "BUTTON"
        : seen.action === "A" && seen.href.includes(`discount=${step(1).code}`),
      `${seen.action} ${seen.href}`,
    );
    if (who === "a visitor" && label === "computer") {
      await card.getByRole("button", { name: "Pre-order now" }).click();
      const drawer = page.locator('dialog[aria-label="Your cart"][open]');
      await drawer.waitFor({ state: "visible" });
      const link = await drawer
        .getByRole("link", { name: /Checkout/ })
        .getAttribute("href");
      check(
        "welcome back: a visitor's button puts the product in the cart at the regular price",
        squash(await drawer.innerText()).includes(
          `Subtotal $${usd(STICKS[30])}`,
        ) && !link?.includes("discount="),
        link,
      );
    }
    await context.close();
  }
}

// 8. The campaign's end. Only the page's own clock is moved: one second after
// the end and a day after it the whole site speaks for the standing offer, on
// the same build, and a tab left open across the end changes over by itself.
if (campaignOn) {
  // The sodium note's "25% of the Daily Value" is not the offer.
  const campaignWords = (text) =>
    text
      .replaceAll("25% of the Daily Value", "")
      .match(
        new RegExp(`${FRIDAY.top.percent}%|${FRIDAY.code}|${FRIDAY.name}`, "g"),
      ) ?? [];
  const bodyText = (page) => page.evaluate(() => document.body.innerText);
  const top = STANDING.top;
  for (const [label, time] of [
    ["one second after the end", FRIDAY.ends + 1000],
    ["a day after the end", FRIDAY.ends + 86_400_000],
  ]) {
    const { context, page, errors } = await open("/", DESKTOP, { time });
    const home = await bodyText(page);
    check(
      `${label}, home: nothing names the campaign, its top step or its code`,
      campaignWords(home).length === 0,
      campaignWords(home).join(" | "),
    );
    const bar = squash(
      await page.locator("body > div.sticky p").first().innerText(),
    );
    const hero = squash(await page.locator(".hero-actions").innerText());
    const cardText = squash(
      await page.locator("#shop article").first().innerText(),
    );
    check(
      `${label}, home: the bar, the first screen and the cards quote the standing offer`,
      bar.includes(`Founding Members save up to ${top.percent}%`) &&
        !/\d+h \d+m/.test(bar) &&
        hero.includes(`Pre-order for up to ${top.percent}% off`) &&
        hero.includes(`from $${priced(POUCH, 1, top.percent)}`) &&
        cardText.includes(`Up to ${top.percent}% off`) &&
        cardText.includes(rangeLine(STANDING)) &&
        cardText.includes(`from $${priced(POUCH, 2, top.percent)}`),
      `${bar} | ${hero} | ${cardText.slice(0, 200)}`,
    );
    check(
      `${label}, home: no countdown, and the offer section and the footer speak for the standing offer`,
      (await page.locator('[role="timer"]').count()) === 0 &&
        squash(await page.locator("#offer").innerText()).includes(
          `${STANDING.start.percent}% off for joining, ${STANDING.perAnswer}% more for each of three quick questions.`,
        ) &&
        squash(await page.locator("footer").innerText()).includes(
          joinLine(STANDING),
        ),
      squash(await page.locator("#offer").innerText()).slice(0, 220),
    );
    const firstQuestion = await page
      .locator("#questions summary")
      .first()
      .innerText();
    check(
      `${label}, home: the campaign's question has left the questions`,
      firstQuestion === "What is a Founding Member?",
      firstQuestion,
    );
    // The pop-up: the way up, three answers, the phone field, the code.
    await page.getByRole("button", { name: "Claim it" }).first().click();
    const dialog = page.locator("dialog[data-founding-stage]");
    await dialog.waitFor({ state: "visible" });
    const opened = squash(await dialog.innerText());
    for (const answer of [
      "Training and sport",
      "Lemon",
      "Offers and launches",
    ]) {
      await dialog.getByRole("button", { name: answer, exact: true }).click();
    }
    const claim = squash(await dialog.innerText());
    await dialog.locator("input[type=tel]").fill("512 555 0147");
    const withPhone = await dialog.getAttribute("data-founding-percent");
    await dialog.locator("input[type=email]").fill("ana@example.com");
    await dialog.locator("button[type=submit]").click();
    await dialog
      .getByText(top.code, { exact: true })
      .waitFor({ state: "visible" });
    const done = squash(await dialog.innerText());
    check(
      `${label}, pop-up: it opens on the standing offer's way up and its steps`,
      opened.includes(wayUp(STANDING)) &&
        opened.includes(`${top.percent}%`) &&
        campaignWords(opened).length === 0,
      opened.slice(0, 260),
    );
    check(
      `${label}, pop-up: a phone number is still taken but is no longer a step`,
      claim.includes("Phone (optional, for texts)") &&
        Number(withPhone) === top.percent &&
        campaignWords(claim).length === 0,
      `${withPhone} | ${claim.slice(0, 200)}`,
    );
    check(
      `${label}, pop-up: three answers, a number and an email earn ${top.code}`,
      done.includes(top.code) &&
        !done.includes("Add a phone number") &&
        campaignWords(done).length === 0,
      done.slice(0, 260),
    );
    await page.keyboard.press("Escape");
    // The product pages, the cart and the checkout link.
    for (const [path, price] of [
      ["/products/classic-pouch", POUCH],
      ["/products/sticks-15", STICKS[15]],
    ]) {
      await page.goto(base + path, { waitUntil: "networkidle" });
      const text = await bodyText(page);
      const shown = squash(
        await page.locator("main p.t-price").first().innerText(),
      );
      check(
        `${label}, ${path}: the standing offer's price and nothing of the campaign`,
        campaignWords(text).length === 0 &&
          shown.startsWith(`$${priced(price, 1, top.percent)} `) &&
          squash(text).includes(`Up to ${top.percent}% off`),
        `${campaignWords(text).join(" | ")} ${shown}`,
      );
    }
    await page
      .locator("main")
      .getByRole("button", { name: "Add to cart" })
      .first()
      .click();
    const drawer = page.locator('dialog[aria-label="Your cart"][open]');
    await drawer.waitFor({ state: "visible" });
    const cart = squash(await drawer.innerText());
    const link = await drawer
      .getByRole("link", { name: /Checkout/ })
      .getAttribute("href");
    check(
      `${label}, cart: the code line, the total and the checkout link are the standing offer's`,
      cart.includes(`Code ${top.code} is added for you at checkout.`) &&
        cart.includes(`Your ${top.percent}% off`) &&
        cart.includes(
          `Total before tax $${priced(STICKS[15], 1, top.percent)}`,
        ) &&
        link?.includes(`discount=${top.code}`) &&
        campaignWords(`${cart} ${link}`).length === 0,
      `${cart.slice(-200)} | ${link}`,
    );
    check(
      `${label}: no script errors, and the page and the browser agreed while it loaded`,
      errors.length === 0,
      errors[0],
    );
    await context.close();
  }

  // A member who earned the campaign's top step, in a tab left open across the end.
  const { context, page, errors } = await open("/", DESKTOP, {
    time: FRIDAY.ends - 6000,
    kept: member(ALL_ANSWERS, true),
  });
  const read = async () => ({
    bar: squash(await page.locator("body > div.sticky p").first().innerText()),
    hero: squash(await page.locator(".hero-actions").innerText()),
    card: squash(
      await page.locator("#shop article p.t-price").first().innerText(),
    ),
    question: await page.locator("#questions summary").first().innerText(),
  });
  const before = await read();
  check(
    "open tab, seconds before the end: the campaign, with the member's top step",
    before.bar.includes(`${FRIDAY.name}: up to ${FRIDAY.top.percent}% off`) &&
      before.card.startsWith(`$${priced(POUCH, 1, FRIDAY.top.percent)} `) &&
      before.question === `How does the ${FRIDAY.name} offer work?`,
    JSON.stringify(before),
  );
  await page.clock.runFor(10_000);
  await page.waitForFunction(
    () =>
      !document
        .querySelector("body > div.sticky p")
        .textContent.includes("Friday"),
    null,
    { timeout: 5000 },
  );
  const after = await read();
  check(
    "open tab, once the end has passed: it changes over by itself, and the member is shown the standing top",
    after.bar.includes(`Founding Members save up to ${top.percent}%`) &&
      after.hero.includes(`Pre-order for up to ${top.percent}% off`) &&
      after.card.startsWith(`$${priced(POUCH, 1, top.percent)} `) &&
      after.question === "What is a Founding Member?" &&
      campaignWords(await bodyText(page)).length === 0,
    JSON.stringify(after),
  );
  await page
    .locator("#shop article")
    .first()
    .getByRole("button", { name: "Add to cart" })
    .click();
  const drawer = page.locator('dialog[aria-label="Your cart"][open]');
  await drawer.waitFor({ state: "visible" });
  const link = await drawer
    .getByRole("link", { name: /Checkout/ })
    .getAttribute("href");
  check(
    "open tab, once the end has passed: the member is charged at the standing top, with its code",
    squash(await drawer.innerText()).includes(
      `Total before tax $${priced(POUCH, 1, top.percent)}`,
    ) && link?.includes(`discount=${top.code}`),
    link,
  );
  check("open tab: no script errors", errors.length === 0, errors[0]);
  await context.close();
  // A device whose clock runs slow still shows the campaign after its end.
  // The server refuses a pre-order at the campaign's figures; from that answer
  // on the device takes the campaign as over, and remembers it.
  {
    const { context, page, errors } = await open(
      "/products/lemon-pouch",
      DESKTOP,
      { kept: member(ALL_ANSWERS, true) },
    );
    await page
      .locator("main")
      .getByRole("button", { name: "Add to cart" })
      .first()
      .click();
    const drawer = page.locator('dialog[aria-label="Your cart"][open]');
    const emailStep = drawer.locator("[data-by-email]");
    await emailStep.waitFor({ state: "visible" });
    const quoted = squash(await emailStep.innerText());
    let sent = null;
    await page.route("**/api/subscribe", async (route) => {
      sent = route.request().postDataJSON();
      await route.fulfill({
        status: 409,
        json: { ok: false, error: "offer_changed" },
      });
    });
    await emailStep.locator("input[type=email]").fill("ana@example.com");
    await emailStep
      .getByRole("button", { name: "Pre-order", exact: true })
      .click();
    await drawer.locator("[data-not-placed]").waitFor({ state: "visible" });
    const afterwards = squash(await emailStep.innerText());
    const bar = squash(
      await page.locator("body > div.sticky p").first().innerText(),
    );
    check(
      "slow clock: a pre-order refused as out of date changes the page over to the standing offer",
      quoted.includes(`with your ${FRIDAY.top.percent}% off`) &&
        sent?.percent === FRIDAY.top.percent &&
        afterwards.includes(
          `To pay then: $${priced(POUCH, 1, top.percent)} with your ${top.percent}% off`,
        ) &&
        bar.includes(`Founding Members save up to ${top.percent}%`) &&
        (await drawer.locator("[data-cart-line]").count()) === 1,
      `${quoted.slice(-60)} | sent ${sent?.percent} | ${afterwards.slice(-120)} | ${bar}`,
    );
    const refusal = drawer.locator("[data-not-placed]");
    check(
      "slow clock: the step says the page is out of date, with a Reload button",
      (await refusal.getAttribute("data-not-placed")) === "stale" &&
        squash(await refusal.innerText()) ===
          "This page is out of date. Reload it; your cart is kept. Reload",
      squash(await refusal.innerText()),
    );
    await page.unroute("**/api/subscribe");
    await page.reload({ waitUntil: "networkidle" });
    const reloaded = squash(
      await page.locator("body > div.sticky p").first().innerText(),
    );
    check(
      "slow clock: the device still shows the standing offer after a reload, with the item still in the cart",
      reloaded.includes(`Founding Members save up to ${top.percent}%`) &&
        campaignWords(await bodyText(page)).length === 0 &&
        (await page.evaluate(() =>
          (localStorage.getItem("alas-cart-v2") ?? "").includes("lemon-pouch"),
        )),
      reloaded,
    );
    // The browser itself notes the refused request; nothing else may be logged.
    const others = errors.filter((error) => !error.includes("status of 409"));
    check("slow clock: no script errors", others.length === 0, others[0]);
    await context.close();
  }
}

// 9. The pre-order by email and the forms. No store stands behind this server,
// so answers are held back, refused or marked as kept here, in the browser.
const cartDrawer = (page) =>
  page.locator('dialog[aria-label="Your cart"][open]');
const SUBSCRIBE = "**/api/subscribe";
const CONSENT = "You agree to marketing emails from ALAS; unsubscribe anytime.";
const NOT_SAVED = "Not saved: this preview is not connected to the store yet.";
const stored = (page, key) =>
  page.evaluate((name) => JSON.parse(localStorage.getItem(name)), key);

// 9a. One pre-order from the first try to the kept one: what the step says,
// what cannot be changed while it is on its way, a try again that is the same
// pre-order, and a confirmation that stays.
{
  const { context, page, errors } = await open("/?cart=open", DESKTOP, {
    kept: cartOf(["classic-pouch", 1], ["lemon-pouch", 1]),
  });
  const drawer = cartDrawer(page);
  await drawer.waitFor({ state: "visible" });
  const emailStep = drawer.locator("[data-by-email]");
  const field = emailStep.locator("input[type=email]");
  const send = emailStep.locator("form button[type=submit]");
  const words = squash(await emailStep.innerText());
  check(
    "email step: says payment cannot be taken yet, what is paid later, and that the price is set when it is placed",
    words.includes("Pre-order by email: Lemon Pouch × 1") &&
      words.includes(
        "We cannot take payment for this yet. Leave your email: nothing is charged now, and we send you the link to pay before it ships.",
      ) &&
      words.includes(
        `To pay then: $${priced(POUCH, 1, OFFER.start.percent)} with ${OFFER.start.percent}% off as a Founding Member.`,
      ) &&
      words.includes(
        "This price is set when you place the pre-order. To pay less, build your discount first.",
      ) &&
      !/not in checkout yet/i.test(words),
    words,
  );
  check(
    "email step: its consent line says the email is about the pre-order, and marketing too",
    squash(await emailStep.locator("form > p").last().innerText()) ===
      `We email you about this pre-order. You also agree to marketing emails from ALAS; unsubscribe anytime.`,
    squash(await emailStep.locator("form > p").last().innerText()),
  );

  // A typed address stays when a quantity changes.
  await field.fill("ana@example.com");
  await drawer.getByRole("button", { name: "One more Lemon Pouch" }).click();
  check(
    "email step: a typed address stays when a quantity changes",
    (await field.inputValue()) === "ana@example.com" &&
      squash(await emailStep.innerText()).includes("Lemon Pouch × 2"),
    await field.inputValue(),
  );

  // The first try: held back, then failed by the store.
  const sent = [];
  let release;
  const held = new Promise((resolve) => {
    release = resolve;
  });
  await page.route(SUBSCRIBE, async (route) => {
    sent.push(route.request().postDataJSON());
    if (sent.length === 1) await held;
    if (sent.length <= 2) {
      await route.fulfill({
        status: 502,
        json: { ok: false, error: "store_unavailable" },
      });
    } else {
      await keepIt(route);
    }
  });
  await send.click();
  await emailStep.getByRole("button", { name: "Sending…" }).waitFor();
  const off = (line) =>
    drawer
      .locator(`[data-cart-line="${line}"] button`)
      .evaluateAll((buttons) => buttons.map((button) => button.disabled));
  check(
    "while a pre-order is on its way: the quantity and Remove buttons of the line being pre-ordered and the form's button are off; the checkout line is not held",
    (await off("lemon-pouch")).every(Boolean) &&
      (await off("lemon-pouch")).length === 3 &&
      (await off("classic-pouch")).every((disabled) => !disabled) &&
      (await send.isDisabled()),
    `${await off("lemon-pouch")} | ${await off("classic-pouch")}`,
  );
  release();
  const failed = drawer.locator('[data-not-placed="error"]');
  await failed.waitFor({ state: "visible" });
  const lines = () =>
    drawer
      .locator("[data-cart-line]")
      .evaluateAll((items) =>
        items.map(
          (item) =>
            `${item.dataset.cartLine} ${item.querySelector("[aria-live]").textContent}`,
        ),
      );
  check(
    "a try the store did not answer: the step says it could not confirm, offers Try again, and the lines stay",
    squash(await failed.innerText()) ===
      "We could not confirm your pre-order. Try again: it will not be counted twice. Try again" &&
      (await lines()).join(", ") === "classic-pouch 1, lemon-pouch 2" &&
      (await off("lemon-pouch")).every((disabled) => !disabled),
    squash(await failed.innerText()),
  );

  // Try again is the same pre-order: the same reference, the address in the field.
  const second = page.waitForResponse((response) =>
    response.url().includes("/api/subscribe"),
  );
  await failed.getByRole("button", { name: "Try again" }).click();
  await second;
  await page.waitForTimeout(300);
  check(
    "Try again sends the same pre-order: one reference, the same lines and figure",
    sent.length === 2 &&
      /^[2-9bcdfghjkmnpqrstvwxz]{8}$/.test(sent[0].ref) &&
      sent[1].ref === sent[0].ref &&
      sent[1].email === "ana@example.com" &&
      JSON.stringify(sent[1].lines) ===
        JSON.stringify([{ handle: "lemon-pouch", qty: 2 }]) &&
      sent[1].percent === OFFER.start.percent &&
      sent[1].toPay === Number(priced(POUCH, 2, OFFER.start.percent)),
    JSON.stringify(sent),
  );
  // Editing the address clears the box; the form's own button sends what is in the field.
  await field.fill("bea@example.com");
  check(
    "editing the address clears the red box",
    (await drawer.locator("[data-not-placed]").count()) === 0,
  );
  await send.click();
  const placed = drawer.locator("[data-placed]");
  await placed.waitFor({ state: "visible" });
  const note = squash(await placed.innerText());
  const ref = sent[0].ref;
  check(
    "the kept pre-order went to the address now in the field, under the reference of the first try",
    sent.length === 3 &&
      sent[2].email === "bea@example.com" &&
      sent[2].ref === ref &&
      note.includes("bea@example.com") &&
      !note.includes("ana@example.com"),
    `${sent.map((body) => `${body.email} ${body.ref}`).join(" | ")} | ${note}`,
  );
  check(
    "the confirmation gives the lines, the amount to pay, the day and the reference",
    note.includes("Pre-order placed") &&
      note.includes("Lemon Pouch × 2") &&
      note.includes(
        `To pay then: $${priced(POUCH, 2, OFFER.start.percent)} with your ${OFFER.start.percent}% off.`,
      ) &&
      /Placed [A-Z][a-z]+ \d{1,2}, 20\d\d\. Reference /.test(note) &&
      note.includes(`Reference ${ref}.`) &&
      (await placed.getAttribute("data-placed")) === ref,
    note,
  );
  check(
    "only the confirmed quantities left the cart, and the next pre-order will get a new reference",
    (await lines()).join(", ") === "classic-pouch 1" &&
      (await page.evaluate(() =>
        localStorage.getItem("alas-preorder-pending"),
      )) === null,
    (await lines()).join(", "),
  );
  check(
    "a kept pre-order makes the visitor a member whose sign-up is saved",
    (await stored(page, "alas-gift-v4")).joined === true &&
      (await stored(page, "alas-gift-v4")).saved === true,
    JSON.stringify(await stored(page, "alas-gift-v4")),
  );

  // The pop-up after it: the code line, and what the pre-order keeps.
  await drawer.getByRole("button", { name: /^Build it to/ }).click();
  const dialog = page.locator("dialog[data-founding-stage]");
  await dialog.waitFor({ state: "visible" });
  const lead = dialog.locator("[data-founding-lead]");
  check(
    "pop-up: the result line says the code is added at checkout",
    squash(await lead.innerText()) ===
      `${OFFER.start.percent}% off at checkout. Your code is added for you; it is here if you need it.`,
    squash(await lead.innerText()),
  );
  await dialog.getByRole("button", { name: "Training and sport" }).click();
  const raised = step(1);
  await dialog
    .getByText(raised.code, { exact: true })
    .waitFor({ state: "visible" });
  check(
    "pop-up: a pre-order by email placed at a lower step is said to keep that step",
    squash(await lead.innerText()) ===
      `${raised.percent}% off at checkout. Your code is added for you; it is here if you need it. Your pre-order by email keeps the ${OFFER.start.percent}% it was placed with.`,
    squash(await lead.innerText()),
  );
  await page.keyboard.press("Escape");

  // The confirmation stays: after the cart was closed, and after a reload.
  await page.getByRole("button", { name: /^Cart, / }).click();
  await drawer.waitFor({ state: "visible" });
  check(
    "the confirmation is still in the cart after it was closed and opened again",
    (await drawer.locator(`[data-placed="${ref}"]`).count()) === 1,
  );
  await page.goto(`${base}/?cart=open`, { waitUntil: "networkidle" });
  await drawer.waitFor({ state: "visible" });
  check(
    "the confirmation is still in the cart after a reload",
    squash(await drawer.locator(`[data-placed="${ref}"]`).innerText()).includes(
      "bea@example.com",
    ),
  );
  await drawer.getByRole("button", { name: "Hide this note" }).click();
  check(
    "the confirmation goes when the visitor hides it",
    (await drawer.locator("[data-placed]").count()) === 0 &&
      (await page.evaluate(() => localStorage.getItem("alas-preorder-v1"))) ===
        null,
  );
  // The browser itself notes the two failed requests; nothing else may be logged.
  const others = errors.filter((error) => !error.includes("status of 502"));
  check("pre-order: no script errors", others.length === 0, others[0]);
  await context.close();
}

// 9b. What the step says for each answer that is not a kept pre-order. The
// line stays in the cart every time.
{
  const { context, page } = await open("/?cart=open", DESKTOP, {
    kept: cartOf(["lemon-pouch", 1]),
  });
  const drawer = cartDrawer(page);
  await drawer.waitFor({ state: "visible" });
  const emailStep = drawer.locator("[data-by-email]");
  const field = emailStep.locator("input[type=email]");
  const send = emailStep.locator("form button[type=submit]");
  for (const [name, status, error, kind, text, buttons] of [
    [
      "the server refuses the lines",
      400,
      "invalid_lines",
      "stale",
      "This page is out of date. Reload it; your cart is kept.",
      ["Reload"],
    ],
    [
      "the server's figure differs from the cart's",
      409,
      "total_changed",
      "stale",
      "This page is out of date. Reload it; your cart is kept.",
      ["Reload"],
    ],
    [
      "the customer's note is full",
      409,
      "note_full",
      "full",
      "We could not add this pre-order to your record. Please write to admin@alassaltco.com.",
      [],
    ],
    [
      "there were too many tries",
      429,
      "rate_limited",
      "limited",
      "Your pre-order was not saved and nothing was sent. There were too many tries from this connection in a few minutes. Your items are still in your cart. Please wait a few minutes, then try again.",
      ["Try again"],
    ],
  ]) {
    await page.route(SUBSCRIBE, (route) =>
      route.fulfill({ status, json: { ok: false, error } }),
    );
    await field.fill(`${kind}@example.com`);
    await send.click();
    const box = drawer.locator(`[data-not-placed="${kind}"]`);
    await box.waitFor({ state: "visible" });
    const named = await box
      .getByRole("button")
      .evaluateAll((items) => items.map((item) => item.textContent.trim()));
    check(
      `when ${name}: the step says so, with the right way on, and the line stays`,
      squash(await box.innerText()) === [text, ...buttons].join(" ") &&
        named.join(",") === buttons.join(",") &&
        (await drawer.locator('[data-cart-line="lemon-pouch"]').count()) ===
          1 &&
        (await drawer.locator("[data-placed]").count()) === 0,
      squash(await box.innerText()),
    );
    await page.unroute(SUBSCRIBE);
  }
  // A refused address is the form's own message, not a red box.
  await page.route(SUBSCRIBE, (route) =>
    route.fulfill({ status: 422, json: { ok: false, error: "invalid_email" } }),
  );
  await drawer
    .locator("[data-not-placed]")
    .getByRole("button", { name: "Try again" })
    .click();
  await emailStep.getByText("That email does not look quite right.").waitFor();
  check(
    "when the address is refused on a try again: the red box gives way to the address message",
    (await drawer.locator("[data-not-placed]").count()) === 0 &&
      (await field.getAttribute("aria-invalid")) === "true",
  );
  await context.close();
}

// 9c. The confirmation shows what was recorded. Here the store's answer says
// it recorded less than the cart showed, and no phone step.
{
  const { context, page } = await open("/?cart=open", DESKTOP, {
    kept: {
      ...cartOf(["lemon-pouch", 1]),
      ...member(ALL_ANSWERS, Boolean(PHONE_STEP)),
    },
  });
  const drawer = cartDrawer(page);
  await drawer.waitFor({ state: "visible" });
  const low = OFFER.start.percent;
  let asked = null;
  await page.route(SUBSCRIBE, async (route) => {
    asked = route.request().postDataJSON();
    const real = await (await route.fetch()).json();
    await route.fulfill({
      json: {
        ...real,
        stored: true,
        recorded: { offer: campaignOn ? "friday" : "founder", phone: false },
        order: {
          ...real.order,
          percent: low,
          toPay: discounted(real.order.total, low),
          asked: real.order.percent,
        },
      },
    });
  });
  const emailStep = drawer.locator("[data-by-email]");
  await emailStep.locator("input[type=email]").fill("cy@example.com");
  await emailStep.locator("form button[type=submit]").click();
  const placed = drawer.locator("[data-placed]");
  await placed.waitFor({ state: "visible" });
  const note = squash(await placed.innerText());
  check(
    "a pre-order recorded at less than the cart showed is confirmed at what was recorded, and says so",
    asked?.percent === OFFER.top.percent &&
      note.includes(
        `To pay then: $${priced(POUCH, 1, low)} with your ${low}% off.`,
      ) &&
      note.includes(
        `The cart showed ${OFFER.top.percent}% off. The store has ${low}% on record for you, so that is what this pre-order was placed with.`,
      ),
    note,
  );
  check(
    "the device follows the store when the store has no phone step on record",
    (await stored(page, "alas-gift-v4")).phone === false,
    JSON.stringify(await stored(page, "alas-gift-v4")),
  );
  await context.close();
}

// 9d. A device that joined while nothing was kept: no welcome, the not-saved
// line in its place, and its sign-up sent once more as the pop-up opens.
{
  const old = {
    "alas-gift-v4": {
      answers: { goal: "training" },
      joined: true,
      phone: false,
    },
    "alas-shopper-v1": {
      visits: 1,
      viewed: [],
      chapters: [],
      lastChapter: null,
      email: "old@example.com",
    },
  };
  const openOffer = (page) =>
    page.evaluate(() =>
      window.dispatchEvent(
        new CustomEvent("alas:gift-open", { detail: { source: "gift" } }),
      ),
    );
  {
    const { context, page } = await open("/", DESKTOP, { kept: old });
    const posts = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/subscribe")) {
        posts.push(request.postDataJSON());
      }
    });
    const footer = page.locator("footer").last();
    await footer.scrollIntoViewIfNeeded();
    const foot = squash(await footer.innerText());
    check(
      "a device whose sign-up was never kept: the footer says not saved in place of the welcome, and offers the form with its address",
      foot.includes(NOT_SAVED) &&
        !foot.includes("Welcome, Founding Member") &&
        !foot.includes("We will email you") &&
        (await footer.locator("input[type=email]").inputValue()) ===
          "old@example.com" &&
        foot.includes(CONSENT),
      foot.slice(0, 260),
    );
    await openOffer(page);
    const dialog = page.locator('dialog[data-founding-stage="done"]');
    await dialog.waitFor({ state: "visible" });
    await page.waitForLoadState("networkidle");
    const said = squash(await dialog.innerText());
    check(
      "the pop-up says not saved in place of the welcome, and keeps the code",
      said.includes(NOT_SAVED) &&
        said.includes(`Your ${step(1).percent}% off.`) &&
        !said.includes("Welcome, Founding Member") &&
        said.includes(step(1).code),
      said.slice(0, 240),
    );
    check(
      "opening the pop-up sends that device's sign-up once more, with its address and its answers",
      posts.length === 1 &&
        posts[0].email === "old@example.com" &&
        posts[0].source === "gift" &&
        JSON.stringify(posts[0].answers) ===
          JSON.stringify({ goal: "training" }),
      JSON.stringify(posts),
    );
    // Opened again once the pop-up has finished closing, as a visitor would.
    await page.evaluate(() => {
      window.offerClosed = new Promise((done) =>
        document
          .querySelector('dialog[aria-labelledby="offer-title"]')
          .addEventListener("close", () => setTimeout(done, 100), {
            once: true,
          }),
      );
    });
    await page.keyboard.press("Escape");
    await page.evaluate(() => window.offerClosed);
    await openOffer(page);
    await dialog.waitFor({ state: "visible" });
    await page.waitForLoadState("networkidle");
    check(
      "it is not sent again in a visit that has heard that nothing is kept",
      posts.length === 1,
      posts.length,
    );
    await context.close();
  }
  {
    // The same device once the store keeps things.
    const { context, page } = await open("/", DESKTOP, { kept: old });
    await page.route(SUBSCRIBE, keepIt);
    await openOffer(page);
    const dialog = page.locator('dialog[data-founding-stage="done"]');
    await dialog.waitFor({ state: "visible" });
    await dialog.getByText("Welcome, Founding Member.").waitFor();
    const footer = page.locator("footer").last();
    check(
      "once the store has kept that sign-up, the pop-up and the footer welcome the member",
      !squash(await dialog.innerText()).includes(NOT_SAVED) &&
        squash(await footer.innerText()).includes(
          "Welcome, Founding Member.",
        ) &&
        (await footer.locator("input[type=email]").count()) === 0 &&
        (await stored(page, "alas-gift-v4")).saved === true,
      squash(await footer.innerText()).slice(0, 160),
    );
    await context.close();
  }
}

// 9e. Joining in the footer and in the pop-up with no store: the not-saved
// line stands in place of the success words. Every form carries the consent.
{
  const { context, page } = await open("/");
  const footer = page.locator("footer").last();
  await footer.scrollIntoViewIfNeeded();
  check(
    "footer: the form says the visitor agrees to marketing emails",
    squash(await footer.innerText()).includes(CONSENT),
  );
  await footer.locator("input[type=email]").fill("dee@example.com");
  await footer.getByRole("button", { name: "Join" }).click();
  const dialog = page.locator('dialog[data-founding-stage="done"]');
  await dialog.waitFor({ state: "visible" });
  const said = squash(await dialog.innerText());
  check(
    "pop-up: a sign-up the store did not keep is not welcomed; the not-saved line stands in place of the success words",
    said.includes(NOT_SAVED) &&
      !said.includes("Welcome, Founding Member") &&
      !said.includes("is added for you") &&
      said.includes(OFFER.start.code),
    said.slice(0, 240),
  );
  await page.keyboard.press("Escape");
  const foot = squash(await footer.innerText());
  check(
    "footer: a sign-up the store did not keep reads not saved, with no welcome and no promise of an email",
    foot.includes(NOT_SAVED) &&
      !foot.includes("Welcome, Founding Member") &&
      !foot.includes("We will email you") &&
      !foot.includes("so this was not saved"),
    foot.slice(0, 240),
  );
  await context.close();
}
{
  const { context, page } = await open("/");
  await page.getByRole("button", { name: "Claim it" }).first().click();
  const dialog = page.locator("dialog[data-founding-stage]");
  await dialog.waitFor({ state: "visible" });
  await dialog.getByRole("button", { name: /Skip and claim/ }).click();
  check(
    "pop-up: the form says the visitor agrees to marketing emails",
    squash(await dialog.innerText()).includes(CONSENT),
  );
  await context.close();
}

// 9f. A wholesale application that was not kept: no tick, "Not sent.", and the
// form still filled in.
for (const [label, device] of [
  ["desktop", DESKTOP],
  ["phone", PHONE],
]) {
  const { context, page } = await open("/wholesale", device);
  const main = page.locator("main");
  await main.locator('input[name="business"]').fill("Harbor Yoga");
  await main.locator('input[name="name"]').fill("Gia");
  await main.locator('input[name="email"]').fill("gia@harboryoga.com");
  await main.locator('input[name="location"]').fill("Portland, Oregon");
  await main.locator('input[name="type"]').first().check({ force: true });
  await main.getByRole("button", { name: "Send application" }).click();
  const message = main.locator("[data-not-saved]");
  await message.waitFor({ state: "visible" });
  const said = squash(await message.innerText());
  // The page moves to the message smoothly: look once it has had time to arrive.
  await page
    .waitForFunction(
      () => {
        const rect = document
          .querySelector("main [data-not-saved]")
          ?.getBoundingClientRect();
        return rect && rect.top >= 0 && rect.bottom <= window.innerHeight;
      },
      null,
      { timeout: 4000 },
    )
    .catch(() => {});
  const box = await message.evaluate((item) => {
    const rect = item.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  });
  check(
    `wholesale ${label}: an application that was not kept is headed Not sent, with where to write, and is in view`,
    said ===
      "Not sent. This preview is not connected to the store yet. To apply, write to admin@alassaltco.com." &&
      box,
    `${said} | in view ${box}`,
  );
  check(
    `wholesale ${label}: no thanks and no tick, and the form is still filled in under the message`,
    !/Thank you/.test(await main.innerText()) &&
      (await main.locator('input[name="business"]').inputValue()) ===
        "Harbor Yoga" &&
      (await main.locator('input[name="email"]').inputValue()) ===
        "gia@harboryoga.com" &&
      (await main.locator('input[name="type"]').first().isChecked()) &&
      (await message.evaluate(
        (item) =>
          item.compareDocumentPosition(document.querySelector("main form")) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      )) !== 0,
  );
  if (label === "desktop") {
    // A store that keeps it: the thanks, and where the reply goes.
    await page.route("**/api/wholesale", keepIt);
    await main.getByRole("button", { name: "Send application" }).click();
    await main.getByText("Thank you.").waitFor();
    check(
      "wholesale: an application the store kept is thanked for",
      squash(await main.innerText()).includes(
        "Your application is in. We will write back to gia@harboryoga.com.",
      ) && (await main.locator("form").count()) === 0,
    );
  }
  await context.close();
}

// 9g. In the quick shop the line about what is not in checkout opens the cart
// on the email step.
for (const [label, device] of [
  ["desktop", DESKTOP],
  ["short phone", { ...PHONE, viewport: { width: 393, height: 656 } }],
]) {
  const { context, page } = await open("/?shop=1", device);
  const sheet = page.locator('dialog[aria-label="Shop"][open]');
  await sheet.waitFor({ state: "visible" });
  await sheet.getByRole("button", { name: "Add Lemon Pouch to cart" }).click();
  const line = sheet.locator("footer [data-by-email-note]");
  await line.waitFor({ state: "visible" });
  check(
    `quick shop ${label}: the foot says what is not in checkout and where the email is left`,
    squash(await line.innerText()) ===
      "Not in checkout: Lemon Pouch × 1. Leave your email in the cart to pre-order it.",
    squash(await line.innerText()),
  );
  await line.getByRole("button").click();
  const drawer = cartDrawer(page);
  await drawer.waitFor({ state: "visible" });
  await page.waitForTimeout(900);
  const emailStep = drawer.locator("[data-by-email]");
  check(
    `quick shop ${label}: that line opens the cart with the email step's field and button in view`,
    (await inList(emailStep.locator("input[type=email]"))) &&
      (await inList(emailStep.locator("button[type=submit]"))),
  );
  await context.close();
}

// 9h. Carts and names. A cart saved by an earlier version is not read, a
// retired product in a saved cart is dropped and not turned into today's, and
// the old addresses of product pages still lead to today's product.
{
  const { context, page } = await open("/?cart=open", DESKTOP, {
    kept: {
      "alas-cart-v1": [
        { handle: "classic-pouch", qty: 2 },
        { handle: "mesos", qty: 2 },
      ],
    },
  });
  const drawer = cartDrawer(page);
  await drawer.waitFor({ state: "visible" });
  check(
    "a cart saved by an earlier version starts empty",
    squash(await drawer.innerText()).includes("Your cart is empty.") &&
      (await drawer.locator("[data-cart-line]").count()) === 0,
    squash(await drawer.innerText()).slice(0, 120),
  );
  await context.close();
}
{
  const { context, page } = await open("/?cart=open", DESKTOP, {
    kept: {
      [CART_KEY]: [
        { handle: "megalo", qty: 1 },
        { handle: "mikro", qty: 1 },
        { handle: "family-box", qty: 2 },
        { handle: "welcome-box", qty: 1 },
        { handle: "sticks-15", flavour: "Lemon", qty: 1 },
      ],
    },
  });
  const drawer = cartDrawer(page);
  await drawer.waitFor({ state: "visible" });
  const lines = await drawer
    .locator("[data-cart-line]")
    .evaluateAll((items) => items.map((item) => item.dataset.cartLine));
  const link = await drawer
    .getByRole("link", { name: /Checkout/ })
    .getAttribute("href");
  check(
    "retired products in a saved cart are dropped, not turned into today's",
    lines.join(" ") === "sticks-15" &&
      /\/cart\/42949916721257:1(\?|$)/.test(link ?? "") &&
      (await drawer.locator("[data-by-email]").count()) === 0,
    `${lines.join(" ")} | ${link}`,
  );
  await context.close();
}
{
  const { context, page } = await open("/products/mesos");
  check(
    "the old address of a product page still leads to today's product",
    new URL(page.url()).pathname === "/products/classic-pouch",
    page.url(),
  );
  await context.close();
}

// 9i. The address a visitor left travels to checkout only once they have joined.
{
  const { context, page } = await open("/?cart=open", DESKTOP, {
    kept: {
      ...cartOf(["classic-pouch", 1]),
      "alas-shopper-v1": {
        visits: 1,
        viewed: [],
        chapters: [],
        lastChapter: null,
        email: "eve@example.com",
      },
    },
  });
  const drawer = cartDrawer(page);
  await drawer.waitFor({ state: "visible" });
  const link = await drawer
    .getByRole("link", { name: /Checkout/ })
    .getAttribute("href");
  check(
    "a visitor who has not joined: the checkout link carries no address and no code",
    /\/cart\/42949692293225:1\?/.test(link ?? "") &&
      !link.includes("email") &&
      !link.includes("discount="),
    link,
  );
  await context.close();
}

// 9j. Lists name a stick pack so its quantity cannot be read as a sum, and the
// cart's own words for what a member has already been given.
{
  const { context, page } = await open("/?cart=open", DESKTOP, {
    kept: {
      ...cartOf(["lemon-sticks-5", 2], ["lemon-sticks-15", 1]),
      ...member({ goal: "training" }),
    },
  });
  const drawer = cartDrawer(page);
  await drawer.waitFor({ state: "visible" });
  const whole = squash(await drawer.innerText());
  const mine = step(1).percent;
  check(
    "cart: a stick pack is named with its pack size wherever a quantity follows, and by its short name on its own line",
    whole.includes(
      "Pre-order by email: Lemon Sticks (pack of 5) × 2, Lemon Sticks (pack of 15) × 1",
    ) &&
      whole.includes(
        "Not in checkout: Lemon Sticks (pack of 5) × 2, Lemon Sticks (pack of 15) × 1.",
      ) &&
      whole.includes("Lemon Sticks, 5") &&
      !/Lemon Sticks, 5 ×/.test(whole),
    whole.slice(0, 400),
  );
  check(
    "cart: with nothing for checkout a member reads that the discount is already counted, and that payment cannot be taken for these yet",
    whole.includes(`Your ${mine}% off is already counted above.`) &&
      whole.includes("We cannot take payment for these yet.") &&
      whole.includes(`with your ${mine}% off.`) &&
      (await drawer.getByRole("link", { name: /Checkout/ }).count()) === 0,
    whole.slice(-400),
  );
  await context.close();
}

// 10. Wording, pages and names.

/** The rows a piece of text stands in, each as it reads, top to bottom. */
const rowsOf = (el) => {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const rows = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest(".sr-only")) continue;
    for (let i = 0; i < node.length; i += 1) {
      const range = document.createRange();
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const box = range.getClientRects()[0];
      if (!box) continue;
      const row = rows.find((r) => Math.abs(r.top - box.top) < 4);
      if (row) row.text += node.data[i];
      else rows.push({ top: box.top, text: node.data[i] });
    }
  }
  return rows.sort((a, b) => a.top - b.top).map((row) => row.text.trim());
};
const withRows = (page) => page.evaluate(`window.rowsOf = ${rowsOf}`);

// 10a. Wording that has been retired is on no page, in no folded answer and
// not in the cart.
const RETIRED =
  /the desk and the plane|For the bag, the desk, the plane|Discover Set|ways people use it|people also use it|Why salt your water|opens at launch|See the sources|magnesium/i;
for (const path of [
  "/",
  "/products/classic-pouch",
  "/products/lemon-pouch",
  "/products/sticks-15",
  "/products/lemon-sticks-30",
  "/products/discovery-set",
  "/science-and-history",
  "/wholesale",
]) {
  const { context, page } = await open(path, PHONE);
  const words = await page.evaluate(() => document.body.textContent);
  check(
    `${path}: no retired wording anywhere in the page`,
    !RETIRED.test(words),
    RETIRED.exec(words)?.[0],
  );
  await context.close();
}
for (const [label, lines, addOn] of [
  ["a pouch", [["classic-pouch", 1]], "Add 5 sticks"],
  ["the set", [["discovery-set", 1]], "Add 5 sticks"],
  ["sticks", [["sticks-15", 1]], "Add the Classic Pouch"],
]) {
  const { context, page } = await open("/?cart=open", DESKTOP, {
    kept: cartOf(...lines),
  });
  const drawer = cartDrawer(page);
  await drawer.waitFor({ state: "visible" });
  const said = squash(await drawer.innerText());
  check(
    `cart with ${label}: the add-on is offered and its sentence ends openly`,
    said.includes(addOn) &&
      !RETIRED.test(said) &&
      (addOn !== "Add 5 sticks" ||
        said.includes(
          "For the gym bag, the desk, or wherever the day takes you",
        )),
    said.slice(0, 200),
  );
  await context.close();
}
{
  // Every picture's line in a sticks page's gallery.
  const { context, page } = await open("/products/sticks-15", DESKTOP);
  const lines = [];
  const thumbs = page.getByRole("button", { name: /^Show image/ });
  for (let i = 0; i < (await thumbs.count()); i += 1) {
    await thumbs.nth(i).click();
    const caption = page.locator("main figure.photo figcaption");
    if (await caption.count()) lines.push(squash(await caption.innerText()));
  }
  check(
    "sticks page: no picture's line ends on a closed list",
    lines.length >= 3 &&
      lines.includes("Wherever the day takes you.") &&
      !lines.some((line) => /the plane\.?$/.test(line)),
    lines.join(" | "),
  );
  await context.close();
}

// 10b. The home page's words, as decided.
for (const [label, device] of [
  ["desktop", DESKTOP],
  ["phone", PHONE],
]) {
  const { context, page } = await open("/", device);
  const main = page.locator("main");
  const text = squash(await main.innerText());
  check(
    `home ${label}: the shop line says what both means`,
    text.includes(
      "One salt in two flavours. A pouch for the kitchen, sticks for everywhere else, or discover both, the pouch and the sticks, with the Discovery Set.",
    ),
  );
  const facts = await page
    .locator('section[aria-label="ALAS in four numbers"] li')
    .evaluateAll((items) =>
      items.map((item) => item.textContent.replace(/\s+/g, " ").trim()),
    );
  check(
    `home ${label}: the four numbers stand number first in the page itself`,
    facts.length === 4 &&
      facts[0] === "1 staple ingredient: sea salt" &&
      facts[1] === "2 distinct flavours: Classic and Lemon" &&
      facts[2] === "260 quarter-teaspoon servings in each Classic pouch" &&
      /^\d+¢ a serving$/.test(facts[3]),
    facts.join(" | "),
  );
  const why = await page.locator("#why-salt").evaluate((section) => {
    const type = (el) => {
      const style = getComputedStyle(el);
      return `${style.fontSize} ${style.color} ${style.fontWeight}`;
    };
    const facts = [...section.querySelectorAll("p.t-lead")].filter(
      (p) => !p.hasAttribute("data-sodium-note"),
    );
    const note = section.querySelector("[data-sodium-note]");
    const box = note.getBoundingClientRect();
    return {
      heading: section.querySelector("h2").textContent.trim(),
      facts: facts.map(type),
      note: type(note),
      noteShown: box.height > 40 && getComputedStyle(note).display !== "none",
      text: note.textContent,
    };
  });
  check(
    `home ${label}: the section is headed Why people salt their water`,
    why.heading === "Why people salt their water",
    why.heading,
  );
  check(
    `home ${label}: the sodium note is set in the size and colour of the two facts, and is not folded away`,
    why.facts.length === 2 &&
      why.facts.every((type) => type === why.note) &&
      why.noteShown,
    `${why.facts.join(" | ")} | ${why.note}`,
  );
  check(
    `home ${label}: the note gives the pouch serving's sodium and a stick's, as the labels print them`,
    why.text.includes(
      "A quarter-teaspoon serving of ALAS Classic has 580 mg of sodium, 25% of the Daily Value. One 2.5 g Classic stick has 970 mg, 42% of the Daily Value.",
    ),
    why.text.slice(0, 160),
  );
  const uses = squash(await page.locator("#how-to-use").innerText());
  check(
    `home ${label}: more ways to use it stand in two labelled lines, the skin marked external`,
    uses.includes(
      "More ways to use it In food and drink: in your water with lemon juice, in your morning coffee, in your cooking. On the skin, external use only: in an ice-water face bath, in a warm bath, as a salt scrub in the shower.",
    ),
    uses.slice(-260),
  );
  const answers = await page
    .locator("#questions details")
    .evaluateAll((items) =>
      Object.fromEntries(
        items.map((item) => [
          item.querySelector("summary").textContent.trim(),
          item
            .querySelector("summary + div")
            .textContent.replace(/\s+/g, " ")
            .trim(),
        ]),
      ),
    );
  check(
    `home ${label}: the question about a subscription says not yet`,
    answers["Is there a subscription?"] ===
      "Not yet. We plan one after launch, and Founding Members hear first.",
    answers["Is there a subscription?"],
  );
  check(
    `home ${label}: How do I use it lists the same two labelled lines`,
    answers["How do I use it?"]?.includes(
      "There's no one way to enjoy ALAS. More ways to use it:In food and drink: in your water with lemon juice, in your morning coffee, in your cooking.On the skin, external use only: in an ice-water face bath, in a warm bath, as a salt scrub in the shower.",
    ),
    answers["How do I use it?"],
  );
  const note = squash(
    await page
      .locator('section[aria-labelledby="compare-title"] p')
      .last()
      .innerText(),
  );
  check(
    `home ${label}: the comparison's note points at no sources`,
    note === "Typical ingredient lists, not any one brand." &&
      (await page
        .locator('section[aria-labelledby="compare-title"] a')
        .count()) === 0,
    note,
  );
  // The quiet link on the first screen leads to the section.
  const link = page.locator(".hero-why");
  const linked = await link.evaluate((a) => ({
    text: a.textContent.trim(),
    href: a.getAttribute("href"),
    size: parseFloat(getComputedStyle(a).fontSize),
    tall: Math.round(a.getBoundingClientRect().height),
    underPrice:
      a.getBoundingClientRect().top >=
      document
        .querySelector('.hero-price[data-on="true"]')
        .getBoundingClientRect().top,
  }));
  await link.click();
  await page.waitForFunction(
    () => {
      const top = document
        .querySelector("#why-salt")
        .getBoundingClientRect().top;
      return top >= 0 && top < window.innerHeight * 0.5;
    },
    null,
    { timeout: 5000 },
  );
  const landed = await page.evaluate(() => {
    const head = document.querySelector("#why-salt h2").getBoundingClientRect();
    const top = document
      .querySelector("[data-site-top]")
      .getBoundingClientRect();
    return { clear: head.top >= top.bottom - 1, hash: location.hash };
  });
  check(
    `home ${label}: a quiet link under the price, Why people salt their water, leads to the section`,
    linked.text === "Why people salt their water" &&
      linked.href === "#why-salt" &&
      linked.size >= 13 &&
      linked.tall >= 40 &&
      linked.underPrice &&
      landed.clear &&
      landed.hash === "#why-salt",
    JSON.stringify({ ...linked, ...landed }),
  );
  await context.close();
}

// 10c. Lemon's pages state no servings and no price a serving; Classic's do.
for (const [label, device] of [
  ["desktop", DESKTOP],
  ["phone", PHONE],
]) {
  for (const path of ["/products/lemon-pouch", "/products/lemon-sticks-15"]) {
    const { context, page } = await open(path, device);
    const top = squash(
      await page.locator("main > section, main > div").first().textContent(),
    );
    check(
      `${path} ${label}: no servings, no price a serving, and the pack is named for serving size and nutrition`,
      !/servings|¢ each|serving on the label/i.test(top) &&
        (path.includes("sticks") ||
          top.includes(
            "Serving size and nutrition are printed on the Lemon pack.",
          )),
      /[^.]*(servings|¢ each|serving on the label)[^.]*/i.exec(top)?.[0],
    );
    await context.close();
  }
  const { context, page } = await open("/products/classic-pouch", device);
  const top = squash(
    await page.locator("main > section, main > div").first().textContent(),
  );
  const lead = squash(await page.locator("main h1 + p").innerText());
  const described = squash(
    await page.locator("main p.t-body.text-ink-2").first().innerText(),
  );
  check(
    `classic pouch ${label}: its servings and the price of one stay, from its label`,
    lead === "390 g · roughly 260 servings · 19¢ each" &&
      top.includes(
        "The serving on the label is 1/4 teaspoon (1.5 g); a pouch holds roughly 260.",
      ),
    lead,
  );
  check(
    `classic pouch ${label}: the description does not repeat the weight the line above gives`,
    described.startsWith("Greek fleur de sel, hand-harvested") &&
      !described.startsWith("390"),
    described.slice(0, 60),
  );
  await context.close();
}

// 10d. The long read: the training ritual, and a source reached from the home
// page's credits.
{
  const { context, page } = await open("/science-and-history", DESKTOP);
  const training = squash(
    await page
      .locator("#rituals li", { hasText: "One stick, one bottle." })
      .innerText(),
  );
  check(
    "long read: the training ritual says who it is for and where it goes, not when or how often",
    training ===
      "Training One stick, one bottle. For runners, lifters and long hot days. Where The gym bag, the trail, the carry-on." &&
      !/Before and after|When you sweat/.test(training),
    training,
  );
  const rituals = squash(await page.locator("#rituals").innerText());
  check(
    "long read: the other rituals are as they were",
    rituals.includes("First thing, before the coffee.") &&
      rituals.includes("For external use.") &&
      rituals.includes("Over ripe tomatoes, good olive oil, warm bread."),
  );
  const salts = squash(await page.locator("#why dl").innerText());
  check(
    "long read: the salt's line names no minerals",
    salts.includes("ALAS Greek sea salt Unrefined, with nothing added.") &&
      !/mineral|magnesium|potassium/i.test(salts),
    salts,
  );
  const why = squash(await page.locator("#why").innerText());
  check(
    "long read: its two sentences are the home page's own, and its note gives both sodium figures",
    why.includes(
      "When you sweat, you lose salt as well as water. Mainly sodium.",
    ) &&
      why.includes(
        "Sodium is one of the electrolytes that help balance the water in your body.",
      ) &&
      why.includes(
        "One 2.5 g Classic stick has 970 mg, 42% of the Daily Value.",
      ),
  );
  await context.close();
}
for (const [label, device] of [
  ["desktop", DESKTOP],
  ["phone", PHONE],
]) {
  const { context, page } = await open("/", device);
  for (const credit of ["Baker 2017", "Dietary Guidelines 2025–2030"]) {
    await page.locator("#why-salt").getByRole("link", { name: credit }).click();
    await page.waitForURL(/science-and-history#source-\d+$/);
    await page.waitForFunction(() =>
      document.querySelector('.source-entry[data-marked="true"]'),
    );
    const marked = await page.evaluate(() => {
      const tint = (el) => getComputedStyle(el, "::before").backgroundColor;
      const on = [...document.querySelectorAll(".source-entry")].filter(
        (el) => tint(el) !== "rgba(0, 0, 0, 0)" && tint(el) !== "transparent",
      );
      return {
        count: on.length,
        id: on[0]?.id,
        hash: location.hash,
        credit: on[0]?.textContent.replace(/\s+/g, " ").slice(0, 60),
      };
    });
    check(
      `sources ${label}: the one reached from the home page's credit ${credit} is marked, and only that one`,
      marked.count === 1 && `#${marked.id}` === marked.hash,
      JSON.stringify(marked),
    );
    await page.goBack();
    await page.waitForURL((url) => url.pathname === "/");
  }
  await context.close();
}

// 10e. The points page is gone.
{
  const { context, page, status } = await open("/account");
  check(
    "the points page answers not found",
    status === 404 && !/grains/i.test(await page.locator("body").innerText()),
    status,
  );
  await context.close();
}

// 10f. What a search result or a link preview says about a product.
for (const [path, starts] of [
  ["/products/sticks-5", "5 sticks, 2.5 g each. Tear one into your bottle"],
  ["/products/sticks-15", "15 sticks, 2.5 g each. For the gym bag"],
  ["/products/lemon-sticks-30", "30 sticks, 2.5 g each. Enough to keep"],
  ["/products/classic-pouch", "390 g. Greek fleur de sel, hand-harvested"],
  ["/products/lemon-pouch", "390 g. The same Greek fleur de sel with lemon"],
  ["/products/discovery-set", "Discover the ALAS ritual: the 390 g Classic"],
]) {
  const { context, page } = await open(path);
  const said = await page.evaluate(() =>
    ["meta[name=description]", 'meta[property="og:description"]'].map(
      (query) => document.querySelector(query)?.getAttribute("content") ?? "",
    ),
  );
  check(
    `${path}: its description for search and link previews opens with what the pack is`,
    said.length === 2 && said.every((text) => text.startsWith(starts)),
    said.join(" | ").slice(0, 200),
  );
  await context.close();
}

// 10g. Names. The set's address and cart name are discovery-set; its first
// spelling and the retired boxes still lead to it in an address and a shop
// link, and a cart saved under the first spelling keeps the set.
for (const [name, product] of [
  ["discovery-set", "discovery-set"],
  ["discover-set", "discovery-set"],
  ["welcome-box", "discovery-set"],
  ["family-box", "discovery-set"],
  ["megalo", "classic-pouch"],
  ["lemon-sticks-30", "lemon-sticks-30"],
]) {
  const { context, page } = await open(`/?shop=${name}`, PHONE);
  const first = page.locator("[data-quick-item]").first();
  await first.waitFor({ state: "visible" });
  const opened = await first.getAttribute("data-quick-item");
  check(
    `?shop=${name} opens the quick shop on ${product}`,
    opened === product,
    opened,
  );
  await context.close();
}
{
  const { context, page } = await open("/products/discover-set");
  const answer = await page.request.get(`${base}/products/discover-set`, {
    maxRedirects: 0,
  });
  check(
    "the set's first address forwards to /products/discovery-set",
    new URL(page.url()).pathname === "/products/discovery-set" &&
      [307, 308].includes(answer.status()) &&
      answer.headers().location === "/products/discovery-set" &&
      (await page.locator("h1").innerText()) === "Discovery Set",
    `${page.url()} | ${answer.status()} ${answer.headers().location}`,
  );
  const direct = await page.request.get(`${base}/products/discovery-set`, {
    maxRedirects: 0,
  });
  check(
    "the set's page answers at /products/discovery-set itself",
    direct.status() === 200,
    direct.status(),
  );
  const links = await page
    .locator('a[href*="discover"]')
    .evaluateAll((items) => items.map((a) => a.getAttribute("href")));
  check(
    "no link on the page still uses the set's first address",
    !links.some((href) => /discover-set/.test(href)),
    links.join(" "),
  );
  await context.close();
}
{
  const { context, page } = await open("/?cart=open", DESKTOP, {
    kept: {
      [CART_KEY]: [
        { handle: "discover-set", qty: 2 },
        { handle: "lemon-pouch", qty: 1 },
      ],
    },
  });
  const drawer = cartDrawer(page);
  await drawer.waitFor({ state: "visible" });
  const lines = await drawer
    .locator("[data-cart-line]")
    .evaluateAll((items) => items.map((item) => item.dataset.cartLine));
  const saved = await page.evaluate(
    (key) => localStorage.getItem(key),
    CART_KEY,
  );
  check(
    "a cart saved under the set's first spelling keeps the set, under today's name",
    lines.join(" ") === "discovery-set lemon-pouch" &&
      squash(await drawer.innerText()).includes("Discovery Set") &&
      /"handle":"discovery-set","qty":2/.test(saved ?? ""),
    `${lines.join(" ")} | ${saved}`,
  );
  await context.close();
}

// 10h. The first screen, scene by scene. On a large screen every headline
// takes at most two lines, and no scene's words are taller than the first
// scene's: they all end on one line and the first scene's start at the top of
// their stack, so no other scene pushes them down. The Lemon headline takes
// two lines at every width; the sticks line breaks between its phrases.
const heroScenes = async (page) => {
  await withRows(page);
  const scenes = [];
  for (let i = 0; i < 4; i += 1) {
    if (i > 0) {
      await page.locator(".hero-tab").nth(i).click();
      await page.waitForFunction(
        (n) =>
          document
            .querySelectorAll(".hero-words")
            [n].getAnimations({ subtree: true })
            .every((animation) => animation.playState === "finished") &&
          document.querySelectorAll(".hero-words")[n].dataset.on === "true",
        i,
      );
    }
    scenes.push(
      await page.evaluate((n) => {
        const words = document.querySelectorAll(".hero-words")[n];
        const shots = document
          .querySelector(".hero-shots")
          .getBoundingClientRect();
        const packs = {
          left: shots.left + shots.width * 0.51,
          right: shots.left + shots.width * 0.94,
          top: shots.top + shots.height * 0.34,
          bottom: shots.bottom,
        };
        const boxes = [
          document.querySelector(".hero-actions .btn").getBoundingClientRect(),
        ];
        const walker = document.createTreeWalker(
          document.querySelector(".hero-copy"),
          NodeFilter.SHOW_TEXT,
        );
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (
            !node.textContent.trim() ||
            node.parentElement.closest(
              '[inert], [aria-hidden="true"], .sr-only',
            )
          )
            continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          boxes.push(...range.getClientRects());
        }
        return {
          title: window.rowsOf(words.querySelector(".hero-title")),
          line: window.rowsOf(words.querySelector(".hero-line")),
          top: Math.round(
            words.querySelector(".hero-title").getBoundingClientRect().top,
          ),
          stack: Math.round(
            document.querySelector(".hero-words-stack").getBoundingClientRect()
              .top,
          ),
          bottom: Math.round(
            words.querySelector(".hero-line").getBoundingClientRect().bottom,
          ),
          onPacks: boxes.some(
            (b) =>
              b.width &&
              b.right > packs.left + 2 &&
              b.left < packs.right - 2 &&
              b.bottom > packs.top + 2 &&
              b.top < packs.bottom - 2,
          ),
          fits:
            document.querySelector(".hero").getBoundingClientRect().bottom <=
            window.innerHeight + 1,
        };
      }, i),
    );
  }
  return scenes;
};
for (const [width, height] of [
  [1920, 1080],
  [2560, 1440],
  [1440, 900],
  [1149, 863],
]) {
  const { context, page } = await open("/", { viewport: { width, height } });
  const scenes = await heroScenes(page);
  const at = `${width}x${height}`;
  check(
    `hero at ${at}: every scene's headline takes at most two lines`,
    scenes.every((scene) => scene.title.length <= 2),
    scenes.map((scene) => scene.title.join(" / ")).join(" | "),
  );
  check(
    `hero at ${at}: the Lemon headline reads Lemon Zest, / coming soon.`,
    scenes[3].title.join(" / ") === "Lemon Zest, / coming soon.",
    scenes[3].title.join(" / "),
  );
  check(
    `hero at ${at}: no scene's words start higher or end lower than the first scene's, so none pushes them down`,
    scenes.every(
      (scene) =>
        Math.abs(scene.bottom - scenes[0].bottom) <= 1 &&
        scene.top >= scenes[0].top - 1,
    ) && scenes[0].top - scenes[0].stack <= 1,
    `stack from ${scenes[0].stack}: ${scenes.map((scene) => `${scene.top}-${scene.bottom}`).join(" | ")}`,
  );
  check(
    `hero at ${at}: in scenes two to four no words or button stand on the packs, and the screen still fits`,
    scenes.slice(1).every((scene) => !scene.onPacks && scene.fits),
    scenes.map((scene) => `${scene.onPacks}/${scene.fits}`).join(" | "),
  );
  check(
    `hero at ${at}: the sticks line breaks between its phrases`,
    scenes[2].line.every((row) => /[,.]$/.test(row)) &&
      scenes[2].line.join(" ") ===
        "2.5 g sticks for the gym bag, the desk, the plane, or wherever the day takes you.",
    scenes[2].line.join(" / "),
  );
  await context.close();
}
for (const [width, height] of [
  [320, 568],
  [360, 640],
  [390, 844],
  [768, 1024],
  [740, 580],
]) {
  const { context, page } = await open("/", {
    viewport: { width, height },
    ...(width < 700
      ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true }
      : {}),
  });
  const scenes = await heroScenes(page);
  const at = `${width}x${height}`;
  check(
    `hero at ${at}: every headline takes at most two lines, Lemon's too`,
    scenes.every((scene) => scene.title.length <= 2) &&
      scenes[3].title.join(" ") === "Lemon Zest, coming soon.",
    scenes.map((scene) => scene.title.join(" / ")).join(" | "),
  );
  check(
    `hero at ${at}: the sticks line breaks between its phrases`,
    scenes[2].line.every((row) => /[,.]$/.test(row)),
    scenes[2].line.join(" / "),
  );
  check(
    `hero at ${at}: the first screen fits in every scene`,
    scenes.every((scene) => scene.fits),
  );
  await context.close();
}

// 10i. A product page's buy bar. On a phone the name is whole at every width
// and amount; on a computer the count is said once. The welcome-back card
// stands above the bar, never on it.
const scrollToBar = async (page) => {
  await page.evaluate(() => window.scrollTo(0, 2200));
  await page.locator('[data-buy-bar="true"]').waitFor({ state: "visible" });
  await page
    .locator('[data-buy-bar="true"]')
    .evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
};
const barName = (page) =>
  page.locator('[data-buy-bar="true"]').evaluate((bar) => {
    const name = bar.querySelector("[data-buy-bar-name]");
    const range = document.createRange();
    range.selectNodeContents(name);
    const box = name.getBoundingClientRect();
    const frame = bar.getBoundingClientRect();
    const whole = [...range.getClientRects()]
      .filter((b) => b.width)
      .every(
        (b) =>
          b.left >= box.left - 1 &&
          b.right <= box.right + 1 &&
          b.top >= frame.top &&
          b.bottom <= frame.bottom,
      );
    const sub = bar.querySelector("[data-buy-bar-name] + p");
    return {
      name: name.innerText.replace(/\s+/g, " ").trim(),
      cut:
        !whole ||
        name.scrollWidth > name.clientWidth + 1 ||
        name.scrollHeight > name.clientHeight + 1,
      price: bar
        .querySelector("[data-buy-bar-price]")
        .innerText.replace(/\s+/g, " ")
        .trim(),
      sub:
        sub && getComputedStyle(sub).display !== "none"
          ? sub.innerText.trim()
          : null,
      sideways: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
for (const [width, height] of [
  [320, 568],
  [360, 640],
  [375, 667],
  [390, 844],
]) {
  const phone = { ...PHONE, viewport: { width, height } };
  for (const [who, kept] of [
    ["a visitor", {}],
    ["a member", member({ goal: "training" })],
  ]) {
    const { context, page } = await open("/products/sticks-30", phone, {
      kept,
    });
    await scrollToBar(page);
    const one = await barName(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    for (let i = 0; i < 8; i += 1)
      await page.getByRole("button", { name: "One more" }).click();
    await scrollToBar(page);
    const nine = await barName(page);
    check(
      `buy bar at ${width}px, ${who}: the name is whole with the pack's count, for one pack and for nine`,
      one.name === "Classic Sticks, 30" &&
        !one.cut &&
        nine.name === "Classic Sticks, 30" &&
        !nine.cut &&
        one.sideways <= 0 &&
        nine.sideways <= 0 &&
        nine.price.includes(
          priced(
            STICKS[30],
            9,
            who === "a visitor" ? OFFER.top.percent : step(1).percent,
          ),
        ),
      `${JSON.stringify(one)} ${JSON.stringify(nine)}`,
    );
    await context.close();
  }
  const { context, page } = await open("/products/discovery-set", phone);
  await scrollToBar(page);
  const set = await barName(page);
  check(
    `buy bar at ${width}px: Discovery Set is whole`,
    set.name === "Discovery Set" && !set.cut,
    JSON.stringify(set),
  );
  await context.close();
}
{
  const { context, page } = await open("/products/sticks-15", DESKTOP);
  await scrollToBar(page);
  const bar = await barName(page);
  const said = `${bar.name} ${bar.sub}`;
  check(
    "buy bar on a computer: the count is said once",
    bar.name === "Classic Sticks" &&
      bar.sub === "15 sticks · 2.5 g each" &&
      said.match(/15/g).length === 1 &&
      !bar.cut,
    said,
  );
  await context.close();
}
for (const [label, device] of [
  ["computer", DESKTOP],
  ["phone", PHONE],
  ["small phone", { ...PHONE, viewport: { width: 320, height: 568 } }],
]) {
  for (const path of ["/products/classic-pouch", "/products/sticks-15"]) {
    const { context, page } = await open(path, device, {
      kept: returning("sticks-30"),
    });
    const card = page.locator(".welcome-back");
    await card.waitFor({ state: "visible", timeout: 8000 });
    const before = await card.evaluate(
      (el) => window.innerHeight - el.getBoundingClientRect().bottom,
    );
    await scrollToBar(page);
    await card.evaluate((el) =>
      Promise.all(el.getAnimations().map((a) => a.finished)),
    );
    const boxes = await page.evaluate(() => {
      const card = document
        .querySelector(".welcome-back")
        .getBoundingClientRect();
      const bar = document.querySelector('[data-buy-bar="true"]');
      const frame = bar.getBoundingClientRect();
      const button = bar.querySelector(".btn").getBoundingClientRect();
      const at = document.elementFromPoint(
        button.left + button.width / 2,
        button.top + button.height / 2,
      );
      return {
        card: [Math.round(card.top), Math.round(card.bottom)],
        bar: [Math.round(frame.top), Math.round(frame.bottom)],
        apart: card.bottom <= frame.top || card.top >= frame.bottom,
        gap: Math.round(frame.top - card.bottom),
        buttonFree: bar.contains(at),
        cardInView: card.top >= 0 && card.bottom <= window.innerHeight,
      };
    });
    check(
      `welcome back on ${path}, ${label}: the card stands above the buy bar, never on it`,
      boxes.apart && boxes.gap >= 8 && boxes.buttonFree && boxes.cardInView,
      `${JSON.stringify(boxes)} | was ${Math.round(before)}px from the foot`,
    );
    await context.close();
  }
}

// 10j. On a common small phone the shop starts within 2.6 screens, with the
// sodium note still on the way to it.
{
  const { context, page } = await open("/", {
    ...PHONE,
    viewport: { width: 360, height: 640 },
  });
  const state = await page.evaluate(() => {
    const top = (query) =>
      document.querySelector(query).getBoundingClientRect().top +
      window.scrollY;
    const note = document.querySelector("#why-salt [data-sodium-note]");
    return {
      shop: top("#shop") / window.innerHeight,
      note: top("#why-salt [data-sodium-note]") / window.innerHeight,
      noteTall: Math.round(note.getBoundingClientRect().height),
      size: parseFloat(getComputedStyle(note).fontSize),
    };
  });
  check(
    "home at 360x640: the shop starts within 2.6 screens",
    state.shop < 2.6,
    state.shop.toFixed(2),
  );
  check(
    "home at 360x640: the sodium note is still there, in full size, before the shop",
    state.noteTall > 100 && state.size >= 17 && state.note < state.shop,
    JSON.stringify(state),
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
