"use client";

import { useEffect, useMemo, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Map as LeafletMap } from "leaflet";

export type TravelReportAppleMapPoiKind = "must" | "nice";

export type TravelReportAppleMapPoi = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: TravelReportAppleMapPoiKind;
  tip: string;
  day?: number;
};

const KIND_COLOR: Record<TravelReportAppleMapPoiKind, string> = {
  must: "#0071e3",
  nice: "#86868b",
};

const LEGEND = [
  { kind: "must" as const, color: "#0071e3" },
  { kind: "nice" as const, color: "#86868b" },
];

type Props = {
  pois: readonly TravelReportAppleMapPoi[];
  ariaLabel: string;
};

export default function TravelReportApplePoiLeafletMap({ pois, ariaLabel }: Props) {
  const t = useTranslations("reportUi");
  const locale = useLocale();
  const mustLabel = t("mustSee");
  const niceLabel = t("niceToSee");
  const kindLabel = useMemo(
    () => ({ must: mustLabel, nice: niceLabel }),
    [mustLabel, niceLabel],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || pois.length === 0) return;

    let cancelled = false;
    let map: LeafletMap | null = null;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      map = L.map(container, {
        scrollWheelZoom: false,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      for (const poi of pois) {
        const marker = L.circleMarker([poi.lat, poi.lng], {
          radius: poi.kind === "must" ? 10 : 8,
          fillColor: KIND_COLOR[poi.kind],
          color: "#ffffff",
          weight: 2,
          fillOpacity: poi.kind === "must" ? 0.95 : 0.85,
        }).addTo(map);

        const kindText = poi.kind === "must" ? mustLabel : niceLabel;
        const dayBit = poi.day != null ? ` · ${t("dayN", { day: poi.day })}` : "";
        marker.bindPopup(
          `<div style="font-family:system-ui,sans-serif;font-size:13px;line-height:1.4;max-width:220px">
            <strong style="color:#1d1d1f">${poi.name}</strong>
            <span style="display:block;margin-top:4px;font-size:11px;color:#86868b">${kindText}${dayBit}</span>
            <span style="display:block;margin-top:6px;color:#424245">${poi.tip}</span>
          </div>`,
        );
      }

      const bounds = L.latLngBounds(pois.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });

      if (!cancelled) mapRef.current = map;
      else map.remove();
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      } else if (map) {
        map.remove();
      }
    };
  }, [pois, locale, mustLabel, niceLabel]);

  return (
    <div className="bcn-apple-map">
      <div
        ref={containerRef}
        className="bcn-apple-map__canvas"
        role="img"
        aria-label={ariaLabel}
      />
      <ul className="bcn-apple-map__legend">
        {LEGEND.map((item) => (
          <li key={item.kind}>
            <span
              className="bcn-apple-map__dot"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            {kindLabel[item.kind]}
          </li>
        ))}
      </ul>
    </div>
  );
}
