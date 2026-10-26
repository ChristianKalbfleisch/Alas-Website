import { geoConicConformal } from "d3-geo";
import { MAP } from "./aegean-map-data";

/** A rectangle in chart units (the SVG's user space) or in stage pixels. */
export type Box = { x: number; y: number; w: number; h: number };

/** The same projection the build script used, for the live coordinate readout. */
const projection = geoConicConformal()
  .parallels([MAP.projection.parallels[0], MAP.projection.parallels[1]])
  .rotate([MAP.projection.rotate[0], MAP.projection.rotate[1]])
  .scale(MAP.projection.scale)
  .translate([MAP.projection.translate[0], MAP.projection.translate[1]]);

export function invert(x: number, y: number): [number, number] {
  return (projection.invert?.([x, y]) ?? [0, 0]) as [number, number];
}

/**
 * The viewBox that puts `box` (chart units) inside `focus` (stage px) on a stage of
 * W x H. The viewBox keeps the stage's aspect, so nothing is ever letterboxed.
 */
export function fit(box: Box, focus: Box, W: number, H: number): Box {
  const s = Math.min(focus.w / box.w, focus.h / box.h);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return {
    x: cx - (focus.x + focus.w / 2) / s,
    y: cy - (focus.y + focus.h / 2) / s,
    w: W / s,
    h: H / s,
  };
}

/**
 * Glide between two views. Width eases on a log scale and the origin follows the
 * width, so the move is a true zoom about a fixed point: calm, never swimmy.
 */
export function between(a: Box, b: Box, t: number): Box {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const w = Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * t);
  const k = Math.abs(a.w - b.w) < 1e-6 ? t : (a.w - w) / (a.w - b.w);
  return {
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
    w,
    h: a.h + (b.h - a.h) * k,
  };
}

/** Where the camera looks on each layout. Focus areas avoid the copy column. */
export function views(W: number, H: number): { wide: Box; close: Box } {
  const L = MAP.lesvos;
  const core = MAP.core;
  // The close-up is centred on Kalloni Gulf, with the whole island in frame.
  const [gx, gy] = MAP.points.harvest;
  const lesvos: Box = {
    x: gx - 6 - (L.w * 1.46) / 2,
    y: gy + 6 - (L.h * 1.5) / 2,
    w: L.w * 1.46,
    h: L.h * 1.5,
  };
  if (W < 768) {
    return {
      wide: fit(
        { x: core.x + 40, y: core.y + 60, w: core.w - 40, h: core.h - 60 },
        { x: W * 0.03, y: H * 0.34, w: W * 0.94, h: H * 0.62 },
        W,
        H,
      ),
      close: fit(
        lesvos,
        { x: W * 0.04, y: H * 0.36, w: W * 0.92, h: H * 0.3 },
        W,
        H,
      ),
    };
  }
  return {
    wide: fit(
      core,
      { x: W * 0.4, y: H * 0.05, w: W * 0.56, h: H * 0.92 },
      W,
      H,
    ),
    close: fit(
      lesvos,
      { x: W * 0.44, y: H * 0.12, w: W * 0.5, h: H * 0.56 },
      W,
      H,
    ),
  };
}

export function toScreen(
  vb: Box,
  W: number,
  point: readonly [number, number] | readonly number[],
): [number, number] {
  const s = W / vb.w;
  return [(point[0] - vb.x) * s, (point[1] - vb.y) * s];
}

export function formatLatLon([lon, lat]: [number, number]): string {
  return `${lat.toFixed(2)}° N · ${lon.toFixed(2)}° E`;
}
