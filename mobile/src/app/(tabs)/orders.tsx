import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { Button, EmptyState, StatusBadge } from "@/components/ui";
import { Colors, Radius, Shadow } from "@/constants/theme";
import { mediaUrl } from "@/lib/api";
import { formatMoney } from "@/lib/catalog";
import { useLanguage } from "@/lib/i18n";
import { isActiveOrder, useStore, type CustomerOrder } from "@/lib/store";

export default function OrdersScreen() {
  const { t, language } = useLanguage();
  const { orders, refreshOrders } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  // Refresh statuses whenever the tab is open, and every few seconds while it is.
  useFocusEffect(
    useCallback(() => {
      refreshOrders();
      const timer = setInterval(refreshOrders, 5000);
      return () => clearInterval(timer);
    }, [refreshOrders]),
  );

  const ongoing = orders.filter((o) => isActiveOrder(o.status));
  const completed = orders.filter((o) => !isActiveOrder(o.status));

  return (
    <View style={styles.screen}>
      <AppHeader title={t("myOrders")} subtitle={t("ordersSubtitle")} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refreshOrders();
              setRefreshing(false);
            }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {orders.length === 0 ? (
          <EmptyState icon="receipt-outline" title={t("noOrders")} hint={t("noOrdersHint")}>
            <Button
              title={t("startShopping")}
              icon="bag-handle-outline"
              onPress={() => router.push("/")}
              style={{ marginTop: 18 }}
            />
          </EmptyState>
        ) : (
          <>
            {ongoing.length > 0 && (
              <>
                <Text style={styles.group}>
                  {t("ongoing")} · {ongoing.length}
                </Text>
                {ongoing.map((order) => (
                  <OrderCard key={order.id} order={order} language={language} />
                ))}
              </>
            )}
            {completed.length > 0 && (
              <>
                <Text style={[styles.group, ongoing.length > 0 && { marginTop: 20 }]}>
                  {t("completed")} · {completed.length}
                </Text>
                {completed.map((order) => (
                  <OrderCard key={order.id} order={order} language={language} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function OrderCard({ order, language }: { order: CustomerOrder; language: string }) {
  const { t } = useLanguage();
  const active = isActiveOrder(order.status);
  const uri = mediaUrl(order.imageUrl);
  const isService = order.listingType === "service";
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/track/[id]", params: { id: order.id } })}
      style={({ pressed }) => [styles.card, active && styles.cardActive, pressed && { opacity: 0.9 }]}
    >
      {active && <View style={styles.activeBar} />}
      <View style={styles.row}>
        <View style={styles.thumb}>
          {uri ? (
            <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          ) : (
            <Ionicons name={isService ? "construct-outline" : "bag-handle-outline"} size={26} color={Colors.textFaint} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {order.title}
            </Text>
          </View>
          <Text style={styles.price}>
            {formatMoney(order.currency, order.total)}
            <Text style={styles.qty}> · x{order.quantity}</Text>
          </Text>
          {!!order.deliveryFee && (
            <Text style={styles.qty}>
              {t("inclDelivery", { fee: formatMoney(order.currency, order.deliveryFee) })}
            </Text>
          )}
          <View style={{ marginTop: 6 }}>
            <StatusBadge status={order.status} />
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textFaint} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>DukaHub</Text>
        <Text style={styles.footerText}>
          {new Date(order.createdAt).toLocaleString(language === "sw" ? "sw-TZ" : "en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  group: {
    marginBottom: 10,
    fontSize: 12,
    fontWeight: "900",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  card: {
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    overflow: "hidden",
    ...Shadow.card,
  },
  cardActive: { borderColor: "#FED7AA" },
  activeBar: { height: 3, backgroundColor: Colors.primary },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  titleRow: { flexDirection: "row", alignItems: "center" },
  title: { flex: 1, fontSize: 14.5, fontWeight: "900", color: Colors.navy },
  price: { marginTop: 4, fontSize: 14, fontWeight: "900", color: Colors.primary },
  qty: { fontSize: 12, fontWeight: "700", color: Colors.textFaint },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  footerText: { fontSize: 11, fontWeight: "600", color: Colors.textFaint },
});
