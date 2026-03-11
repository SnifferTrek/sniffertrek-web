import { NextRequest, NextResponse } from "next/server";

type DirectionsBody = {
  origin?: string;
  destination?: string;
  waypoints?: string[] | string;
  mode?: string;
  apiKey?: string;
};

export async function POST(request: NextRequest) {
  let body: DirectionsBody;
  try {
    body = (await request.json()) as DirectionsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const origin = (body.origin || "").trim();
  const destination = (body.destination || "").trim();
  if (!origin || !destination) {
    return NextResponse.json({ error: "Missing origin or destination" }, { status: 400 });
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (body.apiKey || "").trim();

  if (!apiKey) {
    return NextResponse.json({ error: "Missing Google API key" }, { status: 500 });
  }

  const wpList = Array.isArray(body.waypoints)
    ? body.waypoints.map((w) => w.trim()).filter(Boolean)
    : typeof body.waypoints === "string"
      ? body.waypoints.split("|").map((w) => w.trim()).filter(Boolean)
      : [];
  const waypoints = wpList.slice(0, 23).join("|");
  const mode = (body.mode || "driving").trim() || "driving";
  const wpPart = waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : "";
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${wpPart}&mode=${encodeURIComponent(mode)}&key=${encodeURIComponent(apiKey)}`;

  try {
    const upstream = await fetch(url, { cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Directions fetch failed", status: upstream.status }, { status: 502 });
    }
    const data = await upstream.json();
    return NextResponse.json(data, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Directions proxy error" }, { status: 500 });
  }
}

