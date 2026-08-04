import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Ban, Bell, Check, ChevronDown, Clock, Croissant, Flame, Plus } from "lucide-react-native";

import { AddSupplementSheet } from "@/features/AddSupplementSheet";
import { buildBlockStatuses, formatTime, nextBlock } from "@/domain/schedule";
import { daysOfSupply, type SupplementItem, type TimeOfDay } from "@/domain/supplements";
import { useStack, useStackStats } from "@/store/stack-store";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  PageHeader,
  Row,
  Screen,
  ScoreRing,
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

export default function TodayScreen() {
  const { items, reminders, toggleTaken, logBlock } = useStack();
  const stats = useStackStats();
  const toast = useToast();
  const router = useRouter();

  const blocks = useMemo(() => buildBlockStatuses(items, reminders), [items, reminders]);
  const upNext = useMemo(() => nextBlock(blocks), [blocks]);

  const [addOpen, setAddOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<TimeOfDay>>(new Set());

  // Blocks start expanded; the user collapses the ones they do not need.
  const toggleSection = (key: TimeOfDay) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const handleLogAll = (key: TimeOfDay) => {
    const block = blocks.find((b) => b.key === key);
    if (!block) return;
    const count = logBlock(block.items.map((i) => i.id));
    if (count > 0) toast.success(`Logged ${count} dose${count > 1 ? "s" : ""}`);
  };

  return (
    <>
      <PageHeader
        eyebrow={greeting}
        title="Today's Protocol"
        right={<ScoreRing value={stats.consistency} label="taken" />}
      >
        <Row gap={space.md} align="center">
          <View style={styles.headerCopy}>
            <Text variant="caption" tone="muted">
              {stats.taken} of {stats.total} doses logged
            </Text>
            {stats.streak > 0 ? (
              <Row gap={space.xs}>
                <Flame size={13} color={colors.amber} strokeWidth={2.4} />
                <Text variant="micro" tone="amber" weight="semibold">
                  {stats.streak} day streak
                </Text>
              </Row>
            ) : (
              <Text variant="micro" tone="muted">
                Log a full day to start a streak
              </Text>
            )}
          </View>
          <Row gap={space.sm}>
            <IconButton
              icon={Bell}
              label="Reminders"
              onPress={() => router.push("/reminders")}
            />
            <IconButton
              icon={Plus}
              label="Add supplement"
              variant="filled"
              onPress={() => setAddOpen(true)}
            />
          </Row>
        </Row>
      </PageHeader>

      <Screen>
        <Stack gap={space.md}>
          {items.length === 0 ? (
            <EmptyState
              icon={Plus}
              title="Your stack is empty"
              description="Add your first supplement to start tracking today's protocol."
              actionLabel="Add supplement"
              onAction={() => setAddOpen(true)}
            />
          ) : upNext ? (
            <Card tone="emerald">
              <Text variant="eyebrow" tone="emerald">
                Up next
              </Text>
              <Row gap={space.md} align="flex-end" style={styles.upNextRow}>
                <View style={styles.upNextCopy}>
                  <Text variant="title" numberOfLines={1}>
                    {upNext.label}
                  </Text>
                  <Text variant="micro" tone="muted">
                    {formatTime(upNext.time)} · {upNext.total - upNext.done} dose
                    {upNext.total - upNext.done === 1 ? "" : "s"} to log
                  </Text>
                </View>
                <Button
                  label="Log all"
                  size="sm"
                  onPress={() => handleLogAll(upNext.key)}
                  accessibilityHint={`Marks all ${upNext.label} doses as taken`}
                />
              </Row>
            </Card>
          ) : (
            <Card tone="emerald">
              <Text variant="title" tone="emerald" center>
                Protocol complete for today
              </Text>
              <Text variant="micro" tone="muted" center style={styles.completeCopy}>
                Every scheduled dose is logged. See you tomorrow.
              </Text>
            </Card>
          )}

          {blocks.map((block) => {
            const open = !collapsed.has(block.key);
            return (
              <Card key={block.key} padded={false}>
                <Touchable
                  onPress={() => toggleSection(block.key)}
                  haptic="none"
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  accessibilityLabel={`${block.label}, ${block.done} of ${block.total} logged`}
                  accessibilityHint={open ? "Collapses this block" : "Expands this block"}
                  style={styles.sectionHeader}
                >
                  <View style={styles.sectionTitle}>
                    <Text variant="body" weight="semibold" numberOfLines={1}>
                      {block.label}
                    </Text>
                    <Row gap={space.xs}>
                      <Clock size={12} color={colors.mutedForeground} strokeWidth={2.2} />
                      <Text variant="micro" tone="muted">
                        {formatTime(block.time)}
                      </Text>
                    </Row>
                  </View>
                  <Row gap={space.sm}>
                    <Badge
                      label={`${block.done}/${block.total}`}
                      tone={block.complete ? "emerald" : "neutral"}
                    />
                    <ChevronDown
                      size={16}
                      color={colors.mutedForeground}
                      strokeWidth={2.2}
                      style={open ? styles.chevronOpen : undefined}
                    />
                  </Row>
                </Touchable>

                {open ? (
                  <View style={styles.doseList}>
                    {block.items.length === 0 ? (
                      <Text variant="micro" tone="muted" style={styles.emptyBlock}>
                        Nothing scheduled in this block.
                      </Text>
                    ) : (
                      block.items.map((item) => (
                        <DoseRow key={item.id} item={item} onToggle={() => toggleTaken(item.id)} />
                      ))
                    )}
                  </View>
                ) : null}
              </Card>
            );
          })}
        </Stack>
      </Screen>

      <AddSupplementSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

function DoseRow({ item, onToggle }: { item: SupplementItem; onToggle: () => void }) {
  const supply = daysOfSupply(item);

  return (
    <View style={styles.doseRow}>
      <Touchable
        onPress={onToggle}
        haptic={item.takenToday ? "light" : "success"}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.takenToday }}
        accessibilityLabel={`${item.name}, ${item.dailyDose} pill${item.dailyDose > 1 ? "s" : ""}`}
        accessibilityHint={item.takenToday ? "Marks this dose as not taken" : "Marks this dose as taken"}
        style={[
          styles.check,
          item.takenToday
            ? { backgroundColor: colors.emerald, borderColor: colors.emerald }
            : { borderColor: colors.border },
        ]}
      >
        {item.takenToday ? <Check size={18} color={colors.onAccent} strokeWidth={3} /> : null}
      </Touchable>

      <View style={styles.doseCopy}>
        <Text
          variant="body"
          weight="medium"
          numberOfLines={1}
          tone={item.takenToday ? "muted" : "default"}
          style={item.takenToday ? styles.struck : undefined}
        >
          {item.name}
        </Text>
        <Text variant="micro" tone="muted" numberOfLines={1}>
          {item.brand} · {item.dailyDose} pill{item.dailyDose > 1 ? "s" : ""}
        </Text>
        <Row gap={space.xs} style={styles.doseTags}>
          <Badge
            label={`${supply}d supply`}
            tone={supply <= 3 ? "crimson" : supply <= 7 ? "amber" : "cyan"}
          />
          <Badge
            label={item.note ?? (item.takeWithFood ? "With food" : "Empty stomach")}
            icon={
              item.takeWithFood ? (
                <Croissant size={11} color={colors.mutedForeground} strokeWidth={2.2} />
              ) : (
                <Ban size={11} color={colors.mutedForeground} strokeWidth={2.2} />
              )
            }
          />
        </Row>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCopy: { flex: 1, gap: 2 },
  upNextRow: { marginTop: space.sm },
  upNextCopy: { flex: 1, gap: 2 },
  completeCopy: { marginTop: space.xs },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    minHeight: MIN_TOUCH + space.md,
  },
  sectionTitle: { flex: 1, gap: 2 },
  chevronOpen: { transform: [{ rotate: "180deg" }] },

  doseList: {
    paddingHorizontal: space.md,
    paddingBottom: space.md,
    gap: space.sm,
  },
  emptyBlock: { paddingHorizontal: space.sm, paddingBottom: space.sm },

  doseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: alpha(colors.border, 0.7),
    backgroundColor: alpha(colors.surfaceElevated, 0.6),
    padding: space.md,
  },
  check: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  doseCopy: { flex: 1, gap: 2 },
  struck: { textDecorationLine: "line-through" },
  doseTags: { marginTop: space.xs, flexWrap: "wrap" },
});
