"use client";

import { useEffect, useRef } from "react";
import { HERO_SEA } from "@/data/hero-sea";
import { fullFrameProgram, pictureTexture, wantsStill } from "./water-gl";

/**
 * How the water moves. One number to turn it up or down: at 1 the nearest
 * water takes about nine seconds to drift a sixth of the band toward the ledge.
 */
const PACE = 1.6;
/** How long after a change of scene the photographs may still be fading, in milliseconds. */
const SETTLE_MS = 1600;
/** The masks in the sheet: the empty ledge, then one per scene. */
const MASKS = HERO_SEA.scenes.length + 1;

/**
 * The sheet holds the sea on top and, beneath it, one block per mask: where
 * the water is open on the empty ledge, then in each scene. The sea is the
 * same in every scene, only what stands in front of it changes, so the water
 * is drawn once and never starts again. Each point of water is drawn twice, a
 * little ahead of and a little behind where it lies, and the two are blended
 * as one fades into the other: the surface drifts toward the ledge without
 * ever jumping back. Far water barely moves, near water moves most, and
 * nothing moves where something stands. While one scene gives way to the
 * next, each mask counts for as much as its photograph can be seen.
 */
const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 at;
uniform sampler2D sheet;
uniform float horizon;
uniform float edge;
uniform float phase;
uniform vec3 swell;
uniform float seen[${MASKS}];

vec3 block(vec2 p, float which) {
  return texture2D(sheet, vec2(p.x, (which + clamp(p.y, edge, 1.0 - edge)) / ${MASKS + 1}.0)).rgb;
}
vec3 sea(vec2 p) {
  return block(p, 0.0);
}
// How open the water is here: each mask, for as much as its photograph shows.
float water(vec2 p) {
  float open = 0.0;
  for (int i = 0; i < ${MASKS}; i++) {
    if (seen[i] > 0.002) open += seen[i] * block(p, float(i) + 1.0).r;
  }
  return open;
}
// The same water with its own swell drawn out a little: each point is set
// against the rows just above and below it, and what differs is strengthened.
// A dusk sea is dark, and without this its movement cannot be seen.
vec3 lively(vec2 p) {
  vec3 here = sea(p);
  vec2 row = vec2(0.0, edge * 5.0);
  vec3 around = (sea(p + row) + sea(p - row) + sea(p + 2.0 * row) + sea(p - 2.0 * row)) * 0.25;
  vec3 swell = here - around;
  // Light is drawn out more than dark: the crests catch the sky.
  return here + max(swell, 0.0) * 3.2 + min(swell, 0.0) * 1.1;
}

void main() {
  float open = water(at);
  if (open < 0.004) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float depth = clamp((at.y - horizon) / (1.0 - horizon), 0.0, 1.0);
  float near = mix(0.10, 1.0, pow(depth, 1.25));
  float rise = sin(at.x * 7.0 + depth * 30.0 - swell.x)
    + 0.6 * sin(at.x * -4.0 + depth * 47.0 - swell.y + 1.7)
    + 0.4 * sin(at.x * 13.0 + depth * 19.0 - swell.z + 4.1);
  vec2 bob = vec2(0.0, rise * 0.008) * near * open;
  vec2 drift = vec2(0.035, 0.176) * near * open;
  float stagger = 0.2 * (sin(at.x * 23.0 + at.y * 7.0) + sin(at.x * -11.0 + at.y * 29.0));
  float first = fract(phase + stagger);
  float second = fract(first + 0.5);
  vec3 a = lively(at - drift * (first - 0.5) + bob);
  vec3 b = lively(at - drift * (second - 0.5) + bob);
  vec3 colour = mix(b, a, 1.0 - abs(2.0 * first - 1.0));
  gl_FragColor = vec4(colour * open, open);
}`;

type HeroSeaProps = {
  /** The scene on show, by its place in HERO_SEA.scenes. */
  scene: number;
};

/**
 * The living part of the hero photographs. A clear sheet laid over the band of
 * open sea, on which that same water is redrawn drifting slowly toward the
 * ledge. It is worked out as it plays, so it never repeats like a clip, and it
 * goes on without a break when one scene gives way to the next. The photograph
 * beneath is whole without it: a visitor who asks for less motion, or whose
 * browser cannot draw it, simply sees the still.
 *
 * It reads the scenes from the photographs beside it (.hero-shot, each naming
 * its mask in data-sea), so the water always agrees with what can be seen.
 */
export function HeroSea({ scene }: HeroSeaProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const turn = useRef<(to: number) => void>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    if (wantsStill()) return;
    const gl = el.getContext("webgl", {
      premultipliedAlpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const program = fullFrameProgram(gl, FRAGMENT);
    if (!program) return;
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const at = {
      edge: uniform("edge"),
      phase: uniform("phase"),
      swell: uniform("swell"),
      seen: uniform("seen"),
    };
    const span = HERO_SEA.bottom - HERO_SEA.top;
    gl.uniform1f(uniform("horizon"), (HERO_SEA.horizon - HERO_SEA.top) / span);

    let alive = true;
    let texture: WebGLTexture | null = null;
    /** The widest the sheet is worth drawing at: it holds no more than this. */
    let most = 0;
    let inView = false;
    let clock = 0;
    let last = 0;
    let frame = 0;
    /** The scene on show, the photographs from the top one down, and when they last changed. */
    let shown = Number(el.dataset.scene ?? 0);
    let stack: HTMLElement[] = [];
    let since = Number.NEGATIVE_INFINITY;
    const seen = new Float32Array(MASKS);

    // How much of each mask shows: at rest the scene on show alone. While the
    // photographs fade, each one counts for what is seen of it from above, and
    // the empty ledge for whatever shows through them all.
    const weigh = (changing: boolean) => {
      seen.fill(0);
      if (!changing || stack.length === 0) {
        seen[shown + 1] = 1;
        return;
      }
      let through = 1;
      for (const shot of stack) {
        const solid = Number(getComputedStyle(shot).opacity);
        seen[Number(shot.dataset.sea) + 1] += through * solid;
        through *= 1 - solid;
      }
      seen[0] = through;
    };

    const draw = (now: number) => {
      frame = 0;
      if (!alive || !texture || !inView || document.hidden) return;
      frame = requestAnimationFrame(draw);
      const changing = now - since < SETTLE_MS;
      // Water this slow is drawn thirty times a second, not sixty, except
      // while a scene is changing.
      if (!changing && now - last < 30) return;
      clock += Math.min(now - last, 100) / 1000;
      last = now;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.min(Math.round(el.clientWidth * scale), most);
      const height = Math.round((width * el.clientHeight) / el.clientWidth);
      if (!width || !height) return;
      if (el.width !== width || el.height !== height) {
        el.width = width;
        el.height = height;
      }
      const time = clock * PACE;
      weigh(changing);
      gl.viewport(0, 0, width, height);
      gl.uniform1f(at.phase, (time * 0.11) % 1);
      gl.uniform3f(
        at.swell,
        (time * 0.5) % (Math.PI * 2),
        (time * 0.37) % (Math.PI * 2),
        (time * 0.61) % (Math.PI * 2),
      );
      gl.uniform1fv(at.seen, seen);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const wake = () => {
      if (frame || !texture || !inView || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(draw);
    };

    // A change of scene: the water goes on as it was, and where it is open
    // follows the photographs as they fade. The one arriving lies on top, the
    // one leaving under it, any other beneath them.
    turn.current = (next: number) => {
      if (next === shown) return;
      shown = next;
      const shots = Array.from(
        el.parentElement?.querySelectorAll<HTMLElement>(".hero-shot") ?? [],
      );
      const level = (shot: HTMLElement) =>
        shot.dataset.on === "true" ? 2 : shot.dataset.under === "true" ? 1 : 0;
      stack = shots.reverse().sort((a, b) => level(b) - level(a));
      since = performance.now();
      wake();
    };

    const watch = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      wake();
    });
    watch.observe(el);
    document.addEventListener("visibilitychange", wake);

    // The page comes first: the water is fetched once everything else has loaded.
    const begin = () => {
      const pixels = el.clientWidth * Math.min(window.devicePixelRatio || 1, 2);
      const image = new Image();
      image.decoding = "async";
      image.src = pixels > 1300 ? HERO_SEA.wide : HERO_SEA.small;
      image
        .decode()
        .then(() => {
          if (!alive) return;
          texture = pictureTexture(gl, image);
          if (!texture) return;
          most = image.naturalWidth;
          gl.uniform1f(at.edge, (1.5 * (MASKS + 1)) / image.naturalHeight);
          el.dataset.on = "true";
          wake();
        })
        .catch(() => {});
    };
    if (document.readyState === "complete") begin();
    else window.addEventListener("load", begin, { once: true });

    const lost = (event: Event) => {
      event.preventDefault();
      texture = null;
      el.dataset.on = "false";
    };
    el.addEventListener("webglcontextlost", lost);

    return () => {
      alive = false;
      turn.current = null;
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("load", begin);
      document.removeEventListener("visibilitychange", wake);
      el.removeEventListener("webglcontextlost", lost);
      watch.disconnect();
      // The drawing surface itself is kept: React may set this up again on the
      // same canvas, and a surface that was thrown away cannot be reused.
      if (texture) gl.deleteTexture(texture);
      gl.deleteProgram(program);
    };
  }, []);

  useEffect(() => {
    turn.current?.(scene);
  }, [scene]);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      className="hero-sea"
      data-on="false"
      data-scene={scene}
      style={{
        top: `${HERO_SEA.top * 100}%`,
        height: `${(HERO_SEA.bottom - HERO_SEA.top) * 100}%`,
      }}
    />
  );
}
