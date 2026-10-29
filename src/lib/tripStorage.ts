import { Trip, RouteStop, TransportModule, ModuleRoute } from "./types";
import { hydrateTripMedia, leanTripForStorage } from "./tripMediaSidecar";
import { mergeStopsById, syncTripRouteStops } from "./tripStopMerge";
import { emergencyFreeStorageForActiveTrip } from "./localStorageCleanup";

export const TRIPS_MERGED_EVENT = "sniffertrek_trips_merged";

const STORAGE_KEY = "sniffertrek_trips";
const ACTIVE_TRIP_KEY = "sniffertrek_active_trip";

function generateId(): string {
  return `trip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function defaultStops(): RouteStop[] {
  return [
    { id: "start", name: "", type: "start" },
    { id: "end", name: "", type: "end" },
  ];
}

export function createNewTrip(name?: string): Trip {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: name || "Neue Reise",
    travelMode: "auto",
    stops: defaultStops(),
    routes: {
      route: { stops: defaultStops(), viaPoints: [] },
    },
    startDate: "",
    endDate: "",
    travelers: 2,
    modules: [],
    interests: [],
    hotels: [],
    bucketList: [],
    pdfPhotosByEtappe: {},
    pdfPhotoLibraryByEtappe: {},
    pdfCoverPhotoDataUrl: "",
    pdfCoverPhotoStyle: "belowTitle",
    pdfCoverTitleColor: "#007aff",
    pdfCoverTitleSize: 32,
    pdfCoverTitleFont: "helvetica",
    pdfCoverTitleAlign: "center",
    pdfCoverDateColor: "#007aff",
    pdfCoverDateSize: 14,
    pdfCoverDateFont: "helvetica",
    pdfCoverDateAlign: "center",
    pdfPhotoPlacementByEtappe: {},
    pdfPhotoLayoutByEtappe: {},
    pdfPhotoPagesByEtappe: {},
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function getRouteStops(trip: Trip, module: TransportModule): RouteStop[] {
  if (trip.routes?.[module]) {
    return trip.routes[module].stops;
  }
  if (module === "route") return trip.stops;
  return defaultStops();
}

export function ensureModuleRoute(trip: Trip, module: TransportModule): Trip {
  const routes = { ...trip.routes };
  if (!routes[module]) {
    routes[module] = { stops: defaultStops() };
  }
  return { ...trip, routes };
}

export function getAllTrips(): Trip[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getTrip(id: string): Trip | null {
  const trips = getAllTrips();
  return trips.find((t) => t.id === id) || null;
}

export function prepareTripForSave(trip: Trip): Trip {
  return syncTripRouteStops({ ...trip, updatedAt: new Date().toISOString() });
}

/** Trip inkl. Sidecar-Medien (Ortsfotos, PDF-Fotos) laden. */
export function loadTripHydrated(id: string): Trip | null {
  const raw = getTrip(id);
  if (!raw) return null;
  return hydrateTripMedia(syncTripRouteStops(raw));
}

const DELETED_STOPS_PREFIX = "sniffertrek_deleted_stops:";

/** Explizit gelöschte Stopps merken, damit die Save-Vereinigung sie nicht zurückholt. */
export function markStopsDeleted(tripId: string, stopIds: string[]): void {
  if (typeof window === "undefined" || !tripId || !stopIds.length) return;
  try {
    const existing = readDeletedStopIds(tripId);
    for (const id of stopIds) existing.add(id);
    const capped = [...existing].slice(-200);
    localStorage.setItem(`${DELETED_STOPS_PREFIX}${tripId}`, JSON.stringify(capped));
  } catch {
    /* ignore */
  }
}

function readDeletedStopIds(tripId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`${DELETED_STOPS_PREFIX}${tripId}`);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/**
 * Sicherheitsnetz: Einmal gespeicherte Stopps dürfen durch einen veralteten
 * Zwischenstand (Stale-Closure, Cloud-Stand, …) nie wieder verloren gehen.
 * Nur explizit gelöschte Stopps (markStopsDeleted) bleiben gelöscht.
 */
function unionWithStoredStops(trip: Trip): Trip {
  const stored = getTrip(trip.id);
  if (!stored) return trip;
  const tombstoned = readDeletedStopIds(trip.id);
  const keep = (stops: RouteStop[]) => stops.filter((s) => !tombstoned.has(s.id));

  let next: Trip = { ...trip, stops: mergeStopsById(trip.stops, keep(stored.stops)) };

  if (trip.routes && stored.routes) {
    const routes = { ...trip.routes };
    for (const key of Object.keys(routes) as (keyof typeof routes)[]) {
      if (key === "routingOptions" || key === "bookedFlights") continue;
      const incoming = routes[key];
      const old = stored.routes[key];
      if (incoming && old && "stops" in incoming && "stops" in old && incoming.stops && old.stops) {
        routes[key] = { ...incoming, stops: mergeStopsById(incoming.stops, keep(old.stops)) };
      }
    }
    next = { ...next, routes };
  }
  return next;
}

export function saveTrip(trip: Trip): boolean {
  if (typeof window === "undefined") return false;
  const prepared = prepareTripForSave(unionWithStoredStops(trip));
  const { trip: lean, mediaOk } = leanTripForStorage(prepared);

  const write = (): boolean => {
    const trips = getAllTrips();
    const idx = trips.findIndex((t) => t.id === lean.id);
    if (idx >= 0) {
      trips[idx] = lean;
    } else {
      trips.unshift(lean);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
    return true;
  };

  try {
    write();
    return mediaOk;
  } catch (err) {
    // Quota voll (Routen-Cache, alte Sidecars …): Platz freiräumen und erneut versuchen,
    // statt die Reise – inkl. eigener Bilder – still zu verlieren.
    console.warn("[saveTrip] localStorage voll – räume auf und versuche erneut", err);
    try {
      emergencyFreeStorageForActiveTrip(lean.id, getAllTrips().map((t) => t.id));
    } catch {
      /* ignore */
    }
    try {
      write();
      return mediaOk;
    } catch (err2) {
      console.warn("[saveTrip] localStorage failed", err2);
      return false;
    }
  }
}

export function notifyTripsMerged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TRIPS_MERGED_EVENT));
}

export function deleteTrip(id: string): void {
  if (typeof window === "undefined") return;
  const trips = getAllTrips().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));

  if (getActiveTripId() === id) {
    clearActiveTripId();
  }
}

export function clearAllTrips(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_TRIP_KEY);
}

export function getActiveTripId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_TRIP_KEY);
}

export function setActiveTripId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_TRIP_KEY, id);
}

export function clearActiveTripId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVE_TRIP_KEY);
}

export function getTripDisplayName(trip: Trip): string {
  if (trip.name && trip.name !== "Neue Reise") return trip.name;
  const start = trip.stops.find((s) => s.type === "start")?.name;
  const end = trip.stops.find((s) => s.type === "end")?.name;
  if (start && end) return `${start} → ${end}`;
  return trip.name || "Neue Reise";
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  const d = parseLocalDate(dateStr);
  return d.toLocaleDateString("de-CH", {
    day: "numeric",
    month: "short",
  });
}

export function setTripEndDestination(trip: Trip, destination: string): Trip {
  const stops = trip.stops.map((stop) =>
    stop.type === "end" ? { ...stop, name: destination } : stop,
  );
  return {
    ...trip,
    stops,
    updatedAt: new Date().toISOString(),
  };
}
