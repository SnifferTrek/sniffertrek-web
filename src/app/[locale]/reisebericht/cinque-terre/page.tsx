import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import TravelReportAppleLayout from "@/components/TravelReportAppleLayout";
import CinqueTerreReportMap from "@/components/CinqueTerreReportMap";
import { buildTravelReportMetadata } from "@/components/TravelReportPage";
import { applePageOptions } from "@/lib/travelReports/appleCopy";
import { buildTravelReportAppleModel } from "@/lib/travelReports/buildTravelReportAppleModel";
import { getCinqueTerreTravelReportConfig } from "@/lib/travelReports/cinqueTerreConfig";
import { CINQUE_TERRE_APPLE_EN } from "@/lib/travelReports/cinqueTerreApple.en";
import { CINQUE_TERRE_APPLE_ES } from "@/lib/travelReports/cinqueTerreApple.es";
import { pickLocaleCopy } from "@/lib/localeCopy";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = hasLocale(routing.locales, locale) ? locale : "de";
  return buildTravelReportMetadata(getCinqueTerreTravelReportConfig(loc), loc);
}

export default async function CinqueTerreReportPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const config = getCinqueTerreTravelReportConfig(locale);
  const page = applePageOptions(
    pickLocaleCopy(locale, { en: CINQUE_TERRE_APPLE_EN, es: CINQUE_TERRE_APPLE_ES }),
  );
  const model = buildTravelReportAppleModel(config, {
    displayTitle: page?.displayTitle ?? "Cinque Terre.",
    heroSubtitle: page?.heroSubtitle ?? [
      "Vier Tage. Porto Venere als Basis.",
      "Zug, Wege, Meer.",
    ],
    transferSubtitle:
      page?.transferSubtitle ??
      "Pisa oder Genua nach La Spezia, dann Bus oder Taxi nach Porto Venere.",
    glanceTitle: page?.glanceTitle ?? "Weniger Hetze. Mehr Küste.",
    hotelTitle: page?.hotelTitle ?? "Eine Basis. Vier Tage.",
    hotelSearchLabel: page?.hotelSearchLabel ?? "Alle Hotels Porto Venere",
    mapTitle: page?.mapTitle,
    mapSubtitle: page?.mapSubtitle,
    inspirationHref: "/inspiration/cinque-terre",
    bookingClickRef: "cinque-terre-apple",
    storyIds: [
      "ankunft",
      "cinque-terre-zug",
      "via-amore",
      "wanderung",
      "boot",
      "essen",
    ],
    map: <CinqueTerreReportMap />,
  });

  return <TravelReportAppleLayout model={model} />;
}
