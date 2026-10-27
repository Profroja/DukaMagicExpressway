import { createFileRoute } from "@tanstack/react-router";
import { LEGACY_CATEGORIES } from "@/lib/categories";
import { SITE_URL } from "@/lib/seo";

/**
 * /sitemap.xml for Google: the home page, vendor sign-up and every category
 * page. Categories come live from the backend, so new ones are listed without
 * a rebuild; if the backend can't be reached the built-in list is used.
 */

// Where the server asks for the category list (same Django backend as /api).
const API_URL = (process.env["SITEMAP_API_URL"] || process.env["API_URL"] || SITE_URL).replace(
  /\/+$/,
  "",
);

type CategoryLists = {
  goods?: { name: string; count: number }[];
  services?: { name: string; count: number }[];
};

async function categoryNames(): Promise<{ name: string; count: number }[]> {
  try {
    const response = await fetch(`${API_URL}/api/categories/`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(String(response.status));
    const data = (await response.json()) as CategoryLists;
    const all = [...(data.goods ?? []), ...(data.services ?? [])];
    if (all.length) return all;
  } catch {
    // fall through to the built-in list
  }
  return LEGACY_CATEGORIES.map((name) => ({ name, count: 0 }));
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function entry(path: string, changefreq: string, priority: string, lastmod: string) {
  return [
    "  <url>",
    `    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const seen = new Set<string>();
        const categories = (await categoryNames())
          .filter((c) => {
            const key = c.name.trim().toLowerCase();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          // Categories with products first - they matter most to shoppers.
          .sort((a, b) => b.count - a.count);

        const urls = [
          entry("/", "daily", "1.0", today),
          ...categories.map((c) =>
            entry(
              `/category/${encodeURIComponent(c.name)}`,
              "daily",
              c.count > 0 ? "0.8" : "0.5",
              today,
            ),
          ),
          entry("/register", "monthly", "0.4", today),
          entry("/privacy", "yearly", "0.3", today),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
