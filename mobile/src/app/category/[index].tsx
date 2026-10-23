import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddButton, useListingPrice } from "@/components/ProductTile";
import { EmptyState, ErrorState } from "@/components/ui";
import { Colors, Shadow } from "@/constants/theme";
import { fetchCatalog, fetchCategories, mediaUrl, type Listing } from "@/lib/api";
import { CATEGORIES, inCategory, legacyKey } from "@/lib/catalog";
import { useLanguage } from "@/lib/i18n";

/**
 * One category, like the store design: orange header with a search box,
 * category chips, and a list of items with a quick "+" add button.
 * The param is the category name; a number is an old link to the original 9.
 */
export default function CategoryScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { index } = useLocalSearchParams<{ index: string }>();
  const raw = String(index ?? "").trim();
  const name = /^\d+$/.test(raw) ? (CATEGORIES[Number(raw)]?.dbName ?? CATEGORIES[0].dbName) : raw;
  const label = (n: string) => {
    const key = legacyKey(n);
    return key ? t(key) : n;
  };
  const price = useListingPrice();

  const [items, setItems] = useState<Listing[]>([]);
  const [chips, setChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");

  const load = async () => {
    if (name.toLowerCase() === "services") return (await fetchCatalog({ type: "service" })).services;
    const data = await fetchCatalog({ category: name });
    return [...data.products, ...data.services].filter((item) => inCategory(item, name));
  };

  useEffect(() => {
    let alive = true;
    load()
      .then((data) => {
        if (!alive) return;
        setItems(data);
        setFailed(false);
      })
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));
    // Other busy categories to jump to.
    fetchCategories()
      .then((lists) => {
        if (!alive) return;
        const busy = [...lists.goods, ...lists.services]
          .filter((c) => c.count > 0)
          .sort((a, b) => b.count - a.count)
          .map((c) => c.name);
        setChips(busy.filter((n) => n.toLowerCase() !== name.toLowerCase()).slice(0, 8));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const refresh = () =>
    load()
      .then((data) => {
        setItems(data);
        setFailed(false);
      })
      .catch(() => setFailed(true))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });

  const term = query.trim().toLowerCase();
  const shown = term ? items.filter((i) => i.title.toLowerCase().includes(term)) : items;

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F8FA" }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Orange header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.titleRow}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {label(name)}
          </Text>
          <View style={styles.back} />
        </View>
        <View style={styles.search}>
          <Ionicons name="search" size={19} color={Colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("searchIn", { name: label(name) })}
            placeholderTextColor={Colors.textFaint}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.textFaint} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Chips: this category, then others to jump to */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.chips}
      >
        <View style={[styles.chip, styles.chipOn]}>
          <Text style={[styles.chipText, styles.chipTextOn]}>{t("all")}</Text>
        </View>
        {chips.map((c) => (
          <Pressable
            key={c}
            onPress={() => {
              setQuery("");
              router.replace({ pathname: "/category/[index]", params: { index: c } });
            }}
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.chipText}>{label(c)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 50 }} />
      ) : failed ? (
        <ErrorState
          onRetry={() => {
            setLoading(true);
            refresh();
          }}
        />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: insets.bottom + 24, gap: 12 }}
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
          ListEmptyComponent={<EmptyState icon="bag-handle-outline" title={t("noProducts")} />}
          renderItem={({ item }) => {
            const uri = mediaUrl(item.image_url);
            return (
              <Pressable
                onPress={() => router.push({ pathname: "/listing/[id]", params: { id: item.id } })}
                style={({ pressed }) => [styles.row, pressed && { transform: [{ scale: 0.99 }] }]}
              >
                <View style={styles.thumb}>
                  {uri ? (
                    <Image source={{ uri }} style={styles.thumbImage} contentFit="contain" transition={200} />
                  ) : (
                    <Ionicons name="bag-handle-outline" size={28} color={Colors.textFaint} />
                  )}
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.rowPrice}>{price(item)}</Text>
                </View>
                <AddButton item={item} size={34} />
              </Pressable>
            );
          }}
        />
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
  titleRow: { flexDirection: "row", alignItems: "center" },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", color: "#FFFFFF", fontSize: 21, fontWeight: "900" },
  search: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  searchInput: { flex: 1, fontSize: 14.5, color: Colors.text, fontWeight: "500" },
  chips: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  chip: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.card,
  },
  chipOn: { backgroundColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: "700", color: Colors.navy },
  chipTextOn: { color: "#FFFFFF" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    ...Shadow.card,
  },
  thumb: {
    width: 74,
    height: 74,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbImage: { width: "100%", height: "100%" },
  rowTitle: { fontSize: 15, fontWeight: "700", color: Colors.navy },
  rowPrice: { fontSize: 16, fontWeight: "900", color: Colors.navy },
});
