import { haversineKm } from "@/lib/etappeGeo";
import type { RouteStop, ViaPoint } from "@/lib/types";

/** Grobe Fähr-Regionen für Autofahrt + Autofähre (nicht Fussgänger-Inseln). */
export type FerryRegion = "elba" | "corsica" | "sardinia" | "sicily" | "mainland" | "unknown";

export type GeoPt = { lat: number; lng: number };

type BBox = { minLat: number; maxLat: number; minLng: number; maxLng: number };

const REGION_BOXES: { region: FerryRegion; box: BBox }[] = [
  // Elba inkl. Portoferraio – nicht bis Piombino (Festland, ~42.93/10.52)
  { region: "elba", box: { minLat: 42.7, maxLat: 42.9, minLng: 10.06, maxLng: 10.52 } },
  { region: "corsica", box: { minLat: 41.32, maxLat: 43.03, minLng: 8.53, maxLng: 9.59 } },
  { region: "sardinia", box: { minLat: 38.85, maxLat: 41.31, minLng: 8.13, maxLng: 9.84 } },
  { region: "sicily", box: { minLat: 36.64, maxLat: 38.32, minLng: 12.42, maxLng: 15.65 } },
  // Nach den Inseln: westliches Mittelmeer-Festland (Toskana, Ligurien, Côte d'Azur)
  { region: "mainland", box: { minLat: 41.32, maxLat: 46.2, minLng: 4.5, maxLng: 14.5 } },
];

const NAME_HINTS: { region: FerryRegion; pattern: RegExp }[] = [
  { region: "elba", pattern: /\b(portoferraio|porto ferraio|isola d[' ]?elba|isol d[' ]?elba|\belba\b|marciana|rio marina|porto azzurro|campo nell[' ]?elba)\b/i },
  { region: "corsica", pattern: /\b(bastia|ajaccio|calvi|bonifacio|porto[- ]?vecchio|corte|ile[- ]?rousse|l[' ]ile[- ]?rousse|propriano|corsica|korsika|haute[- ]corse|\bcorse\b)\b/i },
  { region: "sardinia", pattern: /\b(olbia|golfo aranci|porto torres|cagliari|alghero|sassari|santa teresa|sardinien|sardegna|sardinia)\b/i },
  { region: "sicily", pattern: /\b(palermo|catania|messina|trapani|siracusa|sizilien|sicilia|sicily)\b/i },
  { region: "mainland", pattern: /\b(livorno|piombino|savona|genua|genova|genoa|civitavecchia|la spezia|pisa|viareggio|nizza|nice|toulon|marseille)\b/i },
];

/** Bekannte Autofähren – Elba ist nur Festland↔Elba, nicht Korsika/Sardinien. */
const VALID_HOPS: Record<FerryRegion, FerryRegion[]> = {
  elba: ["elba", "mainland", "unknown"],
  corsica: ["corsica", "mainland", "sardinia"],
  sardinia: ["sardinia", "mainland", "corsica"],
  sicily: ["sicily", "mainland", "unknown"],
  mainland: ["mainland", "elba", "corsica", "sardinia", "sicily", "unknown"],
  unknown: ["elba", "corsica", "sardinia", "sicily", "mainland", "unknown"],
};

const LIVORNO_PORT: GeoPt = { lat: 43.5526, lng: 10.2944 };
const PIOMBINO_PORT: GeoPt = { lat: 42.9218, lng: 10.5274 };
const SAVONA_PORT: GeoPt = { lat: 44.2705, lng: 8.445 };
const BASTIA_PORT: GeoPt = { lat: 42.7022, lng: 9.4508 };

function inBox(pt: GeoPt, box: BBox): boolean {
  return pt.lat >= box.minLat && pt.lat <= box.maxLat && pt.lng >= box.minLng && pt.lng <= box.maxLng;
}

function normalizeName(name: string | undefined): string {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function ferryRegionFromName(name: string | undefined): FerryRegion {
  const n = normalizeName(name);
  if (!n) return "unknown";
  for (const hint of NAME_HINTS) {
    if (hint.pattern.test(n)) return hint.region;
  }
  return "unknown";
}

export function ferryRegionOf(pt?: GeoPt | null, name?: string): FerryRegion {
  if (pt && Number.isFinite(pt.lat) && Number.isFinite(pt.lng)) {
    for (const row of REGION_BOXES) {
      if (inBox(pt, row.box)) return row.region;
    }
  }
  return ferryRegionFromName(name);
}

function stopPoint(stop: Pick<RouteStop, "lat" | "lng" | "name">): GeoPt | null {
  if (stop.lat != null && stop.lng != null && Number.isFinite(stop.lat) && Number.isFinite(stop.lng)) {
    return { lat: stop.lat, lng: stop.lng };
  }
  return null;
}

function stopRegion(stop: Pick<RouteStop, "lat" | "lng" | "name">): FerryRegion {
  return ferryRegionOf(stopPoint(stop), stop.name);
}

export function isValidFerryHop(from: FerryRegion, to: FerryRegion): boolean {
  return VALID_HOPS[from]?.includes(to) ?? true;
}

/** Elba ist kein Umstieg nach Korsika/Sardinien. */
export function isForbiddenElbaTransfer(from: FerryRegion, to: FerryRegion): boolean {
  if (from === "elba" && (to === "corsica" || to === "sardinia")) return true;
  if (to === "elba" && (from === "corsica" || from === "sardinia")) return true;
  return false;
}

export function isDedicatedSeaHop(from: FerryRegion, to: FerryRegion): boolean {
  if (from === to) return false;
  const key = [from, to].sort().join("|");
  return (
    key === "corsica|mainland" ||
    key === "mainland|sardinia" ||
    key === "corsica|sardinia" ||
    key === "elba|mainland" ||
    key === "mainland|sicily" ||
    key === "corsica|unknown" ||
    key === "sardinia|unknown" ||
    key === "elba|unknown" ||
    key === "sicily|unknown"
  );
}

/** Eigene Directions-Abschnitte: Festland↔Korsika/Sardinien nicht in einer Wegpunktkette (Google geht sonst über Elba). */
export function splitStopsForDedicatedFerryHops<T extends RouteStop>(stops: T[]): T[][] {
  if (stops.length < 2) return stops.length ? [stops] : [];
  const chunks: T[][] = [];
  let current: T[] = [stops[0]];
  for (let i = 1; i < stops.length; i++) {
    const prev = current[current.length - 1];
    const next = stops[i];
    if (isDedicatedSeaHop(stopRegion(prev), stopRegion(next))) {
      if (current.length >= 2) chunks.push(current);
      chunks.push([prev, next]);
      current = [next];
    } else {
      current.push(next);
    }
  }
  if (current.length >= 2) chunks.push(current);
  else if (!chunks.length) chunks.push(stops);
  return chunks;
}

function pathTouchesPiombinoCorridor(points: GeoPt[]): boolean {
  return points.some((p) => p.lat >= 42.72 && p.lat <= 43.18 && p.lng >= 10.15 && p.lng <= 10.72);
}

function isElbaCorridorPort(stop: Pick<RouteStop, "lat" | "lng" | "name">): boolean {
  const n = normalizeName(stop.name);
  if (/\b(piombino|portoferraio|porto ferraio|rio marina|porto azzurro)\b/.test(n)) return true;
  const pt = stopPoint(stop);
  if (!pt) return false;
  if (ferryRegionOf(pt) === "elba") return true;
  // Piombino-Hafen (Festland), typischer Elba-Zubringer
  return pt.lat >= 42.88 && pt.lat <= 42.97 && pt.lng >= 10.45 && pt.lng <= 10.58;
}

/**
 * Zwischenstopp nur behalten, wenn er keine unmögliche Insel-Umweg-Fähre erzwingt.
 * Hotels auf Elba bleiben (bewusste Übernachtung).
 */
export function shouldKeepFerryRoutingStop(
  prev: Pick<RouteStop, "lat" | "lng" | "name" | "isHotel" | "type">,
  stop: Pick<RouteStop, "lat" | "lng" | "name" | "isHotel" | "type">,
  next: Pick<RouteStop, "lat" | "lng" | "name" | "isHotel" | "type">
): boolean {
  if (stop.type === "start" || stop.type === "end") return true;
  const mid = stopRegion(stop);
  const a = stopRegion(prev);
  const b = stopRegion(next);

  if (mid === "elba") {
    if (stop.isHotel) return true;
    if (a === "elba" || b === "elba") return true;
    return isValidFerryHop(a, "elba") && isValidFerryHop("elba", b);
  }

  // Piombino/Portoferraio nicht als Zwangspunkt Italien↔Korsika
  if (isElbaCorridorPort(stop) && !stop.isHotel && a !== "elba" && b !== "elba") {
    if (a === "corsica" || b === "corsica" || a === "sardinia" || b === "sardinia") {
      return false;
    }
  }
  return true;
}

function nextFerryAnchor<T extends RouteStop>(stops: T[], fromIndex: number): T {
  for (let j = fromIndex; j < stops.length; j++) {
    const candidate = stops[j];
    if (j === stops.length - 1 || candidate.isHotel) return candidate;
    const region = stopRegion(candidate);
    if (region !== "elba" && !isElbaCorridorPort(candidate)) return candidate;
  }
  return stops[stops.length - 1];
}

export function filterStopsForFerryRouting<T extends RouteStop>(stops: T[]): T[] {
  if (stops.length <= 2) return stops;
  const out: T[] = [stops[0]];
  for (let i = 1; i < stops.length - 1; i++) {
    const prev = out[out.length - 1];
    const next = nextFerryAnchor(stops, i + 1);
    if (shouldKeepFerryRoutingStop(prev, stops[i], next)) out.push(stops[i]);
  }
  out.push(stops[stops.length - 1]);
  return out.length >= 2 ? out : stops;
}

export function filterFerryWaypointNames(origin: string, destination: string, waypoints: string[]): string[] {
  if (!waypoints.length) return waypoints;
  const stops: RouteStop[] = [
    { id: "origin", name: origin, type: "start" },
    ...waypoints.map((name, i) => ({ id: `wp-${i}`, name, type: "stop" as const })),
    { id: "dest", name: destination, type: "end" },
  ];
  return filterStopsForFerryRouting(stops)
    .filter((s) => s.type === "stop")
    .map((s) => s.name);
}

export function filterViaPointsForFerryRouting(viaPoints: ViaPoint[], stops: RouteStop[]): ViaPoint[] {
  if (!viaPoints.length || stops.length < 2) return viaPoints;
  return viaPoints.filter((vp) => {
    if (!Number.isFinite(vp.lat) || !Number.isFinite(vp.lng)) return false;
    const region = ferryRegionOf({ lat: vp.lat, lng: vp.lng });
    const afterIdx = Math.max(
      0,
      stops.findIndex((s) => s.id === vp.afterStopId)
    );
    const from = stops[afterIdx] || stops[0];
    const to = stops[afterIdx + 1] || stops[stops.length - 1];
    const a = stopRegion(from);
    const b = stopRegion(to);
    if (region === "elba") {
      if (a === "elba" || b === "elba") return true;
      return isValidFerryHop(a, "elba") && isValidFerryHop("elba", b);
    }
    const nearPiombino = vp.lat >= 42.88 && vp.lat <= 42.97 && vp.lng >= 10.45 && vp.lng <= 10.58;
    if (nearPiombino && a !== "elba" && b !== "elba" && (a === "corsica" || b === "corsica")) {
      return false;
    }
    return true;
  });
}

function pathEntersElba(points: GeoPt[]): boolean {
  return points.some((p) => ferryRegionOf(p) === "elba");
}

function pathReturnsToPiombinoMainland(points: GeoPt[]): boolean {
  return points.some((p) => p.lat >= 42.88 && p.lat <= 43.05 && p.lng >= 10.45 && p.lng <= 11.15);
}

/**
 * Google Directions legt Italien↔Korsika oft über Elba (Piombino–Portoferraio),
 * obwohl es keine sinnvolle Autofähre Portoferraio–Bastia gibt.
 */
export function pathUsesBogusIslandTransfer(
  points: GeoPt[],
  origin: GeoPt,
  destination: GeoPt,
  originName?: string,
  destinationName?: string
): boolean {
  if (!points.length) return false;
  const a = ferryRegionOf(origin, originName);
  const b = ferryRegionOf(destination, destinationName);
  const elbaOnPath = pathEntersElba(points);
  const piombinoOnPath = pathTouchesPiombinoCorridor(points);
  const corsicaHop = a === "corsica" || b === "corsica";
  const sardiniaHop = a === "sardinia" || b === "sardinia";

  if (a !== "elba" && b !== "elba" && (elbaOnPath || piombinoOnPath) && (corsicaHop || sardiniaHop)) {
    return true;
  }

  if ((a === "elba" && corsicaHop) || (b === "elba" && corsicaHop)) {
    const hitsCorsica = points.some((p) => ferryRegionOf(p) === "corsica");
    if (hitsCorsica && !pathReturnsToPiombinoMainland(points)) return true;
  }
  return false;
}

export function extraFerryViaPoints(origin: GeoPt, destination: GeoPt, originName?: string, destinationName?: string): GeoPt[] {
  const a = ferryRegionOf(origin, originName);
  const b = ferryRegionOf(destination, destinationName);
  const vias: GeoPt[] = [];

  const corsicaMainland =
    (a === "corsica" && (b === "mainland" || b === "unknown")) ||
    (b === "corsica" && (a === "mainland" || a === "unknown"));

  if (corsicaMainland) {
    const mainlandPt = a === "corsica" ? destination : origin;
    const livornoKm = haversineKm(mainlandPt.lat, mainlandPt.lng, LIVORNO_PORT.lat, LIVORNO_PORT.lng);
    const savonaKm = haversineKm(mainlandPt.lat, mainlandPt.lng, SAVONA_PORT.lat, SAVONA_PORT.lng);
    const port = savonaKm + 50 < livornoKm ? SAVONA_PORT : LIVORNO_PORT;
    if (haversineKm(mainlandPt.lat, mainlandPt.lng, port.lat, port.lng) > 8) {
      vias.push(port);
    }
  }

  if ((a === "elba" && b === "corsica") || (a === "corsica" && b === "elba")) {
    vias.push(PIOMBINO_PORT, LIVORNO_PORT);
  }

  return vias;
}

/** Letzter Versuch: echte Fährterminals statt Stadtzentrum, wenn Google über Elba geht. */
export function ferryTerminalRetryEndpoints(
  origin: GeoPt,
  destination: GeoPt,
  originName?: string,
  destinationName?: string
): { origin: GeoPt; destination: GeoPt } | null {
  const a = ferryRegionOf(origin, originName);
  const b = ferryRegionOf(destination, destinationName);
  const corsicaMainland =
    (a === "corsica" && (b === "mainland" || b === "unknown")) ||
    (b === "corsica" && (a === "mainland" || a === "unknown"));
  if (!corsicaMainland) return null;
  const mainlandPt = a === "corsica" ? destination : origin;
  const livornoKm = haversineKm(mainlandPt.lat, mainlandPt.lng, LIVORNO_PORT.lat, LIVORNO_PORT.lng);
  const savonaKm = haversineKm(mainlandPt.lat, mainlandPt.lng, SAVONA_PORT.lat, SAVONA_PORT.lng);
  const mainlandPort = savonaKm + 50 < livornoKm ? SAVONA_PORT : LIVORNO_PORT;
  const corsicaPort = BASTIA_PORT;
  if (a === "corsica") {
    return { origin: corsicaPort, destination: mainlandPort };
  }
  return { origin: mainlandPort, destination: corsicaPort };
}

export function toGeoPt(value: unknown): GeoPt | null {
  if (!value || typeof value !== "object") return null;
  const row = value as { lat?: unknown; lng?: unknown };
  const lat = typeof row.lat === "function" ? Number(row.lat()) : Number(row.lat);
  const lng = typeof row.lng === "function" ? Number(row.lng()) : Number(row.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function pathFromGoogleRoute(route: {
  overview_path?: unknown[];
  overview_polyline?: { points?: string } | string;
  legs?: Array<{
    start_location?: unknown;
    end_location?: unknown;
    steps?: Array<{ path?: unknown[]; start_location?: unknown; end_location?: unknown }>;
  }>;
}): GeoPt[] {
  const overview = route.overview_path || [];
  const fromOverview = overview.map(toGeoPt).filter((p): p is GeoPt => !!p);
  if (fromOverview.length >= 2) return fromOverview;

  const pts: GeoPt[] = [];
  for (const leg of route.legs || []) {
    const start = toGeoPt(leg.start_location);
    if (start) pts.push(start);
    for (const step of leg.steps || []) {
      const stepPath = (step.path || []).map(toGeoPt).filter((p): p is GeoPt => !!p);
      if (stepPath.length) pts.push(...stepPath);
      else {
        const s = toGeoPt(step.start_location);
        const e = toGeoPt(step.end_location);
        if (s) pts.push(s);
        if (e) pts.push(e);
      }
    }
    const end = toGeoPt(leg.end_location);
    if (end) pts.push(end);
  }
  return pts;
}

export function pickSaneDirectionsRoute<T>(
  routes: T[] | undefined,
  pathOf: (route: T) => GeoPt[],
  origin: GeoPt | null,
  destination: GeoPt | null,
  originName?: string,
  destinationName?: string
): T | null {
  if (!routes?.length) return null;
  for (const route of routes) {
    const path = pathOf(route);
    const o = origin || path[0];
    const d = destination || path[path.length - 1];
    if (!o || !d) continue;
    if (!pathUsesBogusIslandTransfer(path, o, d, originName, destinationName)) return route;
  }
  return null;
}

type RestRoute = {
  overview_path?: unknown[];
  overview_polyline?: { points?: string };
  legs?: Array<{ start_location?: unknown; end_location?: unknown }>;
};

function restRoutePath(route: RestRoute, decodePolyline: (encoded: string) => GeoPt[]): GeoPt[] {
  const encoded = route.overview_polyline?.points;
  if (encoded) {
    const decoded = decodePolyline(encoded);
    if (decoded.length >= 2) return decoded;
  }
  return pathFromGoogleRoute(route);
}

function restRouteEnds(route: RestRoute | undefined, path: GeoPt[]): { origin: GeoPt | null; destination: GeoPt | null } {
  const legs = route?.legs || [];
  return {
    origin: toGeoPt(legs[0]?.start_location) || path[0] || null,
    destination: toGeoPt(legs[legs.length - 1]?.end_location) || path[path.length - 1] || null,
  };
}

export function preferSaneRestDirections<T extends { routes?: RestRoute[] }>(
  data: T,
  decodePolyline: (encoded: string) => GeoPt[]
): T {
  const routes = data.routes;
  if (!routes?.length) return data;
  const pathOf = (route: RestRoute) => restRoutePath(route, decodePolyline);
  const ends = restRouteEnds(routes[0], pathOf(routes[0]));
  const picked = pickSaneDirectionsRoute(routes, pathOf, ends.origin, ends.destination);
  if (!picked || picked === routes[0]) return data;
  return { ...data, routes: [picked, ...routes.filter((r) => r !== picked)] };
}

export function restDirectionsUsesBogusIslandTransfer(
  data: { routes?: RestRoute[] } | null | undefined,
  decodePolyline: (encoded: string) => GeoPt[]
): boolean {
  const route = data?.routes?.[0];
  if (!route) return false;
  const path = restRoutePath(route, decodePolyline);
  const ends = restRouteEnds(route, path);
  if (!ends.origin || !ends.destination) return false;
  return pathUsesBogusIslandTransfer(path, ends.origin, ends.destination);
}

export function extraFerryViaFromRestResult(
  data: { routes?: RestRoute[] } | null | undefined,
  decodePolyline: (encoded: string) => GeoPt[]
): GeoPt[] {
  const route = data?.routes?.[0];
  if (!route) return [];
  const path = restRoutePath(route, decodePolyline);
  const ends = restRouteEnds(route, path);
  if (!ends.origin || !ends.destination) return [];
  return extraFerryViaPoints(ends.origin, ends.destination);
}
