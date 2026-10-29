/** POI-Portrait für PDF / KI — ca. 100 Wörter, ein Absatz. */
export const POI_REPORT_TARGET_WORDS = 100;
export const POI_REPORT_MIN_WORDS = 85;
export const POI_REPORT_MAX_WORDS = 115;

/** Max. sichtbare Zeilen Beschreibung im PDF ohne Foto. Mit Foto: 14 (layoutPoiCard). */
export const PDF_POI_DESC_MAX_LINES = 9;

export function trimPoiTextToWordRange(text: string, maxWords = POI_REPORT_MAX_WORDS): string {
 const normalized = text.replace(/\s+/g, " ").trim();
 if (!normalized) return "";
 const words = normalized.split(/\s+/).filter(Boolean);
 if (words.length <= maxWords) return words.join(" ");
 return `${words.slice(0, maxWords).join(" ")}.`;
}

export function countPoiWords(text: string): number {
 return text.split(/\s+/).filter(Boolean).length;
}

/** Adresse, Fetzen oder zu kurz – kein brauchbarer POI-Fliesstext. */
export function isWeakDiscoveryBody(text: string): boolean {
 const t = text.replace(/\s+/g, " ").trim();
 if (!t) return true;
 const words = t.split(/\s+/).filter(Boolean);
 if (words.length < 18) return true;
 if (/^\d{1,4}\s/.test(t) && words.length < 24) return true;
 if ((t.match(/\d/g) || []).length >= 6 && words.length < 28) return true;
 if (
 /^(via |rue |calle |str\.|straße |strasse |plaza |piazza |av\.|avenida )/i.test(t) &&
 words.length < 22
 ) {
 return true;
 }
 return false;
}
