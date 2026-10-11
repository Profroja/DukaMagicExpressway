import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useLanguage } from "@/lib/i18n";
import { isActiveOrder, useStore } from "@/lib/store";

export default function TabLayout() {
  const { t } = useLanguage();
  const { cartCount, orders } = useStore();
  const insets = useSafeAreaInsets();
  const ongoing = orders.filter((o) => isActiveOrder(o.status)).length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        // Sit above the phone's navigation bar / gesture area.
        tabBarStyle: {
          borderTopColor: "#F1F5F9",
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
        },
        tabBarBadgeStyle: { backgroundColor: Colors.primary, fontSize: 10, fontWeight: "800" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabHome"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: t("tabServices"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "construct" : "construct-outline"} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t("tabCart"),
          tabBarBadge: cartCount > 0 ? (cartCount > 9 ? "9+" : cartCount) : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "cart" : "cart-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t("tabOrders"),
          tabBarBadge: ongoing > 0 ? ongoing : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "receipt" : "receipt-outline"} size={23} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
