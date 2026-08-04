import { useCallback } from "react";
import {
  AccessibilityInfo,
  Platform,
  Pressable as RNPressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

import { HIT_SLOP } from "./theme";

export interface TouchableProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  /** Fires a light impact on press. Off for destructive/secondary controls. */
  haptic?: "light" | "medium" | "success" | "warning" | "none";
  /** Dims to this opacity while pressed. */
  pressedOpacity?: number;
}

/**
 * Pressable with the app's default hit slop, press feedback and haptics.
 *
 * Every interactive element in the app goes through this so accessibility
 * roles, minimum touch targets and disabled states stay consistent.
 */
export function Touchable({
  style,
  haptic = "light",
  pressedOpacity = 0.6,
  onPress,
  disabled,
  accessibilityRole = "button",
  hitSlop = HIT_SLOP,
  ...rest
}: TouchableProps) {
  const handlePress = useCallback<NonNullable<PressableProps["onPress"]>>(
    (event) => {
      if (haptic !== "none" && Platform.OS !== "web") {
        const impact =
          haptic === "success"
            ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            : haptic === "warning"
              ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
              : Haptics.impactAsync(
                  haptic === "medium"
                    ? Haptics.ImpactFeedbackStyle.Medium
                    : Haptics.ImpactFeedbackStyle.Light,
                );
        void impact.catch(() => undefined);
      }
      onPress?.(event);
    },
    [haptic, onPress],
  );

  return (
    <RNPressable
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={handlePress}
      style={({ pressed }) => [
        style,
        pressed && !disabled ? { opacity: pressedOpacity } : null,
        disabled ? { opacity: 0.4 } : null,
      ]}
      {...rest}
    />
  );
}

/** Resolves whether the user has asked the OS to reduce motion. */
export async function prefersReducedMotion() {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch {
    return false;
  }
}
