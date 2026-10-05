"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RouteStop, RouteLegInfo, ViaPoint } from "@/lib/types";
import {
  bucketMarkerDomId,
  buildBucketPoiInfoHtml,
  resolvePoiImageUrl,
  wireBucketPoiInfoWindow,
} from "@/lib/bucketMapPoi";

const GOOGLE_MAPS_KEY = "AIzaSyDTcV42T-ZkriZOB8RtNZMtGR8gZq3Izi0";

const MAX_WAYPOINTS = 23;

interface RouteInfo {
  distance: string;
  duration: string;
  stops: number;
  legs: RouteLegInfo[];
  overviewPolyline?: string;
}

export type MapHighlightPoi = {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  category?: string;
  description?: string;
  imageUrl?: string;
  wikipediaTitle?: string;
  inMyBucketList?: boolean;
};

const EMPTY_BUCKET_POIS: MapHighlightPoi[] = [];

interface GoogleMapProps {
  stops: RouteStop[];
  viaPoints?: ViaPoint[];
  travelMode: string;
  optimize?: boolean;
  bucketListPois?: MapHighlightPoi[];
  showBucketListOnMap?: boolean;
  onToggleBucketListOnMap?: () => void;
  onAddToBucketList?: (poi: { name: string; lat: number; lng: number; category?: string }) => void;
  onAddBucketPoiAsStop?: (poi: MapHighlightPoi) => void;
  isInBucketList?: (name: string) => boolean;
  isInRoute?: (name: string) => boolean;
  onRouteCalculated?: (info: RouteInfo) => void;
  onStopsReordered?: (orderedStopIds: string[]) => void;
  onError?: (message: string) => void;
  onMapClick?: (placeName: string, lat: number, lng: number, insertAtIndex?: number, photoUrl?: string) => void;
  onViaPointsChange?: (points: ViaPoint[]) => void;
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

function encodePolyline(points: Array<{ lat: number; lng: number }>): string {
  let lastLat = 0;
  let lastLng = 0;
  let result = "";
  const encodeValue = (value: number) => {
    let v = value < 0 ? ~(value << 1) : value << 1;
    while (v >= 0x20) {
      result += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    result += String.fromCharCode(v + 63);
  };
  for (const p of points) {
    const lat = Math.round(p.lat * 1e5);
    const lng = Math.round(p.lng * 1e5);
    encodeValue(lat - lastLat);
    encodeValue(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }
  return result;
}

export default function GoogleMap({
  stops,
  viaPoints = [],
  travelMode,
  optimize = false,
  bucketListPois = EMPTY_BUCKET_POIS,
  showBucketListOnMap = false,
  onToggleBucketListOnMap,
  onAddToBucketList,
  onAddBucketPoiAsStop,
  isInBucketList,
  isInRoute,
  onRouteCalculated,
  onStopsReordered,
  onError,
  onMapClick,
  onViaPointsChange,
  onRemoveStop,
}: GoogleMapProps) {
  const mapShellRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const renderers = useRef<google.maps.DirectionsRenderer[]>([]);
  const markers = useRef<google.maps.Marker[]>([]);
  const viaMarkers = useRef<google.maps.Marker[]>([]);
  const bucketListMarkers = useRef<google.maps.Marker[]>([]);
  const legEndpoints = useRef<{ start: google.maps.LatLng; end: google.maps.LatLng; afterStopIndex: number }[]>([]);
  const segmentCache = useRef<Map<string, { result: google.maps.DirectionsResult; legs: RouteLegInfo[]; distance: number; duration: number }>>(new Map());
  const placePhotoCache = useRef<Map<string, string | null>>(new Map());
  const placeServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const poiInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const viaCommitTimerRef = useRef<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [addViaMode, setAddViaMode] = useState(false);
  const [routeStatus, setRouteStatus] = useState<string | null>(null);

  const onRouteCalculatedRef = useRef(onRouteCalculated);
  const onStopsReorderedRef = useRef(onStopsReordered);
  const onErrorRef = useRef(onError);
  const onMapClickRef = useRef(onMapClick);
  const onViaPointsChangeRef = useRef(onViaPointsChange);
  const onRemoveStopRef = useRef(onRemoveStop);
  const onAddToBucketListRef = useRef(onAddToBucketList);
  const onAddBucketPoiAsStopRef = useRef(onAddBucketPoiAsStop);
  const isInBucketListRef = useRef(isInBucketList);
  const isInRouteRef = useRef(isInRoute);
  const addModeRef = useRef(addMode);
  const addViaModeRef = useRef(addViaMode);
  const viaPointsRef = useRef(viaPoints);
  onRouteCalculatedRef.current = onRouteCalculated;
  onStopsReorderedRef.current = onStopsReordered;
  onErrorRef.current = onError;
  onMapClickRef.current = onMapClick;
  onViaPointsChangeRef.current = onViaPointsChange;
  onRemoveStopRef.current = onRemoveStop;
  onAddToBucketListRef.current = onAddToBucketList;
  onAddBucketPoiAsStopRef.current = onAddBucketPoiAsStop;
  isInBucketListRef.current = isInBucketList;
  isInRouteRef.current = isInRoute;
  addModeRef.current = addMode;
  addViaModeRef.current = addViaMode;
  viaPointsRef.current = viaPoints;

  const clearBucketListMarkers = useCallback(() => {
    bucketListMarkers.current.forEach((m) => m.setMap(null));
    bucketListMarkers.current = [];
  }, []);

  const clearRenderers = useCallback(() => {
    renderers.current.forEach((r) => r.setMap(null));
    renderers.current = [];
    markers.current.forEach((m) => m.setMap(null));
    markers.current = [];
    viaMarkers.current.forEach((m) => m.setMap(null));
    viaMarkers.current = [];
    legEndpoints.current = [];
  }, []);

  useEffect(() => {
    return () => {
      if (viaCommitTimerRef.current != null) {
        window.clearTimeout(viaCommitTimerRef.current);
        viaCommitTimerRef.current = null;
      }
    };
  }, []);

  const getBestInsertIndexForPoint = useCallback((clickPt: google.maps.LatLng): number | undefined => {
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
    return bestInsertIdx;
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
          fullscreenControl: false,
          zoomControl: true,
          scaleControl: true,
        });

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          const iconEvent = e as google.maps.IconMouseEvent;
          if (!addModeRef.current && iconEvent.placeId) {
            iconEvent.stop();
            const placesService = placeServiceRef.current;
            if (!placesService || !e.latLng) return;
            const placeId = iconEvent.placeId;
            const bestInsertIdx = getBestInsertIndexForPoint(e.latLng);
            const req: google.maps.places.PlaceDetailsRequest = {
              placeId,
              fields: ["name", "formatted_address", "address_components", "photos", "types"],
            };
            placesService.getDetails(req, (place, status) => {
              if (status !== google.maps.places.PlacesServiceStatus.OK || !place) return;
              const photo = place.photos?.[0]?.getUrl({ maxWidth: 340, maxHeight: 220 });
              const title = escapeHtml(place.name || "Ort");
              const address = escapeHtml(place.formatted_address || "").replace(/,/g, "<br/>");
              const addBtnId = `add-route-poi-${placeId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
              const bucketBtnId = `add-bucket-poi-${placeId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
              const locality = place.address_components?.find((c) =>
                c.types.includes("locality")
              )?.long_name;
              const poiName = place.name || "Ort";
              const routeName =
                locality && !poiName.toLowerCase().includes(locality.toLowerCase())
                  ? `${locality}, ${poiName}`
                  : poiName;
              const categoryType = place.types?.find((type) =>
                !["point_of_interest", "establishment", "geocode"].includes(type)
              );
              const category = categoryType ? categoryType.replace(/_/g, " ") : "Sehenswürdigkeit";
              const inBucket =
                (isInBucketListRef.current?.(poiName) ?? false) ||
                (isInBucketListRef.current?.(routeName) ?? false);
              const bucketBtnLabel = inBucket ? "Auf Bucket List" : "Zur Bucket List";
              const bucketBtnStyle = inBucket
                ? "border:1px solid #86efac;background:#ecfdf5;color:#15803d;cursor:default;"
                : "border:1px solid #d1d5db;background:#fff;color:#374151;cursor:pointer;";
              const content = `<div style="font-family:system-ui;padding:4px 2px;min-width:220px;max-width:320px"><div style="font-size:13px;font-weight:600;color:#1f2937;margin-bottom:4px">${title}</div>${address ? `<div style="font-size:12px;color:#4b5563;line-height:1.35">${address}</div>` : ""}<div style="display:flex;gap:8px;margin-top:10px"><button id="${addBtnId}" style="flex:1;padding:7px 10px;font-size:11px;font-weight:600;font-family:system-ui;color:#fff;background:#2563eb;border:0;border-radius:7px;cursor:pointer">Zu Route hinzufügen</button><button id="${bucketBtnId}" ${inBucket ? "disabled" : ""} style="flex:1;padding:7px 10px;font-size:11px;font-weight:600;font-family:system-ui;border-radius:7px;${bucketBtnStyle}">${bucketBtnLabel}</button></div>${photo ? `<div style="margin-top:8px"><img src="${photo}" alt="${title}" style="width:100%;height:130px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb"/></div>` : ""}</div>`;
              if (poiInfoWindowRef.current) {
                poiInfoWindowRef.current.close();
              }
              poiInfoWindowRef.current = new google.maps.InfoWindow({ content, position: e.latLng! });
              poiInfoWindowRef.current.open(map);
              google.maps.event.addListenerOnce(poiInfoWindowRef.current, "domready", () => {
                const btn = document.getElementById(addBtnId);
                btn?.addEventListener("click", () => {
                  onMapClickRef.current?.(poiName, e.latLng!.lat(), e.latLng!.lng(), bestInsertIdx, photo);
                  poiInfoWindowRef.current?.close();
                });
                const bucketBtn = document.getElementById(bucketBtnId);
                if (!inBucket) {
                  bucketBtn?.addEventListener("click", () => {
                    onAddToBucketListRef.current?.({
                      name: poiName,
                      lat: e.latLng!.lat(),
                      lng: e.latLng!.lng(),
                      category,
                    });
                    poiInfoWindowRef.current?.close();
                  });
                }
              });
            });
            return;
          }

          if (addViaModeRef.current && e.latLng && onViaPointsChangeRef.current) {
            const bestInsertIdx = getBestInsertIndexForPoint(e.latLng);
            const afterStop = bestInsertIdx != null && bestInsertIdx > 0 ? stops[bestInsertIdx - 1] : stops[0];
            const nextVia: ViaPoint = {
              id: `via-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              lat: e.latLng.lat(),
              lng: e.latLng.lng(),
              afterStopId: afterStop?.id,
            };
            onViaPointsChangeRef.current([...viaPointsRef.current, nextVia]);
            setAddViaMode(false);
            return;
          }

          if (!addModeRef.current || !e.latLng || !onMapClickRef.current) return;
          const clickLat = e.latLng.lat();
          const clickLng = e.latLng.lng();
          const clickPt = e.latLng;

          let bestInsertIdx: number | undefined;
          bestInsertIdx = getBestInsertIndexForPoint(clickPt);

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

        placeServiceRef.current = new google.maps.places.PlacesService(map);
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

  const segmentKey = useCallback((segStops: RouteStop[], tMode: string, segVia: ViaPoint[]): string => {
    const stopPart = segStops.map((s) => {
      if (s.lat != null && s.lng != null) return `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`;
      if (s.bookingAddress) return s.bookingAddress;
      return s.name;
    }).join("|");
    const viaPart = segVia
      .map((vp) => `${vp.afterStopId || ""}:${vp.lat.toFixed(5)},${vp.lng.toFixed(5)}`)
      .join("|");
    return `${tMode}:${stopPart}::via:${viaPart}`;
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

    // Further split segments. Keep reserve for draggable-route shaping points (via points),
    // otherwise long segments can hit Google waypoint limits and stop being draggable.
    const VIA_RESERVE = onViaPointsChange ? 5 : 0;
    const MAX_SEGMENT_SIZE = Math.max(4, (MAX_WAYPOINTS - VIA_RESERVE) + 2);
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
        const segVia = viaPoints
          .filter((vp) => !!vp.afterStopId && seg.some((s) => s.id === vp.afterStopId))
          .map((vp) => ({ ...vp }));
        const key = segmentKey(seg, travelMode, segVia);
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
          const segWaypoints: google.maps.DirectionsWaypoint[] = [];
          for (let si = 0; si < seg.length - 1; si++) {
            if (si > 0) {
              segWaypoints.push({ location: stopLocation(seg[si]), stopover: true });
            }
            const viaAfter = segVia.filter((vp) => vp.afterStopId === seg[si].id);
            for (const vp of viaAfter) {
              segWaypoints.push({ location: new google.maps.LatLng(vp.lat, vp.lng), stopover: false });
            }
          }
          // Hard cap for Google Directions: max 23 waypoints per request.
          // Mandatory stopovers stay first; excess via points are ignored in this segment.
          if (segWaypoints.length > MAX_WAYPOINTS) {
            const mandatoryCount = Math.max(0, seg.length - 2);
            const mandatory = segWaypoints.slice(0, mandatoryCount);
            const viaBudget = Math.max(0, MAX_WAYPOINTS - mandatoryCount);
            const viaOnly = segWaypoints.slice(mandatoryCount);
            segWaypoints.length = 0;
            segWaypoints.push(...mandatory, ...viaOnly.slice(0, viaBudget));
          }
          const shouldOptimize = optimize && segWaypoints.length >= 2 && segWaypoints.length <= MAX_WAYPOINTS && segVia.length === 0;

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
          draggable: !!onViaPointsChangeRef.current && !optimize,
          polylineOptions: { strokeColor: colors[e % colors.length], strokeWeight: 5, strokeOpacity: 0.8, clickable: true },
          preserveViewport: true,
        });
        renderer.setDirections(result);
        if (onViaPointsChangeRef.current) {
          const segStopIds = seg.map((s) => s.id);
          const extractSegmentVia = (res?: google.maps.DirectionsResult | null): ViaPoint[] => {
            const route = res?.routes?.[0];
            if (!route?.legs?.length) return [];
            const points: ViaPoint[] = [];
            for (let li = 0; li < route.legs.length; li++) {
              const leg = route.legs[li];
              const afterStopId = segStopIds[li];
              for (const wp of (leg as any).via_waypoints || []) {
                const lat = typeof wp.lat === "function" ? wp.lat() : wp.lat;
                const lng = typeof wp.lng === "function" ? wp.lng() : wp.lng;
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
                points.push({
                  id: `via-${afterStopId}-${lat.toFixed(5)}-${lng.toFixed(5)}`,
                  lat,
                  lng,
                  afterStopId,
                });
              }
            }
            return points;
          };
          renderer.addListener("directions_changed", () => {
            const segmentVia = extractSegmentVia(renderer.getDirections());
            if (segmentVia.length === 0) {
              // Keep existing shaping points when Google does not emit explicit via points.
              return;
            }
            const commit = () => {
              const untouched = viaPointsRef.current.filter((vp) => !segStopIds.includes(vp.afterStopId || ""));
              const merged = [...untouched, ...segmentVia];
              const dedupe = new Map<string, ViaPoint>();
              for (const vp of merged) {
                const k = `${vp.afterStopId || ""}:${vp.lat.toFixed(5)}:${vp.lng.toFixed(5)}`;
                dedupe.set(k, vp);
              }
              onViaPointsChangeRef.current?.(Array.from(dedupe.values()));
            };
            if (viaCommitTimerRef.current != null) {
              window.clearTimeout(viaCommitTimerRef.current);
              viaCommitTimerRef.current = null;
            }
            viaCommitTimerRef.current = window.setTimeout(() => {
              commit();
              viaCommitTimerRef.current = null;
            }, 450);
          });
        }
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
        overviewPolyline: (() => {
          const routePath: Array<{ lat: number; lng: number }> = [];
          for (const leg of allLegs) {
            for (const step of leg.steps || []) {
              for (const p of step.path || []) {
                const rawLat = typeof p.lat === "function" ? p.lat() : p.lat;
                const rawLng = typeof p.lng === "function" ? p.lng() : p.lng;
                const lat = Number(rawLat);
                const lng = Number(rawLng);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
                routePath.push({ lat, lng });
              }
            }
          }
          return routePath.length > 1 ? encodePolyline(routePath) : undefined;
        })(),
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
        const getPlacePhotoUrl = async (query: string): Promise<string | null> => {
          const key = query.trim().toLowerCase();
          if (!key) return null;
          if (placePhotoCache.current.has(key)) {
            return placePhotoCache.current.get(key) || null;
          }
          const placesService = placeServiceRef.current;
          if (!placesService) return null;

          const findPlace = (): Promise<{ placeId?: string }> =>
            new Promise((resolve) => {
              const req: google.maps.places.FindPlaceFromQueryRequest = {
                query,
                fields: ["place_id"],
              };
              placesService.findPlaceFromQuery(req, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
                  resolve({ placeId: results[0].place_id });
                } else {
                  resolve({});
                }
              });
            });

          const fetchPhotoByPlaceId = (placeId: string): Promise<string | null> =>
            new Promise((resolve) => {
              const req: google.maps.places.PlaceDetailsRequest = {
                placeId,
                fields: ["photos"],
              };
              placesService.getDetails(req, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place?.photos?.[0]) {
                  resolve(
                    place.photos[0].getUrl({
                      maxWidth: 320,
                      maxHeight: 220,
                    })
                  );
                } else {
                  resolve(null);
                }
              });
            });

          const found = await findPlace();
          let photoUrl: string | null = null;
          if (found.placeId) {
            photoUrl = await fetchPhotoByPlaceId(found.placeId);
          }
          placePhotoCache.current.set(key, photoUrl);
          return photoUrl;
        };

        const buildInfoContent = (s: RouteStop, photoUrl?: string | null) => {
          const hotelInfo = s.isHotel && s.bookingHotelName
            ? `<div style="display:flex;align-items:center;gap:4px;margin-top:3px"><span style="width:8px;height:8px;background:#22c55e;border-radius:50%;display:inline-block"></span><span style="color:#16a34a;font-size:11px">${s.bookingHotelName}</span></div>`
            : "";
          const canRemove = s.type === "stop" && !(s.isHotel && s.bookingConfirmation);
          const removeBtn = canRemove
            ? `<div style="border-top:1px solid #f3f4f6;margin-top:8px;padding-top:6px"><button id="remove-stop-${s.id}" style="display:flex;align-items:center;gap:5px;padding:4px 12px;font-size:11px;font-weight:500;font-family:system-ui;color:#ef4444;background:none;border:none;cursor:pointer;border-radius:6px;transition:background .15s" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='none'"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>Entfernen</button></div>`
            : "";
          const typeLabel = s.type === "start" ? "Start" : s.type === "end" ? "Ziel" : s.isHotel ? "Übernachtung" : "Zwischenstopp";
          const typeBadgeColor = s.type === "start" ? "#3b82f6" : s.type === "end" ? "#ef4444" : s.isHotel ? "#a855f7" : "#f97316";
          const safePhoto = photoUrl
            ? `<div style="margin-top:8px"><img src="${photoUrl}" alt="${s.name}" style="width:100%;max-width:260px;height:120px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb"/></div>`
            : "";
          return `<div style="font-family:system-ui;padding:4px 2px;min-width:140px"><div style="font-size:13px;font-weight:600;color:#1f2937">${s.name}</div><span style="display:inline-block;margin-top:3px;padding:1px 8px;font-size:9px;font-weight:600;color:white;background:${typeBadgeColor};border-radius:10px;letter-spacing:.3px">${typeLabel}</span>${hotelInfo}${safePhoto}${removeBtn}</div>`;
        };

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
          const canRemove = s.type === "stop" && !(s.isHotel && s.bookingConfirmation);
          const infoWindow = new google.maps.InfoWindow({
            content: buildInfoContent(s),
          });
          marker.addListener("click", async () => {
            infoWindow.open(mapInstance.current!, marker);
            const photoUrl = await getPlacePhotoUrl(s.bookingAddress || s.name);
            if (photoUrl) {
              infoWindow.setContent(buildInfoContent(s, photoUrl));
            }
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

        // Show current shaping points (Durchfahrtspunkte) as draggable helper markers.
        if (onViaPointsChangeRef.current && viaPoints.length > 0) {
          viaPoints.forEach((vp, idx) => {
            const marker = new google.maps.Marker({
              map: mapInstance.current!,
              position: { lat: vp.lat, lng: vp.lng },
              draggable: true,
              title: `Durchfahrtspunkt ${idx + 1}`,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: "#06b6d4",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
              },
            });

            const info = new google.maps.InfoWindow({
              content: `<div style="font-family:system-ui;padding:4px 2px;min-width:170px"><div style="font-size:12px;color:#1f2937;margin-bottom:6px">Durchfahrtspunkt ${idx + 1}</div><button id="remove-via-${vp.id}" style="padding:6px 10px;font-size:11px;font-weight:600;color:#fff;background:#ef4444;border:0;border-radius:7px;cursor:pointer">Punkt entfernen</button></div>`,
            });

            marker.addListener("dragend", (evt: google.maps.MapMouseEvent) => {
              if (!evt.latLng) return;
              const lat = evt.latLng.lat();
              const lng = evt.latLng.lng();
              const next = viaPointsRef.current.map((p) =>
                p.id === vp.id ? { ...p, lat, lng } : p
              );
              onViaPointsChangeRef.current?.(next);
            });

            marker.addListener("click", () => {
              info.open(mapInstance.current!, marker);
            });

            info.addListener("domready", () => {
              const btn = document.getElementById(`remove-via-${vp.id}`);
              btn?.addEventListener("click", () => {
                const next = viaPointsRef.current.filter((p) => p.id !== vp.id);
                onViaPointsChangeRef.current?.(next);
                info.close();
              });
            });

            viaMarkers.current.push(marker);
          });
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
  }, [loaded, stops, viaPoints, travelMode, optimize, clearRenderers, stopLocation, segmentKey]);

  useEffect(() => {
    const timer = setTimeout(calculateRoute, 800);
    return () => clearTimeout(timer);
  }, [calculateRoute]);

  useEffect(() => {
    if (!loaded || !mapInstance.current) return;
    const map = mapInstance.current;
    clearBucketListMarkers();
    if (!showBucketListOnMap) return;

    const bounds = new google.maps.LatLngBounds();
    let markerCount = 0;

    for (const poi of bucketListPois) {
      if (!Number.isFinite(poi.lat) || !Number.isFinite(poi.lng)) continue;
      const pos = { lat: poi.lat, lng: poi.lng };
      const markerId = bucketMarkerDomId(poi, "route");
      const inMyBucketList =
        poi.inMyBucketList ?? isInBucketListRef.current?.(poi.name) ?? false;
      const alreadyInRoute = isInRouteRef.current?.(poi.name) ?? false;
      const marker = new google.maps.Marker({
        map,
        position: pos,
        title: poi.name,
        zIndex: 90,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#fff",
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
              addBucketPrefix: "bucket-add-list",
              addStopPrefix: "bucket-add-stop",
            })
          );
          info.open(map, marker);
          wireBucketPoiInfoWindow(info, poi, markerId, {
            addBucketPrefix: "bucket-add-list",
            addStopPrefix: "bucket-add-stop",
            inMyBucketList,
            inRoute: alreadyInRoute,
            onAddToBucketList: (p) => onAddToBucketListRef.current?.(p),
            onAddAsStop: (p) => onAddBucketPoiAsStopRef.current?.(p),
          });
        })();
      });
      bucketListMarkers.current.push(marker);
      bounds.extend(pos);
      markerCount += 1;
    }

    if (markerCount > 0) {
      map.fitBounds(bounds, 56);
      google.maps.event.addListenerOnce(map, "idle", () => {
        const zoom = map.getZoom();
        if (zoom != null && zoom > 15) map.setZoom(15);
      });
    }
  }, [loaded, bucketListPois, showBucketListOnMap, clearBucketListMarkers]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = document.fullscreenElement === mapShellRef.current;
      setIsFullscreen(active);
      if (mapInstance.current) {
        google.maps.event.trigger(mapInstance.current, "resize");
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const shell = mapShellRef.current;
    if (!shell) return;
    if (document.fullscreenElement === shell) {
      void document.exitFullscreen();
      return;
    }
    void shell.requestFullscreen?.();
  }, []);

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

  const mapHeightClass = isFullscreen ? "h-[calc(100vh-4.5rem)]" : "h-[400px]";

  return (
    <div
      ref={mapShellRef}
      className={`relative ${isFullscreen ? "bg-white p-3" : ""}`}
    >
      {onMapClick && (
        <div className="pointer-events-none absolute top-2 right-2 z-20 flex justify-end gap-2">
          <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
          {onViaPointsChange && (
            <button
              type="button"
              onClick={() => {
                setAddViaMode((v) => !v);
                setAddMode(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                addViaMode
                  ? "bg-cyan-600 text-white shadow-lg ring-2 ring-cyan-300"
                  : "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 shadow-sm"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M3 12h6"/><path d="M15 12h6"/><path d="M12 3v6"/><path d="M12 15v6"/></svg>
              {addViaMode ? "Durchfahrtspunkt abbrechen" : "+ Durchfahrtspunkt setzen"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setAddMode((v) => !v);
              setAddViaMode(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              addMode
                ? "bg-orange-500 text-white shadow-lg ring-2 ring-orange-300"
                : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 shadow-sm"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            {addMode ? "Abbrechen" : "+ Stopp auf Karte eingeben"}
          </button>
          {onToggleBucketListOnMap && (
            <button
              type="button"
              onClick={onToggleBucketListOnMap}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                showBucketListOnMap
                  ? "bg-red-600 text-white shadow-lg ring-2 ring-red-300"
                  : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 shadow-sm"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              {showBucketListOnMap ? "Bucket List aus" : "Bucket List"}
            </button>
          )}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm transition-all hover:bg-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
            {isFullscreen ? "Vollbild beenden" : "Vollbild"}
          </button>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className={`${mapHeightClass} w-full rounded-2xl ${addMode ? "ring-2 ring-orange-400" : addViaMode ? "ring-2 ring-cyan-400" : ""}`}
        style={addMode || addViaMode ? { cursor: "crosshair" } : undefined}
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
      {(addMode || addViaMode) && (
        <div className="mt-2 text-center">
          <span className={`text-xs font-medium ${addViaMode ? "text-cyan-700" : "text-orange-600"}`}>
            {addViaMode
              ? "Klicke auf die Karte um einen Durchfahrtspunkt zu setzen"
              : "Klicke auf die Karte um einen Zwischenstopp hinzuzufügen"}
          </span>
        </div>
      )}
    </div>
  );
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
