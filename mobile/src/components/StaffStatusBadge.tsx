import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useLanguage, type TranslationKey } from "@/lib/i18n";
import type { StaffOrderStatus } from "@/lib/staff";

type IconName = ComponentProps<typeof Ionicons>["name"];

export const STAFF_STATUS: Record<
  StaffOrderStatus,
  { label: TranslationKey; color: string; bg: string; icon: IconName }
> = {
  new: { label: "staffStatusNew", color: "#B45309", bg: "#FEF3C7", icon: "sparkles" },
  contacted: { label: "staffStatusContacted", color: "#1D4ED8", bg: "#DBEAFE", icon: "call-outline" },
  confirmed: { label: "staffStatusConfirmed", color: "#047857", bg: "#D1FAE5", icon: "checkmark-circle-outline" },
  sourcing: { label: "staffStatusSourcing", color: "#6D28D9", bg: "#EDE9FE", icon: "storefront-outline" },
  picked_up: { label: "staffStatusPickedUp", color: "#4338CA", bg: "#E0E7FF", icon: "bicycle-outline" },
  delivered: { label: "staffStatusDelivered", color: "#047857", bg: "#D1FAE5", icon: "checkmark-done-circle" },
  closed: { label: "staffStatusClosed", color: "#475569", bg: "#E2E8F0", icon: "lock-closed-outline" },
  cancelled: { label: "staffStatusCancelled", color: "#B91C1C", bg: "#FEE2E2", icon: "close-circle-outline" },
};

export function StaffStatusBadge({ status }: { status: StaffOrderStatus }) {
  const { t } = useLanguage();
  const meta = STAFF_STATUS[status] ?? STAFF_STATUS.new;
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Ionicons name={meta.icon} size={12} color={meta.color} />
      <Text style={[styles.text, { color: meta.color }]}>{t(meta.label)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  text: { fontSize: 11, fontWeight: "800" },
});
