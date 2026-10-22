import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bike,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Flame,
  Heart,
  Home,
  Laptop,
  Store,
  ShoppingCart,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/TopBar";
import { CategoryBar } from "@/components/CategoryBar";
import { Footer } from "@/components/Footer";
import { OrderModal } from "@/components/OrderModal";
import { BrandLogo } from "@/components/BrandLogo";
import { PartnersSection } from "@/components/PartnersSection";
import { AppDownloadSection } from "@/components/AppDownloadSection";
import { ServicePrice } from "@/components/ServicePrice";
import { CustomerOrders } from "@/components/CustomerOrders";
import { CustomerCart } from "@/components/CustomerCart";
import { SmartSearch, type CatalogItem } from "@/components/SmartSearch";
import { addToCart } from "@/lib/customerCart";
import { useLanguage } from "@/lib/LanguageContext";
import riderHeroImage from "@/assets/hero-rider.jpg";
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
    textKey: "heroRiderText",
    badgeKey: "heroRiderBadge",
  },
  {
    image: groceriesHeroImage,
    titleKey: "heroGroceriesTitle",
    accentKey: "heroGroceriesAccent",
    textKey: "heroGroceriesText",
    badgeKey: "heroGroceriesBadge",
  },
  {
    image: foodHeroImage,
    titleKey: "heroFoodTitle",
    accentKey: "heroFoodAccent",
    textKey: "heroFoodText",
    badgeKey: "heroFoodBadge",
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
    text: t(b.textKey),
    badge: t(b.badgeKey),
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
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 shadow-nav backdrop-blur">
        {/* Desktop Layout */}
        <div className="mx-auto hidden h-20 max-w-[1500px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 lg:grid lg:gap-10 lg:px-7">
          <a href="#" className="flex shrink-0 items-center gap-2" aria-label="DukaHub home">
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
          {/* Top Row: Logo + Icons */}
          <div className="flex items-center justify-between mb-3">
            <a href="#" className="flex shrink-0 items-center gap-2" aria-label="DukaHub home">
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

          {/* Bottom Row: Search Bar */}
          <SmartSearch placeholder={t("searchPlaceholder")} compact onSelect={handleSearchSelect} />
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-5 lg:px-7">
        <section>
          <div className="-mx-4 lg:mx-0">
            <div
              className="hero relative min-h-[360px] overflow-hidden md:aspect-[2/1] md:max-h-[680px] md:min-h-0 md:w-full lg:rounded-lg lg:border lg:border-border"
              onMouseEnter={() => setBannerPaused(true)}
              onMouseLeave={() => setBannerPaused(false)}
            >
              {banners.map((item, index) => (
                <img
                  key={item.title}
                  src={item.image}
                  width={1600}
                  height={800}
                  alt={item.title}
                  className={`absolute inset-0 h-full w-full object-cover object-[center_40%] transition-all duration-700 ${index === banner ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
                />
              ))}
              <div className="absolute inset-0 bg-hero-fade" />
              {banners[banner] && (
                <>
                  <div
                    key={banner}
                    className="relative z-10 flex min-h-[360px] max-w-xl animate-banner-in flex-col justify-center px-7 py-12 sm:px-14 md:absolute md:inset-y-0 md:left-0 md:min-h-0 md:w-[46%] md:max-w-none md:py-8 lg:px-16"
                  >
                    <h1 className="text-4xl font-black leading-[1.08] text-navy lg:text-5xl xl:text-6xl">
                      {banners[banner].title}{" "}
                      <span className="block text-primary">{banners[banner].accent}</span>
                    </h1>
                    <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-slate-600 sm:text-base xl:text-lg">
                      {banners[banner].text}
                    </p>
                    <Button
                      className="mt-6 w-fit rounded-full px-7"
                      onClick={() =>
                        document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })
                      }
                    >
                      {t("shopNow")} <ChevronRight />
                    </Button>
                  </div>
                  <span className="absolute right-6 top-6 grid size-20 rotate-6 place-items-center rounded-full bg-primary px-2 text-center text-sm font-black leading-tight text-primary-foreground shadow-card animate-float">
                    {banners[banner].badge}
                  </span>
                </>
              )}
              <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
                {banners.map((item, index) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setBanner(index)}
                    className={`h-2.5 rounded-full transition-all ${index === banner ? "w-8 bg-primary" : "w-2.5 bg-navy/25 hover:bg-navy/50"}`}
                    aria-label={`Show banner ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            <CategoryBar className="mt-4" />
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

        <section id="services" className="rounded-lg bg-services px-4 py-6 sm:px-6">
          <SectionHead icon={<Wrench />} title={t("ourServices")} />
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {loading ? (
              <div className="col-span-full py-20 text-center text-sm text-muted-foreground">
                Loading services...
              </div>
            ) : services.length === 0 ? (
              <div className="col-span-full py-20 text-center text-sm text-muted-foreground">
                No services available yet.
              </div>
            ) : (
              services.slice(0, 10).map((s) => (
                <article
                  key={s.id}
                  className="group overflow-hidden rounded-md border border-border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={s.image_url}
                      alt={`${s.title} professional`}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3">
                    {s.store && (
                      <div className="mb-2 flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1">
                        <Store className="size-3 text-primary" />
                        <span className="truncate text-[10px] font-bold text-navy">{s.store}</span>
                      </div>
                    )}
                    <h3 className="truncate text-sm font-extrabold text-navy">{s.title}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {s.description || ""}
                    </p>
                    <ServicePrice price={s.price} currency={s.currency} />
                    <Button
                      className="mt-4 h-9 w-full px-2 text-xs"
                      type="button"
                      onClick={() => {
                        setSelectedProduct(s as ApiProduct);
                        setOrderModalOpen(true);
                      }}
                    >
                      <Wrench className="size-4" /> {t("bookNow")}
                    </Button>
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
