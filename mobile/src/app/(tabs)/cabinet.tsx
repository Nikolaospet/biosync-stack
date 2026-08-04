import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { Barcode, Minus, Package, Pill, Plus, RefreshCw, Trash2 } from "lucide-react-native";

import { AddSupplementSheet } from "@/features/AddSupplementSheet";
import {
  categoryLabels,
  expirationLabel,
  type Category,
  type SupplementItem,
} from "@/domain/supplements";
import { FREE_ITEM_LIMIT } from "@/store/entitlements";
import { useIsPro } from "@/store/purchases";
import { useStack, useStackStats } from "@/store/stack-store";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  PageHeader,
  ProgressBar,
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

const filters: ("all" | Category)[] = ["all", "longevity", "sleep", "focus", "recovery", "general"];

export default function CabinetScreen() {
  const { items, refill, remove, adjustDose } = useStack();
  const stats = useStackStats();
  const isPro = useIsPro();
  const toast = useToast();
  const router = useRouter();

  const [filter, setFilter] = useState<"all" | Category>("all");
  const [addOpen, setAddOpen] = useState(false);

  const visible = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );

  const atFreeLimit = !isPro && items.length >= FREE_ITEM_LIMIT;

  const openScanner = () => {
    if (!isPro) {
      router.push("/paywall");
      return;
    }
    router.push("/scanner");
  };

  return (
    <>
      <PageHeader
        eyebrow={stats.value > 0 ? `$${stats.value.toFixed(0)} cabinet value` : "Inventory"}
        title="Cabinet"
        right={
          <IconButton
            icon={Plus}
            label="Add supplement"
            variant="filled"
            onPress={() => setAddOpen(true)}
          />
        }
      >
        <Stack gap={space.md}>
          <Text variant="caption" tone="muted">
            {stats.total} active supplement{stats.total === 1 ? "" : "s"} tracked
            {isPro ? "" : ` · ${Math.max(0, FREE_ITEM_LIMIT - stats.total)} free slots left`}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {filters.map((f) => {
              const active = filter === f;
              return (
                <Touchable
                  key={f}
                  onPress={() => setFilter(f)}
                  haptic="none"
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={f === "all" ? "All categories" : categoryLabels[f]}
                  style={[
                    styles.filterChip,
                    active
                      ? { backgroundColor: alpha(colors.emerald, 0.16) }
                      : { backgroundColor: colors.muted },
                  ]}
                >
                  <Text
                    variant="micro"
                    weight="semibold"
                    tone={active ? "emerald" : "muted"}
                  >
                    {f === "all" ? "All" : categoryLabels[f]}
                  </Text>
                </Touchable>
              );
            })}
          </ScrollView>
        </Stack>
      </PageHeader>

      <Screen>
        <Stack gap={space.lg}>
          <Card tone="cyan" glowing>
            <Row gap={space.sm}>
              <Barcode size={16} color={colors.cyan} strokeWidth={2.2} />
              <Text variant="body" weight="semibold" tone="cyan">
                Scan a new supplement
              </Text>
            </Row>
            <Text variant="micro" tone="muted" style={styles.scanCopy}>
              Point the camera at the barcode to fill in brand, pill count and price. Frames are
              decoded on this device.
            </Text>
            <Button
              label={isPro ? "Open scanner" : "Unlock scanning"}
              icon={Barcode}
              variant="tonal"
              tone="cyan"
              size="sm"
              fullWidth
              onPress={openScanner}
              style={styles.scanCta}
            />
          </Card>

          {atFreeLimit ? (
            <Card tone="amber">
              <Text variant="body" weight="semibold" tone="amber">
                Free cabinet is full
              </Text>
              <Text variant="micro" tone="muted" style={styles.scanCopy}>
                You are tracking all {FREE_ITEM_LIMIT} free slots. Pro removes the limit.
              </Text>
              <Button
                label="See Pro"
                variant="tonal"
                tone="amber"
                size="sm"
                fullWidth
                onPress={() => router.push("/paywall")}
                style={styles.scanCta}
              />
            </Card>
          ) : null}

          {visible.length === 0 ? (
            <EmptyState
              icon={Package}
              title={items.length === 0 ? "Nothing in your cabinet" : "No matches"}
              description={
                items.length === 0
                  ? "Add a supplement to start tracking pill counts and expiry dates."
                  : "No supplements in this category yet."
              }
              {...(items.length === 0
                ? { actionLabel: "Add supplement", onAction: () => setAddOpen(true) }
                : {})}
            />
          ) : (
            visible.map((item) => (
              <CabinetCard
                key={item.id}
                item={item}
                onRefill={() => {
                  refill(item.id);
                  toast.success(`${item.name} refilled to ${item.totalPills} pills`);
                }}
                onRemove={() => {
                  remove(item.id);
                  toast.info(`${item.name} removed`);
                }}
                onAdjust={(delta) => adjustDose(item.id, delta)}
              />
            ))
          )}
        </Stack>
      </Screen>

      <AddSupplementSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

function CabinetCard({
  item,
  onRefill,
  onRemove,
  onAdjust,
}: {
  item: SupplementItem;
  onRefill: () => void;
  onRemove: () => void;
  onAdjust: (delta: number) => void;
}) {
  const exp = expirationLabel(item);
  const percent = item.totalPills > 0 ? Math.round((item.remainingPills / item.totalPills) * 100) : 0;

  return (
    <Card>
      <Row gap={space.md} align="flex-start">
        <View style={styles.icon}>
          <Pill size={20} color={colors.emerald} strokeWidth={2} />
        </View>
        <View style={styles.cardCopy}>
          <Text variant="body" weight="semibold" numberOfLines={2}>
            {item.name}
          </Text>
          <Text variant="micro" tone="muted" numberOfLines={1}>
            {item.brand} · {categoryLabels[item.category]}
          </Text>
        </View>
        <Badge label={exp.text} tone={exp.tone} />
      </Row>

      <View style={styles.supply}>
        <Row gap={space.sm} style={styles.supplyLabels}>
          <Text variant="micro" tone="muted">
            {item.remainingPills}/{item.totalPills} pills left
          </Text>
          <Text variant="micro" tone="muted" tabular>
            {percent}%
          </Text>
        </Row>
        <ProgressBar percent={percent} label={`${item.name} remaining`} />
      </View>

      <Row gap={space.sm} style={styles.actions}>
        <Row gap={space.xs} style={styles.stepper}>
          <Touchable
            onPress={() => onAdjust(-1)}
            accessibilityLabel={`Decrease ${item.name} daily dose`}
            disabled={item.dailyDose <= 1}
            style={styles.stepperButton}
          >
            <Minus size={16} color={colors.mutedForeground} strokeWidth={2.4} />
          </Touchable>
          <Text variant="micro" tabular center style={styles.stepperValue}>
            {item.dailyDose}/day
          </Text>
          <Touchable
            onPress={() => onAdjust(1)}
            accessibilityLabel={`Increase ${item.name} daily dose`}
            disabled={item.dailyDose >= 6}
            style={styles.stepperButton}
          >
            <Plus size={16} color={colors.mutedForeground} strokeWidth={2.4} />
          </Touchable>
        </Row>

        <Button
          label="Refill"
          icon={RefreshCw}
          variant="tonal"
          tone="emerald"
          size="sm"
          onPress={onRefill}
          accessibilityHint={`Resets ${item.name} to a full bottle`}
        />

        <IconButton
          icon={Trash2}
          label={`Delete ${item.name}`}
          variant="plain"
          onPress={onRemove}
          style={styles.delete}
        />
      </Row>
    </Card>
  );
}

const styles = StyleSheet.create({
  filterRow: { gap: space.sm, paddingRight: space.lg },
  filterChip: {
    minHeight: 34,
    justifyContent: "center",
    borderRadius: radius.full,
    paddingHorizontal: space.md,
  },
  scanCopy: { marginTop: space.xs },
  scanCta: { marginTop: space.md },

  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(colors.emerald, 0.14),
  },
  cardCopy: { flex: 1, gap: 2 },

  supply: { marginTop: space.md, gap: space.xs },
  supplyLabels: { justifyContent: "space-between" },

  actions: { marginTop: space.md, flexWrap: "wrap" },
  stepper: {
    alignItems: "center",
    backgroundColor: colors.muted,
    borderRadius: radius.full,
    paddingHorizontal: space.xs,
  },
  stepperButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: { minWidth: 48 },
  delete: { marginLeft: "auto" },
});
