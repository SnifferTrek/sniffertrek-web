"use client";

import { useLocale, useTranslations } from "next-intl";
import TravelReportAppleMap from "@/components/TravelReportAppleMap";
import { localizeMapPois } from "@/lib/travelReports/appleCopy";
import { pickLocaleCopy } from "@/lib/localeCopy";
import { VENICE_APPLE_EN } from "@/lib/travelReports/veniceApple.en";
import { VENICE_APPLE_ES } from "@/lib/travelReports/veniceApple.es";
import { VENICE_MAP_POIS_DETAILED } from "@/lib/travelReports/veniceMapPois";
import {
  buildVeniceGoogleMapsRouteUrl,
  buildVenicePoiListText,
} from "@/lib/travelReports/veniceExtras";

export default function VeniceReportMap() {
  const locale = useLocale();
  const tReports = useTranslations("reports");
  const copy = pickLocaleCopy(locale, { en: VENICE_APPLE_EN, es: VENICE_APPLE_ES });
  return (
    <TravelReportAppleMap
      pois={localizeMapPois(VENICE_MAP_POIS_DETAILED, copy?.mapPois)}
      place={tReports("venedig.label")}
      googleMapsUrl={buildVeniceGoogleMapsRouteUrl()}
      poiListText={buildVenicePoiListText()}
    />
  );
}
