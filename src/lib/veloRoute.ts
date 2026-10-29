export type VeloWaypoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  role: "start" | "via" | "end";
};

export type VeloRouteStep = {
  instruction: string;
  distanceM: number;
  durationS: number;
  maneuver: string;
};

export type VeloRouteStats = {
  distanceKm: number;
  ascentM: number;
  descentM: number;
  durationMin: number;
};

export type VeloRouteResult = {
  coordinates: [number, number][];
  stats: VeloRouteStats;
  steps: VeloRouteStep[];
  elevations: number[];
};

export function newWaypointId(): string {
  return `wp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Punkte entlang der Linie für Höhenprofil (max. n). */
export function sampleCoordinates(
  coords: [number, number][],
  maxPoints = 80
): [number, number][] {
  if (coords.length <= maxPoints) return coords;
  const step = (coords.length - 1) / (maxPoints - 1);
  const out: [number, number][] = [];
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step);
    out.push(coords[Math.min(idx, coords.length - 1)]);
  }
  return out;
}

export function haversineM(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function polylineLengthM(coords: [number, number][]): number {
  let sum = 0;
  for (let i = 1; i < coords.length; i++) {
    sum += haversineM(coords[i - 1], coords[i]);
  }
  return sum;
}

type LatLng = { lat: number; lng: number };

const EARTH_R_M = 6371000;

function bearingRad(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return Math.atan2(y, x);
}

function crossTrackDistanceM(p: LatLng, a: LatLng, b: LatLng): number {
  const d13 = haversineM([a.lng, a.lat], [p.lng, p.lat]);
  if (d13 < 1) return 0;
  const brg13 = bearingRad(a, p);
  const brg12 = bearingRad(a, b);
  const xt = Math.asin(
    Math.sin(d13 / EARTH_R_M) * Math.sin(brg13 - brg12)
  );
  return Math.abs(xt * EARTH_R_M);
}

function maxDeviationFromChordM(
  coords: [number, number][],
  a: LatLng,
  b: LatLng
): number {
  let max = 0;
  for (const [lng, lat] of coords) {
    const d = crossTrackDistanceM({ lat, lng }, a, b);
    if (d > max) max = d;
  }
  return max;
}

/** Max. Luftlinie: Fahrverbot (Auto) – nur sehr kurze «gleiche Strasse»-Abschnitte. */
export const VELO_DIRECT_FALLBACK_MAX_M = 150;

export type VeloDirectFallbackOptions = {
  maxDirectM?: number;
  minRatio?: number;
  minBulgeM?: number;
};

/**
 * OSM/OSRM umfährt Autofahrverbote – für Velo oft erlaubt.
 * Nur bei eindeutigem Block-Umweg (nicht quer durchs Gelände).
 */
export function shouldPreferDirectOverOsrm(
  a: LatLng,
  b: LatLng,
  osrmDistanceM: number,
  osrmCoords?: [number, number][],
  options?: VeloDirectFallbackOptions
): boolean {
  const maxDirectM = options?.maxDirectM ?? VELO_DIRECT_FALLBACK_MAX_M;
  const minRatio = options?.minRatio ?? 3.5;
  const minBulgeM = options?.minBulgeM ?? 40;
  const directM = haversineM([a.lng, a.lat], [b.lng, b.lat]);
  if (directM < 30 || directM > maxDirectM) return false;
  if (!osrmCoords || osrmCoords.length < 4) return false;

  const ratio = osrmDistanceM / directM;
  if (ratio < minRatio) return false;

  const bulge = maxDeviationFromChordM(osrmCoords, a, b);
  return bulge > minBulgeM && bulge > directM * 0.55;
}

/** Fuss-/Waldweg gewinnt, wenn er klar kürzer ist als der Bike-Umweg. */
export function preferPathOverBike(
  bikeDistanceM: number,
  pathDistanceM: number
): boolean {
  return (
    pathDistanceM < bikeDistanceM * 0.9 ||
    bikeDistanceM - pathDistanceM > 100
  );
}

export function directSegmentCoords(
  a: LatLng,
  b: LatLng,
  spacingM = 25
): [number, number][] {
  const straight = haversineM([a.lng, a.lat], [b.lng, b.lat]);
  const steps = Math.max(2, Math.ceil(straight / spacingM));
  const out: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    out.push([a.lng + (b.lng - a.lng) * t, a.lat + (b.lat - a.lat) * t]);
  }
  return out;
}

/** Mehrere Segmente zu einer Linie verbinden (Duplikate an Knoten entfernen). */
export function mergeSegmentCoords(
  segments: [number, number][][]
): [number, number][] {
  const merged: [number, number][] = [];
  for (const seg of segments) {
    if (seg.length === 0) continue;
    if (merged.length === 0) {
      merged.push(...seg);
      continue;
    }
    merged.push(...seg.slice(1));
  }
  return merged;
}

export function computeElevationStats(elevations: number[]): {
  ascentM: number;
  descentM: number;
} {
  let ascent = 0;
  let descent = 0;
  for (let i = 1; i < elevations.length; i++) {
    const d = elevations[i] - elevations[i - 1];
    if (d > 0) ascent += d;
    else descent += Math.abs(d);
  }
  return {
    ascentM: Math.round(ascent),
    descentM: Math.round(descent),
  };
}

/** Grobe Fahrzeit Velo (~15 km/h, Steigung). */
export function estimateDurationMin(distanceKm: number, ascentM: number): number {
  const base = (distanceKm / 15) * 60;
  const climb = (ascentM / 100) * 5;
  return Math.round(base + climb);
}

export function buildGpx(
  name: string,
  coordinates: [number, number][],
  elevations: number[]
): string {
  const pts = coordinates
    .map(([lng, lat], i) => {
      const ele = elevations[i];
      const eleTag =
        ele != null && Number.isFinite(ele) ? `<ele>${ele.toFixed(1)}</ele>` : "";
      return `      <trkpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}">${eleTag}</trkpt>`;
    })
    .join("\n");
  const safeName = name.replace(/[<>&]/g, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SnifferTrek" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${safeName}</name><time>${new Date().toISOString()}</time></metadata>
  <trk><name>${safeName}</name><trkseg>
${pts}
  </trkseg></trk>
</gpx>`;
}

export function buildVeloExportJson(
  waypoints: VeloWaypoint[],
  route: VeloRouteResult
): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      waypoints,
      route: {
        coordinates: route.coordinates,
        stats: route.stats,
        steps: route.steps,
        elevations: route.elevations,
      },
    },
    null,
    2
  );
}

export function downloadTextFile(
  content: string,
  filename: string,
  mime: string
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type NavPoint = { lat: number; lng: number };

/** Apple Karten, Velo – Start bis Ziel (Zwischenpunkte als Stopps). */
export function appleMapsBikeUrl(points: NavPoint[]): string | null {
  if (points.length < 2) return null;
  const start = points[0];
  const dest = points
    .slice(1)
    .map((p) => `${p.lat},${p.lng}`)
    .join(" to:");
  return (
    `https://maps.apple.com/?dirflg=b` +
    `&saddr=${start.lat},${start.lng}` +
    `&daddr=${encodeURIComponent(dest)}`
  );
}

/** Google Maps, Velo mit Navigation. */
export function googleMapsBikeUrl(points: NavPoint[]): string | null {
  if (points.length < 2) return null;
  const origin = `${points[0].lat},${points[0].lng}`;
  const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
  const vias = points.slice(1, -1).slice(0, 9);
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "bicycling",
    dir_action: "navigate",
  });
  if (vias.length) {
    params.set("waypoints", vias.map((p) => `${p.lat},${p.lng}`).join("|"));
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** iOS-Freigabe (AirDrop, Komoot, Dateien) – sonst Download. */
export async function shareOrDownloadGpx(
  content: string,
  filename = "velo-schweiz.gpx"
): Promise<void> {
  const file = new File([content], filename, { type: "application/gpx+xml" });
  try {
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Velo Schweiz" });
      return;
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return;
  }
  downloadTextFile(content, filename, "application/gpx+xml");
}
