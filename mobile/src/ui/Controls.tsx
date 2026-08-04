import Slider from "@react-native-community/slider";
import { Platform, StyleSheet, Switch as RNSwitch, View } from "react-native";

import { Touchable } from "./Pressable";
import { Text } from "./Text";
import { alpha, colors, MIN_TOUCH, radius, space } from "./theme";

export interface ToggleProps {
  value: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}

/** Brand-tinted platform switch. Always paired with an accessibility label. */
export function Toggle({ value, onChange, label, disabled }: ToggleProps) {
  return (
    <RNSwitch
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="switch"
      trackColor={{ false: colors.muted, true: alpha(colors.emerald, 0.55) }}
      thumbColor={Platform.OS === "android" ? (value ? colors.emerald : "#8A93A0") : undefined}
      ios_backgroundColor={colors.muted}
    />
  );
}

export interface RangeProps {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  tone?: "emerald" | "cyan";
}

/** Continuous value control used for the rule thresholds and lead times. */
export function Range({ value, onChange, min, max, step = 1, label, tone = "cyan" }: RangeProps) {
  const tint = colors[tone];
  return (
    <Slider
      value={value}
      onValueChange={onChange}
      minimumValue={min}
      maximumValue={max}
      step={step}
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      minimumTrackTintColor={tint}
      maximumTrackTintColor={colors.muted}
      thumbTintColor={tint}
      style={styles.slider}
    />
  );
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  tone?: "emerald" | "cyan";
  label?: string;
}

/**
 * Horizontal choice control replacing the web's pill button rows.
 * Each segment is a full-height touch target so it clears the 44pt minimum.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  tone = "emerald",
  label,
}: SegmentedProps<T>) {
  const tint = colors[tone];
  return (
    <View
      style={styles.segmented}
      accessibilityRole="radiogroup"
      {...(label ? { accessibilityLabel: label } : {})}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Touchable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
            style={StyleSheet.flatten([
              styles.segment,
              active
                ? { backgroundColor: alpha(tint, 0.16), borderColor: alpha(tint, 0.45) }
                : { backgroundColor: colors.muted, borderColor: "transparent" },
            ])}
          >
            <Text
              variant="micro"
              weight="semibold"
              tone={active ? tone : "muted"}
              numberOfLines={1}
              center
            >
              {option.label}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}

export interface ProgressBarProps {
  /** 0–100. */
  percent: number;
  tone?: "emerald" | "cyan" | "amber" | "crimson";
  label?: string;
}

/** Thin fill bar used for remaining pills. */
export function ProgressBar({ percent, tone, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const auto = clamped < 20 ? "crimson" : clamped < 40 ? "amber" : "emerald";
  const tint = colors[tone ?? auto];

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      {...(label ? { accessibilityLabel: label } : {})}
    >
      <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: tint }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  slider: {
    width: "100%",
    height: MIN_TOUCH,
  },
  segmented: {
    flexDirection: "row",
    gap: space.sm,
  },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xs,
  },
  track: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.full,
  },
});
