import { Link } from "@tanstack/react-router";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Truck,
  ShieldCheck,
  CreditCard,
  Heart,
  Star,
} from "lucide-react";
import { CONTACT_EMAIL, CONTACT_PHONE, telHref } from "@/lib/contact";
import marketHeroImage from "@/assets/market-hero.jpg";
import { useLanguage } from "@/lib/LanguageContext";
import { BrandLogo } from "@/components/BrandLogo";

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="relative mt-12 overflow-hidden border-t border-border/30">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={marketHeroImage}
          alt="Footer Background"
          className="h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-gray-900/50 to-orange-900/60"></div>
      </div>

      {/* Main Footer Content */}
      <div className="relative z-10 mx-auto max-w-[1500px] px-4 py-12 text-center lg:px-7 lg:text-left">
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-center gap-2 lg:justify-start">
              <BrandLogo className="ring-2 ring-white/20" />
              <div>
                <strong className="block text-xl leading-none text-white">
                  Soko<em className="not-italic text-primary">Link</em>
                </strong>
                <small className="text-[9px] font-semibold text-white/80">
                  {t("goodsServices")}
                </small>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-white/90">
              {t("footerDescription1")}
              <br />
              {t("footerDescription2")}
            </p>

            {/* Social Media */}
            <div className="mt-6">
              <h4 className="mb-3 text-sm font-bold text-white">{t("followUs")}</h4>
              <div className="flex justify-center gap-3 lg:justify-start">
                {[
                  {
                    icon: Facebook,
                    color: "from-slate-700 to-slate-600",
                    href: "https://facebook.com",
                  },
                  {
                    icon: Instagram,
                    color: "from-orange-600 via-amber-500 to-yellow-500",
                    href: "https://instagram.com",
                  },
                  {
                    icon: Twitter,
                    color: "from-slate-600 to-gray-600",
                    href: "https://twitter.com",
                  },
                  { icon: Youtube, color: "from-red-600 to-red-500", href: "https://youtube.com" },
                ].map(({ icon: Icon, color, href }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative flex size-10 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br ${color} shadow-md transition hover:scale-110 hover:shadow-lg`}
                    aria-label={`Follow us on ${Icon.name}`}
                  >
                    <Icon className="size-5 text-white" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="lg:col-span-2">
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">
              {t("contactUsTitle")}
            </h3>
            <ul className="space-y-4">
              <li>
                <a
                  href={telHref}
                  className="flex items-center gap-3 text-sm text-white/80 transition hover:text-primary"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-amber-600/80 text-white">
                    <Phone className="size-4" />
                  </span>
                  <span>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/50">
                      Phone
                    </span>
                    {CONTACT_PHONE}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center gap-3 text-sm text-white/80 transition hover:text-primary"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-amber-600/80 text-white">
                    <Mail className="size-4" />
                  </span>
                  <span>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/50">
                      Email
                    </span>
                    {CONTACT_EMAIL}
                  </span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-sm text-white/80">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-amber-600/80 text-white">
                    <MapPin className="size-4" />
                  </span>
                  <span>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/50">
                      Address
                    </span>
                    {t("darEsSalaam")}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 border-t border-white/10 bg-gradient-to-r from-navy/80 via-slate-800/80 to-primary/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1500px] px-4 py-4 lg:px-7">
          <div className="flex flex-col items-center justify-between gap-3 text-center text-xs text-white md:flex-row md:text-left">
            <p className="font-medium">
              © {currentYear} SokoLink. {t("rights")}{" "}
              <Heart className="inline size-3.5 fill-current text-primary" /> {t("inTanzania")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 font-medium">
              <Link to="/privacy" className="transition hover:text-primary">
                {t("privacyPolicy")}
              </Link>
              <span className="hidden md:inline">•</span>
              <a href="#terms" className="transition hover:text-primary">
                {t("terms")}
              </a>
              <span className="hidden md:inline">•</span>
              <a href="#cookies" className="transition hover:text-primary">
                {t("cookies")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
