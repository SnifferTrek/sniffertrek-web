"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, CircleMarker } from "leaflet";
import type { CoteDazurGolfClub } from "@/lib/travelReports/coteDazurGolfClubs";

type CoteDazurGolfLeafletMapProps = {
  clubs: readonly CoteDazurGolfClub[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function CoteDazurGolfLeafletMap({
  clubs,
  selectedId,
  onSelect,
}: CoteDazurGolfLeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, CircleMarker>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

      const markers = new Map<string, CircleMarker>();
      for (const club of clubs) {
        const marker = L.circleMarker([club.lat, club.lng], {
          radius: 10,
          fillColor: "#0c4a6e",
          color: "#ffffff",
          weight: 2,
          fillOpacity: 0.92,
        }).addTo(map);

        marker.bindTooltip(club.name, { direction: "top", offset: [0, -8] });
        marker.on("click", () => onSelectRef.current(club.id));
        markers.set(club.id, marker);
      }

      markersRef.current = markers;
      const bounds = L.latLngBounds(clubs.map((c) => [c.lat, c.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });

      if (!cancelled) {
        mapRef.current = map;
      } else {
        map.remove();
      }
    })();

    return () => {
      cancelled = true;
      markersRef.current.clear();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      } else if (map) {
        map.remove();
      }
    };
  }, [clubs]);

  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const active = id === selectedId;
      marker.setStyle({
        radius: active ? 13 : 10,
        fillColor: active ? "#0284c7" : "#0c4a6e",
        weight: active ? 3 : 2,
      });
      if (active) marker.bringToFront();
    });
  }, [selectedId]);

  return (
    <div
      ref={containerRef}
      className="h-[min(420px,55vh)] w-full bg-stone-100"
      role="img"
      aria-label="Karte der Golfplätze an der Côte d'Azur"
    />
  );
}
