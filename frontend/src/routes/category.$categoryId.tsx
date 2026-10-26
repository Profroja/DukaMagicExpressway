import { createFileRoute, useParams } from "@tanstack/react-router";
import { absolute, DEFAULT_TITLE, pageMeta } from "@/lib/seo";
import { ShoppingCart, Store as StoreIcon, Wrench, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { OrderModal } from "@/components/OrderModal";
import { ServicePrice } from "@/components/ServicePrice";
import {
  StoreLayout,
  fetchProducts,
  fetchProductsByCategory,
  type ApiProduct,
} from "@/components/StoreLayout";
import { LEGACY_CATEGORIES } from "@/lib/categories";
import { useLanguage } from "@/lib/LanguageContext";
import { addToCart } from "@/lib/customerCart";

export const Route = createFileRoute("/category/$categoryId")({
  head: ({ params }) => {
    const raw = safeDecode(params.categoryId).trim();
    const name = /^\d+$/.test(raw) ? (LEGACY_CATEGORIES[Number(raw)] ?? "") : raw;
    if (!name) return { meta: pageMeta({ title: DEFAULT_TITLE }) };
    const path = `/category/${encodeURIComponent(name)}`;
    return {
      meta: pageMeta({
        title: `${name} - Buy Online in Tanzania | SokoLink`,
        description: `Shop ${name} online on SokoLink with fast delivery in Dar es Salaam, Arusha, Mwanza, Dodoma and across Tanzania. Nunua ${name} mtandaoni, tunakuletea.`,
        path,
      }),
      links: [{ rel: "canonical", href: absolute(path) }],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { categoryId } = useParams({ from: "/category/$categoryId" });
  const { t } = useLanguage();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);

  // Category names in the URL (/category/Food%20%26%20Drinks); old links used a number.
  const raw = safeDecode(categoryId).trim();
  const categoryName = /^\d+$/.test(raw) ? (LEGACY_CATEGORIES[Number(raw)] ?? "") : raw;
  const isValid = categoryName !== "";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const request = !isValid ? fetchProducts() : fetchProductsByCategory(categoryName);
    request.then((items) => {
      if (cancelled) return;
      setProducts(items);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [categoryName, isValid]);

  return (
    <div className="flex min-h-screen flex-col">
      <StoreLayout activeCategory={isValid ? categoryName : undefined}>
        <div className="mt-4">
          {isValid && (
            <h1 className="mb-3 text-xl font-black text-navy sm:text-2xl">{categoryName}</h1>
          )}
          {/* Products Grid */}
          {loading ? (
            <div className="py-20 text-center text-sm text-muted-foreground">
              Loading products...
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {products.map((p) => (
                <article
                  key={p.id}
                  className="group overflow-hidden rounded-md border border-border bg-card p-3 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <div className="relative aspect-square overflow-hidden rounded-sm bg-muted">
                    <img
                      src={p.image_url}
                      width={816}
                      height={816}
                      loading="lazy"
                      alt={p.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    {p.sale && (
                      <span className="absolute left-2 top-2 rounded-full bg-sale px-2 py-1 text-[10px] font-black text-sale-foreground">
                        {p.sale}
                      </span>
                    )}
                  </div>
                  {p.store && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1">
                      <StoreIcon className="size-3 text-primary" />
                      <span className="truncate text-[10px] font-bold text-navy">{p.store}</span>
                    </div>
                  )}
                  <h3 className="mt-2 truncate text-sm font-extrabold text-navy">{p.title}</h3>
                  {p.listing_type === "service" ? (
                    <>
                      <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                        {p.subcategory || p.category || ""}
                      </p>
                      {p.description && (
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {p.description}
                        </p>
                      )}
                      <ServicePrice price={p.price} currency={p.currency} />
                      <Button
                        className="mt-3 h-9 w-full px-2 text-xs"
                        onClick={() => {
                          setSelectedProduct(p);
                          setOrderModalOpen(true);
                        }}
                      >
                        <Wrench className="size-3.5" /> {t("bookNow")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="mt-1 truncate text-[10px] font-medium text-muted-foreground">
                        {p.subcategory || p.category || ""}
                      </p>
                      <p className="mt-2 text-base font-black text-primary">
                        {p.currency} {Number(p.price).toLocaleString()}
                      </p>
                      {p.discount && (
                        <p className="text-[11px] text-muted-foreground line-through">
                          {p.currency} {Number(p.discount).toLocaleString()}
                        </p>
                      )}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="h-9 min-w-0 px-1 text-[10px] sm:text-xs"
                          onClick={() => {
                            setSelectedProduct(p);
                            setOrderModalOpen(true);
                          }}
                        >
                          <Zap className="size-3.5" /> {t("orderNow")}
                        </Button>
                        <Button
                          className="h-9 min-w-0 px-1 text-[10px] sm:text-xs"
                          onClick={() => addToCart(p)}
                        >
                          <ShoppingCart className="size-3.5" /> {t("addToCart")}
                        </Button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center">
              <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-muted">
                <StoreIcon className="size-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-navy">No items found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                There are no items in this category yet.
              </p>
              <Button className="mt-6" onClick={() => (window.location.href = "/")}>
                Back to Home
              </Button>
            </div>
          )}
        </div>
      </StoreLayout>
      <Footer />
      <OrderModal
        product={selectedProduct}
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
      />
    </div>
  );
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
