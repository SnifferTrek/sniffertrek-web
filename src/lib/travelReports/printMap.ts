/** Google Static Map für Reisebericht-Druck: Must-sees (1–9) + Orte (A–Z). */

export type PrintMapMarker = {
  id: string;
  /** Anzeigename in der Legende */
  label: string;
  lat: number;
  lng: number;
  note?: string;
};

export type TravelReportPrintMap = {
  center: { lat: number; lng: number };
  zoom: number;
  /** Must-sees → Marker 1, 2, 3 … */
  mustSees: readonly PrintMapMarker[];
  /** Kostenlose Orte → Marker A, B, C … */
  orte: readonly PrintMapMarker[];
};

const MAPS_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
  "AIzaSyDTcV42T-ZkriZOB8RtNZMtGR8gZq3Izi0";

/**
 * Teal = Must-sees (Zahlen), Amber = Orte (Buchstaben).
 * Ohne center/zoom → Google zoomt automatisch auf alle Marker (alle Punkte sichtbar).
 */
export function buildTravelReportPrintMapUrl(map: TravelReportPrintMap): string {
  // Hochformatiger Ausschnitt (Lagune N–S), Static Maps max 640, scale=2 → scharf
  const size = "520x640";
  const parts: string[] = [
    `size=${size}`,
    "scale=2",
    "maptype=roadmap",
  ];

  const must = map.mustSees.slice(0, 5);
  const orte = map.orte.slice(0, 8);

  must.forEach((m, i) => {
    const label = String(i + 1);
    parts.push(
      `markers=color:0x0F766E|size:mid|label:${label}|${m.lat},${m.lng}`
    );
  });

  orte.forEach((m, i) => {
    const label = String.fromCharCode(65 + i); // A, B, C…
    parts.push(
      `markers=color:0xB45309|size:mid|label:${label}|${m.lat},${m.lng}`
    );
  });

  // Fallback nur wenn keine Marker – sonst Auto-Fit aller Punkte
  if (must.length + orte.length === 0) {
    parts.push(`center=${map.center.lat},${map.center.lng}`);
    parts.push(`zoom=${map.zoom}`);
  }

  parts.push(`key=${encodeURIComponent(MAPS_KEY)}`);
  return `https://maps.googleapis.com/maps/api/staticmap?${parts.join("&")}`;
}

export function markerLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
