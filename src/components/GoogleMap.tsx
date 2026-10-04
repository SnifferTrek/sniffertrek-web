"use client";

import { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from "react";
import { useTranslations } from "next-intl";
import { RouteStop, RouteLegInfo, ViaPoint, isDrivingRouteStop } from "@/lib/types";
import { collapseViaInflatedLegs } from "@/lib/etappeUtils";
import { loadRouteManifest, saveRouteManifest, type RouteManifestSegment } from "@/lib/routeManifest";
import { ferryRegionFromName, filterStopsForFerryRouting, filterViaPointsForFerryRouting, splitStopsForDedicatedFerryHops } from "@/lib/ferryRouting";
import { routeDrivingWithFerrySanity } from "@/lib/ferryDirections";

const GOOGLE_MAPS_KEY = "AIzaSyDTcV42T-ZkriZOB8RtNZMtGR8gZq3Izi0";

const MAX_WAYPOINTS = 23;
import { SEGMENT_CACHE_STORAGE_KEY } from "@/lib/localStorageCleanup";
const SEGMENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SEGMENT_CACHE_MAX_ITEMS = 80;

interface SegmentCacheRecord {
 key: string;
 result: unknown;
 legs: RouteLegInfo[];
 distance: number;
 duration: number;
 savedAt: number;
}

function readPersistentSegmentCache(): SegmentCacheRecord[] {
 if (typeof window === "undefined") return [];
 try {
 const raw = window.localStorage.getItem(SEGMENT_CACHE_STORAGE_KEY);
 if (!raw) return [];
 const parsed = JSON.parse(raw) as SegmentCacheRecord[];
 if (!Array.isArray(parsed)) return [];
 const now = Date.now();
 return parsed.filter((row) => row && typeof row.key === "string" && now - Number(row.savedAt || 0) <= SEGMENT_CACHE_TTL_MS);
 } catch {
 return [];
 }
}

function writePersistentSegmentCache(entries: SegmentCacheRecord[]): void {
 if (typeof window === "undefined") return;
 try {
 const trimmed = [...entries]
 .sort((a, b) => Number(b.savedAt || 0) - Number(a.savedAt || 0))
 .slice(0, SEGMENT_CACHE_MAX_ITEMS);
 window.localStorage.setItem(SEGMENT_CACHE_STORAGE_KEY, JSON.stringify(trimmed));
 } catch {
 // ignore localStorage errors
 }
}

/** Same identity as buildRouteFingerprint / segment cache keys — do NOT use getRoutingLocation (fallback LatLng vs. String breaks cache hits). */
function encodeStopRoutingIdentity(s: RouteStop): string {
 return `${s.id}|${s.type}|${(s.name || "").trim()}|${s.lat != null ? s.lat.toFixed(5) : ""}|${s.lng != null ? s.lng.toFixed(5) : ""}|${s.isHotel ? "1" : "0"}`;
}

type SegmentCacheEntry = {
 result: google.maps.DirectionsResult;
 legs: RouteLegInfo[];
 distance: number;
 duration: number;
 source?: "live" | "persisted";
};

/** Survives tab switches (Hotel ↔ Route) when GoogleMap unmounts — avoids 36+ API calls on every return. */
const globalSegmentCache = new Map<string, SegmentCacheEntry>();
let globalPersistentSegmentCacheHydrated = false;

/** Prevents parallel duplicate runs (e.g. Strict Mode / overlapping timers) → 36×2 live calls. */
const routeCalcInFlightByNamespace = new Set<string>();

interface RouteInfo {
 distance: string;
 duration: string;
 stops: number;
 legs: RouteLegInfo[];
 overviewPolyline?: string;
}

interface RouteUsageStats {
 liveApiCalls: number;
 memoryCacheHits: number;
 persistentCacheHits: number;
 /** Treffer aus explizitem Route-Manifest (JSON-File / localStorage) */
 manifestCacheHits: number;
 segmentCount: number;
 placesCalls: number;
}

export interface GoogleMapHandle {
 /** Routenberechnung (Directions API) manuell auslösen — bei manualRouteRefreshOnly nötig. */
 refreshRoute: () => void;
}

export type MapHighlightPoi = {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  category?: string;
};

const EMPTY_HIGHLIGHT_POIS: MapHighlightPoi[] = [];

interface GoogleMapProps {
 stops: RouteStop[];
 viaPoints?: ViaPoint[];
 travelMode: string;
 optimize?: boolean;
 avoidHighways?: boolean;
 avoidTolls?: boolean;
 avoidFerries?: boolean;
 distanceUnit?: "auto" | "km" | "mi";
 /** Kompakte Kartenhöhe (z. B. Seitenleiste Entdecken) */
 compact?: boolean;
 /** Überschreibt die Standardhöhe (compact 280px / sonst 400px). */
 heightClass?: string;
 cacheNamespace?: string;
 placesScope?: "all" | "activeSegment";
 /** Wenn true: keine automatische Berechnung bei Datenänderung — nur über refreshRoute() / „Route aktualisieren“. */
 manualRouteRefreshOnly?: boolean;
 /** Zusätzliche POI-Marker (z. B. KI-Empfehlungen im Entdecken-Tab). */
 highlightPois?: MapHighlightPoi[];
 /** Bucket-List-Orte auf der Karte anzeigen. */
 bucketListPois?: MapHighlightPoi[];
 showBucketListOnMap?: boolean;
 onToggleBucketListOnMap?: () => void;
 onAddToBucketList?: (poi: { name: string; lat: number; lng: number; category?: string }) => void;
 isInBucketList?: (name: string) => boolean;
 /** Kartenfokus, wenn keine Route (Suchgebiet). */
 focusCenter?: { lat: number; lng: number; zoom?: number };
 onRouteCalculated?: (info: RouteInfo) => void;
 onUsageStats?: (stats: RouteUsageStats) => void;
 onStopsReordered?: (orderedStopIds: string[]) => void;
 onError?: (message: string) => void;
 onMapClick?: (placeName: string, lat: number, lng: number, insertAtIndex?: number, afterStopId?: string) => void;
 onViaPointsChange?: (points: ViaPoint[]) => void;
 onRemoveStop?: (stopId: string) => void;
 /** Distanz/Fahrzeit/Stopps in der Leiste über der Karte, links. */
 routeStats?: { distance: string; duration: string; stops: string } | null;
}

const ROUTING_FALLBACKS: Record<string, { lat: number; lng: number }> = {
 "ile d ogoz": { lat: 46.6819, lng: 7.0986 },
 // CH-Autoroute-Hilfen (wenn Geocoding/Directions den Namen nicht sicher trifft)
 flueelapass: { lat: 46.7475, lng: 9.9475 },
 fluelapass: { lat: 46.7475, lng: 9.9475 },
 "fluela hospiz": { lat: 46.7478, lng: 9.9482 },
 "passhotel flueela hospiz": { lat: 46.7478, lng: 9.9482 },
};

function normalizeRoutingKey(name: string): string {
 return name
 .toLowerCase()
 .normalize("NFD")
 .replace(/[\u0300-\u036f]/g, "")
 .replace(/[^a-z0-9]+/g, " ")
 .trim();
}

/** Bekannte Tippfehler / Mittagsstopps auf der Flüela-Route. */
const ROUTING_ALIASES: Record<string, string> = {
 "hotel in lane": "Hotel In Lain, Flüelapass, Schweiz",
 "hotel inland": "Hotel In Lain, Flüelapass, Schweiz",
 "hotel in lain": "Hotel In Lain, Flüelapass, Schweiz",
};

async function findFailingStopName(
 service: google.maps.DirectionsService,
 seg: RouteStop[],
 resolveLoc: (s: RouteStop, i: number, seg: RouteStop[]) => string | google.maps.LatLng,
 mode: google.maps.TravelMode
): Promise<string | null> {
 if (seg.length < 2) return null;
 for (let i = 0; i < seg.length - 1; i++) {
 const from = resolveLoc(seg[i], i, seg);
 const to = resolveLoc(seg[i + 1], i + 1, seg);
 try {
 await routeSegment(service, from, to, [], mode, false);
 } catch {
 return seg[i + 1]?.name?.trim() || null;
 }
 }
 return null;
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
 optimizeWaypoints: boolean,
 avoid?: { highways?: boolean; tolls?: boolean; ferries?: boolean }
): Promise<google.maps.DirectionsResult> {
 return new Promise((resolve, reject) => {
 service.route(
 {
 origin,
 destination,
 waypoints,
 optimizeWaypoints,
 travelMode: mode,
 avoidHighways: !!avoid?.highways,
 avoidTolls: !!avoid?.tolls,
 avoidFerries: !!avoid?.ferries,
 },
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

const GoogleMap = forwardRef<GoogleMapHandle, GoogleMapProps>(function GoogleMap(
 {
 stops,
 viaPoints = [],
 travelMode,
 optimize = false,
 avoidHighways = false,
 avoidTolls = false,
 avoidFerries = false,
 distanceUnit = "auto",
 compact = false,
 heightClass,
 cacheNamespace = "",
 placesScope = "activeSegment",
 manualRouteRefreshOnly = false,
 highlightPois = EMPTY_HIGHLIGHT_POIS,
 bucketListPois = EMPTY_HIGHLIGHT_POIS,
 showBucketListOnMap = false,
 onToggleBucketListOnMap,
 onAddToBucketList,
 isInBucketList,
 focusCenter,
 onRouteCalculated,
 onUsageStats,
 onStopsReordered,
 onError,
 onMapClick,
 onViaPointsChange,
 onRemoveStop,
 routeStats = null,
 },
 ref
) {
 const t = useTranslations("map");
 const mapRef = useRef<HTMLDivElement>(null);
 const mapInstance = useRef<google.maps.Map | null>(null);
 const renderers = useRef<google.maps.DirectionsRenderer[]>([]);
 const markers = useRef<google.maps.Marker[]>([]);
 const viaMarkers = useRef<google.maps.Marker[]>([]);
 const highlightMarkers = useRef<google.maps.Marker[]>([]);
 const bucketListMarkers = useRef<google.maps.Marker[]>([]);
 const initialFocusRef = useRef(focusCenter);
 const legEndpoints = useRef<{ start: google.maps.LatLng; end: google.maps.LatLng; afterStopIndex: number; afterStopId?: string }[]>([]);
 const pendingShapeDragRef = useRef<{ startedNearRoute: boolean; start?: google.maps.LatLng } | null>(null);
 /** Same-route skip while mounted (remount after Hotel tab clears this — global cache still serves segments). */
 const lastRouteFingerprintRef = useRef<string>("");
 const placePhotoCache = useRef<Map<string, string | null>>(new Map());
 const placeServiceRef = useRef<google.maps.places.PlacesService | null>(null);
 const poiInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
 const viaCommitTimerRef = useRef<number | null>(null);
 const activeViaSegmentAfterStopIdRef = useRef<string | null>(null);
 const [loaded, setLoaded] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [calculating, setCalculating] = useState(false);
 const [addMode, setAddMode] = useState(false);
 const [addViaMode, setAddViaMode] = useState(false);
 const [routeStatus, setRouteStatus] = useState<string | null>(null);
 const distanceUnitRef = useRef(distanceUnit);
 distanceUnitRef.current = distanceUnit;
 const scaleControlElRef = useRef<HTMLDivElement | null>(null);

 const onRouteCalculatedRef = useRef(onRouteCalculated);
 const onUsageStatsRef = useRef(onUsageStats);
 const onStopsReorderedRef = useRef(onStopsReordered);
 const onErrorRef = useRef(onError);
 const onMapClickRef = useRef(onMapClick);
 const onViaPointsChangeRef = useRef(onViaPointsChange);
 const onRemoveStopRef = useRef(onRemoveStop);
 const onAddToBucketListRef = useRef(onAddToBucketList);
 const isInBucketListRef = useRef(isInBucketList);
 const addModeRef = useRef(addMode);
 const addViaModeRef = useRef(addViaMode);
 const viaPointsRef = useRef(viaPoints);
 onRouteCalculatedRef.current = onRouteCalculated;
 onUsageStatsRef.current = onUsageStats;
 onStopsReorderedRef.current = onStopsReordered;
 onErrorRef.current = onError;
 onMapClickRef.current = onMapClick;
 onViaPointsChangeRef.current = onViaPointsChange;
 onRemoveStopRef.current = onRemoveStop;
 onAddToBucketListRef.current = onAddToBucketList;
 isInBucketListRef.current = isInBucketList;
 addModeRef.current = addMode;
 addViaModeRef.current = addViaMode;
 viaPointsRef.current = viaPoints;

 const clearRenderers = useCallback(() => {
 renderers.current.forEach((r) => r.setMap(null));
 renderers.current = [];
 markers.current.forEach((m) => m.setMap(null));
 markers.current = [];
 viaMarkers.current.forEach((m) => m.setMap(null));
 viaMarkers.current = [];
 legEndpoints.current = [];
 }, []);

 const clearHighlightMarkers = useCallback(() => {
 highlightMarkers.current.forEach((m) => m.setMap(null));
 highlightMarkers.current = [];
 }, []);

 const clearBucketListMarkers = useCallback(() => {
 bucketListMarkers.current.forEach((m) => m.setMap(null));
 bucketListMarkers.current = [];
 }, []);

 useEffect(() => {
 return () => {
 if (viaCommitTimerRef.current != null) {
 window.clearTimeout(viaCommitTimerRef.current);
 viaCommitTimerRef.current = null;
 }
 clearHighlightMarkers();
 };
 }, [clearHighlightMarkers]);

 const getBestLegForPoint = useCallback((clickPt: google.maps.LatLng) => {
 let bestLeg: { start: google.maps.LatLng; end: google.maps.LatLng; afterStopIndex: number; afterStopId?: string } | undefined;
 let bestDistanceMeters = Infinity;
 if (legEndpoints.current.length > 0) {
 let minDist = Infinity;
 for (const leg of legEndpoints.current) {
 const d = distToSegment(clickPt, leg.start, leg.end);
 if (d < minDist) {
 minDist = d;
 bestLeg = leg;
 bestDistanceMeters = d;
 }
 }
 }
 return { bestLeg, bestDistanceMeters };
 }, []);

 useEffect(() => {
 if (!GOOGLE_MAPS_KEY || !mapRef.current) return;

 loadGoogleMapsScript()
 .then(() => {
 if (!mapRef.current || mapInstance.current) return;

 const map = new google.maps.Map(mapRef.current, {
 center: initialFocusRef.current
 ? { lat: initialFocusRef.current.lat, lng: initialFocusRef.current.lng }
 : { lat: 47.3769, lng: 8.5417 },
 zoom: initialFocusRef.current ? initialFocusRef.current.zoom ?? 12 : 8,
 mapTypeControl: true,
 mapTypeControlOptions: {
 style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
 position: google.maps.ControlPosition.TOP_RIGHT,
 mapTypeIds: ["roadmap", "satellite", "hybrid"],
 },
 streetViewControl: false,
 fullscreenControl: true,
 zoomControl: true,
 scaleControl: false,
 });

 map.addListener("click", (e: google.maps.MapMouseEvent) => {
 const iconEvent = e as google.maps.IconMouseEvent;
 if (addViaModeRef.current && e.latLng && onViaPointsChangeRef.current) {
 const { bestLeg } = getBestLegForPoint(e.latLng);
 const bestInsertIdx = bestLeg ? bestLeg.afterStopIndex + 1 : undefined;
 const fallbackAfterStopId =
 stops.find((s) => s.type === "start" && s.name.trim())?.id ||
 stops.find((s) => s.type === "stop" && s.name.trim() && isDrivingRouteStop(s))?.id ||
 stops.find((s) => s.name.trim() && isDrivingRouteStop(s))?.id;
 const nextVia: ViaPoint = {
 id: `via-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
 lat: e.latLng.lat(),
 lng: e.latLng.lng(),
 afterStopId: bestLeg?.afterStopId || (bestInsertIdx != null && bestInsertIdx > 0 ? stops[bestInsertIdx - 1]?.id : undefined) || fallbackAfterStopId,
 };
 activeViaSegmentAfterStopIdRef.current = nextVia.afterStopId || null;
 onViaPointsChangeRef.current([...viaPointsRef.current, nextVia]);
 setAddViaMode(false);
 return;
 }

 if (!addModeRef.current && iconEvent.placeId) {
 iconEvent.stop();
 const placesService = placeServiceRef.current;
 if (!placesService || !e.latLng) return;
 const placeId = iconEvent.placeId;
 const { bestLeg } = getBestLegForPoint(e.latLng);
 const bestInsertIdx = bestLeg ? bestLeg.afterStopIndex + 1 : undefined;
 const req: google.maps.places.PlaceDetailsRequest = {
 placeId,
 fields: ["name", "formatted_address", "address_components", "photos", "types"],
 };
 onUsageStatsRef.current?.({
 liveApiCalls: 0,
 memoryCacheHits: 0,
 persistentCacheHits: 0,
 manifestCacheHits: 0,
 segmentCount: 0,
 placesCalls: 1,
 });
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
 const inBucket = isInBucketListRef.current?.(routeName) ?? false;
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
 onMapClickRef.current?.(routeName, e.latLng!.lat(), e.latLng!.lng(), bestInsertIdx, bestLeg?.afterStopId);
 poiInfoWindowRef.current?.close();
 });
 const bucketBtn = document.getElementById(bucketBtnId);
 if (!inBucket) {
 bucketBtn?.addEventListener("click", () => {
 onAddToBucketListRef.current?.({
 name: routeName,
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

 if (!addModeRef.current || !e.latLng || !onMapClickRef.current) return;
 const clickLat = e.latLng.lat();
 const clickLng = e.latLng.lng();
 const clickPt = e.latLng;

 const { bestLeg } = getBestLegForPoint(clickPt);
 const bestInsertIdx = bestLeg ? bestLeg.afterStopIndex + 1 : undefined;

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
 onMapClickRef.current?.(name, clickLat, clickLng, bestInsertIdx, bestLeg?.afterStopId);
 setAddMode(false);
 }
 });
 });

 map.addListener("mousedown", (e: google.maps.MapMouseEvent) => {
 if (!e.latLng || addModeRef.current || addViaModeRef.current || !onViaPointsChangeRef.current) {
 pendingShapeDragRef.current = null;
 return;
 }
 const { bestDistanceMeters } = getBestLegForPoint(e.latLng);
 // Start shaping drag only when gesture begins close to current route.
 pendingShapeDragRef.current = {
 startedNearRoute: Number.isFinite(bestDistanceMeters) && bestDistanceMeters < 1600,
 start: e.latLng,
 };
 });

 map.addListener("mouseup", (e: google.maps.MapMouseEvent) => {
 const pending = pendingShapeDragRef.current;
 pendingShapeDragRef.current = null;
 if (!pending?.startedNearRoute || !pending.start || !e.latLng || !onViaPointsChangeRef.current) return;
 const dragMeters = google.maps.geometry.spherical.computeDistanceBetween(pending.start, e.latLng);
 if (!Number.isFinite(dragMeters) || dragMeters < 300) return;
 const { bestLeg } = getBestLegForPoint(e.latLng);
 const fallbackAfterStopId =
 stops.find((s) => s.type === "start" && s.name.trim())?.id ||
 stops.find((s) => s.type === "stop" && s.name.trim() && isDrivingRouteStop(s))?.id ||
 stops.find((s) => s.name.trim() && isDrivingRouteStop(s))?.id;
 const nextVia: ViaPoint = {
 id: `via-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
 lat: e.latLng.lat(),
 lng: e.latLng.lng(),
 afterStopId: bestLeg?.afterStopId || fallbackAfterStopId,
 };
 activeViaSegmentAfterStopIdRef.current = nextVia.afterStopId || null;
 onViaPointsChangeRef.current([...viaPointsRef.current, nextVia]);
 });

 placeServiceRef.current = new google.maps.places.PlacesService(map);
 mapInstance.current = map;
 setLoaded(true);
 })
 .catch((err) => {
 console.error("Google Maps load error:", err);
 setError(t("loadFail"));
 });
 }, []);

 useEffect(() => {
 if (!loaded) return;
 const map = mapInstance.current;
 if (!map) return;

 const el = document.createElement("div");
 el.className = "st-map-scale";
 el.setAttribute("aria-hidden", "true");
 el.style.cssText =
 "margin:0 0 12px 10px;pointer-events:none;display:flex;flex-direction:column;align-items:center;";
 const labelEl = document.createElement("div");
 labelEl.style.cssText =
 "margin-bottom:2px;font:600 11px/1 system-ui,sans-serif;color:#111;text-shadow:0 0 2px #fff,0 0 2px #fff,0 0 3px #fff;";
 const barWrap = document.createElement("div");
 barWrap.style.cssText = "position:relative;height:8px;";
 const barWhite = document.createElement("div");
 barWhite.style.cssText =
 "position:absolute;left:0;right:0;bottom:0;height:8px;border-left:3px solid #fff;border-right:3px solid #fff;border-bottom:3px solid #fff;box-sizing:border-box;";
 const barBlack = document.createElement("div");
 barBlack.style.cssText =
 "position:absolute;left:1px;right:1px;bottom:1px;height:6px;border-left:2px solid #111;border-right:2px solid #111;border-bottom:2px solid #111;box-sizing:border-box;";
 barWrap.append(barWhite, barBlack);
 el.append(labelEl, barWrap);
 scaleControlElRef.current = el;

 const updateScale = () => {
 const center = map.getCenter();
 const zoom = map.getZoom();
 if (center && zoom != null) {
 const mpp = metersPerPixelAt(center.lat(), zoom);
 if (Number.isFinite(mpp) && mpp > 0) {
 const scale = pickMapScaleBar(mpp, distanceUnitRef.current);
 labelEl.textContent = scale.label;
 barWrap.style.width = `${scale.widthPx}px`;
 }
 }
 clearGoogleMapFooterFill(map.getDiv());
 };

 updateScale();
 map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(el);
 const zoomListener = map.addListener("zoom_changed", updateScale);
 const idleListener = map.addListener("idle", updateScale);
 window.addEventListener("resize", updateScale);
 return () => {
 zoomListener.remove();
 idleListener.remove();
 window.removeEventListener("resize", updateScale);
 const controls = map.controls[google.maps.ControlPosition.LEFT_BOTTOM];
 for (let i = 0; i < controls.getLength(); i++) {
 if (controls.getAt(i) === el) {
 controls.removeAt(i);
 break;
 }
 }
 el.remove();
 scaleControlElRef.current = null;
 };
 }, [loaded, distanceUnit]);

 const stopLocation = useCallback((s: RouteStop): string | google.maps.LatLng => {
 if (s.lat != null && s.lng != null) return new google.maps.LatLng(s.lat, s.lng);
 if (s.bookingAddress) return s.bookingAddress;
 return s.name;
 }, []);

 const getRoutingLocation = useCallback((s: RouteStop, seg?: RouteStop[], index?: number): string | google.maps.LatLng => {
 if (s.lat != null && s.lng != null) return new google.maps.LatLng(s.lat, s.lng);
 const normalized = normalizeRoutingKey(s.name || "");
 const fallback = ROUTING_FALLBACKS[normalized];
 if (fallback) return new google.maps.LatLng(fallback.lat, fallback.lng);
 const alias = ROUTING_ALIASES[normalized];
 if (alias) return alias;
 if (s.bookingAddress) return s.bookingAddress;
 const name = (s.name || "").trim();
 if (!name) return name;
 // Hotel-Stopps ohne Adresse: mit Nachbarort anreichern
 if (/^hotel\b/i.test(name) && !/,/.test(name) && seg && index != null) {
 const neighbor =
 seg[index - 1]?.name?.trim() ||
 seg[index + 1]?.name?.trim() ||
 "";
 if (neighbor && !/^hotel\b/i.test(neighbor)) {
 return `${name}, ${neighbor}, Schweiz`;
 }
 }
 if (!/,/.test(name) && name.length <= 48 && ferryRegionFromName(name) === "unknown") {
 return `${name}, Schweiz`;
 }
 return name;
 }, []);

 const avoidRoutingSig = `h${avoidHighways ? 1 : 0}t${avoidTolls ? 1 : 0}f${avoidFerries ? 1 : 0}`;

 const segmentKey = useCallback((segStops: RouteStop[], tMode: string, segVia: ViaPoint[]): string => {
 const stopPart = segStops.map(encodeStopRoutingIdentity).join("||");
 const viaPart = segVia
 .map((vp) => `${vp.afterStopId || ""}:${vp.lat.toFixed(5)},${vp.lng.toFixed(5)}`)
 .join("|");
 const ns = cacheNamespace?.trim() ? `${cacheNamespace}:` : "";
 return `${ns}${tMode}:${avoidRoutingSig}:${stopPart}::via:${viaPart}:fs4`;
 }, [cacheNamespace, avoidRoutingSig]);

 const buildRouteFingerprint = useCallback((allStops: RouteStop[], allVia: ViaPoint[], mode: string, optimizeFlag: boolean): string => {
 const stopsKey = allStops.map(encodeStopRoutingIdentity).join("||");
 const viaKey = allVia
 .map((v) => `${v.afterStopId || ""}:${v.lat.toFixed(5)},${v.lng.toFixed(5)}`)
 .join("||");
 return `${mode}|opt:${optimizeFlag ? "1" : "0"}|avoid:${avoidRoutingSig}|stops:${stopsKey}|via:${viaKey}|fs4`;
 }, [avoidRoutingSig]);

 /** Content-only signatures so array reference churn does not retrigger the debounced effect. */
 const drivingStopsForRoute = useMemo(
 () => filterStopsForFerryRouting(stops.filter((s) => s.name.trim() !== "" && isDrivingRouteStop(s))),
 [stops]
 );
 const routingViaPoints = useMemo(
 () => filterViaPointsForFerryRouting(viaPoints, drivingStopsForRoute),
 [viaPoints, drivingStopsForRoute]
 );

 const stopsRoutingSig = useMemo(() => {
 const filledStops = drivingStopsForRoute;
 const start = filledStops.find((s) => s.type === "start");
 const end = filledStops.find((s) => s.type === "end");
 if (!start || !end) return "";
 return filledStops.map(encodeStopRoutingIdentity).join("||");
 }, [drivingStopsForRoute]);

 const viaRoutingSig = useMemo(
 () => routingViaPoints.map((v) => `${v.afterStopId || ""}:${v.lat.toFixed(5)},${v.lng.toFixed(5)}`).join("||"),
 [routingViaPoints]
 );

 /** Debounce / effect dependency: only changes when routing inputs change. Must match `buildRouteFingerprint` inside `calculateRoute` (incl. lastRouteFingerprintRef). */
 const routeCalcFingerprint = useMemo(() => {
 if (!stopsRoutingSig) return "";
 return `${travelMode}|opt:${optimize ? "1" : "0"}|avoid:${avoidRoutingSig}|stops:${stopsRoutingSig}|via:${viaRoutingSig}|fs4`;
 }, [stopsRoutingSig, viaRoutingSig, travelMode, optimize, avoidRoutingSig]);

 const calculateRoute = useCallback(async () => {
 if (!loaded || !mapInstance.current) {
 console.log("[Route] Waiting: loaded=", loaded, "map=", !!mapInstance.current);
 return;
 }

 const nsKey = cacheNamespace?.trim() || "__default__";

 if (!globalPersistentSegmentCacheHydrated) {
 const persisted = readPersistentSegmentCache();
 for (const row of persisted) {
 globalSegmentCache.set(row.key, {
 result: row.result as google.maps.DirectionsResult,
 legs: row.legs || [],
 distance: Number(row.distance || 0),
 duration: Number(row.duration || 0),
 source: "persisted",
 });
 }
 globalPersistentSegmentCacheHydrated = true;
 }

 const filledStops = drivingStopsForRoute;
 const start = filledStops.find((s) => s.type === "start");
 const end = filledStops.find((s) => s.type === "end");

 console.log("[Route] Filled stops:", filledStops.length, "Start:", start?.name, "End:", end?.name);

 if (!start || !end) {
 onRouteCalculatedRef.current?.({ distance: "", duration: "", stops: 0, legs: [] });
 return;
 }

 const waypointStops = filledStops.filter((s) => s.type === "stop");
 const viaPoints = routingViaPoints;
 const routeFingerprint = buildRouteFingerprint(filledStops, viaPoints, travelMode, optimize);

 if (routeCalcInFlightByNamespace.has(nsKey)) {
 return;
 }
 if (lastRouteFingerprintRef.current === routeFingerprint) {
 // Skip duplicate recomputation when non-routing state updates trigger renders.
 return;
 }

 routeCalcInFlightByNamespace.add(nsKey);
 try {
 lastRouteFingerprintRef.current = routeFingerprint;

 clearRenderers();
 setRouteStatus(null);

 const modeMap: Record<string, google.maps.TravelMode> = {
 auto: google.maps.TravelMode.DRIVING,
 car: google.maps.TravelMode.DRIVING,
 driving: google.maps.TravelMode.DRIVING,
 train: google.maps.TravelMode.TRANSIT,
 transit: google.maps.TravelMode.TRANSIT,
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

 // Further split segments (Google max 23 waypoints per request → cap stop count per chunk).
 // Small chunks only where Durchfahrtspunkte diesen Hotel-Abschnitt betreffen — sonst würde
 // jede lange Strecke (z. B. 36× ~10 Stopps) unnötig viele Directions-Calls erzeugen.
 const shapingEnabled = !!onViaPointsChangeRef.current && !optimize;
 const interactiveWaypointCap = 8;
 const regularViaReserve = onViaPointsChange ? 5 : 0;
 const largeWaypointCap = Math.max(4, MAX_WAYPOINTS - regularViaReserve);
 const largeSegmentSize = Math.max(4, largeWaypointCap + 2);
 const smallSegmentSize = Math.max(4, interactiveWaypointCap + 2);
 const etappenStops: RouteStop[][] = [];
 const pushChunked = (seg: RouteStop[], maxSize: number) => {
 if (seg.length <= maxSize) {
 etappenStops.push(seg);
 return;
 }
 let i = 0;
 while (i < seg.length - 1) {
 const chunkEnd = Math.min(i + maxSize - 1, seg.length - 1);
 etappenStops.push(seg.slice(i, chunkEnd + 1));
 i = chunkEnd;
 }
 };
 for (const seg of hotelSegments) {
 for (const seaSeg of splitStopsForDedicatedFerryHops(seg)) {
 const segHasShapingVia =
 shapingEnabled &&
 viaPoints.some((vp) => !!vp.afterStopId && seaSeg.some((s) => s.id === vp.afterStopId));
 const maxSize = segHasShapingVia ? smallSegmentSize : largeSegmentSize;
 pushChunked(seaSeg, maxSize);
 }
 }

 setCalculating(true);
 const service = new google.maps.DirectionsService();
 const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

 try {
 const keysFromManifest = new Set<string>();
 let manifestCacheHits = 0;

 // Explizites Route-Manifest (JSON in localStorage): bei gleichem Fingerprint alle Segmente vorbefüllen → keine Directions-Calls.
 const loadedManifest = loadRouteManifest(nsKey);
 if (loadedManifest && loadedManifest.fingerprint === routeFingerprint && loadedManifest.segments.length === etappenStops.length) {
 let manifestOk = true;
 for (let ei = 0; ei < etappenStops.length; ei++) {
 const seg = etappenStops[ei];
 const segVia = viaPoints
 .filter((vp) => !!vp.afterStopId && seg.some((s) => s.id === vp.afterStopId))
 .map((vp) => ({ ...vp }));
 const key = segmentKey(seg, travelMode, segVia);
 const row = loadedManifest.segments[ei];
 if (!row || row.key !== key) {
 manifestOk = false;
 break;
 }
 globalSegmentCache.set(key, {
 result: row.result as google.maps.DirectionsResult,
 legs: row.legs || [],
 distance: Number(row.distance || 0),
 duration: Number(row.duration || 0),
 source: "persisted",
 });
 keysFromManifest.add(key);
 }
 if (!manifestOk) {
 keysFromManifest.clear();
 }
 }

 let totalDistance = 0;
 let totalDuration = 0;
 const allLegInfos: RouteLegInfo[] = [];
 const allLegs: google.maps.DirectionsLeg[] = [];
 const usedCacheKeys = new Set<string>();
 let apiCalls = 0;
 let memoryCacheHits = 0;
 let persistentCacheHits = 0;

 for (let e = 0; e < etappenStops.length; e++) {
 const seg = etappenStops[e];
 const segVia = viaPoints
 .filter((vp) => !!vp.afterStopId && seg.some((s) => s.id === vp.afterStopId))
 .map((vp) => ({ ...vp }));
 const key = segmentKey(seg, travelMode, segVia);
 usedCacheKeys.add(key);
 const cached = globalSegmentCache.get(key);

 let result: google.maps.DirectionsResult;
 let segLegs: RouteLegInfo[];
 let segDistance: number;
 let segDuration: number;

 const activeSegmentAfterStopId = activeViaSegmentAfterStopIdRef.current;
 const isActiveEditedSegment =
 !!activeSegmentAfterStopId && seg.some((s) => s.id === activeSegmentAfterStopId);
 const requiresInteractiveDirections =
 !!onViaPointsChangeRef.current && !optimize && segVia.length > 0 && isActiveEditedSegment;
 // Kostenoptimierung: Nur das aktuell bearbeitete Segment (Etappe) wird live angefragt.
 // Unveränderte Hotel-zu-Hotel-Segmente nutzen den Cache.
 const canUseCached = !!cached && !requiresInteractiveDirections;

 if (canUseCached && cached) {
 try {
 // setDirections accepts a DirectionsResult-like object; use it when available.
 result = cached.result;
 const googleLegs = result.routes?.[0]?.legs || [];
 segLegs = extractLegInfos(googleLegs, seg, segVia);
 const sums = sumLegs(googleLegs);
 segDistance = sums.distance;
 segDuration = sums.duration;
 if (keysFromManifest.has(key)) {
 manifestCacheHits++;
 } else if ((cached.result as unknown as { geocoded_waypoints?: unknown[] })?.geocoded_waypoints) {
 persistentCacheHits++;
 } else {
 memoryCacheHits++;
 }
 } catch {
 globalSegmentCache.delete(key);
 throw new Error("CACHE_READ_FAILED");
 }
 } else {
 const segOrigin = getRoutingLocation(seg[0], seg, 0);
 const segDest = getRoutingLocation(seg[seg.length - 1], seg, seg.length - 1);
 const isTransit = mode === google.maps.TravelMode.TRANSIT;
 const rawWaypoints: Array<{ wp: google.maps.DirectionsWaypoint; mandatory: boolean }> = [];
 if (!isTransit) {
 for (let si = 0; si < seg.length - 1; si++) {
 if (si > 0) {
 rawWaypoints.push({ wp: { location: getRoutingLocation(seg[si], seg, si), stopover: true }, mandatory: true });
 }
 const viaAfter = segVia.filter((vp) => vp.afterStopId === seg[si].id);
 for (const vp of viaAfter) {
 // Treat shaping points as hard pass-through waypoints.
 // This is more stable than soft via points on long/segmented routes.
 rawWaypoints.push({ wp: { location: new google.maps.LatLng(vp.lat, vp.lng), stopover: true }, mandatory: false });
 }
 }
 }
 const segWaypoints: google.maps.DirectionsWaypoint[] = rawWaypoints.map((row) => row.wp);
 // Hard cap for Google Directions: max 23 waypoints per request.
 // Keep all mandatory stopovers; trim optional shaping points while preserving order.
 if (segWaypoints.length > MAX_WAYPOINTS) {
 const mandatoryCount = rawWaypoints.reduce((sum, row) => sum + (row.mandatory ? 1 : 0), 0);
 let optionalBudget = Math.max(0, MAX_WAYPOINTS - mandatoryCount);
 segWaypoints.length = 0;
 for (const row of rawWaypoints) {
 if (row.mandatory) {
 segWaypoints.push(row.wp);
 continue;
 }
 if (optionalBudget > 0) {
 segWaypoints.push(row.wp);
 optionalBudget--;
 }
 }
 }
 const shouldOptimize = !isTransit && optimize && segWaypoints.length >= 2 && segWaypoints.length <= MAX_WAYPOINTS && segVia.length === 0;

 try {
 const avoidOpts = isTransit
 ? undefined
 : {
 highways: avoidHighways,
 tolls: avoidTolls,
 ferries: avoidFerries,
 };
 result = isTransit
 ? await routeSegment(service, segOrigin, segDest, [], mode, false, avoidOpts)
 : await routeDrivingWithFerrySanity(
 service,
 segOrigin,
 segDest,
 segWaypoints,
 mode,
 shouldOptimize,
 avoidOpts
 );
 } catch (dirStatus: unknown) {
 const st = String(dirStatus);
 const fromName = seg[0]?.name?.trim() || "?";
 const toName = seg[seg.length - 1]?.name?.trim() || "?";
 const mids = seg.slice(1, -1).map((s) => s.name.trim()).filter(Boolean);
 let detail = "";
 if (mids.length === 0) {
 detail = t("segAB", { from: fromName, to: toName });
 } else if (mids.length <= 6) {
 detail = t("segMids", { from: fromName, mids: mids.join(" → "), to: toName });
 } else {
 detail = t("segMany", { from: fromName, n: mids.length, first: mids[0], last: mids[mids.length - 1], to: toName });
 }
 if (st === "ZERO_RESULTS" || st === "NOT_FOUND") {
 const bad = await findFailingStopName(
 service,
 seg,
 (s, i, whole) => getRoutingLocation(s, whole, i),
 mode
 );
 if (bad) {
 throw {
 segmentMessage: t("placeUnreachable", { name: bad, detail }),
 };
 }
 }
 const base: Record<string, string> = {
 NOT_FOUND: t("notFound"),
 ZERO_RESULTS: t("zeroResults"),
 OVER_QUERY_LIMIT: t("overQuery"),
 REQUEST_DENIED: t("denied"),
 INVALID_REQUEST: t("invalid"),
 MAX_WAYPOINTS_EXCEEDED: t("maxWaypoints"),
 };
 const head = base[st] || t("routeError", { st });
 throw { segmentMessage: `${head} ${detail}` };
 }
 apiCalls++;

 if (shouldOptimize && result.routes[0]?.waypoint_order && seg.length > 3) {
 const order = result.routes[0].waypoint_order;
 const innerStops = seg.slice(1, -1);
 const reorderedInner = order.map((i: number) => innerStops[i]);
 const reorderedSeg = [seg[0], ...reorderedInner, seg[seg.length - 1]];
 etappenStops[e] = reorderedSeg;
 }

 const googleLegs = result.routes[0]?.legs || [];
 segLegs = extractLegInfos(googleLegs, seg, segVia);
 const sums = sumLegs(googleLegs);
 segDistance = sums.distance;
 segDuration = sums.duration;

 globalSegmentCache.set(key, {
 result,
 legs: segLegs,
 distance: segDistance,
 duration: segDuration,
 source: "live",
 });
 }

 const renderer = new google.maps.DirectionsRenderer({
 map: mapInstance.current,
 suppressMarkers: true,
 draggable: true,
 polylineOptions: { strokeColor: colors[e % colors.length], strokeWeight: 5, strokeOpacity: 0.9, clickable: true, zIndex: 50 },
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
 activeViaSegmentAfterStopIdRef.current = segmentVia[0]?.afterStopId || segStopIds[0] || null;
 const commit = () => {
 const untouched = viaPointsRef.current.filter((vp) => !segStopIds.includes(vp.afterStopId || ""));
 const merged = filterViaPointsForFerryRouting([...untouched, ...segmentVia], filledStops);
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

 // Clean stale cache entries for this trip/tab only (never wipe other namespaces in the global map).
 const nsPrefix = cacheNamespace?.trim() ? `${cacheNamespace}:` : "";
 for (const k of globalSegmentCache.keys()) {
 if (nsPrefix && !k.startsWith(nsPrefix)) continue;
 if (!usedCacheKeys.has(k)) globalSegmentCache.delete(k);
 }

 // Persist active cache entries for future trip reloads.
 const toPersist: SegmentCacheRecord[] = [];
 const nowTs = Date.now();
 for (const [k, v] of globalSegmentCache.entries()) {
 if (!usedCacheKeys.has(k)) continue;
 let resultSnapshot: unknown;
 try {
 resultSnapshot = JSON.parse(JSON.stringify(v.result)) as unknown;
 } catch {
 continue;
 }
 toPersist.push({
 key: k,
 result: resultSnapshot,
 legs: v.legs || [],
 distance: Number(v.distance || 0),
 duration: Number(v.duration || 0),
 savedAt: nowTs,
 });
 }
 if (toPersist.length > 0) {
 const prev = readPersistentSegmentCache();
 const mergedByKey = new globalThis.Map<string, SegmentCacheRecord>();
 for (const row of [...toPersist, ...prev]) {
 if (!mergedByKey.has(row.key)) mergedByKey.set(row.key, row);
 }
 writePersistentSegmentCache(Array.from(mergedByKey.values()));
 }

 const manifestSegments: RouteManifestSegment[] = [];
 for (let e = 0; e < etappenStops.length; e++) {
 const seg = etappenStops[e];
 const segVia = viaPoints
 .filter((vp) => !!vp.afterStopId && seg.some((s) => s.id === vp.afterStopId))
 .map((vp) => ({ ...vp }));
 const key = segmentKey(seg, travelMode, segVia);
 const v = globalSegmentCache.get(key);
 if (!v) continue;
 let resultSnapshot: unknown;
 try {
 resultSnapshot = JSON.parse(JSON.stringify(v.result)) as unknown;
 } catch {
 continue;
 }
 manifestSegments.push({
 key,
 distance: Number(v.distance || 0),
 duration: Number(v.duration || 0),
 legs: v.legs || [],
 result: resultSnapshot,
 });
 }
 if (manifestSegments.length === etappenStops.length) {
 saveRouteManifest({
 namespace: nsKey,
 fingerprint: routeFingerprint,
 segments: manifestSegments,
 });
 }

 console.log(
 `[Route] OK: ${etappenStops.length} Etappen, ${apiCalls} API-Aufrufe, ${memoryCacheHits} RAM-Cache, ${persistentCacheHits} Persist-Cache, ${manifestCacheHits} Manifest`
 );
 onUsageStatsRef.current?.({
 liveApiCalls: apiCalls,
 memoryCacheHits,
 persistentCacheHits,
 manifestCacheHits,
 segmentCount: etappenStops.length,
 placesCalls: 0,
 });
 setRouteStatus(null);

 onRouteCalculatedRef.current?.({
 distance: formatDistance(totalDistance, distanceUnit),
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

 if (onViaPointsChangeRef.current) {
 const dropped = filterViaPointsForFerryRouting(viaPointsRef.current, filledStops);
 if (dropped.length !== viaPointsRef.current.length) {
 onViaPointsChangeRef.current(dropped);
 }
 }

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
 onUsageStatsRef.current?.({
 liveApiCalls: 0,
 memoryCacheHits: 0,
 persistentCacheHits: 0,
 manifestCacheHits: 0,
 segmentCount: 0,
 placesCalls: 1,
 });
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
 onUsageStatsRef.current?.({
 liveApiCalls: 0,
 memoryCacheHits: 0,
 persistentCacheHits: 0,
 manifestCacheHits: 0,
 segmentCount: 0,
 placesCalls: 1,
 });
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
 const canRemove = s.type === "stop" && !(s.isHotel && s.hotelBooked);
 const removeBtn = canRemove
 ? `<div style="border-top:1px solid #f3f4f6;margin-top:8px;padding-top:6px"><button id="remove-stop-${s.id}" style="display:flex;align-items:center;gap:5px;padding:4px 12px;font-size:11px;font-weight:500;font-family:system-ui;color:#ef4444;background:none;border:none;cursor:pointer;border-radius:6px;transition:background .15s" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='none'"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>${t("remove")}</button></div>`
 : "";
 const typeLabel = s.type === "start" ? t("start") : s.type === "end" ? t("dest") : s.isHotel ? t("overnight") : t("via");
 const typeBadgeColor = s.type === "start" ? "#3b82f6" : s.type === "end" ? "#ef4444" : s.isHotel ? "#a855f7" : "#f97316";
 const safePhoto = photoUrl
 ? `<div style="margin-top:8px"><img src="${photoUrl}" alt="${s.name}" style="width:100%;max-width:260px;height:120px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb"/></div>`
 : "";
 return `<div style="font-family:system-ui;padding:4px 2px;min-width:140px"><div style="font-size:13px;font-weight:600;color:#1f2937">${s.name}</div><span style="display:inline-block;margin-top:3px;padding:1px 8px;font-size:9px;font-weight:600;color:white;background:${typeBadgeColor};border-radius:10px;letter-spacing:.3px">${typeLabel}</span>${hotelInfo}${safePhoto}${removeBtn}</div>`;
 };

 const activePlacesSegmentStopIds = (() => {
 if (placesScope !== "activeSegment") return null;
 const anchorStopId = activeViaSegmentAfterStopIdRef.current;
 if (!anchorStopId) return null;
 const seg = etappenStops.find((s) => s.some((row) => row.id === anchorStopId));
 if (!seg) return null;
 return new Set(seg.map((row) => row.id));
 })();

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
 : s.isHotel && s.hotelBooked ? "#22c55e"
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
 const canRemove = s.type === "stop" && !(s.isHotel && s.hotelBooked);
 const infoWindow = new google.maps.InfoWindow({
 content: buildInfoContent(s),
 });
 marker.addListener("click", async () => {
 infoWindow.open(mapInstance.current!, marker);
 const allowPlacesForStop =
 !activePlacesSegmentStopIds || activePlacesSegmentStopIds.has(s.id);
 if (!allowPlacesForStop) return;
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
 afterStopId: allOrderedStops[li]?.id,
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
 title: `Durchfahrtspunkt`,
 icon: {
 path: google.maps.SymbolPath.CIRCLE,
 scale: 9,
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
 activeViaSegmentAfterStopIdRef.current = vp.afterStopId || null;
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
 activeViaSegmentAfterStopIdRef.current = vp.afterStopId || null;
 const next = viaPointsRef.current.filter((p) => p.id !== vp.id);
 onViaPointsChangeRef.current?.(next);
 info.close();
 });
 });

 viaMarkers.current.push(marker);
 });
 }
 }

 // Viewport an Route/Marker anpassen (DirectionsRenderer nutzt preserveViewport)
 if (mapInstance.current && markers.current.length > 0) {
 const bounds = new google.maps.LatLngBounds();
 for (const m of markers.current) {
 const p = m.getPosition();
 if (p) bounds.extend(p);
 }
 for (const vp of viaPoints) {
 if (Number.isFinite(vp.lat) && Number.isFinite(vp.lng)) {
 bounds.extend({ lat: vp.lat, lng: vp.lng });
 }
 }
 for (const leg of allLegs) {
 if (leg.start_location) bounds.extend(leg.start_location);
 if (leg.end_location) bounds.extend(leg.end_location);
 }
 if (!bounds.isEmpty()) {
 const map = mapInstance.current;
 map.fitBounds(bounds, compact ? 40 : 56);
 google.maps.event.addListenerOnce(map, "idle", () => {
 const z = map.getZoom();
 // Zu nah: Übersicht behalten; zu weit: etwas reinzoomen bei engen Clustern
 if (z != null && z > 15) map.setZoom(15);
 if (z != null && z < 8) map.setZoom(8);
 });
 }
 }

 setError(null);
 } catch (status: unknown) {
 console.error("[Route] Error:", status);
 lastRouteFingerprintRef.current = "";
 let msg: string;
 if (
 status &&
 typeof status === "object" &&
 "segmentMessage" in status &&
 typeof (status as { segmentMessage: string }).segmentMessage === "string"
 ) {
 msg = (status as { segmentMessage: string }).segmentMessage;
 } else {
 const errorMessages: Record<string, string> = {
 NOT_FOUND: t("notFoundCheck"),
 ZERO_RESULTS: t("zeroResults"),
 OVER_QUERY_LIMIT: t("overQuery"),
 REQUEST_DENIED: t("deniedLong"),
 INVALID_REQUEST: t("invalid"),
 MAX_WAYPOINTS_EXCEEDED: t("maxWaypointsReq"),
 };
 const key = status instanceof Error ? status.message : String(status);
 msg = errorMessages[key] || t("routeFail", { key });
 }
 setRouteStatus(msg);
 onErrorRef.current?.(msg);
 onUsageStatsRef.current?.({
 liveApiCalls: 0,
 memoryCacheHits: 0,
 persistentCacheHits: 0,
 manifestCacheHits: 0,
 segmentCount: 0,
 placesCalls: 0,
 });

 // Wenn die Routenberechnung scheitert, zeige bestehende Durchfahrtspunkte
 // trotzdem weiter auf der Karte, damit du sie noch siehst/anpassen oder entfernen kannst.
 if (mapInstance.current && onViaPointsChangeRef.current && viaPointsRef.current.length > 0) {
 viaMarkers.current.forEach((m) => m.setMap(null));
 viaMarkers.current = [];
 viaPointsRef.current.forEach((vp, idx) => {
 const marker = new google.maps.Marker({
 map: mapInstance.current!,
 position: { lat: vp.lat, lng: vp.lng },
 draggable: true,
 title: `Durchfahrtspunkt`,
 icon: {
 path: google.maps.SymbolPath.CIRCLE,
 scale: 9,
 fillColor: "#06b6d4",
 fillOpacity: 1,
 strokeColor: "white",
 strokeWeight: 2,
 },
 });
 marker.addListener("dragend", (evt: google.maps.MapMouseEvent) => {
 if (!evt.latLng) return;
 const lat = evt.latLng.lat();
 const lng = evt.latLng.lng();
 activeViaSegmentAfterStopIdRef.current = vp.afterStopId || null;
 const next = viaPointsRef.current.map((p) =>
 p.id === vp.id ? { ...p, lat, lng } : p
 );
 onViaPointsChangeRef.current?.(next);
 });

 const info = new google.maps.InfoWindow({
 content: `<div style="font-family:system-ui;padding:4px 2px;min-width:170px"><div style="font-size:12px;color:#1f2937;margin-bottom:6px">Durchfahrtspunkt ${idx + 1}</div><button id="remove-via-${vp.id}" style="padding:6px 10px;font-size:11px;font-weight:600;color:#fff;background:#ef4444;border:0;border-radius:7px;cursor:pointer">Punkt entfernen</button></div>`,
 });

 marker.addListener("click", () => {
 info.open(mapInstance.current!, marker);
 });

 info.addListener("domready", () => {
 const btn = document.getElementById(`remove-via-${vp.id}`);
 btn?.addEventListener("click", () => {
 activeViaSegmentAfterStopIdRef.current = vp.afterStopId || null;
 const next = viaPointsRef.current.filter((p) => p.id !== vp.id);
 onViaPointsChangeRef.current?.(next);
 info.close();
 });
 });

 viaMarkers.current.push(marker);
 });
 }
 } finally {
 setCalculating(false);
 }
 } finally {
 routeCalcInFlightByNamespace.delete(nsKey);
 }
 }, [loaded, stops, viaPoints, drivingStopsForRoute, routingViaPoints, travelMode, optimize, avoidHighways, avoidTolls, avoidFerries, distanceUnit, clearRenderers, stopLocation, segmentKey, getRoutingLocation, cacheNamespace]);

 const calculateRouteRef = useRef(calculateRoute);
 calculateRouteRef.current = calculateRoute;

 useImperativeHandle(ref, () => ({
 refreshRoute: () => {
 void calculateRouteRef.current();
 },
 }));

 useEffect(() => {
 if (manualRouteRefreshOnly) return;
 if (!loaded) return;
 const timer = setTimeout(() => {
 void calculateRouteRef.current();
 }, 800);
 return () => clearTimeout(timer);
 }, [routeCalcFingerprint, loaded, manualRouteRefreshOnly]);

 /** POI-Highlights + Suchgebiets-Fokus (Entdecken), unabhängig von Directions. */
 useEffect(() => {
 if (!loaded || !mapInstance.current) return;
 const map = mapInstance.current;
 clearHighlightMarkers();

 const pois = highlightPois.filter(
 (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
 );
 const bounds = new google.maps.LatLngBounds();
 let extendCount = 0;

 for (const poi of pois) {
 const pos = { lat: poi.lat, lng: poi.lng };
 const marker = new google.maps.Marker({
 map,
 position: pos,
 title: poi.name,
 zIndex: 80,
 icon: {
 path: google.maps.SymbolPath.CIRCLE,
 scale: 10,
 fillColor: "#ea580c",
 fillOpacity: 1,
 strokeColor: "#fff",
 strokeWeight: 2,
 },
 label: {
 text: String(Math.min(extendCount + 1, 99)),
 color: "white",
 fontWeight: "700",
 fontSize: "10px",
 },
 });
 const info = new google.maps.InfoWindow({
 content: `<div style="font-family:system-ui;padding:2px 0;max-width:200px"><div style="font-size:12px;font-weight:600;color:#18181b">${poi.name.replace(/</g, "&lt;")}</div>${
 poi.category
 ? `<div style="font-size:11px;color:#71717a;margin-top:2px">${String(poi.category).replace(/</g, "&lt;")}</div>`
 : ""
 }</div>`,
 });
 marker.addListener("click", () => info.open(map, marker));
 highlightMarkers.current.push(marker);
 bounds.extend(pos);
 extendCount += 1;
 }

 if (focusCenter && Number.isFinite(focusCenter.lat) && Number.isFinite(focusCenter.lng)) {
 bounds.extend({ lat: focusCenter.lat, lng: focusCenter.lng });
 extendCount += 1;
 }

 if (pois.length > 0) {
 map.fitBounds(bounds, compact ? 28 : 40);
 google.maps.event.addListenerOnce(map, "idle", () => {
 const z = map.getZoom();
 if (z != null && z > 15) map.setZoom(15);
 if (z != null && z < 11) map.setZoom(11);
 });
 } else if (focusCenter && Number.isFinite(focusCenter.lat) && Number.isFinite(focusCenter.lng)) {
 map.setCenter({ lat: focusCenter.lat, lng: focusCenter.lng });
 map.setZoom(focusCenter.zoom ?? 12);
 }
 }, [loaded, highlightPois, focusCenter, compact, clearHighlightMarkers]);

 /** Bucket-List-Marker auf der Autoroute-Karte. */
 useEffect(() => {
 if (!loaded || !mapInstance.current) return;
 const map = mapInstance.current;
 clearBucketListMarkers();
 if (!showBucketListOnMap) return;

 const pois = bucketListPois.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
 for (const poi of pois) {
 const pos = { lat: poi.lat, lng: poi.lng };
 const marker = new google.maps.Marker({
 map,
 position: pos,
 title: poi.name,
 zIndex: 90,
 icon: {
 path: google.maps.SymbolPath.CIRCLE,
 scale: 11,
 fillColor: "#16a34a",
 fillOpacity: 1,
 strokeColor: "#fff",
 strokeWeight: 2,
 },
 });
 const info = new google.maps.InfoWindow({
 content: `<div style="font-family:system-ui;padding:2px 0;max-width:220px"><div style="font-size:12px;font-weight:600;color:#18181b">${poi.name.replace(/</g, "&lt;")}</div>${
 poi.category
 ? `<div style="font-size:11px;color:#71717a;margin-top:2px">${String(poi.category).replace(/</g, "&lt;")}</div>`
 : ""
 }<div style="font-size:10px;color:#16a34d;margin-top:4px">Bucket List</div></div>`,
 });
 marker.addListener("click", () => info.open(map, marker));
 bucketListMarkers.current.push(marker);
 }
 }, [loaded, bucketListPois, showBucketListOnMap, clearBucketListMarkers]);

 const mapH = heightClass ?? (compact ? "h-[280px]" : "h-[400px]");

 if (!GOOGLE_MAPS_KEY) {
 return (
 <div className={`bg-[var(--st-bg)] ${mapH} flex items-center justify-center rounded-2xl border border-[var(--st-border)]`}>
 <p className="text-gray-400 text-sm">
 Google Maps Key nicht konfiguriert
 </p>
 </div>
 );
 }

 if (error) {
 return (
 <div className={`bg-red-50 ${mapH} flex items-center justify-center rounded-2xl`}>
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
 <div className="relative bg-transparent">
 {(onMapClick || routeStats) && (
 <div className="mb-2 flex flex-wrap items-center justify-between gap-2 bg-transparent">
 <div className="flex min-w-0 flex-wrap items-center gap-2">
 {routeStats?.distance ? (
 <>
 <span className="flex items-center whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium bg-white border border-[var(--st-border)] text-zinc-800 shadow-sm">
 {routeStats.distance}
 </span>
 <span className="flex items-center whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium bg-white border border-[var(--st-border)] text-zinc-800 shadow-sm">
 {routeStats.duration}
 </span>
 <span className="flex items-center whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium bg-white border border-[var(--st-border)] text-zinc-800 shadow-sm">
 {routeStats.stops}
 </span>
 </>
 ) : null}
 </div>
 <div className="flex shrink-0 items-center gap-2">
 {onMapClick && onViaPointsChange && (
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
 {addViaMode ? t("cancelVia") : t("addVia")}
 </button>
 )}
 {onMapClick && (
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
 {addMode ? t("cancel") : t("addStop")}
 </button>
 )}
 {onToggleBucketListOnMap && (
 <button
 type="button"
 onClick={onToggleBucketListOnMap}
 className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
 showBucketListOnMap
 ? "bg-green-600 text-white shadow-lg ring-2 ring-green-300"
 : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 shadow-sm"
 }`}
 >
 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
 {showBucketListOnMap ? "Bucket List aus" : "Bucket List"}
 </button>
 )}
 </div>
 </div>
 )}
 <div
 className={`relative overflow-hidden rounded-[1.25rem] bg-transparent ${addMode ? "ring-2 ring-orange-400" : addViaMode ? "ring-2 ring-cyan-400" : ""}`}
 >
 <div
 ref={mapRef}
 className={`${mapH} st-map-canvas w-full`}
 style={addMode || addViaMode ? { cursor: "crosshair" } : undefined}
 />
 </div>
 {calculating && (
 <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
 <div className="w-4 h-4 border-2 border-[var(--st-primary)] border-t-transparent rounded-full animate-spin" />
 <span className="text-xs text-gray-600 font-medium">{t("calculating")}</span>
 </div>
 )}
 {routeStatus && !calculating && (
 <div className="absolute bottom-4 left-4 right-4 bg-amber-50/95 backdrop-blur-sm border border-amber-300 rounded-xl px-4 py-3 shadow-lg">
 <p className="text-xs font-medium text-amber-800">{routeStatus}</p>
 </div>
 )}
 {(addMode || addViaMode) && (
 <div className="pointer-events-none absolute bottom-3 left-0 right-0 text-center">
 <span className={`text-xs font-medium ${addViaMode ? "text-cyan-700" : "text-orange-600"}`}>
 {addViaMode
 ? t("clickVia")
 : t("clickStop")}
 </span>
 </div>
 )}
 </div>
 );
});

export default GoogleMap;

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

function extractLegInfos(
 legs: google.maps.DirectionsLeg[],
 orderedStops?: RouteStop[],
 segVia: ViaPoint[] = []
): RouteLegInfo[] {
 const raw: RouteLegInfo[] = legs.map((leg, idx) => ({
 from: orderedStops?.[idx]?.name || leg.start_address || "",
 to: orderedStops?.[idx + 1]?.name || leg.end_address || "",
 distanceMeters: leg.distance?.value || 0,
 durationSeconds: leg.duration?.value || 0,
 }));
 return collapseViaInflatedLegs(raw, orderedStops || [], segVia);
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

function clearGoogleMapFooterFill(root: HTMLElement | null) {
 if (!root) return;
 const rootRect = root.getBoundingClientRect();
 root.querySelectorAll<HTMLElement>(".gm-style-cc, .gm-style-cc *").forEach((el) => {
 el.style.setProperty("background", "transparent", "important");
 el.style.setProperty("background-color", "transparent", "important");
 el.style.setProperty("box-shadow", "none", "important");
 });
 root.querySelectorAll<HTMLElement>(".gm-style [style]").forEach((el) => {
 if (el.closest(".st-map-scale")) return;
 const inline = el.getAttribute("style") || "";
 if (!/255,\s*255,\s*255|245,\s*245,\s*245|#fff(?:fff)?\b/i.test(inline)) return;
 const rect = el.getBoundingClientRect();
 if (rect.height > 42 || rect.height < 2) return;
 if (rect.bottom < rootRect.bottom - 16) return;
 el.style.setProperty("background", "transparent", "important");
 el.style.setProperty("background-color", "transparent", "important");
 el.style.setProperty("box-shadow", "none", "important");
 });
}

function metersPerPixelAt(lat: number, zoom: number): number {
 return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
}

const MAP_SCALE_METERS = [
 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000, 5000000,
];

function pickMapScaleBar(metersPerPx: number, unit: "auto" | "km" | "mi"): { widthPx: number; label: string } {
 const targetMeters = metersPerPx * 80;
 let chosen = MAP_SCALE_METERS[0];
 for (const n of MAP_SCALE_METERS) {
 chosen = n;
 if (n >= targetMeters * 0.7) break;
 }
 const widthPx = Math.max(36, Math.min(140, Math.round(chosen / metersPerPx)));
 const useMiles = unit === "mi";
 let label: string;
 if (useMiles) {
 const miles = chosen / 1609.344;
 label = miles < 0.2 ? `${Math.round(chosen * 3.28084)} ft` : `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
 } else if (chosen < 1000) {
 label = `${chosen} m`;
 } else {
 label = `${chosen / 1000} km`;
 }
 return { widthPx, label };
}

function formatDistance(meters: number, unit: "auto" | "km" | "mi" = "auto"): string {
 if (unit === "mi") {
 const miles = Math.round(meters / 1609.344);
 return `${miles.toLocaleString("de-CH")} mi`;
 }
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
 (
 inputElement: HTMLInputElement,
 onSelect: (place: string, lat?: number, lng?: number) => void,
 onPlaceChangeStarted?: () => void
 ) => {
 if (!ready || !inputElement) return;

 if (inputElement.dataset.autocompleteAttached) return;
 inputElement.dataset.autocompleteAttached = "true";

 const autocomplete = new google.maps.places.Autocomplete(inputElement, {
 types: ["geocode"],
 fields: ["formatted_address", "name", "geometry", "place_id"],
 });

 const invokeSelect = (place: google.maps.places.PlaceResult) => {
 const lat = place?.geometry?.location?.lat();
 const lng = place?.geometry?.location?.lng();
 const name = place?.name || place?.formatted_address;
 if (name) onSelect(name, lat, lng);
 };

 autocomplete.addListener("place_changed", () => {
 onPlaceChangeStarted?.();
 const place = autocomplete.getPlace();
 if (!place?.name && !place?.formatted_address) return;
 const hasGeometry = place?.geometry?.location != null;
 if (hasGeometry) {
 invokeSelect(place);
 return;
 }
 // Geometry fehlt oft beim ersten place_changed – Details nachladen
 if (place.place_id && typeof google.maps.places?.PlacesService !== "undefined") {
 const host = document.createElement("div");
 const service = new google.maps.places.PlacesService(host);
 service.getDetails(
 { placeId: place.place_id, fields: ["name", "formatted_address", "geometry"] },
 (detail, status) => {
 if (status === google.maps.places.PlacesServiceStatus.OK && detail) {
 const name = detail.name || detail.formatted_address || place.name || place.formatted_address;
 const lat = detail.geometry?.location?.lat();
 const lng = detail.geometry?.location?.lng();
 if (name) onSelect(name, lat, lng);
 } else {
 invokeSelect(place);
 }
 }
 );
 } else {
 invokeSelect(place);
 }
 });

 return autocomplete;
 },
 [ready]
 );

 return { ready, attachAutocomplete };
}
