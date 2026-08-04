/**
 * On-device barcode detection.
 *
 * Prefers the native BarcodeDetector API and falls back to @zxing/library
 * running in a local Web Worker. Everything stays on the device.
 */

type BarcodeDetectorCtor = new (opts?: { formats?: string[] }) => {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"];

function getNativeDetector() {
  const Ctor = (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
    .BarcodeDetector;
  if (!Ctor) return null;
  try {
    return new Ctor({ formats: FORMATS });
  } catch {
    return null;
  }
}

let worker: Worker | null = null;

function getWorker() {
  if (typeof Worker === "undefined") return null;
  worker ??= new Worker(new URL("./zxing.worker.ts", import.meta.url), { type: "module" });
  return worker;
}

function frameToPixels(video: HTMLVideoElement) {
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, width, height);
  return { ...ctx.getImageData(0, 0, width, height), width, height };
}

function decodeWithWorker(video: HTMLVideoElement): Promise<string | null> {
  const w = getWorker();
  const frame = frameToPixels(video);
  if (!w || !frame) return Promise.resolve(null);

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      w.removeEventListener("message", onMessage);
      resolve(null);
    }, 1200);

    function onMessage(e: MessageEvent) {
      clearTimeout(timer);
      w!.removeEventListener("message", onMessage);
      const data = e.data as { ok: boolean; text?: string };
      resolve(data.ok ? (data.text ?? null) : null);
    }

    w.addEventListener("message", onMessage);
    w.postMessage({ pixels: frame.data, width: frame.width, height: frame.height });
  });
}

export function nativeBarcodeSupported() {
  return typeof globalThis !== "undefined" && "BarcodeDetector" in globalThis;
}

/** Scans a single video frame for a barcode, native-first with a local fallback. */
export async function detectBarcode(video: HTMLVideoElement): Promise<string | null> {
  const native = getNativeDetector();
  if (native) {
    try {
      const codes = await native.detect(video);
      if (codes[0]?.rawValue) return codes[0].rawValue;
    } catch {
      // fall through to the local worker
    }
  }
  return decodeWithWorker(video);
}

/** Opens the rear camera stream for scanning. */
export async function startCamera(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
    audio: false,
  });
}

export function stopCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}
