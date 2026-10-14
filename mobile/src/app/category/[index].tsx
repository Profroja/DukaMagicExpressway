import { Stack, useLocalSearchParams } from "expo-router";

import { ListingScreen } from "@/components/ListingScreen";
import { fetchCatalog } from "@/lib/api";
import { CATEGORIES, inCategory, legacyKey } from "@/lib/catalog";
import { useLanguage } from "@/lib/i18n";

/**
 * One category, same rules as the website's category pages (server-side
 * filtered). The param is the category name; a number is an old link to one
 * of the original 9 categories.
 */
export default function CategoryScreen() {
  const { t } = useLanguage();
  const { index } = useLocalSearchParams<{ index: string }>();
  const raw = String(index ?? "").trim();
  const name = /^\d+$/.test(raw) ? (CATEGORIES[Number(raw)]?.dbName ?? CATEGORIES[0].dbName) : raw;
  const key = legacyKey(name);

  // The React Compiler memoizes this per category name.
  const load = async () => {
    if (name.toLowerCase() === "services") return (await fetchCatalog({ type: "service" })).services;
    const data = await fetchCatalog({ category: name });
    return [...data.products, ...data.services].filter((item) => inCategory(item, name));
  };

  return (
    <>
      <Stack.Screen options={{ title: key ? t(key) : name }} />
      <ListingScreen load={load} emptyIcon="bag-handle-outline" emptyTitle={t("noProducts")} />
    </>
  );
}
