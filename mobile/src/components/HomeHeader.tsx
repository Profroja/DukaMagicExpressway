import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useListingPrice } from "@/components/ProductTile";
import { Colors } from "@/constants/theme";
import { loadSearchIndex, matchListings, mediaUrl, orderHref, type Listing } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { useStaff } from "@/lib/staff";

/** Orange home header: logo + name, staff / language buttons, and the search bar. */
export function HomeHeader() {
  const insets = useSafeAreaInsets();
  const { t, language, toggle } = useLanguage();
  const { session } = useStaff();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<Listing[] | null>(null);
  const [searching, setSearching] = useState(false);
  const price = useListingPrice();

  // Live results as you type, like the website (the catalogue is loaded once).
  const term = query.trim();
  useEffect(() => {
    if (!term || index) return;
    let alive = true;
    loadSearchIndex()
      .then((items) => alive && setIndex(items))
      .catch(() => {})
      .finally(() => alive && setSearching(false));
    return () => {
      alive = false;
    };
  }, [term, index]);
  const results = term && index ? matchListings(index, term) : [];

  const openItem = (item: Listing) => {
    Keyboard.dismiss();
    setQuery("");
    router.push(orderHref(item.id));
  };

  const search = () => {
    const q = query.trim();
    if (q) router.push({ pathname: "/search", params: { q } });
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.row}>
        <View style={styles.logoWrap}>
          <Image source={require("@/assets/images/logo.png")} style={styles.logo} contentFit="cover" />
        </View>
        <Text style={styles.brand}>SokoLink</Text>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => router.push(session ? "/staff" : "/staff/login")}
          hitSlop={8}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel={t("staffLogin")}
        >
          <Ionicons name={session ? "person" : "person-outline"} size={18} color="#FFFFFF" />
        </Pressable>
        <Pressable
          onPress={toggle}
          hitSlop={8}
          style={styles.lang}
          accessibilityRole="button"
          accessibilityLabel={t("language")}
        >
          <Ionicons name="globe-outline" size={14} color="#FFFFFF" />
          <Text style={styles.langText}>{language === "en" ? "EN" : "SW"}</Text>
        </Pressable>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={19} color={Colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (text.trim() && !index) setSearching(true);
          }}
          onSubmitEditing={search}
          placeholder={t("searchPlaceholder")}
          placeholderTextColor={Colors.textFaint}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={Colors.textFaint} />
          </Pressable>
        )}
      </View>

      {/* Live results */}
      {!!term && (
        <View style={styles.results}>
          {searching && !index ? (
            <ActivityIndicator color={Colors.primary} style={{ paddingVertical: 18 }} />
          ) : results.length === 0 ? (
            <Text style={styles.noResults}>{t("nothingHere")}</Text>
          ) : (
            <>
              {results.slice(0, 5).map((item) => {
                const uri = mediaUrl(item.image_url);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => openItem(item)}
                    style={({ pressed }) => [styles.result, pressed && { backgroundColor: "#FFF7ED" }]}
                  >
                    <View style={styles.resultThumb}>
                      {uri ? (
                        <Image source={{ uri }} style={styles.resultImage} contentFit="contain" />
                      ) : (
                        <Ionicons name="bag-handle-outline" size={20} color={Colors.textFaint} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.resultPrice}>{price(item)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textFaint} />
                  </Pressable>
                );
              })}
              {results.length > 5 && (
                <Pressable onPress={search} style={styles.seeAll}>
                  <Text style={styles.seeAllText}>
                    {t("seeAll")} ({results.length})
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
                </Pressable>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 3,
  },
  logo: { width: "100%", height: "100%", borderRadius: 9 },
  brand: { color: "#FFFFFF", fontSize: 24, fontWeight: "900", letterSpacing: 0.2 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  lang: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 36,
    paddingHorizontal: 11,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  langText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  search: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  searchInput: { flex: 1, fontSize: 14.5, color: Colors.text, fontWeight: "500" },
  results: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    paddingVertical: 4,
    overflow: "hidden",
  },
  noResults: { paddingVertical: 16, textAlign: "center", fontSize: 13, color: Colors.textMuted },
  result: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 8 },
  resultThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  resultImage: { width: "100%", height: "100%" },
  resultTitle: { fontSize: 14, fontWeight: "700", color: Colors.navy },
  resultPrice: { marginTop: 2, fontSize: 13, fontWeight: "900", color: Colors.primary },
  seeAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  seeAllText: { fontSize: 13, fontWeight: "900", color: Colors.primary },
  searchGo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
