import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import V2HomePage from "@/components/v2/V2HomePage";
import { routing } from "@/i18n/routing";

const SITE = "https://www.sniffertrek.com";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const path = locale === "de" ? SITE : `${SITE}/${locale}`;
  const ogLocale = locale === "de" ? "de_CH" : locale === "es" ? "es_ES" : "en_US";
  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    openGraph: {
      title: t("homeTitle"),
      description: t("homeOgDescription"),
      url: path,
      locale: ogLocale,
      images: [
        {
          url: "/couple/anna-thomas-candid-v4.jpg",
          width: 1200,
          height: 800,
          alt: t("ogImageAlt"),
        },
      ],
    },
    alternates: {
      canonical: path,
      languages: {
        de: SITE,
        en: `${SITE}/en`,
        es: `${SITE}/es`,
        "x-default": SITE,
      },
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return null;
  }
  setRequestLocale(locale);
  return <V2HomePage homeHref="/" hero="immersive" />;
}
