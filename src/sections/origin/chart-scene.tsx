"use client";

import Image from "next/image";
import { type ReactNode, useRef } from "react";
import { art } from "@/data/art";
import {
  gsap,
  prefersReducedMotion,
  ScrollTrigger,
  useGSAP,
} from "@/lib/motion/gsap";
import {
  COAST,
  GRATICULE,
  ISLANDS,
  LAND,
  LESVOS,
  MAP,
} from "./aegean-map-data";
import {
  type Box,
  between,
  formatLatLon,
  invert,
  toScreen,
  views,
} from "./camera";

/** Sea tint of the chart. Waterline "erase" strokes must match it exactly. */
const SEA = "#e2eff1";
const INK = "#12314d";
/** Engraved waterlines around Lesvos: distance from the coast in px. */
const RINGS = [16, 10, 5];

const HARVEST = MAP.points.harvest;
const HARVEST_LABEL = "39.21° N · 26.21° E";
const CORE_CENTER: [number, number] = [
  MAP.core.x + MAP.core.w / 2,
  MAP.core.y + MAP.core.h / 2,
];
const START = views(1440, 900).wide;
const vbString = (b: Box) =>
  `${b.x.toFixed(2)} ${b.y.toFixed(2)} ${b.w.toFixed(2)} ${b.h.toFixed(2)}`;

/** Zoom progress at which the camera arrives and the pin lands. */
const ARRIVE = 0.86;

type LabelKey =
  | "aegeanLabel"
  | "cycladesLabel"
  | "athens"
  | "greeceLabel"
  | "turkeyLabel"
  | "lesvosLabel";

const LINES = [
  "It comes from the Aegean Sea.",
  "From the island of Lesvos.",
  "From the salt pans of Kalloni Gulf.",
];
const CRUMBS = ["Aegean Sea", "Lesvos", "Kalloni Gulf"];

// The map fades into the chalk page at its top and bottom edge, so the stage
// arrives and leaves without a seam.
const EDGE_MASK =
  "linear-gradient(180deg, transparent 0%, #000 9%, #000 88%, transparent 100%)";

const CSS = `
[data-origin-chart] .oc-pin-ring { opacity: 0; }
@media (prefers-reduced-motion: no-preference) {
  [data-origin-chart] [data-coast] { stroke-dasharray: 1 1; stroke-dashoffset: 1; }
  [data-origin-chart] [data-island] { fill-opacity: 0; stroke-dasharray: 1 1; stroke-dashoffset: 1; }
  [data-origin-chart] [data-sea] { opacity: 0; }
  [data-origin-chart] [data-hide] { opacity: 0; visibility: hidden; }
  [data-origin-chart] [data-line] { opacity: 0; visibility: hidden; }
  [data-origin-chart] [data-loupe] { clip-path: circle(0% at 50% 50%); }
  [data-origin-chart] [data-leader] { stroke-dasharray: 1 1; stroke-dashoffset: 1; }
  [data-origin-chart][data-landed="true"] .oc-pin-ring { animation: oc-ring 2.8s cubic-bezier(0.22, 1, 0.36, 1) infinite; }
  [data-origin-chart][data-landed="true"] .oc-pin-ring + .oc-pin-ring { animation-delay: 1.4s; }
  [data-origin-chart] .oc-pin:hover .oc-pin-ring { animation-duration: 1.6s; }
}
@keyframes oc-ring {
  0% { transform: scale(0.4); opacity: 0.55; }
  100% { transform: scale(3.4); opacity: 0; }
}
`;

export function ChartScene() {
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = track.current;
      if (!root) return;
      const q = <T extends Element = HTMLElement>(sel: string) =>
        root.querySelector(sel) as T;
      const qa = <T extends Element = HTMLElement>(sel: string) =>
        Array.from(root.querySelectorAll(sel)) as T[];

      const stage = q<HTMLDivElement>("[data-stage]");
      const svg = q<SVGSVGElement>("[data-chart]");
      const coastG = q<SVGGElement>("[data-coast-g]");
      const islandG = q<SVGGElement>("[data-island-g]");
      const gratG = q<SVGGElement>("[data-grat]");
      const lesvosLand = q<SVGPathElement>("[data-lesvos-land]");
      const ringPaths = qa<SVGPathElement>("[data-ring]");
      const overlay = q<HTMLDivElement>("[data-overlay]");
      const labels = qa<HTMLDivElement>("[data-label]");
      const pin = q<HTMLDivElement>("[data-pin]");
      const loupe = q<HTMLDivElement>("[data-loupe-wrap]");
      const leader = q<SVGPathElement>("[data-leader]");
      const leaderDot = q<SVGCircleElement>("[data-leader-dot]");
      const readout = q<HTMLSpanElement>("[data-readout-value]");
      const sea = q<HTMLDivElement>("[data-sea]");

      let W = stage.clientWidth;
      let H = stage.clientHeight;
      let V = views(W, H);
      const cam = { t: 0 };
      const reduced = prefersReducedMotion();

      const apply = () => {
        const vb = between(V.wide, V.close, cam.t);
        svg.setAttribute("viewBox", vbString(vb));
        const s = W / vb.w;
        coastG.setAttribute("stroke-width", (0.9 / s).toFixed(4));
        islandG.setAttribute("stroke-width", (0.8 / s).toFixed(4));
        gratG.setAttribute("stroke-width", (0.7 / s).toFixed(4));
        lesvosLand.setAttribute("stroke-width", (1.05 / s).toFixed(4));
        ringPaths.forEach((p, i) => {
          const d = RINGS[Math.floor(i / 2)];
          const w = i % 2 === 0 ? 2 * d + 0.8 : 2 * d - 0.8;
          p.setAttribute("stroke-width", (w / s).toFixed(4));
        });
        for (const el of labels) {
          const key = el.dataset.label as LabelKey;
          const [x, y] = toScreen(vb, W, MAP.points[key]);
          el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        }
        const [px, py] = toScreen(vb, W, HARVEST);
        pin.style.transform = `translate3d(${px.toFixed(1)}px, ${py.toFixed(1)}px, 0)`;
        // Leader: pin to the near edge of the inset (layout box, centred on left/top).
        const lx = loupe.offsetLeft;
        const ly = loupe.offsetTop;
        const lrad = loupe.offsetWidth / 2 + 6;
        const ang = Math.atan2(py - ly, px - lx);
        const ex = lx + Math.cos(ang) * lrad;
        const ey = ly + Math.sin(ang) * lrad;
        leader.setAttribute(
          "d",
          `M${px.toFixed(1)} ${py.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`,
        );
        leaderDot.setAttribute("cx", ex.toFixed(1));
        leaderDot.setAttribute("cy", ey.toFixed(1));
        // Readout: the point under the camera's aim, in real coordinates.
        const k = Math.min(1, cam.t);
        const ux = CORE_CENTER[0] + (HARVEST[0] - CORE_CENTER[0]) * k;
        const uy = CORE_CENTER[1] + (HARVEST[1] - CORE_CENTER[1]) * k;
        readout.textContent =
          k >= 0.999 || reduced ? HARVEST_LABEL : formatLatLon(invert(ux, uy));
        const [sx, sy] = toScreen(vb, W, CORE_CENTER);
        sea.style.setProperty("--sx", `${sx.toFixed(0)}px`);
        sea.style.setProperty("--sy", `${sy.toFixed(0)}px`);
      };

      const measure = () => {
        W = stage.clientWidth;
        H = stage.clientHeight;
        V = views(W, H);
        apply();
      };
      const ro = new ResizeObserver(measure);
      ro.observe(stage);

      if (reduced) {
        root.dataset.landed = "true";
        measure();
        return () => ro.disconnect();
      }
      measure();

      /* ---- Images and light: scrubbed, lightly smoothed. ---- */

      // While the stage rises into view the chart draws itself, so it is
      // complete the moment the scene locks.
      const draw = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top bottom",
          end: "top top",
          scrub: 0.3,
        },
      });
      draw.fromTo(
        qa("[data-coast]"),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut" },
        0.25,
      );
      draw.fromTo(
        sea,
        { opacity: 1, "--flood": 0 },
        { "--flood": 1, duration: 0.4, ease: "power2.inOut" },
        0.5,
      );
      draw.fromTo(gratG, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.6);
      qa<SVGPathElement>("[data-island]").forEach((path, i) => {
        draw.fromTo(
          path,
          { fillOpacity: 0, strokeDashoffset: 1 },
          {
            fillOpacity: 1,
            strokeDashoffset: 0,
            duration: 0.22,
            ease: "power2.out",
          },
          0.55 + i * 0.03,
        );
      });

      // One continuous zoom from the whole Aegean down to Kalloni Gulf.
      const zoom = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        },
      });
      zoom.to(
        cam,
        { t: 1, duration: ARRIVE, ease: "power2.inOut", onUpdate: apply },
        0,
      );
      zoom.fromTo(
        q("[data-rings]"),
        { opacity: 0 },
        { opacity: 1, duration: 0.24 },
        ARRIVE - 0.24,
      );
      zoom.set({}, {}, 1);

      /* ---- Words: never scrubbed. They switch at set points. ---- */

      const lines = qa<HTMLElement>("[data-line]");
      const crumbs = qa<HTMLElement>("[data-crumb]");
      const wideLabels = qa<HTMLElement>(
        "[data-label]:not([data-label='lesvosLabel']) > div",
      );
      const lesvosLabel = q<HTMLElement>("[data-label='lesvosLabel'] > div");
      const show = (els: Element | Element[], on: boolean) =>
        gsap.to(els, {
          autoAlpha: on ? 1 : 0,
          y: on ? 0 : 6,
          duration: on ? 0.5 : 0.25,
          ease: on ? "power2.out" : "power1.in",
          overwrite: "auto",
        });

      // One line in the mask at a time: the showing line rolls out first, then the
      // next rolls in. Each switch cancels the last, so fast scrolling can never
      // leave two lines on screen.
      const OUT = 0.2;
      const showing = (el: HTMLElement) =>
        Number(gsap.getProperty(el, "opacity")) > 0.01 &&
        Math.abs(Number(gsap.getProperty(el, "yPercent"))) < 100;
      let line = -1;
      const setLine = (next: number) => {
        if (next === line) return;
        const prev = line;
        line = next;
        const down = next < prev;
        const target = lines[next];
        const arriving = target ? showing(target) : false;
        gsap.killTweensOf(lines);
        let leaving = false;
        lines.forEach((el, i) => {
          if (i === next) return;
          if (showing(el)) {
            leaving = true;
            gsap.to(el, {
              yPercent: down ? 105 : -105,
              duration: OUT,
              ease: "power2.in",
            });
          } else {
            gsap.set(el, { yPercent: 105 });
          }
        });
        crumbs.forEach((el, i) => {
          show(el, i <= next);
        });
        if (!target) return;
        if (arriving) {
          gsap.to(target, {
            yPercent: 0,
            autoAlpha: 1,
            duration: 0.4,
            ease: "power3.out",
          });
          return;
        }
        gsap.fromTo(
          target,
          { yPercent: down ? -105 : 105, autoAlpha: 1 },
          {
            yPercent: 0,
            duration: 0.55,
            delay: leaving ? OUT : 0,
            ease: "power3.out",
          },
        );
      };

      const flags = { wide: false, lesvos: false, readout: false, pin: false };
      const flag = (key: keyof typeof flags, on: boolean, run: () => void) => {
        if (flags[key] === on) return;
        flags[key] = on;
        run();
      };

      const pinBody = q("[data-pin-body]");
      const pinParts = [q("[data-pin-tag]"), q("[data-chip]")];
      const inset = q("[data-loupe]");
      const insetImg = q("[data-loupe-img]");
      const insetCaption = q("[data-loupe-caption]");
      const setPin = (on: boolean) => {
        root.dataset.landed = on ? "true" : "false";
        // Cancel the last landing or lift first: its delayed parts must not
        // reopen the inset after the pin has gone.
        gsap.killTweensOf(
          [
            pinBody,
            ...pinParts,
            leader,
            leaderDot,
            inset,
            insetImg,
            insetCaption,
          ].filter(Boolean),
        );
        if (on) {
          gsap.fromTo(
            pinBody,
            { autoAlpha: 0, y: -24, scale: 0.6 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              ease: "power3.out",
              overwrite: "auto",
            },
          );
          show(pinParts, true);
          gsap.to(leader, {
            strokeDashoffset: 0,
            duration: 0.5,
            delay: 0.15,
            ease: "power2.out",
            overwrite: "auto",
          });
          show(leaderDot, true);
          gsap.to(inset, {
            clipPath: "circle(50% at 50% 50%)",
            duration: 0.8,
            delay: 0.3,
            ease: "power3.out",
            overwrite: "auto",
          });
          gsap.fromTo(
            insetImg,
            { scale: 1.25 },
            { scale: 1, duration: 1.4, delay: 0.3, ease: "power2.out" },
          );
          show(insetCaption, true);
        } else {
          show([pinBody, ...pinParts, leaderDot, insetCaption], false);
          gsap.to(leader, {
            strokeDashoffset: 1,
            duration: 0.25,
            overwrite: "auto",
          });
          gsap.to(inset, {
            clipPath: "circle(0% at 50% 50%)",
            duration: 0.3,
            ease: "power1.in",
            overwrite: "auto",
          });
        }
      };

      const sync = () => {
        const entered = draw.scrollTrigger?.progress ?? 0;
        const z = zoom.scrollTrigger?.progress ?? 0;
        // The first line arrives with the stage; later lines follow the camera.
        setLine(entered < 0.12 ? -1 : z < 0.3 ? 0 : z < ARRIVE ? 1 : 2);
        flag("wide", entered > 0.8 && z < 0.08, () =>
          show(wideLabels, flags.wide),
        );
        flag("readout", entered > 0.75, () =>
          show(q("[data-readout]"), flags.readout),
        );
        flag("lesvos", z > 0.42, () => show(lesvosLabel, flags.lesvos));
        flag("pin", z >= ARRIVE, () => setPin(flags.pin));
      };
      const syncer = ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onUpdate: sync,
        onRefresh: sync,
      });
      sync();

      // Cursor: the overlay floats above the paper; a soft glint follows on the water.
      const fine = window.matchMedia("(pointer: fine)").matches;
      const glint = q<HTMLDivElement>("[data-glint]");
      const ox = gsap.quickTo(overlay, "x", { duration: 0.9, ease: "power3" });
      const oy = gsap.quickTo(overlay, "y", { duration: 0.9, ease: "power3" });
      const onMove = (event: PointerEvent) => {
        const r = stage.getBoundingClientRect();
        const nx = (event.clientX - r.left) / r.width - 0.5;
        const ny = (event.clientY - r.top) / r.height - 0.5;
        ox(nx * 14);
        oy(ny * 10);
        glint.style.setProperty("--gx", `${event.clientX - r.left}px`);
        glint.style.setProperty("--gy", `${event.clientY - r.top}px`);
        glint.style.opacity = "1";
      };
      const onLeave = () => {
        ox(0);
        oy(0);
        glint.style.opacity = "0";
      };
      if (fine) {
        stage.addEventListener("pointermove", onMove);
        stage.addEventListener("pointerleave", onLeave);
      }
      return () => {
        ro.disconnect();
        syncer.kill();
        stage.removeEventListener("pointermove", onMove);
        stage.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: track },
  );

  return (
    <div
      ref={track}
      data-origin-chart
      className="relative h-[235svh] motion-reduce:h-auto"
    >
      <style href="origin-chart" precedence="default">
        {CSS}
      </style>
      <div
        data-stage
        className="sticky top-0 h-[100svh] min-h-[560px] overflow-hidden bg-chalk motion-reduce:relative"
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ WebkitMaskImage: EDGE_MASK, maskImage: EDGE_MASK }}
        >
          {/* Sea wash, behind the chart. */}
          <div
            data-sea
            className="absolute inset-0"
            style={{
              background: SEA,
              WebkitMaskImage:
                "radial-gradient(circle at var(--sx, 66%) var(--sy, 50%), #000 calc(var(--flood, 1) * 150vmax - 6vmax), transparent calc(var(--flood, 1) * 150vmax))",
              maskImage:
                "radial-gradient(circle at var(--sx, 66%) var(--sy, 50%), #000 calc(var(--flood, 1) * 150vmax - 6vmax), transparent calc(var(--flood, 1) * 150vmax))",
            }}
          />

          <svg
            data-chart
            className="absolute inset-0 h-full w-full"
            viewBox={vbString(START)}
            preserveAspectRatio="xMidYMid slice"
          >
            <g data-grat fill="none" stroke={INK} strokeOpacity={0.085}>
              <path d={GRATICULE} />
            </g>
            <path d={LAND} fill="var(--c-chalk)" />
            <g
              data-island-g
              fill="var(--c-chalk)"
              stroke={INK}
              strokeOpacity={0.5}
              strokeLinejoin="round"
            >
              {ISLANDS.map((group) => (
                <path
                  key={group.id}
                  data-island={group.id}
                  d={group.d}
                  pathLength={1}
                />
              ))}
            </g>
            <g data-rings fill="none" strokeLinejoin="round" opacity={0}>
              {RINGS.flatMap((d, i) => [
                <path
                  key={`l${d}`}
                  data-ring
                  d={LESVOS}
                  stroke={INK}
                  strokeOpacity={0.16 - i * 0.03}
                />,
                <path key={`e${d}`} data-ring d={LESVOS} stroke={SEA} />,
              ])}
            </g>
            <path
              data-lesvos-land
              data-island="lesvos"
              d={LESVOS}
              pathLength={1}
              fill="var(--c-chalk)"
              stroke={INK}
              strokeOpacity={0.7}
              strokeLinejoin="round"
            />
            <g
              data-coast-g
              fill="none"
              stroke={INK}
              strokeOpacity={0.55}
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              {COAST.map((d, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static generated geometry
                <path key={i} data-coast d={d} pathLength={1} />
              ))}
            </g>
          </svg>
        </div>

        {/* Sunlight on the water, following the cursor. */}
        <div
          data-glint
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-700"
          style={{
            background:
              "radial-gradient(520px circle at var(--gx, 70%) var(--gy, 50%), rgb(255 255 255 / 0.9), rgb(255 255 255 / 0) 70%)",
          }}
        />

        {/* The chart dissolves into the page under the copy. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-[linear-gradient(90deg,var(--c-chalk)_0%,var(--c-chalk)_42%,rgb(250_248_244_/_0.72)_66%,rgb(250_248_244_/_0)_100%)] max-md:inset-x-0 max-md:top-0 max-md:bottom-auto max-md:h-[50%] max-md:w-auto max-md:bg-[linear-gradient(180deg,var(--c-chalk)_0%,var(--c-chalk)_52%,rgb(250_248_244_/_0.7)_72%,rgb(250_248_244_/_0)_100%)]"
        />

        {/* Labels, pin, inset: a layer that floats a little above the paper. */}
        <div
          data-overlay
          className="pointer-events-none absolute inset-0 will-change-transform"
        >
          <MapLabel id="aegeanLabel">
            <span className="font-display text-[clamp(1.05rem,0.85rem+0.6vw,1.5rem)] text-ink-2 italic tracking-[0.06em]">
              Aegean Sea
            </span>
          </MapLabel>
          <MapLabel id="cycladesLabel" className="max-md:hidden">
            <span className="font-display text-[1.05rem] text-ink-3 italic">
              Cyclades
            </span>
          </MapLabel>
          <MapLabel id="greeceLabel" className="max-md:hidden">
            <span className="eyebrow tracking-[0.32em] text-ink-3">Greece</span>
          </MapLabel>
          <MapLabel id="turkeyLabel" className="max-md:hidden">
            <span className="eyebrow tracking-[0.32em] text-ink-3">Turkey</span>
          </MapLabel>
          <MapLabel id="athens" anchor="dot">
            <span className="flex items-center gap-2">
              <span className="size-[5px] rounded-full bg-ink" />
              <span className="eyebrow text-ink">Athens</span>
            </span>
          </MapLabel>
          <MapLabel id="lesvosLabel">
            <span className="flex flex-col items-center leading-tight">
              <span className="font-display text-[clamp(1.2rem,0.95rem+0.7vw,1.7rem)] text-ink italic">
                Lesvos
              </span>
              <span className="eyebrow mt-1 text-ink-3">/ North Aegean</span>
            </span>
          </MapLabel>

          {/* Wrapped: the global `svg { display: block }` outranks utilities. */}
          <div aria-hidden className="absolute inset-0 motion-reduce:hidden">
            <svg className="h-full w-full overflow-visible">
              <path
                data-leader
                d="M0 0"
                pathLength={1}
                fill="none"
                stroke={INK}
                strokeOpacity={0.45}
                strokeWidth={1}
              />
              <circle
                data-leader-dot
                data-hide
                r={2.5}
                fill={INK}
                fillOpacity={0.6}
              />
            </svg>
          </div>

          <div
            data-pin
            className="oc-pin pointer-events-auto absolute top-0 left-0"
          >
            <div data-pin-body data-hide className="relative">
              <span className="oc-pin-ring absolute -top-[9px] -left-[9px] size-[18px] rounded-full border border-cobalt/60 bg-cobalt/10" />
              <span className="oc-pin-ring absolute -top-[9px] -left-[9px] size-[18px] rounded-full border border-cobalt/60 bg-cobalt/10" />
              <span className="absolute -top-[6px] -left-[6px] size-[12px] rounded-full border-2 border-white bg-cobalt shadow-[0_2px_10px_rgb(18_49_77_/_0.35)] transition-transform duration-500 ease-[var(--ease-out)] [.oc-pin:hover_&]:scale-125" />
            </div>
            <div
              data-pin-tag
              data-hide
              className="absolute top-0 left-4 -translate-y-1/2 whitespace-nowrap pl-2"
            >
              <span className="eyebrow text-ink">Salt pans</span>
            </div>
          </div>

          <div
            data-loupe-wrap
            className="absolute top-[74%] left-[80%] size-[clamp(150px,18vw,280px)] -translate-x-1/2 -translate-y-1/2 max-md:top-[78%] max-md:left-[70%] max-md:size-[38vw]"
          >
            <div
              data-loupe
              className="relative size-full overflow-hidden rounded-full shadow-[0_18px_50px_rgb(18_49_77_/_0.18)] ring-1 ring-white/80 motion-reduce:hidden"
            >
              <div data-loupe-img className="absolute inset-0">
                <Image
                  src={art.photo.cove.src}
                  alt={art.photo.cove.alt}
                  fill
                  sizes="(max-width: 767px) 70vw, 500px"
                  className="object-cover"
                />
              </div>
            </div>
            <p
              data-loupe-caption
              data-hide
              className="eyebrow absolute top-full left-1/2 mt-3 -translate-x-1/2 whitespace-nowrap text-ink-2 motion-reduce:hidden"
            >
              / Aegean water
            </p>
          </div>
        </div>

        {/* Copy column. */}
        <div className="absolute top-[max(16vh,110px)] left-[var(--gutter)] w-[min(36vw,500px)] max-md:top-[92px] max-md:right-[var(--gutter)] max-md:w-auto">
          <p className="rule-label eyebrow justify-between">
            <span>/ Origin</span>
            <span className="text-ink-3 max-md:hidden">
              Where it comes from
            </span>
          </p>
          <h2 className="sr-only">
            It comes from the Aegean Sea, from the island of Lesvos, from the
            salt pans of Kalloni Gulf.
          </h2>
          <div
            aria-hidden
            className="relative mt-6 h-[2.2em] font-display text-[clamp(1.75rem,1.2rem+1.7vw,3.1rem)] text-ink leading-[1.06] max-md:mt-4 motion-reduce:h-auto"
          >
            {LINES.map((line, i) => (
              <div
                key={line}
                className="absolute inset-x-0 top-0 overflow-hidden pb-[0.08em] motion-reduce:static"
              >
                <p
                  data-line={i}
                  className={`[text-wrap:balance] ${
                    i === 0
                      ? ""
                      : "motion-reduce:text-[0.62em] motion-reduce:text-ink-2"
                  }`}
                >
                  {line}
                </p>
              </div>
            ))}
          </div>
          <p className="eyebrow mt-5 flex flex-wrap gap-x-2 text-ink-2 max-md:mt-3">
            {CRUMBS.map((crumb, i) => (
              <span key={crumb} data-crumb={i} data-hide>
                / {crumb}
              </span>
            ))}
          </p>
          <p
            data-chip
            data-hide
            className="glass eyebrow mt-7 inline-flex h-9 items-center rounded-full px-4 text-ink max-md:mt-4 max-md:h-8 max-md:text-[0.625rem]"
          >
            Harvested in Greece, packaged in the USA
          </p>
        </div>

        {/* Live position readout. */}
        <div
          data-readout
          data-hide
          className="absolute top-[max(16vh,110px)] right-[var(--gutter)] w-[min(24vw,330px)] border-[var(--c-line)] border-t pt-[0.9rem] max-md:top-[92px] max-md:w-auto max-md:border-transparent"
        >
          <p className="eyebrow flex items-baseline justify-between gap-6 text-ink-3">
            <span className="max-md:hidden">/ Position</span>
            <span
              data-readout-value
              aria-hidden
              className="font-mono text-[0.8125rem] text-ink tabular-nums tracking-[0.04em]"
            >
              38.00° N · 25.50° E
            </span>
            <span className="sr-only">
              Harvest site: {HARVEST_LABEL}, Kalloni Gulf, Lesvos, Greece
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function MapLabel({
  id,
  children,
  className = "",
  anchor = "center",
}: {
  id: LabelKey;
  children: ReactNode;
  className?: string;
  anchor?: "center" | "dot";
}) {
  const [x, y] = toScreen(START, 1440, MAP.points[id]);
  return (
    <div
      data-label={id}
      className={`absolute top-0 left-0 ${className}`}
      style={{
        transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`,
      }}
    >
      <div data-hide>
        <div
          className={
            anchor === "dot"
              ? "-translate-x-[2.5px] -translate-y-1/2"
              : "-translate-x-1/2 -translate-y-1/2"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
