import { NextRequest, NextResponse } from "next/server";
import {
 POI_REPORT_MAX_WORDS,
 POI_REPORT_MIN_WORDS,
 POI_REPORT_TARGET_WORDS,
 trimPoiTextToWordRange,
} from "@/lib/poiTextLimits";
import { asAppLocale, type AppLocale } from "@/lib/localeCopy";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const POI_REPORT_MODELS = ["gpt-4o-mini", "gpt-4o"] as const;
type PoiReportModel = (typeof POI_REPORT_MODELS)[number];

function parseHighlights(value: unknown): string[] {
 if (!Array.isArray(value)) return [];
 return value
 .map((h) => String(h || "").trim())
 .filter(Boolean)
 .slice(0, 10);
}

function hashOpeningIndex(name: string, count: number): number {
 let h = 0;
 for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
 return h % count;
}

function bannedCliches(lang: AppLocale): string[] {
 if (lang === "en") {
  return [
   "in the heart of",
   "nestled in",
   "hidden gem",
   "idyllically located",
   "picturesque town",
  ];
 }
 if (lang === "es") {
  return [
   "en el corazón de",
   "joya escondida",
   "idílicamente",
   "pueblo pintoresco",
  ];
 }
 return [
  "im Herzen von",
  "im Herzen des",
  "idyllisch gelegen",
  "verstecktes Juwel",
  "malerisch gelegen",
 ];
}

function containsBannedCliche(text: string, lang: AppLocale): string | null {
 const lower = text.toLowerCase();
 return bannedCliches(lang).find((p) => lower.includes(p.toLowerCase())) || null;
}

function clicheBanLine(lang: AppLocale): string {
 const list = bannedCliches(lang).map((p) => `«${p}»`).join(", ");
 if (lang === "en") return `Never use these clichés anywhere in the text: ${list}.`;
 if (lang === "es") return `No uses nunca estos clichés: ${list}.`;
 return `Diese Floskeln nirgendwo im Text verwenden: ${list}.`;
}

function openingInstruction(lang: AppLocale, placeName: string): string {
 if (lang === "en") {
  const styles = [
   "Open with a concrete action or first step on site – not with the place name.",
   "Open with a sensory detail (light, material, sound, view); name the place only in the second sentence.",
   "Open with how travellers reach or use the place on this stage – never “X lies / is a …”.",
   "Open with a built or historical feature, then the visit.",
   "Open with a practical tip (time, pause, path), then the place.",
  ];
  return `${styles[hashOpeningIndex(placeName, styles.length)]} Forbidden first-sentence stems: “${placeName} is”, “${placeName} lies”, “Between …”, “The town/village of”.`;
 }
 if (lang === "es") {
  const styles = [
   "Empieza con una acción concreta o el primer paso in situ – no con el nombre del lugar.",
   "Empieza con un detalle sensorial (luz, material, sonido, vista); el nombre solo en la segunda frase.",
   "Empieza por cómo se llega o se usa el lugar en esta etapa – nunca «X se encuentra / es un …».",
   "Empieza con un rasgo construido o histórico, luego la visita.",
   "Empieza con un consejo práctico (tiempo, pausa, camino), luego el lugar.",
  ];
  return `${styles[hashOpeningIndex(placeName, styles.length)]} Prohibido al inicio: «${placeName} es», «${placeName} se encuentra», «Entre …», «El pueblo/la villa de».`;
 }
 const styles = [
  "Beginne mit einer konkreten Handlung oder dem ersten Schritt vor Ort – nicht mit dem Ortsnamen.",
  "Beginne mit einem sinnlichen Detail (Licht, Material, Geräusch, Aussicht); den Ortsnamen erst im zweiten Satz.",
  "Beginne mit dem Zugang oder der Nutzung auf dieser Etappe – nie «X liegt / ist ein …».",
  "Beginne mit einem gebauten oder historischen Merkmal, dann der Besuch.",
  "Beginne mit einem praktischen Hinweis (Zeit, Pause, Weg), dann der Ort.",
 ];
 return `${styles[hashOpeningIndex(placeName, styles.length)]} Verbotene Satzanfänge: «${placeName} liegt», «${placeName} ist», «Zwischen …», «Der Ort».`;
}

function reportPrompts(lang: AppLocale, placeName: string) {
 const opening = openingInstruction(lang, placeName);
 if (lang === "en") {
  return {
   system: `You write short place portraits for a printed travel report.
Style: intellectually engaging, precise, vivid – no marketing clichés, no encyclopedic tone.
${clicheBanLine("en")}
Portrait length: ${POI_REPORT_MIN_WORDS}–${POI_REPORT_MAX_WORDS} words, one paragraph.
Be concrete: what visitors see or do, rough setting, one practical tip – not mood only.
Use only facts from the notes or well-established knowledge. Do not invent statistics, prices, or hours.
Write originally – do not copy Wikipedia phrasing.
Opening: ${opening}
Reply with valid JSON only (no markdown).`,
   place: `Place: ${placeName}`,
   category: (c: string) => `Category: ${c}`,
   route: (from: string, to: string) => `Stage: ${from} → ${to}`,
   facts: (notes: string) => `Fact notes (grounding only):\n${notes}`,
   planner: (hint: string) => `Planner hint: ${hint}`,
   schema: `JSON schema:
{
 "text": "Portrait ~${POI_REPORT_TARGET_WORDS} words",
 "highlights": ["Sight 1", "…"]
}
Rules for highlights: 3–10 items by place size; short names only; well-known sights only.`,
  };
 }
 if (lang === "es") {
  return {
   system: `Escribes retratos breves de lugares para un informe de viaje impreso.
Estilo: preciso, plástico, exigente – sin lenguaje publicitario, sin clichés («imprescindible», «invita a», «fascinante», «pintoresco»), sin tono enciclopédico.
${clicheBanLine("es")}
Longitud del retrato: ${POI_REPORT_MIN_WORDS}–${POI_REPORT_MAX_WORDS} palabras, un párrafo, fluidez de lectura.
Contenido concreto: qué se ve o se hace, ubicación aproximada, un consejo práctico – no solo ambiente.
Usa solo hechos de las notas o conocimiento reconocido. No inventes cifras de habitantes, años, precios, horarios ni estatus UNESCO si no están en las notas.
Escribe de forma original: no parafrasees Wikipedia literalmente.
Inicio: ${opening}
Responde exclusivamente con JSON válido (sin Markdown).`,
   place: `Lugar: ${placeName}`,
   category: (c: string) => `Categoría: ${c}`,
   route: (from: string, to: string) => `Etapa: ${from} → ${to}`,
   facts: (notes: string) => `Notas de hechos (solo base, no copiar):\n${notes}`,
   planner: (hint: string) => `Nota del planificador: ${hint}`,
   schema: `Esquema JSON:
{
 "text": "Retrato ca. ${POI_REPORT_TARGET_WORDS} palabras",
 "highlights": ["Atracción 1", "…"]
}
Reglas para highlights:
- Atracciones/lugares más importantes (nombres cortos, máx. 6 palabras por entrada)
- Pueblo pequeño: 3–5 entradas
- Ciudad/región mediana: 5–8 entradas
- Gran ciudad/destino mundial: 7–10 entradas
- Solo atracciones reales y habituales – no inventar`,
  };
 }
 return {
  system: `Du schreibst kurze Ortsportraits für einen gedruckten Reisebericht.
Stil: intellektuell anspruchsvoll, präzise, bildhaft – keine Werbesprache, keine Floskeln («ein Muss», «lädt ein», «faszinierend», «malerisch», «lohnt sich»), kein Enzyklopädie-Ton.
${clicheBanLine("de")}
Portrait-Länge: ${POI_REPORT_MIN_WORDS}–${POI_REPORT_MAX_WORDS} Wörter, ein Absatz, flüssig lesbar.
Inhaltlich konkret: was man dort sieht oder macht, grobe Einordnung (Ort/Lage), ein praktischer Hinweis für Reisende – nicht nur Stimmung.
Nutze nur gesicherte Fakten aus den Faktennotizen oder allgemein anerkanntes Wissen. Erfinde keine Einwohnerzahlen, Jahreszahlen, Preise, Öffnungszeiten oder UNESCO-Status, wenn sie nicht in den Notizen stehen.
Schreibe eigenständig – paraphrasiere Wikipedia nicht wörtlich.
Satzanfang: ${opening}
Antworte ausschliesslich mit validem JSON (kein Markdown).`,
  place: `Ort: ${placeName}`,
  category: (c: string) => `Kategorie: ${c}`,
  route: (from: string, to: string) => `Etappe: ${from} → ${to}`,
  facts: (notes: string) => `Faktennotizen (nur Grundlage, nicht abschreiben):\n${notes}`,
  planner: (hint: string) => `Planer-Hinweis: ${hint}`,
  schema: `JSON-Schema:
{
 "text": "Portrait ca. ${POI_REPORT_TARGET_WORDS} Wörter",
 "highlights": ["Sehenswürdigkeit 1", "…"]
}
Regeln für highlights:
- Wichtigste Sehenswürdigkeiten/Orte (kurze Namen, max. 6 Wörter pro Eintrag)
- Kleiner Ort/Dorf: 3–5 Einträge
- Mittelgrosse Stadt/Region: 5–8 Einträge
- Grossstadt/weltbekanntes Ziel: 7–10 Einträge
- Nur echte, übliche Top-Attraktionen – nichts erfinden`,
 };
}

export async function POST(request: NextRequest) {
 if (!OPENAI_API_KEY) {
 return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
 }

 try {
 const body = await request.json();
 const {
 name,
 category,
 etappeFrom,
 etappeTo,
 wikiGrounding,
 plannerHint,
 language = "de",
 model: requestedModel = "gpt-4o",
 } = body as {
 name?: string;
 category?: string;
 etappeFrom?: string;
 etappeTo?: string;
 wikiGrounding?: string;
 plannerHint?: string;
 language?: string;
 model?: string;
 };

 const model: PoiReportModel = POI_REPORT_MODELS.includes(requestedModel as PoiReportModel)
 ? (requestedModel as PoiReportModel)
 : "gpt-4o";

 const placeName = (name || "").trim();
 if (!placeName) {
 return NextResponse.json({ error: "name is required" }, { status: 400 });
 }

 const lang = asAppLocale(language || "de");
 const copy = reportPrompts(lang, placeName);
 const routeHint =
 etappeFrom && etappeTo ? copy.route(etappeFrom, etappeTo) : "";
 const opening = openingInstruction(lang, placeName);

 const userParts = [
 copy.place,
 category ? copy.category(category) : "",
 routeHint,
 wikiGrounding ? copy.facts(String(wikiGrounding).slice(0, 1400)) : "",
 plannerHint ? copy.planner(plannerHint) : "",
 opening,
 copy.schema,
 ].filter(Boolean);

 const complete = async (parts: string[]) => {
 const response = await fetch("https://api.openai.com/v1/chat/completions", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 Authorization: `Bearer ${OPENAI_API_KEY}`,
 },
 body: JSON.stringify({
 model,
 messages: [
 { role: "system", content: copy.system },
 { role: "user", content: parts.join("\n\n") },
 ],
 temperature: 0.75,
 max_tokens: 520,
 response_format: { type: "json_object" },
 }),
 });
 if (!response.ok) {
 const errText = await response.text();
 console.error("OpenAI poi-report-text error:", response.status, errText);
 return null;
 }
 const data = await response.json();
 const raw = (data.choices?.[0]?.message?.content || "").trim();
 try {
 return JSON.parse(raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()) as {
 text?: string;
 highlights?: unknown;
 };
 } catch {
 console.error("Failed to parse poi-report JSON:", raw.slice(0, 300));
 return null;
 }
 };

 let parsed = await complete(userParts);
 if (!parsed) {
 return NextResponse.json({ error: "AI service unavailable" }, { status: 502 });
 }

 let text = trimPoiTextToWordRange(String(parsed.text || "").replace(/\s+/g, " ").trim());
 const hit = containsBannedCliche(text, lang);
 if (hit) {
 const rewrite =
 lang === "en"
 ? `Rewrite the portrait. Do not use the phrase “${hit}” or any listed cliché.`
 : lang === "es"
 ? `Reescribe el retrato. No uses «${hit}» ni ningún cliché de la lista.`
 : `Schreibe das Portrait neu. Verwende nicht «${hit}» und keine der verbotenen Floskeln.`;
 const retried = await complete([...userParts, rewrite]);
 if (retried?.text) {
 parsed = retried;
 text = trimPoiTextToWordRange(String(parsed.text || "").replace(/\s+/g, " ").trim());
 }
 }

 const highlights = parseHighlights(parsed.highlights);

 if (!text && highlights.length === 0) {
 return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
 }

 return NextResponse.json({ text: text || undefined, highlights, model });
 } catch (error) {
 console.error("poi-report-text error:", error);
 return NextResponse.json({ error: "Internal server error" }, { status: 500 });
 }
}
