import {
  Apple,
  Baby,
  Beef,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Camera,
  Car,
  ChefHat,
  Code,
  CookingPot,
  Croissant,
  CupSoda,
  Droplets,
  Dumbbell,
  Factory,
  Gamepad2,
  Gem,
  Gift,
  GraduationCap,
  Hammer,
  House,
  Laptop,
  Monitor,
  Music,
  Palette,
  PartyPopper,
  PawPrint,
  Pill,
  Plane,
  Plug,
  Printer,
  Recycle,
  Refrigerator,
  Scale,
  Scissors,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Smartphone,
  Sofa,
  Sparkles,
  Sprout,
  Stethoscope,
  Sun,
  Tag,
  Truck,
  Tv,
  UtensilsCrossed,
  WashingMachine,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** One category from /api/categories/ ("count" = listings customers can buy now). */
export type CategoryOption = { name: string; count: number };
export type CategoryLists = { goods: CategoryOption[]; services: CategoryOption[] };
export type CategoryKind = "goods" | "services";
/** A category a store typed itself because nothing in the list fitted. */
export type NewCategory = { name: string; type: CategoryKind };

let cached: Promise<CategoryLists> | null = null;

/** Every goods and service category (built-in plus ones stores added). */
export function fetchCategories(fresh = false): Promise<CategoryLists> {
  if (!cached || fresh) {
    cached = fetch("/api/categories/")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => ({
        goods: Array.isArray(data?.goods) ? data.goods : [],
        services: Array.isArray(data?.services) ? data.services : [],
      }))
      .catch(() => {
        cached = null;
        return { goods: [], services: [] };
      });
  }
  return cached;
}

// First match wins, so specific words come before general ones.
const ICON_RULES: [RegExp, LucideIcon][] = [
  [/repair/, Wrench],
  [/catering/, ChefHat],
  [/food|meal|restaurant/, UtensilsCrossed],
  [/grocer/, ShoppingBasket],
  [/fresh|produce|fruit|vegetable/, Apple],
  [/meat|fish|poultry|butcher/, Beef],
  [/baker|snack|cake/, Croissant],
  [/beverage|drink|juice|water/, CupSoda],
  [/phone|tablet/, Smartphone],
  [/computer|laptop/, Laptop],
  [/tv|audio|video/, Tv],
  [/appliance/, Refrigerator],
  [/electronic/, Monitor],
  [/tailor/, Scissors],
  [/laundry|dry clean/, WashingMachine],
  [/fashion|cloth/, Shirt],
  [/shoe|bag/, ShoppingBag],
  [/jewel|watch/, Gem],
  [/beauty|spa|cosmetic|salon/, Sparkles],
  [/health & medical|clinic|doctor/, Stethoscope],
  [/pharma|medic|drug/, Pill],
  [/baby|kid|child/, Baby],
  [/toy|game/, Gamepad2],
  [/furniture/, Sofa],
  [/kitchen|dining|cook/, CookingPot],
  [/real estate|rental|propert/, Building2],
  [/home|house/, House],
  [/build|hardware|construct|renovat/, Hammer],
  [/tool|equipment/, Wrench],
  [/agricultur|farm/, Sprout],
  [/motorcycle|bicycle|bike/, Bike],
  [/car hire|automotive|vehicle|car\b|spare/, Car],
  [/sport|fitness|gym|wellness/, Dumbbell],
  [/education|tutor|school|training/, GraduationCap],
  [/book|stationery/, BookOpen],
  [/pet/, PawPrint],
  [/gift|craft/, Gift],
  [/art|collect/, Palette],
  [/music/, Music],
  [/energy|solar/, Sun],
  [/industrial/, Factory],
  [/second-hand|used/, Recycle],
  [/clean/, Droplets],
  [/plumb|electric/, Plug],
  [/transport|moving|delivery|logistic|courier/, Truck],
  [/photo/, Camera],
  [/event|entertain|party/, PartyPopper],
  [/travel|tour/, Plane],
  [/security/, ShieldCheck],
  [/legal|financ|account/, Scale],
  [/\bit\b|software|web/, Code],
  [/design|print/, Printer],
  [/office|professional|business/, Briefcase],
];

/** An icon for any category name, including ones stores typed themselves. */
export function categoryIcon(name: string, kind: CategoryKind = "goods"): LucideIcon {
  const lower = name.toLowerCase();
  for (const [pattern, icon] of ICON_RULES) if (pattern.test(lower)) return icon;
  return kind === "services" ? Wrench : Tag;
}

/** True when the picks include at least one category of this kind. */
export function hasCategoryOf(
  kind: CategoryKind,
  lists: CategoryLists,
  selected: string[],
  newCategories: NewCategory[],
) {
  const names = new Set(lists[kind].map((c) => c.name));
  return selected.some((n) => names.has(n)) || newCategories.some((c) => c.type === kind);
}

/** "goods"/"services" a store may add categories in, from what it sells. */
export function kindsForStore(listingKind: string | undefined): CategoryKind[] {
  if (listingKind === "both") return ["goods", "services"];
  if (listingKind === "service") return ["services"];
  return ["goods"];
}

/** The 9 categories of the first site version, for old /category/<number> links. */
export const LEGACY_CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Living",
  "Beauty & Health",
  "Groceries",
  "Automotive",
  "Sports & Outdoors",
  "Books & Stationery",
  "Services",
];

export const categoryHref = (name: string) => `/category/${encodeURIComponent(name)}`;
