import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import TravelReportAppleLayout from "@/components/TravelReportAppleLayout";
import GrandesAlpesReportMap from "@/components/GrandesAlpesReportMap";
import { buildTravelReportMetadata } from "@/components/TravelReportPage";
import { applePageOptions } from "@/lib/travelReports/appleCopy";
import { buildTravelReportAppleModel } from "@/lib/travelReports/buildTravelReportAppleModel";
import { getGrandesAlpesTravelReportConfig } from "@/lib/travelReports/grandesAlpesConfig";
import { GRANDES_ALPES_APPLE_EN } from "@/lib/travelReports/grandesAlpesApple.en";
import { GRANDES_ALPES_APPLE_ES } from "@/lib/travelReports/grandesAlpesApple.es";
import { pickLocaleCopy } from "@/lib/localeCopy";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = hasLocale(routing.locales, locale) ? locale : "de";
  return buildTravelReportMetadata(getGrandesAlpesTravelReportConfig(loc), loc);
}

export default async function GrandesAlpesReportPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const config = getGrandesAlpesTravelReportConfig(locale);
  const page = applePageOptions(
    pickLocaleCopy(locale, { en: GRANDES_ALPES_APPLE_EN, es: GRANDES_ALPES_APPLE_ES }),
  );
  const model = buildTravelReportAppleModel(config, {
    displayTitle: page?.displayTitle ?? "Grandes Alpes.",
    heroSubtitle: page?.heroSubtitle ?? [
      "Sieben Nächte. Genf nach Cannes.",
      "Pässe statt Autobahn.",
    ],
    transferSubtitle:
      page?.transferSubtitle ??
      "Start in Genf, dann die Pässe. Autobahn nur als Plan B bei Sperrung.",
    glanceTitle: page?.glanceTitle ?? "Weniger Autobahn. Mehr Pässe.",
    hotelTitle: page?.hotelTitle ?? "Sieben Täler. Sieben Nächte.",
    hotelSearchLabel: page?.hotelSearchLabel ?? "Alle Hotels Route des Grandes Alpes",
    mapTitle: page?.mapTitle,
    mapSubtitle: page?.mapSubtitle,
    inspirationHref: "/inspiration/grandes-alpes",
    bookingClickRef: "grandes-alpes-apple",
    storyIds: [
      "genf-megeve",
      "roseland-valdisere",
      "iseran-galibier",
      "izoard-guillestre",
      "vars-barcelonnette",
      "bonette-vesubie",
      "turini-cannes",
    ],
    map: <GrandesAlpesReportMap />,
  });

  return <TravelReportAppleLayout model={model} />;
}
