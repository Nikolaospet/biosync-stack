import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { Text } from "./Text";
import { useResponsive } from "./responsive";
import { alpha, colors, fontSize, MIN_TOUCH, radius, space } from "./theme";

export interface FieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  hint?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
}

/** Labelled text field with a focus ring and an inline error slot. */
export function Field({
  label,
  hint,
  error,
  containerStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...rest
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const { fontScale } = useResponsive();

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="caption" tone="muted" weight="medium" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        selectionColor={colors.emerald}
        accessibilityLabel={label ?? rest.placeholder ?? undefined}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
        style={StyleSheet.flatten([
          styles.input,
          {
            fontSize: Math.round(fontSize.bodyLg * fontScale),
            borderColor: error
              ? colors.crimson
              : focused
                ? alpha(colors.cyan, 0.7)
                : colors.border,
          },
          inputStyle,
        ])}
      />
      {error ? (
        <Text variant="micro" tone="crimson" style={styles.helper}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="micro" tone="muted" style={styles.helper}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: space.xs + 2 },
  input: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: colors.surface,
    color: colors.foreground,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
  },
  helper: { marginTop: space.xs + 2 },
});
