import type { ReactNode } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useResponsive } from "./responsive";
import { colors, space } from "./theme";

export interface ScreenProps {
  children: ReactNode;
  /** Sticky header rendered above the scroll area. */
  header?: ReactNode;
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Extra bottom padding, on top of the tab bar clearance. */
  footerSpace?: number;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Height of the custom tab bar, excluding the bottom safe-area inset. */
export const TAB_BAR_HEIGHT = 62;

/**
 * Page shell. Owns safe-area insets, the responsive content column and the
 * scroll behaviour so no screen has to reason about notches or tablet widths.
 */
export function Screen({
  children,
  header,
  scroll = true,
  onRefresh,
  refreshing = false,
  footerSpace = 0,
  contentStyle,
  testID,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { gutter, contentWidth, isTablet } = useResponsive();

  const bottomPad = insets.bottom + TAB_BAR_HEIGHT + space["2xl"] + footerSpace;

  const column: ViewStyle = {
    width: "100%",
    maxWidth: contentWidth,
    alignSelf: "center",
    paddingHorizontal: gutter,
  };

  const body = (
    <View style={[column, contentStyle]} testID={testID}>
      {children}
    </View>
  );

  return (
    <View style={styles.root}>
      {header}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ paddingTop: space.xl, paddingBottom: bottomPad }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          showsVerticalScrollIndicator={!isTablet}
          scrollIndicatorInsets={{ bottom: bottomPad }}
          {...(onRefresh
            ? {
                refreshControl: (
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.emerald}
                    colors={[colors.emerald]}
                    progressBackgroundColor={colors.surface}
                  />
                ),
              }
            : {})}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.flex, { paddingTop: space.xl, paddingBottom: bottomPad }]}>{body}</View>
      )}
    </View>
  );
}

/** Vertical rhythm helper so screens do not repeat `marginBottom` everywhere. */
export function Stack({
  children,
  gap = space.md,
  style,
}: {
  children: ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

/** Horizontal row with the common "content left, action right" layout. */
export function Row({
  children,
  gap = space.md,
  align = "center",
  style,
}: {
  children: ReactNode;
  gap?: number;
  align?: ViewStyle["alignItems"];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ flexDirection: "row", alignItems: align, gap }, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
});
