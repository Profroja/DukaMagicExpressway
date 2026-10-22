import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  BadgeCheck,
  Headphones,
  ShieldCheck,
  Truck,
  ShoppingCart,
  Wrench,
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
import { categoryHref } from "@/lib/categories";
import { CategoryBar, CategorySidebar } from "@/components/CategoryBar";
import goodsBannerImage from "@/assets/banner-groceries.webp";
import servicesBannerImage from "@/assets/banner-services.webp";
import { useLanguage } from "@/lib/LanguageContext";

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

  // Banner: goods, then services; changes by itself every 6 seconds.
  useEffect(() => {
    if (slidePaused) return;
    const timer = window.setInterval(() => setSlide((s) => (s + 1) % 2), 6000);
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
      image: goodsBannerImage,
      pre: t("bannerPre"),
      highlight: t("bannerHighlight"),
      post: t("bannerPost"),
      sub: t("bannerSub"),
      text: t("bannerText"),
      cta: t("shopNow"),
      href: "#products",
    },
    {
      image: servicesBannerImage,
      pre: t("banner2Pre"),
      highlight: t("banner2Highlight"),
      post: t("banner2Post"),
      sub: t("banner2Sub"),
      text: t("banner2Text"),
      cta: t("bookNow"),
      href: "#services",
    },
  ];
  const current = slides[slide % slides.length]!;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <SiteHeader onSearchSelect={handleSearchSelect} />

      <main className="mx-auto max-w-[1500px] px-4 py-5 lg:px-7">
        {/* Banner */}
        <section
          className="relative overflow-hidden rounded-3xl bg-navy shadow-card"
          onMouseEnter={() => setSlidePaused(true)}
          onMouseLeave={() => setSlidePaused(false)}
        >
          {/* orange swooshes */}
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-[38rem] -rotate-6 rounded-[100%] border-[18px] border-primary" />
          <div className="pointer-events-none absolute -right-24 -top-28 h-60 w-[30rem] rotate-12 rounded-[100%] border-[16px] border-primary/90" />
          <div className="pointer-events-none absolute inset-y-0 left-[38%] hidden w-72 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent md:block" />

          <div className="relative grid items-center gap-4 px-6 py-8 sm:px-10 md:grid-cols-[1.05fr_1fr] md:py-6 lg:grid-cols-[1.1fr_1fr_0.9fr] lg:px-14">
            <div key={slide} className="relative z-10 animate-banner-in">
              <h1 className="text-4xl font-black leading-[1.05] text-white sm:text-5xl">
                {current.pre} <span className="text-primary">{current.highlight}</span>
                {current.post && <> {current.post}</>}
              </h1>
              <p className="mt-2 text-xl font-bold text-white sm:text-2xl">{current.sub}</p>
              <p className="mt-3 max-w-md text-base leading-relaxed text-white/85">
                {current.text}
              </p>
              <a
                href={current.href}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-lg font-black text-white shadow-lg shadow-black/20 transition hover:bg-orange-600"
              >
                {current.cta} <ArrowRight className="size-5" />
              </a>
            </div>

            <div className="relative z-10 hidden h-64 md:block lg:h-72">
              {slides.map((item, index) => (
                <img
                  key={item.highlight}
                  src={item.image}
                  alt=""
                  width={760}
                  height={580}
                  className={`absolute inset-0 m-auto max-h-full w-auto object-contain drop-shadow-2xl transition-all duration-700 [mask-image:linear-gradient(to_bottom,black_80%,transparent)] ${
                    index === slide
                      ? "translate-x-0 scale-100 opacity-100"
                      : "translate-x-10 scale-95 opacity-0"
                  }`}
                />
              ))}
            </div>

            <p className="relative z-10 hidden -rotate-6 text-center font-black italic leading-tight text-white lg:block">
              <span className="block text-5xl">
                Duka<span className="text-primary">Hub</span>
              </span>
              <span className="block text-4xl">{t("bannerScript")}</span>
              <span className="mx-auto mt-2 block h-1.5 w-40 rounded-full bg-primary" />
            </p>
          </div>
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((item, index) => (
              <button
                key={item.highlight}
                type="button"
                onClick={() => setSlide(index)}
                className={`h-2.5 rounded-full transition-all ${index === slide ? "w-8 bg-primary" : "w-2.5 bg-white/40 hover:bg-white/70"}`}
                aria-label={`Show slide ${index + 1}`}
              />
            ))}
          </div>
        </section>

        <div className="mt-6 lg:hidden">
          <CategoryBar />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Reveal className="hidden self-start lg:block">
            <CategorySidebar />
          </Reveal>

          <div className="min-w-0">
            {/* Why DukaHub */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {(
                [
                  [Truck, t("featDeliveryTitle"), t("featDeliverySub")],
                  [ShieldCheck, t("featPayTitle"), t("featPaySub")],
                  [Headphones, t("featCareTitle"), t("featCareSub")],
                  [BadgeCheck, t("featQualityTitle"), t("featQualitySub")],
                ] as const
              ).map(([Icon, title, sub], i) => (
                <Reveal
                  key={title}
                  delay={i * 110}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-100 sm:gap-4 sm:px-5"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-primary shadow-sm sm:size-14">
                    <Icon className="size-7 sm:size-8" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-navy sm:text-base">{title}</span>
                    <span className="block text-xs text-slate-600 sm:text-sm">{sub}</span>
                  </span>
                </Reveal>
              ))}
            </div>

            {/* Popular products */}
            <section id="products" className="mt-8">
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
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  {products.map((p) => (
                    <ProductCard key={p.id} p={p} onOpen={openOrder} addLabel={t("addButton")} />
                  ))}
                </div>
              ) : (
                // Two rows sliding past each other: the first right-to-left, the second left-to-right.
                <div className="mt-5 space-y-3">
                  {[products.filter((_, i) => i % 2 === 0), products.filter((_, i) => i % 2 === 1)]
                    .filter((row) => row.length > 0)
                    .map((row, r) => (
                      <Reveal key={r} delay={r * 150}>
                        <div className="marquee">
                          <div
                            className={`marquee-track ${r === 1 ? "reverse" : ""}`}
                            style={
                              {
                                "--marquee-duration": `${Math.max(row.length, 3) * 7}s`,
                              } as CSSProperties
                            }
                          >
                            {[...row, ...row].map((p, i) => (
                              <ProductCard
                                key={`${p.id}-${i}`}
                                p={p}
                                onOpen={openOrder}
                                addLabel={t("addButton")}
                                className="w-44 shrink-0 sm:w-52"
                                copy={i >= row.length}
                              />
                            ))}
                          </div>
                        </div>
                      </Reveal>
                    ))}
                </div>
              )}
            </section>
          </div>
        </div>

        <section
          id="services"
          className="mt-10 grid gap-6 rounded-3xl bg-gradient-to-br from-slate-50 to-orange-50/40 p-5 ring-1 ring-slate-100 sm:p-8 lg:grid-cols-[minmax(0,320px)_1fr]"
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
}: {
  p: ApiProduct;
  onOpen: (p: ApiProduct) => void;
  addLabel: string;
  className?: string;
  copy?: boolean;
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
      <p className="mt-1 text-base font-black text-primary">
        Tsh {Number(p.price).toLocaleString()}
      </p>
      <button
        type="button"
        onClick={() => addToCart(p)}
        className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-black text-white shadow-md shadow-primary/25 transition hover:bg-orange-600"
      >
        <ShoppingCart className="size-4" /> {addLabel}
      </button>
    </article>
  );
}
