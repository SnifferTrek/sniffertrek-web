import { NextRequest, NextResponse } from "next/server";
import { assertVeloApiAccess } from "@/lib/veloApiAuth";
import { wgs84ToLv95 } from "@/lib/swissTopo";
import { sampleCoordinates } from "@/lib/veloRoute";

type Body = {
  email?: string;
  coordinates?: [number, number][];
};

type ProfilePoint = {
  alts?: { COMB?: number; DTM2?: number; DTM25?: number };
};

function pickAlt(point: ProfilePoint): number | null {
  const h = point.alts?.COMB ?? point.alts?.DTM2 ?? point.alts?.DTM25;
  return typeof h === "number" && Number.isFinite(h) ? h : null;
}

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Ungültiger Request" }, { status: 400 });
  }

  const denied = assertVeloApiAccess(body.email);
  if (denied) return denied;

  const coords = body.coordinates || [];
  if (coords.length < 2) {
    return NextResponse.json({ elevations: [] });
  }

  const sampled = sampleCoordinates(coords, 200);
  const lv95 = sampled.map(([lng, lat]) => {
    const [easting, northing] = wgs84ToLv95(lat, lng);
    return [Math.round(easting * 100) / 100, Math.round(northing * 100) / 100];
  });

  const form = new URLSearchParams({
    geom: JSON.stringify({ type: "LineString", coordinates: lv95 }),
    sr: "2056",
    nb_points: String(Math.min(160, Math.max(24, lv95.length))),
    offset: "5",
  });

  try {
    const res = await fetch("https://api3.geo.admin.ch/rest/services/profile.json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Höhendaten-Fehler" }, { status: 502 });
    }
    const data = (await res.json()) as ProfilePoint[] | { error?: unknown };
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Höhendaten-Fehler" }, { status: 502 });
    }

    const elevations: number[] = [];
    for (const point of data) {
      const h = pickAlt(point);
      elevations.push(h ?? elevations[elevations.length - 1] ?? 0);
    }

    return NextResponse.json(
      { elevations },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Höhendaten-Fehler" }, { status: 500 });
  }
}
