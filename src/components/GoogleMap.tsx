"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RouteStop, RouteLegInfo } from "@/lib/types";

const GOOGLE_MAPS_KEY = "AIzaSyDTcV42T-ZkriZOB8RtNZMtGR8gZq3Izi0";

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
  onMapClick?: (placeName: string, lat: number, lng: number, insertAtIndex?: number) => void;
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
  origin: string | google.maps.LatLng,
  destination: string | google.maps.LatLng,
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
  onMapClick,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const renderers = useRef<google.maps.DirectionsRenderer[]>([]);
  const markers = useRef<google.maps.Marker[]>([]);
  const legEndpoints = useRef<{ start: google.maps.LatLng; end: google.maps.LatLng; afterStopIndex: number }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [addMode, setAddMode] = useState(false);

  const onRouteCalculatedRef = useRef(onRouteCalculated);
  const onStopsReorderedRef = useRef(onStopsReordered);
  const onErrorRef = useRef(onError);
  const onMapClickRef = useRef(onMapClick);
  const addModeRef = useRef(addMode);
  onRouteCalculatedRef.current = onRouteCalculated;
  onStopsReorderedRef.current = onStopsReordered;
  onErrorRef.current = onError;
  onMapClickRef.current = onMapClick;
  addModeRef.current = addMode;

  const clearRenderers = useCallback(() => {
    renderers.current.forEach((r) => r.setMap(null));
    renderers.current = [];
    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];
    legEndpoints.current = [];
  }, []);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !mapRef.current) return;

    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current || mapInstance.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 47.3769, lng: 8.5417 },
          zoom: 6,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT,
            mapTypeIds: ["roadmap", "satellite", "hybrid"],
          },
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!addModeRef.current || !e.latLng || !onMapClickRef.current) return;
          const clickLat = e.latLng.lat();
          const clickLng = e.latLng.lng();
          const clickPt = e.latLng;

          let bestInsertIdx: number | undefined;
          if (legEndpoints.current.length > 0) {
            let minDist = Infinity;
            for (const leg of legEndpoints.current) {
              const d = distToSegment(clickPt, leg.start, leg.end);
              if (d < minDist) {
                minDist = d;
                bestInsertIdx = leg.afterStopIndex + 1;
              }
            }
          }

          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: e.latLng }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              const locality = results[0].address_components?.find((c) =>
                c.types.includes("locality")
              )?.long_name;
              const subloc = results[0].address_components?.find((c) =>
                c.types.includes("sublocality") || c.types.includes("neighborhood")
              )?.long_name;
              const name = locality
                ? (subloc ? `${subloc}, ${locality}` : locality)
                : results[0].formatted_address;
              onMapClickRef.current?.(name, clickLat, clickLng, bestInsertIdx);
              setAddMode(false);
            }
          });
        });

        mapInstance.current = map;
        setLoaded(true);
      })
      .catch((err) => {
        console.error("Google Maps load error:", err);
        setError("Karte konnte nicht geladen werden. Prüfe die Google Maps API-Konfiguration.");
      });
  }, []);

  const stopLocation = useCallback((s: RouteStop): string | google.maps.LatLng => {
    if (s.lat != null && s.lng != null) return new google.maps.LatLng(s.lat, s.lng);
    return s.name;
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
          location: stopLocation(s),
          stopover: true,
        }));

        const shouldOptimize = optimize && waypoints.length >= 2;
        const result = await routeSegment(service, stopLocation(start), stopLocation(end), waypoints, mode, shouldOptimize);

        const renderer = new google.maps.DirectionsRenderer({
          map: mapInstance.current,
          suppressMarkers: true,
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

        // Place custom colored markers
        if (mapInstance.current && result.routes[0]?.legs) {
          const legs = result.routes[0].legs;
          const points: { pos: google.maps.LatLng; label: string; color: string }[] = [];

          if (legs[0]?.start_location) {
            points.push({ pos: legs[0].start_location, label: "A", color: "#3b82f6" });
          }
          waypointStops.forEach((ws, idx) => {
            const leg = legs[idx];
            if (leg?.end_location) {
              points.push({
                pos: leg.end_location,
                label: String(idx + 1),
                color: ws.isHotel && ws.bookingConfirmation ? "#22c55e" : ws.isHotel ? "#a855f7" : "#f97316",
              });
            }
          });
          if (legs[legs.length - 1]?.end_location) {
            points.push({ pos: legs[legs.length - 1].end_location, label: "B", color: "#ef4444" });
          }

          for (const pt of points) {
            const marker = new google.maps.Marker({
              map: mapInstance.current!,
              position: pt.pos,
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
            markers.current.push(marker);
          }

          const orderedStops = [start, ...waypointStops, end];
          for (let li = 0; li < legs.length; li++) {
            if (legs[li]?.start_location && legs[li]?.end_location) {
              const stopObj = orderedStops[li];
              const idx = stops.indexOf(stopObj);
              legEndpoints.current.push({
                start: legs[li].start_location,
                end: legs[li].end_location,
                afterStopIndex: idx >= 0 ? idx : li,
              });
            }
          }
        }
      } else {
        // Split into segments of MAX_WAYPOINTS
        type Loc = string | google.maps.LatLng;
        const allStops = [start, ...waypointStops, end];
        const allLocs: Loc[] = allStops.map((s) => stopLocation(s));
        const segments: { origin: Loc; destination: Loc; waypoints: Loc[] }[] = [];

        let i = 0;
        while (i < allLocs.length - 1) {
          const segOrigin = allLocs[i];
          const remaining = allLocs.length - 1 - i;

          if (remaining <= MAX_WAYPOINTS + 1) {
            segments.push({
              origin: segOrigin,
              destination: allLocs[allLocs.length - 1],
              waypoints: allLocs.slice(i + 1, allLocs.length - 1),
            });
            break;
          } else {
            const batchEnd = i + MAX_WAYPOINTS + 1;
            segments.push({
              origin: segOrigin,
              destination: allLocs[batchEnd],
              waypoints: allLocs.slice(i + 1, batchEnd),
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
          const waypoints = seg.waypoints.map((loc) => ({ location: loc, stopover: true }));

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
              color: s.isHotel && s.bookingConfirmation ? "#22c55e" : s.isHotel ? "#a855f7" : "#f97316",
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

              const marker = new google.maps.Marker({
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
              markers.current.push(marker);
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
  }, [loaded, stops, travelMode, optimize, clearRenderers, stopLocation]);

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
      {onMapClick && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={() => setAddMode((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              addMode
                ? "bg-orange-500 text-white shadow-lg ring-2 ring-orange-300"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            {addMode ? "Abbrechen" : "+ Stopp auf Karte"}
          </button>
        </div>
      )}
      <div
        ref={mapRef}
        className={`h-[400px] w-full rounded-2xl ${addMode ? "ring-2 ring-orange-400" : ""}`}
        style={addMode ? { cursor: "crosshair" } : undefined}
      />
      {calculating && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-600 font-medium">Route wird berechnet...</span>
        </div>
      )}
      {addMode && (
        <div className="mt-2 text-center">
          <span className="text-xs text-orange-600 font-medium">Klicke auf die Karte um einen Zwischenstopp hinzuzufügen</span>
        </div>
      )}
    </div>
  );
}

function distToSegment(p: google.maps.LatLng, a: google.maps.LatLng, b: google.maps.LatLng): number {
  const compute = google.maps.geometry.spherical.computeDistanceBetween;
  const ab = compute(a, b);
  if (ab < 1) return compute(p, a);
  const ap = compute(a, p);
  const bp = compute(b, p);
  const s = (ap + bp + ab) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - ap) * (s - bp) * (s - ab)));
  const dist = (2 * area) / ab;
  if (ap * ap > bp * bp + ab * ab) return bp;
  if (bp * bp > ap * ap + ab * ab) return ap;
  return dist;
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
        types: ["geocode"],
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
