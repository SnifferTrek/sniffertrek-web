import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import TravelReportAppleLayout from "@/components/TravelReportAppleLayout";
import CoteDazurReportMap from "@/components/CoteDazurReportMap";
import { buildTravelReportMetadata } from "@/components/TravelReportPage";
import { applePageOptions } from "@/lib/travelReports/appleCopy";
import { buildTravelReportAppleModel } from "@/lib/travelReports/buildTravelReportAppleModel";
import { getCoteDazurTravelReportConfig } from "@/lib/travelReports/coteDazurConfig";
import { COTE_DAZUR_APPLE_EN } from "@/lib/travelReports/coteDazurApple.en";
import { COTE_DAZUR_APPLE_ES } from "@/lib/travelReports/coteDazurApple.es";
import { pickLocaleCopy } from "@/lib/localeCopy";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = hasLocale(routing.locales, locale) ? locale : "de";
  return buildTravelReportMetadata(getCoteDazurTravelReportConfig(loc), loc);
}

export default async function CoteDazurReportPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const config = getCoteDazurTravelReportConfig(locale);
  const page = applePageOptions(
    pickLocaleCopy(locale, { en: COTE_DAZUR_APPLE_EN, es: COTE_DAZUR_APPLE_ES }),
  );
  const model = buildTravelReportAppleModel(config, {
    displayTitle: page?.displayTitle ?? "Côte d'Azur.",
    heroSubtitle: page?.heroSubtitle ?? [
      "Fünf Tage. Küste statt Autobahn.",
      "Picasso, Corniche, Saint-Tropez.",
    ],
    transferSubtitle:
      page?.transferSubtitle ??
      "Anreise mit Auto aus Italien oder Flug Nizza plus Mietwagen – vor Ort die Corniche.",
    glanceTitle: page?.glanceTitle ?? "Weniger Autobahn. Mehr Meer.",
    hotelTitle: page?.hotelTitle ?? "Stützpunkte. Fünf Tage.",
    hotelSearchLabel: page?.hotelSearchLabel ?? "Alle Hotels Côte d'Azur",
    mapTitle: page?.mapTitle,
    mapSubtitle: page?.mapSubtitle,
    inspirationHref: "/inspiration/cote-dazur",
    bookingClickRef: "cote-dazur-apple",
    storyIds: [
      "ankunft",
      "keller-antibes",
      "mougins-cannes",
      "saint-tropez",
      "grimaud-ramatuelle",
      "essen",
    ],
    map: <CoteDazurReportMap />,
  });

  return <TravelReportAppleLayout model={model} />;
}
