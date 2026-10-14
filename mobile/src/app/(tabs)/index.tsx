import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { ListingGrid } from "@/components/ListingGrid";
import { EmptyState, ErrorState, SectionHeader, type IconName } from "@/components/ui";
import { Colors, Radius, Shadow } from "@/constants/theme";
import { fetchCatalog, fetchCategories, type CategoryLists, type Listing } from "@/lib/api";
import { CATEGORIES, categoryStyle, legacyKey } from "@/lib/catalog";
import { useLanguage } from "@/lib/i18n";

export default function HomeScreen() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Listing[]>([]);
  const [services, setServices] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryLists, setCategoryLists] = useState<CategoryLists | null>(null);

  const load = useCallback(async () => {
    fetchCategories().then(setCategoryLists).catch(() => {});
    try {
      const data = await fetchCatalog();
      setProducts(data.products);
      setServices(data.services);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // First load - state only changes once the response arrives.
  useEffect(() => {
    let alive = true;
    fetchCategories()
      .then((data) => alive && setCategoryLists(data))
      .catch(() => {});
    fetchCatalog()
      .then((data) => {
        if (!alive) return;
        setProducts(data.products);
        setServices(data.services);
        setFailed(false);
      })
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Categories with things to buy first (busiest first), then built-in goods;
  // the original 9 until the list arrives. Then "Services" and "All categories".
  const busy = categoryLists
    ? [...categoryLists.goods, ...categoryLists.services]
        .filter((c) => c.count > 0)
        .sort((a, b) => b.count - a.count)
        .map((c) => c.name)
    : [];
  const fill = (categoryLists ? categoryLists.goods.map((c) => c.name) : CATEGORIES.map((c) => c.dbName)).filter(
    (n) => !busy.includes(n),
  );
  const tiles = [...busy, ...fill].filter((n) => n.toLowerCase() !== "services").slice(0, 7);
  const label = (name: string) => {
    const key = legacyKey(name);
    return key ? t(key) : name;
  };
  const openCategory = (name: string) =>
    router.push({ pathname: "/category/[index]", params: { index: name } });

  const search = () => {
    const q = query.trim();
    if (q) router.push({ pathname: "/search", params: { q } });
  };

  return (
    <View style={styles.screen}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Search */}
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={Colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            placeholder={t("searchPlaceholder")}
            placeholderTextColor={Colors.textFaint}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <Pressable onPress={search} style={styles.searchGo} hitSlop={6}>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>
          )}
        </View>

        {/* Hero */}
        <LinearGradient
          colors={[Colors.navy, Colors.navySoft, "#9A3412"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroGlow} />
          <Text style={styles.heroTitle}>{t("heroTitle")}</Text>
          <Text style={styles.heroSubtitle}>{t("heroSubtitle")}</Text>
          <View style={styles.heroChips}>
            {(
              [
                ["pricetag", t("heroChipAffordable")],
                ["flash", t("heroChipFast")],
                ["time", t("heroChipAnyTime")],
              ] as [IconName, string][]
            ).map(([icon, label]) => (
              <View key={label} style={styles.heroChip}>
                <Ionicons name={icon} size={12} color="#FFFFFF" />
                <Text style={styles.heroChipText}>{label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Categories */}
        <SectionHeader title={t("categories")} icon="grid-outline" />
        <View style={styles.categories}>
          {tiles.map((name, index) => {
            const style = categoryStyle(name, index);
            return (
              <Pressable
                key={name}
                onPress={() => openCategory(name)}
                style={({ pressed }) => [styles.category, pressed && { opacity: 0.7 }]}
              >
                <View style={[styles.categoryIcon, { backgroundColor: `${style.color}14` }]}>
                  <Ionicons name={style.icon} size={22} color={style.color} />
                </View>
                <Text style={styles.categoryLabel} numberOfLines={2}>
                  {label(name)}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => openCategory("Services")}
            style={({ pressed }) => [styles.category, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.categoryIcon, { backgroundColor: "#47556914" }]}>
              <Ionicons name="construct-outline" size={22} color="#475569" />
            </View>
            <Text style={styles.categoryLabel} numberOfLines={2}>
              {t("services")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/categories")}
            style={({ pressed }) => [styles.category, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.categoryIcon, { backgroundColor: `${Colors.primary}14` }]}>
              <Ionicons name="grid-outline" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.categoryLabel} numberOfLines={2}>
              {t("allCategories")}
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : failed ? (
          <ErrorState
            onRetry={() => {
              setLoading(true);
              load();
            }}
          />
        ) : (
          <>
            <View style={styles.section}>
              <SectionHeader title={t("popularProducts")} icon="flame-outline" />
              {products.length ? (
                <ListingGrid items={products.slice(0, 10)} />
              ) : (
                <EmptyState icon="bag-handle-outline" title={t("noProducts")} />
              )}
            </View>

            <View style={styles.section}>
              <SectionHeader
                title={t("ourServices")}
                icon="construct-outline"
                action={services.length > 6 ? t("seeAll") : undefined}
                onAction={() => router.push("/services")}
              />
              {services.length ? (
                <ListingGrid items={services.slice(0, 6)} />
              ) : (
                <EmptyState icon="construct-outline" title={t("noServices")} />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, fontWeight: "600" },
  searchGo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    marginTop: 16,
    marginBottom: 22,
    borderRadius: Radius.xl,
    padding: 20,
    overflow: "hidden",
    ...Shadow.raised,
  },
  heroGlow: {
    position: "absolute",
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(249,115,22,0.35)",
  },
  heroTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "900", lineHeight: 28, maxWidth: "85%" },
  heroSubtitle: { marginTop: 6, color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 19 },
  heroChips: { marginTop: 14, flexDirection: "row", gap: 8, flexWrap: "wrap" },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  heroChipText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.lg,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#EEF2F6",
    ...Shadow.card,
  },
  category: { width: "33.33%", alignItems: "center", paddingVertical: 10, paddingHorizontal: 4 },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "800",
    color: Colors.navy,
    textAlign: "center",
  },
  section: { marginTop: 26 },
});
