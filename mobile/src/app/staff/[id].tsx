import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StaffStatusBadge } from "@/components/StaffStatusBadge";
import { Button, EmptyState } from "@/components/ui";
import { Colors, Radius } from "@/constants/theme";
import { API_URL, mediaUrl } from "@/lib/api";
import { formatMoney } from "@/lib/catalog";
import { useLanguage } from "@/lib/i18n";
import { checkStaffOrders } from "@/lib/notifications";
import { useStaff } from "@/lib/staff";

/** One order: call the customer, open the location, then process it on the website. */
export default function StaffOrderScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, setOrders } = useStaff();
  const order = orders.find((o) => o.id === id);
  const [loading, setLoading] = useState(!order);

  // Opened from a notification before the list was loaded.
  useEffect(() => {
    if (order) return;
    checkStaffOrders()
      .then((list) => list && setOrders(list))
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!order) {
    return loading ? (
      <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
    ) : (
      <EmptyState icon="alert-circle-outline" title={t("noStaffOrders")} />
    );
  }

  const uri = mediaUrl(order.product_image);
  const hasPin = !!(order.latitude && order.longitude);
  const isService = order.listing_type === "service";

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Stack.Screen options={{ title: t("orderDetails") }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 14 }}>
        {/* Product */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <View style={styles.thumb}>
              {uri ? (
                <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <Ionicons name="bag-handle-outline" size={26} color={Colors.textFaint} />
              )}
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.product}>
                {isService ? "" : `${order.quantity}x `}
                {order.product_title}
              </Text>
              <StaffStatusBadge status={order.status} />
            </View>
          </View>
          <View style={styles.divider} />
          <Row label={t("items")} value={formatMoney(order.currency, order.total)} />
          {Number(order.delivery_fee) > 0 && (
            <Row
              label={`${t("deliveryFee")}${order.distance_km ? ` (${Number(order.distance_km)} km)` : ""}`}
              value={formatMoney(order.currency, order.delivery_fee)}
            />
          )}
          <Row label={t("total")} value={formatMoney(order.currency, order.grand_total)} strong />
        </View>

        {/* Customer */}
        <View style={styles.card}>
          <Text style={styles.section}>{t("customer")}</Text>
          <Text style={styles.name}>{order.customer_name}</Text>
          <Text style={styles.phone}>{order.customer_phone}</Text>
          {!!order.delivery_address && (
            <Text style={styles.address}>
              <Ionicons name="location-outline" size={13} color={Colors.textMuted} /> {order.delivery_address}
              {order.city ? ` · ${order.city}` : ""}
            </Text>
          )}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <Button
              title={t("callCustomer")}
              icon="call"
              style={{ flex: 1 }}
              onPress={() => Linking.openURL(`tel:${order.customer_phone.replace(/\s/g, "")}`)}
            />
            {hasPin && (
              <Button
                title={t("openMap")}
                icon="map-outline"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() =>
                  Linking.openURL(`https://www.google.com/maps?q=${order.latitude},${order.longitude}`)
                }
              />
            )}
          </View>
        </View>

        {/* Process */}
        <View style={[styles.card, styles.processCard]}>
          <Ionicons name="information-circle" size={20} color={Colors.primary} />
          <Text style={styles.processText}>{t("processHint")}</Text>
        </View>
        <Pressable
          onPress={() => Linking.openURL(`${API_URL}/admin/orders`)}
          style={({ pressed }) => [styles.webButton, pressed && { opacity: 0.85 }]}
        >
          <Ionicons name="desktop-outline" size={18} color="#FFFFFF" />
          <Text style={styles.webButtonText}>{t("processOnWeb")}</Text>
          <Ionicons name="open-outline" size={16} color="#FFFFFF" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.rowStrong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && { color: Colors.primary, fontSize: 16 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  product: { fontSize: 16, fontWeight: "900", color: Colors.navy },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  rowLabel: { fontSize: 13, color: Colors.textMuted, fontWeight: "600" },
  rowStrong: { color: Colors.navy, fontWeight: "900", fontSize: 15 },
  rowValue: { fontSize: 13, color: Colors.navy, fontWeight: "800" },
  section: {
    fontSize: 11,
    fontWeight: "900",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  name: { marginTop: 6, fontSize: 20, fontWeight: "900", color: Colors.navy },
  phone: { marginTop: 2, fontSize: 15, fontWeight: "800", color: Colors.primary },
  address: { marginTop: 8, fontSize: 13, lineHeight: 19, color: Colors.textMuted },
  processCard: { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: "#FFF7ED", borderColor: "#FED7AA" },
  processText: { flex: 1, fontSize: 13, lineHeight: 19, color: Colors.navy, fontWeight: "600" },
  webButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.navy,
  },
  webButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
});
