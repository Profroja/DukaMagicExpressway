import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors, Shadow } from "@/constants/theme";
import { mediaUrl, orderHref, type Listing } from "@/lib/api";
import { formatMoney } from "@/lib/catalog";
import { useLanguage } from "@/lib/i18n";
import { useStore } from "@/lib/store";

/** Big bold price, or "From …" / "Price on request" for services. */
export function useListingPrice() {
  const { t } = useLanguage();
  return (item: Listing) => {
    const price = Number(item.price) || 0;
    if (item.listing_type === "service") {
      return price > 0 ? `${t("priceFrom")} ${formatMoney(item.currency, price)}` : t("priceOnRequest");
    }
    return formatMoney(item.currency, price);
  };
}

/** Quick "+" that adds to the cart (services open the booking instead) and shows a tick. */
export function AddButton({ item, size = 30 }: { item: Listing; size?: number }) {
  const { addToCart } = useStore();
  const [added, setAdded] = useState(false);
  const isService = item.listing_type === "service";

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1200);
    return () => clearTimeout(timer);
  }, [added]);

  return (
    <Pressable
      onPress={() => {
        if (isService) {
          router.push(orderHref(item.id));
          return;
        }
        addToCart(item, 1);
        setAdded(true);
      }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.add,
        { width: size, height: size, borderRadius: size / 3.2 },
        added && { backgroundColor: Colors.success },
        pressed && { transform: [{ scale: 0.92 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel={isService ? "Book" : "Add to cart"}
    >
      <Ionicons name={added ? "checkmark" : isService ? "calendar" : "add"} size={size * 0.62} color="#FFFFFF" />
    </Pressable>
  );
}

/** Compact card like the store design: picture, bold price, small name, orange "+". */
export function ProductTile({ item, width }: { item: Listing; width: number }) {
  const uri = mediaUrl(item.image_url);
  const price = useListingPrice();
  return (
    <Pressable
      // Straight to the order form (services: booking form).
      onPress={() => router.push(orderHref(item.id))}
      style={({ pressed }) => [styles.card, { width }, pressed && { transform: [{ scale: 0.98 }] }]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={styles.imageWrap}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="contain" transition={200} />
        ) : (
          <Ionicons name="bag-handle-outline" size={34} color={Colors.textFaint} />
        )}
      </View>
      <View style={styles.bottom}>
        <View style={{ flex: 1 }}>
          <Text style={styles.price} numberOfLines={1}>
            {price(item)}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <AddButton item={item} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 10,
    ...Shadow.card,
  },
  imageWrap: {
    height: 110,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  bottom: { marginTop: 8, flexDirection: "row", alignItems: "flex-end", gap: 6 },
  price: { fontSize: 14.5, fontWeight: "900", color: Colors.navy },
  title: { marginTop: 2, fontSize: 11.5, fontWeight: "600", color: Colors.textMuted },
  add: { backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
});
