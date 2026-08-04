import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { Touchable } from "./Pressable";
import { Text } from "./Text";
import { useResponsive } from "./responsive";
import { alpha, colors, glow, MIN_TOUCH, radius, space } from "./theme";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "tonal";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  /** Tint for the `tonal` variant. */
  tone?: "emerald" | "cyan" | "amber" | "crimson";
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

const heights: Record<ButtonSize, number> = { sm: MIN_TOUCH, md: 48, lg: 56 };
const paddings: Record<ButtonSize, number> = { sm: space.md, md: space.lg, lg: space.xl };

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon: Icon,
  disabled,
  loading,
  fullWidth,
  tone = "cyan",
  style,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const { scale } = useResponsive();
  const tint = colors[tone];

  const surface: ViewStyle =
    variant === "primary"
      ? { backgroundColor: colors.emerald, ...glow(colors.emerald) }
      : variant === "danger"
        ? { backgroundColor: colors.crimson }
        : variant === "secondary"
          ? { backgroundColor: colors.muted }
          : variant === "tonal"
            ? { backgroundColor: alpha(tint, 0.15) }
            : variant === "outline"
              ? { borderWidth: 1, borderColor: colors.border, backgroundColor: "transparent" }
              : { backgroundColor: "transparent" };

  const labelTone =
    variant === "primary" || variant === "danger"
      ? "onAccent"
      : variant === "tonal"
        ? tone
        : variant === "ghost"
          ? "muted"
          : "default";

  return (
    <Touchable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      haptic={variant === "danger" ? "warning" : "light"}
      accessibilityLabel={label}
      {...(accessibilityHint ? { accessibilityHint } : {})}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={StyleSheet.flatten([
        styles.base,
        surface,
        {
          minHeight: scale(heights[size]),
          paddingHorizontal: paddings[size],
        },
        fullWidth ? styles.fullWidth : null,
        style,
      ])}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" || variant === "danger" ? colors.onAccent : tint}
        />
      ) : (
        <View style={styles.content}>
          {Icon ? (
            <Icon
              size={size === "lg" ? 18 : 16}
              color={
                labelTone === "onAccent"
                  ? colors.onAccent
                  : labelTone === "muted"
                    ? colors.mutedForeground
                    : labelTone === "default"
                      ? colors.foreground
                      : tint
              }
              strokeWidth={2.2}
            />
          ) : null}
          <Text
            variant={size === "lg" ? "bodyLg" : "body"}
            weight="semibold"
            tone={labelTone}
            numberOfLines={1}
          >
            {label}
          </Text>
        </View>
      )}
    </Touchable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius["2xl"],
  },
  fullWidth: { width: "100%" },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
});
