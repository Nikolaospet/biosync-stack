import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react-native";

import { Text } from "./Text";
import { useResponsive } from "./responsive";
import { alpha, colors, motion, radius, space, tones } from "./theme";

type ToastKind = "success" | "error" | "info" | "warning";

interface ToastPayload {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastApi {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const VISIBLE_MS = 2800;

const kindMeta = {
  success: { icon: CheckCircle2, tone: "emerald" },
  error: { icon: XCircle, tone: "crimson" },
  warning: { icon: AlertTriangle, tone: "amber" },
  info: { icon: Info, tone: "cyan" },
} as const;

/**
 * Lightweight toast host — the native replacement for `sonner`.
 * Announces every message to screen readers, since a visual-only toast is
 * invisible to assistive tech.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const counter = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;
  const insets = useSafeAreaInsets();
  const { gutter, contentWidth } = useResponsive();

  const show = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      counter.current += 1;
      setToast({
        id: counter.current,
        kind,
        title,
        ...(description ? { description } : {}),
      });
      AccessibilityInfo.announceForAccessibility?.(
        description ? `${title}. ${description}` : title,
      );
    },
    [],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (t, d) => show("success", t, d),
      error: (t, d) => show("error", t, d),
      info: (t, d) => show("info", t, d),
      warning: (t, d) => show("warning", t, d),
    }),
    [show],
  );

  useEffect(() => {
    if (!toast) return;

    if (timer.current) clearTimeout(timer.current);
    opacity.setValue(0);
    translateY.setValue(-16);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.fast,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: motion.base,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    timer.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: motion.fast,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setToast(null);
      });
    }, VISIBLE_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast, opacity, translateY]);

  const meta = toast ? kindMeta[toast.kind] : null;
  const Icon = meta?.icon;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast && meta && Icon ? (
        <View
          pointerEvents="none"
          style={[styles.host, { top: insets.top + space.sm, paddingHorizontal: gutter }]}
        >
          <Animated.View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[
              styles.toast,
              {
                maxWidth: contentWidth,
                borderColor: alpha(tones[meta.tone], 0.45),
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            <Icon size={18} color={tones[meta.tone]} strokeWidth={2.2} />
            <View style={styles.copy}>
              <Text variant="body" weight="semibold" numberOfLines={2}>
                {toast.title}
              </Text>
              {toast.description ? (
                <Text variant="micro" tone="muted" numberOfLines={2}>
                  {toast.description}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  toast: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  copy: { flex: 1, gap: 2 },
});
