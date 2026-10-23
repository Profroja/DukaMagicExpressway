import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { HeroCarousel } from "@/components/HeroCarousel";
import { HomeHeader } from "@/components/HomeHeader";
import { ProductMarquee } from "@/components/ProductMarquee";
import { EmptyState, ErrorState } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { fetchCatalog, fetchCategories, type CategoryLists, type Listing } from "@/lib/api";
import { CATEGORIES, categoryStyle, legacyKey } from "@/lib/catalog";
import { useLanguage } from "@/lib/i18n";

// Solid tile colours, like the store design.
const TILE_COLORS = ["#22C55E", "#EF4444", "#3B82F6", "#8B5CF6", "#F59E0B", "#14B8A6"];

export default function HomeScreen() {
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState<Listing[]>([]);
  const [services, setServices] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
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

  // Busiest categories first (things to buy now), then built-in goods; the
  // original 9 until the list arrives. Then "Services" and "More".
  const busy = categoryLists
    ? [...categoryLists.goods, ...categoryLists.services]
        .filter((c) => c.count > 0)
        .sort((a, b) => b.count - a.count)
        .map((c) => c.name)
    : [];
  const fill = (categoryLists ? categoryLists.goods.map((c) => c.name) : CATEGORIES.map((c) => c.dbName)).filter(
    (n) => !busy.includes(n),
  );
  const tiles = [...busy, ...fill].filter((n) => n.toLowerCase() !== "services").slice(0, 4);
  const label = (name: string) => {
    const key = legacyKey(name);
    return key ? t(key) : name;
  };
  const openCategory = (name: string) =>
    router.push({ pathname: "/category/[index]", params: { index: name } });

  const grid: { key: string; label: string; icon: React.ComponentProps<typeof Ionicons>["name"]; onPress: () => void }[] = [
    ...tiles.map((name) => ({
      key: name,
      label: label(name),
      icon: categoryStyle(name).icon,
      onPress: () => openCategory(name),
    })),
    { key: "services", label: t("services"), icon: "construct" as const, onPress: () => openCategory("Services") },
    { key: "more", label: t("more"), icon: "grid" as const, onPress: () => router.push("/categories") },
  ];

  return (
    <View style={styles.screen}>
      <HomeHeader />
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
        <HeroCarousel width={width - 32} />

        {/* Category squares */}
        <View style={styles.categories}>
          {grid.map((tile, i) => (
            <Pressable
              key={tile.key}
              onPress={tile.onPress}
              style={({ pressed }) => [styles.category, pressed && { transform: [{ scale: 0.95 }] }]}
            >
              <View style={[styles.categoryIcon, { backgroundColor: TILE_COLORS[i % TILE_COLORS.length] }]}>
                <Ionicons name={tile.icon.replace("-outline", "") as typeof tile.icon} size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.categoryLabel} numberOfLines={1}>
                {tile.label}
              </Text>
            </Pressable>
          ))}
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
            <SectionTitle title={t("popularProducts")} action={t("seeAll")} onAction={() => router.push("/categories")} />
            {products.length ? (
              <ProductMarquee items={products.slice(0, 20)} />
            ) : (
              <EmptyState icon="bag-handle-outline" title={t("noProducts")} />
            )}

            <SectionTitle title={t("services")} action={t("seeAll")} onAction={() => router.push("/services")} />
            {services.length ? (
              <ProductMarquee items={services.slice(0, 20)} rows={1} />
            ) : (
              <EmptyState icon="construct-outline" title={t("noServices")} />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionTitle({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionText}>{title}</Text>
      <Pressable onPress={onAction} hitSlop={8} style={styles.seeAll}>
        <Text style={styles.seeAllText}>{action}</Text>
        <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F8FA" },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  categories: { marginTop: 18, flexDirection: "row", flexWrap: "wrap", rowGap: 16 },
  category: { width: "33.33%", alignItems: "center" },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  categoryLabel: { marginTop: 8, fontSize: 13, fontWeight: "700", color: Colors.navy, textAlign: "center" },
  sectionTitle: {
    marginTop: 26,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionText: { fontSize: 19, fontWeight: "900", color: Colors.navy },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 4 },
  seeAllText: { fontSize: 13, fontWeight: "800", color: Colors.primary },
});
