import { useMemo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  PackageMinus,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react-native";

import { buildReminderFeed, clampTime, formatTime, parseTime } from "@/domain/schedule";
import { timeBlocks } from "@/domain/supplements";
import { useNotifications } from "@/notifications/use-notifications";
import { useStack } from "@/store/stack-store";
import {
  Badge,
  Button,
  Card,
  Divider,
  IconButton,
  PageHeader,
  Range,
  Row,
  Screen,
  Stack,
  Text,
  Toggle,
  alpha,
  colors,
  radius,
  space,
  useToast,
} from "@/ui";
import { Minus, Plus } from "lucide-react-native";

const kindIcon: Record<"dose" | "stock" | "expiry", LucideIcon> = {
  dose: CalendarClock,
  stock: PackageMinus,
  expiry: ShieldAlert,
};

export default function RemindersScreen() {
  const { items, reminders, updateReminders, resetReminders } = useStack();
  const { permission, enable } = useNotifications();
  const toast = useToast();

  const feed = useMemo(() => buildReminderFeed(items, reminders), [items, reminders]);

  const handleEnable = async () => {
    const result = await enable();
    if (result === "granted") toast.success("Reminders enabled on this device");
    else if (result === "denied")
      toast.warning("Notifications are blocked", "Turn them on in system settings.");
    else if (result === "unsupported")
      toast.info("Simulators can't show notifications", "The in-app feed still works.");
  };

  return (
    <>
      <PageHeader eyebrow="Stay on schedule" title="Reminders">
        <Text variant="caption" tone="muted">
          Everything runs on this device — no account, no cloud, works offline.
        </Text>
      </PageHeader>

      <Screen>
        <Stack gap={space.lg}>
          {permission === "granted" ? (
            <Row gap={space.sm} style={styles.granted}>
              <CheckCircle2 size={16} color={colors.emerald} strokeWidth={2.2} />
              <Text variant="caption" tone="emerald" style={styles.grantedCopy}>
                Notifications are active on this device.
              </Text>
            </Row>
          ) : (
            <Card tone="cyan">
              <Row gap={space.md} align="flex-start">
                <BellRing size={20} color={colors.cyan} strokeWidth={2.2} />
                <View style={styles.permCopy}>
                  <Text variant="body" weight="semibold">
                    Turn on dose notifications
                  </Text>
                  <Text variant="micro" tone="muted">
                    {permission === "denied"
                      ? "Notifications are blocked for BioSync. Enable them in system settings to get dose alerts."
                      : permission === "unsupported"
                        ? "This device can't deliver local notifications. The in-app feed below still tracks everything."
                        : "Get a gentle ping when a block is due, even when the app is closed."}
                  </Text>
                </View>
              </Row>
              {permission === "denied" ? (
                <Button
                  label="Open settings"
                  variant="tonal"
                  tone="cyan"
                  size="sm"
                  fullWidth
                  onPress={() => void Linking.openSettings()}
                  style={styles.permCta}
                />
              ) : permission === "undetermined" ? (
                <Button
                  label="Allow reminders"
                  size="sm"
                  fullWidth
                  onPress={() => void handleEnable()}
                  style={styles.permCta}
                />
              ) : null}
            </Card>
          )}

          <Card>
            <Row gap={space.lg}>
              <View style={styles.settingCopy}>
                <Text variant="body" weight="semibold">
                  All reminders
                </Text>
                <Text variant="micro" tone="muted">
                  Master switch for doses, stock and expiry
                </Text>
              </View>
              <Toggle
                value={reminders.enabled}
                onChange={(v) => updateReminders({ enabled: v })}
                label="Enable all reminders"
              />
            </Row>
          </Card>

          <Card>
            <Text variant="body" weight="semibold">
              Dose times
            </Text>
            <Stack gap={space.md} style={styles.blockList}>
              {timeBlocks.map((block, index) => (
                <View key={block.key}>
                  {index > 0 ? <Divider style={styles.divider} /> : null}
                  <BlockTimeRow
                    label={block.label}
                    window={block.window}
                    time={reminders.times[block.key]}
                    enabled={reminders.blocks[block.key]}
                    onTimeChange={(next) =>
                      updateReminders({ times: { [block.key]: next } as never })
                    }
                    onToggle={(v) => updateReminders({ blocks: { [block.key]: v } as never })}
                  />
                </View>
              ))}
            </Stack>
          </Card>

          <Card>
            <Row gap={space.lg}>
              <View style={styles.settingCopy}>
                <Text variant="body" weight="semibold">
                  Low stock nudges
                </Text>
                <Text variant="micro" tone="muted">
                  Warn me at {reminders.lowStockDays} days of supply
                </Text>
              </View>
              <Toggle
                value={reminders.lowStockAlerts}
                onChange={(v) => updateReminders({ lowStockAlerts: v })}
                label="Enable low stock reminders"
              />
            </Row>
            <Range
              value={reminders.lowStockDays}
              onChange={(v) => updateReminders({ lowStockDays: Math.round(v) })}
              min={3}
              max={30}
              label="Low stock threshold in days"
            />

            <Divider style={styles.divider} />

            <Row gap={space.lg} style={styles.expiryRow}>
              <View style={styles.settingCopy}>
                <Text variant="body" weight="semibold">
                  Expiry warnings
                </Text>
                <Text variant="micro" tone="muted">
                  Warn me {reminders.expiryLeadDays} days before a bottle expires
                </Text>
              </View>
              <Toggle
                value={reminders.expiryAlerts}
                onChange={(v) => updateReminders({ expiryAlerts: v })}
                label="Enable expiry reminders"
              />
            </Row>
            <Range
              value={reminders.expiryLeadDays}
              onChange={(v) => updateReminders({ expiryLeadDays: Math.round(v) })}
              min={7}
              max={120}
              label="Expiry warning lead time in days"
            />
          </Card>

          <Stack gap={space.sm}>
            <Text variant="eyebrow" tone="muted">
              Coming up
            </Text>
            {feed.length === 0 ? (
              <Card>
                <Text variant="caption" tone="muted" center>
                  Nothing needs your attention. Your stack is fully stocked and logged.
                </Text>
              </Card>
            ) : (
              feed.map((f) => {
                const Icon = kindIcon[f.kind];
                return (
                  <Card key={f.id} style={styles.feedCard}>
                    <Row gap={space.md} align="flex-start">
                      <View
                        style={[styles.feedIcon, { backgroundColor: alpha(colors[f.tone], 0.14) }]}
                      >
                        <Icon size={16} color={colors[f.tone]} strokeWidth={2.2} />
                      </View>
                      <View style={styles.feedCopy}>
                        <Text variant="body" weight="medium" numberOfLines={2}>
                          {f.title}
                        </Text>
                        {f.detail ? (
                          <Text variant="micro" tone="muted" numberOfLines={2}>
                            {f.detail}
                          </Text>
                        ) : null}
                      </View>
                      <Badge label={f.when} tone={f.tone} />
                    </Row>
                  </Card>
                );
              })
            )}
          </Stack>

          <Button
            label="Reset reminder defaults"
            variant="ghost"
            fullWidth
            onPress={() => {
              resetReminders();
              toast.info("Reminder defaults restored");
            }}
          />
          <Text variant="micro" tone="muted" center>
            Reminder times are stored only in this device's local database.
          </Text>
        </Stack>
      </Screen>
    </>
  );
}

/**
 * Time control. React Native has no `<input type="time">`, and a full picker
 * modal is overkill for adjusting a reminder by a few minutes — 15-minute
 * steppers land on the value the user wants in one or two taps.
 */
function BlockTimeRow({
  label,
  window,
  time,
  enabled,
  onTimeChange,
  onToggle,
}: {
  label: string;
  window: string;
  time: string;
  enabled: boolean;
  onTimeChange: (next: string) => void;
  onToggle: (next: boolean) => void;
}) {
  const shift = (deltaMinutes: number) => {
    const { h, m } = parseTime(time);
    const total = (h * 60 + m + deltaMinutes + 1440) % 1440;
    onTimeChange(clampTime(Math.floor(total / 60), total % 60));
  };

  return (
    <Stack gap={space.sm}>
      <Row gap={space.lg}>
        <View style={styles.settingCopy}>
          <Text variant="caption" weight="semibold">
            {label}
          </Text>
          <Text variant="micro" tone="muted">
            Suggested {window}
          </Text>
        </View>
        <Toggle value={enabled} onChange={onToggle} label={`Enable ${label} reminder`} />
      </Row>

      <Row gap={space.sm} style={styles.stepper}>
        <IconButton
          icon={Minus}
          label={`${label} 15 minutes earlier`}
          variant="plain"
          size={40}
          onPress={() => shift(-15)}
          disabled={!enabled}
        />
        <Text
          variant="body"
          weight="semibold"
          tabular
          center
          tone={enabled ? "default" : "muted"}
          style={styles.stepperValue}
          accessibilityLabel={`${label} reminder at ${formatTime(time)}`}
        >
          {formatTime(time)}
        </Text>
        <IconButton
          icon={Plus}
          label={`${label} 15 minutes later`}
          variant="plain"
          size={40}
          onPress={() => shift(15)}
          disabled={!enabled}
        />
      </Row>
    </Stack>
  );
}

const styles = StyleSheet.create({
  granted: {
    alignItems: "center",
    backgroundColor: alpha(colors.emerald, 0.1),
    borderRadius: radius.xl,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  grantedCopy: { flex: 1 },

  permCopy: { flex: 1, gap: space.xs },
  permCta: { marginTop: space.lg },

  settingCopy: { flex: 1, gap: 2 },
  blockList: { marginTop: space.md },
  divider: { marginVertical: space.md },
  expiryRow: { marginBottom: space.xs },

  stepper: {
    alignSelf: "flex-start",
    alignItems: "center",
    backgroundColor: colors.muted,
    borderRadius: radius.full,
    paddingHorizontal: space.xs,
  },
  stepperValue: { minWidth: 92 },

  feedCard: { padding: space.md },
  feedIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  feedCopy: { flex: 1, gap: 2 },
});
