import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { alpha, colors, elevation, glow, radius, space, tones, type ToneName } from "./theme";

export interface CardProps {
  children: ReactNode;
  /** Tinted border + background, matching the web's `border-cyan/25 bg-cyan/5`. */
  tone?: ToneName;
  /** Adds the coloured glow used on hero/CTA cards. */
  glowing?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Rounded surface panel — the base container for every section in the app. */
export function Card({ children, tone, glowing, padded = true, style, accessibilityLabel }: CardProps) {
  const tint = tone ? tones[tone] : null;

  return (
    <View
      accessible={!!accessibilityLabel}
      {...(accessibilityLabel ? { accessibilityLabel } : {})}
      style={StyleSheet.flatten([
        styles.card,
        tint
          ? { borderColor: alpha(tint, 0.28), backgroundColor: alpha(tint, 0.06) }
          : { borderColor: alpha(colors.border, 0.8), backgroundColor: alpha(colors.card, 0.75) },
        padded ? styles.padded : null,
        glowing && tint ? glow(tint) : elevation.card,
        style,
      ])}
    >
      {children}
    </View>
  );
}

/** Thin divider matching the web's `divide-border/60`. */
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius["3xl"],
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: "hidden",
  },
  padded: { padding: space.lg },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: alpha(colors.border, 0.7),
  },
});
