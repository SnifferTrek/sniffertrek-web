import jsPDF from "jspdf";
import { Trip, RouteStop, Etappe, PdfPhotoPlacement, PdfPhotoLayout } from "./types";
import { resolvePdfExportOptions } from "./pdfExportOptions";

// --- Constants (matching iOS TripPrintView.swift) ---
const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const M = 50; // margin
const CONTENT_W = PAGE_W - 2 * M;
const RIGHT = PAGE_W - M;

const BLUE = [0, 122, 255] as const;
const GREEN = [52, 199, 89] as const;
const RED = [255, 59, 48] as const;
const BLACK = [0, 0, 0] as const;
const GRAY = [142, 142, 147] as const;
const LIGHT_GRAY = [210, 210, 210] as const;

function setColor(doc: jsPDF, c: readonly [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}

function hexToRgb(hex?: string): [number, number, number] | null {
  const raw = (hex || "").trim();
  if (!raw) return null;
  const normalized = raw.startsWith("#") ? raw.slice(1) : raw;
  const full = normalized.length === 3
    ? normalized.split("").map((c) => c + c).join("")
    : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [r, g, b];
}

function formatDateDE(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function formatDur(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")} h`;
}

function extractCity(name: string): string {
  const firstLine = (name || "").split("\n")[0].trim();
  if (!firstLine) return "";

  const stripPostalCodes = (value: string): string =>
    value
      // UK-style: GX11 1AA
      .replace(/\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/gi, "")
      // CH/EU common: 1000, 8001, 1200-000
      .replace(/\b\d{4,6}(?:-\d{3,4})?\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const isAddressLike = (value: string): boolean =>
    /\b(strasse|straße|weg|gasse|rue|route|via|avenue|av\.?|road|street|st\.?|str\.?|chemin|place|boulevard|blvd|calle|rua|plaza|platz)\b/i.test(value) ||
    /\d/.test(value);

  const stripStreetPrefixAndNumbers = (value: string): string =>
    value
      .replace(/^(av\.?|avenida|rua|r\.?|calle|c\/|via|route|street|st\.?|road|rd\.?|boulevard|blvd\.?|chemin|platz|plaza)\s+/i, "")
      .replace(/\b\d+[a-zA-Z/-]*\b.*$/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const parts = firstLine.split(",").map((p) => stripPostalCodes(p.trim())).filter(Boolean);
  if (parts.length > 1) {
    const candidate = parts.find((p) => p && !isAddressLike(p)) || parts.find((p) => p && !/\d/.test(p)) || parts[0];
    return candidate.trim();
  }

  const cleaned = stripPostalCodes(parts[0] || firstLine);
  if (!isAddressLike(cleaned)) return cleaned;
  const fallback = stripStreetPrefixAndNumbers(cleaned);
  return fallback || cleaned;
}

function splitTextLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

// Draw a filled circle (status dot replacement for Unicode issues)
function drawDot(doc: jsPDF, x: number, y: number, r: number, filled: boolean) {
  if (filled) {
    doc.circle(x, y - 3, r, "F");
  } else {
    doc.setLineWidth(0.8);
    doc.circle(x, y - 3, r, "S");
  }
}

// --- Collect hotel stops from all routes ---
function collectAllHotelStops(trip: Trip): RouteStop[] {
  const all = [
    ...trip.stops,
    ...(trip.routes?.flights?.stops || []),
    ...(trip.routes?.car?.stops || []),
    ...(trip.routes?.train?.stops || []),
  ];
  const seen = new Set<string>();
  return all.filter((s) => {
    if (!s.isHotel || !s.name.trim()) return false;
    const key = s.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizePlaceKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function collectAiDiscoveriesByEtappe(trip: Trip): Map<number, RouteStop[]> {
  const grouped = new Map<number, RouteStop[]>();
  const seen = new Set<string>();
  for (const stop of trip.stops) {
    if (stop.type !== "stop" || !stop.discoverySource) continue;
    if (typeof stop.discoveryEtappeIndex !== "number") continue;
    const dedupeKey = `${stop.discoveryEtappeIndex}:${normalizePlaceKey(stop.name)}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const current = grouped.get(stop.discoveryEtappeIndex) || [];
    current.push(stop);
    grouped.set(stop.discoveryEtappeIndex, current);
  }
  return grouped;
}

function getEtappeStopsForMap(etappe: Etappe, allStops: RouteStop[]): RouteStop[] {
  const namedStops = allStops.filter((s) => s.name.trim());
  const startKey = normalizePlaceKey(extractCity(etappe.from));
  const endKey = normalizePlaceKey(extractCity(etappe.to));
  const matchesEtappeName = (stopName: string, targetKey: string) => {
    const cityKey = normalizePlaceKey(extractCity(stopName));
    return cityKey === targetKey || cityKey.includes(targetKey) || targetKey.includes(cityKey);
  };

  // Prefer the literal stop order in trip.stops so every intermediate stop is preserved.
  const startIdx = namedStops.findIndex((s) => matchesEtappeName(s.name, startKey));
  if (startIdx >= 0) {
    const endIdx = namedStops.findIndex((s, idx) => idx > startIdx && matchesEtappeName(s.name, endKey));
    if (endIdx > startIdx) {
      const sliced = namedStops.slice(startIdx, endIdx + 1);
      const deduped: RouteStop[] = [];
      const seen = new Set<string>();
      for (const s of sliced) {
        const dedupe = `${normalizePlaceKey(s.name)}:${s.lat ?? ""}:${s.lng ?? ""}`;
        if (seen.has(dedupe)) continue;
        seen.add(dedupe);
        deduped.push(s);
      }
      return deduped;
    }
  }

  const result: RouteStop[] = [];
  const stopByKey = new Map<string, RouteStop[]>();

  for (const s of allStops) {
    const key = normalizePlaceKey(extractCity(s.name));
    if (!stopByKey.has(key)) stopByKey.set(key, []);
    stopByKey.get(key)!.push(s);
  }

  const pushByName = (name: string) => {
    const key = normalizePlaceKey(extractCity(name));
    const candidates = stopByKey.get(key) || [];
    const picked = candidates.find((c) => c.lat != null && c.lng != null) || candidates[0];
    if (!picked) return;
    const dedupe = `${picked.id}:${picked.lat ?? ""}:${picked.lng ?? ""}`;
    if (!result.some((r) => `${r.id}:${r.lat ?? ""}:${r.lng ?? ""}` === dedupe)) {
      result.push(picked);
    }
  };

  pushByName(etappe.from);
  for (const leg of etappe.legs) {
    pushByName(leg.to);
  }
  return result;
}

function formatEtappeRouteLabel(from: string, to: string): string {
  const fromCity = extractCity(from);
  const toCity = extractCity(to);
  if (normalizePlaceKey(fromCity) === normalizePlaceKey(toCity)) {
    return fromCity;
  }
  return `${fromCity} - ${toCity}`;
}

type SegmentRow = {
  from: string;
  to: string;
  distanceMeters?: number;
  durationSeconds?: number;
};

type RoutedSegment = {
  fromKey: string;
  toKey: string;
  polyline: string;
  distanceMeters?: number;
  durationSeconds?: number;
};

type RouteByNamesResult = {
  encodedPolyline?: string;
  overviewPoints?: Array<{ lat: number; lng: number }>;
  segments: RoutedSegment[];
};

function fillMissingSegmentMetrics(
  rows: SegmentRow[],
  etappe: Etappe,
  routedSegments?: RoutedSegment[] | null
): SegmentRow[] {
  if (rows.length === 0) return rows;
  const out = rows.map((r) => ({ ...r }));
  const hasMissing = out.some(
    (r) => typeof r.distanceMeters !== "number" || typeof r.durationSeconds !== "number"
  );
  if (!hasMissing) return out;

  const etappeLegs = etappe.legs || [];
  const routed = routedSegments || [];

  // 1) Strong index-based fallback from etappe legs.
  for (let i = 0; i < out.length; i++) {
    if (typeof out[i].distanceMeters === "number" && typeof out[i].durationSeconds === "number") continue;
    const leg = etappeLegs[i];
    if (leg) {
      if (typeof out[i].distanceMeters !== "number") out[i].distanceMeters = leg.distanceMeters;
      if (typeof out[i].durationSeconds !== "number") out[i].durationSeconds = leg.durationSeconds;
    }
  }

  // 2) Index-based fallback from routed segments.
  for (let i = 0; i < out.length; i++) {
    if (typeof out[i].distanceMeters === "number" && typeof out[i].durationSeconds === "number") continue;
    const seg = routed[i];
    if (seg) {
      if (typeof out[i].distanceMeters !== "number" && typeof seg.distanceMeters === "number") {
        out[i].distanceMeters = seg.distanceMeters;
      }
      if (typeof out[i].durationSeconds !== "number" && typeof seg.durationSeconds === "number") {
        out[i].durationSeconds = seg.durationSeconds;
      }
    }
  }

  // 3) Last fallback: distribute remaining distance/time across unresolved rows.
  const totalDistance =
    etappeLegs.reduce((sum, l) => sum + (l.distanceMeters || 0), 0) ||
    routed.reduce((sum, s) => sum + (s.distanceMeters || 0), 0);
  const totalDuration =
    etappeLegs.reduce((sum, l) => sum + (l.durationSeconds || 0), 0) ||
    routed.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

  const knownDistance = out.reduce((sum, r) => sum + (typeof r.distanceMeters === "number" ? r.distanceMeters : 0), 0);
  const knownDuration = out.reduce((sum, r) => sum + (typeof r.durationSeconds === "number" ? r.durationSeconds : 0), 0);

  const missingIdx = out
    .map((r, i) =>
      typeof r.distanceMeters !== "number" || typeof r.durationSeconds !== "number" ? i : -1
    )
    .filter((i) => i >= 0);

  if (missingIdx.length > 0) {
    const distLeft = Math.max(0, totalDistance - knownDistance);
    const durLeft = Math.max(0, totalDuration - knownDuration);
    const distShare = distLeft > 0 ? Math.round(distLeft / missingIdx.length) : 0;
    const durShare = durLeft > 0 ? Math.round(durLeft / missingIdx.length) : 0;
    for (const idx of missingIdx) {
      if (typeof out[idx].distanceMeters !== "number") out[idx].distanceMeters = distShare;
      if (typeof out[idx].durationSeconds !== "number") out[idx].durationSeconds = durShare;
    }
  }

  return out;
}

function buildSegmentRows(
  etappe: Etappe,
  etappeStops: RouteStop[],
  routedSegments?: RoutedSegment[] | null
): SegmentRow[] {
  const rows: SegmentRow[] = [];
  const hasStopChain = etappeStops.length > 1;

  if (hasStopChain) {
    for (let i = 0; i < etappeStops.length - 1; i++) {
      const fromStop = etappeStops[i];
      const toStop = etappeStops[i + 1];
      const fromCity = extractCity(fromStop.name);
      const toCity = extractCity(toStop.name);
      const fromKey = normalizePlaceKey(fromCity);
      const toKey = normalizePlaceKey(toCity);
      const matchedLeg = etappe.legs.find((leg) => {
        const legFrom = normalizePlaceKey(extractCity(leg.from));
        const legTo = normalizePlaceKey(extractCity(leg.to));
        return legFrom === fromKey && legTo === toKey;
      });
      const routed = routedSegments?.find((seg) => seg.fromKey === fromKey && seg.toKey === toKey);
      rows.push({
        from: fromCity,
        to: toCity,
        distanceMeters: matchedLeg?.distanceMeters ?? routed?.distanceMeters,
        durationSeconds: matchedLeg?.durationSeconds ?? routed?.durationSeconds,
      });
    }
    return fillMissingSegmentMetrics(rows, etappe, routedSegments);
  }

  for (const leg of etappe.legs) {
    rows.push({
      from: extractCity(leg.from),
      to: extractCity(leg.to),
      distanceMeters: leg.distanceMeters,
      durationSeconds: leg.durationSeconds,
    });
  }
  return fillMissingSegmentMetrics(rows, etappe, routedSegments);
}

function encodePolyline(points: Array<{ lat: number; lng: number }>): string {
  let lastLat = 0;
  let lastLng = 0;
  let result = "";
  const encodeValue = (value: number) => {
    let v = value < 0 ? ~(value << 1) : value << 1;
    while (v >= 0x20) {
      result += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    result += String.fromCharCode(v + 63);
  };
  for (const p of points) {
    const lat = Math.round(p.lat * 1e5);
    const lng = Math.round(p.lng * 1e5);
    encodeValue(lat - lastLat);
    encodeValue(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }
  return result;
}

function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

function simplifyPolylinePoints(
  points: Array<{ lat: number; lng: number }>,
  maxPoints: number
): Array<{ lat: number; lng: number }> {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const out: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i < points.length; i += step) out.push(points[i]);
  const last = points[points.length - 1];
  if (out.length === 0 || out[out.length - 1] !== last) out.push(last);
  return out;
}

function chunkPolylinePoints(
  points: Array<{ lat: number; lng: number }>,
  maxChunkPoints: number
): Array<Array<{ lat: number; lng: number }>> {
  if (points.length <= maxChunkPoints) return [points];
  const chunks: Array<Array<{ lat: number; lng: number }>> = [];
  let i = 0;
  while (i < points.length - 1) {
    const end = Math.min(points.length, i + maxChunkPoints);
    const chunk = points.slice(i, end);
    if (chunk.length >= 2) chunks.push(chunk);
    if (end >= points.length) break;
    i = end - 1; // overlap by one point to keep continuity
  }
  return chunks;
}

async function loadRouteByNamesViaJsApi(
  origin: string,
  destination: string,
  waypoints: string[]
): Promise<RouteByNamesResult | null> {
  const w = window as any;
  const g = w.google;
  if (!g?.maps?.DirectionsService || !g.maps.TravelMode) return null;
  try {
    const service = new g.maps.DirectionsService();
    const request = {
      origin,
      destination,
      waypoints: waypoints.map((loc) => ({ location: loc, stopover: true })),
      travelMode: g.maps.TravelMode.DRIVING,
    };
    const res = await new Promise<any>((resolve, reject) => {
      service.route(request, (result: any, status: string) => {
        if (status === "OK" && result) resolve(result);
        else reject(new Error(status || "Directions failed"));
      });
    });
    const route = res?.routes?.[0];
    if (!route) return null;
    const names = [origin, ...waypoints, destination];
    const legs: any[] = route.legs || [];
    const segments: RoutedSegment[] = [];
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      const fromName = names[i] || leg?.start_address || "";
      const toName = names[i + 1] || leg?.end_address || "";
      let segPolyline = "";
      const stepPath: Array<{ lat: number; lng: number }> = [];
      for (const step of leg?.steps || []) {
        for (const p of step?.path || []) {
          const lat = typeof p.lat === "function" ? p.lat() : p.lat;
          const lng = typeof p.lng === "function" ? p.lng() : p.lng;
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            stepPath.push({ lat, lng });
          }
        }
      }
      if (stepPath.length > 1) {
        segPolyline = encodePolyline(stepPath);
      }
      segments.push({
        fromKey: normalizePlaceKey(extractCity(fromName)),
        toKey: normalizePlaceKey(extractCity(toName)),
        polyline: segPolyline,
        distanceMeters: Number(leg?.distance?.value) || undefined,
        durationSeconds: Number(leg?.duration?.value) || undefined,
      });
    }
    const overviewPath: Array<{ lat: number; lng: number }> = [];
    for (const p of route.overview_path || []) {
      const lat = typeof p.lat === "function" ? p.lat() : p.lat;
      const lng = typeof p.lng === "function" ? p.lng() : p.lng;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        overviewPath.push({ lat, lng });
      }
    }
    const encodedPolyline = overviewPath.length > 1 ? encodePolyline(overviewPath) : undefined;
    return { encodedPolyline, overviewPoints: overviewPath.length > 1 ? overviewPath : undefined, segments };
  } catch {
    return null;
  }
}

function normalizeDiscoveryQuery(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildDiscoveryQueryCandidates(name: string): string[] {
  const base = normalizeDiscoveryQuery(name);
  if (!base) return [];
  const candidates: string[] = [];
  const pushUnique = (v: string) => {
    const t = normalizeDiscoveryQuery(v);
    if (t && !candidates.includes(t)) candidates.push(t);
  };

  // For labels like "Annecy, Palais de l'Isle" (or legacy "Annecy - Palais..."),
  // prioritize the POI part first.
  const separatorParts = base.split(/\s*,\s*|\s[-–]\s/).map((p) => p.trim()).filter(Boolean);
  if (separatorParts.length >= 2) {
    pushUnique(separatorParts.slice(1).join(", "));
    pushUnique(separatorParts[separatorParts.length - 1]);
  }
  pushUnique(base);

  const strippedCategory = base
    .replace(/\b(altstadt|stadtzentrum|zentrum|old town|historic center|historic centre|vieux[-\s]?ville)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  pushUnique(strippedCategory);
  const beforeSeparator = strippedCategory.split(/\s*,\s*|\s[-–]\s/)[0]?.trim();
  if (beforeSeparator && beforeSeparator.length >= 3 && separatorParts.length < 2) {
    pushUnique(beforeSeparator);
  }
  const words = strippedCategory
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4);
  if (words.length >= 2) {
    pushUnique(words.slice(0, 3).join(" "));
    pushUnique(words.slice(0, 2).join(" "));
  }
  return candidates;
}

function normalizeWikiKey(value: string): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeDiscoveryText(text: string): string {
  return (text || "")
    .normalize("NFC")
    // Remove common pronunciation/IPA blocks like [ ... ] that often break PDF typography.
    .replace(/\s*\[[^\]]{2,}\]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanWikipediaText(text: string): string {
  return normalizeDiscoveryText(
    (text || "")
      .replace(/Vorlage:[^\n.?!]*/gi, " ")
      .replace(/\bWikidata\b/gi, " ")
      .replace(/\s*\/Wartung\/[^\n.?!]*/gi, " ")
  );
}

function isWeakWikipediaText(text?: string): boolean {
  const t = cleanWikipediaText(text || "").toLowerCase();
  if (!t) return true;
  if (t.includes("vorlage:") || t.includes("wikidata")) return true;
  if (t.includes("begriffsklarung") || t.includes("begriffsklärung")) return true;
  if (t.includes("steht fur") || t.includes("steht für")) return true;
  if (t.includes("kann folgendes bedeuten")) return true;
  return t.length < 120;
}

async function fetchWikipediaSummaryByTitle(
  title: string
): Promise<{ title: string; text?: string; photo?: string; lat?: number; lng?: number } | null> {
  const q = normalizeDiscoveryQuery(title);
  if (!q) return null;
  const endpoints = [
    `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`,
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`,
  ];
  for (const url of endpoints) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();
      const resolvedTitle = (data?.title || q).toString().trim() || q;
      // Skip namespace/meta pages like Vorlage:, Kategorie:, Hilfe:, etc.
      if (resolvedTitle.includes(":")) continue;
      if (/\((begriffsklärung|begriffsklarung|disambiguation)\)/i.test(resolvedTitle)) continue;
      const text = typeof data?.extract === "string" ? cleanWikipediaText(data.extract) : undefined;
      const photo = typeof data?.thumbnail?.source === "string" ? data.thumbnail.source : undefined;
      const lat = typeof data?.coordinates?.lat === "number" ? data.coordinates.lat : undefined;
      const lng = typeof data?.coordinates?.lon === "number" ? data.coordinates.lon : undefined;
      if ((text && !isWeakWikipediaText(text)) || photo) return { title: resolvedTitle, text, photo, lat, lng };
    } catch {
      // ignore and try next source
    }
  }
  return null;
}

async function fetchWikipediaIntroByTitle(title: string): Promise<string | undefined> {
  const q = normalizeDiscoveryQuery(title);
  if (!q) return undefined;
  const endpoints = [
    `https://de.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exintro=1&redirects=1&titles=${encodeURIComponent(q)}&format=json&origin=*`,
    `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exintro=1&redirects=1&titles=${encodeURIComponent(q)}&format=json&origin=*`,
  ];
  for (const url of endpoints) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();
      const pages = data?.query?.pages;
      if (!pages || typeof pages !== "object") continue;
      const entries = Object.values(pages) as Array<{ extract?: unknown }>;
      const extract = cleanWikipediaText((entries.find((e) => typeof e?.extract === "string")?.extract || "")
        .toString()
        .replace(/\s+/g, " ")
        .trim());
      if (extract && !isWeakWikipediaText(extract)) return extract;
    } catch {
      // ignore and try next source
    }
  }
  return undefined;
}

async function fetchWikipediaOpenSearchTitles(query: string): Promise<string[]> {
  const q = normalizeDiscoveryQuery(query);
  if (!q) return [];
  const endpoints = [
    `https://de.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=8&namespace=0&format=json&origin=*`,
    `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=8&namespace=0&format=json&origin=*`,
  ];
  const out: string[] = [];
  for (const url of endpoints) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();
      const titles = Array.isArray(data?.[1]) ? data[1].map((t: unknown) => String(t || "").trim()) : [];
      for (const title of titles) {
        if (title && !out.includes(title)) out.push(title);
      }
    } catch {
      // ignore and try next source
    }
  }
  return out;
}

function pickBestWikipediaTitle(query: string, titles: string[]): string | undefined {
  if (!titles.length) return undefined;
  const nq = normalizeWikiKey(query);
  if (!nq) return titles[0];
  const qTokens = nq.split(" ").filter(Boolean);
  let bestTitle: string | undefined;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const title of titles) {
    const nt = normalizeWikiKey(title);
    if (!nt) continue;
    const tTokens = nt.split(" ").filter(Boolean);
    const shared = tTokens.filter((t) => qTokens.includes(t)).length;
    const tokenRatio = qTokens.length ? shared / qTokens.length : 0;
    const contains = nt.includes(nq) ? 1 : 0;
    const starts = nt.startsWith(nq) ? 1 : 0;
    const lenPenalty = Math.abs(nt.length - nq.length);
    const score = (nt === nq ? 200 : 0) + contains * 80 + starts * 20 + tokenRatio * 70 - lenPenalty;
    if (score > bestScore) {
      bestScore = score;
      bestTitle = title;
    }
  }
  if (bestScore < 25) return undefined;
  return bestTitle ?? titles[0];
}

function wikipediaTitleMatchesQuery(query: string, title: string): boolean {
  const nq = normalizeWikiKey(query);
  const nt = normalizeWikiKey(title);
  if (!nq || !nt) return false;
  if (nt === nq || nt.includes(nq) || nq.includes(nt)) return true;
  const qTokens = nq.split(" ").filter((t) => t.length >= 4);
  if (!qTokens.length) return false;
  const shared = qTokens.filter((t) => nt.includes(t)).length;
  return shared >= Math.min(2, qTokens.length);
}

async function fetchWikipediaTitleByCoords(lat?: number, lng?: number): Promise<string | undefined> {
  if (typeof lat !== "number" || typeof lng !== "number") return undefined;
  const endpoints = [
    `https://de.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}%7C${lng}&gsradius=10000&gslimit=1&format=json&origin=*`,
    `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}%7C${lng}&gsradius=10000&gslimit=1&format=json&origin=*`,
  ];
  for (const url of endpoints) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();
      const title = (data?.query?.geosearch?.[0]?.title || "").toString().trim();
      if (title) return title;
    } catch {
      // ignore and try next source
    }
  }
  return undefined;
}

async function fetchWikipediaDiscoveryInfo(
  name: string,
  lat?: number,
  lng?: number,
  options?: { allowGeoFallback?: boolean }
): Promise<{ text?: string; photo?: string }> {
  const candidates = buildDiscoveryQueryCandidates(name);
  if (candidates.length === 0) return {};
  const allowGeoFallback = options?.allowGeoFallback ?? false;

  for (const query of candidates) {
    const exact = await fetchWikipediaSummaryByTitle(query);
    if (exact) {
      const intro = await fetchWikipediaIntroByTitle(exact.title || query);
      const picked = cleanWikipediaText(intro || exact.text || "");
      if (!isWeakWikipediaText(picked)) return { text: picked, photo: exact.photo };
    }

    const titles = await fetchWikipediaOpenSearchTitles(query);
    const bestTitle = pickBestWikipediaTitle(query, titles);
    if (bestTitle) {
      const best = await fetchWikipediaSummaryByTitle(bestTitle);
      if (best) {
        const intro = await fetchWikipediaIntroByTitle(best.title || bestTitle);
        const picked = cleanWikipediaText(intro || best.text || "");
        if (!isWeakWikipediaText(picked)) return { text: picked, photo: best.photo };
      }
    }
  }

  // Avoid nearest-article fallback for named POIs — it often picks unrelated nearby articles.
  if (!allowGeoFallback) return {};

  const nearbyTitle = await fetchWikipediaTitleByCoords(lat, lng);
  if (nearbyTitle && wikipediaTitleMatchesQuery(name, nearbyTitle)) {
    const near = await fetchWikipediaSummaryByTitle(nearbyTitle);
    if (near) {
      const intro = await fetchWikipediaIntroByTitle(near.title || nearbyTitle);
      const picked = cleanWikipediaText(intro || near.text || "");
      if (!isWeakWikipediaText(picked)) return { text: picked, photo: near.photo };
    }
  }

  return {};
}

function getHotelDates(
  stop: RouteStop,
  idx: number,
  hotelStops: RouteStop[],
  tripStartDate: string
): { checkIn: string; checkOut: string; nights: number } {
  const nights = Math.max(1, Number(stop.hotelNights) || 2);
  const isBookedAnchor = !!stop.bookingConfirmation && !!stop.hotelCheckIn;
  let checkIn = isBookedAnchor ? (stop.hotelCheckIn || "") : "";
  if (!checkIn) {
    if (idx === 0) {
      checkIn = tripStartDate || stop.hotelCheckIn || "";
    } else {
      const prev = getHotelDates(hotelStops[idx - 1], idx - 1, hotelStops, tripStartDate);
      checkIn = prev.checkOut || stop.hotelCheckIn || "";
    }
  }
  const checkOut = checkIn ? addDaysISO(checkIn, nights) : "";
  return { checkIn, checkOut, nights };
}

// --- Google Static Maps API ---
async function loadMapImage(
  stops: RouteStop[],
  apiKey: string,
  routeByNames?: { origin: string; destination: string; waypoints: string[] },
  routedSegments?: RoutedSegment[] | null,
  encodedRouteOverride?: string | null,
  markerStops?: RouteStop[],
  hotelLabelByCityKey?: Map<string, string>,
  useTiledOverview?: boolean
): Promise<string | null> {
  const isValidCoord = (lat?: number, lng?: number) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    // Ignore default/null-island fallback coordinates.
    if (Math.abs(Number(lat)) < 0.0001 && Math.abs(Number(lng)) < 0.0001) return false;
    return true;
  };
  const isHotelMarkerStop = (s: RouteStop) =>
    !!(
      s.isHotel ||
      s.bookingConfirmation ||
      s.bookingHotelName ||
      s.hotelCheckIn ||
      Number(s.hotelNights || 0) > 0
    );
  const valid = stops.filter((s) => isValidCoord(s.lat, s.lng));

  const markerSource = (markerStops && markerStops.length > 0 ? markerStops : valid)
    .filter((s) => isValidCoord(s.lat, s.lng));
  const hotelDotPoints = markerSource
    .filter((s) => isHotelMarkerStop(s))
    .map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) }))
    .filter((p) => isValidCoord(p.lat, p.lng));

  const jsRouteByNames = routeByNames
    ? await loadRouteByNamesViaJsApi(routeByNames.origin, routeByNames.destination, routeByNames.waypoints)
    : null;
  const encodedRouteFromNames = routeByNames
    ? await loadEncodedRoutePathByNames(routeByNames.origin, routeByNames.destination, routeByNames.waypoints, apiKey)
    : null;
  const encodedRouteFromCoords = valid.length >= 2 ? await loadEncodedRoutePath(valid, apiKey) : null;
  const hasJsOverviewPoints = (jsRouteByNames?.overviewPoints?.length || 0) > 1;
  const encodedRoute = encodedRouteOverride || jsRouteByNames?.encodedPolyline || encodedRouteFromCoords || encodedRouteFromNames;
  const namedSegmentData = encodedRoute || hasJsOverviewPoints || valid.length < 2 ? null : await loadEncodedRoutePathSegmentsByNames(valid, apiKey);
  const chunkedSegmentData = encodedRoute || hasJsOverviewPoints || valid.length < 2 ? null : await loadEncodedRoutePathSegmentsChunked(valid, apiKey);
  const segmentData = encodedRoute
    ? null
    : (jsRouteByNames?.segments || chunkedSegmentData || namedSegmentData || routedSegments || await loadEncodedRoutePathSegmentsViaJsApi(valid) || await loadEncodedRoutePathSegments(valid, apiKey));
  const routePoints: Array<{ lat: number; lng: number }> = [];
  if (hasJsOverviewPoints) {
    const jsPoints = simplifyPolylinePoints(jsRouteByNames?.overviewPoints || [], 2400);
    if (jsPoints.length > 1) routePoints.push(...jsPoints);
  }
  const pushPolyline = (encoded: string | null | undefined) => {
    if (!encoded) return;
    const decoded = decodePolyline(encoded);
    if (decoded.length < 2) return;
    const simplified = simplifyPolylinePoints(decoded, 2400);
    if (simplified.length < 2) return;
    if (routePoints.length > 0) {
      const prev = routePoints[routePoints.length - 1];
      const first = simplified[0];
      const samePoint = Math.abs(prev.lat - first.lat) < 0.00001 && Math.abs(prev.lng - first.lng) < 0.00001;
      routePoints.push(...(samePoint ? simplified.slice(1) : simplified));
      return;
    }
    routePoints.push(...simplified);
  };
  if (routePoints.length < 2 && encodedRoute) {
    pushPolyline(encodedRoute);
  } else if (routePoints.length < 2) {
    for (const seg of segmentData || []) pushPolyline(seg.polyline);
  }
  if (routePoints.length < 2) {
    const perLegSegments = await loadEncodedRoutePathSegments(valid, apiKey);
    for (const seg of perLegSegments || []) pushPolyline(seg.polyline);
  }
  if (routePoints.length < 2 && markerSource.length === 0) return null;
  // NOTE:
  // For print/PDF stability we use Google Static Maps as primary source.
  // Tiled/OSM rendering remains available in codebase, but is intentionally
  // disabled here because it introduced mismatched/straight-line artifacts.
  const STATIC_MAP_W = 640;
  const STATIC_MAP_H = 500;
  const STATIC_MAP_SCALE = 2;
  const viewport = computeStaticMapViewport(
    routePoints.length >= 2
      ? routePoints
      : markerSource.map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) })),
    STATIC_MAP_W,
    STATIC_MAP_H
  );
  if (!viewport) return null;
  const baseUrl = `https://maps.googleapis.com/maps/api/staticmap?size=${STATIC_MAP_W}x${STATIC_MAP_H}&scale=${STATIC_MAP_SCALE}&maptype=roadmap&center=${encodeURIComponent(`${viewport.centerLat},${viewport.centerLng}`)}&zoom=${viewport.zoom}`;
  const url = `${baseUrl}&key=${apiKey}`;
  const baseDataUrl = await fetchStaticMapDataUrl(url);
  if (!baseDataUrl) return null;
  if (routePoints.length < 2) return baseDataUrl;
  try {
    const mapImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = reject;
      node.src = baseDataUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = mapImage.width;
    canvas.height = mapImage.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return baseDataUrl;
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
    const centerWorld = latLngToWorld(viewport.centerLat, viewport.centerLng);
    const worldScale = (2 ** viewport.zoom) * STATIC_MAP_SCALE;
    const toPx = (p: { lat: number; lng: number }) => {
      const w = latLngToWorld(p.lat, p.lng);
      return {
        x: (w.x - centerWorld.x) * worldScale + canvas.width / 2,
        y: (w.y - centerWorld.y) * worldScale + canvas.height / 2,
      };
    };
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i < routePoints.length; i++) {
      const pos = toPx(routePoints[i]);
      if (i === 0) ctx.moveTo(pos.x, pos.y);
      else ctx.lineTo(pos.x, pos.y);
    }
    ctx.stroke();
    drawNumberedRouteMarkers(ctx, valid, toPx);
    return canvas.toDataURL("image/png", 0.95);
  } catch {
    return baseDataUrl;
  }
}

function latLngToWorld(lat: number, lng: number): { x: number; y: number } {
  const siny = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999);
  return {
    x: 256 * (0.5 + lng / 360),
    y: 256 * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)),
  };
}

function worldToLatLng(x: number, y: number): { lat: number; lng: number } {
  const lng = (x / 256 - 0.5) * 360;
  const n = Math.PI - (2 * Math.PI * y) / 256;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

function computeStaticMapViewport(
  points: Array<{ lat: number; lng: number }>,
  widthPx: number,
  heightPx: number
): { centerLat: number; centerLng: number; zoom: number } | null {
  if (points.length === 0) return null;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    const w = latLngToWorld(p.lat, p.lng);
    minX = Math.min(minX, w.x);
    maxX = Math.max(maxX, w.x);
    minY = Math.min(minY, w.y);
    maxY = Math.max(maxY, w.y);
  }
  const centerWorldX = (minX + maxX) / 2;
  const centerWorldY = (minY + maxY) / 2;
  const spanX = Math.max(0.0001, maxX - minX);
  const spanY = Math.max(0.0001, maxY - minY);
  const padX = widthPx * 0.05;
  const padY = heightPx * 0.05;
  const usableW = Math.max(64, widthPx - padX * 2);
  const usableH = Math.max(64, heightPx - padY * 2);
  const zoomX = Math.log2(usableW / spanX);
  const zoomY = Math.log2(usableH / spanY);
  const baseZoom = Math.max(3, Math.min(10, Math.floor(Math.min(zoomX, zoomY))));
  const center = worldToLatLng(centerWorldX, centerWorldY);
  const centerWorld = latLngToWorld(center.lat, center.lng);
  const fitsAll = (zoom: number): boolean => {
    const scale = 2 ** zoom;
    const marginX = widthPx * 0.04;
    const marginY = heightPx * 0.04;
    for (const p of points) {
      const w = latLngToWorld(p.lat, p.lng);
      const x = (w.x - centerWorld.x) * scale + widthPx / 2;
      const y = (w.y - centerWorld.y) * scale + heightPx / 2;
      if (x < marginX || x > widthPx - marginX || y < marginY || y > heightPx - marginY) {
        return false;
      }
    }
    return true;
  };
  let zoom = Math.min(10, baseZoom + 1); // Prefer one step more detail.
  while (zoom > 3 && !fitsAll(zoom)) zoom -= 1;
  return { centerLat: center.lat, centerLng: center.lng, zoom };
}

async function fetchStaticMapDataUrl(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await blobToDataURL(blob);
  } catch {
    return null;
  }
}

async function composeStaticMapLayers(dataUrls: string[]): Promise<string | null> {
  if (dataUrls.length === 0) return null;
  if (dataUrls.length === 1) return dataUrls[0];
  try {
    const images = await Promise.all(
      dataUrls.map(
        (src) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("map layer load failed"));
            img.src = src;
          })
      )
    );
    const first = images[0];
    const canvas = document.createElement("canvas");
    canvas.width = first.width;
    canvas.height = first.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    for (const img of images) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    return canvas.toDataURL("image/png", 0.95);
  } catch {
    return dataUrls[0] || null;
  }
}

async function loadTiledOverviewMap(
  validStops: RouteStop[],
  apiKey: string,
  markersQuery: string,
  routeParam: string
): Promise<string | null> {
  if (validStops.length < 2) return null;
  const tileSize = 512;
  const scale = 2;
  const tilePx = tileSize * scale;
  const cols = 2;
  const rows = 2;
  const outW = cols * tilePx;
  const outH = rows * tilePx;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const s of validStops) {
    const w = latLngToWorld(Number(s.lat), Number(s.lng));
    minX = Math.min(minX, w.x);
    maxX = Math.max(maxX, w.x);
    minY = Math.min(minY, w.y);
    maxY = Math.max(maxY, w.y);
  }
  const dx0 = Math.max(0.0001, maxX - minX);
  const dy0 = Math.max(0.0001, maxY - minY);
  const zoomX = Math.log2((outW * 0.78) / dx0);
  const zoomY = Math.log2((outH * 0.78) / dy0);
  const zoom = Math.max(3, Math.min(11, Math.floor(Math.min(zoomX, zoomY))));
  const centerWorld = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  const zScale = 2 ** zoom;

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  let loadedTiles = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = (col - (cols - 1) / 2) * tilePx;
      const offsetY = (row - (rows - 1) / 2) * tilePx;
      const worldX = centerWorld.x + offsetX / zScale;
      const worldY = centerWorld.y + offsetY / zScale;
      const { lat, lng } = worldToLatLng(worldX, worldY);
      const centerParam = `center=${encodeURIComponent(`${lat},${lng}`)}&zoom=${zoom}`;
      const routePart = routeParam ? `&${routeParam}` : "";
      const markerPart = markersQuery ? `&${markersQuery}` : "";
      const url = `https://maps.googleapis.com/maps/api/staticmap?size=${tileSize}x${tileSize}&scale=${scale}&maptype=roadmap&${centerParam}${markerPart}${routePart}&key=${apiKey}`;
      const tileDataUrl = await fetchStaticMapDataUrl(url);
      if (!tileDataUrl) continue;
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const node = new Image();
        node.onload = () => resolve(node);
        node.onerror = reject;
        node.src = tileDataUrl;
      });
      ctx.drawImage(img, col * tilePx, row * tilePx, tilePx, tilePx);
      loadedTiles += 1;
    }
  }
  if (loadedTiles !== rows * cols) return null;
  return canvas.toDataURL("image/png", 0.95);
}

async function loadOsmOverviewMap(
  stops: RouteStop[],
  hotelStops: RouteStop[],
  encodedRoute?: string | null,
  segmentData?: RoutedSegment[] | null
): Promise<string | null> {
  const validStops = stops.filter((s) => s.lat != null && s.lng != null);
  if (validStops.length < 2) return null;

  let routePoints: Array<{ lat: number; lng: number }> = [];
  if (encodedRoute) {
    routePoints = decodePolyline(encodedRoute);
  } else if (segmentData && segmentData.length > 0) {
    for (const seg of segmentData) {
      if (!seg.polyline) continue;
      routePoints.push(...decodePolyline(seg.polyline));
    }
  }
  if (routePoints.length < 2) {
    routePoints = validStops.map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) }));
  }

  const pointsForBounds = routePoints.length > 1
    ? routePoints
    : validStops.map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) }));
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pointsForBounds) {
    const w = latLngToWorld(p.lat, p.lng);
    minX = Math.min(minX, w.x);
    maxX = Math.max(maxX, w.x);
    minY = Math.min(minY, w.y);
    maxY = Math.max(maxY, w.y);
  }
  const outW = 2048;
  const outH = 1536;
  const dx0 = Math.max(0.0001, maxX - minX);
  const dy0 = Math.max(0.0001, maxY - minY);
  const zoomX = Math.log2((outW * 0.85) / dx0);
  const zoomY = Math.log2((outH * 0.85) / dy0);
  const zoom = Math.max(3, Math.min(10, Math.floor(Math.min(zoomX, zoomY))));
  const zScale = 2 ** zoom;
  const centerWorld = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  const centerGlobalPx = { x: centerWorld.x * zScale, y: centerWorld.y * zScale };
  const left = centerGlobalPx.x - outW / 2;
  const top = centerGlobalPx.y - outH / 2;
  const right = left + outW;
  const bottom = top + outH;

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const tileSize = 256;
  const minTileX = Math.floor(left / tileSize);
  const maxTileX = Math.floor((right - 1) / tileSize);
  const minTileY = Math.floor(top / tileSize);
  const maxTileY = Math.floor((bottom - 1) / tileSize);
  const maxTileIndex = 2 ** zoom;
  const loadTile = async (x: number, y: number): Promise<HTMLImageElement | null> => {
    if (y < 0 || y >= maxTileIndex) return null;
    const wrapX = ((x % maxTileIndex) + maxTileIndex) % maxTileIndex;
    const tileUrl = `https://tile.openstreetmap.org/${zoom}/${wrapX}/${y}.png`;
    try {
      const proxied = await fetch(`/api/image-proxy?url=${encodeURIComponent(tileUrl)}`);
      if (!proxied.ok) return null;
      const blob = await proxied.blob();
      const dataUrl = await blobToDataURL(blob);
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("tile load failed"));
        img.src = dataUrl;
      });
    } catch {
      return null;
    }
  };

  for (let ty = minTileY; ty <= maxTileY; ty++) {
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      const img = await loadTile(tx, ty);
      if (!img) continue;
      const dx = tx * tileSize - left;
      const dy = ty * tileSize - top;
      ctx.drawImage(img, dx, dy, tileSize, tileSize);
    }
  }

  // Draw route on top.
  if (routePoints.length > 1) {
    ctx.strokeStyle = "#ff0000";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 0; i < routePoints.length; i++) {
      const p = routePoints[i];
      const w = latLngToWorld(p.lat, p.lng);
      const x = w.x * zScale - left;
      const y = w.y * zScale - top;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Draw hotel dots.
  ctx.fillStyle = "#f59e0b";
  for (const s of hotelStops) {
    if (s.lat == null || s.lng == null) continue;
    const w = latLngToWorld(Number(s.lat), Number(s.lng));
    const x = w.x * zScale - left;
    const y = w.y * zScale - top;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvas.toDataURL("image/png", 0.95);
}

const OVERVIEW_MAP_CACHE_PREFIX = "sniffertrek_pdf_overview_map_v12:";
const overviewMapMemoryCache = new Map<string, string>();

function isHotelLikeStop(s: RouteStop): boolean {
  return !!(
    s.isHotel ||
    s.bookingConfirmation ||
    s.bookingHotelName ||
    s.hotelCheckIn ||
    Number(s.hotelNights || 0) > 0
  );
}

function hashString(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function buildOverviewHotelLabels(hotelStops: RouteStop[]): { legend: string[]; labelByCityKey: Map<string, string> } {
  const legend: string[] = [];
  const labelByCityKey = new Map<string, string>();
  for (const s of hotelStops) {
    const city = extractCity(s.name).trim();
    const cityKey = normalizePlaceKey(city);
    if (!city || !cityKey || labelByCityKey.has(cityKey)) continue;
    labelByCityKey.set(cityKey, city);
    legend.push(city);
  }
  return { legend, labelByCityKey };
}

function buildOverviewMarkerStops(mainStops: RouteStop[]): RouteStop[] {
  const seen = new Set<string>();
  return mainStops.filter((s) => {
    if (!s.name.trim()) return false;
    if (s.lat == null || s.lng == null) return false;
    const key = `${normalizePlaceKey(s.name)}:${s.lat}:${s.lng}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function markerLabelForStop(stop: RouteStop, index: number, total: number): string {
  if (index === 0) return "A";
  if (index === total - 1) return "B";
  return String(index);
}

function markerColorForStop(stop: RouteStop, index: number, total: number): string {
  if (index === 0) return "#3b82f6";
  if (index === total - 1) return "#ef4444";
  if (stop.isHotel && stop.bookingConfirmation) return "#22c55e";
  if (stop.isHotel) return "#a855f7";
  return "#f97316";
}

function drawNumberedRouteMarkers(
  ctx: CanvasRenderingContext2D,
  stops: RouteStop[],
  toPx: (p: { lat: number; lng: number }) => { x: number; y: number }
): void {
  const valid = stops.filter((s) => s.lat != null && s.lng != null);
  if (valid.length === 0) return;
  for (let i = 0; i < valid.length; i++) {
    const s = valid[i];
    const pos = toPx({ lat: Number(s.lat), lng: Number(s.lng) });
    const color = markerColorForStop(s, i, valid.length);
    const label = markerLabelForStop(s, i, valid.length);
    const radius = 13;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, pos.x, pos.y + 0.5);
  }
}

function buildOverviewHotelMarkerStops(mainStops: RouteStop[], allHotelStops: RouteStop[]): RouteStop[] {
  const hotelCityKeys = new Set(
    allHotelStops
      .map((s) => normalizePlaceKey(extractCity(s.name)))
      .filter(Boolean)
  );
  const out: RouteStop[] = [];
  const seen = new Set<string>();
  const pushUnique = (s: RouteStop) => {
    if (s.lat == null || s.lng == null) return;
    const key = `${normalizePlaceKey(extractCity(s.name))}:${Number(s.lat).toFixed(5)}:${Number(s.lng).toFixed(5)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(s);
  };

  // Prefer on-route positions for map alignment.
  for (const s of mainStops) {
    const cityKey = normalizePlaceKey(extractCity(s.name));
    if (!cityKey) continue;
    if (isHotelLikeStop(s) || hotelCityKeys.has(cityKey)) {
      pushUnique({ ...s, isHotel: true });
    }
  }
  // Add any remaining hotel stops that are not in route list.
  for (const s of allHotelStops) {
    if (!isHotelLikeStop(s)) continue;
    pushUnique({ ...s, isHotel: true });
  }
  return out;
}

function buildOverviewRouteStops(trip: Trip): RouteStop[] {
  const routeStops = (trip.routes?.route?.stops && trip.routes.route.stops.length > 0
    ? trip.routes.route.stops
    : trip.stops
  ).filter((s) => s.name.trim());
  const viaPoints = (trip.routes?.route?.viaPoints || []).filter(
    (vp) => Number.isFinite(vp.lat) && Number.isFinite(vp.lng)
  );
  if (viaPoints.length === 0) return routeStops;

  const viaByStop = new Map<string, Array<{ id: string; lat: number; lng: number }>>();
  for (let i = 0; i < viaPoints.length; i++) {
    const vp = viaPoints[i];
    const key = vp.afterStopId || routeStops[0]?.id || "start";
    const arr = viaByStop.get(key) || [];
    arr.push({ id: vp.id || `via_${i}`, lat: vp.lat, lng: vp.lng });
    viaByStop.set(key, arr);
  }

  const merged: RouteStop[] = [];
  for (const stop of routeStops) {
    merged.push(stop);
    const list = viaByStop.get(stop.id) || [];
    for (const vp of list) {
      merged.push({
        id: `via_${vp.id}`,
        name: "",
        type: "stop",
        lat: vp.lat,
        lng: vp.lng,
      });
    }
  }
  return merged;
}

function getPreferredOverviewPolyline(trip: Trip): string | undefined {
  return (
    trip.routes?.route?.overviewPolyline ||
    trip.routes?.car?.overviewPolyline ||
    trip.routes?.train?.overviewPolyline ||
    trip.routes?.flights?.overviewPolyline
  );
}

function buildOverviewRouteByNames(mainStops: RouteStop[]): { origin: string; destination: string; waypoints: string[] } | null {
  const named = mainStops.map((s) => s.name.trim()).filter(Boolean);
  if (named.length < 2) return null;
  return {
    origin: named[0],
    destination: named[named.length - 1],
    waypoints: named.slice(1, -1).slice(0, 23),
  };
}

function buildOverviewMapCacheKey(stops: RouteStop[], legend: string[], routeSeed?: string): string {
  const payload = JSON.stringify({
    stops: stops.map((s) => ({
      name: extractCity(s.name),
      lat: s.lat ?? null,
      lng: s.lng ?? null,
      type: s.type,
      isHotel: !!s.isHotel,
    })),
    legend,
    routeSeed: routeSeed || "",
  });
  return `${OVERVIEW_MAP_CACHE_PREFIX}${hashString(payload)}`;
}

function readOverviewMapCache(cacheKey: string): string | null {
  const mem = overviewMapMemoryCache.get(cacheKey);
  if (mem) return mem;
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    overviewMapMemoryCache.set(cacheKey, raw);
    return raw;
  } catch {
    return null;
  }
}

function writeOverviewMapCache(cacheKey: string, dataUrl: string): void {
  overviewMapMemoryCache.set(cacheKey, dataUrl);
  if (typeof window === "undefined") return;
  // Avoid exhausting localStorage quota with very large map payloads.
  if (dataUrl.length > 2_000_000) return;
  try {
    localStorage.setItem(cacheKey, dataUrl);
  } catch {
    // ignore quota errors
  }
}

async function fetchDirectionsData(args: {
  origin: string;
  destination: string;
  waypoints?: string[];
  apiKey: string;
}): Promise<any | null> {
  try {
    const resp = await fetch("/api/directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: args.origin,
        destination: args.destination,
        waypoints: args.waypoints || [],
        mode: "driving",
        apiKey: args.apiKey,
      }),
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

async function loadEncodedRoutePathSegments(stops: RouteStop[], apiKey: string): Promise<RoutedSegment[] | null> {
  if (stops.length < 2) return null;
  const segments: RoutedSegment[] = [];
  const maxSegments = Math.min(stops.length - 1, 40);
  for (let i = 0; i < maxSegments; i++) {
    const fromStop = stops[i];
    const toStop = stops[i + 1];
    if (fromStop.lat == null || fromStop.lng == null || toStop.lat == null || toStop.lng == null) continue;
    const from = `${fromStop.lat},${fromStop.lng}`;
    const to = `${toStop.lat},${toStop.lng}`;
    const fromKey = normalizePlaceKey(extractCity(fromStop.name));
    const toKey = normalizePlaceKey(extractCity(toStop.name));
    try {
      const data = await fetchDirectionsData({
        origin: from,
        destination: to,
        apiKey,
      });
      if (!data) continue;
      const points = data?.routes?.[0]?.overview_polyline?.points;
      if (typeof points === "string" && points.length > 0) {
        const meters = Number(data?.routes?.[0]?.legs?.[0]?.distance?.value);
        const seconds = Number(data?.routes?.[0]?.legs?.[0]?.duration?.value);
        segments.push({
          fromKey,
          toKey,
          polyline: points,
          distanceMeters: Number.isFinite(meters) ? meters : undefined,
          durationSeconds: Number.isFinite(seconds) ? seconds : undefined,
        });
      }
    } catch {
      // skip segment if routing fails
    }
  }
  return segments.length > 0 ? segments : null;
}

async function loadEncodedRoutePathSegmentsViaJsApi(stops: RouteStop[]): Promise<RoutedSegment[] | null> {
  if (stops.length < 2) return null;
  const w = window as any;
  const g = w.google;
  if (!g?.maps?.DirectionsService || !g.maps.TravelMode) return null;
  const service = new g.maps.DirectionsService();
  const segments: RoutedSegment[] = [];
  const maxSegments = Math.min(stops.length - 1, 80);
  for (let i = 0; i < maxSegments; i++) {
    const fromStop = stops[i];
    const toStop = stops[i + 1];
    if (fromStop.lat == null || fromStop.lng == null || toStop.lat == null || toStop.lng == null) continue;
    const from = `${fromStop.lat},${fromStop.lng}`;
    const to = `${toStop.lat},${toStop.lng}`;
    const fromKey = normalizePlaceKey(extractCity(fromStop.name));
    const toKey = normalizePlaceKey(extractCity(toStop.name));
    try {
      const res = await new Promise<any>((resolve, reject) => {
        service.route(
          {
            origin: from,
            destination: to,
            travelMode: g.maps.TravelMode.DRIVING,
          },
          (result: any, status: string) => {
            if (status === "OK" && result) resolve(result);
            else reject(new Error(status || "Directions failed"));
          }
        );
      });
      const points = res?.routes?.[0]?.overview_polyline?.points;
      if (typeof points === "string" && points.length > 0) {
        const meters = Number(res?.routes?.[0]?.legs?.[0]?.distance?.value);
        const seconds = Number(res?.routes?.[0]?.legs?.[0]?.duration?.value);
        segments.push({
          fromKey,
          toKey,
          polyline: points,
          distanceMeters: Number.isFinite(meters) ? meters : undefined,
          durationSeconds: Number.isFinite(seconds) ? seconds : undefined,
        });
      }
    } catch {
      // skip segment if routing fails
    }
  }
  return segments.length > 0 ? segments : null;
}

async function loadEncodedRoutePathSegmentsByNames(stops: RouteStop[], apiKey: string): Promise<RoutedSegment[] | null> {
  const named = stops.filter((s) => s.name.trim());
  if (named.length < 2) return null;
  const segments: RoutedSegment[] = [];
  const maxSegments = Math.min(named.length - 1, 80);
  for (let i = 0; i < maxSegments; i++) {
    const fromStop = named[i];
    const toStop = named[i + 1];
    try {
      const points = await loadEncodedRoutePathByNames(fromStop.name, toStop.name, [], apiKey);
      if (!points) continue;
      segments.push({
        fromKey: normalizePlaceKey(extractCity(fromStop.name)),
        toKey: normalizePlaceKey(extractCity(toStop.name)),
        polyline: points,
      });
    } catch {
      // skip this segment
    }
  }
  return segments.length > 0 ? segments : null;
}

async function loadEncodedRoutePathSegmentsChunked(stops: RouteStop[], apiKey: string): Promise<RoutedSegment[] | null> {
  const valid = stops.filter((s) => s.lat != null && s.lng != null);
  if (valid.length < 2) return null;
  const segments: RoutedSegment[] = [];
  const maxPointsPerRequest = 25; // origin + destination + 23 waypoints
  let start = 0;
  while (start < valid.length - 1) {
    const end = Math.min(valid.length - 1, start + maxPointsPerRequest - 1);
    const chunk = valid.slice(start, end + 1);
    const origin = `${chunk[0].lat},${chunk[0].lng}`;
    const destination = `${chunk[chunk.length - 1].lat},${chunk[chunk.length - 1].lng}`;
    const waypoints = chunk.slice(1, -1).map((s) => `${s.lat},${s.lng}`);
    try {
      const points = await loadEncodedRoutePathByNames(origin, destination, waypoints, apiKey);
      if (points) {
        segments.push({
          fromKey: normalizePlaceKey(extractCity(chunk[0].name)),
          toKey: normalizePlaceKey(extractCity(chunk[chunk.length - 1].name)),
          polyline: points,
        });
      }
    } catch {
      // ignore and continue with next chunk
    }
    if (end >= valid.length - 1) break;
    start = end;
  }
  return segments.length > 0 ? segments : null;
}

async function loadEncodedRoutePathByNames(
  origin: string,
  destination: string,
  waypoints: string[],
  apiKey: string
): Promise<string | null> {
  if (!origin.trim() || !destination.trim()) return null;
  try {
    const data = await fetchDirectionsData({
      origin,
      destination,
      waypoints: waypoints.map((w) => w.trim()).filter(Boolean),
      apiKey,
    });
    if (!data) return null;
    const points = data?.routes?.[0]?.overview_polyline?.points;
    return typeof points === "string" && points.length > 0 ? points : null;
  } catch {
    return null;
  }
}

async function loadEncodedRoutePath(stops: RouteStop[], apiKey: string): Promise<string | null> {
  const valid = stops.filter((s) => s.lat != null && s.lng != null);
  if (valid.length < 2) return null;
  const origin = `${valid[0].lat},${valid[0].lng}`;
  const destination = `${valid[valid.length - 1].lat},${valid[valid.length - 1].lng}`;
  const waypoints = valid
    .slice(1, -1)
    .slice(0, 23)
    .map((s) => `${s.lat},${s.lng}`)
    .join("|");
  try {
    const data = await fetchDirectionsData({
      origin,
      destination,
      waypoints: waypoints ? waypoints.split("|") : [],
      apiKey,
    });
    if (!data) return null;
    const points = data?.routes?.[0]?.overview_polyline?.points;
    return typeof points === "string" && points.length > 0 ? points : null;
  } catch {
    return null;
  }
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function loadImageAsDataURL(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:image/")) return url;
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const dataUrl = await blobToDataURL(blob);
    if (blob.type.includes("webp")) {
      return await convertDataUrlToJpeg(dataUrl);
    }
    return dataUrl;
  } catch {
    return null;
  }
}

async function loadPhotoAsset(url: string): Promise<{ dataUrl: string; format: "PNG" | "JPEG"; aspect: number } | null> {
  const dataUrl = await loadImageAsDataURL(url);
  if (!dataUrl) return null;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = reject;
      node.src = dataUrl;
    });
    const aspect = img.width > 0 && img.height > 0 ? img.width / img.height : 1.4;
    return { dataUrl, format: dataUrlFormat(dataUrl), aspect };
  } catch {
    return { dataUrl, format: dataUrlFormat(dataUrl), aspect: 1.4 };
  }
}

async function getDataUrlAspect(dataUrl: string): Promise<number | null> {
  if (!dataUrl) return null;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = reject;
      node.src = dataUrl;
    });
    if (!img.width || !img.height) return null;
    return img.width / img.height;
  } catch {
    return null;
  }
}

function drawImageContained(
  doc: jsPDF,
  image: { dataUrl: string; format: "PNG" | "JPEG"; aspect: number },
  x: number,
  y: number,
  boxW: number,
  boxH: number
) {
  const boxAspect = boxW / boxH;
  const imgAspect = Math.max(0.1, image.aspect);
  let drawW = boxW;
  let drawH = boxH;
  if (imgAspect > boxAspect) {
    drawH = boxW / imgAspect;
  } else {
    drawW = boxH * imgAspect;
  }
  const dx = x + (boxW - drawW) / 2;
  const dy = y + (boxH - drawH) / 2;
  doc.addImage(image.dataUrl, image.format, dx, dy, drawW, drawH);
}

function resolvePhotoLayout(layout: PdfPhotoLayout, count: number): PdfPhotoLayout {
  if (layout !== "auto") return layout;
  if (count <= 1) return "onePerPageMax";
  if (count === 2) return "twoPortraitSideBySide";
  if (count >= 6) return "sixPortraitGrid";
  return "grid";
}

async function renderManualPhotoPages(
  doc: jsPDF,
  photoUrls: string[],
  layoutPref: PdfPhotoLayout,
  targetPages?: number
): Promise<void> {
  const uniquePhotos = Array.from(new Set(photoUrls)).slice(0, 24);
  if (uniquePhotos.length === 0) return;
  const assets = (await Promise.all(uniquePhotos.map((url) => loadPhotoAsset(url)))).filter(
    (a): a is { dataUrl: string; format: "PNG" | "JPEG"; aspect: number } => !!a
  );
  if (assets.length === 0) return;

  const layout = resolvePhotoLayout(layoutPref, assets.length);
  const gap = 10;

  type Asset = { dataUrl: string; format: "PNG" | "JPEG"; aspect: number };
  type Row = { kind: "landscape" | "portrait"; items: Asset[] };

  const isLandscape = (a: Asset) => a.aspect >= 1.05;

  // Build rows while preserving selection order and never mixing orientations in one row.
  const buildRows = (items: Asset[], portraitPerRow: number): Row[] => {
    const rows: Row[] = [];
    let pBuf: Asset[] = [];
    for (const a of items) {
      if (isLandscape(a)) {
        if (pBuf.length > 0) {
          rows.push({ kind: "portrait", items: pBuf });
          pBuf = [];
        }
        rows.push({ kind: "landscape", items: [a] });
      } else {
        pBuf.push(a);
        if (pBuf.length >= portraitPerRow) {
          rows.push({ kind: "portrait", items: pBuf });
          pBuf = [];
        }
      }
    }
    if (pBuf.length > 0) rows.push({ kind: "portrait", items: pBuf });
    return rows;
  };

  const estimateRowHeight = (row: Row): number => {
    if (row.kind === "landscape") {
      const a = row.items[0];
      return Math.max(130, Math.min(300, CONTENT_W / Math.max(1.05, a.aspect)));
    }
    const cols = row.items.length;
    const cellW = (CONTENT_W - gap * (cols - 1)) / cols;
    const avgAspect = row.items.reduce((s, it) => s + it.aspect, 0) / Math.max(1, cols);
    return Math.max(170, Math.min(320, cellW / Math.max(0.55, avgAspect)));
  };

  const drawRowsPage = (rows: Row[]) => {
    const availableH = PAGE_H - 2 * M;
    const estimated = rows.map(estimateRowHeight);
    const totalEstimated = estimated.reduce((s, h) => s + h, 0) + gap * Math.max(0, rows.length - 1);
    const scale = totalEstimated > 0 ? Math.min(1, availableH / totalEstimated) : 1;
    let y = M;
    rows.forEach((row, idx) => {
      const rowH = estimated[idx] * scale;
      if (row.kind === "landscape") {
        drawImageContained(doc, row.items[0], M, y, CONTENT_W, rowH);
      } else {
        const cols = row.items.length;
        const cellW = (CONTENT_W - gap * (cols - 1)) / cols;
        for (let c = 0; c < cols; c++) {
          drawImageContained(doc, row.items[c], M + c * (cellW + gap), y, cellW, rowH);
        }
      }
      y += rowH + gap;
    });
  };

  const drawRowsAcrossPages = (rows: Row[]) => {
    let idx = 0;
    while (idx < rows.length) {
      const pageRows: Row[] = [];
      let usedH = 0;
      while (idx < rows.length) {
        const h = estimateRowHeight(rows[idx]);
        const nextUsed = pageRows.length === 0 ? h : usedH + gap + h;
        if (nextUsed > PAGE_H - 2 * M && pageRows.length > 0) break;
        pageRows.push(rows[idx]);
        usedH = nextUsed;
        idx++;
      }
      doc.addPage();
      drawRowsPage(pageRows);
    }
  };

  if (layout === "onePerPageMax") {
    for (let i = 0; i < assets.length; i++) {
      doc.addPage();
      const top = M;
      const h = PAGE_H - 2 * M;
      drawImageContained(doc, assets[i], M, top, CONTENT_W, h);
    }
    return;
  }

  if (layout === "onePortraitTopHalf" || layout === "onePortraitBottomHalf") {
    for (let i = 0; i < assets.length; i++) {
      doc.addPage();
      const gapY = 10;
      const boxH = (PAGE_H - 2 * M - gapY) / 2;
      const yBox = layout === "onePortraitTopHalf" ? M : M + boxH + gapY;
      drawImageContained(doc, assets[i], M, yBox, CONTENT_W, boxH);
    }
    return;
  }

  if (layout === "twoPortraitSideBySide") {
    drawRowsAcrossPages(buildRows(assets, 2));
    return;
  }

  if (layout === "twoPortraitStacked" || layout === "twoMixedStacked") {
    for (let i = 0; i < assets.length; i += 2) {
      doc.addPage();
      const pair = assets.slice(i, i + 2);
      if (pair.length === 1) {
        drawImageContained(doc, pair[0], M, M, CONTENT_W, PAGE_H - 2 * M);
        continue;
      }
      const gapY = 10;
      const rowH = (PAGE_H - 2 * M - gapY) / 2;
      drawImageContained(doc, pair[0], M, M, CONTENT_W, rowH);
      drawImageContained(doc, pair[1], M, M + rowH + gapY, CONTENT_W, rowH);
    }
    return;
  }

  if (layout === "sixPortraitGrid") {
    drawRowsAcrossPages(buildRows(assets, 3));
    return;
  }

  if (layout === "threePortraitOneLandscape") {
    drawRowsAcrossPages(buildRows(assets, 3));
    return;
  }

  if (layout === "smartPages") {
    const requested = Math.max(1, Math.min(12, targetPages || 1));
    const minPagesNeeded = Math.ceil(assets.length / 6);
    const pages = Math.max(requested, minPagesNeeded);
    const pagesBuckets: Asset[][] = Array.from({ length: pages }, () => []);
    for (let i = 0; i < assets.length; i++) {
      pagesBuckets[i % pages].push(assets[i]);
    }
    for (const bucket of pagesBuckets) {
      if (bucket.length === 0) continue;
      const portraitRatio = bucket.filter((a) => !isLandscape(a)).length / Math.max(1, bucket.length);
      const portraitPerRow = portraitRatio >= 0.6 ? 3 : 2;
      drawRowsAcrossPages(buildRows(bucket, portraitPerRow));
    }
    return;
  }

  if (layout === "grid") {
    drawRowsAcrossPages(buildRows(assets, 3));
    return;
  }

}

function convertDataUrlToJpeg(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(dataUrl);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function dataUrlFormat(dataUrl: string): "PNG" | "JPEG" {
  return dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
}

function buildSentenceExcerpt(doc: jsPDF, text: string, maxWidth: number, maxLines: number): string[] {
  const clampLines = (lines: string[]): string[] => {
    if (lines.length <= maxLines) return lines;
    const clipped = lines.slice(0, maxLines);
    const last = (clipped[maxLines - 1] || "").replace(/[.,;:!?-]*\s*$/, "").trim();
    clipped[maxLines - 1] = `${last}...`;
    return clipped;
  };
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return clampLines(splitTextLines(doc, clean, maxWidth));

  const hardLimit = maxLines + 1; // allow one extra line to finish a sentence
  let built = "";
  for (let i = 0; i < sentences.length; i++) {
    const next = built ? `${built} ${sentences[i]}` : sentences[i];
    const nextLines = splitTextLines(doc, next, maxWidth);
    if (nextLines.length <= maxLines) {
      built = next;
      continue;
    }

    const currentLines = built ? splitTextLines(doc, built, maxWidth).length : 0;
    const almostFull = currentLines >= Math.max(1, maxLines - 1);
    if (almostFull && nextLines.length <= hardLimit) {
      built = next;
    }
    break;
  }

  if (!built) {
    const firstSentence = sentences[0];
    const lines = splitTextLines(doc, firstSentence, maxWidth);
    if (lines.length <= hardLimit) return lines;
    const clipped = lines.slice(0, hardLimit);
    const last = (clipped[hardLimit - 1] || "").replace(/[.,;:!?-]*\s*$/, "").trim();
    clipped[hardLimit - 1] = `${last}...`;
    return clipped;
  }
  const builtLines = splitTextLines(doc, built, maxWidth);
  if (builtLines.length <= hardLimit) return builtLines;
  const clipped = builtLines.slice(0, hardLimit);
  const last = (clipped[hardLimit - 1] || "").replace(/[.,;:!?-]*\s*$/, "").trim();
  clipped[hardLimit - 1] = `${last}...`;
  return clipped;
}

// -------------------------------------------------------------------
// Main export
// -------------------------------------------------------------------
export interface PdfOptions {
  trip: Trip;
  etappen: Etappe[];
  routeInfo?: { distance: string; duration: string; stops: number };
  googleApiKey?: string;
  onProgress?: (pct: number, msg: string) => void;
}

export async function prewarmOverviewMapForPdf(trip: Trip, googleApiKey?: string): Promise<string | null> {
  if (!googleApiKey) return null;
  const mainStops = buildOverviewRouteStops(trip);
  if (mainStops.length < 2) return null;
  const hotelStops = collectAllHotelStops(trip);
  const overviewHotelMarkerStops = buildOverviewHotelMarkerStops(mainStops, hotelStops);
  const { legend, labelByCityKey } = buildOverviewHotelLabels(hotelStops);
  const overviewMarkerStops = buildOverviewMarkerStops(mainStops);
  const overviewRouteByNames = buildOverviewRouteByNames(mainStops);
  const preferredPolyline = getPreferredOverviewPolyline(trip);
  const cacheKey = buildOverviewMapCacheKey(mainStops, legend, preferredPolyline);
  const cached = readOverviewMapCache(cacheKey);
  if (cached) return cached;
  const mapData = await loadMapImage(
    mainStops,
    googleApiKey,
    overviewRouteByNames || undefined,
    undefined,
    preferredPolyline || undefined,
    overviewHotelMarkerStops.length > 0 ? overviewHotelMarkerStops : overviewMarkerStops,
    labelByCityKey,
    false
  );
  if (mapData) {
    writeOverviewMapCache(cacheKey, mapData);
    return mapData;
  }
  return null;
}

export async function generateTripPDF(opts: PdfOptions): Promise<Blob> {
  const { trip, etappen, routeInfo, googleApiKey, onProgress } = opts;
  const exportOpts = resolvePdfExportOptions(trip);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const hotelStops = collectAllHotelStops(trip);
  const aiDiscoveriesByEtappe = collectAiDiscoveriesByEtappe(trip);
  const discoveryInfoCache = new Map<string, { text?: string; photo?: string }>();
  const overviewHotelLegend: string[] = [];
  const overviewHotelLabelByCityKey = new Map<string, string>();
  let pageNumber = 1;

  const progress = (pct: number, msg: string) => onProgress?.(pct, msg);

  // Pre-load map images
  progress(5, "Lade Karten...");
  let overviewMapData: string | null = null;
  const etappeMapData: (string | null)[] = [];
  const allStops = trip.stops.filter((s) => s.name.trim());
  const etappeStopsByIndex: RouteStop[][] = etappen.map((et) => getEtappeStopsForMap(et, allStops));
  const routedSegmentsByIndex: (RoutedSegment[] | null)[] = etappen.map(() => null);
  const encodedRouteByIndex: (string | null)[] = etappen.map(() => null);

  if (googleApiKey) {
    const mainStops = buildOverviewRouteStops(trip);
    const overviewMarkerStops = buildOverviewMarkerStops(mainStops);
    const { legend, labelByCityKey } = buildOverviewHotelLabels(hotelStops);
    const overviewHotelMarkerStops = buildOverviewHotelMarkerStops(mainStops, hotelStops);
    const overviewRouteByNames = buildOverviewRouteByNames(mainStops);
    const preferredPolyline = getPreferredOverviewPolyline(trip);
    for (const row of legend) overviewHotelLegend.push(row);
    for (const [k, v] of labelByCityKey.entries()) overviewHotelLabelByCityKey.set(k, v);
    if (exportOpts.overviewMap) {
      const overviewCacheKey = buildOverviewMapCacheKey(mainStops, overviewHotelLegend, preferredPolyline);
      overviewMapData = readOverviewMapCache(overviewCacheKey);
      if (!overviewMapData) {
        overviewMapData = await loadMapImage(
          mainStops,
          googleApiKey,
          overviewRouteByNames || undefined,
          undefined,
          preferredPolyline || undefined,
          overviewHotelMarkerStops.length > 0 ? overviewHotelMarkerStops : overviewMarkerStops,
          overviewHotelLabelByCityKey,
          false
        );
        if (overviewMapData) writeOverviewMapCache(overviewCacheKey, overviewMapData);
      }
    }

    for (let i = 0; i < etappen.length; i++) {
      const et = etappen[i];
      const etappeStops = etappeStopsByIndex[i] || [];
      let routedSegments: RoutedSegment[] | null = null;
      let encodedByNames: string | null = null;
      const nameChain = etappeStops.map((s) => s.name.trim()).filter(Boolean);
      const originName = nameChain[0] || et.from;
      const destinationName = nameChain[nameChain.length - 1] || et.to;
      const waypointNames = nameChain.length > 2 ? nameChain.slice(1, -1) : et.legs.slice(0, -1).map((l) => l.to);
      const jsRoute = await loadRouteByNamesViaJsApi(originName, destinationName, waypointNames);
      if (jsRoute) {
        routedSegments = jsRoute.segments;
        encodedByNames = jsRoute.encodedPolyline || null;
      }
      if (!routedSegments || routedSegments.length === 0) {
        routedSegments = etappeStops.length >= 2 ? await loadEncodedRoutePathSegments(etappeStops, googleApiKey) : null;
      }
      routedSegmentsByIndex[i] = routedSegments;
      encodedRouteByIndex[i] = encodedByNames;
      if (exportOpts.etappeMaps && etappeStops.length >= 2) {
        const waypoints = waypointNames;
        etappeMapData.push(
          await loadMapImage(etappeStops, googleApiKey, {
            origin: originName,
            destination: destinationName,
            waypoints,
          }, routedSegments, encodedByNames)
        );
      } else {
        etappeMapData.push(null);
      }
    }
  }

  // Load logo
  progress(10, "Lade Logo...");
  let logoData: string | null = null;
  try {
    logoData = await loadImageAsDataURL("/images/sniffertrek-logo.png");
  } catch { /* ignore */ }
  const coverPhotoData = trip.pdfCoverPhotoDataUrl || null;
  const coverStyle = trip.pdfCoverPhotoStyle || "belowTitle";
  const coverTitleSize = Math.max(18, Math.min(64, Number(trip.pdfCoverTitleSize) || 32));
  const coverDateSize = Math.max(10, Math.min(36, Number(trip.pdfCoverDateSize) || 14));
  const coverTitleColor = hexToRgb(trip.pdfCoverTitleColor) || BLUE;
  const coverDateColor = hexToRgb(trip.pdfCoverDateColor) || coverTitleColor;
  const coverTitleFont =
    trip.pdfCoverTitleFont === "times" || trip.pdfCoverTitleFont === "courier"
      ? trip.pdfCoverTitleFont
      : "helvetica";
  const coverDateFont =
    trip.pdfCoverDateFont === "times" || trip.pdfCoverDateFont === "courier"
      ? trip.pdfCoverDateFont
      : "helvetica";
  const normalizeCoverAlign = (align?: string): "left" | "center" | "right" => {
    if (align === "left" || align === "right") return align;
    return "center";
  };
  const coverTitleAlign = normalizeCoverAlign(trip.pdfCoverTitleAlign);
  const coverDateAlign = normalizeCoverAlign(trip.pdfCoverDateAlign);

  // =====================================================================
  // PAGE 1 — Deckblatt
  // =====================================================================
  progress(15, "Erstelle Deckblatt...");

  let y = M + 30;
  const coverAspect = coverPhotoData ? await getDataUrlAspect(coverPhotoData) : null;
  const coverIsPortrait = typeof coverAspect === "number" ? coverAspect < 1 : false;
  const useCoverAsBackground = !!coverPhotoData && coverStyle === "background" && coverIsPortrait;

  if (useCoverAsBackground && coverPhotoData) {
    try {
      // Background mode: full-page bleed for portrait covers.
      doc.addImage(coverPhotoData, dataUrlFormat(coverPhotoData), 0, 0, PAGE_W, PAGE_H);
    } catch {
      // ignore and continue with normal cover rendering below
    }
  }

  // Trip name
  doc.setFont(coverTitleFont, "bold");
  let titleSize = coverTitleSize;
  doc.setFontSize(titleSize);
  setColor(doc, coverTitleColor);
  const title = trip.name || "Neue Reise";
  const titleX = coverTitleAlign === "left" ? M : coverTitleAlign === "right" ? RIGHT : PAGE_W / 2;
  const maxTitleWidth = CONTENT_W - 8;
  while (titleSize > 18 && doc.getTextWidth(title) > maxTitleWidth) {
    titleSize -= 1;
    doc.setFontSize(titleSize);
  }
  doc.text(title, titleX, y, { align: coverTitleAlign });
  y += Math.max(32, Math.round(titleSize * 1.25));

  // Date range
  if (trip.startDate && trip.endDate) {
    doc.setFont(coverDateFont, "normal");
    let dateSize = coverDateSize;
    doc.setFontSize(dateSize);
    setColor(doc, coverDateColor);
    const dateText = `${formatDateDE(trip.startDate)}  -  ${formatDateDE(trip.endDate)}`;
    const dateX = coverDateAlign === "left" ? M : coverDateAlign === "right" ? RIGHT : PAGE_W / 2;
    const maxDateWidth = CONTENT_W - 20;
    while (dateSize > 10 && doc.getTextWidth(dateText) > maxDateWidth) {
      dateSize -= 1;
      doc.setFontSize(dateSize);
    }
    doc.text(dateText, dateX, y, {
      align: coverDateAlign,
    });
    y += Math.max(18, Math.round(dateSize * 1.7));
  }

  y += 25;

  if (coverPhotoData && !useCoverAsBackground) {
    try {
      // Below-title mode (and landscape fallback for background): full-width, borderless.
      const coverTop = y;
      const maxH = Math.max(120, PAGE_H - coverTop - 32);
      const aspect = typeof coverAspect === "number" && coverAspect > 0 ? coverAspect : 1.5;
      let drawW = PAGE_W;
      let drawH = drawW / aspect;
      if (drawH > maxH) {
        drawH = maxH;
        drawW = drawH * aspect;
      }
      const drawX = (PAGE_W - drawW) / 2;
      doc.addImage(
        coverPhotoData,
        dataUrlFormat(coverPhotoData),
        drawX,
        coverTop,
        drawW,
        drawH
      );
    } catch {
      // Fallback to logo below.
    }
  } else if (logoData) {
    try {
      const imgW = 280;
      const imgH = 400; // portrait ratio ~2:3
      const availH = PAGE_H - y - 60;
      const finalH = Math.min(imgH, availH);
      const finalW = finalH * (imgW / imgH);
      const imgX = (PAGE_W - finalW) / 2;
      doc.addImage(logoData, "PNG", imgX, y, finalW, finalH);
    } catch { /* ignore */ }
  }

  // Footer on cover
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(doc, GRAY);
  doc.text("sniffertrek.com", PAGE_W / 2, PAGE_H - 25, { align: "center" });

  // =====================================================================
  // PAGE 2 — Gesamtroute Karte
  // =====================================================================
  if (exportOpts.overviewMap) {
  progress(22, "Erstelle Gesamtroute-Karte...");
  doc.addPage();
  pageNumber++;
  y = M;

  if (overviewMapData) {
    try {
      const mapAspect = await getDataUrlAspect(overviewMapData);
      let drawW = PAGE_W;
      let drawH = mapAspect && mapAspect > 0 ? drawW / mapAspect : PAGE_W;
      let drawX = 0;
      let drawY = 0;

      // Left/right edge-to-edge, vertically centered when spare height exists.
      drawW = PAGE_W;
      drawH = mapAspect && mapAspect > 0 ? drawW / mapAspect : drawW;
      if (drawH > PAGE_H) {
        drawH = PAGE_H;
        drawW = drawH * (mapAspect || 1);
        drawX = (PAGE_W - drawW) / 2;
      }
      drawY = (PAGE_H - drawH) / 2;
      doc.addImage(overviewMapData, "PNG", drawX, drawY, drawW, drawH);
    } catch {
      // ignore map draw failure
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    setColor(doc, GRAY);
    doc.text("Karte konnte nicht geladen werden.", M, y + 20);
  }
  }

  // =====================================================================
  // PAGE 3 — Reiseübersicht
  // =====================================================================
  if (exportOpts.travelOverview) {
  progress(25, "Erstelle Reiseübersicht...");
  doc.addPage();
  pageNumber++;
  y = M;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setColor(doc, BLUE);
  doc.text("REISE\u00dcBERSICHT", M, y);
  y += 30;

  // Key stats in 2 columns with right-aligned values
  const TAB_X = M + 160; // tab stop for values

  doc.setFontSize(10);

  const drawStatRow = (label: string, value: string) => {
    doc.setFont("helvetica", "normal");
    setColor(doc, GRAY);
    doc.text(label, M, y);
    doc.setFont("helvetica", "bold");
    setColor(doc, BLACK);
    doc.text(value, TAB_X, y);
    y += 16;
  };

  if (trip.startDate && trip.endDate) {
    drawStatRow("Reisedatum", `${formatDateDE(trip.startDate)}  -  ${formatDateDE(trip.endDate)}`);
  }
  if (routeInfo) {
    drawStatRow("Gesamtstrecke", routeInfo.distance);
    drawStatRow("Gesamtfahrzeit", routeInfo.duration);
    drawStatRow("Stopps", `${routeInfo.stops}`);
  }
  drawStatRow("Etappen", `${etappen.length}`);
  drawStatRow("Hotels", `${hotelStops.length}`);

  const bookedCount = hotelStops.filter((s) => !!s.bookingConfirmation).length;
  if (hotelStops.length > 0) {
    drawStatRow("Hotels gebucht", `${bookedCount} / ${hotelStops.length}`);
  }
  y += 15;

  // Routenübersicht in 2 columns
  if (etappen.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    setColor(doc, BLUE);
    doc.text("ROUTEN\u00dcBERSICHT", M, y);
    y += 22;

    doc.setFontSize(9);
    setColor(doc, BLACK);

    const COL_GAP = 30;
    const colW = (CONTENT_W - COL_GAP) / 2;
    const half = Math.ceil(etappen.length / 2);
    const col0X = M;
    const col1X = M + colW + COL_GAP;
    let col0Y = y;
    let col1Y = y;

    for (let i = 0; i < etappen.length; i++) {
      const et = etappen[i];
      const isLeft = i < half;
      const colX = isLeft ? col0X : col1X;
      const colY = isLeft ? col0Y : col1Y;

      doc.setFont("helvetica", "bold");
      const tagLabel = `Tag ${i + 1}:`;
      doc.text(tagLabel, colX, colY);

      doc.setFont("helvetica", "normal");
      const kmLabel = `${et.distanceKm} km`;
      doc.text(kmLabel, colX + colW, colY, { align: "right" });

      const routeLabel = formatEtappeRouteLabel(et.from, et.to);
      const routeStartX = colX + 35;
      const routeMaxW = Math.max(80, colW - 35 - 60);
      const routeLines = splitTextLines(doc, routeLabel, routeMaxW).slice(0, 2);
      doc.text(routeLines, routeStartX, colY);

      const blockH = Math.max(14, routeLines.length * 12);
      if (isLeft) col0Y += blockH; else col1Y += blockH;
    }
    y = Math.max(col0Y, col1Y) + 10;
  }
  }

  // =====================================================================
  // PAGE 4 — Hotelliste (kompakt)
  // =====================================================================
  if (exportOpts.accommodations) {
  progress(35, "Erstelle Hotelliste...");
  doc.addPage();
  pageNumber++;
  y = M;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setColor(doc, BLUE);
  doc.text("UNTERK\u00dcNFTE", M, y);
  y += 25;

  if (hotelStops.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    setColor(doc, GRAY);
    doc.text("Keine Hotels geplant.", M, y);
    y += 20;
  } else {
    for (let idx = 0; idx < hotelStops.length; idx++) {
      const stop = hotelStops[idx];
      const isBooked = !!stop.bookingConfirmation;
      const { checkIn, checkOut, nights } = getHotelDates(stop, idx, hotelStops, trip.startDate);
      const guests = stop.hotelGuests || trip.travelers || 2;
      const rooms = stop.hotelRooms || 1;

      if (y > PAGE_H - 80) {
        doc.addPage();
        pageNumber++;
        y = M;
      }

      // Status dot (drawn as circle) + city name
      const dotColor = isBooked ? GREEN : RED;
      doc.setFillColor(dotColor[0], dotColor[1], dotColor[2]);
      doc.setDrawColor(dotColor[0], dotColor[1], dotColor[2]);
      drawDot(doc, M + 4, y, 3, isBooked);

      setColor(doc, isBooked ? GREEN : RED);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(extractCity(stop.name), M + 14, y);

      // Right side: dates compact
      if (checkIn) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`${formatDateDE(checkIn)} - ${formatDateDE(checkOut)}, ${nights}N`, RIGHT, y, { align: "right" });
      }
      y += 13;

      // Details line: hotel name + guests/rooms + price + confirmation
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const detailParts: string[] = [];
      if (stop.bookingHotelName) detailParts.push(stop.bookingHotelName);
      if (stop.bookingAddress) detailParts.push(stop.bookingAddress);
      detailParts.push(`${guests} Pers., ${rooms} Zi.`);
      if (stop.bookingPrice) detailParts.push(`Preis: ${stop.bookingPrice}`);
      if (stop.bookingConfirmation) detailParts.push(`Nr: ${stop.bookingConfirmation}`);

      const detailStr = detailParts.join("  |  ");
      const detailLines = splitTextLines(doc, detailStr, CONTENT_W - 14);
      doc.text(detailLines, M + 14, y);
      y += detailLines.length * 10 + 6;

      // Separator
      if (idx < hotelStops.length - 1) {
        doc.setDrawColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
        doc.setLineWidth(0.3);
        doc.line(M, y, RIGHT, y);
        y += 8;
      }
    }
  }
  }

  // =====================================================================
  // PAGE 5 — Inhaltsverzeichnis
  // =====================================================================
  if (exportOpts.tableOfContents) {
  progress(45, "Erstelle Inhaltsverzeichnis...");
  doc.addPage();
  pageNumber++;
  const tocPageNumber = pageNumber;
  y = M;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setColor(doc, BLUE);
  doc.text("INHALTSVERZEICHNIS", M, y);
  y += 30;

  doc.setFontSize(10);
  setColor(doc, BLACK);

  const KM_TAB = RIGHT - 70; // tab stop for km column
  const PAGE_TAB = RIGHT; // right-aligned page number

  const drawTocRow = (label: string, km: string, page: string) => {
    doc.setFont("helvetica", "normal");
    doc.text(label, M, y);
    if (km) {
      setColor(doc, GRAY);
      doc.text(km, KM_TAB, y, { align: "right" });
      setColor(doc, BLACK);
    }
    doc.text(page, PAGE_TAB, y, { align: "right" });
    y += 18;
  };

  drawTocRow("Deckblatt", "", "1");
  drawTocRow("Gesamtroute Karte", "", "2");
  drawTocRow("Reiseübersicht", "", "3");
  drawTocRow("Unterkünfte", "", "4");
  drawTocRow("Inhaltsverzeichnis", "", `${tocPageNumber}`);

  y += 5;
  doc.setDrawColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
  doc.setLineWidth(0.3);
  doc.line(M, y, RIGHT, y);
  y += 10;

  // Day entries
  const dayPageStart = pageNumber + 1;

  for (let i = 0; i < etappen.length; i++) {
    const et = etappen[i];
    if (y > PAGE_H - 60) {
      doc.addPage();
      pageNumber++;
      y = M;
    }

    let dayLabel: string;
    if (trip.startDate) {
      const dateISO = addDaysISO(trip.startDate, i);
      dayLabel = formatDateDE(dateISO);
    } else {
      dayLabel = `Tag ${i + 1}`;
    }

    const routeLabel = `${dayLabel}    ${formatEtappeRouteLabel(et.from, et.to)}`;
    const kmLabel = `${et.distanceKm} km`;
    const pageLabel = `${dayPageStart + i}`;

    setColor(doc, BLACK);
    drawTocRow(routeLabel, kmLabel, pageLabel);
  }
  }

  // =====================================================================
  // PAGE 5+ — Tag für Tag
  // =====================================================================
  for (let i = 0; i < etappen.length; i++) {
    const pct = 50 + Math.round((i / Math.max(etappen.length, 1)) * 45);
    progress(pct, `Tag ${i + 1} von ${etappen.length}...`);

    const et = etappen[i];
    doc.addPage();
    pageNumber++;
    y = M;

    // Day header
    let dayLabel: string;
    if (trip.startDate) {
      const dateISO = addDaysISO(trip.startDate, i);
      dayLabel = formatDateDE(dateISO);
    } else {
      dayLabel = `Tag ${i + 1}`;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    setColor(doc, BLUE);

    const leftPart = `${dayLabel}    ${formatEtappeRouteLabel(et.from, et.to)}`;
    const rightPart = `${et.distanceKm} km - ${et.durationFormatted}`;
    doc.text(leftPart, M, y);
    doc.text(rightPart, RIGHT, y, { align: "right" });
    y += 20;

    // Thin blue line
    doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.setLineWidth(0.5);
    doc.line(M, y, RIGHT, y);
    y += 15;

    // Etappe map
    if (exportOpts.etappeMaps && etappeMapData[i]) {
      try {
        const mapH = 180;
        const aspect = await getDataUrlAspect(etappeMapData[i]!);
        const mapW = aspect ? Math.min(CONTENT_W, mapH * aspect) : CONTENT_W;
        const mapX = M + (CONTENT_W - mapW) / 2;
        doc.addImage(etappeMapData[i]!, "PNG", mapX, y, mapW, mapH);
        y += mapH + 15;
      } catch { /* ignore */ }
    }

    // Hotel info
    const matchedHotel = hotelStops.find(
      (s) => extractCity(s.name).toLowerCase() === extractCity(et.to).toLowerCase()
    );

    if (matchedHotel || et.hotelBooked !== undefined) {
      const isBooked = matchedHotel ? !!matchedHotel.bookingConfirmation : !!et.hotelBooked;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      setColor(doc, isBooked ? GREEN : RED);
      doc.text(isBooked ? "Hotel gebucht" : "Hotel offen", M, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      if (matchedHotel) {
        const hIdx = hotelStops.indexOf(matchedHotel);
        const { checkIn, checkOut, nights } = getHotelDates(matchedHotel, hIdx, hotelStops, trip.startDate);
        const guests = matchedHotel.hotelGuests || trip.travelers || 2;
        const rooms = matchedHotel.hotelRooms || 1;

        const colW = CONTENT_W / 2;
        const leftX = M;
        const rightX = M + colW + 5;
        let leftY = y;
        let rightY = y;

        if (matchedHotel.bookingHotelName) {
          doc.text(matchedHotel.bookingHotelName, leftX, leftY);
          leftY += 12;
        }
        if (matchedHotel.bookingAddress) {
          const addrLines = splitTextLines(doc, matchedHotel.bookingAddress, colW - 5);
          doc.text(addrLines, leftX, leftY);
          leftY += addrLines.length * 11;
        }

        if (checkIn) {
          doc.text(`${formatDateDE(checkIn)} - ${formatDateDE(checkOut)}`, rightX, rightY);
          rightY += 12;
        }
        doc.text(
          `${guests} Pers., ${rooms} Zimm., ${nights} Nacht${nights !== 1 ? "e" : ""}`,
          rightX,
          rightY
        );
        rightY += 12;
        if (matchedHotel.bookingPrice) {
          doc.text(`Preis: ${matchedHotel.bookingPrice}`, rightX, rightY);
          rightY += 12;
        }
        if (matchedHotel.bookingConfirmation) {
          doc.text(`Best.-Nr: ${matchedHotel.bookingConfirmation}`, rightX, rightY);
          rightY += 12;
        }

        y = Math.max(leftY, rightY) + 8;
      } else if (et.hotelName) {
        doc.text(et.hotelName, M, y);
        y += 12;
        if (et.hotelAddress) {
          doc.text(et.hotelAddress, M, y);
          y += 12;
        }
        y += 5;
      }
    }

    const discoveries = aiDiscoveriesByEtappe.get(i) || [];
    const selectedManualPhotos = trip.pdfPhotosByEtappe?.[String(i)] || [];
    const photoPlacement: PdfPhotoPlacement = trip.pdfPhotoPlacementByEtappe?.[String(i)] || "afterEntdecken";
    const photoLayout: PdfPhotoLayout = trip.pdfPhotoLayoutByEtappe?.[String(i)] || "auto";
    const photoTargetPages = trip.pdfPhotoPagesByEtappe?.[String(i)] || 1;
    let renderedManualPhotoPage = false;
    const renderManualPhotoPageIfNeeded = async (target: PdfPhotoPlacement) => {
      if (renderedManualPhotoPage || photoPlacement !== target || selectedManualPhotos.length === 0) return;
      const beforePages = doc.getNumberOfPages();
      await renderManualPhotoPages(doc, selectedManualPhotos, photoLayout, photoTargetPages);
      const afterPages = doc.getNumberOfPages();
      pageNumber += Math.max(0, afterPages - beforePages);
      renderedManualPhotoPage = true;
    };

    await renderManualPhotoPageIfNeeded("afterHotel");

    // Legs detail (after hotel, before Entdecken)
    const segmentRows = buildSegmentRows(et, etappeStopsByIndex[i] || [], routedSegmentsByIndex[i]);
    if (exportOpts.teilstrecken && segmentRows.length > 1) {
      if (y > PAGE_H - 120) {
        doc.addPage();
        pageNumber++;
        y = M;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      setColor(doc, BLUE);
      doc.text("Teilstrecken", M, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setColor(doc, BLACK);

      for (const seg of segmentRows) {
        if (y > PAGE_H - 40) {
          doc.addPage();
          pageNumber++;
          y = M;
        }
        const routeLabel = `${seg.from}  ->  ${seg.to}`;
        doc.text(routeLabel, M, y);
        if (typeof seg.distanceMeters === "number" && typeof seg.durationSeconds === "number") {
          const km = Math.round(seg.distanceMeters / 1000);
          const dur = formatDur(seg.durationSeconds);
          doc.text(`${km} km - ${dur}`, RIGHT, y, { align: "right" });
        }
        y += 13;
      }
      y += 5;
    }

    await renderManualPhotoPageIfNeeded("afterTeilstrecken");

    // Discoveries selected from "Entdecken"
    if (exportOpts.entdeckenHighlights && discoveries.length > 0) {
      // Extra spacing before "Entdecken Highlights" for readability (approx. 2 blank lines).
      y += 22;
      if (y > PAGE_H - 150) {
        doc.addPage();
        pageNumber++;
        y = M;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      setColor(doc, BLUE);
      doc.text("Entdecken Highlights", M, y);
      y += 18;

      for (const stop of discoveries) {
        if (y > PAGE_H - 150) {
          doc.addPage();
          pageNumber++;
          y = M;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        setColor(doc, BLACK);
        const category = (stop.discoveryCategory || "").trim();
        const showCategory = category && normalizePlaceKey(category) !== "eigener stopp";
        const titleSuffix = showCategory ? ` (${category})` : "";
        doc.text(`${stop.name}${titleSuffix}`, M, y);
        y += 10;

        const key = normalizePlaceKey(stop.name);
        if (!discoveryInfoCache.has(key)) {
          if (stop.discoveryWikipediaTitle) {
            const exact = await fetchWikipediaSummaryByTitle(stop.discoveryWikipediaTitle);
            const intro = exact
              ? await fetchWikipediaIntroByTitle(exact.title || stop.discoveryWikipediaTitle)
              : undefined;
            const picked = cleanWikipediaText(intro || exact?.text || "");
            discoveryInfoCache.set(key, {
              text: isWeakWikipediaText(picked) ? undefined : picked,
              photo: exact?.photo,
            });
          } else {
            discoveryInfoCache.set(
              key,
              await fetchWikipediaDiscoveryInfo(stop.name, stop.lat, stop.lng, { allowGeoFallback: false })
            );
          }
        }
        const info = discoveryInfoCache.get(key) || {};

        const photoW = 74;
        const photoH = 56;
        const textX = M + photoW + 10;
        const textW = RIGHT - textX;
        const wikiText = normalizeDiscoveryText(info.text || "");
        const stopText = normalizeDiscoveryText(stop.discoveryDescription || "");
        const isMapOrBucketPoi =
          stop.discoverySource === "custom" ||
          stop.discoverySource === "google" ||
          stop.discoverySource === "bucket";
        const rawText = isMapOrBucketPoi ? wikiText : wikiText || stopText;
        const textLines = buildSentenceExcerpt(doc, rawText, textW, 5);

        let blockH = textLines.length * 10;
        const imageUrl = stop.discoveryPhotoDataUrl || stop.discoveryPhotoUrl || info.photo;
        if (imageUrl) {
          try {
            const img = await loadImageAsDataURL(imageUrl);
            if (img) {
              doc.addImage(img, dataUrlFormat(img), M, y, photoW, photoH);
              blockH = Math.max(blockH, photoH);
            }
          } catch {
            // ignore image errors in PDF rendering
          }
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        setColor(doc, BLACK);
        if (textLines.length > 0) {
          doc.text(textLines, textX, y + 9, { maxWidth: textW, align: "justify" });
        }
        y += blockH + 22;
      }
      y += 8;
    }

    await renderManualPhotoPageIfNeeded("afterEntdecken");

    // Notes (only on first day page)
    if (trip.notes && i === 0) {
      if (y > PAGE_H - 100) {
        doc.addPage();
        pageNumber++;
        y = M;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      setColor(doc, BLUE);
      doc.text("Notizen", M, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setColor(doc, BLACK);
      const noteLines = splitTextLines(doc, trip.notes, CONTENT_W);
      for (const line of noteLines) {
        if (y > PAGE_H - 40) {
          doc.addPage();
          pageNumber++;
          y = M;
        }
        doc.text(line, M, y);
        y += 12;
      }
    }

  }

  // Add page numbers + footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(doc, GRAY);
    if (p > 1) {
      doc.text(`Seite ${p} / ${totalPages}`, PAGE_W / 2, PAGE_H - 25, { align: "center" });
    }
    doc.text("sniffertrek.com", RIGHT, PAGE_H - 25, { align: "right" });
  }

  progress(100, "PDF erstellt!");
  return doc.output("blob");
}
