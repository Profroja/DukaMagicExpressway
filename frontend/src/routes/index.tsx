import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  Headphones,
  ShieldCheck,
  Truck,
  Store,
  ShoppingCart,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { OrderModal } from "@/components/OrderModal";
import { PartnersSection } from "@/components/PartnersSection";
import { AppDownloadSection } from "@/components/AppDownloadSection";
import { ServicePrice } from "@/components/ServicePrice";
import type { CatalogItem } from "@/components/SmartSearch";
import { addToCart } from "@/lib/customerCart";
import { categoryHref, categoryIcon, fetchCategories, type CategoryLists } from "@/lib/categories";
import { inCategory } from "@/components/StoreLayout";
import { useLanguage } from "@/lib/LanguageContext";
import riderHeroImage from "@/assets/hero-rider.jpg";
import shopHeroImage from "@/assets/market-hero.jpg";
import groceriesHeroImage from "@/assets/hero-groceries.jpg";
import foodHeroImage from "@/assets/hero-takeout.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DukaHub | Products & Services at Your Fingertips" },
      {
        name: "description",
        content:
          "Shop quality products and book trusted services with fast delivery across Tanzania.",
      },
      { property: "og:title", content: "DukaHub | Everything in One Place" },
      {
        property: "og:description",
        content:
          "Shop quality products and book trusted services with fast delivery across Tanzania.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Storefront,
});

const bannerConfigs = [
  {
    image: riderHeroImage,
    titleKey: "heroRiderTitle",
    accentKey: "heroRiderAccent",
  },
  {
    image: shopHeroImage,
    titleKey: "heroShopTitle",
    accentKey: "heroShopAccent",
  },
  {
    image: groceriesHeroImage,
    titleKey: "heroGroceriesTitle",
    accentKey: "heroGroceriesAccent",
  },
  {
    image: foodHeroImage,
    titleKey: "heroFoodTitle",
    accentKey: "heroFoodAccent",
  },
] as const;

type ApiProduct = {
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
  listing_type?: "product" | "service";
};

type ApiService = {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  store?: string;
  category?: string;
  subcategory?: string;
  price: string | number;
  currency: string;
  discount?: string | number | null;
  sale?: string;
  listing_type?: "product" | "service";
};

function Storefront() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [banner, setBanner] = useState(0);
  const [bannerPaused, setBannerPaused] = useState(false);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [categoryLists, setCategoryLists] = useState<CategoryLists>({ goods: [], services: [] });

  useEffect(() => {
    fetchCategories().then(setCategoryLists);
  }, []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/catalog/")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          if (Array.isArray(data.products)) setProducts(data.products);
          if (Array.isArray(data.services)) setServices(data.services);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Goods categories with things to buy first (busiest first), then the rest.
  const goodsCategories = [...categoryLists.goods].sort((a, b) => b.count - a.count);

  const handleSearchSelect = (item: CatalogItem) => {
    if (item.tag === "service") return false;
    setSelectedProduct(item as ApiProduct);
    setOrderModalOpen(true);
    return true;
  };

  const banners = bannerConfigs.map((b) => ({
    image: b.image,
    title: t(b.titleKey),
    accent: t(b.accentKey),
  }));

  useEffect(() => {
    if (bannerPaused) return;
    const timer = window.setInterval(
      () => setBanner((current) => (current + 1) % banners.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [bannerPaused]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <SiteHeader onSearchSelect={handleSearchSelect} />

      <main className="mx-auto max-w-[1500px] px-4 py-5 lg:px-7">
        {/* Hero: fixed words on the left, the pictures rotate on the right */}
        <section
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FFF4E6] via-[#FDF3E3] to-[#FDF8E9] shadow-card"
          onMouseEnter={() => setBannerPaused(true)}
          onMouseLeave={() => setBannerPaused(false)}
        >
          <div className="absolute inset-y-0 right-0 w-full md:w-[62%]">
            {banners.map((item, index) => (
              <img
                key={item.title}
                src={item.image}
                width={1600}
                height={800}
                alt={item.title}
                className={`absolute inset-0 h-full w-full object-cover object-right transition-all duration-1000 ${index === banner ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FDF3E3] via-[#FDF3E3]/70 to-transparent md:via-[#FDF3E3]/20 md:via-25%" />
            <div className="absolute inset-0 bg-[#FDF3E3]/80 md:hidden" />
          </div>

          {/* handwritten-style tagline */}
          <div className="pointer-events-none absolute right-6 top-5 z-10 hidden -rotate-12 text-right font-black italic leading-[1.05] text-navy lg:block xl:right-10">
            <span className="block text-2xl xl:text-3xl">{t("heroScript1")}</span>
            <span className="block pl-6 text-2xl xl:text-3xl">{t("heroScript2")}</span>
            <span className="block pl-10 text-2xl xl:text-3xl">{t("heroScript3")}</span>
            <span className="ml-auto mt-1 block h-1.5 w-28 rounded-full bg-primary" />
          </div>

          <div className="relative z-10 px-6 py-8 sm:px-10 lg:px-12 lg:py-10 md:max-w-[58%] xl:max-w-[52%]">
            <span className="inline-block rounded-md bg-primary px-3 py-1 text-sm font-black text-white shadow-sm">
              {t("heroTag")}
            </span>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl xl:text-[3.4rem]">
              <span className="block text-navy">{t("heroLine1")}</span>
              <span className="block text-primary">{t("heroLine2")}</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg">
              {t("heroIntro")}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-0 sm:divide-x sm:divide-orange-200">
              {(
                [
                  [ShieldCheck, t("heroFeatGenuine")],
                  [Truck, t("heroFeatFast")],
                  [ShieldCheck, t("heroFeatPay")],
                  [Headphones, t("heroFeatCare")],
                ] as const
              ).map(([Icon, label], i) => (
                <span
                  key={label}
                  className={`flex items-center gap-2.5 ${i > 0 ? "sm:pl-4" : ""} sm:pr-4`}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-orange-600 text-white shadow-md shadow-primary/30">
                    <Icon className="size-5" />
                  </span>
                  <span className="max-w-[7.5rem] text-[13px] font-bold leading-tight text-navy">
                    {label}
                  </span>
                </span>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2">
              {banners.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setBanner(index)}
                  className={`h-2.5 rounded-full transition-all ${index === banner ? "w-8 bg-primary" : "w-2.5 bg-navy/20 hover:bg-navy/40"}`}
                  aria-label={`Show picture ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Goods categories */}
        <section className="pt-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-navy">
                <span className="h-1 w-5 rounded-full bg-primary" /> {t("goodsKicker")}
              </p>
              <h2 className="mt-1 text-4xl font-black text-navy">
                {t("goodsTitle")} <span className="text-primary">{t("goodsTitleAlt")}</span>
              </h2>
            </div>
            <div
              id="goods-tabs"
              className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-slate-200 bg-white p-1 shadow-sm [scrollbar-width:none] lg:max-w-[60%]"
            >
              <a
                href="#products"
                className="shrink-0 rounded-full bg-primary px-5 py-2 text-sm font-black text-white shadow-sm"
              >
                {t("allGoods")}
              </a>
              {goodsCategories.slice(0, 12).map((c) => (
                <a
                  key={c.name}
                  href={categoryHref(c.name)}
                  className="shrink-0 rounded-full px-4 py-2 text-sm font-bold text-navy transition hover:bg-orange-50 hover:text-primary"
                >
                  {c.name}
                </a>
              ))}
              <button
                type="button"
                onClick={() =>
                  document.getElementById("goods-tabs")?.scrollBy({ left: 220, behavior: "smooth" })
                }
                className="sticky right-0 grid size-9 shrink-0 place-items-center rounded-full bg-white text-navy shadow-sm hover:bg-orange-50"
                aria-label="More categories"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>

          <div
            id="goods-grid"
            className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8"
          >
            {goodsCategories.slice(0, 8).map((c) => {
              const sample = products.find((p) => inCategory(p, c.name) && p.image_url);
              const Icon = categoryIcon(c.name);
              return (
                <a
                  key={c.name}
                  href={categoryHref(c.name)}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-hover"
                >
                  <div className="grid aspect-[4/3] place-items-center overflow-hidden bg-gradient-to-br from-orange-50 to-slate-50">
                    {sample ? (
                      <img
                        src={sample.image_url}
                        alt={c.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <Icon className="size-14 text-primary/70 transition group-hover:scale-110" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-navy">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        {c.count} {t("itemsWord")}
                      </p>
                    </div>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-50 text-navy shadow-sm transition group-hover:bg-primary group-hover:text-white">
                      <ChevronRight className="size-4" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <section id="products" className="py-8">
          <SectionHead icon={<Flame />} title={t("popularProducts")} />
          <div className="mt-4">
            {loading ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                No products available yet.
              </div>
            ) : (
              (() => {
                // Two rows: first slides right-to-left, second left-to-right.
                const list = products.slice(0, 20);
                const half = Math.ceil(list.length / 2);
                const rows =
                  list.length >= 6 ? [list.slice(0, half), list.slice(half)] : [list, list];
                return rows.map((row, r) => (
                  <div key={r} className="marquee">
                    <div
                      className={`marquee-track${r === 1 ? " reverse" : ""}`}
                      style={
                        {
                          "--marquee-duration": `${Math.max(25, row.length * 7)}s`,
                        } as CSSProperties
                      }
                    >
                      {[0, 1].map((copy) =>
                        row.map((p) => (
                          <article
                            key={`${copy}-${p.id}`}
                            data-marquee-copy={copy === 1 ? "" : undefined}
                            aria-hidden={copy === 1 || undefined}
                            className="group w-44 shrink-0 overflow-hidden rounded-md border border-border bg-card p-3 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover sm:w-52"
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
                                <Store className="size-3 text-primary" />
                                <span className="truncate text-[10px] font-bold text-navy">
                                  {p.store}
                                </span>
                              </div>
                            )}
                            <h3 className="mt-2 truncate text-sm font-extrabold text-navy">
                              {p.title}
                            </h3>
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
                          </article>
                        )),
                      )}
                    </div>
                  </div>
                ));
              })()
            )}
          </div>
        </section>

        <section
          id="services"
          className="grid gap-6 rounded-3xl bg-gradient-to-br from-slate-50 to-orange-50/40 p-5 ring-1 ring-slate-100 sm:p-8 lg:grid-cols-[minmax(0,320px)_1fr]"
        >
          <div className="flex flex-col justify-center">
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-primary">
              <span className="h-1 w-5 rounded-full bg-primary" /> {t("servicesKicker")}
            </p>
            <h2 className="mt-1 text-4xl font-black text-navy">
              {t("servicesTitle")} <span className="text-primary">{t("servicesTitleAlt")}</span>
            </h2>
            <p className="mt-4 leading-relaxed text-slate-600">{t("servicesIntro")}</p>
            <a
              href={categoryHref("Services")}
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 font-black text-white shadow-lg shadow-primary/30 transition hover:bg-orange-600"
            >
              {t("viewAllServices")} <ChevronRight className="size-5" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {loading ? (
              <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
                Loading services...
              </div>
            ) : services.length === 0 ? (
              <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
                No services available yet.
              </div>
            ) : (
              services.slice(0, 5).map((s) => (
                <article
                  key={s.id}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
                    <img
                      src={s.image_url}
                      alt={s.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
                    <div className="flex items-start gap-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-orange-600 text-white">
                        <Wrench className="size-4" />
                      </span>
                      <h3 className="text-sm font-black leading-snug text-navy">{s.title}</h3>
                    </div>
                    <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500">
                      {s.description || ""}
                    </p>
                    <ServicePrice price={s.price} currency={s.currency} />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(s as ApiProduct);
                        setOrderModalOpen(true);
                      }}
                      className="mt-2 inline-flex w-fit items-center gap-1 text-xs font-black text-primary hover:underline"
                    >
                      {t("learnMore")} <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <PartnersSection />

        <AppDownloadSection />
      </main>
      <Footer />
      <OrderModal
        product={selectedProduct}
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
      />
    </div>
  );
}

function AutoCarousel({
  children,
  label,
  className = "mt-4",
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const move = (direction: number) => {
    const node = rail.current;
    if (!node) return;
    const amount = Math.max(node.clientWidth * 0.82, 280);
    const atEnd = node.scrollLeft + node.clientWidth >= node.scrollWidth - 10;
    if (direction > 0 && atEnd) node.scrollTo({ left: 0, behavior: "smooth" });
    else node.scrollBy({ left: direction * amount, behavior: "smooth" });
  };
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => move(1), 4200);
    return () => window.clearInterval(timer);
  });
  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={rail}
        className="carousel-rail flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3"
        aria-label={`${label} carousel`}
      >
        {children}
      </div>
      <Button
        variant="icon"
        className="absolute -left-2 top-1/2 z-10 size-9 -translate-y-1/2 bg-card shadow-card"
        onClick={() => move(-1)}
        aria-label={`Previous ${label}`}
      >
        <ChevronLeft />
      </Button>
      <Button
        variant="icon"
        className="absolute -right-2 top-1/2 z-10 size-9 -translate-y-1/2 bg-card shadow-card"
        onClick={() => move(1)}
        aria-label={`Next ${label}`}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}

function SectionHead({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="text-primary [&_svg]:size-7">{icon}</span>
      <div className="min-w-0">
        <h2 className="truncate text-xl font-black text-navy">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
