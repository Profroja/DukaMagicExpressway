import { useEffect, useState } from "react";
import { LayoutGrid, Search, Wrench, X } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { categoryHref, categoryIcon, fetchCategories, type CategoryLists } from "@/lib/categories";

const COLORS = ["electric", "rose", "green", "violet", "orange", "red", "teal", "indigo", "slate"];

// The original categories have Swahili names in i18n.
const I18N_KEYS: Record<string, string> = {
  Electronics: "electronics",
  Fashion: "fashion",
  "Home & Living": "homeLiving",
  "Beauty & Health": "beautyHealth",
  Groceries: "groceries",
  Automotive: "automotive",
  "Sports & Outdoors": "sportsOutdoors",
  "Books & Stationery": "booksStationery",
  Services: "services",
};

const BAR_SIZE = 9;

/**
 * Category tiles: categories with things to buy first (busiest first), then
 * built-in ones, plus "Services" and "All categories" (every category, searchable).
 */
export function CategoryBar({
  active,
  className = "",
}: {
  active?: string | undefined;
  className?: string;
}) {
  const { t } = useLanguage();
  const [lists, setLists] = useState<CategoryLists>({ goods: [], services: [] });
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchCategories().then(setLists);
  }, []);

  const label = (name: string) => {
    const key = I18N_KEYS[name];
    return key ? t(key as Parameters<typeof t>[0]) : name;
  };

  const busy = [...lists.goods, ...lists.services]
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((c) => c.name);
  const fill = lists.goods.map((c) => c.name).filter((n) => !busy.includes(n));
  const tiles = [...busy, ...fill].filter((n) => n !== "Services").slice(0, BAR_SIZE - 2);
  const isActive = (name: string) => !!active && active.toLowerCase() === name.toLowerCase();

  const term = query.trim().toLowerCase();
  const groups = (["goods", "services"] as const).map((kind) => ({
    kind,
    items: lists[kind].filter((c) => !term || c.name.toLowerCase().includes(term)),
  }));

  return (
    <>
      <div
        id="categories"
        className={`flex gap-2 overflow-x-auto rounded-lg border border-border bg-card p-3 shadow-card sm:grid sm:grid-cols-9 sm:overflow-visible ${className}`}
      >
        {tiles.map((name, i) => {
          const Icon = categoryIcon(name);
          return (
            <a
              key={name}
              href={categoryHref(name)}
              className={`group flex w-[4.6rem] shrink-0 flex-col items-center gap-2 rounded-md py-2 text-center transition sm:w-auto ${isActive(name) ? "ring-2 ring-primary" : ""}`}
            >
              <span className={`category-icon category-${COLORS[i % COLORS.length]}`}>
                <Icon />
              </span>
              <span className="line-clamp-2 text-[10px] font-bold leading-tight text-navy group-hover:text-primary sm:text-xs">
                {label(name)}
              </span>
            </a>
          );
        })}
        <a
          href={categoryHref("Services")}
          className={`group flex w-[4.6rem] shrink-0 flex-col items-center gap-2 rounded-md py-2 text-center transition sm:w-auto ${isActive("Services") ? "ring-2 ring-primary" : ""}`}
        >
          <span className="category-icon category-slate">
            <Wrench />
          </span>
          <span className="text-[10px] font-bold leading-tight text-navy group-hover:text-primary sm:text-xs">
            {label("Services")}
          </span>
        </a>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="group flex w-[4.6rem] shrink-0 flex-col items-center gap-2 rounded-md py-2 text-center sm:w-auto"
        >
          <span className="category-icon category-orange">
            <LayoutGrid />
          </span>
          <span className="text-[10px] font-bold leading-tight text-navy group-hover:text-primary sm:text-xs">
            {t("allCategories")}
          </span>
        </button>
      </div>

      {showAll && (
        <div className="fixed inset-0 z-[9998] flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            onClick={() => setShowAll(false)}
          />
          <div className="relative z-10 flex max-h-[85dvh] w-full max-w-3xl flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
              <h2 className="text-lg font-black text-navy">{t("allCategories")}</h2>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="px-4 pt-3 sm:px-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search categories..."
                  className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-5 overflow-y-auto p-4 sm:p-5">
              {groups.map(
                (group) =>
                  group.items.length > 0 && (
                    <div key={group.kind}>
                      <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">
                        {group.kind === "goods" ? "Goods" : label("Services")}
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {group.items.map((c) => {
                          const Icon = categoryIcon(c.name, group.kind);
                          return (
                            <a
                              key={c.name}
                              href={categoryHref(c.name)}
                              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-primary hover:bg-orange-50"
                            >
                              <Icon className="size-4 shrink-0 text-primary" />
                              <span className="flex-1 leading-tight">{label(c.name)}</span>
                              {c.count > 0 && (
                                <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500">
                                  {c.count}
                                </span>
                              )}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ),
              )}
              {groups.every((g) => g.items.length === 0) && (
                <p className="py-8 text-center text-sm text-slate-400">
                  No category matches "{query}".
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
