import { StyleSheet, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { Text } from "./Text";
import { colors, tones, type ToneName } from "./theme";

export interface ScoreRingProps {
  /** 0–100. */
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  tone?: ToneName;
  /** Overrides the centre number, e.g. a raw score instead of a percentage. */
  display?: string;
}

/**
 * Circular progress indicator — the native twin of the web `<ScoreRing />`.
 * The whole ring is a single accessibility node so a screen reader announces
 * "Consistency, 75 percent" rather than reading the SVG parts.
 */
export function ScoreRing({
  value,
  size = 72,
  stroke = 7,
  label,
  tone = "emerald",
  display,
}: ScoreRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;
  const color = tones[tone];

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label ? `${label}: ${Math.round(clamped)} percent` : `${Math.round(clamped)} percent`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
    >
      <Svg width={size} height={size}>
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={colors.border}
            strokeWidth={stroke}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
          />
        </G>
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text variant="body" weight="semibold" tabular>
          {display ?? `${Math.round(clamped)}%`}
        </Text>
        {label ? (
          <Text variant="micro" tone="muted" style={styles.label}>
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", flexShrink: 0 },
  center: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { letterSpacing: 0.6, textTransform: "uppercase" },
});
