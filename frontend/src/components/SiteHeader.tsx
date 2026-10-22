import { BrandLogo } from "@/components/BrandLogo";
import { CustomerCart } from "@/components/CustomerCart";
import { CustomerOrders } from "@/components/CustomerOrders";
import { SmartSearch, type CatalogItem } from "@/components/SmartSearch";
import { useLocation } from "@tanstack/react-router";
import { ChevronDown, Home, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

type MenuKey = "navHome" | "navGoodsServices" | "navAbout" | "navHelp" | "navContact";

// About / Help / Contact live in the footer for now.
const MENU: { key: MenuKey; href: string; icon?: LucideIcon; dropdown?: boolean }[] = [
  { key: "navHome", href: "/", icon: Home },
  { key: "navGoodsServices", href: "/#products", dropdown: true },
  { key: "navAbout", href: "#contact" },
  { key: "navHelp", href: "#contact" },
  { key: "navContact", href: "#contact" },
];

/** Logo + tagline, the big search box, and the cart / my orders buttons. */
export function SiteHeader({
  onSearchSelect,
}: {
  onSearchSelect: (item: CatalogItem) => boolean | void;
}) {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 shadow-nav backdrop-blur">
      {/* Desktop */}
      <div className="mx-auto hidden h-24 max-w-[1500px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-10 px-7 lg:grid">
        <a href="/" className="flex shrink-0 items-center gap-3" aria-label="DukaHub home">
          <BrandLogo className="size-14 rounded-2xl" />
          <span>
            <strong className="block text-[2.1rem] font-black leading-none tracking-tight text-navy">
              Duka<em className="not-italic text-primary">Hub</em>
            </strong>
            <small className="mt-1 block text-xs font-semibold text-navy/80">
              {t("headerTagline")}
            </small>
          </span>
        </a>
        <div className="mx-auto w-full max-w-3xl">
          <SmartSearch placeholder={t("searchPlaceholder")} onSelect={onSearchSelect} />
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <CustomerOrders />
          <CustomerCart />
        </div>
      </div>

      {/* Mobile */}
      <div className="mx-auto max-w-[1500px] px-4 py-3 lg:hidden">
        <div className="mb-3 flex items-center justify-between">
          <a href="/" className="flex shrink-0 items-center gap-2" aria-label="DukaHub home">
            <BrandLogo className="size-10 rounded-xl" />
            <span>
              <strong className="block text-2xl font-black leading-none text-navy">
                Duka<em className="not-italic text-primary">Hub</em>
              </strong>
              <small className="block text-[9px] font-semibold text-navy/70">
                {t("headerTagline")}
              </small>
            </span>
          </a>
          <div className="flex items-center gap-2">
            <CustomerOrders />
            <CustomerCart />
          </div>
        </div>
        <SmartSearch placeholder={t("searchPlaceholder")} compact onSelect={onSearchSelect} />
      </div>
      {/* Menu */}
      <nav className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-4 [scrollbar-width:none] lg:justify-center lg:px-7">
          {MENU.map(({ key, href, icon: Icon, dropdown }) => {
            const active =
              key === "navGoodsServices" && (pathname === "/" || pathname.startsWith("/category"));
            return (
              <a
                key={key}
                href={href}
                className={`relative flex shrink-0 items-center gap-2 px-4 py-3.5 text-sm font-bold transition lg:text-[15px] ${
                  active ? "bg-orange-50/70 text-primary" : "text-navy hover:text-primary"
                }`}
              >
                {Icon && <Icon className="size-5" />}
                {t(key)}
                {dropdown && <ChevronDown className="size-4" />}
                {active && (
                  <span className="absolute inset-x-1/3 bottom-1 h-1 rounded-full bg-primary" />
                )}
              </a>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
