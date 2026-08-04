import { useRouter } from "expo-router";
import { Lock, Sparkles } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { gateCopy, type Gate } from "@/store/entitlements";
import { useIsPro } from "@/store/purchases";
import { Button, Card, Row, Text, alpha, colors, radius, space } from "@/ui";

export interface ProGateProps {
  gate: Gate;
  /** Compact variant fits inside an existing card instead of replacing one. */
  compact?: boolean;
}

/** Upsell card shown in place of a locked feature. */
export function ProLock({ gate, compact }: ProGateProps) {
  const router = useRouter();
  const copy = gateCopy[gate];

  return (
    <Card tone="cyan" style={compact ? styles.compact : undefined}>
      <Row gap={space.md} align="flex-start">
        <View style={styles.badge}>
          <Lock size={16} color={colors.cyan} strokeWidth={2.2} />
        </View>
        <View style={styles.copy}>
          <Text variant="title">{copy.title}</Text>
          <Text variant="caption" tone="muted">
            {copy.description}
          </Text>
        </View>
      </Row>
      <Button
        label="Unlock Pro"
        icon={Sparkles}
        variant="tonal"
        tone="cyan"
        size="sm"
        fullWidth
        onPress={() => router.push("/paywall")}
        accessibilityHint="Opens the BioSync Pro upgrade options"
        style={styles.cta}
      />
    </Card>
  );
}

/**
 * Renders `children` for Pro users and the upsell for everyone else.
 * Keeps gating declarative at the call site.
 */
export function ProOnly({
  gate,
  children,
  compact,
}: ProGateProps & { children: React.ReactNode }) {
  const isPro = useIsPro();
  if (isPro) return <>{children}</>;
  return <ProLock gate={gate} {...(compact ? { compact } : {})} />;
}

const styles = StyleSheet.create({
  compact: { padding: space.md },
  badge: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(colors.cyan, 0.14),
  },
  copy: { flex: 1, gap: space.xs },
  cta: { marginTop: space.lg },
});
