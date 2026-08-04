import { useEffect, useRef, useState } from "react";
import { Barcode, Camera, Cpu, ScanLine, X } from "lucide-react";

import {
  detectBarcode,
  nativeBarcodeSupported,
  startCamera,
  stopCamera,
} from "../lib/scanner/barcode";
import { detectExpirationOnDevice, parseExpirationText } from "../lib/scanner/ocr";
import { useStack } from "../lib/stack-store";
import { mockScanResult, type SupplementItem } from "../lib/supplements";

export interface ScanDraft {
  brand: string;
  name: string;
  totalPills: number;
  priceEstimate: number;
  expirationDate: string;
  barcode?: string | undefined;
  servingSize?: string | undefined;
}

export function ScannerOverlay({
  mode,
  onClose,
  onConfirm,
}: {
  mode: "barcode" | "ocr";
  onClose: () => void;
  onConfirm: (draft: ScanDraft) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [draft, setDraft] = useState<ScanDraft | null>(null);
  const [manual, setManual] = useState("");
  const [status, setStatus] = useState("Align label inside the frame");
  const { lookupBarcode, saveCatalogEntry } = useStack();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stream = await startCamera();
        if (cancelled) {
          stopCamera(stream);
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch {
        setCameraError("Camera unavailable on this device — use manual entry below.");
      }
    })();
    return () => {
      cancelled = true;
      stopCamera(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const scanFrame = async () => {
    const video = videoRef.current;
    if (!video) return;
    setScanning(true);
    setStatus("Processing on-device…");

    if (mode === "barcode") {
      const code = await detectBarcode(video);
      if (code) {
        const known = await lookupBarcode(code);
        setDraft({
          brand: known?.brand ?? mockScanResult.brand,
          name: known?.name ?? mockScanResult.name,
          totalPills: known?.totalPills ?? mockScanResult.totalPills,
          priceEstimate: known?.priceEstimate ?? mockScanResult.priceEstimate,
          expirationDate: mockScanResult.expirationDate,
          servingSize: known?.servingSize ?? mockScanResult.servingSize,
          barcode: code,
        });
        setStatus(`Decoded ${code} locally`);
      } else {
        setStatus("No barcode found — hold steadier or use manual entry");
      }
    } else {
      const { iso, supported } = await detectExpirationOnDevice(video);
      if (iso) {
        setDraft({ ...mockScanResult, expirationDate: iso });
        setStatus("Expiration date parsed on-device");
      } else {
        setStatus(
          supported
            ? "Couldn't read the date — type what's printed below"
            : "On-device text reading unsupported here — type what's printed below",
        );
      }
    }
    setScanning(false);
  };

  const submitManual = () => {
    const iso = parseExpirationText(manual) ?? parseExpirationText(`EXP ${manual}`);
    if (mode === "ocr") {
      if (!iso) {
        setStatus("Try a format like EXP 11/2027");
        return;
      }
      setDraft({ ...mockScanResult, expirationDate: iso });
      setStatus("Parsed locally with the label regex");
      return;
    }
    void (async () => {
      const known = await lookupBarcode(manual.trim());
      setDraft({
        brand: known?.brand ?? mockScanResult.brand,
        name: known?.name ?? mockScanResult.name,
        totalPills: known?.totalPills ?? mockScanResult.totalPills,
        priceEstimate: known?.priceEstimate ?? mockScanResult.priceEstimate,
        expirationDate: mockScanResult.expirationDate,
        servingSize: known?.servingSize ?? mockScanResult.servingSize,
        barcode: manual.trim(),
      });
      setStatus(known ? "Matched your local catalog" : "New barcode — saved to local catalog");
    })();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-sm font-semibold">
          {mode === "barcode" ? "Barcode Quick-Scan" : "Expiration Date OCR"}
        </p>
        <button aria-label="Close scanner" onClick={onClose}>
          <X className="size-5 text-muted-foreground" />
        </button>
      </div>

      <p className="mt-2 flex items-center gap-1.5 px-5 text-[10px] text-muted-foreground">
        <Cpu className="size-3 text-emerald" />
        {mode === "barcode"
          ? nativeBarcodeSupported()
            ? "Native BarcodeDetector active"
            : "Local ZXing worker fallback active"
          : "Local regex label parser — no images uploaded"}
      </p>

      <div className="mx-5 mt-3 aspect-[4/5] overflow-hidden rounded-3xl border border-cyan/40 bg-surface">
        <div className="relative size-full">
          <video
            ref={videoRef}
            playsInline
            muted
            className="size-full object-cover"
            aria-label="Camera preview"
          />
          <div className="absolute inset-6 rounded-2xl border-2 border-dashed border-cyan/40" />
          {!draft ? (
            <div className="absolute inset-x-6 top-0 h-1 animate-scan rounded-full bg-cyan shadow-[0_0_24px_4px_var(--cyan)]" />
          ) : null}
          <div className="absolute inset-x-3 bottom-3 rounded-xl bg-background/70 px-3 py-2 text-center text-[11px] text-muted-foreground">
            {cameraError ?? status}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {draft ? (
          <div className="rounded-3xl border border-emerald/30 bg-emerald/5 p-4 text-xs">
            <p className="text-sm font-semibold">{draft.name}</p>
            <p className="text-muted-foreground">{draft.brand}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <dt className="text-muted-foreground">Serving size</dt>
                <dd>{draft.servingSize ?? "2 capsules"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pill count</dt>
                <dd>{draft.totalPills}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Expiration</dt>
                <dd className="text-emerald">
                  {new Date(draft.expirationDate).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Est. price</dt>
                <dd>${draft.priceEstimate.toFixed(2)}</dd>
              </div>
            </dl>
            <button
              onClick={() => {
                if (draft.barcode) {
                  saveCatalogEntry({
                    barcode: draft.barcode,
                    brand: draft.brand,
                    name: draft.name,
                    servingSize: draft.servingSize ?? "2 capsules",
                    totalPills: draft.totalPills,
                    priceEstimate: draft.priceEstimate,
                    activeIngredients: [],
                  });
                }
                onConfirm(draft);
              }}
              className="mt-4 w-full rounded-2xl bg-emerald py-3 text-sm font-semibold text-primary-foreground glow-emerald"
            >
              Add to cabinet
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => void scanFrame()}
              disabled={scanning}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan/15 py-3 text-sm font-semibold text-cyan disabled:opacity-60"
            >
              {mode === "barcode" ? (
                <Barcode className="size-4" />
              ) : (
                <Camera className="size-4" />
              )}
              {scanning ? "Scanning…" : "Capture"}
            </button>
            <div className="flex gap-2">
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder={mode === "barcode" ? "Type barcode digits" : "EXP 11/2027"}
                className="min-w-0 flex-1 rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs outline-none focus:border-cyan/60"
              />
              <button
                onClick={submitManual}
                className="rounded-2xl bg-muted px-4 text-xs font-medium text-foreground"
              >
                Parse
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function scanDraftToItem(draft: ScanDraft): Omit<SupplementItem, "id"> {
  return {
    brand: draft.brand,
    name: draft.name,
    category: "general",
    totalPills: draft.totalPills,
    remainingPills: draft.totalPills,
    dailyDose: 2,
    timeOfDay: "morning",
    expirationDate: draft.expirationDate,
    takenToday: false,
    takeWithFood: true,
    affiliateUrl: "https://iherb.com/pr/two-per-day?rcode=BIOSTACK",
    priceEstimate: draft.priceEstimate,
    ...(draft.barcode ? { barcode: draft.barcode } : {}),
  };
}

export const ScannerHint = ScanLine;
