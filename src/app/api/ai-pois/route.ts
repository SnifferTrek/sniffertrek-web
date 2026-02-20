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

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { etappes, interests, travelMode, language } = body as {
      etappes: { from: string; to: string; viaStops: string[] }[];
      interests: string[];
      travelMode: string;
      language?: string;
    };

    if (!etappes || etappes.length === 0) {
      return NextResponse.json({ error: "No etappes provided" }, { status: 400 });
    }

    const lang = language || "de";
    const interestText =
      interests.length > 0
        ? interests.map((i) => interestLabels[i] || i).join(", ")
        : "allgemeine Sehenswürdigkeiten und Geheimtipps";

    const modeText =
      travelMode === "auto" ? "mit dem Auto" : travelMode === "zug" ? "mit dem Zug" : "per Flug";

    const etappeDescriptions = etappes
      .map((e, i) => {
        const via = e.viaStops.length > 0 ? ` (über ${e.viaStops.join(", ")})` : "";
        return `Etappe ${i + 1}: ${e.from} → ${e.to}${via}`;
      })
      .join("\n");

    const systemPrompt = `Du bist ein erfahrener Reiseberater und Lokalexperte. Du gibst personalisierte Empfehlungen für Reisende ${modeText}.
Antworte ausschliesslich mit validem JSON – kein Markdown, keine Erklärungen ausserhalb des JSON.`;

    const userPrompt = `Empfehle für jede Etappe 3-5 besondere Orte ENTLANG oder NAHE der Strecke (max. 30 Min. Abstecher).

Reiseroute:
${etappeDescriptions}

Interessen: ${interestText}

Antworte als JSON-Array mit diesem Schema:
[
  {
    "etappeIndex": 0,
    "name": "Name des Orts",
    "description": "2-3 Sätze warum dieser Ort besonders ist, mit persönlichem Tipp",
    "category": "Kategorie (z.B. Aussichtspunkt, Weingut, Altstadt, Nationalpark)",
    "detourMinutes": 10,
    "nearestStop": "nächster Ort auf der Route"
  }
]

Regeln:
- Nur Orte die WIRKLICH entlang/nahe der Strecke liegen
- Bevorzuge Geheimtipps vor den offensichtlichen Touristenattraktionen
- ${lang === "de" ? "Beschreibungen auf Deutsch" : "Descriptions in English"}
- detourMinutes = geschätzte zusätzliche Fahrzeit ab Route
- Verteile die Empfehlungen gleichmässig über die Etappen`;

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
        max_tokens: 3000,
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
      return NextResponse.json(
        { error: detail },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "[]";

    let suggestions;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      suggestions = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return NextResponse.json(
        { error: "Invalid AI response format" },
        { status: 502 }
      );
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("AI POI error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
