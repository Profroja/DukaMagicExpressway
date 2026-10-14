import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LanguagePicker } from "@/components/LanguagePicker";
import { SplashOverlay } from "@/components/SplashOverlay";
import { Colors } from "@/constants/theme";
import { LanguageProvider } from "@/lib/i18n";
import { setupNotifications } from "@/lib/notifications";
import { StoreProvider, useStore } from "@/lib/store";

// Keep the native splash up until the animated one is drawn.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 300, fade: true });

function AppShell() {
  const { ready } = useStore();

  // Permission + channel + background checks, and open an order when its alert is tapped.
  useEffect(() => {
    setupNotifications().catch(() => {});
    const open = (response: Notifications.NotificationResponse | null) => {
      const orderId = response?.notification.request.content.data?.orderId;
      if (typeof orderId === "string") router.push({ pathname: "/track/[id]", params: { id: orderId } });
    };
    open(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: Colors.navy,
          headerTitleStyle: { fontWeight: "800", color: Colors.navy },
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="listing/[id]" options={{ title: "" }} />
        <Stack.Screen name="category/[index]" options={{ title: "" }} />
        <Stack.Screen name="categories" options={{ title: "" }} />
        <Stack.Screen name="search" options={{ title: "" }} />
        <Stack.Screen
          name="track/[id]"
          options={{ headerShown: false, presentation: "fullScreenModal", gestureEnabled: false }}
        />
      </Stack>
      {/* First launch only: under the splash, revealed as it fades. */}
      <LanguagePicker />
      <SplashOverlay ready={ready} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <StoreProvider>
          <AppShell />
        </StoreProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
