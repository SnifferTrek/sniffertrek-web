import { AiPoiSuggestion, Etappe, TravelInterest, RouteStop } from "./types";

export interface AiPoiRequest {
  etappes: Etappe[];
  interests: TravelInterest[];
  travelMode: string;
  stops: RouteStop[];
  etappeIndex?: number;
}

function findStopCoords(name: string, stops: RouteStop[]): { lat?: number; lng?: number } {
  const normalName = name.toLowerCase().trim();
  const match = stops.find((s) => s.name.toLowerCase().trim().startsWith(normalName) || normalName.startsWith(s.name.toLowerCase().trim()));
  return match ? { lat: match.lat, lng: match.lng } : {};
}

export async function fetchAiPois(req: AiPoiRequest): Promise<AiPoiSuggestion[]> {
  const etappePayload = req.etappes.map((e) => {
    const fromCoords = findStopCoords(e.from, req.stops);
    const toCoords = findStopCoords(e.to, req.stops);
    return {
      from: e.from,
      to: e.to,
      fromLat: fromCoords.lat,
      fromLng: fromCoords.lng,
      toLat: toCoords.lat,
      toLng: toCoords.lng,
      viaStops: e.legs.slice(0, -1).map((l) => {
        const c = findStopCoords(l.to, req.stops);
        return { name: l.to, lat: c.lat, lng: c.lng };
      }).filter((v) => v.name !== e.from && v.name !== e.to),
    };
  });

  const response = await fetch("/api/ai-pois", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      etappes: etappePayload,
      interests: req.interests,
      travelMode: req.travelMode,
      etappeIndex: req.etappeIndex,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "AI POI request failed");
  }

  const data = await response.json();
  return (data.suggestions || []).map((s: Record<string, unknown>) => ({
    name: String(s.name || ""),
    description: String(s.description || ""),
    category: String(s.category || "Sehenswürdigkeit"),
    detourMinutes: typeof s.detourMinutes === "number" ? s.detourMinutes : undefined,
    lat: typeof s.lat === "number" ? s.lat : undefined,
    lng: typeof s.lng === "number" ? s.lng : undefined,
    etappeIndex: typeof s.etappeIndex === "number" ? s.etappeIndex : 0,
  }));
}
