/**
 * PDF Reisebericht – feste Slot-Budgets über alle Seiten.
 * Inhalt wird darauf geschrieben; Rendering schneidet nur als Sicherheitsnetz.
 */

export const PRINT_PAGE1 = {
  leadMaxWords: 48,
  metaMaxWords: 22,
  calloutBodyMaxWords: 36,
  calloutMaxBullets: 3,
  calloutBulletMaxWords: 16,
  mustSeeCount: 5,
  orteCount: 8,
  markerLabelMaxChars: 36,
  orteNoteMaxChars: 18,
} as const;

/** 02 Plan */
export const PRINT_PLAN = {
  durationCount: 4,
  durationSummaryMaxWords: 16,
  itineraryMaxDays: 5,
  itineraryItemsPerDay: 3,
  itineraryItemMaxWords: 12,
  itineraryTitleMaxWords: 6,
  parkingIntroMaxWords: 12,
  parkingMaxItems: 3,
  parkingDescMaxWords: 18,
  transferCount: 3,
  transferBodyMaxWords: 14,
} as const;

/** 03 Unterwegs – max. 1 PDF-Seite */
export const PRINT_STORY = {
  maxSections: 5,
  paragraphsPerSection: 1,
  paragraphMaxWords: 24,
  /** Quotes kosten zu viel Höhe – auf 1 Seite weglassen */
  includeStory: false,
  storyMaxWords: 0,
} as const;

/** 04 Praxis */
export const PRINT_PRAXIS = {
  venueIntroMaxWords: 14,
  venueMaxItems: 4,
  venueDescMaxWords: 18,
  mustSeeMaxItems: 8,
  mustSeeItemMaxWords: 12,
  guideMaxCards: 3,
  guideBodyMaxWords: 28,
  guideMetaMaxChars: 48,
  spotMaxItems: 6,
  spotNoteMaxWords: 16,
  budgetMaxLines: 12,
  budgetNoteMaxWords: 8,
  seasonNoteMaxWords: 10,
  eventMaxItems: 4,
  eventNoteMaxWords: 12,
} as const;

/** 05 FAQ */
export const PRINT_FAQ = {
  maxItems: 8,
  questionMaxWords: 14,
  answerMaxWords: 36,
} as const;

/** 06 Anhang + Outro */
export const PRINT_APPENDIX = {
  hotelIntroMaxWords: 22,
  hotelMaxPicks: 4,
  hotelNoteMaxWords: 18,
  infoMaxParagraphs: 2,
  infoParagraphMaxWords: 40,
  generalMaxSections: 4,
  generalBodyMaxWords: 40,
  closingMaxWords: 42,
} as const;

export function countWords(text: string): number {
  return text.replace(/\*\*/g, "").split(/\s+/).filter(Boolean).length;
}

/** Auf Wortanzahl kürzen; Markdown-** bleibt an Wortgrenzen. */
export function trimToMaxWords(text: string, maxWords: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length <= maxWords) return normalized;
  let out = tokens.slice(0, maxWords).join(" ");
  out = out.replace(/[,:;·\-–—]+\s*$/, "").trim();
  if (!/[.!?]$/.test(out)) out = `${out}.`;
  return out;
}

export function trimToMaxChars(text: string, maxChars: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) return normalized;
  const cut = normalized.slice(0, maxChars - 1).replace(/\s+\S*$/, "").trim();
  return cut || normalized.slice(0, maxChars);
}

export function clampBulletList(
  bullets: readonly string[] | undefined,
  maxBullets = PRINT_PAGE1.calloutMaxBullets,
  maxWords = PRINT_PAGE1.calloutBulletMaxWords
): string[] {
  if (!bullets?.length) return [];
  return bullets.slice(0, maxBullets).map((b) => trimToMaxWords(b, maxWords));
}

/** @deprecated Alias – gleiche Datei wie früher printPage1Limits */
export { PRINT_PAGE1 as PRINT_OVERVIEW };
