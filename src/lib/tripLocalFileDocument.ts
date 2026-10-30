import type { Trip } from "./types";
import { hydrateTripMedia } from "./tripMediaSidecar";
import { syncTripRouteStops } from "./tripStopMerge";

export const TRIP_FILE_FORMAT = "sniffertrek-trip" as const;
export const TRIP_FILE_VERSION = 1;
export const TRIP_FILE_EXTENSION = ".sniffertrek.json";
export const TRIP_FILE_MIME = "application/json";

export type TripFileEnvelope = {
  format: typeof TRIP_FILE_FORMAT;
  version: typeof TRIP_FILE_VERSION;
  exportedAt: string;
  trip: Trip;
};

export function suggestTripFileName(trip: Trip): string {
  const base =
    (trip.name && trip.name !== "Neue Reise" ? trip.name : "SnifferTrek-Reise")
      .replace(/[/\\?%*:|"<>]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "SnifferTrek-Reise";
  return `${base}${TRIP_FILE_EXTENSION}`;
}

/** Voller Trip inkl. Sidecar-Medien für Datei-Export. */
export function buildTripFileContents(trip: Trip): string {
  const hydrated = hydrateTripMedia(syncTripRouteStops({ ...trip, updatedAt: new Date().toISOString() }));
  const envelope: TripFileEnvelope = {
    format: TRIP_FILE_FORMAT,
    version: TRIP_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    trip: hydrated,
  };
  return JSON.stringify(envelope);
}

export function parseTripFileContents(text: string): Trip {
  const parsed = JSON.parse(text) as TripFileEnvelope | Trip;
  if (parsed && typeof parsed === "object" && "format" in parsed && parsed.format === TRIP_FILE_FORMAT) {
    if (parsed.version !== TRIP_FILE_VERSION) {
      throw new Error(`Unsupported trip file version: ${parsed.version}`);
    }
    if (!parsed.trip?.id) throw new Error("Invalid trip file: missing trip");
    return parsed.trip;
  }
  if (parsed && typeof parsed === "object" && "id" in parsed && "stops" in parsed) {
    return parsed as Trip;
  }
  throw new Error("Invalid SnifferTrek trip file");
}

export function downloadTripFile(trip: Trip, fileName?: string): void {
  if (typeof window === "undefined") return;
  const name = fileName || suggestTripFileName(trip);
  const blob = new Blob([buildTripFileContents(trip)], { type: TRIP_FILE_MIME });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
