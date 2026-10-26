"use client";

import clsx from "clsx";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { RitualCta } from "@/components/cart/ritual-cta";
import { GIFT, openGift, useGift } from "@/components/gift/gift-store";
import {
  buildSaltSurface,
  loadSaltPhoto,
} from "@/components/gift/salt-texture";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { art } from "@/data/art";
import { getProduct, isPriced } from "@/data/products";
import { RITUAL, RITUAL_SAVE_PERCENT } from "@/data/ritual";
import { formatPrice, useCart } from "@/lib/cart/cart-context";
import type { Ritual } from "./quiz-data";

const KEY = "M1.5 16.5V1.5H16.5V16.5H5.5V5.5H12.5V12.5H9";

/** Where the share card crops the cove photograph: open water only. */
const WATER = { x: 0.78, y: 0.55 };

/** Progress: five Greek key units; each draws in ink as its question is answered. */
export function Keys({ done, total = 5 }: { done: number; total?: number }) {
  return (
    <svg
      viewBox={`0 0 ${total * 24 - 6} 18`}
      className="h-[14px] w-auto sm:h-4"
      role="img"
      aria-label={`${Math.min(done, total)} of ${total} answered`}
    >
      {Array.from({ length: total }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed set of units.
        <g key={i} transform={`translate(${i * 24} 0)`}>
          <path
            d={KEY}
            fill="none"
            stroke="var(--c-line-strong)"
            strokeWidth="1"
          />
          <path
            d={KEY}
            fill="none"
            stroke="var(--c-ink)"
            strokeWidth="1.25"
            pathLength={1}
            strokeDasharray="1 1"
            style={{
              strokeDashoffset: i < done ? 0 : 1,
              transition: "stroke-dashoffset 1.4s var(--ease-out)",
              transitionDelay: i < done ? "0.15s" : "0s",
            }}
          />
        </g>
      ))}
    </svg>
  );
}

/** The result people keep: a 9:16 card, sized for Stories. */
export function StoryCard({
  ritual,
  score,
  className,
}: {
  ritual: Ritual;
  score: number;
  className?: string;
}) {
  return (
    <figure
      className={clsx(
        "relative flex aspect-[9/16] flex-col overflow-hidden rounded-[18px] bg-[#f9f6f0] shadow-[0_1px_1px_rgb(18_49_77_/_0.06),0_24px_50px_-20px_rgb(18_49_77_/_0.45)]",
        className,
      )}
    >
      <div className="relative m-2.5 mb-0 basis-[58%] overflow-hidden rounded-[12px]">
        <Image
          src={art.photo.cove.src}
          alt="Clear Aegean water over white sand, seen from above"
          fill
          sizes="(min-width: 768px) 300px, 80vw"
          className="scale-[1.6] object-cover"
          style={{ objectPosition: `${WATER.x * 100}% ${WATER.y * 100}%` }}
        />
        <span className="glass absolute top-3 left-3 rounded-full px-3 py-1.5 font-mono text-[10px] text-ink uppercase tracking-[0.1em]">
          My ALAS ritual
        </span>
      </div>
      <figcaption className="flex flex-1 flex-col justify-between px-5 pt-4 pb-4 text-ink">
        <div>
          <p className="font-display text-[2.15rem] leading-[0.98]">
            {ritual.name}
          </p>
          <p className="mt-2 font-display text-[1.05rem] text-ink-2 italic">
            ἅλας · salt
          </p>
        </div>
        <div className="flex items-end justify-between gap-3 border-[var(--c-line)] border-t pt-3">
          <p className="eyebrow !text-[10px]">
            {score} / 4 · {score >= 3 ? "I know my salt" : "Now I know my salt"}
          </p>
          <Logo className="h-6 text-ink" title="ALAS Salt Co." />
        </div>
      </figcaption>
    </figure>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Draw the Stories card at 1080 x 1920 and return it as a PNG. */
export async function renderStory(ritual: Ritual, score: number) {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  await document.fonts?.ready;
  const probe = document.createElement("span");
  probe.className = "font-display";
  document.body.append(probe);
  const serif = getComputedStyle(probe).fontFamily;
  probe.className = "eyebrow";
  const mono = getComputedStyle(probe).fontFamily;
  probe.remove();

  const [photo, mark] = await Promise.all([
    loadImage(art.photo.cove.src),
    loadImage("/brand/alas-logo.svg"),
  ]);

  ctx.fillStyle = "#f9f6f0";
  ctx.fillRect(0, 0, W, H);

  // Photograph: open water, cropped like the card on the page.
  const px = 30;
  const ph = Math.round(H * 0.58);
  const boxW = W - px * 2;
  const boxH = ph - px;
  const zoom = 1.6;
  const scale = Math.max(boxW / photo.width, boxH / photo.height) * zoom;
  const sw = boxW / scale;
  const sh = boxH / scale;
  const sx = (photo.width - sw) * WATER.x;
  const sy = (photo.height - sh) * WATER.y;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(px, px, boxW, boxH, 36);
  ctx.clip();
  ctx.drawImage(photo, sx, sy, sw, sh, px, px, boxW, boxH);
  ctx.restore();

  // Chip.
  ctx.font = `500 30px ${mono}`;
  const chip = "MY ALAS RITUAL";
  ctx.letterSpacing = "3px";
  const cw = ctx.measureText(chip).width + 64;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.beginPath();
  ctx.roundRect(px + 36, px + 36, cw, 72, 36);
  ctx.fill();
  ctx.fillStyle = "#12314d";
  ctx.textBaseline = "middle";
  ctx.fillText(chip, px + 68, px + 73);
  ctx.letterSpacing = "0px";

  // Ritual name, wrapped.
  ctx.textBaseline = "alphabetic";
  ctx.font = `400 128px ${serif}`;
  const lines = wrap(ctx, ritual.name, W - 150);
  let y = ph + 150;
  for (const line of lines) {
    ctx.fillText(line, 75, y);
    y += 128;
  }
  ctx.font = `italic 400 52px ${serif}`;
  ctx.fillStyle = "#3c5568";
  ctx.fillText("ἅλας · salt", 75, y + 8);

  // Footer: hairline, score, the mark.
  ctx.fillStyle = "rgba(18,49,77,0.14)";
  ctx.fillRect(75, H - 210, W - 150, 2);
  ctx.fillStyle = "#3c5568";
  ctx.font = `500 28px ${mono}`;
  ctx.letterSpacing = "3px";
  ctx.fillText(
    `${score} / 4 · ${score >= 3 ? "I KNOW MY SALT" : "NOW I KNOW MY SALT"}`,
    75,
    H - 120,
  );
  ctx.letterSpacing = "0px";
  const mh = 110;
  const mw = (mh * 762) / 579.5;
  const tint = document.createElement("canvas");
  tint.width = Math.round(mw);
  tint.height = mh;
  const tc = tint.getContext("2d");
  if (tc) {
    tc.drawImage(mark, 0, 0, mw, mh);
    tc.globalCompositeOperation = "source-in";
    tc.fillStyle = "#12314d";
    tc.fillRect(0, 0, mw, mh);
    ctx.drawImage(tint, W - 75 - mw, H - 175);
  }

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("png"))),
      "image/png",
    ),
  );
}

/** Your salt, and one tap to add it. The Ritual gets its own button. */
export function RitualPick({ ritual }: { ritual: Ritual }) {
  const { add, open } = useCart();
  const [added, setAdded] = useState(false);
  if (ritual.handle === "ritual") return <SubscriptionPick />;
  const found = getProduct(ritual.handle);
  if (!found || !isPriced(found)) return null;
  const product = found;
  const image = product.images[0];
  const name =
    product.kind === "sticks" && product.sticks
      ? `${product.name} · ${product.sticks}`
      : product.name;

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-[12px] bg-white ring-1 ring-[var(--c-line)] ring-inset">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="80px"
            className="object-contain p-1.5 mix-blend-multiply"
          />
        </div>
        <div className="min-w-0">
          <p className="eyebrow">/ Your salt</p>
          <p className="mt-1.5 font-display text-[1.45rem] leading-none">
            {name}
          </p>
          <p className="mt-1 text-[13px] text-ink-2">
            {product.subtitle} · {formatPrice(product.price)}
          </p>
        </div>
      </div>
      <div className="mt-5">
        {added ? (
          <Button
            variant="ghost"
            size="lg"
            onClick={open}
            className="whitespace-nowrap"
          >
            In your cart · View
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => {
              add(product.handle);
              setAdded(true);
            }}
            className="whitespace-nowrap"
          >
            Add my ritual · {formatPrice(product.price)}
          </Button>
        )}
      </div>
    </div>
  );
}

/** The Ritual as your pick: the two-pouch kit, its monthly price, its button. */
function SubscriptionPick() {
  const kit = getProduct("mesos");
  if (!kit) return null;
  const image = kit.images[0];
  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-[12px] bg-white ring-1 ring-[var(--c-line)] ring-inset">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="80px"
            className="object-contain p-1.5 mix-blend-multiply"
          />
        </div>
        <div className="min-w-0">
          <p className="eyebrow">/ Your salt · Save {RITUAL_SAVE_PERCENT}%</p>
          <p className="mt-1.5 font-display text-[1.45rem] leading-none">
            {RITUAL.name}
          </p>
          <p className="mt-1 text-[13px] text-ink-2">
            Two pouches every month · {formatPrice(RITUAL.price)} a month
          </p>
        </div>
      </div>
      <RitualCta source="ritual-quiz" className="mt-5" />
    </div>
  );
}

/** A small card of real salt that opens the gift; once revealed it shows the code. */
export function GiftToken() {
  const gift = useGift();
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (gift.revealed) return;
    const el = canvas.current;
    if (!el) return;
    let alive = true;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = el.getBoundingClientRect();
    el.width = Math.round(rect.width * dpr);
    el.height = Math.round(rect.height * dpr);
    loadSaltPhoto()
      .then((img) => {
        if (!alive) return;
        const surface = buildSaltSurface(
          img,
          el.width,
          el.height,
          0.5 * dpr,
          5,
        );
        el.getContext("2d")?.drawImage(surface.canvas, 0, 0);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [gift.revealed]);

  return (
    <div className="flex items-center gap-4 sm:gap-5">
      <button
        type="button"
        onClick={() => openGift("quiz")}
        aria-label={gift.revealed ? "See your gift" : "Reveal your gift"}
        className="group relative h-[72px] w-24 shrink-0 overflow-hidden rounded-[10px] bg-[#e4e7e8] shadow-[0_1px_1px_rgb(18_49_77_/_0.08),0_10px_22px_-10px_rgb(18_49_77_/_0.4)] transition-transform duration-500 ease-[var(--ease-out)] hover:-translate-y-0.5 sm:w-28"
      >
        {gift.revealed ? (
          <span className="absolute inset-0 flex flex-col items-start justify-center bg-[#f9f6f0] px-3 text-left text-ink">
            <span className="font-display text-[1.7rem] leading-none">
              {GIFT.headline}
            </span>
            <span className="mt-1 font-mono text-[9px] tracking-[0.12em]">
              {GIFT.code}
            </span>
          </span>
        ) : (
          <canvas
            ref={canvas}
            aria-hidden
            className="absolute inset-0 size-full"
          />
        )}
      </button>
      <div className="min-w-0">
        <p className="eyebrow">/ And a gift</p>
        <p className="mt-1.5 font-display text-[1.35rem] leading-tight">
          {gift.revealed ? GIFT.title : "Something from the Aegean"}
        </p>
        <button
          type="button"
          onClick={() => openGift("quiz")}
          className="eyebrow mt-2 border-[var(--c-line-strong)] border-b pb-0.5 !text-ink hover:border-ink"
        >
          {gift.revealed
            ? gift.sent
              ? "See your code"
              : "Send it to me"
            : "Brush away the salt"}
        </button>
      </div>
    </div>
  );
}
