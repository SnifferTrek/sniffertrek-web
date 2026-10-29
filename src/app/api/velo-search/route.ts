import { NextRequest, NextResponse } from "next/server";
import { assertVeloApiAccess } from "@/lib/veloApiAuth";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email") || "";
  const denied = assertVeloApiAccess(email);
  if (denied) return denied;

  const q = (request.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url =
    `https://api3.geo.admin.ch/rest/services/api/SearchServer?` +
    `searchText=${encodeURIComponent(q)}&type=locations&origins=address,gg25&limit=8`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ results: [] }, { status: 502 });
    }
    const data = (await res.json()) as {
      results?: {
        attrs?: { label?: string; lat?: number; lon?: number };
      }[];
    };
    const results = (data.results || [])
      .map((r) => ({
        label: r.attrs?.label || "",
        lat: r.attrs?.lat,
        lng: r.attrs?.lon,
      }))
      .filter(
        (r) =>
          r.label &&
          typeof r.lat === "number" &&
          typeof r.lng === "number" &&
          r.lat >= 45.5 &&
          r.lat <= 48.5 &&
          r.lng >= 5.5 &&
          r.lng <= 11.5
      );
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
