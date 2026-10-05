"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { TravelReportAppleMapPoi } from "@/components/TravelReportApplePoiLeafletMap";

function MapLoading() {
  const t = useTranslations("reportUi");
  return <div className="bcn-apple-map__loading">{t("mapLoading")}</div>;
}

const TravelReportApplePoiLeafletMap = dynamic(
  () => import("@/components/TravelReportApplePoiLeafletMap"),
  {
    ssr: false,
    loading: () => <MapLoading />,
  },
);

type Props = {
  pois: readonly TravelReportAppleMapPoi[];
  place: string;
  googleMapsUrl: string;
  poiListText: string;
};

export default function TravelReportAppleMap({
  pois,
  place,
  googleMapsUrl,
  poiListText,
}: Props) {
  const t = useTranslations("reportUi");
  const mustSees = pois.filter((p) => p.kind === "must");
  const niceSees = pois.filter((p) => p.kind === "nice");

  return (
    <div className="bcn-apple-map-block">
      <div className="bcn-apple-map__frame">
        <TravelReportApplePoiLeafletMap
          pois={pois}
          ariaLabel={t("mapAria", { place })}
        />
      </div>

      <div className="bcn-apple-map-lists">
        <div>
          <h3 className="bcn-apple-map-lists__h">{t("mustSees")}</h3>
          <ul className="bcn-apple-map-chips">
            {mustSees.map((poi) => (
              <li key={poi.id}>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${poi.lat}&mlon=${poi.lng}#map=16/${poi.lat}/${poi.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bcn-apple-map-chip bcn-apple-map-chip--must"
                >
                  {poi.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="bcn-apple-map-lists__h">{t("niceSees")}</h3>
          <ul className="bcn-apple-map-chips">
            {niceSees.map((poi) => (
              <li key={poi.id}>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${poi.lat}&mlon=${poi.lng}#map=16/${poi.lat}/${poi.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bcn-apple-map-chip bcn-apple-map-chip--nice"
                >
                  {poi.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bcn-apple-map-actions">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bcn-apple-link"
        >
          {t("openGoogleMaps")}
        </a>
        <button
          type="button"
          className="bcn-apple-link"
          onClick={() => {
            void navigator.clipboard?.writeText(poiListText);
          }}
        >
          {t("copyPoiList")}
        </button>
      </div>
    </div>
  );
}
