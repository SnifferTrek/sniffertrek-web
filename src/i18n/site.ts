export const SITE = "https://www.sniffertrek.com";

function pathSuffix(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? "" : normalized;
}

export function localeUrl(locale: string, path: string): string {
  const suffix = pathSuffix(path);
  return locale === "de" ? `${SITE}${suffix}` : `${SITE}/${locale}${suffix}`;
}

export function localeLanguages(path: string) {
  return {
    de: localeUrl("de", path),
    en: localeUrl("en", path),
    es: localeUrl("es", path),
    "x-default": localeUrl("de", path),
  };
}
