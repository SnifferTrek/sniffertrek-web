"use client";

import { useLocale, useTranslations } from "next-intl";
import { routing, type AppLocale } from "@/i18n/routing";
import { getPathname, usePathname } from "@/i18n/navigation";

const LABELS: Record<AppLocale, string> = {
  de: "DE",
  en: "EN",
  es: "ES",
};

export default function LanguageSwitcher({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("chrome");

  const switchLocale = (loc: AppLocale) => {
    if (loc === locale) return;
    const path = getPathname({ locale: loc, href: pathname });
    const search = typeof window !== "undefined" ? window.location.search : "";
    window.location.assign(`${path}${search}`);
  };

  return (
    <div
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold tracking-wide ${className}`}
      role="navigation"
      aria-label={t("language")}
    >
      {routing.locales.map((loc, i) => {
        const active = loc === locale;
        return (
          <span key={loc} className="inline-flex items-center">
            {i > 0 ? (
              <span className={compact ? "px-0.5 opacity-30" : "px-1 opacity-30"} aria-hidden>
                ·
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => switchLocale(loc)}
              className={`rounded-sm px-0.5 transition-colors ${
                active
                  ? "text-[var(--bcn-blue,#0071e3)]"
                  : "text-[var(--bcn-muted,#86868b)] hover:text-[var(--bcn-black,#1d1d1f)]"
              }`}
              aria-current={active ? "true" : undefined}
              lang={loc}
            >
              {LABELS[loc]}
            </button>
          </span>
        );
      })}
    </div>
  );
}
