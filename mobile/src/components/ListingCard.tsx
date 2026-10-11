import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PriceText } from "@/components/ui";
import { Colors, Radius, Shadow } from "@/constants/theme";
import { mediaUrl, type Listing } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

/** A product or service tile - tapping opens the detail / order screen. */
export function ListingCard({ item, width }: { item: Listing; width: number }) {
  const { t } = useLanguage();
  const isService = item.listing_type === "service";
  const uri = mediaUrl(item.image_url);

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/listing/[id]", params: { id: item.id } })}
      style={({ pressed }) => [styles.card, { width }, pressed && { transform: [{ scale: 0.98 }] }]}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={styles.imageWrap}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <Ionicons name={isService ? "construct-outline" : "bag-handle-outline"} size={34} color={Colors.textFaint} />
        )}
        {!!item.sale && (
          <View style={styles.sale}>
            <Text style={styles.saleText}>{item.sale}</Text>
          </View>
        )}
        {isService && (
          <View style={styles.serviceTag}>
            <Ionicons name="construct" size={10} color="#FFFFFF" />
          </View>
        )}
      </View>
      <View style={styles.body}>
        {!!item.store && (
          <View style={styles.store}>
            <Ionicons name="storefront-outline" size={10} color={Colors.primary} />
            <Text style={styles.storeText} numberOfLines={1}>
              {item.store}
            </Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {item.subcategory || item.category || ""}
        </Text>
        <PriceText price={item.price} currency={item.currency} isService={isService} size={15} />
        <View style={[styles.cta, isService && { backgroundColor: Colors.navy }]}>
          <Ionicons name={isService ? "calendar-outline" : "flash"} size={13} color="#FFFFFF" />
          <Text style={styles.ctaText}>{isService ? t("bookNow") : t("orderNow")}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEF2F6",
    ...Shadow.card,
  },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  sale: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: Colors.danger,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  saleText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  serviceTag: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 10, gap: 3 },
  store: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8FAFC",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  storeText: { fontSize: 10, fontWeight: "700", color: Colors.navy, flexShrink: 1 },
  title: { marginTop: 3, fontSize: 13.5, fontWeight: "800", color: Colors.navy, lineHeight: 18 },
  category: { fontSize: 10.5, color: Colors.textFaint, fontWeight: "600" },
  cta: {
    marginTop: 6,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  ctaText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
});
