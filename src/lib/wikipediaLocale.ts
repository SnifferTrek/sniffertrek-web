import { asAppLocale } from "@/lib/localeCopy";

/** Wikipedia-Sprachcodes in Prioritätsreihenfolge zur UI-Locale. */
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

export function wikipediaSummaryUrls(title: string, locale?: string, fallback = true): string[] {
  const q = encodeURIComponent(title);
  return wikipediaLangsForLocale(locale, fallback).map(
    (lang) => `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${q}`
  );
}

export function wikipediaIntroExtractUrls(title: string, locale?: string, fallback = true): string[] {
  const q = encodeURIComponent(title);
  return wikipediaLangsForLocale(locale, fallback).map(
    (lang) =>
      `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exintro=1&redirects=1&titles=${q}&format=json&origin=*`
  );
}

export function wikipediaOpenSearchUrls(query: string, locale?: string, fallback = true): string[] {
  const q = encodeURIComponent(query);
  return wikipediaLangsForLocale(locale, fallback).map(
    (lang) =>
      `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${q}&limit=8&namespace=0&format=json&origin=*`
  );
}

export function wikipediaGeosearchUrls(lat: number, lng: number, locale?: string, fallback = true): string[] {
  return wikipediaLangsForLocale(locale, fallback).map(
    (lang) =>
      `https://${lang}.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}%7C${lng}&gsradius=10000&gslimit=1&format=json&origin=*`
  );
}

export function wikipediaArticleUrl(title: string, locale?: string): string {
  const lang = wikipediaLangsForLocale(locale)[0];
  const slug = title.replace(/ /g, "_");
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(slug)}`;
}

export function poiContentLanguageLine(locale?: string): string {
  const loc = asAppLocale(locale || "de");
  if (loc === "es") return "Textos en español";
  if (loc === "en") return "Texts in English";
  return "Texte auf Deutsch";
}
