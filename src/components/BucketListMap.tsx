"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MapHighlightPoi } from "@/components/GoogleMap";

const GOOGLE_MAPS_KEY = "AIzaSyDTcV42T-ZkriZOB8RtNZMtGR8gZq3Izi0";

let loadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

interface BucketListMapProps {
  markers: MapHighlightPoi[];
  onAddAsStop?: (poi: MapHighlightPoi) => void;
  isInRoute?: (name: string) => boolean;
}

export default function BucketListMap({ markers, onAddAsStop, isInRoute }: BucketListMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<google.maps.Marker[]>([]);
  const [loaded, setLoaded] = useState(false);
  const onAddAsStopRef = useRef(onAddAsStop);
  const isInRouteRef = useRef(isInRoute);
  onAddAsStopRef.current = onAddAsStop;
  isInRouteRef.current = isInRoute;

  const clearMarkers = useCallback(() => {
    markerRefs.current.forEach((m) => m.setMap(null));
    markerRefs.current = [];
  }, []);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !mapRef.current) return;
    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current || mapInstance.current) return;
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: { lat: 47.3769, lng: 8.5417 },
          zoom: 4,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });
        setLoaded(true);
      })
      .catch(() => setLoaded(false));
  }, []);

  useEffect(() => {
    if (!loaded || !mapInstance.current) return;
    const map = mapInstance.current;
    clearMarkers();
    if (markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    for (const poi of markers) {
      if (!Number.isFinite(poi.lat) || !Number.isFinite(poi.lng)) continue;
      const pos = { lat: poi.lat, lng: poi.lng };
      const markerId = (poi.id || poi.name).replace(/[^a-zA-Z0-9_-]/g, "_");
      const alreadyInRoute = isInRouteRef.current?.(poi.name) ?? false;
      const marker = new google.maps.Marker({
        map,
        position: pos,
        title: poi.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      const info = new google.maps.InfoWindow({
        content: `<div style="font-family:system-ui;padding:4px 2px;max-width:240px"><div style="font-size:12px;font-weight:600;color:#18181b">${escapeHtml(poi.name)}</div>${
          poi.category
            ? `<div style="font-size:11px;color:#71717a;margin-top:2px">${escapeHtml(String(poi.category))}</div>`
            : ""
        }${
          alreadyInRoute
            ? `<div style="margin-top:8px;font-size:11px;color:#16a34a;font-weight:600">Bereits in Route</div>`
            : `<div style="margin-top:8px"><button id="bucket-tab-add-stop-${markerId}" style="padding:6px 10px;font-size:11px;font-weight:600;color:#fff;background:#0071e3;border:0;border-radius:7px;cursor:pointer">Als Stopp übernehmen</button></div>`
        }</div>`,
      });
      marker.addListener("click", () => {
        info.open(map, marker);
        if (!alreadyInRoute) {
          info.addListener("domready", () => {
            const btn = document.getElementById(`bucket-tab-add-stop-${markerId}`);
            btn?.addEventListener("click", () => {
              onAddAsStopRef.current?.(poi);
              info.close();
            });
          });
        }
      });
      markerRefs.current.push(marker);
      bounds.extend(pos);
    }

    if (markerRefs.current.length > 0) {
      map.fitBounds(bounds, 48);
      google.maps.event.addListenerOnce(map, "idle", () => {
        const zoom = map.getZoom();
        if (zoom != null && zoom > 12) map.setZoom(12);
      });
    }
  }, [loaded, markers, clearMarkers]);

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="h-[280px] flex items-center justify-center rounded-2xl bg-gray-50 text-sm text-gray-400">
        Google Maps Key nicht konfiguriert
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Bucket List auf der Karte ({markers.length})
      </h3>
      {markers.length === 0 ? (
        <p className="text-sm text-gray-400 py-8 text-center">
          Keine POIs für die aktuelle Filterauswahl mit Koordinaten.
        </p>
      ) : (
        <div ref={mapRef} className="h-[280px] w-full rounded-2xl" />
      )}
    </div>
  );
}
