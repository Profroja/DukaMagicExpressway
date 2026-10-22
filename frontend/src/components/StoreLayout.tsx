import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { CategoryBar } from "@/components/CategoryBar";
import { OrderModal } from "@/components/OrderModal";
import type { CatalogItem } from "@/components/SmartSearch";

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
      <SiteHeader onSearchSelect={handleSearchSelect} />

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
