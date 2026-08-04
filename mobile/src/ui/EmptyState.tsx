import { StyleSheet, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { Button } from "./Button";
import { Card } from "./Card";
import { Text } from "./Text";
import { alpha, colors, radius, space } from "./theme";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Shown wherever a list can legitimately be empty, instead of a blank screen. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.badge}>
        <Icon size={22} color={colors.emerald} strokeWidth={2} />
      </View>
      <Text variant="title" center style={styles.title}>
        {title}
      </Text>
      <Text variant="caption" tone="muted" center>
        {description}
      </Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} size="sm" style={styles.action} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", paddingVertical: space["3xl"] },
  badge: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(colors.emerald, 0.12),
    marginBottom: space.lg,
  },
  title: { marginBottom: space.xs },
  action: { marginTop: space.lg },
});
