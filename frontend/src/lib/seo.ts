/** Site-wide SEO settings: the public address, default texts and structured data. */
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/contact";

export const SITE_URL = "https://sokolink.co.tz";
export const SITE_NAME = "SokoLink";
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const DEFAULT_TITLE =
  "SokoLink Tanzania | Buy Products & Book Services Online – Fast Delivery";
export const DEFAULT_DESCRIPTION =
  "SokoLink is Tanzania's online marketplace: shop groceries, electronics, phones, fashion and more, or book trusted services, with fast delivery in Dar es Salaam, Arusha, Mwanza, Dodoma and across Tanzania. Nunua mtandaoni, tunakuletea.";
export const KEYWORDS = [
  "SokoLink",
  "online shopping Tanzania",
  "manunuzi mtandaoni",
  "nunua mtandaoni Tanzania",
  "delivery Dar es Salaam",
  "soko la mtandaoni",
  "Tanzania marketplace",
  "duka la mtandaoni",
  "groceries delivery Tanzania",
  "electronics Tanzania",
  "phones Tanzania",
  "book services Tanzania",
  "huduma Tanzania",
  "Arusha",
  "Mwanza",
  "Dodoma",
  "Zanzibar",
].join(", ");

/** Absolute URL for a path on the site. */
export function absolute(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Meta tags for a page: title, description, canonical-friendly Open Graph and Twitter. */
export function pageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  image = OG_IMAGE,
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
}) {
  const url = absolute(path);
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];
}

/** Pages that must stay out of Google (sign-in, dashboards). */
export const NO_INDEX = { name: "robots", content: "noindex, nofollow" };

/** Organization + website facts Google shows in search (logo, contact, area served). */
export const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      image: OG_IMAGE,
      email: CONTACT_EMAIL,
      telephone: CONTACT_PHONE.replace(/\s/g, ""),
      areaServed: { "@type": "Country", name: "Tanzania" },
      address: { "@type": "PostalAddress", addressLocality: "Dar es Salaam", addressCountry: "TZ" },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: CONTACT_PHONE.replace(/\s/g, ""),
        email: CONTACT_EMAIL,
        contactType: "customer service",
        areaServed: "TZ",
        availableLanguage: ["English", "Swahili"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: ["en-TZ", "sw-TZ"],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "OnlineStore",
      "@id": `${SITE_URL}/#store`,
      name: SITE_NAME,
      url: SITE_URL,
      image: OG_IMAGE,
      description: DEFAULT_DESCRIPTION,
      currenciesAccepted: "TZS",
      areaServed: { "@type": "Country", name: "Tanzania" },
      parentOrganization: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};
