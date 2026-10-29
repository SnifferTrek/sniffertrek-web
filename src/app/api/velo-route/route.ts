import { NextRequest, NextResponse } from "next/server";
import { assertVeloApiAccess } from "@/lib/veloApiAuth";
import {
  directSegmentCoords,
  haversineM,
  mergeSegmentCoords,
  polylineLengthM,
  preferPathOverBike,
  shouldPreferDirectOverOsrm,
} from "@/lib/veloRoute";

type Point = { lat: number; lng: number };
type OsrmMode = "bike" | "foot";

type Body = {
  email?: string;
  points?: Point[];
  /** Waldwege, Fusswege und Autofahrverbote mitbenutzen. */
  allowRestricted?: boolean;
};

const SNAP_MAX_M = 80;
const BROUTER_URL = "https://brouter.de/brouter";

type OsrmLeg = {
  coordinates: [number, number][];
  distanceM: number;
  durationS: number;
  profile: OsrmMode | "direct" | "ways";
  steps: {
    instruction: string;
    distanceM: number;
    durationS: number;
    maneuver: string;
  }[];
};

type SnapHit = { point: Point; distance: number };

async function nearestOnProfile(
  p: Point,
  profile: OsrmMode
): Promise<SnapHit | null> {
  const url =
    `https://router.project-osrm.org/nearest/v1/${profile}/${p.lng},${p.lat}` +
    "?number=1";

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    waypoints?: { location?: [number, number]; distance?: number }[];
  };
  const wp = data.waypoints?.[0];
  if (!wp?.location) return null;
  return {
    point: { lng: wp.location[0], lat: wp.location[1] },
    distance: wp.distance ?? Infinity,
  };
}

async function snapPoint(p: Point, profile: OsrmMode): Promise<Point> {
  const hit = await nearestOnProfile(p, profile);
  if (!hit || hit.distance > SNAP_MAX_M) return p;
  return hit.point;
}

async function fetchOsrmLeg(
  a: Point,
  b: Point,
  profile: OsrmMode
): Promise<OsrmLeg | null> {
  const coordStr = `${a.lng},${a.lat};${b.lng},${b.lat}`;
  const url =
    `https://router.project-osrm.org/route/v1/${profile}/${coordStr}` +
    `?overview=full&geometries=geojson&steps=true`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.[0]?.geometry?.coordinates) return null;

  const route = data.routes[0];
  const legs = route.legs || [];
  const steps = legs.flatMap(
    (leg: {
      steps?: {
        maneuver?: { instruction?: string; type?: string; modifier?: string };
        distance?: number;
        duration?: number;
      }[];
    }) =>
      (leg.steps || []).map((s) => ({
        instruction: s.maneuver?.instruction || s.maneuver?.type || "Weiter",
        distanceM: Math.round(s.distance || 0),
        durationS: Math.round(s.duration || 0),
        maneuver: [s.maneuver?.type, s.maneuver?.modifier]
          .filter(Boolean)
          .join(" "),
      }))
  );

  return {
    coordinates: route.geometry.coordinates as [number, number][],
    distanceM: route.distance,
    durationS: route.duration,
    profile,
    steps,
  };
}

function pickOsrmLeg(bike: OsrmLeg | null, foot: OsrmLeg | null): OsrmLeg | null {
  if (bike && foot) {
    return preferPathOverBike(bike.distanceM, foot.distanceM) ? foot : bike;
  }
  return foot ?? bike;
}

function directLeg(a: Point, b: Point): OsrmLeg {
  const coordinates = directSegmentCoords(a, b);
  const distanceM = haversineM([a.lng, a.lat], [b.lng, b.lat]);
  return {
    coordinates,
    distanceM,
    durationS: Math.round((distanceM / 4000) * 3600),
    profile: "direct",
    steps: [
      {
        instruction: "Direktlinie (Fahrverbot gilt nicht für Velo)",
        distanceM: Math.round(distanceM),
        durationS: Math.round((distanceM / 4000) * 3600),
        maneuver: "direct",
      },
    ],
  };
}

/** Folgt OSM-Wegen inkl. Tracks/Waldwege – keine Luftlinie querfeldein. */
async function fetchBrouter(points: Point[]): Promise<OsrmLeg | null> {
  const lonlats = points.map((p) => `${p.lng},${p.lat}`).join("|");
  const url =
    `${BROUTER_URL}?lonlats=${encodeURIComponent(lonlats)}` +
    `&profile=shortest&alternativeidx=0&format=geojson`;

  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/geo+json,application/json",
        "User-Agent": "SnifferTrek/1.0 (https://www.sniffertrek.com)",
      },
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  let data: {
    features?: {
      geometry?: { coordinates?: number[][] };
      properties?: {
        "track-length"?: string | number;
        "total-time"?: string | number;
      };
    }[];
  };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    return null;
  }
  const feature = data.features?.[0];
  const raw = feature?.geometry?.coordinates;
  if (!Array.isArray(raw) || raw.length < 2) return null;

  const coordinates = raw
    .filter((c) => Array.isArray(c) && c.length >= 2)
    .map((c) => [c[0], c[1]] as [number, number]);
  if (coordinates.length < 2) return null;

  const distanceM =
    Number(feature?.properties?.["track-length"]) ||
    polylineLengthM(coordinates);
  const durationS =
    Number(feature?.properties?.["total-time"]) ||
    Math.round((distanceM / 4000) * 3600);

  return {
    coordinates,
    distanceM,
    durationS,
    profile: "ways",
    steps: [
      {
        instruction: "Weg inkl. Waldwege und Fahrverbote",
        distanceM: Math.round(distanceM),
        durationS: Math.round(durationS),
        maneuver: "follow",
      },
    ],
  };
}

function jsonRoute(leg: {
  coordinates: [number, number][];
  distanceM: number;
  durationS: number;
  steps: OsrmLeg["steps"];
  profile: string;
}) {
  return NextResponse.json(
    {
      coordinates: leg.coordinates,
      distanceM: leg.distanceM,
      durationS: leg.durationS,
      steps: leg.steps,
      profile: leg.profile,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
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

  const allowRestricted = Boolean(body.allowRestricted);
  const rawPoints = (body.points || []).filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)
  );
  if (rawPoints.length < 2) {
    return NextResponse.json(
      { error: "Mindestens zwei Punkte" },
      { status: 400 }
    );
  }

  try {
    if (allowRestricted) {
      const brouter = await fetchBrouter(rawPoints);
      if (brouter) {
        return jsonRoute({ ...brouter, profile: "paths" });
      }
    }

    const snapProfile: OsrmMode = allowRestricted ? "foot" : "bike";
    const points = await Promise.all(
      rawPoints.map((p) => snapPoint(p, snapProfile))
    );
    const legs: OsrmLeg[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      let osrm: OsrmLeg | null;

      if (allowRestricted) {
        const [bike, foot] = await Promise.all([
          fetchOsrmLeg(a, b, "bike"),
          fetchOsrmLeg(a, b, "foot"),
        ]);
        osrm = pickOsrmLeg(bike, foot);
      } else {
        osrm = await fetchOsrmLeg(a, b, "bike");
        if (
          osrm &&
          shouldPreferDirectOverOsrm(a, b, osrm.distanceM, osrm.coordinates)
        ) {
          osrm = directLeg(a, b);
        }
      }

      if (osrm) {
        legs.push(osrm);
      } else {
        return NextResponse.json(
          {
            error: `Kein Weg zwischen Punkt ${i + 1} und ${i + 2} – Marker näher an einen Weg setzen`,
          },
          { status: 404 }
        );
      }
    }

    const coordinates = mergeSegmentCoords(legs.map((l) => l.coordinates));
    const distanceM = legs.reduce((s, l) => s + l.distanceM, 0);
    const durationS = legs.reduce((s, l) => s + l.durationS, 0);
    const steps = legs.flatMap((l) => l.steps);

    return jsonRoute({
      coordinates,
      distanceM,
      durationS,
      steps,
      profile: allowRestricted ? "paths" : "bike",
    });
  } catch {
    return NextResponse.json({ error: "Routing-Proxy-Fehler" }, { status: 500 });
  }
}
