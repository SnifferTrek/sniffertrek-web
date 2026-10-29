import type { RouteStop, Trip } from "./types";

function normalizePlaceKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

/** Erstes Element = Start, letztes = Ziel, dazwischen = Zwischenstopps. IDs und Felder bleiben erhalten. */
export function assignStopRoles(stops: RouteStop[]): RouteStop[] {
  if (stops.length === 0) return stops;
  return stops.map((s, i) => {
    const type: RouteStop["type"] =
      i === 0 ? "start" : i === stops.length - 1 ? "end" : "stop";
    return s.type === type ? s : { ...s, type };
  });
}

export function isActiveRouteStopInsert(
  dragId: string,
  insertIndex: number,
  stops: RouteStop[]
): boolean {
  const fromIdx = stops.findIndex((s) => s.id === dragId);
  if (fromIdx < 0) return false;
  return insertIndex !== fromIdx && insertIndex !== fromIdx + 1;
}

export function resolveRouteStopInsertIndex(
  stopIndex: number,
  clientY: number,
  rowTop: number,
  rowHeight: number,
  stopCount: number
): number {
  const after = clientY > rowTop + rowHeight / 2;
  const raw = after ? stopIndex + 1 : stopIndex;
  return Math.max(0, Math.min(stopCount, raw));
}

export function reorderStopsToInsertIndex(
  stops: RouteStop[],
  dragId: string,
  insertIndex: number
): RouteStop[] | null {
  if (stops.length < 2) return null;
  const fromIdx = stops.findIndex((s) => s.id === dragId);
  if (fromIdx < 0) return null;

  const clamped = Math.max(0, Math.min(stops.length, insertIndex));
  if (fromIdx === clamped || fromIdx + 1 === clamped) return null;

  const next = [...stops];
  const [item] = next.splice(fromIdx, 1);
  const insertAt = fromIdx < clamped ? clamped - 1 : clamped;
  next.splice(insertAt, 0, item);
  return assignStopRoles(next);
}

/** Ziel = Start (Rundreise): letzter Stopp übernimmt Start-Ort. */
export function applyRoundTripShortcut(stops: RouteStop[]): RouteStop[] {
  if (stops.length < 2) return stops;
  const first = stops[0];
  const lastIdx = stops.length - 1;
  const last = {
    ...stops[lastIdx],
    name: first.name,
    lat: first.lat,
    lng: first.lng,
    bookingAddress: first.bookingAddress,
  };
  return assignStopRoles([...stops.slice(0, lastIdx), last]);
}

/** Ziel-Text entspricht Reisetitel, aber ohne Geocode – kein gültiges Ziel. */
export function endStopLooksLikeTripTitleOnly(trip: Trip): boolean {
  const title = trip.name?.trim();
  if (!title || title === "Neue Reise") return false;
  const end = trip.stops.find((s) => s.type === "end");
  if (!end?.name?.trim()) return false;
  if (normalizePlaceKey(end.name) !== normalizePlaceKey(title)) return false;
  return end.lat == null && end.lng == null;
}

export const ROUTE_TITLE_AS_DESTINATION_MESSAGE =
  "Das Ziel darf nicht nur dem Reisetitel entsprechen. Bitte einen Ort wählen (Autocomplete) oder das Ziel leer lassen.";
