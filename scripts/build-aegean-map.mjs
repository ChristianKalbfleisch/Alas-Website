#!/usr/bin/env node
/**
 * One-off: build the Aegean chart for the Origin chapter from real coastline data.
 *
 *   node scripts/build-aegean-map.mjs [--cache path/to/land-10m.json]
 *
 * Source: Natural Earth 1:10m land via world-atlas@2 (public domain).
 * Projects it with a conformal conic fitted to the Aegean, clips to a generous
 * frame, simplifies (fine near Lesvos, coarse far away), smooths the coast that is
 * seen up close, and writes static SVG path data to
 * src/sections/origin/aegean-map-data.ts so the site never fetches at runtime.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  geoBounds,
  geoCentroid,
  geoConicConformal,
  geoPath,
  geoStream,
} from "d3-geo";
import { feature } from "topojson-client";

const SRC = "https://cdn.jsdelivr.net/npm/world-atlas@2/land-10m.json";
const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/sections/origin/aegean-map-data.ts",
);

const args = process.argv.slice(2);
const cacheIdx = args.indexOf("--cache");
const cache = cacheIdx > -1 ? args[cacheIdx + 1] : null;

/* ---------- load ---------- */
let topo;
if (cache && fs.existsSync(cache)) {
  topo = JSON.parse(fs.readFileSync(cache, "utf8"));
} else {
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  topo = await res.json();
  if (cache) fs.writeFileSync(cache, JSON.stringify(topo));
}
const land = feature(topo, topo.objects.land);
const polygons = [];
for (const f of land.features) {
  const g = f.geometry;
  for (const p of g.type === "MultiPolygon" ? g.coordinates : [g.coordinates])
    polygons.push(p);
}

/* ---------- projection ---------- */
// Aegean core: Greece and the Turkish coast. 1000 units wide.
const CORE = { lon: [22, 29], lat: [34.5, 41.5] };
const HARVEST = [26.21, 39.21]; // PLACEHOLDER: Kalloni Gulf salt pans, Lesvos
const sampleBox = (lon0, lon1, lat0, lat1, n = 40) => {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([lon0 + (lon1 - lon0) * t, lat0]);
    pts.push([lon0 + (lon1 - lon0) * t, lat1]);
    pts.push([lon0, lat0 + (lat1 - lat0) * t]);
    pts.push([lon1, lat0 + (lat1 - lat0) * t]);
  }
  return { type: "MultiPoint", coordinates: pts };
};
const projection = geoConicConformal()
  .parallels([35, 41])
  .rotate([-25.5, 0])
  .fitWidth(1000, sampleBox(...CORE.lon, ...CORE.lat));
// Round the transform so the runtime can rebuild the exact same projection.
const scale = Math.round(projection.scale() * 1000) / 1000;
const translate = projection
  .translate()
  .map((v) => Math.round(v * 1000) / 1000);
projection.scale(scale).translate(translate);

const proj = (lonlat) => projection(lonlat);

// Frame: everything any viewport can show (wide desktop and tall phone).
const FRAME = { lon: [12, 35], lat: [31.5, 47.5] };
// The clip rectangle, in chart units (core = 0..1000 wide). Wide enough for a
// 21:9 desktop and a tall phone; anything beyond is never on screen.
const clip = [
  [-1350, -1050],
  [1750, 1550],
];

/* ---------- geometry helpers ---------- */
const coreBox = geoPath(projection).bounds(sampleBox(...CORE.lon, ...CORE.lat));
const coreCx = (coreBox[0][0] + coreBox[1][0]) / 2;
const coreCy = (coreBox[0][1] + coreBox[1][1]) / 2;
const harvestXY = proj(HARVEST);

// Lesvos and the facing Turkish coast are seen up close: keep them fine.
const DETAIL = { x: harvestXY[0], y: harvestXY[1], r: 120 };
function tolerance(x, y) {
  const dDetail = Math.hypot(x - DETAIL.x, y - DETAIL.y);
  if (dDetail < DETAIL.r) return 0.12;
  const dCore = Math.max(
    Math.abs(x - coreCx) - (coreBox[1][0] - coreBox[0][0]) / 2,
    Math.abs(y - coreCy) - (coreBox[1][1] - coreBox[0][1]) / 2,
    0,
  );
  if (dCore === 0) return 0.45;
  return Math.min(0.45 + dCore / 220, 2.6);
}

// Douglas-Peucker with a tolerance that depends on where the line is.
function simplify(points) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1e-9;
    let max = -1;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
      if (d > max) {
        max = d;
        idx = i;
      }
    }
    if (idx > -1) {
      const [px, py] = points[idx];
      if (max > tolerance(px, py)) {
        keep[idx] = 1;
        stack.push([a, idx], [idx, b]);
      }
    }
  }
  return points.filter((_, i) => keep[i]);
}

// Project + clip through d3 (handles the rectangle clip, keeps rings closed).
function projectGeometry(geometry) {
  const lines = [];
  let current = null;
  const stream = projection.clipExtent(clip).stream({
    point(x, y) {
      current.push([x, y]);
    },
    lineStart() {
      current = [];
    },
    lineEnd() {
      if (current.length > 1) lines.push(current);
      current = null;
    },
    polygonStart() {},
    polygonEnd() {},
    sphere() {},
  });
  // d3 streams polygons ring by ring; the line callbacks see each ring.
  geoStream({ type: "Feature", geometry }, stream);
  projection.clipExtent(null);
  return lines;
}

const r1 = (v) => Math.round(v * 10) / 10;
const _fmt = (v) => {
  const s = r1(v).toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
};

// Catmull-Rom (centripetal-ish, uniform here) to cubic segments for smooth coasts.
function inDetail([x, y]) {
  return Math.hypot(x - DETAIL.x, y - DETAIL.y) < DETAIL.r * 1.15;
}
const q10 = (v) => Math.round(v * 10);
const num = (i) => {
  // i is tenths of a unit; print the shortest form.
  const neg = i < 0;
  const a = Math.abs(i);
  const whole = Math.floor(a / 10);
  const frac = a % 10;
  let s = frac ? `${whole}.${frac}` : `${whole}`;
  if (s.startsWith("0.")) s = s.slice(1);
  return neg ? `-${s}` : s;
};
// Join numbers SVG-style: a minus sign or a leading dot can follow without a space.
const join = (nums) =>
  nums.reduce((acc, n, i) => {
    if (i === 0) return n;
    const needsSpace = !(
      n.startsWith("-") ||
      (n.startsWith(".") && /\./.test(acc.split(/[ a-zA-Z-]/).pop()))
    );
    return acc + (needsSpace ? " " : "") + n;
  }, "");

function ringToPath(pts, closed) {
  if (pts.length < 2) return "";
  const n = pts.length;
  const at = (i) =>
    closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  let cx = q10(pts[0][0]);
  let cy = q10(pts[0][1]);
  let d = `M${join([num(cx), num(cy)])}`;
  let mode = "";
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p1 = at(i);
    const p2 = at(i + 1);
    if (inDetail(p1) && inDetail(p2)) {
      const p0 = at(i - 1);
      const p3 = at(i + 2);
      const c1 = [
        q10(p1[0] + (p2[0] - p0[0]) / 6),
        q10(p1[1] + (p2[1] - p0[1]) / 6),
      ];
      const c2 = [
        q10(p2[0] - (p3[0] - p1[0]) / 6),
        q10(p2[1] - (p3[1] - p1[1]) / 6),
      ];
      const e = [q10(p2[0]), q10(p2[1])];
      const nums = [
        c1[0] - cx,
        c1[1] - cy,
        c2[0] - cx,
        c2[1] - cy,
        e[0] - cx,
        e[1] - cy,
      ].map(num);
      d +=
        (mode === "c" ? (nums[0].startsWith("-") ? "" : " ") : "c") +
        join(nums);
      mode = "c";
      cx = e[0];
      cy = e[1];
    } else if (!(closed && i === n - 1)) {
      const e = [q10(p2[0]), q10(p2[1])];
      const nums = [e[0] - cx, e[1] - cy].map(num);
      d +=
        (mode === "l" ? (nums[0].startsWith("-") ? "" : " ") : "l") +
        join(nums);
      mode = "l";
      cx = e[0];
      cy = e[1];
    }
  }
  return closed ? `${d}z` : d;
}

function dedupe(points) {
  const out = [];
  for (const p of points) {
    const q = [r1(p[0]), r1(p[1])];
    const prev = out[out.length - 1];
    if (!prev || prev[0] !== q[0] || prev[1] !== q[1]) out.push(q);
  }
  return out;
}

const insideClip = ([x, y]) =>
  x > clip[0][0] + 0.01 &&
  x < clip[1][0] - 0.01 &&
  y > clip[0][1] + 0.01 &&
  y < clip[1][1] - 0.01;

/* ---------- classify polygons ---------- */
function groupFor([lon, lat]) {
  if (lon > 25.75 && lon < 26.7 && lat > 38.9 && lat < 39.45) return "lesvos";
  if (lat > 36.25 && lat < 37.98 && lon > 24.15 && lon < 26.0)
    return "cyclades";
  if (lat > 34.7 && lat < 35.75 && lon > 23.4 && lon < 26.5) return "crete";
  if (lat > 35.3 && lat < 37.85 && lon >= 26.0 && lon < 28.6)
    return "dodecanese";
  if (lat >= 37.98 && lon > 23.3 && lon < 27.2 && lat < 41.2) return "north";
  if (lon > 21.8 && lon < 24.7 && lat > 36.0 && lat < 39.2) return "west";
  return "far";
}

const fillParts = [];
const coastMain = [];
const islands = {};
const lesvosRings = [];
let pointCount = 0;
const [L0, L1] = [FRAME.lon[0] - 4, FRAME.lon[1] + 4];
const [B0, B1] = [FRAME.lat[0] - 3, FRAME.lat[1] + 3];

for (const poly of polygons) {
  // Quick reject on raw coordinates.
  let hit = false;
  for (const [lon, lat] of poly[0]) {
    if (lon > L0 && lon < L1 && lat > B0 && lat < B1) {
      hit = true;
      break;
    }
  }
  if (!hit) continue;
  const geometry = { type: "Polygon", coordinates: poly };
  const b = geoBounds(geometry);
  const continent =
    b[0][0] < FRAME.lon[0] ||
    b[1][0] > FRAME.lon[1] ||
    b[0][1] < FRAME.lat[0] ||
    b[1][1] > FRAME.lat[1];

  // Fill: clipped polygon rings.
  const rings = projectGeometry(geometry)
    .map((ring) => dedupe(simplify(ring)))
    .filter((ring) => ring.length > 3);
  if (!rings.length) continue;

  // Skip specks far from the Aegean.
  const xs = rings[0].map((p) => p[0]);
  const ys = rings[0].map((p) => p[1]);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  const centroid = geoCentroid(geometry);
  const group = continent ? "main" : groupFor(centroid);
  const nearCore =
    centroid[0] > 21 &&
    centroid[0] < 30 &&
    centroid[1] > 34 &&
    centroid[1] < 42;
  if (!continent && Math.max(w, h) < (nearCore ? 0.9 : 3)) continue;

  const ringPaths = rings.map((ring) => ringToPath(ring, true)).join("");
  pointCount += rings.reduce((s, r) => s + r.length, 0);

  if (continent) {
    fillParts.push(ringPaths);
    // Coast: the same rings as lines, cut wherever they run along the frame.
    for (const ring of rings) {
      let run = [];
      for (let i = 0; i < ring.length; i++) {
        const p = ring[i];
        const q = ring[(i + 1) % ring.length];
        const onEdge = !insideClip(p) && !insideClip(q);
        if (onEdge) {
          if (run.length > 1) coastMain.push(run);
          run = [];
        } else {
          if (!run.length) run.push(p);
          run.push(q);
        }
      }
      if (run.length > 1) coastMain.push(run);
    }
  } else if (group === "lesvos") {
    lesvosRings.push(ringPaths);
  } else {
    islands[group] = (islands[group] ?? "") + ringPaths;
  }
}

// Order coast runs longest first (the long Greek-Turkish line is the hero stroke).
coastMain.sort((a, b) => b.length - a.length);
// Split the hero run at Piraeus so the pen starts at Athens and runs both ways.
{
  const [px, py] = proj([23.62, 37.94]);
  const run = coastMain[0];
  let best = 0;
  let bestD = Number.POSITIVE_INFINITY;
  run.forEach(([x, y], i) => {
    const d = Math.hypot(x - px, y - py);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  const west = run.slice(0, best + 1).reverse();
  const east = run.slice(best);
  coastMain.splice(0, 1, east, west);
}
const coastPaths = coastMain
  .filter((run) => run.length > 2)
  .map((run) => ringToPath(run, false));

/* ---------- graticule (every 1 degree, drawn as fine lines) ---------- */
const grat = [];
for (let lon = 12; lon <= 36; lon += 1) {
  const pts = [];
  for (let lat = 31; lat <= 47.001; lat += 1) pts.push(proj([lon, lat]));
  grat.push(
    ringToPath(
      pts.map((p) => [r1(p[0]), r1(p[1])]),
      false,
    ),
  );
}
for (let lat = 31; lat <= 47; lat += 1) {
  const pts = [];
  for (let lon = 12; lon <= 36.001; lon += 1) pts.push(proj([lon, lat]));
  grat.push(
    ringToPath(
      pts.map((p) => [r1(p[0]), r1(p[1])]),
      false,
    ),
  );
}

/* ---------- points ---------- */
const pt = (lonlat) => proj(lonlat).map(r1);
const points = {
  harvest: pt(HARVEST),
  athens: pt([23.727, 37.984]),
  aegeanLabel: pt([25.05, 38.72]),
  cycladesLabel: pt([24.95, 36.92]),
  lesvosLabel: pt([26.02, 39.47]),
  greeceLabel: pt([22.15, 39.55]),
  turkeyLabel: pt([28.6, 38.95]),
};

// Lesvos bounds, for the close-up framing.
const lesvosGeo = polygons.find((p) => {
  const c = geoCentroid({ type: "Polygon", coordinates: p });
  return c[0] > 25.75 && c[0] < 26.7 && c[1] > 38.9 && c[1] < 39.45;
});
const lb = geoPath(projection).bounds({
  type: "Polygon",
  coordinates: lesvosGeo,
});

const data = {
  projection: { scale, translate, rotate: [-25.5, 0], parallels: [35, 41] },
  frame: {
    x: clip[0][0],
    y: clip[0][1],
    w: clip[1][0] - clip[0][0],
    h: clip[1][1] - clip[0][1],
  },
  core: {
    x: r1(coreBox[0][0]),
    y: r1(coreBox[0][1]),
    w: r1(coreBox[1][0] - coreBox[0][0]),
    h: r1(coreBox[1][1] - coreBox[0][1]),
  },
  lesvos: {
    x: r1(lb[0][0]),
    y: r1(lb[0][1]),
    w: r1(lb[1][0] - lb[0][0]),
    h: r1(lb[1][1] - lb[0][1]),
  },
  points,
};

const header = `/**
 * GENERATED by scripts/build-aegean-map.mjs. Do not edit by hand.
 * Natural Earth 1:10m land (world-atlas@2, public domain), conformal conic
 * (parallels 35° and 41° N, central meridian 25.5° E), 1 unit ≈ 0.6 km.
 * The harvest point is a PLACEHOLDER (Kalloni Gulf salt pans, Lesvos) until
 * the owners confirm the real site.
 */
`;
const ISLAND_ORDER = [
  "far",
  "west",
  "crete",
  "cyclades",
  "dodecanese",
  "north",
];
const body = `${header}
export const MAP = ${JSON.stringify(data, null, 2)} as const;

/** Land fill for the mainland (clipped to the frame). */
export const LAND = ${JSON.stringify(fillParts.join(""))};

/** Mainland coastline as open lines (no frame edges), longest first. */
export const COAST: readonly string[] = ${JSON.stringify(coastPaths)};

/** Islands grouped so they can surface in a sweep that ends at Lesvos. */
export const ISLANDS: readonly { id: string; d: string }[] = ${JSON.stringify(
  ISLAND_ORDER.filter((id) => islands[id]).map((id) => ({
    id,
    d: islands[id],
  })),
)};

/** Lesvos, drawn on its own so it can be lifted at the close-up. */
export const LESVOS = ${JSON.stringify(lesvosRings.join(""))};

/** One-degree graticule. */
export const GRATICULE = ${JSON.stringify(grat.join(""))};
`;
fs.writeFileSync(OUT, body);

const previewIdx = args.indexOf("--preview");
if (previewIdx > -1) {
  const dir = args[previewIdx + 1];
  fs.mkdirSync(dir, { recursive: true });
  const islandsD = Object.values(islands).join("");
  const svg = (vb, sw) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="1400" style="background:#e9f3f4"><path d="${grat.join("")}" fill="none" stroke="#12314d" stroke-opacity=".12" stroke-width="${sw}"/><path d="${fillParts.join("")}" fill="#faf8f4"/><path d="${islandsD}${lesvosRings.join("")}" fill="#faf8f4" stroke="#12314d" stroke-width="${sw}"/><path d="${coastPaths.join("")}" fill="none" stroke="#12314d" stroke-width="${sw}"/><circle cx="${points.harvest[0]}" cy="${points.harvest[1]}" r="${sw * 4}" fill="#1f4fa3"/></svg>`;
  fs.writeFileSync(
    path.join(dir, "wide.svg"),
    svg(
      `${clip[0][0]} ${clip[0][1]} ${clip[1][0] - clip[0][0]} ${clip[1][1] - clip[0][1]}`,
      1.5,
    ),
  );
  fs.writeFileSync(path.join(dir, "core.svg"), svg("-150 -100 1300 1420", 0.8));
  fs.writeFileSync(
    path.join(dir, "lesvos.svg"),
    svg(
      `${lb[0][0] - 40} ${lb[0][1] - 30} ${lb[1][0] - lb[0][0] + 80} ${lb[1][1] - lb[0][1] + 60}`,
      0.15,
    ),
  );
}
console.log(
  `wrote ${path.relative(process.cwd(), OUT)}: ${(body.length / 1024).toFixed(1)} KB, ` +
    `${pointCount} pts, ${coastPaths.length} coast runs, islands ${Object.entries(
      islands,
    )
      .map(([k, v]) => `${k}:${v.length}`)
      .join(" ")}, lesvos ${lesvosRings.join("").length} chars`,
);
console.log("frame", data.frame, "core", data.core, "lesvos", data.lesvos);
console.log("harvest", points.harvest);
