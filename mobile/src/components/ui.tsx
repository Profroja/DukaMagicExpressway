import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import type { ComponentProps, ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import { Colors, Radius } from "@/constants/theme";
import type { OrderStatus } from "@/lib/api";
import { formatMoney } from "@/lib/catalog";
import { useLanguage, type TranslationKey } from "@/lib/i18n";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export function BrandLogo({ size = 40 }: { size?: number }) {
  return (
    <Image
      source={require("@/assets/images/logo.png")}
      style={{ width: size, height: size, borderRadius: size * 0.28 }}
      contentFit="cover"
      accessibilityLabel="DukaHub"
    />
  );
}

/** Product price, or "From TZS …" / "Price on request" for services. */
export function PriceText({
  price,
  currency,
  isService,
  size = 16,
}: {
  price: string | number;
  currency: string;
  isService: boolean;
  size?: number;
}) {
  const { t } = useLanguage();
  const amount = Number(price);
  if (isService && !(amount > 0)) {
    return <Text style={[styles.price, { fontSize: size * 0.85 }]}>{t("priceOnRequest")}</Text>;
  }
  return (
    <Text style={[styles.price, { fontSize: size }]}>
      {isService && <Text style={[styles.priceFrom, { fontSize: size * 0.7 }]}>{t("priceFrom")} </Text>}
      {formatMoney(currency, amount)}
    </Text>
  );
}

export const STATUS_META: Record<
  OrderStatus,
  { label: TranslationKey; color: string; bg: string; icon: IconName }
> = {
  new: { label: "statusNew", color: "#B45309", bg: "#FEF3C7", icon: "time-outline" },
  contacted: { label: "statusContacted", color: "#1D4ED8", bg: "#DBEAFE", icon: "call-outline" },
  confirmed: { label: "statusConfirmed", color: "#047857", bg: "#D1FAE5", icon: "checkmark-circle-outline" },
  sourcing: { label: "statusSourcing", color: "#6D28D9", bg: "#EDE9FE", icon: "cube-outline" },
  picked_up: { label: "statusPickedUp", color: "#4338CA", bg: "#E0E7FF", icon: "bicycle-outline" },
  delivered: { label: "statusDelivered", color: "#047857", bg: "#D1FAE5", icon: "checkmark-done-circle" },
  cancelled: { label: "statusCancelled", color: "#475569", bg: "#E2E8F0", icon: "close-circle-outline" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useLanguage();
  const meta = STATUS_META[status] ?? STATUS_META.new;
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Ionicons name={meta.icon} size={12} color={meta.color} />
      <Text style={[styles.badgeText, { color: meta.color }]}>{t(meta.label)}</Text>
    </View>
  );
}

export function Button({
  title,
  onPress,
  icon,
  variant = "primary",
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  variant?: "primary" | "outline" | "dark" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const palette = {
    primary: { bg: Colors.primary, fg: "#FFFFFF", border: Colors.primary },
    dark: { bg: Colors.navy, fg: "#FFFFFF", border: Colors.navy },
    outline: { bg: "#FFFFFF", fg: Colors.navy, border: Colors.border },
    ghost: { bg: "transparent", fg: Colors.textMuted, border: "transparent" },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        (disabled || loading) && { opacity: 0.55 },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={palette.fg} />}
          <Text style={[styles.buttonText, { color: palette.fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function SectionHeader({
  title,
  icon,
  action,
  onAction,
}: {
  title: string;
  icon: IconName;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={16} color={Colors.primary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction && (
        <Pressable onPress={onAction} hitSlop={10} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{action}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  children,
}: {
  icon: IconName;
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={34} color={Colors.textFaint} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint && <Text style={styles.emptyHint}>{hint}</Text>}
      {children}
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useLanguage();
  return (
    <EmptyState icon="cloud-offline-outline" title={t("offline")} hint={t("errNetwork")}>
      <Button title={t("retry")} icon="refresh" onPress={onRetry} style={{ marginTop: 16 }} />
    </EmptyState>
  );
}

const styles = StyleSheet.create({
  price: { fontWeight: "900", color: Colors.primary },
  priceFrom: { fontWeight: "700", color: Colors.primary, opacity: 0.8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  badgeText: { fontSize: 10, fontWeight: "800" },
  button: {
    height: 50,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
  },
  buttonText: { fontSize: 15, fontWeight: "800" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { flex: 1, fontSize: 18, fontWeight: "900", color: Colors.navy },
  sectionAction: { flexDirection: "row", alignItems: "center", gap: 2 },
  sectionActionText: { fontSize: 13, fontWeight: "800", color: Colors.primary },
  empty: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { marginTop: 14, fontSize: 17, fontWeight: "900", color: Colors.navy, textAlign: "center" },
  emptyHint: { marginTop: 6, fontSize: 13, color: Colors.textMuted, textAlign: "center", lineHeight: 19 },
});
