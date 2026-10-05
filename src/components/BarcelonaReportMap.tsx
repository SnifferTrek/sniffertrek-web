"use client";

import { useLocale, useTranslations } from "next-intl";
import TravelReportAppleMap from "@/components/TravelReportAppleMap";
import { localizeMapPois } from "@/lib/travelReports/appleCopy";
import { pickLocaleCopy } from "@/lib/localeCopy";
import { BARCELONA_APPLE_EN } from "@/lib/travelReports/barcelonaApple.en";
import { BARCELONA_APPLE_ES } from "@/lib/travelReports/barcelonaApple.es";
import { BARCELONA_MAP_POIS_DETAILED } from "@/lib/travelReports/barcelonaMapPois";
import {
  buildBarcelonaGoogleMapsRouteUrl,
  buildBarcelonaPoiListText,
} from "@/lib/travelReports/barcelonaExtras";

export default function BarcelonaReportMap() {
  const locale = useLocale();
  const tReports = useTranslations("reports");
  const copy = pickLocaleCopy(locale, { en: BARCELONA_APPLE_EN, es: BARCELONA_APPLE_ES });
  return (
    <TravelReportAppleMap
      pois={localizeMapPois(BARCELONA_MAP_POIS_DETAILED, copy?.mapPois)}
      place={tReports("barcelona.label")}
      googleMapsUrl={buildBarcelonaGoogleMapsRouteUrl()}
      poiListText={buildBarcelonaPoiListText()}
    />
  );
}
