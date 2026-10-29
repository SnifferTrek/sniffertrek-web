import type { RouteStop, Trip } from "@/lib/types";
import { asAppLocale } from "@/lib/localeCopy";

export function stopBriefIncluded(stop: RouteStop): boolean {
  return stop.discoveryIncludeInReport === true;
}

export function stopHasBriefContent(stop: RouteStop): boolean {
  return !!(stop.discoveryDescription?.trim() || stop.discoveryPhotoUrl || stop.discoveryPhotoDataUrl);
}

/** Eigenes Upload-Foto (data-URL), das Auto-Ortsinfo nicht überschreiben soll. */
export function isUserUploadedStopPhoto(stop: RouteStop): boolean {
  const data = stop.discoveryPhotoDataUrl?.trim();
  if (!data?.startsWith("data:")) return false;
  if (stop.discoverySource === "manual") return true;
  const url = stop.discoveryPhotoUrl?.trim();
  // Upload: photoUrl ist die data-URL selbst oder (nach Lean-Speichern) leer.
  // Wiki-/KI-Fotos haben dagegen eine http-URL als discoveryPhotoUrl.
  return !url || url === data;
}

export function getRouteStopsWithBrief(trip: Trip): RouteStop[] {
  return trip.stops.filter(
    (s) => s.name.trim() && stopBriefIncluded(s) && stopHasBriefContent(s),
  );
}

export function countNamedRouteStops(stops: RouteStop[]): number {
  return stops.filter((s) => s.name.trim()).length;
}

export function briefSourceLabel(stop: RouteStop): string | null {
  switch (stop.discoveryBriefSource) {
    case "wikipedia-refined":
      return "Wikipedia + Reise-Überarbeitung";
    case "wikipedia":
      return "Wikipedia";
    case "ai":
      return "KI-Text";
    case "manual":
      return "Manuell";
    default:
      return null;
  }
}

const ROLE_LABELS = {
  de: { start: "Start", end: "Ziel", via: "Zwischenstopp" },
  en: { start: "Start", end: "Destination", via: "Waypoint" },
  es: { start: "Inicio", end: "Destino", via: "Parada" },
} as const;

export function roleLabel(stop: RouteStop, locale = "de"): string {
  const labels = ROLE_LABELS[asAppLocale(locale)] ?? ROLE_LABELS.de;
  if (stop.type === "start") return labels.start;
  if (stop.type === "end") return labels.end;
  return labels.via;
}
