import type { Listing } from "@/lib/api";

/** The same 9 categories as the website's category bar (category index = position). */
export const CATEGORIES = [
  { key: "electronics", dbName: "Electronics", icon: "laptop-outline", color: "#2563EB" },
  { key: "fashion", dbName: "Fashion", icon: "sparkles-outline", color: "#E11D48" },
  { key: "homeLiving", dbName: "Home & Living", icon: "home-outline", color: "#16A34A" },
  { key: "beautyHealth", dbName: "Beauty & Health", icon: "heart-outline", color: "#7C3AED" },
  { key: "groceries", dbName: "Groceries", icon: "cart-outline", color: "#EA580C" },
  { key: "automotive", dbName: "Automotive", icon: "flash-outline", color: "#DC2626" },
  { key: "sportsOutdoors", dbName: "Sports & Outdoors", icon: "bicycle-outline", color: "#0D9488" },
  { key: "booksStationery", dbName: "Books & Stationery", icon: "book-outline", color: "#4F46E5" },
  { key: "services", dbName: "Services", icon: "construct-outline", color: "#475569" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

/** Goods come back as category "Goods" with the real category as sub-category. */
export function inCategory(item: Listing, dbName: string) {
  const name = dbName.trim().toLowerCase();
  return (
    (item.subcategory || "").trim().toLowerCase() === name ||
    (item.category || "").trim().toLowerCase() === name
  );
}

export function formatMoney(currency: string, value: number | string) {
  return `${currency || "TZS"} ${Number(value || 0).toLocaleString()}`;
}
