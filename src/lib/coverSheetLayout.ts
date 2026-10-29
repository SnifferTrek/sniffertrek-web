import type { PdfCoverExtraTextPlacement, Trip } from "@/lib/types";
import { formatPdfDate, getPdfCopy } from "@/lib/pdfCopy";

export const COVER_PAGE_W_PT = 595.28;
export const COVER_PAGE_H_PT = 841.89;
export const COVER_MARGIN_PT = 50;
export const COVER_CONTENT_W_PT = COVER_PAGE_W_PT - 2 * COVER_MARGIN_PT;
export const COVER_RIGHT_PT = COVER_PAGE_W_PT - COVER_MARGIN_PT;

export type CoverAlign = "left" | "center" | "right";

export type CoverTextSlot = {
 topPt: number;
 align: CoverAlign;
 fontSizePt: number;
 /** Zusatztext unten: letzte Zeile bleibt fix, neue Zeilen wachsen nach oben. */
 anchorFromBottom?: boolean;
};

export type CoverLayout = {
 useBackground: boolean;
 titleStartYPt: number;
 titleFontSizePt: number;
 date: { topPt: number; fontSizePt: number };
 extra?: CoverTextSlot;
 imageTopPt?: number;
};

export const COVER_NO_ROUTE_DATE_LABEL = "Reiseroute ohne Datum";

export function formatCoverDateRange(
 startDate: string,
 endDate: string,
 locale = "de"
): string {
 if (!startDate || !endDate) return "";
 return `${formatPdfDate(startDate, locale)} - ${formatPdfDate(endDate, locale)}`;
}

export function tripHasCoverRouteDates(trip: Trip): boolean {
 return !!(trip.startDate?.trim() && trip.endDate?.trim());
}

/** Datum aus der Route oder Platzhalter fürs Deckblatt (Vorschau + PDF). */
export function getCoverDateDisplayText(trip: Trip, locale = "de"): string {
 if (tripHasCoverRouteDates(trip)) {
 return formatCoverDateRange(trip.startDate, trip.endDate, locale);
 }
 return getPdfCopy(locale).noRouteDate;
}

function splitExtraLines(text: string): string[] {
 return text.replace(/\r\n/g, "\n").split("\n");
}

/** Zeilen inkl. Leerzeilen und automatischem Umbruch für Deckblatt-Höhe. */
function estimateExtraVisualLines(text: string, fontSizePt: number): number {
 const maxCharsPerLine = Math.max(12, Math.floor(COVER_CONTENT_W_PT / (fontSizePt * 0.52)));
 let count = 0;
 for (const line of splitExtraLines(text)) {
 if (!line.trim()) {
 count += 1;
 continue;
 }
 count += Math.max(1, Math.ceil(line.length / maxCharsPerLine));
 }
 return Math.max(1, count);
}

function extraBlockHeightPt(lineCount: number, fontSizePt: number): number {
 if (lineCount <= 0) return 0;
 const lineH = Math.max(14, Math.round(fontSizePt * 1.35));
 return lineCount * lineH + 6;
}

/** Shared layout for PDF deckblatt and browser preview (positions in PDF points). */
export function computeCoverLayout(trip: Trip, coverIsPortrait: boolean): CoverLayout {
 const coverStyle = trip.pdfCoverPhotoStyle || "belowTitle";
 const hasPhoto = !!trip.pdfCoverPhotoDataUrl;
 const useBackground = hasPhoto && coverStyle === "background" && coverIsPortrait;

 const titleSize = Math.max(18, Math.min(64, Number(trip.pdfCoverTitleSize) || 32));
 const dateSize = Math.max(10, Math.min(36, Number(trip.pdfCoverDateSize) || 14));
 const extraSize = Math.max(10, Math.min(28, Number(trip.pdfCoverExtraTextSize) || 14));
 const placement: PdfCoverExtraTextPlacement = trip.pdfCoverExtraTextPlacement || "afterDate";
 const extraText = trip.pdfCoverExtraText || "";
 const extraLines = extraText.trim() ? estimateExtraVisualLines(extraText, extraSize) : 0;
 const extraLineCount = Math.max(1, extraLines);
 const extraHeight = extraBlockHeightPt(extraLineCount, extraSize);

 const extraAlign: CoverAlign =
 trip.pdfCoverExtraTextAlign === "left" || trip.pdfCoverExtraTextAlign === "right"
 ? trip.pdfCoverExtraTextAlign
 : "center";

 let y = COVER_MARGIN_PT + 30;
 const titleStartYPt = y;
 y += Math.max(32, Math.round(titleSize * 1.25));

 let extra: CoverTextSlot | undefined;

 if (placement === "beforeDate" && extraText.trim()) {
 extra = { topPt: y, align: extraAlign, fontSizePt: extraSize };
 y += extraHeight;
 }

 const date: { topPt: number; fontSizePt: number } = { topPt: y, fontSizePt: dateSize };
 y += Math.max(18, Math.round(dateSize * 1.7));

 if (placement === "afterDate" && extraText.trim()) {
 extra = { topPt: y, align: extraAlign, fontSizePt: extraSize };
 y += extraHeight;
 }

 const imageTopPt = y + 25;

 if (placement === "middle" && extraText.trim()) {
 extra = {
 topPt: COVER_PAGE_H_PT * 0.48 - extraHeight / 2,
 align: extraAlign,
 fontSizePt: extraSize,
 };
 }

 if (placement === "bottom" && extraText.trim()) {
 extra = {
 topPt: COVER_PAGE_H_PT - COVER_MARGIN_PT,
 align: extraAlign,
 fontSizePt: extraSize,
 anchorFromBottom: true,
 };
 }

 return {
 useBackground,
 titleStartYPt,
 titleFontSizePt: titleSize,
 date,
 extra,
 imageTopPt: useBackground ? undefined : imageTopPt,
 };
}

export function coverAlignToCss(align: CoverAlign): "left" | "center" | "right" {
 return align;
}

type CSSProperties = Record<string, string | number | undefined>;

export function coverTextBoxStylePlain(
 slot: CoverTextSlot,
 pageScale: number,
 trip: Trip,
 useBackground: boolean
): { style: CSSProperties; className: string } {
 const topPct = (slot.topPt / COVER_PAGE_H_PT) * 100;
 const widthPct = (COVER_CONTENT_W_PT / COVER_PAGE_W_PT) * 100;
 const leftPct = (COVER_MARGIN_PT / COVER_PAGE_W_PT) * 100;
 const bottomPct = (COVER_MARGIN_PT / COVER_PAGE_H_PT) * 100;

 const style: CSSProperties = {
 width: `${widthPct}%`,
 textAlign: slot.align,
 fontSize: `${slot.fontSizePt * pageScale}px`,
 lineHeight: 1.35,
 color: trip.pdfCoverExtraTextColor || "#ffffff",
 fontFamily:
 trip.pdfCoverExtraTextFont === "times"
 ? "Times New Roman, Times, serif"
 : trip.pdfCoverExtraTextFont === "courier"
 ? "Courier New, Courier, monospace"
 : "Helvetica, Arial, sans-serif",
 textShadow: useBackground ? "0 1px 2px rgba(0,0,0,0.45)" : undefined,
 wordBreak: "break-word",
 };

 if (slot.anchorFromBottom) {
 style.bottom = `${bottomPct}%`;
 style.top = "auto";
 } else {
 style.top = `${topPct}%`;
 }

 if (slot.align === "center") {
 style.left = "50%";
 style.transform = "translateX(-50%)";
 } else if (slot.align === "right") {
 style.right = `${leftPct}%`;
 style.left = "auto";
 } else {
 style.left = `${leftPct}%`;
 }

 return {
 className: "absolute z-10 whitespace-pre-wrap leading-snug",
 style,
 };
}
