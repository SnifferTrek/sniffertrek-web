import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import TravelReportAppleLayout from "@/components/TravelReportAppleLayout";
import VeniceReportMap from "@/components/VeniceReportMap";
import { buildTravelReportMetadata } from "@/components/TravelReportPage";
import { applePageOptions } from "@/lib/travelReports/appleCopy";
import { buildTravelReportAppleModel } from "@/lib/travelReports/buildTravelReportAppleModel";
import { getVeniceTravelReportConfig } from "@/lib/travelReports/veniceConfig";
import { VENICE_APPLE_EN } from "@/lib/travelReports/veniceApple.en";
import { VENICE_APPLE_ES } from "@/lib/travelReports/veniceApple.es";
import { pickLocaleCopy } from "@/lib/localeCopy";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const loc = hasLocale(routing.locales, locale) ? locale : "de";
  return buildTravelReportMetadata(getVeniceTravelReportConfig(loc), loc);
}

export default async function VeniceReportPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const config = getVeniceTravelReportConfig(locale);
  const page = applePageOptions(
    pickLocaleCopy(locale, { en: VENICE_APPLE_EN, es: VENICE_APPLE_ES }),
  );
  const model = buildTravelReportAppleModel(config, {
    displayTitle: page?.displayTitle ?? "Venedig.",
    heroSubtitle: page?.heroSubtitle ?? [
      "Drei Tage. Lagune. Zu Fuss & Vaporetto.",
      "Ruhige Gassen statt nur San Marco.",
    ],
    transferSubtitle:
      page?.transferSubtitle ??
      "Vom Flughafen Marco Polo mit Bus, Boot oder Wassertaxi nach Piazzale Roma.",
    glanceTitle: page?.glanceTitle ?? "Weniger Hetze. Mehr Lagune.",
    hotelTitle: page?.hotelTitle ?? "Eine Basis. Drei Tage.",
    hotelSearchLabel: page?.hotelSearchLabel ?? "Alle Hotels Venedig",
    mapTitle: page?.mapTitle,
    mapSubtitle: page?.mapSubtitle,
    inspirationHref: "/inspiration/venedig",
    bookingClickRef: "venice-apple",
    storyIds: [
      "ankunft",
      "morgen",
      "dogenpalast",
      "vaporetto",
      "zwischenstop",
      "inseln",
      "essen",
    ],
    map: <VeniceReportMap />,
  });

  return <TravelReportAppleLayout model={model} />;
}
