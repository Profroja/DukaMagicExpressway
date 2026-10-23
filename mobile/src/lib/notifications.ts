import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundTask from "expo-background-task";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

import { fetchOrderStatus, type OrderStatus } from "@/lib/api";
import { loadOrders, updateOrderStatus } from "@/lib/ordersDb";
import { fetchStaffOrders, loadSession, SessionExpired, takeNewOrders, type StaffOrder } from "@/lib/staff";
import type { CustomerOrder } from "@/lib/store";

/**
 * Order alerts. The app compares each ongoing order's status with the server
 * (while open, and every ~15 minutes in the background) and pops up a local
 * notification when it changes. Tapping it opens the order's tracking screen.
 */

const CHANNEL_ID = "orders";
const STAFF_CHANNEL_ID = "staff-orders";
export const BACKGROUND_TASK = "duka-order-status-check";

// Show alerts even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const TEXT: Record<"en" | "sw", Partial<Record<OrderStatus, [string, string]>>> = {
  en: {
    contacted: ["📞 We're confirming your order", "SokoLink will call you shortly."],
    confirmed: ["✅ Order confirmed", "Your order is confirmed and being prepared."],
    sourcing: ["📦 Preparing your order", "We're getting your items ready."],
    picked_up: ["🛵 On the way!", "SokoLink is bringing your order to you."],
    delivered: ["🎉 Delivered", "Thank you for shopping with SokoLink."],
    cancelled: ["Order cancelled", "This order is no longer being processed."],
  },
  sw: {
    contacted: ["📞 Tunathibitisha agizo lako", "SokoLink itakupigia hivi punde."],
    confirmed: ["✅ Agizo limethibitishwa", "Agizo lako limethibitishwa na linaandaliwa."],
    sourcing: ["📦 Tunaandaa agizo lako", "Tunakusanya bidhaa zako."],
    picked_up: ["🛵 Liko njiani!", "SokoLink inakuletea agizo lako."],
    delivered: ["🎉 Limefika", "Asante kwa kununua na SokoLink."],
    cancelled: ["Agizo limeghairiwa", "Agizo hili halishughulikiwi tena."],
  },
};

/** Ask once for permission and create the Android channel. */
export async function setupNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Order updates",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: "#FF5A14",
    });
    await Notifications.setNotificationChannelAsync(STAFF_CHANNEL_ID, {
      name: "New orders (staff)",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400, 200, 400],
      lightColor: "#FF5A14",
      sound: "default",
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (!current.granted && current.canAskAgain) await Notifications.requestPermissionsAsync();

  try {
    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK, { minimumInterval: 15 });
  } catch {
    // Background checks unavailable (e.g. Expo Go) - in-app checks still work.
  }
}

export async function notifyStatusChange(order: CustomerOrder, status: OrderStatus) {
  const saved = await AsyncStorage.getItem("duka-language").catch(() => null);
  const text = TEXT[saved === "sw" ? "sw" : "en"][status];
  if (!text) return;
  const item = order.listingType === "service" ? order.title : `${order.quantity}x ${order.title}`;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: text[0],
      body: `${item} — ${text[1]}`,
      data: { orderId: order.id },
      sound: true,
    },
    trigger: Platform.OS === "android" ? { channelId: CHANNEL_ID } : null,
  });
}

/** Staff: alert for an order they haven't seen yet. */
export async function notifyNewStaffOrder(order: StaffOrder) {
  const saved = await AsyncStorage.getItem("duka-language").catch(() => null);
  const sw = saved === "sw";
  const item = order.listing_type === "service" ? order.product_title : `${order.quantity}x ${order.product_title}`;
  const where = order.delivery_address || order.city;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: sw ? "🛒 Oda mpya" : "🛒 New order",
      body: `${item} — ${order.customer_name}${where ? ` (${where})` : ""}`,
      data: { staffOrderId: order.id },
      sound: true,
    },
    trigger: Platform.OS === "android" ? { channelId: STAFF_CHANNEL_ID } : null,
  });
}

/**
 * Staff: fetch their city's orders and alert for new ones. Returns the list,
 * or null when nobody is signed in as staff (or the session expired).
 */
export async function checkStaffOrders(): Promise<StaffOrder[] | null> {
  const session = await loadSession();
  if (!session) return null;
  try {
    const { orders } = await fetchStaffOrders(session.token);
    const fresh = await takeNewOrders(orders);
    for (const order of fresh.slice(0, 5)) await notifyNewStaffOrder(order);
    return orders;
  } catch (e) {
    if (e instanceof SessionExpired) return null;
    throw e;
  }
}

/** Background check: same as the in-app refresh, then alerts for changes. */
TaskManager.defineTask(BACKGROUND_TASK, async () => {
  try {
    const orders = await loadOrders();
    const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
    for (const order of active) {
      try {
        const { status } = await fetchOrderStatus(order.id);
        if (status !== order.status) {
          await updateOrderStatus(order.id, status);
          await notifyStatusChange(order, status);
        }
      } catch {}
    }
    await checkStaffOrders().catch(() => null);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});
