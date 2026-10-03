import { hasLocale } from "next-intl";
import { routing, type AppLocale } from "@/i18n/routing";

export type { AppLocale };

export function asAppLocale(locale: string): AppLocale {
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
}

export function pickLocaleCopy<T>(locale: string, copies: { en: T; es: T }): T | null {
  const loc = asAppLocale(locale);
  if (loc === "en") return copies.en;
  if (loc === "es") return copies.es;
  return null;
}
