import { AiPoiSuggestion, Etappe, TravelInterest } from "./types";

export interface AiPoiRequest {
  etappes: Etappe[];
  interests: TravelInterest[];
  travelMode: string;
  stops: { name: string; type: string; isHotel?: boolean }[];
}

export async function fetchAiPois(req: AiPoiRequest): Promise<AiPoiSuggestion[]> {
  const etappePayload = req.etappes.map((e) => ({
    from: e.from,
    to: e.to,
    viaStops: e.legs.slice(0, -1).map((l) => l.to).filter((n) => n !== e.from && n !== e.to),
  }));

  const response = await fetch("/api/ai-pois", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      etappes: etappePayload,
      interests: req.interests,
      travelMode: req.travelMode,
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
    etappeIndex: typeof s.etappeIndex === "number" ? s.etappeIndex : 0,
  }));
}
