import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import TravelReportAppleLayout from "@/components/TravelReportAppleLayout";
import BarcelonaReportMap from "@/components/BarcelonaReportMap";
import { buildTravelReportMetadata } from "@/components/TravelReportPage";
import { applePageOptions } from "@/lib/travelReports/appleCopy";
import { buildTravelReportAppleModel } from "@/lib/travelReports/buildTravelReportAppleModel";
import { getBarcelonaTravelReportConfig } from "@/lib/travelReports/barcelonaConfig";
import { BARCELONA_APPLE_EN } from "@/lib/travelReports/barcelonaApple.en";
import { BARCELONA_APPLE_ES } from "@/lib/travelReports/barcelonaApple.es";
import { pickLocaleCopy } from "@/lib/localeCopy";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = hasLocale(routing.locales, locale) ? locale : "de";
  return buildTravelReportMetadata(getBarcelonaTravelReportConfig(loc), loc);
}

export default async function BarcelonaReportPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const config = getBarcelonaTravelReportConfig(locale);
  const page = applePageOptions(
    pickLocaleCopy(locale, { en: BARCELONA_APPLE_EN, es: BARCELONA_APPLE_ES }),
  );
  const model = buildTravelReportAppleModel(config, {
    displayTitle: page?.displayTitle ?? "Barcelona.",
    heroSubtitle: page?.heroSubtitle ?? [
      "Vier Tage. Flug rein. Metro & zu Fuss.",
      "Gaudí, Gassen, Meer.",
    ],
    transferSubtitle:
      page?.transferSubtitle ??
      "Ohne Mietauto: Metro, Aerobús – oder Taxi, Uber und Cabify bei viel Gepäck.",
    glanceTitle: page?.glanceTitle ?? "Weniger Hetze. Mehr Stadt.",
    hotelTitle: page?.hotelTitle ?? "Eine Basis. Vier Tage.",
    hotelSearchLabel: page?.hotelSearchLabel ?? "Alle Hotels Barcelona",
    mapTitle: page?.mapTitle,
    mapSubtitle: page?.mapSubtitle,
    inspirationHref: "/inspiration/barcelona",
    bookingClickRef: "barcelona-apple",
    storyIds: [
      "ankunft",
      "sagrada",
      "modernisme",
      "park-guell",
      "montjuic",
      "strand",
      "essen",
    ],
    map: <BarcelonaReportMap />,
  });

  return <TravelReportAppleLayout model={model} />;
}
