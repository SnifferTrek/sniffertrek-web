"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RouteStop, RouteLegInfo } from "@/lib/types";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

const MAX_WAYPOINTS = 23;

interface RouteInfo {
  distance: string;
  duration: string;
  stops: number;
  legs: RouteLegInfo[];
}

interface GoogleMapProps {
  stops: RouteStop[];
  travelMode: string;
  optimize?: boolean;
  onRouteCalculated?: (info: RouteInfo) => void;
  onStopsReordered?: (orderedStopIds: string[]) => void;
  onError?: (message: string) => void;
}

let loadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places,geometry`;
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

function routeSegment(
  service: google.maps.DirectionsService,
  origin: string,
  destination: string,
  waypoints: google.maps.DirectionsWaypoint[],
  mode: google.maps.TravelMode,
  optimizeWaypoints: boolean
): Promise<google.maps.DirectionsResult> {
  return new Promise((resolve, reject) => {
    service.route(
      { origin, destination, waypoints, optimizeWaypoints, travelMode: mode },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          resolve(result);
        } else {
          reject(status);
        }
      }
    );
  });
}

export default function GoogleMap({
  stops,
  travelMode,
  optimize = false,
  onRouteCalculated,
  onStopsReordered,
  onError,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const renderers = useRef<google.maps.DirectionsRenderer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  const onRouteCalculatedRef = useRef(onRouteCalculated);
  const onStopsReorderedRef = useRef(onStopsReordered);
  const onErrorRef = useRef(onError);
  onRouteCalculatedRef.current = onRouteCalculated;
  onStopsReorderedRef.current = onStopsReordered;
  onErrorRef.current = onError;

  const clearRenderers = useCallback(() => {
    renderers.current.forEach((r) => r.setMap(null));
    renderers.current = [];
  }, []);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !mapRef.current) return;

    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current || mapInstance.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 47.3769, lng: 8.5417 },
          zoom: 6,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        mapInstance.current = map;
        setLoaded(true);
      })
      .catch((err) => {
        console.error("Google Maps load error:", err);
        setError("Karte konnte nicht geladen werden. Prüfe die Google Maps API-Konfiguration.");
      });
  }, []);

  const calculateRoute = useCallback(async () => {
    if (!loaded || !mapInstance.current) return;

    clearRenderers();

    const filledStops = stops.filter((s) => s.name.trim() !== "");
    const start = filledStops.find((s) => s.type === "start");
    const end = filledStops.find((s) => s.type === "end");

    if (!start || !end) {
      onRouteCalculatedRef.current?.({ distance: "", duration: "", stops: 0, legs: [] });
      return;
    }

    const waypointStops = filledStops.filter((s) => s.type === "stop");

    const modeMap: Record<string, google.maps.TravelMode> = {
      auto: google.maps.TravelMode.DRIVING,
      zug: google.maps.TravelMode.TRANSIT,
      flug: google.maps.TravelMode.DRIVING,
    };
    const mode = modeMap[travelMode] || google.maps.TravelMode.DRIVING;

    setCalculating(true);
    const service = new google.maps.DirectionsService();

    try {
      if (waypointStops.length <= MAX_WAYPOINTS) {
        const waypoints = waypointStops.map((s) => ({
          location: s.name,
          stopover: true,
        }));

        const shouldOptimize = optimize && waypoints.length >= 2;
        const result = await routeSegment(service, start.name, end.name, waypoints, mode, shouldOptimize);

        const renderer = new google.maps.DirectionsRenderer({
          map: mapInstance.current,
          suppressMarkers: false,
          polylineOptions: { strokeColor: "#3b82f6", strokeWeight: 5, strokeOpacity: 0.8 },
        });
        renderer.setDirections(result);
        renderers.current.push(renderer);

        const googleLegs = result.routes[0]?.legs || [];
        const { distance, duration } = sumLegs(googleLegs);
        const legInfos = extractLegInfos(googleLegs);

        onRouteCalculatedRef.current?.({
          distance: formatDistance(distance),
          duration: formatDuration(duration),
          stops: waypointStops.length,
          legs: legInfos,
        });

        if (shouldOptimize && result.routes[0]?.waypoint_order && waypointStops.length >= 2) {
          const order = result.routes[0].waypoint_order;
          onStopsReorderedRef.current?.([
            start.id,
            ...order.map((i: number) => waypointStops[i].id),
            end.id,
          ]);
        }
      } else {
        // Split into segments of MAX_WAYPOINTS
        const allPoints = [start.name, ...waypointStops.map((s) => s.name), end.name];
        const segments: { origin: string; destination: string; waypoints: string[] }[] = [];

        let i = 0;
        while (i < allPoints.length - 1) {
          const segOrigin = allPoints[i];
          const remaining = allPoints.length - 1 - i;

          if (remaining <= MAX_WAYPOINTS + 1) {
            segments.push({
              origin: segOrigin,
              destination: allPoints[allPoints.length - 1],
              waypoints: allPoints.slice(i + 1, allPoints.length - 1),
            });
            break;
          } else {
            const batchEnd = i + MAX_WAYPOINTS + 1;
            segments.push({
              origin: segOrigin,
              destination: allPoints[batchEnd],
              waypoints: allPoints.slice(i + 1, batchEnd),
            });
            i = batchEnd;
          }
        }

        let totalDistance = 0;
        let totalDuration = 0;
        const allLegInfos: RouteLegInfo[] = [];
        const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

        for (let s = 0; s < segments.length; s++) {
          const seg = segments[s];
          const waypoints = seg.waypoints.map((name) => ({ location: name, stopover: true }));

          const result = await routeSegment(service, seg.origin, seg.destination, waypoints, mode, false);

          const renderer = new google.maps.DirectionsRenderer({
            map: mapInstance.current,
            suppressMarkers: s === 0,
            polylineOptions: {
              strokeColor: colors[s % colors.length],
              strokeWeight: 5,
              strokeOpacity: 0.8,
            },
            preserveViewport: s > 0,
          });

          if (s > 0) {
            renderer.setOptions({ suppressMarkers: true });
          }

          renderer.setDirections(result);
          renderers.current.push(renderer);

          const googleLegs = result.routes[0]?.legs || [];
          const legResult = sumLegs(googleLegs);
          totalDistance += legResult.distance;
          totalDuration += legResult.duration;
          allLegInfos.push(...extractLegInfos(googleLegs));
        }

        // Place custom markers for all stops
        if (mapInstance.current) {
          const bounds = new google.maps.LatLngBounds();
          const geocoder = new google.maps.Geocoder();

          const markerPoints = [
            { name: start.name, label: "A", color: "#3b82f6" },
            ...waypointStops.map((s, idx) => ({
              name: s.name,
              label: String(idx + 1),
              color: "#f97316",
            })),
            { name: end.name, label: "B", color: "#ef4444" },
          ];

          for (const pt of markerPoints) {
            try {
              const geoResult = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
                geocoder.geocode({ address: pt.name }, (results, status) => {
                  if (status === "OK" && results) resolve(results);
                  else reject(status);
                });
              });

              const loc = geoResult[0].geometry.location;
              bounds.extend(loc);

              new google.maps.Marker({
                map: mapInstance.current!,
                position: loc,
                label: { text: pt.label, color: "white", fontWeight: "bold", fontSize: "12px" },
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 14,
                  fillColor: pt.color,
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeWeight: 2,
                },
              });
            } catch {
              // Skip if geocoding fails for one stop
            }
          }

          mapInstance.current.fitBounds(bounds);
        }

        onRouteCalculatedRef.current?.({
          distance: formatDistance(totalDistance),
          duration: formatDuration(totalDuration),
          stops: waypointStops.length,
          legs: allLegInfos,
        });
      }

      setError(null);
    } catch (status) {
      const errorMessages: Record<string, string> = {
        NOT_FOUND: "Einer der Orte wurde nicht gefunden. Prüfe die Eingabe.",
        ZERO_RESULTS: "Keine Route zwischen diesen Orten gefunden.",
        OVER_QUERY_LIMIT: "Zu viele Anfragen. Bitte warte einen Moment.",
        REQUEST_DENIED: "Directions API nicht aktiviert. Bitte in Google Cloud Console aktivieren.",
        INVALID_REQUEST: "Ungültige Routenanfrage.",
        MAX_WAYPOINTS_EXCEEDED: "Zu viele Zwischenstopps für eine Anfrage. Route wird segmentiert...",
      };
      const msg = errorMessages[String(status)] || `Routenberechnung fehlgeschlagen (${status})`;
      onErrorRef.current?.(msg);
    } finally {
      setCalculating(false);
    }
  }, [loaded, stops, travelMode, optimize, clearRenderers]);

  useEffect(() => {
    const timer = setTimeout(calculateRoute, 800);
    return () => clearTimeout(timer);
  }, [calculateRoute]);

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-green-50 to-cyan-50 h-[400px] flex items-center justify-center rounded-2xl">
        <p className="text-gray-400 text-sm">
          Google Maps Key nicht konfiguriert
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 h-[400px] flex items-center justify-center rounded-2xl">
        <div className="text-center px-6">
          <p className="text-red-500 text-sm font-medium">{error}</p>
          <p className="text-red-400 text-xs mt-2">
            Stelle sicher, dass Maps JavaScript API, Places API und Directions API
            in der Google Cloud Console aktiviert sind.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="h-[400px] w-full rounded-2xl" />
      {calculating && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-600 font-medium">Route wird berechnet...</span>
        </div>
      )}
    </div>
  );
}

function extractLegInfos(legs: google.maps.DirectionsLeg[]): RouteLegInfo[] {
  return legs.map((leg) => ({
    from: leg.start_address || "",
    to: leg.end_address || "",
    distanceMeters: leg.distance?.value || 0,
    durationSeconds: leg.duration?.value || 0,
  }));
}

function sumLegs(legs: google.maps.DirectionsLeg[]): { distance: number; duration: number } {
  let distance = 0;
  let duration = 0;
  for (const leg of legs) {
    distance += leg.distance?.value || 0;
    duration += leg.duration?.value || 0;
  }
  return { distance, duration };
}

function formatDistance(meters: number): string {
  const km = Math.round(meters / 1000);
  return `${km.toLocaleString("de-CH")} km`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
}

export function useGoogleAutocomplete() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) return;

    loadGoogleMapsScript()
      .then(() => setReady(true))
      .catch(() => {});
  }, []);

  const attachAutocomplete = useCallback(
    (inputElement: HTMLInputElement, onSelect: (place: string) => void) => {
      if (!ready || !inputElement) return;

      if (inputElement.dataset.autocompleteAttached) return;
      inputElement.dataset.autocompleteAttached = "true";

      const autocomplete = new google.maps.places.Autocomplete(inputElement, {
        types: ["(cities)"],
        fields: ["formatted_address", "name", "geometry"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place?.name) {
          onSelect(place.name);
        } else if (place?.formatted_address) {
          onSelect(place.formatted_address);
        }
      });

      return autocomplete;
    },
    [ready]
  );

  return { ready, attachAutocomplete };
}
