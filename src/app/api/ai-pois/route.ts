import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const interestLabels: Record<string, string> = {
  kultur: "Kultur & Geschichte (Schlösser, Ruinen, Altstadt, Museen)",
  natur: "Natur & Landschaft (Nationalparks, Seen, Wasserfälle, Wanderungen)",
  kulinarik: "Kulinarik & Wein (Weingüter, lokale Märkte, Restaurants, Spezialitäten)",
  straende: "Strände & Küste (Buchten, Strandpromenaden, Küstenwanderungen)",
  fotospots: "Fotospots & Aussichtspunkte (Panoramen, besondere Architektur)",
  familien: "Familien-Aktivitäten (Freizeitparks, Aquarien, kinderfreundliche Orte)",
  abenteuer: "Abenteuer & Sport (Klettern, Kajak, Rafting, Zip-Line)",
  shopping: "Shopping & Märkte (Outlets, Flohmärkte, lokale Handwerkskunst)",
};

interface EtappeInput {
  from: string;
  to: string;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  viaStops: { name: string; lat?: number; lng?: number }[];
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function getEtappeAnchorPoints(e: EtappeInput): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = [];
  if (e.fromLat != null && e.fromLng != null) points.push({ lat: e.fromLat, lng: e.fromLng });
  for (const v of e.viaStops) {
    if (v.lat != null && v.lng != null) points.push({ lat: v.lat, lng: v.lng });
  }
  if (e.toLat != null && e.toLng != null) points.push({ lat: e.toLat, lng: e.toLng });
  return points;
}

function nearestEtappeByCoords(
  lat: number,
  lng: number,
  etappes: EtappeInput[]
): { localIndex: number; minDistanceKm: number } | null {
  let bestIndex = -1;
  let bestDistance = Infinity;
  for (let i = 0; i < etappes.length; i++) {
    const anchors = getEtappeAnchorPoints(etappes[i]);
    if (anchors.length === 0) continue;
    for (const p of anchors) {
      const d = haversineKm(lat, lng, p.lat, p.lng);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    }
  }
  if (bestIndex < 0) return null;
  return { localIndex: bestIndex, minDistanceKm: bestDistance };
}

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { etappes, interests, travelMode, language, etappeIndex } = body as {
      etappes: EtappeInput[];
      interests: string[];
      travelMode: string;
      language?: string;
      etappeIndex?: number;
    };

    if (!etappes || etappes.length === 0) {
      return NextResponse.json({ error: "No etappes provided" }, { status: 400 });
    }

    const targetEtappes = etappeIndex != null ? [etappes[etappeIndex]] : etappes;
    const targetOffset = etappeIndex ?? 0;

    const lang = language || "de";
    const interestText =
      interests.length > 0
        ? interests.map((i) => interestLabels[i] || i).join(", ")
        : "allgemeine Sehenswürdigkeiten und Geheimtipps";

    const modeText = "mit dem Auto";

    const etappeDescriptions = targetEtappes
      .map((e, i) => {
        const coords = (lat?: number, lng?: number) =>
          lat != null && lng != null ? ` [${lat.toFixed(3)}, ${lng.toFixed(3)}]` : "";
        const fromCoords = coords(e.fromLat, e.fromLng);
        const toCoords = coords(e.toLat, e.toLng);
        const viaList = e.viaStops
          .map((v) => `${v.name}${coords(v.lat, v.lng)}`)
          .join(", ");
        const via = viaList ? ` (über ${viaList})` : "";
        return `Etappe ${targetOffset + i + 1}: ${e.from}${fromCoords} → ${e.to}${toCoords}${via}`;
      })
      .join("\n");

    const systemPrompt = `Du bist ein erfahrener Reiseberater und Lokalexperte. Du gibst personalisierte Empfehlungen für Reisende ${modeText}.
Antworte ausschliesslich mit validem JSON – kein Markdown, keine Erklärungen ausserhalb des JSON.
WICHTIG: Keine erfundenen Fakten. Wenn du bei einem Detail unsicher bist (z.B. exakter See, Fluss, historische Behauptung),
formuliere neutral und allgemein statt konkret-falsch.`;

    const numSuggestions = targetEtappes.length === 1 ? "5-8" : "3-5";

    const userPrompt = `Empfehle für jede Etappe ${numSuggestions} besondere Orte ENTLANG oder NAHE der Strecke (max. 30 Min. Abstecher).
Die Koordinaten in Klammern zeigen die exakte Lage der Stopps – empfehle nur Orte im geografischen Korridor dazwischen (max. 30km Luftlinie von der Verbindungslinie).

Reiseroute:
${etappeDescriptions}

Interessen: ${interestText}

Antworte als JSON-Array mit diesem Schema:
[
  {
    "etappeIndex": ${targetOffset},
    "name": "Name des Orts",
    "description": "2-3 Sätze warum dieser Ort besonders ist, mit persönlichem Tipp",
    "category": "Kategorie (z.B. Aussichtspunkt, Weingut, Altstadt, Nationalpark)",
    "detourMinutes": 10,
    "nearestStop": "nächster Ort auf der Route",
    "lat": 45.123,
    "lng": 4.567
  }
]

Regeln:
- Nur Orte die WIRKLICH im geografischen Korridor der Etappe liegen (max. 30km von der Route)
- Bevorzuge Geheimtipps vor den offensichtlichen Touristenattraktionen
- ${lang === "de" ? "Beschreibungen auf Deutsch" : "Descriptions in English"}
- detourMinutes = geschätzte zusätzliche Fahrzeit ab Route
- lat/lng = ungefähre Koordinaten des empfohlenen Orts (PFLICHT)
- Verteile die Empfehlungen gleichmässig über die Etappe(n)
- Schreibe faktenorientiert; keine unsicheren Gewässer-/Regionszuordnungen als Tatsache behaupten`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.25,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI API error:", response.status, errText);
      let detail = "AI service unavailable";
      try {
        const errJson = JSON.parse(errText);
        detail = errJson?.error?.message || `OpenAI Fehler ${response.status}: ${errText.slice(0, 200)}`;
      } catch {
        detail = `OpenAI Fehler ${response.status}: ${errText.slice(0, 200)}`;
      }
      return NextResponse.json({ error: detail }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "[]";

    let suggestions;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      suggestions = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 });
    }

    const normalizedSuggestions = Array.isArray(suggestions)
      ? suggestions
          .map((s: Record<string, unknown>) => {
            const lat = typeof s.lat === "number" ? s.lat : undefined;
            const lng = typeof s.lng === "number" ? s.lng : undefined;
            if (lat == null || lng == null) {
              // Keep fallback indexing for entries without coordinates.
              const fallbackIndex =
                etappeIndex != null
                  ? etappeIndex
                  : typeof s.etappeIndex === "number"
                  ? s.etappeIndex
                  : 0;
              return { ...s, etappeIndex: fallbackIndex };
            }

            const nearest = nearestEtappeByCoords(lat, lng, targetEtappes);
            if (!nearest) return null;

            // Hard guard against clearly wrong geography.
            if (nearest.minDistanceKm > 120) return null;

            return { ...s, etappeIndex: targetOffset + nearest.localIndex };
          })
          .filter(Boolean)
      : [];

    return NextResponse.json({ suggestions: normalizedSuggestions });
  } catch (error) {
    console.error("AI POI error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
