import { NextRequest, NextResponse } from "next/server";
import { fetchOsmFerryLines, type OsmFerryLine } from "@/lib/osmFerry";

const TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; lines: OsmFerryLine[] }>();

function cacheKey(olat: number, olng: number, dlat: number, dlng: number): string {
  const r = (n: number) => n.toFixed(2);
  return `${r(olat)},${r(olng)}|${r(dlat)},${r(dlng)}`;
}

function parseCoord(value: string | null): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const olat = parseCoord(searchParams.get("olat"));
  const olng = parseCoord(searchParams.get("olng"));
  const dlat = parseCoord(searchParams.get("dlat"));
  const dlng = parseCoord(searchParams.get("dlng"));
  if (olat == null || olng == null || dlat == null || dlng == null) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  const key = cacheKey(olat, olng, dlat, dlng);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json(
      { lines: hit.lines, source: "cache" },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" } }
    );
  }

  try {
    const lines = await fetchOsmFerryLines(
      { lat: olat, lng: olng },
      { lat: dlat, lng: dlng }
    );
    cache.set(key, { at: Date.now(), lines });
    return NextResponse.json(
      { lines, source: "osm" },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" } }
    );
  } catch {
    return NextResponse.json(
      { lines: [], source: "error" },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  }
}
