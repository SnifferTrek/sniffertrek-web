import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import ProvenceReportMap from "@/components/ProvenceReportMap";
import TravelReportAppleLayout from "@/components/TravelReportAppleLayout";
import TravelReportPrintDocumentAtlas from "@/components/TravelReportPrintDocumentAtlas";
import { buildTravelReportMetadata } from "@/components/TravelReportPage";
import { applePageOptions } from "@/lib/travelReports/appleCopy";
import { buildTravelReportAppleModel } from "@/lib/travelReports/buildTravelReportAppleModel";
import { getProvenceTravelReportConfig } from "@/lib/travelReports/provenceConfig";
import { PROVENCE_APPLE_EN } from "@/lib/travelReports/provenceApple.en";
import { PROVENCE_APPLE_ES } from "@/lib/travelReports/provenceApple.es";
import { pickLocaleCopy } from "@/lib/localeCopy";
import { routing } from "@/i18n/routing";
import { localeUrl } from "@/i18n/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = hasLocale(routing.locales, locale) ? locale : "de";
  return buildTravelReportMetadata(getProvenceTravelReportConfig(loc), loc);
}

export default async function ProvenceReportPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const config = getProvenceTravelReportConfig(locale);
  const page = applePageOptions(
    pickLocaleCopy(locale, { en: PROVENCE_APPLE_EN, es: PROVENCE_APPLE_ES }),
  );
  const pageUrl = localeUrl(locale, config.path);
  const homeLabel =
    locale === "en" ? "Home" : locale === "es" ? "Inicio" : "Startseite";
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: config.meta.title,
      description: config.meta.description,
      image: config.hero.photo,
      datePublished: config.meta.datePublished,
      dateModified: config.meta.dateModified,
      author: {
        "@type": "Organization",
        name: "SnifferTrek",
        url: "https://www.sniffertrek.com",
      },
      publisher: {
        "@type": "Organization",
        name: "SnifferTrek",
        url: "https://www.sniffertrek.com",
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
      about: config.jsonLdAbout,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: config.faq.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: homeLabel,
          item: localeUrl(locale, "/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: config.breadcrumbLabel,
          item: pageUrl,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: config.mustSees.itemListName,
      itemListElement: config.mustSees.items.map((name, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name,
      })),
    },
  ];
  const model = buildTravelReportAppleModel(config, {
    displayTitle: page?.displayTitle ?? "Provence.",
    heroSubtitle: page?.heroSubtitle ?? [
      "Sechs Tage. Vier Basen.",
      "Avignon, Ocker, Aix und Verdon.",
    ],
    transferSubtitle:
      page?.transferSubtitle ??
      "Mit Auto durch den Luberon – Anreise per TGV Avignon oder Flug Marseille möglich.",
    glanceTitle: page?.glanceTitle ?? "Weniger Dörfer. Mehr Provence.",
    hotelTitle: page?.hotelTitle ?? "Vier Basen. Fünf Nächte.",
    hotelSearchLabel: page?.hotelSearchLabel ?? "Hotels in der Provence",
    inspirationHref: "/inspiration/provence",
    bookingClickRef: "provence-apple",
    storyIds: [
      "avignon",
      "luberon",
      "ocker",
      "aix",
      "ruhige-doerfer",
      "markt-genuss",
      "verdon",
    ],
    map: <ProvenceReportMap />,
    mapTitle: page?.mapTitle ?? "Route & Orte",
    mapSubtitle:
      page?.mapSubtitle ??
      "Blau = Kernroute. Grau = saisonal oder optional. Marker antippen für Hinweise.",
  });

  return (
    <>
      {structuredData.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
      <TravelReportPrintDocumentAtlas
        config={config}
        className="hidden print:block"
        data-print-active="1"
        locale={locale}
      />
      <TravelReportAppleLayout model={model} />
    </>
  );
}
