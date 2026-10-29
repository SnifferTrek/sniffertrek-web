import { haversineKm } from "@/lib/etappeGeo";
import { ferryRegionOf, isForbiddenElbaTransfer, type FerryRegion, type GeoPt } from "@/lib/ferryRouting";
import type { OsmFerryLine } from "@/lib/osmFerry";

export type FerryPort = { name: string; lat: number; lng: number; region: FerryRegion };

export type PickedCarFerry = {
  id: string;
  from: FerryPort;
  to: FerryPort;
  durationHours: number;
};

type CarFerryLine = { id: string; a: FerryPort; b: FerryPort; durationHours: number };

const P = (
  name: string,
  lat: number,
  lng: number,
  region: FerryRegion
): FerryPort => ({ name, lat, lng, region });

/** Fallback, falls OpenStreetMap/Overpass nichts liefert. */
const CAR_FERRY_LINES: CarFerryLine[] = [
  { id: "livorno-bastia", a: P("Livorno", 43.5526, 10.2944, "mainland"), b: P("Bastia", 42.7022, 9.4508, "corsica"), durationHours: 4.25 },
  { id: "savona-bastia", a: P("Savona", 44.2705, 8.445, "mainland"), b: P("Bastia", 42.7022, 9.4508, "corsica"), durationHours: 6 },
  { id: "nice-bastia", a: P("Nizza", 43.695, 7.285, "mainland"), b: P("Bastia", 42.7022, 9.4508, "corsica"), durationHours: 6.5 },
  { id: "nice-ile-rousse", a: P("Nizza", 43.695, 7.285, "mainland"), b: P("L'Île-Rousse", 42.64, 8.938, "corsica"), durationHours: 4.5 },
  { id: "marseille-ajaccio", a: P("Marseille", 43.304, 5.365, "mainland"), b: P("Ajaccio", 41.9192, 8.7386, "corsica"), durationHours: 12 },
  { id: "toulon-ajaccio", a: P("Toulon", 43.115, 5.933, "mainland"), b: P("Ajaccio", 41.9192, 8.7386, "corsica"), durationHours: 7 },
  { id: "livorno-ile-rousse", a: P("Livorno", 43.5526, 10.2944, "mainland"), b: P("L'Île-Rousse", 42.64, 8.938, "corsica"), durationHours: 4.5 },
  { id: "piombino-portoferraio", a: P("Piombino", 42.9218, 10.5274, "mainland"), b: P("Portoferraio", 42.813, 10.328, "elba"), durationHours: 1 },
  { id: "piombino-rio-marina", a: P("Piombino", 42.9218, 10.5274, "mainland"), b: P("Rio Marina", 42.813, 10.426, "elba"), durationHours: 0.75 },
  { id: "livorno-portoferraio", a: P("Livorno", 43.5526, 10.2944, "mainland"), b: P("Portoferraio", 42.813, 10.328, "elba"), durationHours: 1 },
  { id: "bonifacio-santa-teresa", a: P("Bonifacio", 41.387, 9.159, "corsica"), b: P("Santa Teresa", 41.239, 9.189, "sardinia"), durationHours: 1 },
  { id: "livorno-olbia", a: P("Livorno", 43.5526, 10.2944, "mainland"), b: P("Olbia", 40.923, 9.503, "sardinia"), durationHours: 8 },
  { id: "civitavecchia-olbia", a: P("Civitavecchia", 42.093, 11.789, "mainland"), b: P("Olbia", 40.923, 9.503, "sardinia"), durationHours: 7 },
  { id: "genoa-olbia", a: P("Genua", 44.41, 8.926, "mainland"), b: P("Olbia", 40.923, 9.503, "sardinia"), durationHours: 10 },
  { id: "genoa-porto-torres", a: P("Genua", 44.41, 8.926, "mainland"), b: P("Porto Torres", 40.838, 8.403, "sardinia"), durationHours: 11 },
  { id: "villa-messina", a: P("Villa San Giovanni", 38.219, 15.637, "mainland"), b: P("Messina", 38.197, 15.563, "sicily"), durationHours: 0.35 },
];

function regionCompatible(stop: FerryRegion, port: FerryRegion): boolean {
  if (stop === port) return true;
  if (stop === "unknown" && port === "mainland") return true;
  return false;
}

type FerryLine = { id: string; a: FerryPort; b: FerryPort; durationHours: number };

export function pickBestFerryFromLines(
  lines: FerryLine[],
  origin: GeoPt,
  dest: GeoPt,
  originName?: string,
  destName?: string
): PickedCarFerry | null {
  const a = ferryRegionOf(origin, originName);
  const b = ferryRegionOf(dest, destName);
  if (a === b) return null;

  let best: PickedCarFerry | null = null;
  let bestScore = Infinity;

  for (const line of lines) {
    const dirs: Array<{ from: FerryPort; to: FerryPort }> = [
      { from: line.a, to: line.b },
      { from: line.b, to: line.a },
    ];
    for (const dir of dirs) {
      if (!regionCompatible(a, dir.from.region) || !regionCompatible(b, dir.to.region)) continue;
      if (isForbiddenElbaTransfer(dir.from.region, dir.to.region)) continue;
      if (isForbiddenElbaTransfer(a, dir.from.region) || isForbiddenElbaTransfer(b, dir.to.region)) continue;
      if ((a === "corsica" || b === "corsica" || a === "sardinia" || b === "sardinia") &&
          (dir.from.region === "elba" || dir.to.region === "elba")) {
        continue;
      }
      const access =
        haversineKm(origin.lat, origin.lng, dir.from.lat, dir.from.lng) +
        haversineKm(dir.to.lat, dir.to.lng, dest.lat, dest.lng);
      if (access < bestScore) {
        bestScore = access;
        best = { id: line.id, from: dir.from, to: dir.to, durationHours: line.durationHours };
      }
    }
  }
  return best;
}

/** Nächste echte Autofähre – statischer Fallback, wenn OSM nichts liefert. */
export function pickCarFerry(
  origin: GeoPt,
  dest: GeoPt,
  originName?: string,
  destName?: string
): PickedCarFerry | null {
  return pickBestFerryFromLines(CAR_FERRY_LINES, origin, dest, originName, destName);
}

const OSM_CLIENT_TTL_MS = 24 * 60 * 60 * 1000;
const osmClientCache = new Map<string, { at: number; lines: OsmFerryLine[] }>();

async function loadOsmFerryLinesClient(origin: GeoPt, dest: GeoPt): Promise<OsmFerryLine[]> {
  const key = `${origin.lat.toFixed(2)},${origin.lng.toFixed(2)}|${dest.lat.toFixed(2)},${dest.lng.toFixed(2)}`;
  const hit = osmClientCache.get(key);
  if (hit && Date.now() - hit.at < OSM_CLIENT_TTL_MS) return hit.lines;
  if (typeof fetch !== "function") return [];
  try {
    const url = `/api/osm-ferries?olat=${origin.lat}&olng=${origin.lng}&dlat=${dest.lat}&dlng=${dest.lng}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data = (await res.json()) as { lines?: OsmFerryLine[] };
    const lines = Array.isArray(data.lines) ? data.lines : [];
    osmClientCache.set(key, { at: Date.now(), lines });
    return lines;
  } catch {
    return [];
  }
}

/** OSM zuerst, Katalog nur wenn Overpass nichts Passendes hat. */
export async function pickCarFerryAsync(
  origin: GeoPt,
  dest: GeoPt,
  originName?: string,
  destName?: string
): Promise<PickedCarFerry | null> {
  const osmLines = await loadOsmFerryLinesClient(origin, dest);
  const fromOsm = pickBestFerryFromLines(osmLines, origin, dest, originName, destName);
  if (fromOsm) return fromOsm;
  return pickCarFerry(origin, dest, originName, destName);
}

export function interpolateGreatCircle(a: GeoPt, b: GeoPt, steps = 28): GeoPt[] {
  const lat1 = (a.lat * Math.PI) / 180;
  const lng1 = (a.lng * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const lng2 = (b.lng * Math.PI) / 180;
  const d =
    2 *
    Math.asin(
      Math.min(
        1,
        Math.sqrt(
          Math.sin((lat2 - lat1) / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2
        )
      )
    );
  if (d < 1e-6) return [a, b];
  const out: GeoPt[] = [];
  const sinD = Math.sin(d);
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / sinD;
    const B = Math.sin(f * d) / sinD;
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    out.push({
      lat: (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI,
      lng: (Math.atan2(y, x) * 180) / Math.PI,
    });
  }
  return out;
}

export function encodePolyline(points: GeoPt[]): string {
  let lastLat = 0;
  let lastLng = 0;
  let result = "";
  const emit = (val: number) => {
    let v = val < 0 ? ~(val << 1) : val << 1;
    while (v >= 0x20) {
      result += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    result += String.fromCharCode(v + 63);
  };
  for (const p of points) {
    const lat = Math.round(p.lat * 1e5);
    const lng = Math.round(p.lng * 1e5);
    emit(lat - lastLat);
    emit(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }
  return result;
}

export function ferryCrossingMetrics(from: GeoPt, to: GeoPt, durationHours: number): { meters: number; seconds: number } {
  return {
    meters: Math.round(haversineKm(from.lat, from.lng, to.lat, to.lng) * 1000),
    seconds: Math.round(durationHours * 3600),
  };
}
