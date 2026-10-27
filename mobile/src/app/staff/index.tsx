import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StaffStatusBadge } from "@/components/StaffStatusBadge";
import { BrandLogo, EmptyState, ErrorState } from "@/components/ui";
import { Colors, Radius } from "@/constants/theme";
import { mediaUrl } from "@/lib/api";
import { formatMoney } from "@/lib/catalog";
import { useLanguage } from "@/lib/i18n";
import { checkStaffOrders } from "@/lib/notifications";
import { fetchStaffWork, useStaff, type StaffOrder, type StaffWork } from "@/lib/staff";

const REFRESH_MS = 30_000;
const ACTIVE = ["contacted", "confirmed", "sourcing", "picked_up", "delivered"];

type Filter = "new" | "active" | "all";

/** Staff home: the orders of their city, newest first, refreshed every 30 s. */
export default function StaffOrdersScreen() {
  const { t, language, toggle } = useLanguage();
  const insets = useSafeAreaInsets();
  const { session, signOut, orders, setOrders } = useStaff();
  const [loading, setLoading] = useState(orders.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>("new");
  const [today, setToday] = useState<StaffWork["today"] | null>(null);

  const refresh = () => {
    // Today's numbers for the "My work" card.
    if (session) {
      const day = new Date();
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
      fetchStaffWork(session.token, key, key)
        .then((work) => setToday(work.today))
        .catch(() => {});
    }
    return checkStaffOrders()
      .then((list) => {
        if (list === null) {
          // Session expired or signed out elsewhere.
          signOut().then(() => router.replace("/staff/login"));
          return;
        }
        setOrders(list);
        setFailed(false);
      })
      .catch(() => setFailed(true))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmSignOut = () =>
    Alert.alert(t("logout"), t("logoutConfirm"), [
      { text: t("keepOrder"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: () => signOut().then(() => router.replace("/")),
      },
    ]);

  const counts = {
    new: orders.filter((o) => o.status === "new").length,
    active: orders.filter((o) => ACTIVE.includes(o.status)).length,
    all: orders.length,
  };
  const shown = orders.filter((o) =>
    filter === "new" ? o.status === "new" : filter === "active" ? ACTIVE.includes(o.status) : true,
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <BrandLogo size={38} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hello} numberOfLines={1}>
              {session?.user.name ?? ""}
            </Text>
            <Text style={styles.city}>
              <Ionicons name="location" size={12} color={Colors.primary} />{" "}
              {session?.user.city || t("staffAllCities")}
            </Text>
          </View>
          <Pressable onPress={toggle} hitSlop={8} style={styles.pill} accessibilityLabel={t("language")}>
            <Ionicons name="globe-outline" size={14} color="#FFFFFF" />
            <Text style={styles.pillText}>{language === "en" ? "EN" : "SW"}</Text>
          </Pressable>
          <Pressable onPress={confirmSignOut} hitSlop={8} style={styles.pill} accessibilityLabel={t("logout")}>
            <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/staff/work")}
          style={({ pressed }) => [styles.work, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={t("myWork")}
        >
          <View style={styles.workIcon}>
            <Ionicons name="stats-chart" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.workLabel}>
              {t("myWork")} · {t("collectedToday")}
            </Text>
            <Text style={styles.workMoney} numberOfLines={1}>
              {today ? formatMoney("TZS", today.collected) : "…"}
            </Text>
          </View>
          <View style={styles.workStat}>
            <Text style={styles.workStatValue}>{today?.closed ?? "–"}</Text>
            <Text style={styles.workStatLabel}>{t("closedToday")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>

        <Text style={styles.title}>{t("staffOrders")}</Text>
        <View style={styles.filters}>
          {(["new", "active", "all"] as const).map((key) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.filter, filter === key && styles.filterOn]}
            >
              <Text style={[styles.filterText, filter === key && styles.filterTextOn]}>
                {t(key === "new" ? "filterNew" : key === "active" ? "filterActive" : "filterAll")}
              </Text>
              <View style={[styles.count, filter === key && styles.countOn]}>
                <Text style={[styles.countText, filter === key && { color: Colors.primary }]}>{counts[key]}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      ) : failed && orders.length === 0 ? (
        <ErrorState
          onRetry={() => {
            setLoading(true);
            refresh();
          }}
        />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                refresh();
              }}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={<EmptyState icon="file-tray-outline" title={t("noStaffOrders")} />}
          renderItem={({ item }) => <OrderRow order={item} />}
        />
      )}
    </View>
  );
}

function timeAgo(iso: string | null, sw: boolean) {
  if (!iso) return "";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return sw ? "sasa hivi" : "just now";
  if (minutes < 60) return sw ? `dakika ${minutes}` : `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return sw ? `saa ${hours}` : `${hours} h ago`;
  const days = Math.round(hours / 24);
  return sw ? `siku ${days}` : `${days} d ago`;
}

function OrderRow({ order }: { order: StaffOrder }) {
  const { language, t } = useLanguage();
  const uri = mediaUrl(order.product_image);
  const isNew = order.status === "new";
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/staff/[id]", params: { id: order.id } })}
      style={({ pressed }) => [styles.card, isNew && styles.cardNew, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.thumb}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <Ionicons name="bag-handle-outline" size={22} color={Colors.textFaint} />
        )}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.product} numberOfLines={1}>
          {order.listing_type === "service" ? "" : `${order.quantity}x `}
          {order.product_title}
        </Text>
        <Text style={styles.customer} numberOfLines={1}>
          <Ionicons name="person" size={12} color={Colors.textMuted} /> {order.customer_name}
          {"  "}
          <Ionicons name="call" size={12} color={Colors.textMuted} /> {order.customer_phone}
        </Text>
        {!!order.delivery_address && (
          <Text style={styles.address} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color={Colors.textFaint} /> {order.delivery_address}
          </Text>
        )}
        <View style={styles.rowBottom}>
          <StaffStatusBadge status={order.status} />
          {order.customer_payment && (
            <View style={styles.paidTag}>
              <Ionicons name="checkmark-done" size={11} color={Colors.success} />
              <Text style={styles.paidTagText}>
                {t("paidAhead")} · {order.customer_payment.provider_label}
              </Text>
            </View>
          )}
          <Text style={styles.time}>{timeAgo(order.created_at, language === "sw")}</Text>
        </View>
      </View>
      <View style={{ alignItems: "flex-end", justifyContent: "space-between" }}>
        <Text style={styles.total}>{formatMoney(order.currency, order.grand_total)}</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textFaint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.navy,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  hello: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  city: { marginTop: 2, color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "700" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 34,
    minWidth: 34,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  pillText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  title: { marginTop: 16, color: "#FFFFFF", fontSize: 26, fontWeight: "900" },
  work: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: Radius.lg,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.6)",
  },
  workIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  workLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "800" },
  workMoney: { marginTop: 1, color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  workStat: { alignItems: "center", paddingHorizontal: 6 },
  workStatValue: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  workStatLabel: { color: "rgba(255,255,255,0.7)", fontSize: 9.5, fontWeight: "700" },
  filters: { marginTop: 12, flexDirection: "row", gap: 8 },
  filter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  filterOn: { backgroundColor: Colors.primary },
  filterText: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "800" },
  filterTextOn: { color: "#FFFFFF" },
  count: { minWidth: 22, paddingHorizontal: 6, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  countOn: { backgroundColor: "#FFFFFF" },
  countText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: Radius.lg,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  cardNew: { borderColor: Colors.primary, borderWidth: 1.5, backgroundColor: "#FFFBF5" },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  product: { fontSize: 14, fontWeight: "900", color: Colors.navy },
  customer: { fontSize: 12, fontWeight: "600", color: Colors.textMuted },
  address: { fontSize: 11.5, color: Colors.textFaint },
  rowBottom: { marginTop: 3, flexDirection: "row", alignItems: "center", gap: 8 },
  time: { fontSize: 11, color: Colors.textFaint, fontWeight: "600" },
  paidTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Colors.successBg,
  },
  paidTagText: { fontSize: 10.5, fontWeight: "900", color: Colors.success },
  total: { fontSize: 13, fontWeight: "900", color: Colors.primary },
});
