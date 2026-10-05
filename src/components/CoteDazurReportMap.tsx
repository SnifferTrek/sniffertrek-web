"use client";

import { useLocale, useTranslations } from "next-intl";
import TravelReportAppleMap from "@/components/TravelReportAppleMap";
import { localizeMapPois } from "@/lib/travelReports/appleCopy";
import { pickLocaleCopy } from "@/lib/localeCopy";
import { COTE_DAZUR_APPLE_EN } from "@/lib/travelReports/coteDazurApple.en";
import { COTE_DAZUR_APPLE_ES } from "@/lib/travelReports/coteDazurApple.es";
import { COTE_DAZUR_MAP_POIS_DETAILED } from "@/lib/travelReports/coteDazurMapPois";
import { buildCoteDazurGoogleMapsRouteUrl } from "@/lib/travelReports/coteDazurExtras";

function buildCoteDazurPoiListText(): string {
  return COTE_DAZUR_MAP_POIS_DETAILED.map(
    (p) =>
      `${p.kind === "must" ? "Must" : "Nice"}: ${p.name} (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`,
  ).join("\n");
}

export default function CoteDazurReportMap() {
  const locale = useLocale();
  const tReports = useTranslations("reports");
  const copy = pickLocaleCopy(locale, {
    en: COTE_DAZUR_APPLE_EN,
    es: COTE_DAZUR_APPLE_ES,
  });
  const pois = localizeMapPois(COTE_DAZUR_MAP_POIS_DETAILED, copy?.mapPois);
  return (
    <TravelReportAppleMap
      pois={pois}
      place={tReports("cote-dazur.label")}
      googleMapsUrl={buildCoteDazurGoogleMapsRouteUrl()}
      poiListText={buildCoteDazurPoiListText()}
    />
  );
}
