"use client";

import { useLocale, useTranslations } from "next-intl";
import TravelReportAppleMap from "@/components/TravelReportAppleMap";
import { localizeMapPois } from "@/lib/travelReports/appleCopy";
import { pickLocaleCopy } from "@/lib/localeCopy";
import { GRANDES_ALPES_APPLE_EN } from "@/lib/travelReports/grandesAlpesApple.en";
import { GRANDES_ALPES_APPLE_ES } from "@/lib/travelReports/grandesAlpesApple.es";
import { GRANDES_ALPES_MAP_POIS_DETAILED } from "@/lib/travelReports/grandesAlpesMapPois";
import { buildGrandesAlpesGoogleMapsRouteUrl } from "@/lib/travelReports/grandesAlpesExtras";

function buildGrandesAlpesPoiListText(): string {
  return GRANDES_ALPES_MAP_POIS_DETAILED.map(
    (p) =>
      `${p.kind === "must" ? "Must" : "Nice"}: ${p.name} (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`,
  ).join("\n");
}

export default function GrandesAlpesReportMap() {
  const locale = useLocale();
  const tReports = useTranslations("reports");
  const copy = pickLocaleCopy(locale, {
    en: GRANDES_ALPES_APPLE_EN,
    es: GRANDES_ALPES_APPLE_ES,
  });
  const pois = localizeMapPois(GRANDES_ALPES_MAP_POIS_DETAILED, copy?.mapPois);
  return (
    <TravelReportAppleMap
      pois={pois}
      place={tReports("grandes-alpes.label")}
      googleMapsUrl={buildGrandesAlpesGoogleMapsRouteUrl()}
      poiListText={buildGrandesAlpesPoiListText()}
    />
  );
}
