import { useMemo } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ArrowLeft, Cpu, RotateCcw } from "lucide-react-native";

import { ProLock } from "@/features/ProGate";
import { evaluateStackLocally, localStackScore } from "@/domain/rules-engine";
import type { TimeOfDay } from "@/domain/supplements";
import { useIsPro } from "@/store/purchases";
import { useStack } from "@/store/stack-store";
import {
  Button,
  Card,
  Divider,
  IconButton,
  PageHeader,
  Range,
  Row,
  Screen,
  ScoreRing,
  Segmented,
  Stack,
  Text,
  Toggle,
  colors,
  space,
  useToast,
} from "@/ui";

const blockOptions: { value: TimeOfDay; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

const checks = [
  { key: "checkZincCopper", label: "Zinc / Copper competition" },
  { key: "checkD3K2", label: "Vitamin D3 + K2 synergy" },
  { key: "checkZincOverdose", label: "Zinc upper-limit warning" },
  { key: "checkMagnesiumTiming", label: "Magnesium timing" },
] as const;

export default function RuleSettingsScreen() {
  const { items, settings, updateSettings, resetSettings } = useStack();
  const isPro = useIsPro();
  const router = useRouter();
  const toast = useToast();

  const alerts = useMemo(() => evaluateStackLocally(items, settings), [items, settings]);
  const score = localStackScore(alerts, items.length);
  const flagged = alerts.filter((a) => a.severity !== "low").length;

  return (
    <>
      <PageHeader
        eyebrow="On-device rules engine"
        title="Rule Thresholds"
        right={
          <IconButton icon={ArrowLeft} label="Back to insights" onPress={() => router.back()} />
        }
      />

      <Screen>
        <Stack gap={space.lg}>
          <Card tone="cyan" glowing>
            <Row gap={space.lg}>
              <ScoreRing value={score} size={80} stroke={8} tone="cyan" label="live" display={`${score}`} />
              <View style={styles.summary}>
                <Text variant="eyebrow" tone="cyan">
                  Live re-evaluation
                </Text>
                <Text variant="caption" tone="muted">
                  {alerts.length} rule{alerts.length === 1 ? "" : "s"} triggered · {flagged} needing
                  action. Updates as you drag.
                </Text>
              </View>
            </Row>
          </Card>

          {!isPro ? (
            <ProLock gate="rule-tuning" />
          ) : (
            <>
              <Card>
                <Row gap={space.md} style={styles.thresholdHead}>
                  <Text variant="body" weight="semibold">
                    Zinc upper limit
                  </Text>
                  <Text variant="body" weight="semibold" tone="cyan" tabular>
                    {settings.zincLimitMg} mg/day
                  </Text>
                </Row>
                <Range
                  value={settings.zincLimitMg}
                  onChange={(v) => updateSettings({ zincLimitMg: Math.round(v / 5) * 5 })}
                  min={15}
                  max={100}
                  step={5}
                  label="Zinc upper limit in milligrams per day"
                />
                <Text variant="micro" tone="muted">
                  Default is the 45mg tolerable upper intake level. Raise it only if you cycle
                  high-dose zinc deliberately.
                </Text>
              </Card>

              <Card>
                <Row gap={space.md} style={styles.thresholdHead}>
                  <Text variant="body" weight="semibold">
                    Mineral spacing
                  </Text>
                  <Text variant="body" weight="semibold" tone="cyan" tabular>
                    {settings.copperSpacingHours} h
                  </Text>
                </Row>
                <Range
                  value={settings.copperSpacingHours}
                  onChange={(v) => updateSettings({ copperSpacingHours: Math.round(v) })}
                  min={1}
                  max={12}
                  label="Minimum hours between competing minerals"
                />
                <Text variant="micro" tone="muted">
                  Minimum gap advised between minerals sharing a transporter.
                </Text>
              </Card>

              <Card>
                <Text variant="body" weight="semibold" style={styles.blockTitle}>
                  Preferred magnesium block
                </Text>
                <Segmented
                  options={blockOptions}
                  value={settings.magnesiumBlock}
                  onChange={(v) => updateSettings({ magnesiumBlock: v })}
                  tone="cyan"
                  label="Preferred magnesium block"
                />
              </Card>

              <Card>
                <Text variant="body" weight="semibold">
                  Active checks
                </Text>
                <Stack gap={0} style={styles.checkList}>
                  {checks.map(({ key, label }, index) => (
                    <View key={key}>
                      {index > 0 ? <Divider /> : null}
                      <Row gap={space.md} style={styles.checkRow}>
                        <Text variant="caption" tone="muted" style={styles.checkLabel}>
                          {label}
                        </Text>
                        <Toggle
                          value={settings[key]}
                          onChange={(checked) => updateSettings({ [key]: checked })}
                          label={label}
                        />
                      </Row>
                    </View>
                  ))}
                </Stack>
              </Card>

              <Button
                label="Reset to clinical defaults"
                icon={RotateCcw}
                variant="outline"
                fullWidth
                onPress={() => {
                  resetSettings();
                  toast.info("Thresholds reset to defaults");
                }}
              />
            </>
          )}

          <Row gap={space.sm} align="flex-start">
            <Cpu size={14} color={colors.emerald} strokeWidth={2.2} />
            <Text variant="micro" tone="muted" style={styles.footnote}>
              Thresholds are stored in this device's local database and applied instantly — nothing
              is uploaded. These are general wellness guidelines, not medical advice.
            </Text>
          </Row>
        </Stack>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  summary: { flex: 1, gap: space.xs },
  thresholdHead: { justifyContent: "space-between", marginBottom: space.sm },
  blockTitle: { marginBottom: space.md },
  checkList: { marginTop: space.sm },
  checkRow: { justifyContent: "space-between", paddingVertical: space.md },
  checkLabel: { flex: 1 },
  footnote: { flex: 1 },
});
