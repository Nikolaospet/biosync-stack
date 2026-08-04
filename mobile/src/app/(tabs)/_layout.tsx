import { Tabs } from "expo-router";
import { Bell, CalendarCheck, Package, ShoppingCart, Sparkles } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TAB_BAR_HEIGHT, alpha, colors, fontSize, space } from "@/ui";

/**
 * Bottom tab bar. Labels are always visible — icon-only tabs test poorly for
 * first-time users and are harder to reach with a screen reader.
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.emerald,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: [
          styles.bar,
          { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom },
        ],
        tabBarItemStyle: styles.item,
        tabBarLabelStyle: styles.label,
        tabBarAllowFontScaling: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarAccessibilityLabel: "Today's protocol",
          tabBarIcon: ({ color }) => <CalendarCheck size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="cabinet"
        options={{
          title: "Cabinet",
          tabBarAccessibilityLabel: "Supplement cabinet",
          tabBarIcon: ({ color }) => <Package size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: "Alerts",
          tabBarAccessibilityLabel: "Reminders and alerts",
          tabBarIcon: ({ color }) => <Bell size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarAccessibilityLabel: "Stack insights",
          tabBarIcon: ({ color }) => <Sparkles size={22} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="reorder"
        options={{
          title: "Reorder",
          tabBarAccessibilityLabel: "Smart reorder",
          tabBarIcon: ({ color }) => <ShoppingCart size={22} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: alpha(colors.border, 0.9),
    paddingTop: space.sm,
    elevation: 0,
  },
  item: { paddingVertical: 0 },
  label: {
    fontSize: fontSize.micro,
    fontWeight: "500",
    marginTop: 2,
  },
});
