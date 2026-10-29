import { buildTripMapsCostEstimate, type TripMapsCostEstimate } from "./mapsPricingChf";

const STORAGE_KEY = "sniffertrek_maps_billable_usage_v1";

export type PdfMapsBillingAccumulator = {
 staticMapRequests: number;
 directionsRequests: number;
};

type Persisted = {
 monthKey: string;
 /** Nur dieser Browser / Gerät — kein Ersatz für GCP-Rechnung. */
 monthDirections: number;
 monthStaticMaps: number;
 trips: Record<string, { directions: number; staticMaps: number }>;
};

function monthKeyNow(): string {
 const d = new Date();
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function readRaw(): Persisted {
 if (typeof window === "undefined") {
 return { monthKey: "", monthDirections: 0, monthStaticMaps: 0, trips: {} };
 }
 try {
 const raw = window.localStorage.getItem(STORAGE_KEY);
 if (!raw) {
 return { monthKey: monthKeyNow(), monthDirections: 0, monthStaticMaps: 0, trips: {} };
 }
 const p = JSON.parse(raw) as Persisted;
 if (!p || typeof p !== "object") throw new Error("bad");
 return {
 monthKey: typeof p.monthKey === "string" ? p.monthKey : monthKeyNow(),
 monthDirections: Math.max(0, Number(p.monthDirections) || 0),
 monthStaticMaps: Math.max(0, Number(p.monthStaticMaps) || 0),
 trips: p.trips && typeof p.trips === "object" ? p.trips : {},
 };
 } catch {
 return { monthKey: monthKeyNow(), monthDirections: 0, monthStaticMaps: 0, trips: {} };
 }
}

function writeRaw(p: Persisted): void {
 if (typeof window === "undefined") return;
 try {
 window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
 } catch {
 /* quota */
 }
}

function ensureMonth(p: Persisted): Persisted {
 const mk = monthKeyNow();
 if (p.monthKey === mk) return p;
 return {
 monthKey: mk,
 monthDirections: 0,
 monthStaticMaps: 0,
 trips: {},
 };
}

function bumpTrip(p: Persisted, tripId: string, d: number, s: number): Persisted {
 const cur = p.trips[tripId] || { directions: 0, staticMaps: 0 };
 const nextTrips = {
 ...p.trips,
 [tripId]: {
 directions: Math.max(0, cur.directions + d),
 staticMaps: Math.max(0, cur.staticMaps + s),
 },
 };
 return {
 ...p,
 monthDirections: Math.max(0, p.monthDirections + d),
 monthStaticMaps: Math.max(0, p.monthStaticMaps + s),
 trips: nextTrips,
 };
}

/** Live-Directions (z. B. „Route aktualisieren“) für die Reise buchen. */
export function recordTripDirectionsUsage(tripId: string, liveCalls: number): void {
 const n = Math.max(0, Math.floor(Number(liveCalls) || 0));
 if (!tripId || n === 0) return;
 const p0 = ensureMonth(readRaw());
 writeRaw(bumpTrip(p0, tripId, n, 0));
}

/** PDF-Erzeugung: Static Maps + ggf. Directions (REST/JS) buchen. */
export function recordTripPdfMapsUsage(tripId: string, acc: PdfMapsBillingAccumulator): void {
 if (!tripId) return;
 const d = Math.max(0, Math.floor(acc.directionsRequests || 0));
 const s = Math.max(0, Math.floor(acc.staticMapRequests || 0));
 if (d === 0 && s === 0) return;
 const p0 = ensureMonth(readRaw());
 writeRaw(bumpTrip(p0, tripId, d, s));
}

export function getTripMapsCostEstimate(tripId: string): TripMapsCostEstimate {
 const p = ensureMonth(readRaw());
 const t = p.trips[tripId] || { directions: 0, staticMaps: 0 };
 return buildTripMapsCostEstimate(t.directions, t.staticMaps, p.monthDirections, p.monthStaticMaps);
}

/** Monatliche Summen zurücksetzen (optional für Tests / manuell). */
export function resetMapsUsageTracking(): void {
 writeRaw({ monthKey: monthKeyNow(), monthDirections: 0, monthStaticMaps: 0, trips: {} });
}
