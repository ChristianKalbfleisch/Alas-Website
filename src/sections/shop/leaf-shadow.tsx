"use client";

import clsx from "clsx";
import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/motion/gsap";

/** Deterministic pseudo-random, so server and client draw the same branch. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

type Leaf = { x: number; y: number; angle: number; length: number };

function branch(seed: number) {
  const rand = seeded(seed);
  // Main stem: a cubic from the top left corner sweeping down to the right.
  const p0 = [-20, 30];
  const p1 = [170, 40];
  const p2 = [330, 170];
  const p3 = [560, 250];
  const at = (t: number) => {
    const u = 1 - t;
    const x =
      u * u * u * p0[0] +
      3 * u * u * t * p1[0] +
      3 * u * t * t * p2[0] +
      t * t * t * p3[0];
    const y =
      u * u * u * p0[1] +
      3 * u * u * t * p1[1] +
      3 * u * t * t * p2[1] +
      t * t * t * p3[1];
    return [x, y];
  };
  const leaves: Leaf[] = [];
  const twigs: string[] = [];
  for (let t = 0.06; t < 0.97; t += 0.052 + rand() * 0.03) {
    const [x, y] = at(t);
    const [x2, y2] = at(Math.min(1, t + 0.01));
    const tangent = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
    const side = leaves.length % 2 === 0 ? 1 : -1;
    const spread = 28 + rand() * 32;
    const length = 46 + rand() * 40 * (1 - t * 0.35);
    leaves.push({ x, y, angle: tangent + side * spread, length });
    if (rand() > 0.62) {
      // A small twig with two leaves of its own.
      const ta = tangent + side * (50 + rand() * 20);
      const tl = 26 + rand() * 20;
      const tx = x + Math.cos((ta * Math.PI) / 180) * tl;
      const ty = y + Math.sin((ta * Math.PI) / 180) * tl;
      twigs.push(
        `M${x.toFixed(1)} ${y.toFixed(1)}L${tx.toFixed(1)} ${ty.toFixed(1)}`,
      );
      leaves.push({ x: tx, y: ty, angle: ta - 18, length: 40 + rand() * 26 });
      leaves.push({ x: tx, y: ty, angle: ta + 22, length: 36 + rand() * 24 });
    }
  }
  const stem = `M${p0.join(" ")}C${p1.join(" ")} ${p2.join(" ")} ${p3.join(" ")}`;
  return { leaves, twigs, stem };
}

const SHAPE = (len: number) => {
  const w = len * 0.16;
  return `M0 0C${len * 0.18} ${-w} ${len * 0.62} ${-w * 1.05} ${len} 0C${len * 0.62} ${w * 0.9} ${len * 0.18} ${w} 0 0Z`;
};

const A = branch(7);
const B = branch(31);

/**
 * Soft shadow of an olive branch falling across the wall, as if from a tree
 * outside the frame. Blurred twice (umbra and penumbra) so it reads as light,
 * not drawing. It breathes very slightly, like a branch in a light breeze.
 */
export function LeafShadow({ className }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const groups = el.querySelectorAll("g[data-sway]");
      groups.forEach((g, i) => {
        gsap.to(g, {
          rotation: i === 0 ? 1.4 : -1.1,
          skewX: i === 0 ? 0.8 : -0.6,
          svgOrigin: "0 30",
          duration: 5.5 + i * 1.7,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });
    },
    { scope: ref },
  );

  const draw = (shape: ReturnType<typeof branch>, key: string) => (
    <g data-sway key={key}>
      <path d={shape.stem} fill="none" stroke="currentColor" strokeWidth="4" />
      {shape.twigs.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        />
      ))}
      {shape.leaves.map((leaf) => (
        <path
          key={`${leaf.x.toFixed(2)}-${leaf.y.toFixed(2)}-${leaf.angle.toFixed(1)}`}
          d={SHAPE(leaf.length)}
          transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}) rotate(${leaf.angle.toFixed(1)})`}
          fill="currentColor"
        />
      ))}
    </g>
  );

  return (
    <svg
      ref={ref}
      viewBox="0 0 600 420"
      aria-hidden
      className={clsx("pointer-events-none text-[#26364a]", className)}
    >
      <defs>
        <filter id="leaf-umbra" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
        <filter id="leaf-penumbra" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
      </defs>
      <g
        filter="url(#leaf-penumbra)"
        opacity="0.5"
        transform="translate(10 14)"
      >
        {draw(B, "b")}
      </g>
      <g filter="url(#leaf-umbra)">{draw(A, "a")}</g>
    </svg>
  );
}
