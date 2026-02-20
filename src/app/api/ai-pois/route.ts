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
Antworte ausschliesslich mit validem JSON – kein Markdown, keine Erklärungen ausserhalb des JSON.`;

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
- Verteile die Empfehlungen gleichmässig über die Etappe(n)`;

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
        temperature: 0.8,
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

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("AI POI error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
