import { Text as RNText, StyleSheet, type TextProps, type TextStyle } from "react-native";

import { useResponsive } from "./responsive";
import { colors, fontSize, fontWeight, tones, type ToneName } from "./theme";

export type TextVariant =
  | "display"
  | "headline"
  | "title"
  | "body"
  | "bodyLg"
  | "caption"
  | "micro"
  | "eyebrow";

export type TextTone = ToneName | "default" | "muted" | "onAccent";

const variantStyle: Record<TextVariant, TextStyle> = {
  display: { fontSize: fontSize.display, fontWeight: fontWeight.bold, letterSpacing: -0.5 },
  headline: { fontSize: fontSize.headline, fontWeight: fontWeight.semibold, letterSpacing: -0.3 },
  title: { fontSize: fontSize.title, fontWeight: fontWeight.semibold },
  bodyLg: { fontSize: fontSize.bodyLg, fontWeight: fontWeight.regular },
  body: { fontSize: fontSize.body, fontWeight: fontWeight.regular },
  caption: { fontSize: fontSize.caption, fontWeight: fontWeight.regular },
  micro: { fontSize: fontSize.micro, fontWeight: fontWeight.medium },
  eyebrow: {
    fontSize: fontSize.micro,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
};

function toneColor(tone: TextTone) {
  if (tone === "default") return colors.foreground;
  if (tone === "muted") return colors.mutedForeground;
  if (tone === "onAccent") return colors.onAccent;
  return tones[tone];
}

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  weight?: keyof typeof fontWeight;
  /** Renders digits at a fixed width so numbers do not jitter as they change. */
  tabular?: boolean;
  center?: boolean;
}

/**
 * The only Text component screens should use. It applies the type ramp, the
 * clamped font scale and a sane default line height, and it keeps OS font
 * scaling under our control so fixed-height rows cannot be broken by a 200%
 * accessibility text setting.
 */
export function Text({
  variant = "body",
  tone = "default",
  weight,
  tabular,
  center,
  style,
  ...rest
}: AppTextProps) {
  const { fontScale } = useResponsive();
  const base = variantStyle[variant];
  const size = Math.round((base.fontSize ?? fontSize.body) * fontScale);

  return (
    // Scaling is applied above from the clamped `fontScale`, so the platform
    // must not scale a second time on top of it.
    <RNText
      allowFontScaling={false}
      {...rest}
      style={StyleSheet.flatten([
        base,
        {
          fontSize: size,
          lineHeight: Math.round(size * (variant === "eyebrow" ? 1.4 : 1.45)),
          color: toneColor(tone),
        },
        weight ? { fontWeight: fontWeight[weight] } : null,
        tabular ? { fontVariant: ["tabular-nums"] as TextStyle["fontVariant"] } : null,
        center ? { textAlign: "center" } : null,
        style,
      ])}
    />
  );
}
