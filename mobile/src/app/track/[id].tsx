import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, type IconName } from "@/components/ui";
import { Colors, Radius } from "@/constants/theme";
import { cancelOrder, fetchOrderStatus, mediaUrl, type OrderStatus } from "@/lib/api";
import { formatMoney } from "@/lib/catalog";
import { useLanguage } from "@/lib/i18n";
import { isActiveOrder, useStore } from "@/lib/store";

const STEP_INDEX: Record<OrderStatus, number> = {
  new: 1,
  contacted: 2,
  confirmed: 3,
  sourcing: 3,
  picked_up: 4,
  delivered: 5,
  cancelled: 0,
};

function Ring({ delay, size, color }: { delay: number; size: number; color: string }) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, value]);
  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: value.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
        transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.4] }) }],
      }}
    />
  );
}

/** Live order tracking - polls the same status API as the website. */
export default function TrackScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, setOrderStatus } = useStore();
  const order = orders.find((o) => o.id === id);
  const [status, setStatus] = useState<OrderStatus>(order?.status ?? "new");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isActiveOrder(status)) return;
    let alive = true;
    const poll = async () => {
      try {
        const data = await fetchOrderStatus(id);
        if (!alive) return;
        setStatus(data.status);
        setOrderStatus(id, data.status);
      } catch {
        // keep polling quietly while offline
      }
    };
    poll();
    const timer = setInterval(poll, 4000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [id, status, setOrderStatus]);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/orders"));

  const confirmCancel = () => {
    Alert.alert(t("cancelConfirm"), order?.title ?? "", [
      { text: t("keepOrder"), style: "cancel" },
      {
        text: t("yesCancel"),
        style: "destructive",
        onPress: async () => {
          setCancelling(true);
          try {
            const data = await cancelOrder(id);
            setStatus(data.status);
            setOrderStatus(id, data.status);
          } catch {
            Alert.alert(t("offline"), t("errNetwork"));
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const delivered = status === "delivered";
  const cancelled = status === "cancelled";
  const stepIndex = STEP_INDEX[status] ?? 1;
  const isService = order?.listingType === "service";
  const itemLabel = order ? (isService ? order.title : `${order.quantity}x ${order.title}`) : "";

  const headline = delivered
    ? t("deliveredTitle")
    : cancelled
      ? t("cancelledTitle")
      : status === "picked_up"
        ? t("onTheWay")
        : status === "confirmed" || status === "sourcing"
          ? t("preparingOrder")
          : status === "contacted"
            ? t("confirmingOrder")
            : t("orderReceived");
  const detail = delivered
    ? t("thanks")
    : cancelled
      ? t("noLongerProcessed")
      : status === "picked_up"
        ? t("bringingOrder")
        : status === "confirmed" || status === "sourcing"
          ? t("gettingReady")
          : t("willCall", { phone: order?.phone ?? "" });

  const centerIcon: IconName = delivered
    ? "checkmark"
    : cancelled
      ? "close"
      : status === "picked_up"
        ? "bicycle"
        : status === "confirmed" || status === "sourcing"
          ? "cube"
          : "call";

  const steps: { label: string; icon: IconName }[] = [
    { label: t("stepReceived"), icon: "receipt-outline" },
    { label: t("stepConfirmed"), icon: "call-outline" },
    { label: t("stepPreparing"), icon: "cube-outline" },
    { label: t("stepOnTheWay"), icon: "bicycle-outline" },
  ];
  const canCancel = status === "new" || status === "contacted";
  const uri = mediaUrl(order?.imageUrl);

  return (
    <LinearGradient colors={["#020617", "#0F172A", Colors.navy]} style={styles.root}>
      <Pressable
        onPress={close}
        style={[styles.close, { top: insets.top + 10 }]}
        hitSlop={10}
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={22} color="rgba(255,255,255,0.85)" />
      </Pressable>

      <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
        <View style={styles.radar}>
          {!cancelled && (
            <>
              <Ring delay={0} size={150} color={delivered ? "#10B981" : Colors.primary} />
              <Ring delay={600} size={200} color={delivered ? "#10B981" : Colors.primary} />
              {!delivered && <Ring delay={1200} size={250} color={Colors.primary} />}
            </>
          )}
          <View
            style={[
              styles.bubble,
              delivered && { backgroundColor: "#10B981", borderColor: "#6EE7B7" },
              cancelled && { backgroundColor: "#EF4444", borderColor: "#FCA5A5" },
            ]}
          >
            {status === "new" && uri ? (
              <Image source={{ uri }} style={styles.bubbleImage} contentFit="cover" />
            ) : (
              <Ionicons name={centerIcon} size={48} color={delivered || cancelled ? "#FFFFFF" : Colors.primary} />
            )}
          </View>
        </View>

        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.detail}>{detail}</Text>

        {/* Steps */}
        {!cancelled && (
          <View style={styles.steps}>
            {steps.map((step, i) => {
              const done = stepIndex > i + 1 || delivered;
              const active = stepIndex === i + 1 && !delivered;
              return (
                <View key={step.label} style={styles.stepCol}>
                  <View style={styles.stepRow}>
                    {i > 0 && (
                      <View style={[styles.stepLine, (stepIndex > i || delivered) && styles.stepLineDone]} />
                    )}
                    <View
                      style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]}
                    >
                      <Ionicons
                        name={done ? "checkmark" : step.icon}
                        size={15}
                        color={done ? "#FFFFFF" : active ? Colors.primary : "#64748B"}
                      />
                    </View>
                    {i < steps.length - 1 && (
                      <View style={[styles.stepLine, (stepIndex > i + 1 || delivered) && styles.stepLineDone]} />
                    )}
                  </View>
                  <Text style={[styles.stepLabel, (done || active) && { color: "#FFFFFF" }]}>{step.label}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Summary chip */}
        {order && (
          <View style={styles.chip}>
            {uri && <Image source={{ uri }} style={styles.chipImage} contentFit="cover" />}
            <View style={{ flex: 1 }}>
              <Text style={styles.chipTitle} numberOfLines={1}>
                {itemLabel}
              </Text>
              <Text style={styles.chipMeta}>{t("deliveredBy")}</Text>
            </View>
            <Text style={styles.chipPrice}>{formatMoney(order.currency, order.total)}</Text>
          </View>
        )}
      </View>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 16 }]}>
        {canCancel ? (
          <Pressable onPress={confirmCancel} disabled={cancelling} style={styles.cancel}>
            <Text style={styles.cancelText}>{cancelling ? "..." : t("cancelOrder")}</Text>
          </Pressable>
        ) : (
          <Button
            title={delivered || cancelled ? t("done") : t("trackInOrders")}
            onPress={close}
            icon={delivered ? "happy-outline" : undefined}
          />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  close: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  radar: { width: 260, height: 260, alignItems: "center", justifyContent: "center" },
  bubble: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: "#FFFFFF",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  bubbleImage: { width: "100%", height: "100%" },
  headline: { marginTop: 8, fontSize: 26, fontWeight: "900", color: "#FFFFFF", textAlign: "center" },
  detail: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    maxWidth: 320,
  },
  steps: { marginTop: 32, flexDirection: "row", width: "100%", maxWidth: 380 },
  stepCol: { flex: 1, alignItems: "center" },
  stepRow: { flexDirection: "row", alignItems: "center", width: "100%", justifyContent: "center" },
  stepLine: { flex: 1, height: 2, backgroundColor: "#334155" },
  stepLineDone: { backgroundColor: "#34D399" },
  stepDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#475569",
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotDone: { backgroundColor: "#10B981", borderColor: "#34D399" },
  stepDotActive: { backgroundColor: "rgba(249,115,22,0.18)", borderColor: Colors.primary },
  stepLabel: { marginTop: 8, fontSize: 10, fontWeight: "800", color: "#64748B", textAlign: "center" },
  chip: {
    marginTop: 30,
    width: "100%",
    maxWidth: 380,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: Radius.lg,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  chipImage: { width: 42, height: 42, borderRadius: 10 },
  chipTitle: { fontSize: 13, fontWeight: "800", color: "#FFFFFF" },
  chipMeta: { marginTop: 2, fontSize: 11, color: "#94A3B8" },
  chipPrice: { fontSize: 14, fontWeight: "900", color: Colors.primary },
  actions: { paddingHorizontal: 24, paddingTop: 12 },
  cancel: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontSize: 13, fontWeight: "800", color: "#CBD5E1" },
});
