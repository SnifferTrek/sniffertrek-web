import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en", "es"],
  defaultLocale: "de",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
