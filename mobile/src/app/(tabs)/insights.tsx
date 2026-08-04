import { useMemo } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import {
  AlertTriangle,
  Cpu,
  Link2,
  Sparkles,
  SlidersHorizontal,
  Sun,
  Timer,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react-native";

import { ProLock } from "@/features/ProGate";
import { evaluateStackLocally, localStackScore, type RuleAlert } from "@/domain/rules-engine";
import { FREE_INSIGHT_LIMIT } from "@/store/entitlements";
import { useIsPro } from "@/store/purchases";
import { useStack } from "@/store/stack-store";
import {
  Badge,
  Card,
  EmptyState,
  IconButton,
  PageHeader,
  Row,
  Screen,
  ScoreRing,
  Stack,
  Text,
  colors,
  space,
  type ToneName,
} from "@/ui";

const chrono = [
  {
    time: "07:10",
    text: "Get 10 minutes of outdoor light before NMN — the cortisol peak improves NAD+ uptake.",
  },
  { time: "12:30", text: "Pair Omega-3 and CoQ10 with your largest fat-containing meal." },
  {
    time: "16:00",
    text: "Caffeine cutoff. Alpha-GPC after this point can blunt evening melatonin onset.",
  },
  { time: "21:30", text: "Dim lights, then take Magnesium Glycinate on an empty stomach." },
];

const typeMeta: Record<RuleAlert["type"], { tag: string; icon: LucideIcon; tone: ToneName }> = {
  synergy: { tag: "Synergy detected", icon: Link2, tone: "emerald" },
  conflict: { tag: "Absorption conflict", icon: AlertTriangle, tone: "amber" },
  overdose: { tag: "Upper limit exceeded", icon: TriangleAlert, tone: "crimson" },
  timing: { tag: "Timing rule", icon: Timer, tone: "cyan" },
};

export default function InsightsScreen() {
  const { items, settings } = useStack();
  const isPro = useIsPro();
  const router = useRouter();

  const alerts = useMemo(() => evaluateStackLocally(items, settings), [items, settings]);
  const score = localStackScore(alerts, items.length);
  const actionable = alerts.filter((a) => a.severity !== "low").length;

  const visibleAlerts = isPro ? alerts : alerts.slice(0, FREE_INSIGHT_LIMIT);
  const lockedCount = alerts.length - visibleAlerts.length;

  return (
    <>
      <PageHeader
        eyebrow="On-device rules engine"
        title="Stack Insights"
        right={
          <IconButton
            icon={SlidersHorizontal}
            label="Rule thresholds"
            onPress={() => router.push("/rule-settings")}
          />
        }
      />

      <Screen>
        <Stack gap={space.lg}>
          <Card tone="cyan" glowing>
            <Row gap={space.lg}>
              <ScoreRing value={score} size={92} stroke={9} tone="cyan" display={`${score}`} />
              <View style={styles.scoreCopy}>
                <Text variant="eyebrow" tone="cyan">
                  Stack health
                </Text>
                <Text variant="title">
                  {score >= 85 ? "Highly optimized" : score >= 65 ? "Needs tuning" : "Conflicts found"}
                </Text>
                <Text variant="micro" tone="muted">
                  {items.length} compound{items.length === 1 ? "" : "s"} analysed · Zn limit{" "}
                  {settings.zincLimitMg}mg · {actionable} adjustment{actionable === 1 ? "" : "s"}{" "}
                  recommended
                </Text>
              </View>
            </Row>
          </Card>

          <Row gap={space.sm} style={styles.privacy}>
            <Cpu size={14} color={colors.emerald} strokeWidth={2.2} />
            <Text variant="micro" tone="muted" style={styles.privacyCopy}>
              Evaluated locally on this device — no stack data ever leaves your phone.
            </Text>
          </Row>

          <Row gap={space.sm}>
            <Sparkles size={14} color={colors.cyan} strokeWidth={2.2} />
            <Text variant="caption" tone="muted">
              Interaction analysis
            </Text>
          </Row>

          {alerts.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No interactions detected"
              description="Nothing in your current cabinet triggers a conflict, synergy or upper-limit rule."
            />
          ) : (
            visibleAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
          )}

          {lockedCount > 0 ? (
            <Stack gap={space.sm}>
              <Text variant="micro" tone="muted">
                {lockedCount} more interaction{lockedCount === 1 ? "" : "s"} found in your stack.
              </Text>
              <ProLock gate="full-insights" />
            </Stack>
          ) : null}

          <Card>
            <Row gap={space.sm}>
              <Sun size={16} color={colors.amber} strokeWidth={2.2} />
              <Text variant="body" weight="semibold">
                Chronobiology plan
              </Text>
            </Row>
            <Stack gap={space.md} style={styles.chrono}>
              {chrono.map((c) => (
                <Row key={c.time} gap={space.md} align="flex-start">
                  <Text variant="micro" tone="cyan" weight="semibold" tabular style={styles.chronoTime}>
                    {c.time}
                  </Text>
                  <Text variant="caption" tone="muted" style={styles.chronoCopy}>
                    {c.text}
                  </Text>
                </Row>
              ))}
            </Stack>
          </Card>
        </Stack>
      </Screen>
    </>
  );
}

function AlertCard({ alert }: { alert: RuleAlert }) {
  const meta = typeMeta[alert.type];
  const tone: ToneName = alert.severity === "high" ? "crimson" : meta.tone;
  const Icon = meta.icon;

  return (
    <Card tone={tone}>
      <Row gap={space.sm} style={styles.alertHead}>
        <Row gap={space.sm} style={styles.alertTag}>
          <Icon size={16} color={colors[tone]} strokeWidth={2.2} />
          <Text variant="eyebrow" tone={tone} numberOfLines={1}>
            {meta.tag}
          </Text>
        </Row>
        <Badge label={alert.severity} tone={tone} />
      </Row>
      <Text variant="body" weight="semibold" style={styles.alertTitle}>
        {alert.title}
      </Text>
      <Text variant="caption" tone="muted" style={styles.alertBody}>
        {alert.description}
      </Text>
      <Text variant="micro" tone={tone} weight="semibold" style={styles.alertStep}>
        → {alert.actionableStep}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  scoreCopy: { flex: 1, gap: space.xs },
  privacy: { alignItems: "flex-start" },
  privacyCopy: { flex: 1 },

  alertHead: { justifyContent: "space-between" },
  alertTag: { flex: 1 },
  alertTitle: { marginTop: space.sm },
  alertBody: { marginTop: space.xs },
  alertStep: { marginTop: space.sm },

  chrono: { marginTop: space.md },
  chronoTime: { width: 42 },
  chronoCopy: { flex: 1 },
});
