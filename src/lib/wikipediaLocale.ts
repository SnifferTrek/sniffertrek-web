import { asAppLocale } from "@/lib/localeCopy";

/** MediaWiki-Projekt für Ortsinfo (Wikipedia = Enzyklopädie, Wikivoyage = Reise). */
export type WikiMediaProject = "wikipedia" | "wikivoyage";

export function wikiMediaHost(project: WikiMediaProject, lang: string): string {
  return project === "wikivoyage" ? `${lang}.wikivoyage.org` : `${lang}.wikipedia.org`;
}

/** Wikipedia-/Wikivoyage-Sprachcodes in Prioritätsreihenfolge zur UI-Locale. */
export function wikipediaLangsForLocale(locale?: string, fallback = true): string[] {
  const loc = asAppLocale(locale || "de");
  if (!fallback) {
    if (loc === "es") return ["es"];
    if (loc === "en") return ["en"];
    return ["de"];
  }
  if (loc === "es") return ["es", "en", "de"];
  if (loc === "en") return ["en", "de"];
  return ["de", "en"];
}

export function wikiSummaryUrls(
  title: string,
  locale?: string,
  fallback = true,
  project: WikiMediaProject = "wikipedia",
): string[] {
  const q = encodeURIComponent(title);
  return wikipediaLangsForLocale(locale, fallback).map(
    (lang) => `https://${wikiMediaHost(project, lang)}/api/rest_v1/page/summary/${q}`,
  );
}

export function wikiIntroExtractUrls(
  title: string,
  locale?: string,
  fallback = true,
  project: WikiMediaProject = "wikipedia",
): string[] {
  const q = encodeURIComponent(title);
  return wikipediaLangsForLocale(locale, fallback).map(
    (lang) =>
      `https://${wikiMediaHost(project, lang)}/w/api.php?action=query&prop=extracts&explaintext=1&exintro=1&redirects=1&titles=${q}&format=json&origin=*`,
  );
}

export function wikiOpenSearchUrls(
  query: string,
  locale?: string,
  fallback = true,
  project: WikiMediaProject = "wikipedia",
): string[] {
  const q = encodeURIComponent(query);
  return wikipediaLangsForLocale(locale, fallback).map(
    (lang) =>
      `https://${wikiMediaHost(project, lang)}/w/api.php?action=opensearch&search=${q}&limit=8&namespace=0&format=json&origin=*`,
  );
}

export function wikiGeosearchUrls(
  lat: number,
  lng: number,
  locale?: string,
  fallback = true,
  project: WikiMediaProject = "wikipedia",
): string[] {
  return wikipediaLangsForLocale(locale, fallback).map(
    (lang) =>
      `https://${wikiMediaHost(project, lang)}/w/api.php?action=query&list=geosearch&gscoord=${lat}%7C${lng}&gsradius=10000&gslimit=1&format=json&origin=*`,
  );
}

export function wikiArticleUrl(
  title: string,
  locale?: string,
  project: WikiMediaProject = "wikipedia",
): string {
  const lang = wikipediaLangsForLocale(locale)[0];
  const slug = title.replace(/ /g, "_");
  return `https://${wikiMediaHost(project, lang)}/wiki/${encodeURIComponent(slug)}`;
}

export function wikipediaSummaryUrls(title: string, locale?: string, fallback = true): string[] {
  return wikiSummaryUrls(title, locale, fallback, "wikipedia");
}

export function wikipediaIntroExtractUrls(title: string, locale?: string, fallback = true): string[] {
  return wikiIntroExtractUrls(title, locale, fallback, "wikipedia");
}

export function wikipediaOpenSearchUrls(query: string, locale?: string, fallback = true): string[] {
  return wikiOpenSearchUrls(query, locale, fallback, "wikipedia");
}

export function wikipediaGeosearchUrls(lat: number, lng: number, locale?: string, fallback = true): string[] {
  return wikiGeosearchUrls(lat, lng, locale, fallback, "wikipedia");
}

export function wikipediaArticleUrl(title: string, locale?: string): string {
  return wikiArticleUrl(title, locale, "wikipedia");
}

export function poiContentLanguageLine(locale?: string): string {
  const loc = asAppLocale(locale || "de");
  if (loc === "es") return "Textos en español";
  if (loc === "en") return "Texts in English";
  return "Texte auf Deutsch";
}
