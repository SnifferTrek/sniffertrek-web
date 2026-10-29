export type PoiReportTextModel = "gpt-4o-mini" | "gpt-4o";

export type PoiReportTextRequest = {
 name: string;
 category?: string;
 etappeFrom?: string;
 etappeTo?: string;
 wikiGrounding?: string;
 plannerHint?: string;
 language?: "de" | "en" | "es";
 model?: PoiReportTextModel;
};

export type PoiReportTextResult = {
 text?: string;
 highlights?: string[];
};

/** Ca. 100 Wörter Reisebericht-Prosa + Sehenswürdigkeiten pro POI (OpenAI, serverseitig). */
export async function generatePoiReportText(req: PoiReportTextRequest): Promise<PoiReportTextResult | undefined> {
 const response = await fetch("/api/poi-report-text", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ model: "gpt-4o", ...req }),
 });
 if (!response.ok) return undefined;
 const data = await response.json().catch(() => ({}));
 const text = typeof data.text === "string" ? data.text.trim() : "";
 const highlights = Array.isArray(data.highlights)
 ? data.highlights.map((h: unknown) => String(h || "").trim()).filter(Boolean).slice(0, 10)
 : undefined;
 if (!text && (!highlights || highlights.length === 0)) return undefined;
 return { text: text || undefined, highlights };
}
