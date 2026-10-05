"use client";

import { useLocale, useTranslations } from "next-intl";
import TravelReportAppleMap from "@/components/TravelReportAppleMap";
import { localizeMapPois } from "@/lib/travelReports/appleCopy";
import { pickLocaleCopy } from "@/lib/localeCopy";
import { PROVENCE_APPLE_EN } from "@/lib/travelReports/provenceApple.en";
import { PROVENCE_APPLE_ES } from "@/lib/travelReports/provenceApple.es";
import { PROVENCE_MAP_POIS } from "@/lib/travelReports/provenceConfig";

function googleMapsRouteUrl(): string {
  const waypoints = [
    "Gordes, France",
    "Roussillon, France",
    "Lourmarin, France",
    "Aix-en-Provence, France",
    "Valensole, France",
  ].join("|");
  const params = new URLSearchParams({
    api: "1",
    origin: "Avignon, France",
    destination: "Moustiers-Sainte-Marie, France",
    travelmode: "driving",
    waypoints,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default function ProvenceReportMap() {
  const locale = useLocale();
  const tReports = useTranslations("reports");
  const copy = pickLocaleCopy(locale, { en: PROVENCE_APPLE_EN, es: PROVENCE_APPLE_ES });
  const pois = localizeMapPois(PROVENCE_MAP_POIS, copy?.mapPois);
  const list = pois
    .map(
      (poi) =>
        `${poi.kind === "must" ? "Must" : "Nice"}: ${poi.name} (${poi.lat.toFixed(4)}, ${poi.lng.toFixed(4)})`,
    )
    .join("\n");

  return (
    <TravelReportAppleMap
      pois={pois}
      place={tReports("provence.label")}
      googleMapsUrl={googleMapsRouteUrl()}
      poiListText={list}
    />
  );
}
