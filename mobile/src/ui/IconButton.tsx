import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";

import { Touchable } from "./Pressable";
import { alpha, colors, MIN_TOUCH, radius, tones, type ToneName } from "./theme";

export interface IconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  /** Required — an icon alone conveys nothing to a screen reader. */
  label: string;
  variant?: "outline" | "filled" | "plain" | "tonal";
  tone?: ToneName;
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Circular icon-only action, sized to the platform minimum touch target. */
export function IconButton({
  icon: Icon,
  onPress,
  label,
  variant = "outline",
  tone = "emerald",
  size = MIN_TOUCH,
  disabled,
  style,
  testID,
}: IconButtonProps) {
  const tint = tones[tone];

  const surface: ViewStyle =
    variant === "filled"
      ? { backgroundColor: tint }
      : variant === "tonal"
        ? { backgroundColor: alpha(tint, 0.15) }
        : variant === "outline"
          ? { borderWidth: 1, borderColor: alpha(colors.border, 0.8) }
          : {};

  const iconColor =
    variant === "filled" ? colors.onAccent : variant === "tonal" ? tint : colors.mutedForeground;

  return (
    <Touchable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      style={StyleSheet.flatten([
        styles.base,
        { width: size, height: size, borderRadius: radius.full },
        surface,
        style,
      ])}
    >
      <Icon size={Math.round(size * 0.42)} color={iconColor} strokeWidth={2.2} />
    </Touchable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
});
