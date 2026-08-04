import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Barcode, Camera, Minus, Pill, Plus, RefreshCw, ScanLine, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "../components/PageHeader";
import { ScannerOverlay, scanDraftToItem } from "../components/ScannerOverlay";
import { useStack, useStackStats } from "../lib/stack-store";
import { categoryLabels, expirationLabel, type Category } from "../lib/supplements";

export const Route = createFileRoute("/cabinet")({
  head: () => ({
    meta: [
      { title: "Supplement Cabinet — BioStack AI" },
      {
        name: "description",
        content:
          "Inventory, pill counts and expiration tracking for your entire supplement cabinet.",
      },
      { property: "og:title", content: "Supplement Cabinet — BioStack AI" },
      {
        property: "og:description",
        content: "Scan barcodes and expiration dates to keep your cabinet accurate.",
      },
    ],
  }),
  component: CabinetPage,
});

const filters: ("all" | Category)[] = [
  "all",
  "longevity",
  "sleep",
  "focus",
  "recovery",
];

function CabinetPage() {
  const { items, refill, remove, adjustDose, addItem } = useStack();
  const stats = useStackStats();
  const [filter, setFilter] = useState<"all" | Category>("all");
  const [scanner, setScanner] = useState<null | "barcode" | "ocr">(null);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );

  return (
    <div>
      <PageHeader eyebrow={`$${stats.value.toFixed(0)} cabinet value`} title="Cabinet">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {stats.total} active supplements tracked
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-emerald/15 text-emerald"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {f === "all" ? "All" : categoryLabels[f]}
              </button>
            ))}
          </div>
        </div>
      </PageHeader>

      <div className="space-y-4 px-5 py-5">
        <div className="rounded-3xl border border-cyan/25 bg-cyan/5 p-4 glow-cyan">
          <div className="flex items-center gap-2 text-cyan">
            <ScanLine className="size-4" />
            <p className="text-sm font-semibold">Scan New Supplement</p>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Auto-fill brand, serving size, pill count and expiration in seconds.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setScanner("barcode")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-cyan/15 px-3 py-2.5 text-xs font-medium text-cyan"
            >
              <Barcode className="size-4" /> Barcode
            </button>
            <button
              onClick={() => setScanner("ocr")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-muted px-3 py-2.5 text-xs font-medium text-foreground"
            >
              <Camera className="size-4" /> Expiry OCR
            </button>
          </div>
        </div>

        <ul className="space-y-3">
          {visible.map((item) => {
            const exp = expirationLabel(item);
            const pct = Math.round((item.remainingPills / item.totalPills) * 100);
            return (
              <li
                key={item.id}
                className="rounded-3xl border border-border/70 bg-card/70 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald/20 to-cyan/20">
                    <Pill className="size-5 text-emerald" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.brand} · {categoryLabels[item.category]}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                      exp.tone === "emerald"
                        ? "bg-emerald/15 text-emerald"
                        : exp.tone === "amber"
                          ? "bg-amber/15 text-amber"
                          : "bg-crimson/15 text-crimson"
                    }`}
                  >
                    {exp.text}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>
                      {item.remainingPills}/{item.totalPills} pills left
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct < 20 ? "bg-crimson" : pct < 40 ? "bg-amber" : "bg-emerald"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                    <button
                      aria-label="Decrease dose"
                      onClick={() => adjustDose(item.id, -1)}
                      className="text-muted-foreground"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-14 text-center text-[11px]">
                      {item.dailyDose}/day
                    </span>
                    <button
                      aria-label="Increase dose"
                      onClick={() => adjustDose(item.id, 1)}
                      className="text-muted-foreground"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      refill(item.id);
                      toast.success(`${item.name} refilled to ${item.totalPills} pills`);
                    }}
                    className="flex items-center gap-1 rounded-full bg-emerald/15 px-3 py-1.5 text-[11px] font-medium text-emerald"
                  >
                    <RefreshCw className="size-3.5" /> Refill
                  </button>
                  <button
                    aria-label={`Delete ${item.name}`}
                    onClick={() => {
                      remove(item.id);
                      toast(`${item.name} removed`);
                    }}
                    className="ml-auto text-muted-foreground hover:text-crimson"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {scanner ? (
        <ScannerOverlay
          mode={scanner}
          onClose={() => setScanner(null)}
          onConfirm={(draft) => {
            addItem(scanDraftToItem(draft));
            toast.success(`${draft.name} added from on-device scan`);
            setScanner(null);
          }}
        />
      ) : null}
    </div>
  );
}
