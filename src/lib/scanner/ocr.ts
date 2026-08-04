/**
 * On-device expiration-date OCR helpers.
 *
 * Nothing leaves the device: frames are preprocessed on a canvas and text is
 * recognised locally, then matched against printed EXP patterns.
 */

export const EXP_REGEX =
  /(?:EXP|EXPIRES|EXP DATE|BB|BEST BEFORE|USE BY)[\s:.]*(\d{1,2}[\/.-]\d{2,4}(?:[\/.-]\d{2,4})?)/i;

const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

const ALPHA_REGEX =
  /(?:EXP|EXPIRES|BB|BEST BEFORE|USE BY)[\s:.]*([A-Z]{3})[\s.\-/]*(\d{2,4})/i;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function normaliseYear(raw: string) {
  const n = Number(raw);
  if (raw.length <= 2) return 2000 + n;
  return n;
}

/** Converts matched label text into an ISO date string (end of month when day is absent). */
export function parseExpirationText(text: string): string | null {
  const alpha = text.match(ALPHA_REGEX);
  if (alpha?.[1] && alpha[2]) {
    const month = MONTHS.indexOf(alpha[1].toLowerCase());
    if (month >= 0) {
      const year = normaliseYear(alpha[2]);
      return new Date(Date.UTC(year, month + 1, 0)).toISOString();
    }
  }

  const match = text.match(EXP_REGEX);
  const captured = match?.[1];
  if (!captured) return null;

  const parts = captured.split(/[\/.-]/).filter(Boolean);
  if (parts.length === 2) {
    const [a, b] = parts as [string, string];
    const month = Number(a);
    if (month < 1 || month > 12) return null;
    const year = normaliseYear(b);
    return new Date(Date.UTC(year, month, 0)).toISOString();
  }
  if (parts.length === 3) {
    const [a, b, c] = parts as [string, string, string];
    // Prefer DD/MM/YYYY when the first group cannot be a month.
    const dayFirst = Number(a) > 12;
    const day = dayFirst ? Number(a) : Number(b) > 12 ? Number(b) : Number(a);
    const month = dayFirst ? Number(b) : Number(b) > 12 ? Number(a) : Number(b);
    if (month < 1 || month > 12) return null;
    const year = normaliseYear(c);
    return new Date(`${year}-${pad(month)}-${pad(day)}T00:00:00.000Z`).toISOString();
  }
  return null;
}

/** Grayscale + threshold pass that makes small printed dates far easier to read. */
export function preprocessFrame(
  source: HTMLVideoElement | HTMLCanvasElement,
  width: number,
  height: number,
): ImageData | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const lum = 0.299 * px[i]! + 0.587 * px[i + 1]! + 0.114 * px[i + 2]!;
    const v = lum > 140 ? 255 : lum < 90 ? 0 : lum;
    px[i] = v;
    px[i + 1] = v;
    px[i + 2] = v;
  }
  ctx.putImageData(data, 0, 0);
  return data;
}

/**
 * Reads an expiration date from a captured frame entirely on-device.
 *
 * Uses the platform text-detection API when the browser exposes it. When it
 * does not, callers fall back to the manual entry field, which runs the very
 * same local regex parser.
 */
export async function detectExpirationOnDevice(
  video: HTMLVideoElement,
): Promise<{ iso: string | null; rawText: string | null; supported: boolean }> {
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;
  preprocessFrame(video, w, h);

  const TextDetectorCtor = (
    globalThis as unknown as { TextDetector?: new () => { detect: (s: unknown) => Promise<{ rawValue: string }[]> } }
  ).TextDetector;

  if (!TextDetectorCtor) return { iso: null, rawText: null, supported: false };

  try {
    const detector = new TextDetectorCtor();
    const blocks = await detector.detect(video);
    const rawText = blocks.map((b) => b.rawValue).join(" ");
    return { iso: parseExpirationText(rawText), rawText, supported: true };
  } catch {
    return { iso: null, rawText: null, supported: false };
  }
}
