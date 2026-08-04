import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack as RouterStack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";

import { useNotifications } from "@/notifications/use-notifications";
import { PurchasesProvider } from "@/store/purchases";
import { StackProvider, useStack } from "@/store/stack-store";
import { ToastProvider, colors } from "@/ui";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <PurchasesProvider>
          <StackProvider>
            <ToastProvider>
              <AppShell />
            </ToastProvider>
          </StackProvider>
        </PurchasesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const { ready } = useStack();

  // Notification scheduling lives here so it stays in sync no matter which
  // screen the user is on.
  useNotifications();

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return <View style={styles.root} />;

  return (
    <RouterStack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <RouterStack.Screen name="(tabs)" />
      <RouterStack.Screen name="rule-settings" />
      <RouterStack.Screen
        name="scanner"
        options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
      />
      <RouterStack.Screen
        name="paywall"
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
    </RouterStack>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
