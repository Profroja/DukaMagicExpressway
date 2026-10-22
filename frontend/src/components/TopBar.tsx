import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Truck } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/lib/LanguageContext";
import { CONTACT_EMAIL, CONTACT_PHONE, telHref, whatsappHref } from "@/lib/contact";

export function TopBar() {
  const { t } = useLanguage();

  return (
    <div className="bg-navy text-white">
      <div className="mx-auto max-w-[1500px] px-4 lg:px-7">
        <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs font-semibold sm:text-[13px]">
          {/* Contact */}
          <div className="flex flex-wrap items-center gap-5">
            <a
              href={telHref}
              className="flex items-center gap-2 transition hover:text-primary"
              aria-label={t("callUs")}
            >
              <Phone className="size-4 text-primary" />
              <span className="hidden sm:inline">{CONTACT_PHONE}</span>
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-2 transition hover:text-primary"
              aria-label={t("emailUs")}
            >
              <Mail className="size-4 text-primary" />
              <span className="hidden md:inline">{CONTACT_EMAIL}</span>
            </a>
            <span className="hidden items-center gap-2 lg:flex">
              <MapPin className="size-4 text-primary" />
              {t("darEsSalaam")}
            </span>
          </div>

          {/* Delivery, language, social */}
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-2 sm:flex">
              <Truck className="size-4 text-primary" />
              {t("topFastDelivery")}
              <span className="text-white/30">|</span>
              <span className="text-primary">Dar es Salaam</span>
            </span>
            <LanguageSelector />
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:scale-110 hover:text-primary"
                aria-label="Facebook"
              >
                <Facebook className="size-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:scale-110 hover:text-primary"
                aria-label="Instagram"
              >
                <Instagram className="size-4" />
              </a>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:scale-110 hover:text-primary"
                aria-label="WhatsApp"
              >
                <MessageCircle className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
