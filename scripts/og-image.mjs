// Builds the link-preview picture (public/og.jpg): the first screen in small.
//   node scripts/og-image.mjs
// The logo and the headline in the site's own typeface, standing in the open
// left of the first scene's photograph. Nothing overlaps the packs.
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const inline = async (path, type) =>
  `data:${type};base64,${(await readFile(path)).toString("base64")}`;

const html = `<!doctype html>
<style>
  @font-face {
    font-family: "ALAS";
    src: url("${await inline("src/app/fonts/InstrumentSans-ALAS-Regular.woff2", "font/woff2")}");
  }
  body {
    position: relative;
    width: 1200px;
    height: 630px;
    margin: 0;
    overflow: hidden;
    background: #011524;
    color: #fff;
    font-family: "ALAS";
  }
  img { position: absolute; top: 58px; left: 72px; height: 96px; }
  h1 {
    position: absolute;
    top: 214px;
    left: 68px;
    margin: 0;
    font-size: 84px;
    font-weight: 400;
    line-height: 0.98;
    letter-spacing: -0.035em;
  }
  div {
    position: absolute;
    inset: 0;
    background: url("${await inline("src/assets/photos/hero-packs.jpg", "image/jpeg")}") right bottom / cover;
  }
  div::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(to right, rgb(1 21 36 / 0.7) 0%, rgb(1 21 36 / 0.4) 36%, rgb(1 21 36 / 0) 62%);
  }
</style>
<div></div>
<img src="${await inline("public/brand/alas-logo-white.svg", "image/svg+xml")}" alt="">
<h1>Greek sea salt<br>for your water.</h1>`;

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "public/og.jpg", type: "jpeg", quality: 90 });
await browser.close();
console.log("public/og.jpg written");
