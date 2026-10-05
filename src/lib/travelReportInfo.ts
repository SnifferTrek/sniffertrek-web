import { getPrintAtlasCopy } from "@/lib/printAtlasCopy";

/** Transparenz-Text für Reiseberichte (Tab «Info»). Deutsch-Default für bestehende Imports. */
export const TRAVEL_REPORT_INFO = {
 title: getPrintAtlasCopy("de").infoTitle,
 paragraphs: getPrintAtlasCopy("de").infoParagraphs,
} as const;

export function getTravelReportInfo(locale = "de") {
  const copy = getPrintAtlasCopy(locale);
  return { title: copy.infoTitle, paragraphs: copy.infoParagraphs };
}
