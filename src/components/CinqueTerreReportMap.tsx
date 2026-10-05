"use client";

import { useLocale, useTranslations } from "next-intl";
import TravelReportAppleMap from "@/components/TravelReportAppleMap";
import { localizeMapPois } from "@/lib/travelReports/appleCopy";
import { pickLocaleCopy } from "@/lib/localeCopy";
import { CINQUE_TERRE_APPLE_EN } from "@/lib/travelReports/cinqueTerreApple.en";
import { CINQUE_TERRE_APPLE_ES } from "@/lib/travelReports/cinqueTerreApple.es";
import { CINQUE_TERRE_MAP_POIS_DETAILED } from "@/lib/travelReports/cinqueTerreMapPois";
import { buildCinqueTerreGoogleMapsRouteUrl } from "@/lib/travelReports/cinqueTerreExtras";

function buildCinqueTerrePoiListText(): string {
  return CINQUE_TERRE_MAP_POIS_DETAILED.map(
    (p) =>
      `${p.kind === "must" ? "Must" : "Nice"}: ${p.name} (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`,
  ).join("\n");
}

export default function CinqueTerreReportMap() {
  const locale = useLocale();
  const tReports = useTranslations("reports");
  const copy = pickLocaleCopy(locale, {
    en: CINQUE_TERRE_APPLE_EN,
    es: CINQUE_TERRE_APPLE_ES,
  });
  const pois = localizeMapPois(CINQUE_TERRE_MAP_POIS_DETAILED, copy?.mapPois);
  return (
    <TravelReportAppleMap
      pois={pois}
      place={tReports("cinque-terre.label")}
      googleMapsUrl={buildCinqueTerreGoogleMapsRouteUrl()}
      poiListText={buildCinqueTerrePoiListText()}
    />
  );
}
