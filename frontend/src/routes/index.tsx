import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { absolute, DEFAULT_TITLE, pageMeta } from "@/lib/seo";
import { ArrowRight, ChevronLeft, ChevronRight, Truck, ShoppingCart, Wrench } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { TopBar } from "@/components/TopBar";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { OrderModal } from "@/components/OrderModal";
import { PartnersSection } from "@/components/PartnersSection";
import { AppDownloadSection } from "@/components/AppDownloadSection";
import { ServicePrice } from "@/components/ServicePrice";
import type { CatalogItem } from "@/components/SmartSearch";
import { addToCart } from "@/lib/customerCart";
import { CategoryBar, CategorySidebar } from "@/components/CategoryBar";
import riderImage from "@/assets/hero-rider.jpg";
import shopImage from "@/assets/market-hero.jpg";
import groceriesImage from "@/assets/hero-groceries.jpg";
import servicesImage from "@/assets/hero-services.jpg";
import { useLanguage } from "@/lib/LanguageContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: pageMeta({ title: DEFAULT_TITLE, path: "/" }),
    links: [{ rel: "canonical", href: absolute("/") }],
  }),
  component: Storefront,
});

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
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [slide, setSlide] = useState(0);
  const [slidePaused, setSlidePaused] = useState(false);

  // Hero: four pictures (delivery, shopping, groceries, services) changing every 6 seconds.
  useEffect(() => {
    if (slidePaused) return;
    const timer = window.setInterval(() => setSlide((s) => (s + 1) % 4), 6000);
    return () => window.clearInterval(timer);
  }, [slidePaused]);
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

  const openOrder = (p: ApiProduct) => {
    setSelectedProduct(p);
    setOrderModalOpen(true);
  };

  const slides = [
    {
      image: riderImage,
      title: t("slideRiderTitle"),
      tag: t("slideRiderTag"),
      service: false,
    },
    {
      image: shopImage,
      title: t("slideShopTitle"),
      tag: t("slideShopTag"),
      service: false,
    },
    {
      image: groceriesImage,
      title: t("slideGroceriesTitle"),
      tag: t("slideGroceriesTag"),
      service: false,
    },
    {
      image: servicesImage,
      title: t("slideServicesTitle"),
      tag: t("slideServicesTag"),
      service: true,
    },
  ];
  const current = slides[slide % slides.length]!;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <SiteHeader onSearchSelect={handleSearchSelect} />

      <main className="mx-auto max-w-[1500px] px-4 py-5 lg:px-7">
        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <Reveal className="hidden lg:block">
            <CategorySidebar className="h-full" />
          </Reveal>

          {/* Hero */}
          <section
            className="relative min-h-[230px] overflow-hidden rounded-2xl bg-[#111827] shadow-card sm:min-h-[300px] md:min-h-[540px] md:rounded-3xl md:bg-[#FDF8E9]"
            onMouseEnter={() => setSlidePaused(true)}
            onMouseLeave={() => setSlidePaused(false)}
          >
            {slides.map((item, index) => (
              <img
                key={item.title}
                src={item.image}
                width={1600}
                height={800}
                alt={item.title.replace("|", " ")}
                className={`absolute inset-0 h-full w-full object-cover object-[72%_center] transition-all duration-1000 md:object-right ${
                  index === slide ? "scale-100 opacity-100" : "scale-105 opacity-0"
                }`}
              />
            ))}
            {/* Phones: dark fade on the left only (like the app), so the picture stays clear */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(17,24,39,0.92)_0%,rgba(17,24,39,0.7)_45%,rgba(17,24,39,0)_85%)] md:hidden" />
            {/* Larger screens: white blur under the words, fading out left to right so the picture on the right stays clear */}
            <div className="absolute inset-0 hidden backdrop-blur-md [mask-image:linear-gradient(to_right,black_0%,black_38%,transparent_62%)] md:block" />
            <div className="absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(255,255,255,0.94)_0%,rgba(255,255,255,0.82)_38%,rgba(255,255,255,0.35)_52%,transparent_64%)] md:block" />
            {/* corner swoosh */}
            <div className="pointer-events-none absolute -bottom-20 -right-16 hidden size-56 rounded-full border-[16px] border-primary md:block" />
            <div className="pointer-events-none absolute -bottom-28 -right-6 hidden size-56 rounded-full bg-navy md:block" />

            {/* handwritten-style tag, per picture */}
            <p
              key={`tag-${slide}`}
              className="pointer-events-none absolute right-6 top-10 z-10 hidden max-w-[12rem] -rotate-12 animate-banner-in text-right text-3xl font-black italic leading-tight text-primary lg:block xl:right-12 xl:text-4xl"
            >
              {current.tag}
              <span className="ml-auto mt-1 block h-1 w-24 rounded-full bg-primary" />
            </p>

            <div
              key={slide}
              className="relative z-10 flex min-h-[230px] max-w-[62%] animate-banner-in flex-col justify-center px-5 pb-9 pt-6 sm:min-h-[300px] sm:px-8 md:min-h-[540px] md:px-12 md:py-10 lg:px-14"
            >
              <span className="hidden w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-black text-white shadow-md shadow-primary/30 sm:text-base md:inline-flex">
                <Truck className="size-5" /> {t("heroEyebrow")}
              </span>
              <h1 className="text-xl font-black leading-[1.15] tracking-tight text-white drop-shadow sm:text-3xl md:mt-6 md:text-5xl md:leading-[1.05] md:text-navy md:drop-shadow-none xl:text-6xl">
                {current.title.split("|")[0]}
                {current.title.includes("|") && (
                  <span className="block text-primary">{current.title.split("|")[1]}</span>
                )}
              </h1>

              <a
                href={current.service ? "#services" : "#products"}
                className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-orange-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-primary/30 transition hover:brightness-110 md:mt-9 md:gap-3 md:rounded-full md:px-8 md:py-4 md:text-xl"
              >
                <ShoppingCart className="size-4 md:size-6" />{" "}
                {current.service ? t("bookNow") : t("shopNow")}
                <ChevronRight className="size-4 md:size-6" />
              </a>
            </div>

            {/* arrows and dots */}
            <button
              type="button"
              onClick={() => setSlide((slide - 1 + slides.length) % slides.length)}
              className="absolute left-3 top-1/2 z-20 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white text-navy shadow-lg transition hover:text-primary md:grid"
              aria-label="Previous"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => setSlide((slide + 1) % slides.length)}
              className="absolute right-3 top-1/2 z-20 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white text-navy shadow-lg transition hover:text-primary md:grid"
              aria-label="Next"
            >
              <ChevronRight className="size-6" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 md:bottom-5 md:gap-2">
              {slides.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setSlide(index)}
                  className={`h-2 rounded-full border-2 transition-all md:h-3 ${
                    index === slide
                      ? "w-6 border-primary bg-primary md:w-8"
                      : "w-2 border-white/70 bg-white/40 hover:border-primary md:w-3 md:border-slate-300 md:bg-white"
                  }`}
                  aria-label={`Show picture ${index + 1}`}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 lg:hidden">
          <CategoryBar />
        </div>

        {/* Goods */}
        <section id="products" className="py-10">
          <div className="flex items-end justify-between gap-3">
            <h2 className="relative pb-2 text-3xl font-black text-navy">
              {t("popularProducts")}
              <span className="absolute bottom-0 left-0 h-1.5 w-24 rounded-full bg-primary" />
            </h2>
            {products.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAllProducts((v) => !v)}
                className="flex items-center gap-1.5 text-sm font-black text-primary hover:underline"
              >
                {t("viewAll")} <ArrowRight className="size-4" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm text-muted-foreground">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center text-sm text-muted-foreground">
              No products available yet.
            </div>
          ) : showAllProducts ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} onOpen={openOrder} addLabel={t("addButton")} />
              ))}
            </div>
          ) : (
            <SlidingRows
              items={products}
              render={(p, i, copy) => (
                <ProductCard
                  key={`${p.id}-${i}`}
                  p={p}
                  onOpen={openOrder}
                  addLabel={t("addButton")}
                  className="w-44 shrink-0 sm:w-52"
                  copy={copy}
                />
              )}
            />
          )}
        </section>

        {/* Services: one sliding row of the same cards as the products */}
        <section id="services" className="pb-10">
          <h2 className="relative pb-2 text-3xl font-black text-navy">
            {t("servicesHeading")}{" "}
            <span className="text-primary">{t("servicesHeadingAccent")}</span>
            <span className="absolute bottom-0 left-0 h-1.5 w-24 rounded-full bg-primary" />
          </h2>
          {loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Loading services...
            </div>
          ) : services.length === 0 ? null : (
            <SlidingRows
              rows={1}
              items={services as ApiProduct[]}
              render={(svc, i, copy) => (
                <ProductCard
                  key={`${svc.id}-${i}`}
                  p={svc}
                  onOpen={openOrder}
                  addLabel={t("bookNow")}
                  service
                  className="w-44 shrink-0 sm:w-52"
                  copy={copy}
                />
              )}
            />
          )}
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

/** Rises into view the first time it is scrolled to. */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${shown ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** A product tile: the picture opens the order form, "Add" puts it in the cart. */
function ProductCard({
  p,
  onOpen,
  addLabel,
  className = "",
  copy = false,
  service = false,
}: {
  p: ApiProduct;
  onOpen: (p: ApiProduct) => void;
  addLabel: string;
  className?: string;
  copy?: boolean;
  /** Services: price shown as "from", and the button books it. */
  service?: boolean;
}) {
  return (
    <article
      aria-hidden={copy || undefined}
      className={`group flex flex-col rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-card-hover ${className}`}
      {...(copy ? { "data-marquee-copy": "" } : {})}
    >
      <button
        type="button"
        onClick={() => onOpen(p)}
        className="aspect-square overflow-hidden rounded-xl bg-white"
      >
        <img
          src={p.image_url}
          alt={p.title}
          loading="lazy"
          className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
        />
      </button>
      <h3 className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-tight text-navy sm:text-[15px]">
        {p.title}
      </h3>
      {service ? (
        <ServicePrice
          price={p.price}
          currency={p.currency}
          className="mt-1 text-base font-black text-primary"
        />
      ) : (
        <p className="mt-1 text-base font-black text-primary">
          Tsh {Number(p.price).toLocaleString()}
        </p>
      )}
      <button
        type="button"
        onClick={() => (service ? onOpen(p) : addToCart(p))}
        className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-black text-white shadow-md shadow-primary/25 transition hover:bg-orange-600"
      >
        {service ? <Wrench className="size-4" /> : <ShoppingCart className="size-4" />} {addLabel}
      </button>
    </article>
  );
}

/**
 * Two rows sliding past each other (first right-to-left, second left-to-right),
 * each rising into view. Every row holds its items twice so the loop is seamless.
 */
function SlidingRows<T>({
  items,
  render,
  rows: rowCount = 2,
}: {
  items: T[];
  render: (item: T, index: number, copy: boolean) => ReactNode;
  /** 1 = a single row sliding right-to-left. */
  rows?: 1 | 2;
}) {
  const rows = (
    rowCount === 1
      ? [items]
      : [items.filter((_, i) => i % 2 === 0), items.filter((_, i) => i % 2 === 1)]
  ).filter((row) => row.length > 0);
  return (
    <div className="mt-5 space-y-3">
      {rows.map((row, r) => (
        <Reveal key={r} delay={r * 150}>
          <div className="marquee">
            <div
              className={`marquee-track ${r === 1 ? "reverse" : ""}`}
              style={{ "--marquee-duration": `${Math.max(row.length, 3) * 7}s` } as CSSProperties}
            >
              {[...row, ...row].map((item, i) => render(item, i, i >= row.length))}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
