import { NextRequest, NextResponse } from "next/server";
import { nearestEtappeIndexByRoute, haversineKm } from "@/lib/etappeGeo";
import { asAppLocale } from "@/lib/localeCopy";
import { poiContentLanguageLine } from "@/lib/wikipediaLocale";

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
 overnightAt?: string;
 routeStops?: { name: string; lat?: number; lng?: number }[];
}

function getEtappeAnchorPoints(e: EtappeInput): Array<{ lat: number; lng: number }> {
 const points: Array<{ lat: number; lng: number }> = [];
 const add = (lat?: number, lng?: number) => {
 if (lat != null && lng != null) points.push({ lat, lng });
 };
 add(e.fromLat, e.fromLng);
 const anchors = e.routeStops?.length ? e.routeStops : [{ name: e.from }, ...e.viaStops, { name: e.to }];
 for (const v of anchors) {
 add(v.lat, v.lng);
 }
 if (!e.routeStops?.length) add(e.toLat, e.toLng);
 return points;
}

function nearestEtappeByCoords(
 lat: number,
 lng: number,
 etappes: EtappeInput[]
): { localIndex: number; minDistanceKm: number } | null {
 const etappePoints = etappes.map((e) => getEtappeAnchorPoints(e));
 const nearest = nearestEtappeIndexByRoute(lat, lng, etappePoints);
 if (!nearest) return null;
 return { localIndex: nearest.index, minDistanceKm: nearest.distanceKm };
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
 const { etappes, interests, travelMode, language, etappeIndex, searchRegion, searchLat, searchLng, searchRadiusKm, regionOnly } = body as {
 etappes: EtappeInput[];
 interests: string[];
 travelMode: string;
 language?: string;
 etappeIndex?: number;
 searchRegion?: string;
 searchLat?: number;
 searchLng?: number;
 searchRadiusKm?: number;
 /** true = Suchgebiet-Suche ohne Autoroute-Korridor */
 regionOnly?: boolean;
 };

 if (!etappes || etappes.length === 0) {
 return NextResponse.json({ error: "No etappes provided" }, { status: 400 });
 }

 const targetEtappes = etappeIndex != null ? [etappes[etappeIndex]] : etappes;
 const targetOffset = etappeIndex ?? 0;

 const lang = asAppLocale(language || "de");
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
 const routeList = (e.routeStops?.length ? e.routeStops : [...e.viaStops, { name: e.to }])
 .map((v) => `${v.name}${coords(v.lat, v.lng)}`)
 .join(" → ");
 const overnight = e.overnightAt
 ? ` · Übernachtung/Zwischenstopp mit Hotel: ${e.overnightAt}${coords(e.toLat, e.toLng)}`
 : "";
 return `Etappe ${targetOffset + i + 1}: ${routeList || `${e.from}${fromCoords} → ${e.to}${toCoords}`}${overnight}`;
 })
 .join("\n");

 const systemPrompt = `Du bist ein erfahrener Reiseberater und Lokalexperte. Du gibst personalisierte Empfehlungen für Reisende ${modeText}.
Antworte ausschliesslich mit validem JSON – kein Markdown, keine Erklärungen ausserhalb des JSON.
WICHTIG: Keine erfundenen Fakten. Wenn du bei einem Detail unsicher bist (z.B. exakter See, Fluss, historische Behauptung, Preise, Öffnungszeiten),
formuliere neutral und allgemein statt konkret-falsch. Keine erfundenen Jahreszahlen, Eintrittspreise oder Öffnungszeiten.`;

 const numSuggestions = targetEtappes.length === 1 ? "5-8" : "3-5";

 const regionLabel = (searchRegion || "das Suchgebiet").replace(/"/g, "");
 const userPrompt = regionOnly
 ? `Empfehle ${numSuggestions} besondere Orte in bzw. um ${regionLabel}${typeof searchLat === "number" && typeof searchLng === "number" ? ` [${searchLat.toFixed(3)}, ${searchLng.toFixed(3)}]` : ""} (Umkreis ca. ${searchRadiusKm ?? 25} km).

Interessen: ${interestText}

Antworte als JSON-Array mit diesem Schema:
[
 {
 "etappeIndex": ${targetOffset},
 "name": "Name des Orts",
 "description": "3–5 Sätze: was man dort konkret sieht/macht, grobe Besuchsdauer, Lagebezug, ein praktischer Tipp",
 "whyHere": "1 Satz: warum in diesem Suchgebiet",
 "visitTip": "1 kurzer praktischer Hinweis",
 "highlights": ["konkreter Fakt 1", "konkreter Fakt 2", "konkreter Fakt 3"],
 "category": "Kategorie",
 "detourMinutes": 10,
 "nearestStop": "${regionLabel}",
 "lat": 45.437,
 "lng": 12.335
 }
]

Regeln:
- Nur Orte WIRKLICH im Umkreis von ${searchRadiusKm ?? 25} km um das Suchgebiet
- lat/lng = ungefähre Koordinaten (PFLICHT)
- ${poiContentLanguageLine(lang)}
- Keine erfundenen Preise oder Öffnungszeiten`
 : `Empfehle für jede Etappe ${numSuggestions} besondere Orte ENTLANG oder NAHE der Strecke (max. 30 Min. Abstecher).
Die Koordinaten in Klammern zeigen die exakte Lage der Stopps – empfehle nur Orte im geografischen Korridor dazwischen (max. 30km Luftlinie von der Verbindungslinie).
${searchRegion?.trim() ? `
FOKUS (weich) – Suchgebiet «${searchRegion.trim()}»${searchLat != null && searchLng != null ? ` [${searchLat.toFixed(3)}, ${searchLng.toFixed(3)}]` : ""}:
- Bevorzuge Orte in/nahe diesem Gebiet (ca. ${searchRadiusKm ?? 25} km), wenn sie zur Etappe passen
- Orte entlang der Route ausserhalb dieses Radius bleiben erlaubt – nicht verwerfen` : ""}

Reiseroute:
${etappeDescriptions}

Interessen: ${interestText}

Antworte als JSON-Array mit diesem Schema:
[
 {
 "etappeIndex": ${targetOffset},
 "name": "Name des Orts",
 "description": "3–5 Sätze: was man dort konkret sieht/macht, grobe Besuchsdauer, Lagebezug zur Route, ein praktischer Tipp",
 "whyHere": "1 Satz: warum genau auf dieser Etappe (Bezug zu nächstem Stopp/Hotel/Pass)",
 "visitTip": "1 kurzer praktischer Hinweis (z.B. kurze Pause, 45–90 Min., Fotostopp, vor Hotelstopp)",
 "highlights": ["konkreter Fakt 1", "konkreter Fakt 2", "konkreter Fakt 3"],
 "category": "Kategorie (z.B. Aussichtspunkt, Weingut, Altstadt, Nationalpark)",
 "detourMinutes": 10,
 "nearestStop": "nächster Ort auf der Route",
 "lat": 45.123,
 "lng": 4.567
 }
]

Regeln für description / whyHere / visitTip:
- Faktenorientiert und konkret (was sieht/macht man, ungefähre Dauer, Lagehinweis)
- Verboten als leere Floskel ohne Inhalt: «faszinierend», «malerisch», «lohnt sich», «Geheimtipp», «ein Muss», «lädt ein»
- Ein klares Unterscheidungsmerkmal: was macht diesen Ort anders als typische Touristen-Highlights der Region?
- Keine erfundenen Preise, Öffnungszeiten, Ticketpreise oder Jahreszahlen
- ${poiContentLanguageLine(lang)}

Regeln für highlights (3–5 Einträge):
- Kurze, konkrete Stichworte (max. 6 Wörter), z.B. Bauwerk, Aussicht, Spezialität, Wegart
- Keine Werbesprache; nur beobachtbare/übliche Merkmale
- Nichts erfinden

Weitere Regeln:
- Nur Orte die WIRKLICH im geografischen Korridor der Etappe liegen (max. 30km von der Route)
- Bevorzuge weniger bekannte, aber echte Orte vor den offensichtlichen Massentouristen-Attraktionen
- detourMinutes = geschätzte zusätzliche Fahrzeit ab Route
- lat/lng = ungefähre Koordinaten des empfohlenen Orts (PFLICHT)
- Verteile die Empfehlungen gleichmässig über die Etappe(n)
- Endet die Etappe an einem Zwischenstopp mit Hotel/Übernachtung: mindestens 1–2 Empfehlungen direkt am Ort dieses Stopps (nicht nur unterwegs davor)
- Alle genannten Zwischenstopps auf der Route gelten als Anker – auch Hotel-Stopps
- Schreibe faktenorientiert; keine unsicheren Gewässer-/Regionszuordnungen als Tatsache behaupten`;

 const response = await fetch("https://api.openai.com/v1/chat/completions", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 Authorization: `Bearer ${OPENAI_API_KEY}`,
 },
 body: JSON.stringify({
 model: "gpt-4o",
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

 // Suchgebiet-Modus: Anker = Suchzentrum (nicht Route) — sonst fallen alle Treffer weg.
 if (
 regionOnly &&
 searchRegion?.trim() &&
 typeof searchLat === "number" &&
 typeof searchLng === "number"
 ) {
 const maxKm = Math.max(Number(searchRadiusKm) || 25, 10) * 1.35;
 const distKm = haversineKm(searchLat, searchLng, lat, lng);
 if (distKm > maxKm) return null;
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
