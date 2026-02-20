export interface Landmark {
  id: string;
  name: string;
  category: string;
  country: string;
  city: string;
  continent: string;
  description: string;
  imageURL: string;
  wikipediaTitle: string;
  wikipediaTitleDe: string;
  latitude: number;
  longitude: number;
  unesco?: {
    isWorldHeritage: boolean;
    type: string;
    year: number;
  };
}

let cachedLandmarks: Landmark[] | null = null;

export async function loadLandmarks(): Promise<Landmark[]> {
  if (cachedLandmarks) return cachedLandmarks;
  const res = await fetch("/data/landmarks.json");
  cachedLandmarks = await res.json();
  return cachedLandmarks!;
}

export function filterLandmarks(
  landmarks: Landmark[],
  opts: {
    query?: string;
    category?: string;
    continent?: string;
    unescoOnly?: boolean;
  }
): Landmark[] {
  let result = landmarks;
  if (opts.unescoOnly) {
    result = result.filter((l) => l.unesco?.isWorldHeritage);
  }
  if (opts.category) {
    result = result.filter((l) => l.category === opts.category);
  }
  if (opts.continent) {
    result = result.filter((l) => l.continent === opts.continent);
  }
  if (opts.query) {
    const q = opts.query.toLowerCase();
    result = result.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
    );
  }
  return result;
}

export function findNearbyLandmarks(
  landmarks: Landmark[],
  lat: number,
  lng: number,
  radiusKm: number = 100
): Landmark[] {
  return landmarks
    .map((l) => ({ landmark: l, distance: haversine(lat, lng, l.latitude, l.longitude) }))
    .filter((x) => x.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
    .map((x) => x.landmark);
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const thumbCache = new Map<string, string | null>();

export async function fetchLandmarkThumb(wikiTitleDe: string): Promise<string | null> {
  if (!wikiTitleDe) return null;
  if (thumbCache.has(wikiTitleDe)) return thumbCache.get(wikiTitleDe)!;
  try {
    const res = await fetch(
      `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitleDe)}`
    );
    if (!res.ok) { thumbCache.set(wikiTitleDe, null); return null; }
    const data = await res.json();
    const url: string | null = data?.thumbnail?.source || null;
    thumbCache.set(wikiTitleDe, url);
    return url;
  } catch {
    thumbCache.set(wikiTitleDe, null);
    return null;
  }
}

export const CATEGORIES = [
  "Historische Stätten",
  "Burgen & Schlösser",
  "Natur",
  "Hauptstädte",
  "Naturwunder",
  "Religiöse Stätten",
  "Architektur",
  "Museen",
  "Moderne Wahrzeichen",
];

export const CONTINENTS = [
  "Europa",
  "Asien",
  "Afrika",
  "Nordamerika",
  "Südamerika",
  "Ozeanien",
];
