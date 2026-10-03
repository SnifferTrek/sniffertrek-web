import type { routing } from "./routing";
import type de from "../../messages/de.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof de;
  }
}
