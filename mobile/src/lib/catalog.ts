import type Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

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

type IoniconName = ComponentProps<typeof Ionicons>["name"];

// First match wins, so specific words come before general ones.
const ICON_RULES: [RegExp, IoniconName][] = [
  [/repair/, "build-outline"],
  [/catering/, "restaurant-outline"],
  [/food|meal|restaurant/, "fast-food-outline"],
  [/grocer/, "basket-outline"],
  [/fresh|produce|fruit|vegetable/, "nutrition-outline"],
  [/meat|fish|poultry|butcher/, "fish-outline"],
  [/baker|snack|cake/, "pizza-outline"],
  [/beverage|drink|juice|water/, "wine-outline"],
  [/phone|tablet/, "phone-portrait-outline"],
  [/computer|laptop/, "laptop-outline"],
  [/tv|audio|video/, "tv-outline"],
  [/appliance/, "snow-outline"],
  [/electronic/, "hardware-chip-outline"],
  [/tailor/, "cut-outline"],
  [/laundry|dry clean/, "water-outline"],
  [/fashion|cloth/, "shirt-outline"],
  [/shoe|bag/, "bag-outline"],
  [/jewel|watch/, "diamond-outline"],
  [/beauty|spa|cosmetic|salon/, "sparkles-outline"],
  [/health & medical|clinic|doctor/, "medkit-outline"],
  [/pharma|medic|drug/, "medical-outline"],
  [/baby|kid|child/, "happy-outline"],
  [/toy|game/, "game-controller-outline"],
  [/furniture/, "bed-outline"],
  [/kitchen|dining|cook/, "restaurant-outline"],
  [/real estate|rental|propert/, "business-outline"],
  [/home|house/, "home-outline"],
  [/build|hardware|construct|renovat/, "hammer-outline"],
  [/tool|equipment/, "construct-outline"],
  [/agricultur|farm/, "leaf-outline"],
  [/motorcycle|bicycle|bike/, "bicycle-outline"],
  [/car hire|automotive|vehicle|car\b|spare/, "car-outline"],
  [/sport|fitness|gym|wellness/, "barbell-outline"],
  [/education|tutor|school|training/, "school-outline"],
  [/book|stationery/, "book-outline"],
  [/pet/, "paw-outline"],
  [/gift|craft/, "gift-outline"],
  [/art|collect/, "color-palette-outline"],
  [/music/, "musical-notes-outline"],
  [/energy|solar/, "sunny-outline"],
  [/industrial/, "cog-outline"],
  [/second-hand|used/, "refresh-outline"],
  [/clean/, "sparkles-outline"],
  [/plumb|electric/, "flash-outline"],
  [/transport|moving|delivery|logistic|courier/, "car-sport-outline"],
  [/photo/, "camera-outline"],
  [/event|entertain|party/, "balloon-outline"],
  [/travel|tour/, "airplane-outline"],
  [/security/, "shield-checkmark-outline"],
  [/legal|financ|account/, "briefcase-outline"],
  [/\bit\b|software|web/, "code-slash-outline"],
  [/design|print/, "print-outline"],
  [/office|professional|business/, "briefcase-outline"],
];

const COLORS = ["#2563EB", "#E11D48", "#16A34A", "#7C3AED", "#EA580C", "#DC2626", "#0D9488", "#4F46E5", "#475569"];

/** Icon + colour for any category name, including ones stores typed themselves. */
export function categoryStyle(name: string, index = 0, kind: "goods" | "services" = "goods") {
  const lower = name.toLowerCase();
  const icon = ICON_RULES.find(([pattern]) => pattern.test(lower))?.[1];
  return {
    icon: icon ?? (kind === "services" ? "construct-outline" : "pricetag-outline"),
    color: COLORS[index % COLORS.length],
  };
}

/** i18n key for the original 9 categories (they have Swahili names), else undefined. */
export function legacyKey(name: string) {
  return CATEGORIES.find((c) => c.dbName.toLowerCase() === name.toLowerCase())?.key;
}
