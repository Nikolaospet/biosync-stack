import { useMemo } from "react";
import { PixelRatio, useWindowDimensions } from "react-native";

import { space } from "./theme";

/**
 * Breakpoints in dp. `compact` covers the iPhone SE class, `regular` is the
 * mainstream phone, `wide` is a large phone in landscape or a small tablet and
 * `expanded` is a full tablet.
 */
export const breakpoints = {
  compact: 0,
  regular: 375,
  wide: 600,
  expanded: 840,
} as const;

export type Breakpoint = keyof typeof breakpoints;

export interface Responsive {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isTablet: boolean;
  isLandscape: boolean;
  isCompact: boolean;
  /** Horizontal page padding. */
  gutter: number;
  /** Content column width — keeps the phone layout readable on tablets. */
  contentWidth: number;
  /** Columns for the cabinet/insight grids. */
  columns: number;
  /** Multiplier for the type ramp, clamped so text never runs away. */
  fontScale: number;
  /** Scales a design-system size to the current viewport. */
  scale: (size: number) => number;
}

const MAX_CONTENT_WIDTH = 560;

/**
 * Single source of truth for layout adaptation. Every screen reads its
 * padding, column count and content width from here rather than hard-coding
 * phone dimensions, so the same build looks correct from a 320dp phone to a
 * 1024dp tablet in landscape.
 */
export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const systemFontScale = PixelRatio.getFontScale();

  return useMemo(() => {
    const isLandscape = width > height;
    const breakpoint: Breakpoint =
      width >= breakpoints.expanded
        ? "expanded"
        : width >= breakpoints.wide
          ? "wide"
          : width >= breakpoints.regular
            ? "regular"
            : "compact";

    const isTablet = width >= breakpoints.wide;
    const isCompact = breakpoint === "compact";

    const gutter = isTablet ? space["2xl"] : isCompact ? space.lg : space.xl;
    const contentWidth = Math.min(width, isTablet ? MAX_CONTENT_WIDTH : width);
    const columns = width >= breakpoints.expanded ? 2 : 1;

    // Honour the user's OS text-size setting but cap the growth so a 200%
    // setting cannot break the fixed-height rows and pill badges.
    const fontScale = Math.min(1.35, Math.max(0.9, systemFontScale));

    // Linear scale against a 390dp reference (iPhone 14), clamped so small
    // phones stay legible and tablets do not get cartoonishly large controls.
    const ratio = Math.min(1.15, Math.max(0.92, width / 390));

    return {
      width,
      height,
      breakpoint,
      isTablet,
      isLandscape,
      isCompact,
      gutter,
      contentWidth,
      columns,
      fontScale,
      scale: (size: number) => Math.round(size * ratio),
    };
  }, [width, height, systemFontScale]);
}

/**
 * Applies the clamped font scale to a token size.
 * Use with `allowFontScaling={false}` on Text so scaling stays under our control.
 */
export function useScaledFont() {
  const { fontScale } = useResponsive();
  return (size: number) => Math.round(size * fontScale);
}
