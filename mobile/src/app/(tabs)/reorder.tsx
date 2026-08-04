import { useMemo, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { StyleSheet, View } from "react-native";
import { AlertTriangle, Check, PackageCheck, Truck, Zap } from "lucide-react-native";

import { daysOfSupply } from "@/domain/supplements";
import { useStack } from "@/store/stack-store";
import {
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  PageHeader,
  Row,
  Screen,
  Stack,
  Text,
  Touchable,
  alpha,
  colors,
  MIN_TOUCH,
  radius,
  space,
  useToast,
} from "@/ui";

interface Merchant {
  id: string;
  name: string;
  multiplier: number;
  shipping: number;
  eta: string;
  url: string;
}

const merchants: Merchant[] = [
  { id: "iherb", name: "iHerb", multiplier: 1, shipping: 4.99, eta: "3–5 days", url: "https://iherb.com" },
  { id: "amazon", name: "Amazon", multiplier: 1.08, shipping: 0, eta: "1–2 days", url: "https://amazon.com" },
];

/** Bundle discount applied once the cart reaches this many items. */
const BUNDLE_THRESHOLD = 3;
const BUNDLE_RATE = 0.1;

export default function ReorderScreen() {
  const { items } = useStack();
  const toast = useToast();

  const [merchantId, setMerchantId] = useState(merchants[0]!.id);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const merchant = merchants.find((m) => m.id === merchantId) ?? merchants[0]!;

  const lowStock = useMemo(
    () =>
      items
        .filter((i) => daysOfSupply(i) <= 14)
        .sort((a, b) => daysOfSupply(a) - daysOfSupply(b)),
    [items],
  );

  const cart = lowStock.filter((i) => !excluded.has(i.id));

  const quote = (m: Merchant) => {
    const subtotal = cart.reduce((sum, i) => sum + i.priceEstimate, 0) * m.multiplier;
    const discount = cart.length >= BUNDLE_THRESHOLD ? subtotal * BUNDLE_RATE : 0;
    return { subtotal, discount, total: subtotal - discount + (cart.length ? m.shipping : 0) };
  };

  const totals = quote(merchant);

  const checkout = async () => {
    // Every item carries its own affiliate link; fall back to the merchant
    // storefront when a manually-added supplement has none.
    const target = cart.find((i) => i.affiliateUrl)?.affiliateUrl ?? merchant.url;
    try {
      await WebBrowser.openBrowserAsync(target, {
        toolbarColor: colors.surface,
        controlsColor: colors.emerald,
      });
    } catch {
      toast.error("Couldn't open the store", "Check your connection and try again.");
    }
  };

  return (
    <>
      <PageHeader eyebrow="Smart cart" title="Reorder" />

      <Screen>
        <Stack gap={space.lg}>
          {lowStock.length === 0 ? (
            <EmptyState
              icon={PackageCheck}
              title="Nothing to reorder"
              description="Every supplement in your cabinet has more than 14 days of supply left."
            />
          ) : (
            <>
              <Card tone="amber">
                <Row gap={space.md} align="flex-start">
                  <AlertTriangle size={16} color={colors.amber} strokeWidth={2.2} />
                  <Text variant="caption" tone="muted" style={styles.warnCopy}>
                    <Text variant="caption" tone="amber" weight="semibold">
                      {lowStock.length} item{lowStock.length === 1 ? "" : "s"} run out in the next 14
                      days.{" "}
                    </Text>
                    Order now to prevent a protocol interruption.
                  </Text>
                </Row>
              </Card>

              <Card>
                <Row gap={space.sm}>
                  <PackageCheck size={16} color={colors.emerald} strokeWidth={2.2} />
                  <Text variant="body" weight="semibold">
                    Bundled cart
                  </Text>
                  <Badge label={`${cart.length} item${cart.length === 1 ? "" : "s"}`} />
                </Row>

                <Stack gap={space.sm} style={styles.cartList}>
                  {lowStock.map((item) => {
                    const off = excluded.has(item.id);
                    const supply = daysOfSupply(item);
                    return (
                      <Touchable
                        key={item.id}
                        haptic="none"
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: !off }}
                        accessibilityLabel={`${item.name}, ${supply} days of supply left`}
                        accessibilityHint={off ? "Adds this to the bundle" : "Removes this from the bundle"}
                        onPress={() =>
                          setExcluded((prev) => {
                            const next = new Set(prev);
                            if (next.has(item.id)) next.delete(item.id);
                            else next.add(item.id);
                            return next;
                          })
                        }
                        style={[styles.cartRow, off ? styles.cartRowOff : null]}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            off
                              ? { borderColor: colors.border }
                              : {
                                  borderColor: colors.emerald,
                                  backgroundColor: alpha(colors.emerald, 0.2),
                                },
                          ]}
                        >
                          {off ? null : <Check size={14} color={colors.emerald} strokeWidth={3} />}
                        </View>
                        <View style={styles.cartCopy}>
                          <Text variant="caption" weight="medium" numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text variant="micro" tone={supply <= 3 ? "crimson" : "amber"}>
                            {supply} day{supply === 1 ? "" : "s"} of supply left
                          </Text>
                        </View>
                        <Text variant="caption" weight="semibold" tabular>
                          {item.priceEstimate > 0 ? `$${item.priceEstimate.toFixed(2)}` : "—"}
                        </Text>
                      </Touchable>
                    );
                  })}
                </Stack>

                <Divider style={styles.divider} />

                <Stack gap={space.xs}>
                  <SummaryRow label="Subtotal" value={`$${totals.subtotal.toFixed(2)}`} />
                  <SummaryRow
                    label={`Bundle savings${cart.length < BUNDLE_THRESHOLD ? ` (${BUNDLE_THRESHOLD}+ items)` : ""}`}
                    value={`−$${totals.discount.toFixed(2)}`}
                    tone={totals.discount > 0 ? "emerald" : "muted"}
                  />
                  <SummaryRow
                    label="Shipping"
                    value={
                      cart.length === 0
                        ? "—"
                        : merchant.shipping === 0
                          ? "Free"
                          : `$${merchant.shipping.toFixed(2)}`
                    }
                  />
                  <SummaryRow label="Total" value={`$${totals.total.toFixed(2)}`} emphasis />
                </Stack>
              </Card>

              <Card>
                <Row gap={space.sm}>
                  <Truck size={16} color={colors.cyan} strokeWidth={2.2} />
                  <Text variant="body" weight="semibold">
                    Merchant comparison
                  </Text>
                </Row>
                <Stack gap={space.sm} style={styles.cartList}>
                  {merchants.map((m) => {
                    const active = m.id === merchant.id;
                    const mTotal = quote(m).total;
                    return (
                      <Touchable
                        key={m.id}
                        haptic="none"
                        onPress={() => setMerchantId(m.id)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={`${m.name}, ${m.eta}, total ${mTotal.toFixed(2)} dollars`}
                        style={[
                          styles.merchantRow,
                          active
                            ? {
                                borderColor: alpha(colors.cyan, 0.5),
                                backgroundColor: alpha(colors.cyan, 0.1),
                              }
                            : { borderColor: alpha(colors.border, 0.7) },
                        ]}
                      >
                        <View style={styles.cartCopy}>
                          <Text variant="caption" weight="medium">
                            {m.name}
                          </Text>
                          <Text variant="micro" tone="muted">
                            {m.eta} · {m.shipping === 0 ? "free shipping" : `$${m.shipping} shipping`}
                          </Text>
                        </View>
                        <Text
                          variant="caption"
                          weight="semibold"
                          tabular
                          tone={active ? "cyan" : "default"}
                        >
                          ${mTotal.toFixed(2)}
                        </Text>
                      </Touchable>
                    );
                  })}
                </Stack>
              </Card>

              <Button
                label="Reorder bundle"
                icon={Zap}
                size="lg"
                fullWidth
                disabled={cart.length === 0}
                onPress={() => void checkout()}
                accessibilityHint={`Opens ${merchant.name} to complete the order`}
              />
              <Text variant="micro" tone="muted" center>
                Checkout opens at {merchant.name}. BioSync earns an affiliate commission on
                qualifying orders at no extra cost to you.
              </Text>
            </>
          )}
        </Stack>
      </Screen>
    </>
  );
}

function SummaryRow({
  label,
  value,
  tone = "muted",
  emphasis,
}: {
  label: string;
  value: string;
  tone?: "muted" | "emerald";
  emphasis?: boolean;
}) {
  return (
    <Row gap={space.md} style={styles.summaryRow}>
      <Text variant={emphasis ? "body" : "caption"} weight={emphasis ? "semibold" : "regular"} tone={emphasis ? "default" : "muted"}>
        {label}
      </Text>
      <Text
        variant={emphasis ? "body" : "caption"}
        weight={emphasis ? "semibold" : "regular"}
        tone={emphasis ? "default" : tone}
        tabular
      >
        {value}
      </Text>
    </Row>
  );
}

const styles = StyleSheet.create({
  warnCopy: { flex: 1 },
  cartList: { marginTop: space.md },
  divider: { marginVertical: space.md },

  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    minHeight: MIN_TOUCH + space.sm,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: alpha(colors.border, 0.7),
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  cartRowOff: { opacity: 0.45 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm - 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  cartCopy: { flex: 1, gap: 2 },

  merchantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    minHeight: MIN_TOUCH + space.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },

  summaryRow: { justifyContent: "space-between" },
});
