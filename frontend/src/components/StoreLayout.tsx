import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { CategoryBar } from "@/components/CategoryBar";
import { OrderModal } from "@/components/OrderModal";
import { BrandLogo } from "@/components/BrandLogo";
import { CustomerOrders } from "@/components/CustomerOrders";
import { CustomerCart } from "@/components/CustomerCart";
import { SmartSearch, type CatalogItem } from "@/components/SmartSearch";
import { useLanguage } from "@/lib/LanguageContext";

export type ApiProduct = {
  id: string;
  image_url: string;
  title: string;
  subcategory?: string;
  category?: string;
  price: string | number;
  currency: string;
  discount?: string | number | null;
  sale?: string;
  store?: string;
  description?: string;
  listing_type?: "product" | "service";
};

export async function fetchProducts(
  filters: { category?: string; type?: "product" | "service" } = {},
): Promise<ApiProduct[]> {
  try {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.type) params.set("type", filters.type);
    const query = params.toString();
    const res = await fetch(`/api/catalog/${query ? `?${query}` : ""}`);
    if (!res.ok) return [];
    const data = await res.json();
    const products = Array.isArray(data.products) ? data.products : [];
    const services = Array.isArray(data.services) ? data.services : [];
    return [...products, ...services];
  } catch {
    return [];
  }
}

/**
 * Goods come back as category "Goods" with the real category ("Electronics")
 * as the sub-category, so match either field.
 */
export function inCategory(p: ApiProduct, dbName: string) {
  const name = dbName.trim().toLowerCase();
  return (
    (p.subcategory || "").trim().toLowerCase() === name ||
    (p.category || "").trim().toLowerCase() === name
  );
}

/** Everything listed in one category; "Services" means every service. */
export async function fetchProductsByCategory(name: string): Promise<ApiProduct[]> {
  if (name.trim().toLowerCase() === "services") return fetchProducts({ type: "service" });
  const items = await fetchProducts({ category: name });
  return items.filter((p) => inCategory(p, name));
}

interface StoreLayoutProps {
  children: React.ReactNode;
  activeCategory?: string | undefined;
}

export function StoreLayout({ children, activeCategory }: StoreLayoutProps) {
  const { t } = useLanguage();
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);

  const handleSearchSelect = (item: CatalogItem) => {
    if (item.tag === "service") return false;
    setSelectedProduct(item as ApiProduct);
    setOrderModalOpen(true);
    return true;
  };

  return (
    <>
      <TopBar />
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 shadow-nav backdrop-blur">
        {/* Desktop Layout */}
        <div className="mx-auto hidden h-20 max-w-[1500px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 lg:grid lg:gap-10 lg:px-7">
          <a
            href="/"
            className="flex shrink-0 items-center gap-2"
            aria-label="DukaHub home"
          >
            <BrandLogo />
            <span className="hidden sm:block">
              <strong className="block text-2xl font-black leading-none text-navy">
                Duka<em className="not-italic text-primary">Hub</em>
              </strong>
              <small className="text-[10px] font-bold text-muted-foreground">
                {t("goodsServices")}
              </small>
            </span>
          </a>
          <SmartSearch placeholder={t("searchPlaceholder")} onSelect={handleSearchSelect} />
          <div className="flex items-center gap-1 md:gap-3">
            <CustomerCart />
            <CustomerOrders />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="mx-auto max-w-[1500px] px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between mb-3">
            <a
              href="/"
              className="flex shrink-0 items-center gap-2"
              aria-label="DukaHub home"
            >
              <BrandLogo className="size-9 rounded-lg" />
              <div>
                <strong className="block text-xl font-black leading-none text-navy">
                  Duka<em className="not-italic text-primary">Hub</em>
                </strong>
              </div>
            </a>
            <div className="flex items-center gap-2">
              <CustomerCart />
              <CustomerOrders />
            </div>
          </div>
          <SmartSearch placeholder={t("searchPlaceholder")} compact onSelect={handleSearchSelect} />
        </div>
      </header>

      {/* Sidebar + Content */}
      <div className="mx-auto w-full max-w-[1500px] px-4 py-5 lg:px-7">
        <div className="min-w-0">
          {/* Category Bar */}
          <CategoryBar active={activeCategory} />
          {/* Page Content */}
          {children}
        </div>
      </div>

      <OrderModal
        product={selectedProduct}
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
      />
    </>
  );
}
