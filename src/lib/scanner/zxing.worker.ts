/// <reference lib="webworker" />
/**
 * Local barcode decoding worker. Runs @zxing/library inside the device — no
 * frames or images are ever uploaded anywhere.
 */
import {
  BinaryBitmap,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from "@zxing/library";

const readerInstance = new MultiFormatReader();

self.onmessage = (event: MessageEvent) => {
  const { pixels, width, height } = event.data as {
    pixels: Uint8ClampedArray;
    width: number;
    height: number;
  };

  try {
    const rgb = new Int32Array(width * height);
    for (let i = 0, j = 0; i < pixels.length; i += 4, j += 1) {
      rgb[j] = (pixels[i]! << 16) | (pixels[i + 1]! << 8) | pixels[i + 2]!;
    }
    const source = new RGBLuminanceSource(rgb, width, height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));
    const result = readerInstance.decode(bitmap);
    self.postMessage({ ok: true, text: result.getText() });
  } catch {
    self.postMessage({ ok: false });
  } finally {
    readerInstance.reset();
  }
};
