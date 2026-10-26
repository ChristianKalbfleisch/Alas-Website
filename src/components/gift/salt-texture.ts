"use client";

/**
 * A photographic salt surface, synthesised from the real harvest photograph
 * (`art.photo.hands`): soft round patches of the salt in the wooden scoop are
 * splatted at native scale with small rotations, so the grains stay sharp and
 * real at any card size. Also cuts small grain sprites for the flying particles.
 */

const SOURCE = "/art/photo/hands-salt.jpg";
/** Patch radius in source px; centres come from the sunlit crown of the mound. */
const R = 40;
function centre(rand: () => number): [number, number] {
  // The sunlit crown of the mound: bright, dense, even grains.
  return [710 + rand() * 160, 690 + rand() * 60];
}

let photo: Promise<HTMLImageElement> | null = null;

export function loadSaltPhoto(): Promise<HTMLImageElement> {
  if (!photo) {
    photo = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => {
        photo = null;
        reject(new Error("salt photo failed to load"));
      };
      img.src = SOURCE;
    });
  }
  return photo;
}

export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SaltSurface = {
  canvas: HTMLCanvasElement;
  /** Small circular grain clumps cut from the surface, for particles. */
  grains: HTMLCanvasElement[];
};

/**
 * Paint a salt surface of w x h device pixels. `grain` is the device-pixel size
 * of one source pixel (about 0.55 x devicePixelRatio keeps grains true to life).
 */
export function buildSaltSurface(
  img: HTMLImageElement,
  w: number,
  h: number,
  grain: number,
  seed = 11,
): SaltSurface {
  const rand = seeded(seed);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { canvas, grains: [] };

  ctx.fillStyle = "#e4e7e8";
  ctx.fillRect(0, 0, w, h);

  const size = R * 2;
  const stamp = document.createElement("canvas");
  stamp.width = size;
  stamp.height = size;
  const s = stamp.getContext("2d");
  if (!s) return { canvas, grains: [] };
  const fade = s.createRadialGradient(R, R, R * 0.42, R, R, R);
  fade.addColorStop(0, "rgba(0,0,0,1)");
  fade.addColorStop(1, "rgba(0,0,0,0)");

  const footprint = size * grain;
  const count =
    Math.ceil(((w + footprint) * (h + footprint)) / (footprint * footprint)) *
    5;
  for (let i = 0; i < count; i++) {
    const [cx, cy] = centre(rand);
    s.globalCompositeOperation = "source-over";
    s.clearRect(0, 0, size, size);
    s.drawImage(img, cx - R, cy - R, size, size, 0, 0, size, size);
    s.globalCompositeOperation = "destination-in";
    s.fillStyle = fade;
    s.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(
      rand() * (w + footprint) - footprint / 2,
      rand() * (h + footprint) - footprint / 2,
    );
    ctx.rotate((rand() - 0.5) * 0.6);
    const k = grain * (0.92 + rand() * 0.3);
    ctx.scale(k, k);
    ctx.drawImage(stamp, -R, -R);
    ctx.restore();
  }

  // Grade: lift the shadows a touch, light from the upper left, soft edges.
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(0, 0, w, h);
  const light = ctx.createLinearGradient(0, 0, w, h);
  light.addColorStop(0, "rgba(255,255,255,0.22)");
  light.addColorStop(0.55, "rgba(255,255,255,0.06)");
  light.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "multiply";
  const edge = ctx.createRadialGradient(
    w * 0.45,
    h * 0.4,
    Math.min(w, h) * 0.35,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.75,
  );
  edge.addColorStop(0, "rgba(255,255,255,1)");
  edge.addColorStop(1, "rgba(214,219,224,1)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";

  // Grain clumps for particles, cut from the finished surface.
  const grains: HTMLCanvasElement[] = [];
  for (let i = 0; i < 28; i++) {
    const d = Math.round((5 + rand() * 9) * (grain / 1.1));
    const g = document.createElement("canvas");
    g.width = d;
    g.height = d;
    const gc = g.getContext("2d");
    if (!gc) continue;
    gc.drawImage(canvas, rand() * (w - d), rand() * (h - d), d, d, 0, 0, d, d);
    gc.globalCompositeOperation = "destination-in";
    const m = gc.createRadialGradient(
      d / 2,
      d / 2,
      d * 0.2,
      d / 2,
      d / 2,
      d / 2,
    );
    m.addColorStop(0, "rgba(0,0,0,1)");
    m.addColorStop(1, "rgba(0,0,0,0)");
    gc.fillStyle = m;
    gc.fillRect(0, 0, d, d);
    grains.push(g);
  }

  return { canvas, grains };
}
