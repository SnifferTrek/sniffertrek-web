import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import LegacyHomePage from "@/components/LegacyHomePage";
import { routing } from "@/i18n/routing";

const SITE = "https://www.sniffertrek.com";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const path = locale === "de" ? `${SITE}/legacy-home` : `${SITE}/${locale}/legacy-home`;
  return {
    title: `Legacy · ${t("homeTitle")}`,
    description: t("homeDescription"),
    robots: { index: false, follow: false },
    alternates: { canonical: path },
  };
}

export default async function LegacyHomeRoute({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return null;
  }
  setRequestLocale(locale);
  return <LegacyHomePage />;
}
