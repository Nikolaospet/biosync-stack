import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Check, Package, Truck, Zap } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "../components/PageHeader";
import { useStack } from "../lib/stack-store";
import { daysOfSupply } from "../lib/supplements";

export const Route = createFileRoute("/reorder")({
  head: () => ({
    meta: [
      { title: "Smart Reorder — BioStack AI" },
      {
        name: "description",
        content:
          "Bundle low-stock supplements, compare merchant pricing and reorder in one tap.",
      },
      { property: "og:title", content: "Smart Reorder — BioStack AI" },
      {
        property: "og:description",
        content: "Never interrupt your protocol — reorder before you run out.",
      },
    ],
  }),
  component: ReorderPage,
});

type Merchant = { id: string; name: string; multiplier: number; shipping: number; eta: string };

const merchants: Merchant[] = [
  { id: "iherb", name: "iHerb", multiplier: 1, shipping: 4.99, eta: "3–5 days" },
  { id: "amazon", name: "Amazon", multiplier: 1.08, shipping: 0, eta: "1–2 days" },
  { id: "local", name: "Local Partner", multiplier: 1.14, shipping: 2.5, eta: "Same day" },
];

function ReorderPage() {
  const { items } = useStack();
  const [merchant, setMerchant] = useState<Merchant>(merchants[0]!);
  const [selected, setSelected] = useState<string[]>([]);

  const lowStock = useMemo(
    () => items.filter((i) => daysOfSupply(i) <= 14).sort((a, b) => daysOfSupply(a) - daysOfSupply(b)),
    [items],
  );

  const cart = lowStock.filter((i) => !selected.includes(i.id));
  const subtotal = cart.reduce((s, i) => s + i.priceEstimate, 0);
  const listPrice = subtotal * merchant.multiplier;
  const bundleDiscount = cart.length >= 3 ? listPrice * 0.1 : 0;
  const total = listPrice - bundleDiscount + merchant.shipping;

  return (
    <div>
      <PageHeader eyebrow="Smart Cart" title="Reorder" />

      <div className="space-y-4 px-5 py-5">
        <div className="flex gap-3 rounded-3xl border border-amber/30 bg-amber/5 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber" />
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-amber">
              {lowStock.length} items run out in the next 14 days.
            </span>{" "}
            Order now to prevent protocol interruption.
          </p>
        </div>

        <section className="rounded-3xl border border-border/70 bg-card/70 p-4">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-emerald" />
            <p className="text-sm font-semibold">Bundled cart</p>
            <span className="ml-auto text-[11px] text-muted-foreground">
              {cart.length} items
            </span>
          </div>

          <ul className="mt-3 space-y-2">
            {lowStock.map((item) => {
              const off = selected.includes(item.id);
              return (
                <li
                  key={item.id}
                  className={`flex items-center gap-3 rounded-2xl border border-border/60 p-3 transition-opacity ${
                    off ? "opacity-40" : ""
                  }`}
                >
                  <button
                    aria-label={`Toggle ${item.name} in bundle`}
                    onClick={() =>
                      setSelected((prev) =>
                        off ? prev.filter((id) => id !== item.id) : [...prev, item.id],
                      )
                    }
                    className={`flex size-6 items-center justify-center rounded-md border ${
                      off ? "border-border" : "border-emerald bg-emerald/20 text-emerald"
                    }`}
                  >
                    {off ? null : <Check className="size-3.5" strokeWidth={3} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{item.name}</p>
                    <p className="text-[11px] text-amber">
                      {daysOfSupply(item)} days of supply left
                    </p>
                  </div>
                  <span className="text-[12px] font-semibold tabular-nums">
                    ${item.priceEstimate.toFixed(2)}
                  </span>
                </li>
              );
            })}
          </ul>

          <dl className="mt-4 space-y-1.5 border-t border-border/60 pt-3 text-[12px]">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">${listPrice.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Bundle savings</dt>
              <dd className="tabular-nums text-emerald">
                −${bundleDiscount.toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="tabular-nums">
                {merchant.shipping === 0 ? "Free" : `$${merchant.shipping.toFixed(2)}`}
              </dd>
            </div>
            <div className="flex justify-between pt-1 text-sm font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">${total.toFixed(2)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card/70 p-4">
          <div className="flex items-center gap-2">
            <Truck className="size-4 text-cyan" />
            <p className="text-sm font-semibold">Merchant comparison</p>
          </div>
          <ul className="mt-3 space-y-2">
            {merchants.map((m) => {
              const active = m.id === merchant.id;
              const mTotal =
                subtotal * m.multiplier -
                (cart.length >= 3 ? subtotal * m.multiplier * 0.1 : 0) +
                m.shipping;
              return (
                <li key={m.id}>
                  <button
                    onClick={() => setMerchant(m)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                      active ? "border-cyan/50 bg-cyan/10" : "border-border/60"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-[13px] font-medium">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {m.eta} ·{" "}
                        {m.shipping === 0 ? "free shipping" : `$${m.shipping} shipping`}
                      </p>
                    </div>
                    <span
                      className={`text-[13px] font-semibold tabular-nums ${
                        active ? "text-cyan" : ""
                      }`}
                    >
                      ${mTotal.toFixed(2)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <button
          disabled={cart.length === 0}
          onClick={() =>
            toast.success(`Redirecting to ${merchant.name}…`, {
              description: `${cart.length} items · $${total.toFixed(2)} · ref=biostack-affiliate`,
            })
          }
          className="flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald py-4 text-sm font-semibold text-primary-foreground glow-emerald disabled:opacity-40"
        >
          <Zap className="size-4" /> 1-Click Reorder Bundle
        </button>
        <p className="pb-2 text-center text-[10px] text-muted-foreground">
          Checkout opens at {merchant.name} with affiliate tracking applied.
        </p>
      </div>
    </div>
  );
}
