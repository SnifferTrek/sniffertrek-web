"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MapHighlightPoi } from "@/components/GoogleMap";
import {
  bucketMarkerDomId,
  buildBucketPoiInfoHtml,
  resolvePoiImageUrl,
  wireBucketPoiInfoWindow,
} from "@/lib/bucketMapPoi";

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

interface BucketListMapProps {
  markers: MapHighlightPoi[];
  onAddAsStop?: (poi: MapHighlightPoi) => void;
  onAddToBucketList?: (poi: MapHighlightPoi) => void;
  isInRoute?: (name: string) => boolean;
  isInBucketList?: (name: string) => boolean;
}

export default function BucketListMap({
  markers,
  onAddAsStop,
  onAddToBucketList,
  isInRoute,
  isInBucketList,
}: BucketListMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<google.maps.Marker[]>([]);
  const [loaded, setLoaded] = useState(false);
  const onAddAsStopRef = useRef(onAddAsStop);
  const onAddToBucketListRef = useRef(onAddToBucketList);
  const isInRouteRef = useRef(isInRoute);
  const isInBucketListRef = useRef(isInBucketList);
  onAddAsStopRef.current = onAddAsStop;
  onAddToBucketListRef.current = onAddToBucketList;
  isInRouteRef.current = isInRoute;
  isInBucketListRef.current = isInBucketList;

  const clearMarkers = useCallback(() => {
    markerRefs.current.forEach((m) => m.setMap(null));
    markerRefs.current = [];
  }, []);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !mapRef.current) return;
    let cancelled = false;
    loadGoogleMapsScript()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        if (!mapInstance.current) {
          mapInstance.current = new google.maps.Map(mapRef.current, {
            center: { lat: 47.3769, lng: 8.5417 },
            zoom: 4,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
          });
        }
        setLoaded(true);
        google.maps.event.trigger(mapInstance.current!, "resize");
      })
      .catch(() => setLoaded(false));
    return () => {
      cancelled = true;
    };
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
      const markerId = bucketMarkerDomId(poi, "tab");
      const inMyBucketList =
        poi.inMyBucketList ?? isInBucketListRef.current?.(poi.name) ?? false;
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
      const info = new google.maps.InfoWindow({ maxWidth: 340 });
      marker.addListener("click", () => {
        void (async () => {
          const imageUrl = await resolvePoiImageUrl(poi);
          info.setContent(
            buildBucketPoiInfoHtml(poi, {
              imageUrl,
              inMyBucketList,
              inRoute: alreadyInRoute,
              markerId,
              addBucketPrefix: "bucket-tab-add-list",
              addStopPrefix: "bucket-tab-add-stop",
            })
          );
          info.open(map, marker);
          wireBucketPoiInfoWindow(info, poi, markerId, {
            addBucketPrefix: "bucket-tab-add-list",
            addStopPrefix: "bucket-tab-add-stop",
            inMyBucketList,
            inRoute: alreadyInRoute,
            onAddToBucketList: (p) => onAddToBucketListRef.current?.(p),
            onAddAsStop: (p) => onAddAsStopRef.current?.(p),
          });
        })();
      });
      markerRefs.current.push(marker);
      bounds.extend(pos);
    }

    if (markerRefs.current.length > 0) {
      map.fitBounds(bounds, 48);
      google.maps.event.addListenerOnce(map, "idle", () => {
        const zoom = map.getZoom();
        if (zoom != null && zoom > 8) map.setZoom(8);
      });
    }
  }, [loaded, markers, clearMarkers]);

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="h-[360px] flex items-center justify-center rounded-2xl bg-gray-50 text-sm text-gray-400">
        Google Maps Key nicht konfiguriert
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Bucket List auf der Karte ({markers.length})
      </h3>
      <div ref={mapRef} className="h-[360px] w-full rounded-2xl border border-gray-100 bg-gray-50" />
      {!loaded && (
        <p className="mt-2 text-center text-xs text-gray-400">Karte wird geladen…</p>
      )}
      {loaded && markers.length === 0 && (
        <p className="mt-2 text-center text-xs text-gray-400">
          Keine POIs für die aktuelle Filterauswahl.
        </p>
      )}
    </div>
  );
}
