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
  onRemoveStop?: (stopId: string) => void;
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
  onRemoveStop,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const renderers = useRef<google.maps.DirectionsRenderer[]>([]);
  const markers = useRef<google.maps.Marker[]>([]);
  const legEndpoints = useRef<{ start: google.maps.LatLng; end: google.maps.LatLng; afterStopIndex: number }[]>([]);
  const segmentCache = useRef<Map<string, { result: google.maps.DirectionsResult; legs: RouteLegInfo[]; distance: number; duration: number }>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [routeStatus, setRouteStatus] = useState<string | null>(null);

  const onRouteCalculatedRef = useRef(onRouteCalculated);
  const onStopsReorderedRef = useRef(onStopsReordered);
  const onErrorRef = useRef(onError);
  const onMapClickRef = useRef(onMapClick);
  const onRemoveStopRef = useRef(onRemoveStop);
  const addModeRef = useRef(addMode);
  onRouteCalculatedRef.current = onRouteCalculated;
  onStopsReorderedRef.current = onStopsReordered;
  onErrorRef.current = onError;
  onMapClickRef.current = onMapClick;
  onRemoveStopRef.current = onRemoveStop;
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
    if (s.bookingAddress) return s.bookingAddress;
    return s.name;
  }, []);

  const segmentKey = useCallback((segStops: RouteStop[], tMode: string): string => {
    return tMode + ":" + segStops.map((s) => {
      if (s.lat != null && s.lng != null) return `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`;
      if (s.bookingAddress) return s.bookingAddress;
      return s.name;
    }).join("|");
  }, []);

  const calculateRoute = useCallback(async () => {
    if (!loaded || !mapInstance.current) {
      console.log("[Route] Waiting: loaded=", loaded, "map=", !!mapInstance.current);
      return;
    }

    clearRenderers();
    setRouteStatus(null);

    const filledStops = stops.filter((s) => s.name.trim() !== "");
    const start = filledStops.find((s) => s.type === "start");
    const end = filledStops.find((s) => s.type === "end");

    console.log("[Route] Filled stops:", filledStops.length, "Start:", start?.name, "End:", end?.name);

    if (!start || !end) {
      onRouteCalculatedRef.current?.({ distance: "", duration: "", stops: 0, legs: [] });
      return;
    }

    const waypointStops = filledStops.filter((s) => s.type === "stop");

    const modeMap: Record<string, google.maps.TravelMode> = {
      auto: google.maps.TravelMode.DRIVING,
    };
    const mode = modeMap[travelMode] || google.maps.TravelMode.DRIVING;

    // Split route into etappen (segments) at hotel stops
    const hotelSegments: RouteStop[][] = [];
    let currentEtappe: RouteStop[] = [start];
    for (const ws of waypointStops) {
      currentEtappe.push(ws);
      if (ws.isHotel) {
        hotelSegments.push(currentEtappe);
        currentEtappe = [ws];
      }
    }
    currentEtappe.push(end);
    hotelSegments.push(currentEtappe);

    // Further split segments that exceed MAX_WAYPOINTS (25 stops = 23 waypoints + origin + dest)
    const MAX_SEGMENT_SIZE = MAX_WAYPOINTS + 2;
    const etappenStops: RouteStop[][] = [];
    for (const seg of hotelSegments) {
      if (seg.length <= MAX_SEGMENT_SIZE) {
        etappenStops.push(seg);
      } else {
        let i = 0;
        while (i < seg.length - 1) {
          const chunkEnd = Math.min(i + MAX_SEGMENT_SIZE - 1, seg.length - 1);
          etappenStops.push(seg.slice(i, chunkEnd + 1));
          i = chunkEnd;
        }
      }
    }

    setCalculating(true);
    const service = new google.maps.DirectionsService();
    const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

    try {
      let totalDistance = 0;
      let totalDuration = 0;
      const allLegInfos: RouteLegInfo[] = [];
      const allLegs: google.maps.DirectionsLeg[] = [];
      const usedCacheKeys = new Set<string>();
      let apiCalls = 0;

      for (let e = 0; e < etappenStops.length; e++) {
        const seg = etappenStops[e];
        const key = segmentKey(seg, travelMode);
        usedCacheKeys.add(key);
        const cached = segmentCache.current.get(key);

        let result: google.maps.DirectionsResult;
        let segLegs: RouteLegInfo[];
        let segDistance: number;
        let segDuration: number;

        if (cached) {
          result = cached.result;
          segLegs = cached.legs;
          segDistance = cached.distance;
          segDuration = cached.duration;
        } else {
          const segOrigin = stopLocation(seg[0]);
          const segDest = stopLocation(seg[seg.length - 1]);
          const segWaypoints = seg.slice(1, -1).map((s) => ({ location: stopLocation(s), stopover: true }));
          const shouldOptimize = optimize && segWaypoints.length >= 2 && segWaypoints.length <= MAX_WAYPOINTS;

          result = await routeSegment(service, segOrigin, segDest, segWaypoints, mode, shouldOptimize);
          apiCalls++;

          if (shouldOptimize && result.routes[0]?.waypoint_order && seg.length > 3) {
            const order = result.routes[0].waypoint_order;
            const innerStops = seg.slice(1, -1);
            const reorderedInner = order.map((i: number) => innerStops[i]);
            const reorderedSeg = [seg[0], ...reorderedInner, seg[seg.length - 1]];
            etappenStops[e] = reorderedSeg;
          }

          const googleLegs = result.routes[0]?.legs || [];
          segLegs = extractLegInfos(googleLegs);
          const sums = sumLegs(googleLegs);
          segDistance = sums.distance;
          segDuration = sums.duration;

          segmentCache.current.set(key, { result, legs: segLegs, distance: segDistance, duration: segDuration });
        }

        const renderer = new google.maps.DirectionsRenderer({
          map: mapInstance.current,
          suppressMarkers: true,
          polylineOptions: { strokeColor: colors[e % colors.length], strokeWeight: 5, strokeOpacity: 0.8 },
          preserveViewport: e > 0,
        });
        renderer.setDirections(result);
        renderers.current.push(renderer);

        const googleLegs = result.routes[0]?.legs || [];
        allLegs.push(...googleLegs);
        allLegInfos.push(...segLegs);
        totalDistance += segDistance;
        totalDuration += segDuration;
      }

      // Reorder stops if optimization changed order
      if (optimize) {
        const reorderedIds = [start.id];
        for (const seg of etappenStops) {
          for (let i = 1; i < seg.length; i++) {
            if (seg[i].id !== reorderedIds[reorderedIds.length - 1]) {
              reorderedIds.push(seg[i].id);
            }
          }
        }
        if (reorderedIds.length === filledStops.length) {
          onStopsReorderedRef.current?.(reorderedIds);
        }
      }

      // Clean stale cache entries
      for (const k of segmentCache.current.keys()) {
        if (!usedCacheKeys.has(k)) segmentCache.current.delete(k);
      }

      console.log(`[Route] OK: ${etappenStops.length} Etappen, ${apiCalls} API-Aufrufe, ${segmentCache.current.size - apiCalls} aus Cache`);
      setRouteStatus(null);

      onRouteCalculatedRef.current?.({
        distance: formatDistance(totalDistance),
        duration: formatDuration(totalDuration),
        stops: waypointStops.length,
        legs: allLegInfos,
      });

      // Build correctly ordered stop list from etappen
      const orderedWaypoints: RouteStop[] = [];
      for (const seg of etappenStops) {
        for (let si = 1; si < seg.length - 1; si++) {
          orderedWaypoints.push(seg[si]);
        }
        if (seg.length > 1 && seg[seg.length - 1].type === "stop") {
          const last = seg[seg.length - 1];
          if (!orderedWaypoints.some((w) => w.id === last.id)) {
            orderedWaypoints.push(last);
          }
        }
      }
      const allOrderedStops = [start, ...orderedWaypoints, end];

      // Place markers
      if (mapInstance.current) {
        for (let i = 0; i < allOrderedStops.length; i++) {
          const s = allOrderedStops[i];
          const loc = stopLocation(s);
          let pos: google.maps.LatLng | undefined;

          if (loc instanceof google.maps.LatLng) {
            pos = loc;
          } else if (i === 0) {
            pos = allLegs[0]?.start_location;
          } else if (i < allOrderedStops.length - 1) {
            pos = allLegs[i - 1]?.end_location;
          } else {
            pos = allLegs[allLegs.length - 1]?.end_location;
          }
          if (!pos) continue;

          const label = i === 0 ? "A" : i === allOrderedStops.length - 1 ? "B" : String(i);
          const color = i === 0 ? "#3b82f6"
            : i === allOrderedStops.length - 1 ? "#ef4444"
            : s.isHotel && s.bookingConfirmation ? "#22c55e"
            : s.isHotel ? "#a855f7"
            : "#f97316";

          const marker = new google.maps.Marker({
            map: mapInstance.current!,
            position: pos,
            label: { text: label, color: "white", fontWeight: "bold", fontSize: "12px" },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 2,
            },
          });
          const hotelInfo = s.isHotel && s.bookingHotelName
            ? `<div style="display:flex;align-items:center;gap:4px;margin-top:3px"><span style="width:8px;height:8px;background:#22c55e;border-radius:50%;display:inline-block"></span><span style="color:#16a34a;font-size:11px">${s.bookingHotelName}</span></div>`
            : "";
          const canRemove = s.type === "stop" && !(s.isHotel && s.bookingConfirmation);
          const removeBtn = canRemove
            ? `<div style="border-top:1px solid #f3f4f6;margin-top:8px;padding-top:6px"><button id="remove-stop-${s.id}" style="display:flex;align-items:center;gap:5px;padding:4px 12px;font-size:11px;font-weight:500;font-family:system-ui;color:#ef4444;background:none;border:none;cursor:pointer;border-radius:6px;transition:background .15s" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='none'"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>Entfernen</button></div>`
            : "";
          const typeLabel = s.type === "start" ? "Start" : s.type === "end" ? "Ziel" : s.isHotel ? "Übernachtung" : "Zwischenstopp";
          const typeBadgeColor = s.type === "start" ? "#3b82f6" : s.type === "end" ? "#ef4444" : s.isHotel ? "#a855f7" : "#f97316";
          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="font-family:system-ui;padding:4px 2px;min-width:140px"><div style="font-size:13px;font-weight:600;color:#1f2937">${s.name}</div><span style="display:inline-block;margin-top:3px;padding:1px 8px;font-size:9px;font-weight:600;color:white;background:${typeBadgeColor};border-radius:10px;letter-spacing:.3px">${typeLabel}</span>${hotelInfo}${removeBtn}</div>`,
          });
          marker.addListener("click", () => {
            infoWindow.open(mapInstance.current!, marker);
          });
          if (canRemove) {
            infoWindow.addListener("domready", () => {
              const btn = document.getElementById(`remove-stop-${s.id}`);
              btn?.addEventListener("click", () => {
                infoWindow.close();
                onRemoveStopRef.current?.(s.id);
              });
            });
          }
          markers.current.push(marker);
        }

        // Store leg endpoints for click-to-add
        for (let li = 0; li < allLegs.length && li < allOrderedStops.length - 1; li++) {
          if (allLegs[li]?.start_location && allLegs[li]?.end_location) {
            const idx = stops.indexOf(allOrderedStops[li]);
            legEndpoints.current.push({
              start: allLegs[li].start_location,
              end: allLegs[li].end_location,
              afterStopIndex: idx >= 0 ? idx : li,
            });
          }
        }
      }

      setError(null);
    } catch (status) {
      console.error("[Route] Error:", status);
      const errorMessages: Record<string, string> = {
        NOT_FOUND: "Einer der Orte wurde nicht gefunden. Prüfe die Eingabe.",
        ZERO_RESULTS: "Keine Route zwischen diesen Orten gefunden.",
        OVER_QUERY_LIMIT: "Zu viele Anfragen. Bitte warte einen Moment.",
        REQUEST_DENIED: "Directions API nicht aktiviert. Bitte in Google Cloud Console aktivieren.",
        INVALID_REQUEST: "Ungültige Routenanfrage.",
        MAX_WAYPOINTS_EXCEEDED: "Zu viele Zwischenstopps für eine Anfrage.",
      };
      const msg = errorMessages[String(status)] || `Routenberechnung fehlgeschlagen (${status})`;
      setRouteStatus(msg);
      onErrorRef.current?.(msg);
    } finally {
      setCalculating(false);
    }
  }, [loaded, stops, travelMode, optimize, clearRenderers, stopLocation, segmentKey]);

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
      {routeStatus && !calculating && (
        <div className="absolute bottom-4 left-4 right-4 bg-amber-50/95 backdrop-blur-sm border border-amber-300 rounded-xl px-4 py-3 shadow-lg">
          <p className="text-xs font-medium text-amber-800">{routeStatus}</p>
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
    (inputElement: HTMLInputElement, onSelect: (place: string, lat?: number, lng?: number) => void) => {
      if (!ready || !inputElement) return;

      if (inputElement.dataset.autocompleteAttached) return;
      inputElement.dataset.autocompleteAttached = "true";

      const autocomplete = new google.maps.places.Autocomplete(inputElement, {
        types: ["geocode"],
        fields: ["formatted_address", "name", "geometry"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const lat = place?.geometry?.location?.lat();
        const lng = place?.geometry?.location?.lng();
        if (place?.name) {
          onSelect(place.name, lat, lng);
        } else if (place?.formatted_address) {
          onSelect(place.formatted_address, lat, lng);
        }
      });

      return autocomplete;
    },
    [ready]
  );

  return { ready, attachAutocomplete };
}
