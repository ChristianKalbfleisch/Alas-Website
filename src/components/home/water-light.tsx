"use client";

import { useEffect, useRef } from "react";
import { SHALLOWS } from "@/data/hero-sea";
import { fullFrameProgram, pictureTexture, wantsStill } from "./water-gl";

/** How fast the light moves: one number to turn it up or down. */
const PACE = 0.7;
/** The picture is drawn at least this wide, so a narrow screen shows part of it, never a blown-up strip. */
const MIN_WIDTH = 880;
/** The most pixels drawn per frame: soft light needs no more. */
const MOST_PIXELS = 1_800_000;

/**
 * Sunlit shallows, alive. The water drifts and ripples a little, and a second
 * sheet of the same light slides across it the other way: where that sheet is
 * bright the water brightens, where it is dull the water deepens. The picture
 * repeats as its own mirror image, so it never shows a seam.
 */
const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 at;
uniform sampler2D photo;
uniform vec2 span;
uniform vec4 slide;
uniform vec4 ripple;

vec3 water(vec2 p) {
  p = 1.0 - abs(mod(p, 2.0) - 1.0);
  return texture2D(photo, p).rgb;
}

void main() {
  // Upside down, so the clearest blue of the picture lies under the heading.
  vec2 p = vec2(at.x * span.x, 1.0 - at.y * span.y);
  vec2 a = p + slide.xy
    + 0.006 * vec2(sin(p.y * 9.0 + ripple.x), cos(p.x * 8.0 + ripple.y));
  vec2 b = p * 0.87 + 0.31 + slide.zw
    + 0.007 * vec2(cos(p.y * 7.0 - ripple.z), sin(p.x * 10.0 + ripple.w));
  float light = dot(water(b), vec3(0.299, 0.587, 0.114));
  gl_FragColor = vec4(water(a) * (1.0 + 1.25 * (light - 0.8)), 1.0);
}`;

const TURN = Math.PI * 2;

/**
 * The water behind the shop, moving. It is laid over the same still picture,
 * so a visitor who asks for less motion, or whose browser cannot draw it,
 * sees the still. It is fetched only as the shop comes near, and rests while
 * it is out of view.
 */
export function WaterLight({ className }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el || wantsStill()) return;
    const gl = el.getContext("webgl", {
      antialias: false,
      powerPreference: "low-power",
    });
    if (!gl) return;
    const program = fullFrameProgram(gl, FRAGMENT);
    if (!program) return;
    const at = {
      span: gl.getUniformLocation(program, "span"),
      slide: gl.getUniformLocation(program, "slide"),
      ripple: gl.getUniformLocation(program, "ripple"),
    };

    let alive = true;
    let asked = false;
    let ready = false;
    let inView = false;
    let clock = 0;
    let last = 0;
    let frame = 0;

    const draw = (now: number) => {
      frame = 0;
      if (!alive || !ready || !inView || document.hidden) return;
      frame = requestAnimationFrame(draw);
      if (now - last < 30) return;
      clock += Math.min(now - last, 100) / 1000;
      last = now;
      const wide = el.clientWidth;
      const tall = el.clientHeight;
      if (!wide || !tall) return;
      const scale = Math.min(
        window.devicePixelRatio || 1,
        1.5,
        Math.sqrt(MOST_PIXELS / (wide * tall)),
      );
      const width = Math.round(wide * scale);
      const height = Math.round(tall * scale);
      if (el.width !== width || el.height !== height) {
        el.width = width;
        el.height = height;
      }
      const shown = Math.max(wide, MIN_WIDTH);
      const time = clock * PACE;
      gl.viewport(0, 0, width, height);
      gl.uniform2f(at.span, wide / shown, tall / (shown / SHALLOWS.ratio));
      gl.uniform4f(
        at.slide,
        (time * 0.006) % 2,
        (time * 0.004) % 2,
        (time * -0.011) % 2,
        (time * 0.008) % 2,
      );
      gl.uniform4f(
        at.ripple,
        (time * 0.33) % TURN,
        (time * 0.29) % TURN,
        (time * 0.26) % TURN,
        (time * 0.31) % TURN,
      );
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const wake = () => {
      if (frame || !ready || !inView || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(draw);
    };

    const fetchPicture = () => {
      if (asked) return;
      asked = true;
      const image = new Image();
      image.decoding = "async";
      image.src = SHALLOWS.src;
      image
        .decode()
        .then(() => {
          if (!alive || !pictureTexture(gl, image)) return;
          ready = true;
          el.dataset.on = "true";
          wake();
        })
        .catch(() => {});
    };

    // Fetched a screen before it is needed; drawn only while it is in view.
    const near = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchPicture();
      },
      { rootMargin: "100% 0px" },
    );
    const seen = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      wake();
    });
    near.observe(el);
    seen.observe(el);
    document.addEventListener("visibilitychange", wake);

    const lost = (event: Event) => {
      event.preventDefault();
      ready = false;
      el.dataset.on = "false";
    };
    el.addEventListener("webglcontextlost", lost);

    return () => {
      alive = false;
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", wake);
      el.removeEventListener("webglcontextlost", lost);
      near.disconnect();
      seen.disconnect();
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas ref={canvas} aria-hidden className={className} data-on="false" />
  );
}
