import { isDrivingRouteStop, type Etappe, type RouteLegInfo, type RouteStop, type ViaPoint } from "@/lib/types";

const GENERIC_ETAPPE_LABELS = new Set(["start", "ziel", ""]);

export function isGenericEtappePlaceLabel(name: string | undefined): boolean {
 return GENERIC_ETAPPE_LABELS.has((name || "").trim().toLowerCase());
}

/** Via-Stopovers erzeugen Extra-Google-Legs; auf echte Stopp-Paare zusammenfassen. */
export function collapseViaInflatedLegs(
 legs: RouteLegInfo[],
 stops: RouteStop[],
 viaPoints?: ViaPoint[] | null
): RouteLegInfo[] {
 const named = (stops || []).filter((s) => (s.name || "").trim() && isDrivingRouteStop(s));
 const hops = named.length - 1;
 if (hops <= 0 || !legs.length) return legs;
 const vias = (viaPoints || []).filter((vp) => Number.isFinite(vp.lat) && Number.isFinite(vp.lng));
 if (vias.length === 0 || legs.length <= hops) return legs;

 let gi = 0;
 const out: RouteLegInfo[] = [];
 for (let i = 0; i < hops; i++) {
  const viaAfter = vias.filter((vp) => vp.afterStopId === named[i].id).length;
  const n = Math.max(1, 1 + viaAfter);
  let distanceMeters = 0;
  let durationSeconds = 0;
  for (let k = 0; k < n && gi < legs.length; k++, gi++) {
   distanceMeters += legs[gi].distanceMeters || 0;
   durationSeconds += legs[gi].durationSeconds || 0;
  }
  out.push({
   from: named[i].name,
   to: named[i + 1].name,
   distanceMeters,
   durationSeconds,
  });
 }
 return out;
}

function resolveStartName(stops: RouteStop[], legs: RouteLegInfo[]): string {
 const fromStop = stops.find((s) => s.type === "start");
 if (fromStop?.name?.trim()) return fromStop.name.trim();
 if (legs[0]?.from?.trim()) return legs[0].from.trim();
 const firstNamed = stops.find((s) => s.name.trim());
 return firstNamed?.name.trim() || "Start";
}

function resolveEndName(stops: RouteStop[], legs: RouteLegInfo[]): string {
 const endStop = stops.find((s) => s.type === "end");
 if (endStop?.name?.trim()) return endStop.name.trim();
 if (legs.length > 0 && legs[legs.length - 1]?.to?.trim()) {
 return legs[legs.length - 1].to.trim();
 }
 const named = stops.filter((s) => s.name.trim());
 return named[named.length - 1]?.name.trim() || "Ziel";
}

/** Ersetzt Platzhalter «Start»/«Ziel» durch Leg- oder Stoppnamen (PDF, Karten). */
export function normalizeEtappePlaceNames(etappe: Etappe, stops: RouteStop[]): Etappe {
 let from = etappe.from;
 let to = etappe.to;
 if (isGenericEtappePlaceLabel(from)) {
 from = etappe.legs[0]?.from?.trim() || resolveStartName(stops, etappe.legs);
 }
 if (isGenericEtappePlaceLabel(to)) {
 to = etappe.legs[etappe.legs.length - 1]?.to?.trim() || resolveEndName(stops, etappe.legs);
 }
 if (from === to && etappe.legs.length > 0) {
 from = etappe.legs[0]?.from?.trim() || from;
 to = etappe.legs[etappe.legs.length - 1]?.to?.trim() || to;
 }
 return from === etappe.from && to === etappe.to ? etappe : { ...etappe, from, to };
}

/** Anzeige-/KI-Label: eingegebener Stoppname, nicht nur PLZ-Stadt. */
export function formatEtappePlaceName(stop: RouteStop | undefined, legLabel: string): string {
 const leg = (legLabel || "").trim();
 if (!stop) return extractCityFromAddress(leg);
 const name = stop.name.trim();
 if (name) return name;
 if (stop.bookingHotelName?.trim()) {
 const city = stop.bookingAddress ? extractCityFromAddress(stop.bookingAddress) : "";
 return city ? `${stop.bookingHotelName.trim()}, ${city}` : stop.bookingHotelName.trim();
 }
 if (stop.bookingAddress?.trim()) return extractCityFromAddress(stop.bookingAddress);
 return extractCityFromAddress(leg);
}

/**
 * Kurzer Ort für Etappengrenzen (Übernachtung): Stadt/Hotel, nicht langer POI-Titel.
 * z. B. «Goms» statt «Grand Tour … Foto-Spot … in Goms».
 */
export function formatEtappeOvernightPlace(stop: RouteStop | undefined, legLabel: string): string {
 if (!stop) return extractCityFromAddress(legLabel);
 const fromAddr = stop.bookingAddress ? extractCityFromAddress(stop.bookingAddress) : "";
 if (fromAddr) return fromAddr;

 const name = stop.name.trim();
 const inPlace = name.match(/\bin\s+([^,–—-]+)\s*$/i);
 if (inPlace?.[1]) return inPlace[1].trim();

 if (stop.bookingHotelName?.trim()) return stop.bookingHotelName.trim();

 const cityFromName = extractCityFromAddress(name);
 if (cityFromName && cityFromName.length <= 40) return cityFromName;
 if (name.length > 40 && cityFromName) return cityFromName;

 return formatEtappePlaceName(stop, legLabel);
}

export function extractCityFromAddress(addr: string): string {
 const line = (addr || "").split("\n")[0];
 const plzMatch = line.match(/\b\d{4,5}\s+([^,\n]+)/);
 if (plzMatch) return plzMatch[1].trim();
 const parts = line.split(",").map((p) => p.trim());
 if (parts.length >= 3) {
 if (/^\d/.test(parts[0]) || /\b(strasse|straße|weg|gasse|rue|route|via|avenue|road|str\.|chemin|place|boulevard|blvd)\b/i.test(parts[0])) {
 return parts[1].replace(/^\d{4,5}\s*/, "").trim();
 }
 }
 return parts[0].trim();
}

function formatDur(seconds: number): string {
 const h = Math.floor(seconds / 3600);
 const m = Math.round((seconds % 3600) / 60);
 if (h > 0) return `${h}h ${m}min`;
 return `${m}min`;
}

/** Etappen aus berechneter Route (wie Planer-Tab Autoroute). */
export function buildEtappenFromRoute(
 stops: RouteStop[],
 legs: RouteLegInfo[]
): Etappe[] {
 if (!legs.length) return [];

 const namedStops = stops.filter((s) => s.name.trim() && isDrivingRouteStop(s));
 const hotelStops = namedStops.filter((s) => s.type === "stop" && !!s.isHotel);

 if (hotelStops.length === 0) {
 const totalKm = legs.reduce((sum, l) => sum + l.distanceMeters, 0);
 const totalSec = legs.reduce((sum, l) => sum + l.durationSeconds, 0);
 const startName = resolveStartName(stops, legs);
 const endName = resolveEndName(stops, legs);
 return [
 {
 index: 0,
 label: "Etappe 1",
 from: startName,
 to: endName,
 legs,
 distanceKm: Math.round(totalKm / 1000),
 durationFormatted: formatDur(totalSec),
 },
 ];
 }

 const result: Etappe[] = [];
 let currentLegs: RouteLegInfo[] = [];
 let etappeIdx = 0;
 const startName = resolveStartName(stops, legs);
 let etappeFrom = startName;

 for (let legIdx = 0; legIdx < legs.length; legIdx++) {
 const leg = legs[legIdx];
 currentLegs.push(leg);
 const toStop = namedStops[legIdx + 1];
 const isHotelSplitPoint = !!toStop && toStop.type === "stop" && !!toStop.isHotel;

 if (isHotelSplitPoint) {
 const km = currentLegs.reduce((s, l) => s + l.distanceMeters, 0);
 const sec = currentLegs.reduce((s, l) => s + l.durationSeconds, 0);
 const overnightPlace = formatEtappeOvernightPlace(toStop, leg.to);
 result.push({
 index: etappeIdx,
 label: `Etappe ${etappeIdx + 1}`,
 from: etappeFrom,
 to: overnightPlace,
 legs: [...currentLegs],
 distanceKm: Math.round(km / 1000),
 durationFormatted: formatDur(sec),
 hotelBooked: !!toStop.hotelBooked,
 hotelName: toStop.bookingHotelName,
 hotelAddress: toStop.bookingAddress,
 hotelNights: toStop.hotelNights,
 });
 etappeFrom = overnightPlace;
 currentLegs = [];
 etappeIdx++;
 }
 }

 if (currentLegs.length > 0) {
 const km = currentLegs.reduce((s, l) => s + l.distanceMeters, 0);
 const sec = currentLegs.reduce((s, l) => s + l.durationSeconds, 0);
 const endName = resolveEndName(stops, currentLegs);
 result.push({
 index: etappeIdx,
 label: `Etappe ${etappeIdx + 1}`,
 from: etappeFrom,
 to: endName,
 legs: [...currentLegs],
 distanceKm: Math.round(km / 1000),
 durationFormatted: formatDur(sec),
 });
 }

 return result;
}

/** Fallback wenn Route noch nicht berechnet, aber Stopps/Hotels gesetzt sind. */
export function buildFallbackEtappenFromStops(stops: RouteStop[]): Etappe[] {
 const named = stops.filter((s) => s.name.trim() && isDrivingRouteStop(s));
 if (named.length < 2) return [];

 const startName = named.find((s) => s.type === "start")?.name || named[0].name;
 const endName = named.find((s) => s.type === "end")?.name || named[named.length - 1].name;
 const hotelStops = named.filter((s) => s.type === "stop" && !!s.isHotel);

 if (hotelStops.length === 0) {
 return [
 {
 index: 0,
 label: "Etappe 1",
 from: startName,
 to: endName,
 legs: [],
 distanceKm: 0,
 durationFormatted: "—",
 },
 ];
 }

 const result: Etappe[] = [];
 let etappeFrom = startName;
 let etappeIdx = 0;

 for (const stop of named) {
 if (stop.type !== "stop" || !stop.isHotel) continue;
 const toName = formatEtappeOvernightPlace(stop, stop.bookingAddress || stop.name);
 result.push({
 index: etappeIdx,
 label: `Etappe ${etappeIdx + 1}`,
 from: etappeFrom,
 to: toName,
 legs: [],
 distanceKm: 0,
 durationFormatted: "—",
 hotelBooked: !!stop.hotelBooked,
 hotelName: stop.bookingHotelName,
 hotelAddress: stop.bookingAddress,
 hotelNights: stop.hotelNights,
 });
 etappeFrom = toName;
 etappeIdx++;
 }

 if (etappeFrom !== endName) {
 result.push({
 index: etappeIdx,
 label: `Etappe ${etappeIdx + 1}`,
 from: etappeFrom,
 to: endName,
 legs: [],
 distanceKm: 0,
 durationFormatted: "—",
 });
 }

 return result;
}

export function resolveEtappenForExport(
 stops: RouteStop[],
 legs: RouteLegInfo[] | undefined | null
): Etappe[] {
 const fromRoute = legs?.length ? buildEtappenFromRoute(stops, legs) : [];
 if (fromRoute.length > 0) return fromRoute;
 return buildFallbackEtappenFromStops(stops);
}

export function formatEtappenCountLabel(count: number): string {
 if (count <= 0) return "Route im Tab Autoroute berechnen";
 if (count === 1) return "1 Etappe";
 return `${count} Etappen`;
}

export function formatEtappeKmLabel(distanceKm: number): string {
 return distanceKm > 0 ? `${distanceKm.toLocaleString("de-CH")} km` : "km —";
}

function placeKey(name: string): string {
 return (name || "")
 .toLowerCase()
 .normalize("NFD")
 .replace(/[\u0300-\u036f]/g, "")
 .replace(/[^a-z0-9]+/g, " ")
 .trim();
}

function etappeNamesMatch(a: string, b: string): boolean {
 const ka = placeKey(a);
 const kb = placeKey(b);
 if (!ka || !kb) return false;
 if (ka === kb) return true;
 if (ka.includes(kb) || kb.includes(ka)) return true;
 const cityA = placeKey(extractCityFromAddress(a));
 const cityB = placeKey(extractCityFromAddress(b));
 if (cityA && cityB && (cityA === cityB || cityA.includes(cityB) || cityB.includes(cityA))) return true;
 return false;
}

function stopMatchesEtappeLabel(stop: RouteStop, label: string): boolean {
 if (etappeNamesMatch(stop.name, label)) return true;
 if (stop.bookingAddress && etappeNamesMatch(extractCityFromAddress(stop.bookingAddress), label)) return true;
 if (stop.bookingHotelName && etappeNamesMatch(stop.bookingHotelName, label)) return true;
 const inPlace = stop.name.match(/\bin\s+([^,–—-]+)\s*$/i);
 if (inPlace?.[1] && etappeNamesMatch(inPlace[1], label)) return true;
 return false;
}

/**
 * Index-Bereich der Stopps einer Etappe in der Routenliste (für POI-Einfügen nur in diesem Abschnitt).
 * Bei Rundreisen: sequentiell vorwärts matchen, damit Start≠Ziel korrekt bleibt.
 */
export function findEtappeStopIndexRange(
 stops: RouteStop[],
 etappe: Etappe
): { startIdx: number; endIdx: number } | null {
 const chainNames = [etappe.from, ...etappe.legs.map((l) => l.to)];
 if (chainNames.length < 2 && etappe.to) {
 chainNames.push(etappe.to);
 }
 const uniqueChain: string[] = [];
 for (const name of chainNames) {
 const t = name.trim();
 if (!t) continue;
 if (uniqueChain.length && etappeNamesMatch(uniqueChain[uniqueChain.length - 1], t)) continue;
 uniqueChain.push(t);
 }
 if (uniqueChain.length < 2) return null;

 const matched: number[] = [];
 let searchFrom = 0;
 for (const label of uniqueChain) {
 let found = -1;
 for (let i = searchFrom; i < stops.length; i++) {
 if (!stops[i].name.trim()) continue;
 if (stopMatchesEtappeLabel(stops[i], label)) {
 found = i;
 break;
 }
 }
 if (found < 0) continue;
 matched.push(found);
 searchFrom = found + 1;
 }
 if (matched.length < 2) return null;
 return { startIdx: matched[0], endIdx: matched[matched.length - 1] };
}

