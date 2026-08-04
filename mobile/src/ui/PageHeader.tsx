import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text } from "./Text";
import { useResponsive } from "./responsive";
import { alpha, colors, space } from "./theme";

export interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  right?: ReactNode;
  children?: ReactNode;
}

/**
 * Sticky page header. Reproduces the web's frosted `glass` treatment with an
 * opaque tinted surface — React Native has no backdrop-filter, and a solid
 * surface keeps text contrast predictable over scrolling content.
 */
export function PageHeader({ title, eyebrow, right, children }: PageHeaderProps) {
  const insets = useSafeAreaInsets();
  const { gutter, contentWidth } = useResponsive();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + space.md, paddingHorizontal: gutter },
      ]}
    >
      <View style={{ width: "100%", maxWidth: contentWidth, alignSelf: "center" }}>
        <View style={styles.top}>
          <View style={styles.titleBlock}>
            {eyebrow ? (
              <Text variant="eyebrow" tone="muted" numberOfLines={1}>
                {eyebrow}
              </Text>
            ) : null}
            <Text
              variant="headline"
              accessibilityRole="header"
              numberOfLines={1}
              style={styles.title}
            >
              {title}
            </Text>
          </View>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
        {children ? <View style={styles.children}>{children}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: alpha(colors.border, 0.9),
    paddingBottom: space.lg,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space.lg,
  },
  titleBlock: { flexShrink: 1, minWidth: 0 },
  title: { marginTop: 2 },
  right: { flexShrink: 0 },
  children: { marginTop: space.lg },
});
