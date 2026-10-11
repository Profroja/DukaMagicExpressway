import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";

import { ListingScreen } from "@/components/ListingScreen";
import { fetchCatalog } from "@/lib/api";
import { CATEGORIES, inCategory } from "@/lib/catalog";
import { useLanguage } from "@/lib/i18n";

/** Same rules as the website's category pages (server-side filtered). */
export default function CategoryScreen() {
  const { t } = useLanguage();
  const { index } = useLocalSearchParams<{ index: string }>();
  const category = CATEGORIES[Number(index)] ?? CATEGORIES[0];

  const load = useCallback(async () => {
    if (category.key === "services") return (await fetchCatalog({ type: "service" })).services;
    const data = await fetchCatalog({ category: category.dbName, type: "product" });
    return data.products.filter((item) => inCategory(item, category.dbName));
  }, [category]);

  return (
    <>
      <Stack.Screen options={{ title: t(category.key) }} />
      <ListingScreen load={load} emptyIcon="bag-handle-outline" emptyTitle={t("noProducts")} />
    </>
  );
}
