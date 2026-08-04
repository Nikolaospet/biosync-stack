import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Text } from "./Text";
import { alpha, colors, radius, space, tones, type ToneName } from "./theme";

export interface BadgeProps {
  label: string;
  tone?: ToneName | "neutral";
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Small status pill — expiry state, supply days, severity, block progress. */
export function Badge({ label, tone = "neutral", icon, style }: BadgeProps) {
  const neutral = tone === "neutral";
  const tint = neutral ? colors.mutedForeground : tones[tone];

  return (
    <View
      style={StyleSheet.flatten([
        styles.badge,
        { backgroundColor: neutral ? colors.muted : alpha(tint, 0.15) },
        style,
      ])}
    >
      {icon}
      <Text variant="micro" weight="semibold" tone={neutral ? "muted" : tone} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
  },
});
