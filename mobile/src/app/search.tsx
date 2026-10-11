import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback } from "react";

import { ListingScreen } from "@/components/ListingScreen";
import { fetchCatalog, type Listing } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

function matches(item: Listing, terms: string[]) {
  const haystack = [item.title, item.description, item.category, item.subcategory, item.store]
    .join(" ")
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

/** Search across products and services - like the website's search box. */
export default function SearchScreen() {
  const { t } = useLanguage();
  const { q = "" } = useLocalSearchParams<{ q?: string }>();
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);

  const load = useCallback(async () => {
    const [products, services] = await Promise.all([
      fetchCatalog({ type: "product" }),
      fetchCatalog({ type: "service" }),
    ]);
    // De-duplicate by id: servers without the ?type filter return everything twice.
    const unique = new Map<string, Listing>();
    for (const item of [...products.products, ...products.services, ...services.services]) {
      unique.set(item.id, item);
    }
    return [...unique.values()].filter((item) => matches(item, terms));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <>
      <Stack.Screen options={{ title: `“${q}”` }} />
      <ListingScreen load={load} emptyIcon="search-outline" emptyTitle={t("nothingHere")} header={t("searchPlaceholder")} />
    </>
  );
}
