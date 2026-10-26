"use client";

import clsx from "clsx";
import {
  type Ref,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Logo } from "@/components/ui/logo";
import { prefersReducedMotion } from "@/lib/motion/gsap";
import { GIFT } from "./gift-store";
import { buildSaltSurface, loadSaltPhoto } from "./salt-texture";

export type ScratchHandle = { reveal: () => void };

type Phase = "salt" | "lifting" | "clear";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  life: number;
  max: number;
  sprite: HTMLCanvasElement | null;
};

const CLEAR_AT = 0.56;

/** Paper grain: fractal noise, tinted warm, multiplied over the print. */
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.42 0 0 0 0 0.38 0 0 0 0 0.33 0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
)}")`;

/** The printed card the salt was resting on. */
export function GiftPrint({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "absolute inset-0 overflow-hidden rounded-[inherit] bg-[#f9f6f0]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-2.5 rounded-[8px] border border-[rgb(18_49_77_/_0.12)]"
      />
      <div className="relative flex h-full flex-col justify-between p-6 text-ink mix-blend-multiply sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <p className="eyebrow !text-ink-2">/ For you, from the Aegean</p>
          <Logo className="h-7 shrink-0 text-ink sm:h-8" title="" />
        </div>
        <div>
          <p
            className="font-display leading-[0.82]"
            style={{ fontSize: "clamp(5rem, 3.4rem + 5vw, 7.4rem)" }}
          >
            {GIFT.headline}
          </p>
          <p className="mt-2 font-display text-[1.45rem] leading-tight sm:text-[1.7rem]">
            {GIFT.detail}
          </p>
        </div>
        <div className="flex items-end justify-between gap-3 border-[rgb(18_49_77_/_0.16)] border-t pt-3">
          <p className="eyebrow !text-[10px] !text-ink-3">Code</p>
          <p className="font-mono text-[15px] text-ink tracking-[0.2em]">
            {GIFT.code}
          </p>
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-45 mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgb(18_49_77_/_0.06),inset_0_1px_0_rgb(255_255_255_/_0.8)]"
      />
    </div>
  );
}

type ScratchCardProps = {
  revealed: boolean;
  onReveal: () => void;
  className?: string;
  ref?: Ref<ScratchHandle>;
};

/**
 * A printed gift card under a layer of real salt. Brush the salt away with a mouse,
 * pen or finger; grains skitter off the brush. `reveal()` sweeps it for keyboard users.
 */
export function ScratchCard({
  revealed,
  onReveal,
  className,
  ref,
}: ScratchCardProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const saltRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>(revealed ? "clear" : "salt");
  const [ready, setReady] = useState(false);
  const api = useRef<{ reveal: () => void }>({ reveal: () => {} });
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;

  useImperativeHandle(ref, () => ({ reveal: () => api.current.reveal() }), []);

  useEffect(() => {
    if (revealed && phase === "salt") setPhase("clear");
  }, [revealed, phase]);

  const active = phase !== "clear";

  useEffect(() => {
    if (!active) return;
    const box = wrap.current;
    const salt = saltRef.current;
    const fx = fxRef.current;
    if (!box || !salt || !fx) return;
    const ctx = salt.getContext("2d");
    const fctx = fx.getContext("2d");
    if (!ctx || !fctx) return;
    const B: HTMLDivElement = box;
    const S: HTMLCanvasElement = salt;
    const F: HTMLCanvasElement = fx;
    const C: CanvasRenderingContext2D = ctx;
    const FC: CanvasRenderingContext2D = fctx;

    const reduced = prefersReducedMotion();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const FX_PAD = 28;
    let w = 0;
    let h = 0;
    let cols = 20;
    let rows = 12;
    let cells = new Uint8Array(cols * rows);
    let cleared = 0;
    let grains: HTMLCanvasElement[] = [];
    let done = false;
    let alive = true;
    let painted = false;
    let down = false;
    let last: { x: number; y: number } | null = null;
    let raf = 0;
    let sweepRaf = 0;
    const particles: Particle[] = [];

    const brush = () =>
      window.matchMedia("(pointer: coarse)").matches ? 30 : 26;

    function size() {
      const rect = B.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      S.width = Math.round(w * dpr);
      S.height = Math.round(h * dpr);
      F.width = Math.round((w + FX_PAD * 2) * dpr);
      F.height = Math.round((h + FX_PAD * 2) * dpr);
      cols = 20;
      rows = Math.max(8, Math.round((cols * h) / w));
      cells = new Uint8Array(cols * rows);
      cleared = 0;
    }

    async function paint() {
      size();
      try {
        const img = await loadSaltPhoto();
        if (!alive) return;
        const surface = buildSaltSurface(img, S.width, S.height, 0.55 * dpr);
        grains = surface.grains;
        C.globalCompositeOperation = "source-over";
        C.clearRect(0, 0, S.width, S.height);
        C.drawImage(surface.canvas, 0, 0);
      } catch {
        C.fillStyle = "#e6e8e9";
        C.fillRect(0, 0, S.width, S.height);
      }
      painted = true;
      setReady(true);
    }

    function mark(x: number, y: number, r: number) {
      const cw = w / cols;
      const ch = h / rows;
      const reach = r * 0.9;
      const c0 = Math.max(0, Math.floor((x - reach) / cw));
      const c1 = Math.min(cols - 1, Math.floor((x + reach) / cw));
      const r0 = Math.max(0, Math.floor((y - reach) / ch));
      const r1 = Math.min(rows - 1, Math.floor((y + reach) / ch));
      for (let ry = r0; ry <= r1; ry++) {
        for (let cx = c0; cx <= c1; cx++) {
          const i = ry * cols + cx;
          if (cells[i]) continue;
          const dx = (cx + 0.5) * cw - x;
          const dy = (ry + 0.5) * ch - y;
          if (dx * dx + dy * dy <= reach * reach) {
            cells[i] = 1;
            cleared++;
          }
        }
      }
    }

    function stamp(x: number, y: number, r: number) {
      const X = x * dpr;
      const Y = y * dpr;
      const RR = r * dpr;
      C.globalCompositeOperation = "destination-out";
      const g = C.createRadialGradient(X, Y, RR * 0.3, X, Y, RR);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.72, "rgba(0,0,0,0.9)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      C.fillStyle = g;
      C.beginPath();
      C.arc(X, Y, RR, 0, Math.PI * 2);
      C.fill();
      // A ragged rim of loose grains, so the edge reads as brushed salt.
      C.fillStyle = "#000";
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = RR * (0.82 + Math.random() * 0.34);
        C.globalAlpha = 0.35 + Math.random() * 0.6;
        C.beginPath();
        C.arc(
          X + Math.cos(a) * d,
          Y + Math.sin(a) * d,
          RR * (0.05 + Math.random() * 0.09),
          0,
          Math.PI * 2,
        );
        C.fill();
      }
      C.globalAlpha = 1;
      mark(x, y, r);
    }

    function spawn(x: number, y: number, dx: number, dy: number, n: number) {
      if (reduced || !grains.length) return;
      const heading = Math.atan2(dy, dx);
      for (let i = 0; i < n; i++) {
        const a = heading + (Math.random() - 0.5) * 1.9;
        const speed = 50 + Math.random() * 170;
        const max = 0.5 + Math.random() * 0.45;
        particles.push({
          x: x + (Math.random() - 0.5) * 14,
          y: y + (Math.random() - 0.5) * 14,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed - 70 - Math.random() * 90,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 9,
          life: max,
          max,
          sprite:
            Math.random() < 0.14
              ? null
              : grains[Math.floor(Math.random() * grains.length)],
        });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }

    let prev = 0;
    function tick(now: number) {
      const dt = prev ? Math.min(0.05, (now - prev) / 1000) : 1 / 60;
      prev = now;
      FC.setTransform(1, 0, 0, 1, 0, 0);
      FC.clearRect(0, 0, F.width, F.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.vy += 1150 * dt;
        p.vx *= 0.985;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        const t = p.life / p.max;
        const alpha = Math.min(1, t * 2.4);
        const px = (p.x + FX_PAD) * dpr;
        const py = (p.y + FX_PAD) * dpr;
        if (p.sprite) {
          FC.globalAlpha = alpha;
          FC.setTransform(1, 0, 0, 1, px, py);
          FC.rotate(p.rot);
          FC.drawImage(p.sprite, -p.sprite.width / 2, -p.sprite.height / 2);
        } else {
          // A glint: sun catching one crystal.
          const r = (1.5 + 4 * Math.sin(Math.PI * t)) * dpr;
          FC.setTransform(1, 0, 0, 1, px, py);
          FC.globalAlpha = alpha * 0.9;
          const g = FC.createRadialGradient(0, 0, 0, 0, 0, r * 2.2);
          g.addColorStop(0, "rgba(255,255,255,1)");
          g.addColorStop(0.25, "rgba(255,252,240,0.65)");
          g.addColorStop(1, "rgba(255,255,255,0)");
          FC.fillStyle = g;
          FC.fillRect(-r * 2.2, -r * 2.2, r * 4.4, r * 4.4);
        }
      }
      FC.globalAlpha = 1;
      raf = particles.length ? requestAnimationFrame(tick) : 0;
      if (!raf) prev = 0;
    }

    function hideHint() {
      hintRef.current?.setAttribute("data-hidden", "true");
    }

    function stroke(x: number, y: number, r: number) {
      if (!last) {
        stamp(x, y, r);
        spawn(x, y, 0, -1, 2);
        last = { x, y };
        return;
      }
      const dx = x - last.x;
      const dy = y - last.y;
      const dist = Math.hypot(dx, dy);
      const step = r * 0.32;
      const n = Math.max(1, Math.floor(dist / step));
      for (let i = 1; i <= n; i++) {
        stamp(last.x + (dx * i) / n, last.y + (dy * i) / n, r);
      }
      if (dist > 2) spawn(x, y, dx, dy, Math.min(5, 1 + Math.floor(dist / 9)));
      last = { x, y };
      if (cleared / cells.length >= CLEAR_AT) finish();
    }

    function finish() {
      if (done) return;
      done = true;
      down = false;
      hideHint();
      cancelAnimationFrame(sweepRaf);
      if (!reduced) {
        for (let i = 0; i < 26; i++) {
          spawn(
            Math.random() * w,
            Math.random() * h * 0.9,
            Math.random() - 0.5,
            -1,
            1,
          );
        }
      }
      S.style.transition = reduced
        ? "none"
        : "opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)";
      S.style.opacity = "0";
      S.style.transform = "scale(1.02)";
      if (sheenRef.current) sheenRef.current.style.opacity = "0";
      setPhase("lifting");
      onRevealRef.current();
      window.setTimeout(() => alive && setPhase("clear"), reduced ? 0 : 950);
    }

    function point(event: PointerEvent) {
      const rect = S.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function onDown(event: PointerEvent) {
      if (done || !painted) return;
      down = true;
      last = null;
      S.setPointerCapture(event.pointerId);
      hideHint();
      const p = point(event);
      stroke(p.x, p.y, brush());
    }

    function onMove(event: PointerEvent) {
      const p = point(event);
      sheenRef.current?.style.setProperty("--sx", `${(p.x / w) * 100}%`);
      sheenRef.current?.style.setProperty("--sy", `${(p.y / h) * 100}%`);
      if (!down || done) return;
      const events = event.getCoalescedEvents?.() ?? [event];
      for (const e of events) {
        const q = point(e);
        stroke(q.x, q.y, brush());
      }
    }

    function onUp() {
      down = false;
      last = null;
    }

    api.current.reveal = () => {
      if (done) return;
      hideHint();
      if (reduced || !painted) {
        finish();
        return;
      }
      const start = performance.now();
      const duration = 1150;
      const passes = 4;
      const r = brush() * 1.55;
      last = null;
      const run = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        const lane = Math.min(passes - 1, Math.floor(e * passes));
        const local = e * passes - lane;
        const x =
          lane % 2 === 0
            ? local * (w + r) - r / 2
            : (1 - local) * (w + r) - r / 2;
        const y = ((lane + 0.5) / passes) * h;
        stroke(x, y, r);
        if (!done && t < 1) sweepRaf = requestAnimationFrame(run);
        else finish();
      };
      sweepRaf = requestAnimationFrame(run);
    };

    salt.addEventListener("pointerdown", onDown);
    salt.addEventListener("pointermove", onMove);
    salt.addEventListener("pointerup", onUp);
    salt.addEventListener("pointercancel", onUp);
    salt.addEventListener("lostpointercapture", onUp);

    paint();

    let lastW = box.getBoundingClientRect().width;
    const ro = new ResizeObserver(() => {
      const nw = box.getBoundingClientRect().width;
      if (done || Math.abs(nw - lastW) < 2) return;
      lastW = nw;
      paint();
    });
    ro.observe(box);

    return () => {
      alive = false;
      ro.disconnect();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(sweepRaf);
      salt.removeEventListener("pointerdown", onDown);
      salt.removeEventListener("pointermove", onMove);
      salt.removeEventListener("pointerup", onUp);
      salt.removeEventListener("pointercancel", onUp);
      salt.removeEventListener("lostpointercapture", onUp);
    };
  }, [active]);

  return (
    <div
      ref={wrap}
      className={clsx(
        "relative isolate rounded-[14px] shadow-[0_1px_1px_rgb(18_49_77_/_0.06),0_14px_30px_-10px_rgb(18_49_77_/_0.28),0_36px_70px_-30px_rgb(18_49_77_/_0.3)]",
        className,
      )}
    >
      <GiftPrint className={clsx(phase === "salt" && !ready && "opacity-0")} />
      {phase !== "clear" && (
        <>
          <canvas
            ref={saltRef}
            aria-hidden
            className="absolute inset-0 size-full touch-none rounded-[inherit] [cursor:grab] active:[cursor:grabbing]"
            style={{ background: ready ? "transparent" : "#e5e8e9" }}
          />
          <div
            ref={sheenRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-80 mix-blend-soft-light transition-opacity duration-700 [--sx:30%] [--sy:20%] motion-reduce:hidden"
            style={{
              background:
                "radial-gradient(42% 60% at var(--sx) var(--sy), rgb(255 255 255 / 0.9), transparent 70%)",
            }}
          />
          <canvas
            ref={fxRef}
            aria-hidden
            className="pointer-events-none absolute -inset-7 z-10 size-[calc(100%+3.5rem)]"
            style={{ maxWidth: "none" }}
          />
          <p
            ref={hintRef}
            aria-hidden
            className="glass pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-2 font-mono text-[11px] tracking-[0.1em] text-ink uppercase whitespace-nowrap transition-[opacity,transform] duration-500 data-[hidden=true]:-translate-y-[30%] data-[hidden=true]:opacity-0"
          >
            Brush away the salt
          </p>
        </>
      )}
    </div>
  );
}
