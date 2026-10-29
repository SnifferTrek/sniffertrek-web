import type { MetadataRoute } from "next";
import { localeLanguages, localeUrl } from "@/i18n/site";

const LOCALES = ["de", "en", "es"] as const;

/** Keine Imports aus Reports/Inspiration: die ziehen next-intl und können /sitemap.xml mit 500 killen. */
const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/unsere-reisen", changeFrequency: "weekly", priority: 0.9 },
  { path: "/inspiration", changeFrequency: "weekly", priority: 0.85 },
  { path: "/info", changeFrequency: "monthly", priority: 0.8 },
  { path: "/reise-planen", changeFrequency: "monthly", priority: 0.7 },
  { path: "/meine-reisen", changeFrequency: "monthly", priority: 0.5 },
  { path: "/impressum", changeFrequency: "yearly", priority: 0.2 },
  { path: "/datenschutz", changeFrequency: "yearly", priority: 0.2 },
  { path: "/agb", changeFrequency: "yearly", priority: 0.2 },
];

const REPORT_PATHS = [
  "/reisebericht/venedig",
  "/reisebericht/cinque-terre",
  "/reisebericht/barcelona",
  "/reisebericht/cote-dazur",
  "/reisebericht/provence",
  "/reisebericht/grandes-alpes",
] as const;

const INSPIRATION_SLUGS = [
  "santorini",
  "nordlichter",
  "venedig",
  "malediven",
  "paris",
  "barcelona",
  "amalfi",
  "hallstatt",
  "dubrovnik",
  "cinque-terre",
  "cote-dazur",
  "provence",
  "grandes-alpes",
] as const;

function entries(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
  lastModified: Date,
): MetadataRoute.Sitemap {
  const languages = localeLanguages(path);
  return LOCALES.map((locale) => ({
    url: localeUrl(locale, path),
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...STATIC_PATHS.flatMap((r) => entries(r.path, r.changeFrequency, r.priority, now)),
    ...REPORT_PATHS.flatMap((path) => entries(path, "monthly", 0.95, now)),
    ...INSPIRATION_SLUGS.flatMap((slug) =>
      entries(`/inspiration/${slug}`, "monthly", 0.75, now),
    ),
  ];
}
