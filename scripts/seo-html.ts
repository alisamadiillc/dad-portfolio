import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import type { Plugin } from "vite";

// Build-time SEO: transformIndexHtml fetches site_settings (+ skills) from
// Convex and fills the %SEO_*% placeholders in index.html. Social scrapers
// don't run JS, so the shipped HTML must already carry the real values.
// On Vercel VITE_CONVEX_URL points at prod, so every deploy re-syncs SEO
// with whatever the admin has saved.

const SITE_URL = "https://mohammadsamadi.com/";

// Used when Convex is unreachable or a field is empty — mirrors the values
// that used to be hardcoded in index.html.
const FALLBACK = {
  name: "Mohammad Samadi",
  author: "Mohammad Amin Samadi",
  title: "Mohammad Samadi - Remodeling & Handyman in Florida",
  description:
    "Licensed remodeling and handyman contractor with 20+ years across Florida. Kitchen and bath remodels, decks, tile, flooring, drywall, and repairs. Get a quote.",
  image: "https://cdn.samadihomerenovation.com/projects/mohammadsamadi.webp",
  location: "Florida",
  email: "masamadi.sfr@email.com",
  services: [
    "Kitchen & bath remodeling",
    "Carpentry & framing",
    "Tile & flooring",
    "Decks & outdoor builds",
    "Drywall & painting",
    "Fixtures & general repairs",
  ],
};

const escapeHtml = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

async function buildValues(convexUrl: string | undefined) {
  let settings: Record<string, unknown> = {};
  let skills: { label: string }[] = [];

  if (convexUrl) {
    try {
      const client = new ConvexHttpClient(convexUrl);
      // anyApi (untyped refs) keeps convex/_generated out of the node
      // tsconfig's program — the generated types don't compile under it.
      const [s, sk] = await Promise.all([
        client.query(anyApi.siteSettings.get, {}),
        client.query(anyApi.skills.list, {}),
      ]);
      settings = s ?? {};
      skills = sk ?? [];
      console.log(`[seo-html] injected site_settings from ${convexUrl}`);
    } catch (e) {
      console.warn(
        `[seo-html] failed to fetch site_settings (${e instanceof Error ? e.message : e}) — using fallback SEO values`
      );
    }
  } else {
    console.warn("[seo-html] VITE_CONVEX_URL not set — using fallback SEO");
  }

  const str = (key: string) => {
    const v = settings[key];
    return typeof v === "string" && v.trim() ? v : undefined;
  };

  const name = str("name") ?? FALLBACK.name;
  const headline = str("headline");
  const title = headline ? `${name} - ${headline}` : FALLBACK.title;
  const description = str("hero_bio") ?? FALLBACK.description;
  const image = str("avatar_url") ?? FALLBACK.image;
  const location = str("location") ?? FALLBACK.location;
  const email = str("email") ?? FALLBACK.email;
  const phone = str("phone");
  const services = skills.length
    ? skills.map((s) => s.label)
    : FALLBACK.services;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GeneralContractor",
    name,
    image,
    url: SITE_URL,
    email,
    ...(phone && { telephone: phone }),
    description: str("about") ?? description,
    areaServed: { "@type": "State", name: location },
    address: {
      "@type": "PostalAddress",
      addressRegion: "FL",
      addressCountry: "US",
    },
    priceRange: "$$",
    founder: { "@type": "Person", name },
    knowsAbout: services,
    makesOffer: services.map((label) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: label },
    })),
  };

  return {
    // Keys match the %SEO_<KEY>% placeholders in index.html.
    TITLE: escapeHtml(title),
    DESCRIPTION: escapeHtml(description),
    AUTHOR: escapeHtml(str("name") ?? FALLBACK.author),
    SITE_NAME: escapeHtml(str("short_name") ?? name),
    IMAGE: escapeHtml(image),
    IMAGE_ALT: escapeHtml(name),
    // "<" escaped so user content can never close the <script> tag.
    JSONLD: JSON.stringify(jsonLd).replaceAll("<", "\\u003c"),
  };
}

export function seoHtml(convexUrl: string | undefined): Plugin {
  // Fetch once per vite process; dev re-calls transformIndexHtml per request.
  let cached: Promise<Record<string, string>> | undefined;

  return {
    name: "seo-html",
    async transformIndexHtml(html) {
      cached ??= buildValues(convexUrl);
      const values = await cached;
      return html.replace(
        /%SEO_([A-Z_]+)%/g,
        (match, key: string) => values[key] ?? match
      );
    },
  };
}
