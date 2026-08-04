/**
 * Generates the BioSync Stack launcher, splash and favicon assets.
 *
 * The mark is a broken emerald→cyan ring (the "sync" motif) around a solid
 * core, drawn with 4x supersampling and written as raw PNG so the repo needs
 * no image tooling or binary design files to reproduce its icons.
 *
 * Usage: node scripts/generate-assets.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");

const BACKGROUND = [0x0b, 0x0f, 0x17];
const EMERALD = [0x10, 0xb9, 0x81];
const CYAN = [0x06, 0xb6, 0xd4];
const WHITE = [0xff, 0xff, 0xff];

const SAMPLES = 4;

/** Builds a PNG buffer from an RGBA pixel callback. */
function renderPng(size, shade) {
  const bytes = Buffer.alloc(size * (size * 4 + 1));
  let cursor = 0;

  for (let y = 0; y < size; y++) {
    bytes[cursor++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      // Supersample so the circular edges are not stair-stepped.
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const px = (x + (sx + 0.5) / SAMPLES) / size;
          const py = (y + (sy + 0.5) / SAMPLES) / size;
          const [sr, sg, sb, sa] = shade(px, py);
          r += sr * sa;
          g += sg * sa;
          b += sb * sa;
          a += sa;
        }
      }

      const total = SAMPLES * SAMPLES;
      const alpha = a / total;
      bytes[cursor++] = alpha > 0 ? Math.round(r / a) : 0;
      bytes[cursor++] = alpha > 0 ? Math.round(g / a) : 0;
      bytes[cursor++] = alpha > 0 ? Math.round(b / a) : 0;
      bytes[cursor++] = Math.round(alpha * 255);
    }
  }

  return buildPngFile(size, deflateSync(bytes, { level: 9 }));
}

function buildPngFile(size, compressed) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // colour type: RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/**
 * The mark itself, in a normalised 0–1 box.
 * `scale` shrinks it inside Android's adaptive-icon safe zone.
 */
function mark({ px, py, scale, tint, opaqueBackground }) {
  const cx = 0.5;
  const cy = 0.5;
  const dx = (px - cx) / scale;
  const dy = (py - cy) / scale;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  const background = opaqueBackground ? [...BACKGROUND, 1] : [0, 0, 0, 0];

  const RING_OUTER = 0.42;
  const RING_INNER = 0.32;
  const CORE = 0.15;

  // Gradient runs emerald (top-left) to cyan (bottom-right).
  const t = tint ? 0 : (dx / RING_OUTER + dy / RING_OUTER + 2) / 4;
  const colour = tint ?? mix(EMERALD, CYAN, Math.min(1, Math.max(0, t)));

  if (dist <= CORE) return [...colour, 1];

  if (dist <= RING_OUTER && dist >= RING_INNER) {
    // A gap at the lower right turns the ring into a "sync" arc.
    const gapCentre = Math.PI / 4;
    const delta = Math.abs(normalizeAngle(angle - gapCentre));
    if (delta < 0.42) return background;
    return [...colour, 1];
  }

  return background;
}

function normalizeAngle(a) {
  let x = a;
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x < -Math.PI) x += 2 * Math.PI;
  return x;
}

const targets = [
  {
    file: "icon.png",
    size: 1024,
    shade: (px, py) => mark({ px, py, scale: 1, opaqueBackground: true }),
  },
  {
    file: "splash-icon.png",
    size: 512,
    shade: (px, py) => mark({ px, py, scale: 1, opaqueBackground: false }),
  },
  {
    file: "favicon.png",
    size: 64,
    shade: (px, py) => mark({ px, py, scale: 1, opaqueBackground: true }),
  },
  {
    // Android shrinks the foreground into a 66% safe zone.
    file: "android-icon-foreground.png",
    size: 1024,
    shade: (px, py) => mark({ px, py, scale: 0.62, opaqueBackground: false }),
  },
  {
    file: "android-icon-background.png",
    size: 1024,
    shade: () => [...BACKGROUND, 1],
  },
  {
    file: "android-icon-monochrome.png",
    size: 1024,
    shade: (px, py) => mark({ px, py, scale: 0.62, tint: WHITE, opaqueBackground: false }),
  },
];

mkdirSync(OUT_DIR, { recursive: true });

for (const target of targets) {
  writeFileSync(join(OUT_DIR, target.file), renderPng(target.size, target.shade));
  console.log(`wrote assets/${target.file} (${target.size}x${target.size})`);
}
