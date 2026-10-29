import { haversineKm } from "@/lib/etappeGeo";
import { ferryRegionOf, isForbiddenElbaTransfer, type FerryRegion, type GeoPt } from "@/lib/ferryRouting";

export type OsmFerryLine = {
  id: string;
  a: { name: string; lat: number; lng: number; region: FerryRegion };
  b: { name: string; lat: number; lng: number; region: FerryRegion };
  durationHours: number;
  name?: string;
};

type OsmGeom = { lat?: number; lon?: number };
type OsmMember = { type?: string; geometry?: OsmGeom[] };
type OsmElement = {
  type?: string;
  id?: number;
  tags?: Record<string, string>;
  geometry?: OsmGeom[];
  members?: OsmMember[];
  center?: { lat?: number; lon?: number };
};

const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

function asPt(g?: OsmGeom | null): GeoPt | null {
  if (!g || !Number.isFinite(g.lat) || !Number.isFinite(g.lon)) return null;
  return { lat: Number(g.lat), lng: Number(g.lon) };
}

function collectGeom(el: OsmElement): GeoPt[] {
  const pts: GeoPt[] = [];
  for (const g of el.geometry || []) {
    const p = asPt(g);
    if (p) pts.push(p);
  }
  for (const m of el.members || []) {
    for (const g of m.geometry || []) {
      const p = asPt(g);
      if (p) pts.push(p);
    }
  }
  return pts;
}

function farthestPair(pts: GeoPt[]): [GeoPt, GeoPt] | null {
  if (pts.length < 2) return null;
  if (pts.length === 2) return [pts[0], pts[1]];
  const step = Math.max(1, Math.floor(pts.length / 24));
  let best = 0;
  let a = pts[0];
  let b = pts[pts.length - 1];
  for (let i = 0; i < pts.length; i += step) {
    for (let j = i + step; j < pts.length; j += step) {
      const d = haversineKm(pts[i].lat, pts[i].lng, pts[j].lat, pts[j].lng);
      if (d > best) {
        best = d;
        a = pts[i];
        b = pts[j];
      }
    }
  }
  return [a, b];
}

function isLikelyCarFerry(tags: Record<string, string>, seaKm: number): boolean {
  if (tags.route !== "ferry" && tags.ferry !== "yes") return false;
  if (tags.motorcar === "no" || tags.motor_vehicle === "no" || tags.motor_vehicle === "foot") return false;
  if (tags.foot === "yes" && tags.motorcar !== "yes" && tags.motor_vehicle !== "yes" && seaKm < 8) {
    return false;
  }
  if (seaKm < 0.35) return false;
  if (seaKm > 450) return false;
  return true;
}

function durationHoursFromKm(km: number): number {
  return Math.max(0.3, Math.min(16, km / 32));
}

export function osmElementsToFerryLines(elements: OsmElement[]): OsmFerryLine[] {
  const lines: OsmFerryLine[] = [];
  for (const el of elements) {
    const tags = el.tags || {};
    const pts = collectGeom(el);
    const ends = farthestPair(pts);
    if (!ends) continue;
    const seaKm = haversineKm(ends[0].lat, ends[0].lng, ends[1].lat, ends[1].lng);
    if (!isLikelyCarFerry(tags, seaKm)) continue;
    const name = (tags.name || tags.ref || `${el.type}/${el.id}`).trim();
    const aName = (tags.from || name.split(/–|-|—/)[0] || "Hafen").trim();
    const bName = (tags.to || name.split(/–|-|—/).slice(-1)[0] || "Hafen").trim();
    const a = {
      name: aName,
      lat: ends[0].lat,
      lng: ends[0].lng,
      region: ferryRegionOf(ends[0], aName),
    };
    const b = {
      name: bName,
      lat: ends[1].lat,
      lng: ends[1].lng,
      region: ferryRegionOf(ends[1], bName),
    };
    if (a.region === b.region && a.region !== "unknown") continue;
    if (isForbiddenElbaTransfer(a.region, b.region)) continue;
    lines.push({
      id: `osm-${el.type}-${el.id}`,
      a,
      b,
      durationHours: durationHoursFromKm(seaKm),
      name,
    });
  }
  return lines;
}

function overpassQuery(origin: GeoPt, dest: GeoPt): string {
  const radius = 180000;
  return `[out:json][timeout:20];
(
  relation["route"="ferry"](around:${radius},${origin.lat},${origin.lng});
  way["route"="ferry"](around:${radius},${origin.lat},${origin.lng});
  relation["route"="ferry"](around:${radius},${dest.lat},${dest.lng});
  way["route"="ferry"](around:${radius},${dest.lat},${dest.lng});
);
out geom;`;
}

async function queryMirror(url: string, query: string): Promise<OsmElement[]> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json",
      "User-Agent": "SnifferTrek/1.0 (https://www.sniffertrek.com; ferry lookup)",
    },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(22000),
  });
  if (!res.ok) throw new Error(`overpass ${res.status}`);
  const data = (await res.json()) as { elements?: OsmElement[] };
  return data.elements || [];
}

export async function fetchOsmFerryLines(origin: GeoPt, dest: GeoPt): Promise<OsmFerryLine[]> {
  const query = overpassQuery(origin, dest);
  let lastError: unknown;
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const elements = await queryMirror(mirror, query);
      return osmElementsToFerryLines(elements);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("OSM Overpass unavailable");
}
