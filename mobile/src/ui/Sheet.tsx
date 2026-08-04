import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import { IconButton } from "./IconButton";
import { Text } from "./Text";
import { useResponsive } from "./responsive";
import { alpha, colors, radius, space } from "./theme";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Pinned action area that stays visible above the keyboard. */
  footer?: ReactNode;
}

/**
 * Bottom sheet built on the platform Modal — the native counterpart of the
 * web Dialog. On tablets it centres as a card rather than stretching edge to
 * edge, and it keeps the keyboard from covering its own inputs.
 */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const insets = useSafeAreaInsets();
  const { isTablet, contentWidth } = useResponsive();

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={[styles.backdrop, isTablet && styles.backdropCentered]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Close"
          accessibilityRole="button"
          accessibilityHint={`Dismisses the ${title} sheet`}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[
            styles.sheet,
            isTablet
              ? { maxWidth: contentWidth, borderRadius: radius["3xl"], marginBottom: space["3xl"] }
              : { paddingBottom: Math.max(insets.bottom, space.lg) },
          ]}
        >
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text variant="title" accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <IconButton icon={X} onPress={onClose} label="Close" variant="plain" size={40} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
          >
            {children}
          </ScrollView>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },
  backdropCentered: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: space.xl,
  },
  sheet: {
    width: "100%",
    maxHeight: "88%",
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius["3xl"],
    borderTopRightRadius: radius["3xl"],
    borderWidth: 1,
    borderColor: alpha(colors.border, 0.9),
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginTop: space.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  title: { flexShrink: 1 },
  body: {
    paddingHorizontal: space.xl,
    paddingBottom: space.lg,
    gap: space.lg,
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: alpha(colors.border, 0.8),
  },
});
