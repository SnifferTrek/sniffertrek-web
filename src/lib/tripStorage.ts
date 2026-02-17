import { Trip, RouteStop } from "./types";

const STORAGE_KEY = "sniffertrek_trips";
const ACTIVE_TRIP_KEY = "sniffertrek_active_trip";

function generateId(): string {
  return `trip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function createNewTrip(name?: string): Trip {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    name: name || "Neue Reise",
    travelMode: "auto",
    stops: [
      { id: "start", name: "", type: "start" },
      { id: "end", name: "", type: "end" },
    ],
    startDate: "",
    endDate: "",
    travelers: 2,
    hotels: [],
    bucketList: [],
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
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

export function saveTrip(trip: Trip): void {
  if (typeof window === "undefined") return;
  const trips = getAllTrips();
  const idx = trips.findIndex((t) => t.id === trip.id);
  const updated = { ...trip, updatedAt: new Date().toISOString() };

  if (idx >= 0) {
    trips[idx] = updated;
  } else {
    trips.unshift(updated);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

export function deleteTrip(id: string): void {
  if (typeof window === "undefined") return;
  const trips = getAllTrips().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));

  if (getActiveTripId() === id) {
    clearActiveTripId();
  }
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
  const start = trip.stops.find((s) => s.type === "start")?.name;
  const end = trip.stops.find((s) => s.type === "end")?.name;

  if (start && end) {
    return `${start} → ${end}`;
  }
  return trip.name;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-CH", {
    day: "numeric",
    month: "short",
  });
}
