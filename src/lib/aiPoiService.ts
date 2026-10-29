import { AiPoiSuggestion, Etappe, TravelInterest, RouteStop } from "./types";
import { extractCityFromAddress } from "./etappeUtils";

export interface AiPoiRequest {
 etappes: Etappe[];
 interests: TravelInterest[];
 travelMode: string;
 stops: RouteStop[];
 etappeIndex?: number;
 searchRegion?: string;
 searchLat?: number;
 searchLng?: number;
 searchRadiusKm?: number;
 /** Gebietssuche ohne Autoroute (Planer «Gebiet suchen») */
 regionOnly?: boolean;
 language?: string;
}

function normalizePlaceKey(name: string): string {
 return name.toLowerCase().trim().replace(/\s+/g, " ");
}

function findStopCoords(name: string, stops: RouteStop[]): { lat?: number; lng?: number } {
 const key = normalizePlaceKey(name);
 if (!key) return {};

 for (const s of stops) {
 const stopKey = normalizePlaceKey(s.name);
 if (
 stopKey === key ||
 stopKey.startsWith(key) ||
 key.startsWith(stopKey) ||
 (s.bookingAddress && normalizePlaceKey(extractCityFromAddress(s.bookingAddress)) === key)
 ) {
 return { lat: s.lat, lng: s.lng };
 }
 }
 return {};
}

/** Alle Zwischen- und Zielpunkte der Etappe (inkl. Hotel-Stopps) für KI-Anker. */
function buildEtappeRouteStops(e: Etappe, stops: RouteStop[]): Array<{ name: string; lat?: number; lng?: number }> {
 const seen = new Set<string>();
 const out: Array<{ name: string; lat?: number; lng?: number }> = [];

 const push = (name: string) => {
 const n = name.trim();
 if (!n) return;
 const k = normalizePlaceKey(n);
 if (seen.has(k)) return;
 seen.add(k);
 out.push({ name: n, ...findStopCoords(n, stops) });
 };

 push(e.from);
 for (const leg of e.legs) {
 push(leg.to);
 }
 push(e.to);

 if (e.hotelName?.trim()) {
 const hotelLabel = e.hotelAddress
 ? `${e.hotelName.trim()}, ${extractCityFromAddress(e.hotelAddress)}`
 : e.hotelName.trim();
 push(hotelLabel);
 }

 return out;
}

export async function fetchAiPois(req: AiPoiRequest): Promise<AiPoiSuggestion[]> {
 const etappePayload = req.etappes.map((e) => {
 const fromCoords = findStopCoords(e.from, req.stops);
 const toCoords = findStopCoords(e.to, req.stops);
 const routeStops = buildEtappeRouteStops(e, req.stops);
 const viaStops = routeStops.filter(
 (v) =>
 normalizePlaceKey(v.name) !== normalizePlaceKey(e.from) &&
 normalizePlaceKey(v.name) !== normalizePlaceKey(e.to)
 );

 return {
 from: e.from,
 to: e.to,
 fromLat: fromCoords.lat,
 fromLng: fromCoords.lng,
 toLat: toCoords.lat,
 toLng: toCoords.lng,
 viaStops,
 overnightAt: e.hotelName || e.hotelAddress ? e.to : undefined,
 routeStops,
 };
 });

 const response = await fetch("/api/ai-pois", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 etappes: etappePayload,
 interests: req.interests,
 travelMode: req.travelMode,
 etappeIndex: req.etappeIndex,
 searchRegion: req.searchRegion,
 searchLat: req.searchLat,
 searchLng: req.searchLng,
 searchRadiusKm: req.searchRadiusKm,
 regionOnly: req.regionOnly === true,
 language: req.language,
 }),
 });

 if (!response.ok) {
 const err = await response.json().catch(() => ({}));
 throw new Error(err.error || "AI POI request failed");
 }

 const data = await response.json();
 return (data.suggestions || []).map((s: Record<string, unknown>) => {
 const highlights = Array.isArray(s.highlights)
 ? s.highlights.map((h) => String(h || "").trim()).filter(Boolean).slice(0, 5)
 : [];
 const whyHere = typeof s.whyHere === "string" ? s.whyHere.trim() : "";
 const visitTip = typeof s.visitTip === "string" ? s.visitTip.trim() : "";
 const baseDescription = String(s.description || "").trim();
 const description = [baseDescription, whyHere, visitTip].filter(Boolean).join(" ");
 return {
 name: String(s.name || ""),
 description,
 category: String(s.category || "Sehenswürdigkeit"),
 detourMinutes: typeof s.detourMinutes === "number" ? s.detourMinutes : undefined,
 lat: typeof s.lat === "number" ? s.lat : undefined,
 lng: typeof s.lng === "number" ? s.lng : undefined,
 etappeIndex: typeof s.etappeIndex === "number" ? s.etappeIndex : 0,
 highlights: highlights.length > 0 ? highlights : undefined,
 };
 });
}
