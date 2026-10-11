import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { Button, EmptyState } from "@/components/ui";
import { Colors, Radius, Shadow } from "@/constants/theme";
import { mediaUrl } from "@/lib/api";
import { formatMoney } from "@/lib/catalog";
import { useLanguage } from "@/lib/i18n";
import { useStore, type CartItem } from "@/lib/store";

/**
 * Saved items, like the website's cart. Each item is ordered on its own
 * (same order flow as the product page), since every order is handled
 * separately by Duka Magic Expressway.
 */
export default function CartScreen() {
  const { t } = useLanguage();
  const { cart, setCartQuantity, removeFromCart } = useStore();
  const currency = cart[0]?.currency ?? "TZS";
  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  return (
    <View style={styles.screen}>
      <AppHeader title={t("cart")} subtitle={cart.length ? `${cart.length} · ${formatMoney(currency, total)}` : undefined} />
      <ScrollView contentContainerStyle={styles.content}>
        {cart.length === 0 ? (
          <EmptyState icon="cart-outline" title={t("cartEmpty")} hint={t("cartEmptyHint")}>
            <Button
              title={t("startShopping")}
              icon="bag-handle-outline"
              onPress={() => router.push("/")}
              style={{ marginTop: 18 }}
            />
          </EmptyState>
        ) : (
          cart.map((item) => (
            <CartRow
              key={item.id}
              item={item}
              onQuantity={(q) => setCartQuantity(item.id, q)}
              onRemove={() => removeFromCart(item.id)}
              orderLabel={t("order")}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function CartRow({
  item,
  onQuantity,
  onRemove,
  orderLabel,
}: {
  item: CartItem;
  onQuantity: (q: number) => void;
  onRemove: () => void;
  orderLabel: string;
}) {
  const uri = mediaUrl(item.image_url);
  return (
    <View style={styles.card}>
      <Pressable
        style={styles.thumb}
        onPress={() => router.push({ pathname: "/listing/[id]", params: { id: item.id } })}
      >
        {uri ? (
          <Image source={{ uri }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : (
          <Ionicons name="bag-handle-outline" size={26} color={Colors.textFaint} />
        )}
      </Pressable>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Pressable onPress={onRemove} hitSlop={10} accessibilityLabel="Remove">
            <Ionicons name="trash-outline" size={18} color={Colors.textFaint} />
          </Pressable>
        </View>
        <Text style={styles.price}>{formatMoney(item.currency, Number(item.price) * item.quantity)}</Text>
        <View style={styles.controls}>
          <View style={styles.stepper}>
            <Pressable onPress={() => onQuantity(item.quantity - 1)} style={styles.stepBtn} hitSlop={4}>
              <Ionicons name="remove" size={16} color={Colors.navy} />
            </Pressable>
            <Text style={styles.qty}>{item.quantity}</Text>
            <Pressable onPress={() => onQuantity(item.quantity + 1)} style={styles.stepBtn} hitSlop={4}>
              <Ionicons name="add" size={16} color={Colors.navy} />
            </Pressable>
          </View>
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/listing/[id]",
                params: { id: item.id, qty: String(item.quantity), step: "contact" },
              })
            }
            style={styles.orderBtn}
          >
            <Ionicons name="flash" size={13} color="#FFFFFF" />
            <Text style={styles.orderText}>{orderLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    ...Shadow.card,
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: Radius.md,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, fontSize: 14, fontWeight: "800", color: Colors.navy },
  price: { marginTop: 4, fontSize: 15, fontWeight: "900", color: Colors.primary },
  controls: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qty: { minWidth: 20, textAlign: "center", fontSize: 15, fontWeight: "900", color: Colors.navy },
  orderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  orderText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
});
