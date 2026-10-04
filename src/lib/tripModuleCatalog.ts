import {
 Car,
 Plane,
 Hotel,
 Compass,
 BookmarkPlus,
 Train,
 Smartphone,
 Shield,
 BedDouble,
 Navigation,
 Zap,
 Globe,
 Clock,
 Map as MapIcon,
} from "lucide-react";
import type { TripModule } from "@/lib/types";

/**
 * Wenn `trip.modules` fehlt oder leer ist: Standard-Tabs des Planers
 * (gleiche Sicht für Owner und Mitbearbeitende nach Sync).
 */
export const PLANER_DEFAULT_MODULES: TripModule[] = [
  "flights",
  "route",
  "car",
  "hotels",
  "report",
  "bucket",
];

/** @deprecated Alias – bitte `PLANER_DEFAULT_MODULES` / `effectiveTripModules` nutzen. */
export const PLANER_FALLBACK_MODULES: TripModule[] = PLANER_DEFAULT_MODULES;

export const MODULE_LABEL: Record<string, string> = {
 route: "Auto",
 flights: "Flug",
 hotels: "Unterkunft",
 poi: "Entdecken",
 bucket: "Bucket List",
 car: "Mietwagen",
 train: "Zug",
 esim: "eSIM",
 insurance: "Versicherung",
 cruise: "Kreuzfahrt",
 lastminute: "Last Minute",
 apartment: "Ferienwohnung",
 camping: "Camping",
 activities: "Aktivitäten",
 droneMaps: "Drohnenkarten",
};

export type ModuleCatalogItem = {
 id: TripModule;
 name: string;
 desc: string;
 icon: typeof Car;
 active: boolean;
 img: string;
};

/** Reihenfolge der Kacheln auf /reise-planen (Raster zeilenweise). */
export const MODULE_CATALOG: ModuleCatalogItem[] = [
 // Zeile 1: Unterkunft – Flug – Mietwagen – Last Minute
 {
 id: "hotels",
 name: "Unterkunft",
 desc: "Unterkünfte vergleichen",
 icon: Hotel,
 active: true,
 img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
 },
 {
 id: "flights",
 name: "Flug",
 desc: "Flugsuche & Vergleich",
 icon: Plane,
 active: true,
 img: "https://images.unsplash.com/photo-1476041800959-2f6bb412c8ce?auto=format&fit=crop&w=600&q=82",
 },
 {
 id: "car",
 name: "Mietwagen",
 desc: "Mietwagen buchen",
 icon: Car,
 active: true,
 img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80",
 },
 {
 id: "lastminute",
 name: "Last Minute",
 desc: "Spontane Angebote",
 icon: Clock,
 active: true,
 img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
 },
 // Zeile 2: Autoroute – Aktivitäten – Ferienwohnung – Camping
 {
 id: "route",
 name: "Autoroute",
 desc: "Strassenroute mit Karte",
 icon: Car,
 active: true,
 img: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80",
 },
 {
 id: "activities",
 name: "Aktivitäten",
 desc: "Touren & Erlebnisse",
 icon: Zap,
 active: false,
 img: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80",
 },
 {
 id: "apartment",
 name: "Ferienwohnung",
 desc: "Airbnb & Co.",
 icon: BedDouble,
 active: false,
 img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80",
 },
 {
 id: "camping",
 name: "Camping",
 desc: "Campingplätze",
 icon: Navigation,
 active: false,
 img: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80",
 },
 // Weitere Module
 {
 id: "poi",
 name: "Entdecken",
 desc: "KI-Empfehlungen & POIs",
 icon: Compass,
 active: false,
 img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80",
 },
 {
 id: "bucket",
 name: "Bucket List",
 desc: "1'488 Sehenswürdigkeiten",
 icon: BookmarkPlus,
 active: true,
 img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80",
 },
 {
 id: "train",
 name: "Zug",
 desc: "Zugverbindungen",
 icon: Train,
 active: true,
 img: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&q=80",
 },
 {
 id: "esim",
 name: "eSIM",
 desc: "Mobiles Internet",
 icon: Smartphone,
 active: true,
 img: "https://images.unsplash.com/photo-1526512340740-9217d0159da9?w=600&q=80",
 },
 {
 id: "droneMaps",
 name: "Drohnenkarten",
 desc: "Behördenlinks EU, EWR, UK, CH u. a.",
 icon: MapIcon,
 active: true,
 img: "https://images.unsplash.com/photo-1473968512649-78ef87b5be78?w=600&q=80",
 },
 {
 id: "insurance",
 name: "Versicherung",
 desc: "Reiseversicherung",
 icon: Shield,
 active: true,
 img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80",
 },
 {
 id: "cruise",
 name: "Kreuzfahrt",
 desc: "Schiffsreisen",
 icon: Globe,
 active: false,
 img: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&q=80",
 },
];

const KNOWN_TRIP_MODULES = new Set<TripModule>([
 "route",
 "flights",
 "hotels",
 "car",
 "train",
 "poi",
 "report",
 "bucket",
 "esim",
 "droneMaps",
 "insurance",
 "cruise",
 "lastminute",
 "apartment",
 "camping",
 "activities",
]);

/**
 * Logische Planer-Reihenfolge:
 * Transportmittel → Mietwagen → Hotel → Entdecken → Rest
 */
export const MODULE_JOURNEY_ORDER: TripModule[] = [
 "flights",
 "train",
 "route",
 "car",
 "hotels",
 "poi",
 "lastminute",
 "apartment",
 "camping",
 "activities",
 "esim",
 "insurance",
 "droneMaps",
 "cruise",
 "bucket",
 "report",
];

const TRIP_MODULE_BY_LOWER = new Map<string, TripModule>(
 [...KNOWN_TRIP_MODULES].map((id) => [id.toLowerCase(), id])
);

const MODULE_JOURNEY_INDEX = new Map<string, number>(
 MODULE_JOURNEY_ORDER.map((id, i) => [id, i])
);

/** Module in Reise-Reihenfolge sortieren (Transport → Mietwagen → Hotel → Entdecken). */
export function sortTripModulesByJourney(modules: TripModule[]): TripModule[] {
 return [...modules].sort((a, b) => {
 const ia = MODULE_JOURNEY_INDEX.get(a) ?? 900;
 const ib = MODULE_JOURNEY_INDEX.get(b) ?? 900;
 if (ia !== ib) return ia - ib;
 return a.localeCompare(b);
 });
}

/** Nur gültige `TripModule`-Strings, Duplikate entfernen, Reise-Reihenfolge. */
export function sanitizeTripModules(raw: unknown): TripModule[] | undefined {
 if (!Array.isArray(raw)) return undefined;
 const out: TripModule[] = [];
 const seen = new Set<string>();
 for (const entry of raw) {
 const key = typeof entry === "string" ? entry.trim().toLowerCase() : "";
 if (!key || seen.has(key)) continue;
 const canonical = TRIP_MODULE_BY_LOWER.get(key);
 if (!canonical) continue;
 seen.add(key);
 out.push(canonical);
 }
 if (out.length === 0) return undefined;
 return sortTripModulesByJourney(out);
}

/** Modul in der Katalog-Kachel aktiv (z. B. Entdecken vorübergehend deaktiviert). */
export function isCatalogModuleActive(id: TripModule | string): boolean {
 const item = MODULE_CATALOG.find((m) => m.id === id);
 return item?.active ?? true;
}

/** Effektive Module einer Reise (gespeichert oder Planer-Standard). */
export function effectiveTripModules(modules: unknown): TripModule[] {
  const cleaned = sanitizeTripModules(modules);
  if (cleaned?.length) return cleaned;
  return [...PLANER_DEFAULT_MODULES];
}

/** Entspricht dem Planer-Standard-Satz (alle Default-Tabs)? */
export function isPlanerDefaultModules(modules: unknown): boolean {
  const cleaned = sanitizeTripModules(modules);
  if (!cleaned || cleaned.length !== PLANER_DEFAULT_MODULES.length) return false;
  const set = new Set(cleaned);
  return PLANER_DEFAULT_MODULES.every((m) => set.has(m));
}

/**
 * Module beim Merge: nie leer über befüllt; Custom vor Default;
 * Mitbearbeitende bevorzugen Cloud.
 */
export function pickMergedModules(opts: {
  localMods: unknown;
  cloudMods: unknown;
  localTime: number;
  cloudTime: number;
  preferCloud: boolean;
}): TripModule[] {
  const local = sanitizeTripModules(opts.localMods) || [];
  const cloud = sanitizeTripModules(opts.cloudMods) || [];

  if (opts.preferCloud) {
    if (cloud.length) return cloud;
    if (local.length) return local;
    return [];
  }

  if (local.length && !cloud.length) return local;
  if (cloud.length && !local.length) return cloud;
  if (!local.length && !cloud.length) return [];

  // Custom-Satz schlägt den aufgeblasenen Standard (wichtig nach Share-Sync).
  if (isPlanerDefaultModules(cloud) && !isPlanerDefaultModules(local)) return local;
  if (isPlanerDefaultModules(local) && !isPlanerDefaultModules(cloud)) return cloud;

  return opts.localTime >= opts.cloudTime ? local : cloud;
}
