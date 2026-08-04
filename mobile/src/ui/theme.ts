import { Platform } from "react-native";

/**
 * BioSync Stack design system — dark-first biohacking aesthetic.
 *
 * These tokens are the native counterpart of the web app's `styles.css`. The
 * brand colours keep their canonical hex values; the neutrals are the sRGB
 * conversions of the original oklch ramp, so both platforms render the same UI.
 */
export const colors = {
  background: "#0B0F17",
  foreground: "#F3F6FA",

  surface: "#121824",
  surfaceElevated: "#1B212B",
  card: "#121824",

  emerald: "#10B981",
  cyan: "#06B6D4",
  amber: "#F59E0B",
  crimson: "#EF4444",

  primary: "#10B981",
  primaryForeground: "#0B0F17",

  muted: "#202630",
  mutedForeground: "#9199A5",
  accent: "#222C37",
  border: "#282E38",

  /** Reserved for text on a coloured (emerald/crimson) fill. */
  onAccent: "#0B0F17",
  overlay: "rgba(11, 15, 23, 0.88)",
} as const;

export type ToneName = "emerald" | "cyan" | "amber" | "crimson";

export const tones: Record<ToneName, string> = {
  emerald: colors.emerald,
  cyan: colors.cyan,
  amber: colors.amber,
  crimson: colors.crimson,
};

/**
 * Applies an alpha channel to a `#RRGGBB` token.
 * Mirrors the web's `bg-emerald/10` style opacity utilities.
 */
export function alpha(hex: string, amount: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, amount))})`;
}

/** 4pt spacing scale. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

/** Radii derived from the web `--radius: 1rem` base. */
export const radius = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 28,
  full: 999,
} as const;

/**
 * Type ramp. The web design used 9–11px labels, which fall below both the iOS
 * (11pt) and Android (12sp) legibility floors — the native ramp lifts those to
 * 11/12pt while keeping the visual hierarchy intact.
 */
export const fontSize = {
  micro: 11,
  caption: 12,
  body: 13,
  bodyLg: 14,
  title: 16,
  headline: 20,
  display: 28,
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const satisfies Record<string, "400" | "500" | "600" | "700">;

/** Minimum interactive size. Apple HIG: 44pt. Material: 48dp. */
export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
export const MIN_TOUCH = Platform.OS === "android" ? 48 : 44;

/** Coloured glow used on primary CTAs and highlight cards. */
export function glow(color: string) {
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOpacity: 0.45,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 8, shadowColor: color },
    default: {},
  });
}

export const elevation = {
  card: Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 3 },
    default: {},
  }),
} as const;

/** Duration tokens; every one is skipped when Reduce Motion is on. */
export const motion = {
  fast: 150,
  base: 240,
  slow: 600,
} as const;
