import jsPDF from "jspdf";
import { normalizePdfPhotoCaption } from "./pdfPhotoCaption";
import { resolvePdfExportOptions } from "./pdfExportOptions";
import { resolveEtappenForExport, buildEtappenFromRoute, normalizeEtappePlaceNames, isGenericEtappePlaceLabel, collapseViaInflatedLegs } from "./etappeUtils";
import { Trip, RouteStop, Etappe, PdfPhotoPlacement, PdfPhotoLayout, RouteLegInfo, customTextFontJsPdfStyle, isDrivingRouteStop } from "./types";
import {
 extraFerryViaFromRestResult,
 filterFerryWaypointNames,
 filterStopsForFerryRouting,
 filterViaPointsForFerryRouting,
 preferSaneRestDirections,
 restDirectionsUsesBogusIslandTransfer,
} from "./ferryRouting";
import { routeDrivingWithFerrySanity } from "./ferryDirections";
import { PDF_POI_DESC_MAX_LINES, isWeakDiscoveryBody, trimPoiTextToWordRange } from "./poiTextLimits";
import { generatePoiReportText } from "./poiReportText";
import { asAppLocale } from "./localeCopy";
import { buildSmartPhotoPages } from "./pdfSmartPages";
import type { PdfMapsBillingAccumulator } from "./mapsUsageTracking";
import {
 COVER_CONTENT_W_PT,
 COVER_PAGE_W_PT,
 COVER_RIGHT_PT,
 computeCoverLayout,
 getCoverDateDisplayText,
 type CoverTextSlot,
} from "./coverSheetLayout";
import { formatPdfDate, formatPdfPrintDate, getPdfCopy, pdfFill, type PdfCopy } from "./pdfCopy";
import {
 wikipediaGeosearchUrls,
 wikipediaIntroExtractUrls,
 wikipediaOpenSearchUrls,
 wikipediaSummaryUrls,
} from "./wikipediaLocale";

// --- Constants (matching iOS TripPrintView.swift) ---
const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const M = 50; // margin
const CONTENT_W = PAGE_W - 2 * M;
const RIGHT = PAGE_W - M;

const BRAND = [37, 99, 235] as const;
const BLUE = BRAND;
const GREEN = [52, 199, 89] as const;
const RED = [255, 59, 48] as const;
const BLACK = [0, 0, 0] as const;
const GRAY = [142, 142, 147] as const;
const DARK_GRAY = [74, 74, 79] as const;
const LIGHT_GRAY = [210, 210, 210] as const;
/** Datum / Hotel-Zeile in Etappen-PDF (Terrakotta). */
const PDF_TERRACOTTA = [153, 99, 68] as const;
const MAP_HOTEL_DOT_CANVAS_R = 12.5;
const CARD_BG: [number, number, number] = [239, 246, 255];
const CARD_BORDER: [number, number, number] = [226, 232, 240];
const DISCOVERY_CARD_BG: [number, number, number] = [248, 250, 255];
const POI_HIGHLIGHTS_CARD_BG: [number, number, number] = [255, 255, 255];
const PDF_POI_DESC_FONT_SIZE = 9;
const PDF_POI_DESC_LINE_HEIGHT_FACTOR = 1.25;
/** Muss zu `lineHeightFactor` beim Zeichnen passen (fontSize × factor). */
const PDF_POI_DESC_LINE_H = PDF_POI_DESC_FONT_SIZE * PDF_POI_DESC_LINE_HEIGHT_FACTOR;
/** Abstand letzte Beschreibungszeile → Sehenswürdigkeiten-Box (pt). */
const POI_HIGHLIGHTS_ABOVE_GAP = 5;
/** Abstand Überschrift «Wichtigste Sehenswürdigkeiten» → Bullet-Liste (pt). */
const POI_HIGHLIGHTS_TITLE_GAP = 11;

function measurePoiDescBlockHeight(lineCount: number): number {
 if (lineCount <= 0) return 0;
 // jsPDF: letzte Baseline bei y + (n-1)*fontSize*factor; etwas Platz für Descender.
 return (lineCount - 1) * PDF_POI_DESC_LINE_H + PDF_POI_DESC_FONT_SIZE * 0.35;
}

const POI_PHOTO_GAP = 10;
/** Zeilenabstand zwischen Volltext-Block und unterem Bereich (Foto/Umbruch). */
const POI_BAND_TOP_GAP = PDF_POI_DESC_LINE_H;

type PoiCardLayout = {
 fullLines: string[];
 abovePhotoLines: string[];
 besideLines: string[];
 belowFloatLines: string[];
 fullH: number;
 abovePhotoH: number;
 besideTextH: number;
 belowFloatH: number;
 bandH: number;
 bodyH: number;
};

/**
 * Mit Foto: Spalte 1 Titel+Foto, Spalte 2 Text+Sehenswürdigkeiten
 * vertikal zur linken Spalte zentriert. Kachel mindestens so hoch wie Titel+Foto.
 * Ohne Foto: Vollbreite-Beschreibung.
 */
function layoutPoiCard(
 doc: jsPDF,
 text: string,
 innerW: number,
 photoW: number,
 photoH: number,
 highlightsInnerH: number,
 hasPhoto: boolean,
 maxLines: number
): PoiCardLayout {
 doc.setFont("helvetica", "normal");
 doc.setFontSize(PDF_POI_DESC_FONT_SIZE);

 const empty: PoiCardLayout = {
 fullLines: [],
 abovePhotoLines: [],
 besideLines: [],
 belowFloatLines: [],
 fullH: 0,
 abovePhotoH: 0,
 besideTextH: 0,
 belowFloatH: 0,
 bandH: 0,
 bodyH: 0,
 };

 const trimmed = text.trim();
 const highlightsStackH = highlightsInnerH > 0 ? POI_HIGHLIGHTS_ABOVE_GAP + highlightsInnerH : 0;

 if (!hasPhoto) {
 if (!trimmed) {
 return { ...empty, bodyH: highlightsStackH };
 }
 const fullLines = trimPdfDescLines(doc, trimmed, innerW, maxLines);
 const fullH = measurePoiDescBlockHeight(fullLines.length);
 const bodyH = fullH + (highlightsStackH > 0 ? POI_BAND_TOP_GAP + highlightsStackH : 0);
 return { ...empty, fullLines, fullH, bodyH };
 }

 if (!trimmed) {
 const bandH = Math.max(photoH, highlightsStackH);
 return { ...empty, bandH, bodyH: bandH };
 }

 const narrowW = Math.max(40, innerW - photoW - POI_PHOTO_GAP);
 const besideLines = trimPdfDescLines(doc, trimmed, narrowW, maxLines);
 const besideTextH = measurePoiDescBlockHeight(besideLines.length);
 const rightColH = besideTextH + highlightsStackH;
 const bandH = Math.max(photoH, rightColH);

 return {
 ...empty,
 besideLines,
 besideTextH,
 bandH,
 bodyH: bandH,
 };
}

/** Eine Zeile immer als Blocksatz (auch «letzte» Zeile eines Textblocks). */
function drawFullyJustifiedLine(doc: jsPDF, line: string, x: number, y: number, maxWidth: number): void {
 const words = line.trim().split(/\s+/).filter(Boolean);
 if (words.length === 0) return;
 if (words.length === 1) {
 doc.text(words[0], x, y);
 return;
 }
 const wordsWidth = words.reduce((sum, w) => sum + doc.getTextWidth(w), 0);
 const gapW = Math.max(0, maxWidth - wordsWidth) / (words.length - 1);
 let cx = x;
 for (let i = 0; i < words.length; i++) {
 doc.text(words[i], cx, y);
 cx += doc.getTextWidth(words[i]) + gapW;
 }
}

/**
 * POI-Beschreibung zeichnen. `justifyLast`: letzte Zeile ebenfalls Blocksatz
 * (nötig beim Übergang Vollbreite → Nebenspalte, sonst lässt jsPDF sie links stehen).
 */
function drawPoiDescLines(
 doc: jsPDF,
 lines: string[],
 x: number,
 y: number,
 maxWidth: number,
 justifyLast: boolean
): void {
 if (lines.length === 0) return;
 for (let i = 0; i < lines.length; i++) {
 const baseline = y + i * PDF_POI_DESC_LINE_H;
 const isLast = i === lines.length - 1;
 if (!isLast || justifyLast) {
 drawFullyJustifiedLine(doc, lines[i], x, baseline, maxWidth);
 } else {
 doc.text(lines[i], x, baseline);
 }
 }
}

/** Verhindert hängende PDF-Erzeugung bei Directions/Static-Maps (Callback oder Netz). */
const PDF_DIRECTIONS_TIMEOUT_MS = 22_000;
const PDF_FETCH_TIMEOUT_MS = 35_000;
const PDF_IMG_DECODE_TIMEOUT_MS = 25_000;

async function raceWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
 let timer: ReturnType<typeof setTimeout> | undefined;
 return new Promise<T | null>((resolve) => {
 timer = setTimeout(() => {
 timer = undefined;
 resolve(null);
 }, ms);
 promise
 .then((v) => {
 if (timer !== undefined) clearTimeout(timer);
 resolve(v);
 })
 .catch(() => {
 if (timer !== undefined) clearTimeout(timer);
 resolve(null);
 });
 });
}

async function loadPdfMapImageFromSrc(src: string): Promise<HTMLImageElement | null> {
 return raceWithTimeout(
 new Promise<HTMLImageElement>((resolve, reject) => {
 const node = new Image();
 node.onload = () => resolve(node);
 node.onerror = () => reject(new Error("decode"));
 node.src = src;
 }),
 PDF_IMG_DECODE_TIMEOUT_MS
 );
}

function setColor(doc: jsPDF, c: readonly [number, number, number]) {
 doc.setTextColor(c[0], c[1], c[2]);
}

function drawSectionTitle(doc: jsPDF, title: string, y: number, size: 12 | 14 = 14): number {
 doc.setFont("helvetica", "bold");
 doc.setFontSize(size);
 setColor(doc, BRAND);
 doc.text(title, M, y);
 return y + (size === 14 ? 24 : 18);
}

function drawSoftCard(
 doc: jsPDF,
 x: number,
 y: number,
 w: number,
 h: number,
 fill: [number, number, number] = CARD_BG,
 opts?: { border?: boolean }
): void {
 doc.setFillColor(fill[0], fill[1], fill[2]);
 if (opts?.border === false) {
 doc.roundedRect(x, y, w, h, 4, 4, "F");
 return;
 }
 doc.setDrawColor(CARD_BORDER[0], CARD_BORDER[1], CARD_BORDER[2]);
 doc.setLineWidth(0.35);
 doc.roundedRect(x, y, w, h, 4, 4, "FD");
}

function drawPdfWordmark(doc: jsPDF, x: number, y: number, light = false): number {
 const dark: readonly [number, number, number] = light ? [255, 255, 255] : [17, 24, 39];
 const accent: readonly [number, number, number] = light ? [255, 255, 255] : BRAND;
 const iconX = x;
 const iconBaseY = y - 1;
 doc.setDrawColor(accent[0], accent[1], accent[2]);
 doc.setLineWidth(1.35);
 doc.setLineCap("round");
 doc.line(iconX, iconBaseY, iconX + 4.5, iconBaseY - 5);
 doc.line(iconX + 4.5, iconBaseY - 5, iconX + 10.5, iconBaseY - 1.5);
 doc.setFillColor(accent[0], accent[1], accent[2]);
 doc.circle(iconX + 10.5, iconBaseY - 1.5, 1.35, "F");
 doc.setFont("helvetica", "bold");
 doc.setFontSize(8.5);
 const textX = iconX + 14;
 if (light) {
 setColor(doc, [255, 255, 255]);
 doc.text("SnifferTrek", textX, y);
 return textX + doc.getTextWidth("SnifferTrek");
 }
 setColor(doc, dark);
 doc.text("Sniffer", textX, y);
 const sniffW = doc.getTextWidth("Sniffer");
 setColor(doc, accent);
 doc.text("Trek", textX + sniffW, y);
 return textX + sniffW + doc.getTextWidth("Trek");
}

function drawCoverBrandMark(doc: jsPDF, onPhoto = false): void {
 doc.setFont("helvetica", "bold");
 doc.setFontSize(8.5);
 const totalW = onPhoto ? doc.getTextWidth("SnifferTrek") + 25 : doc.getTextWidth("Sniffer") + doc.getTextWidth("Trek") + 25;
 const markX = RIGHT - totalW;
 const markY = PAGE_H - 22;
 drawPdfWordmark(doc, markX, markY, onPhoto);
 doc.setFont("helvetica", "normal");
 doc.setFontSize(7);
 setColor(doc, onPhoto ? [255, 255, 255] : GRAY);
 doc.text("sniffertrek.com", markX + 14, markY + 9);
}

function trimPdfDescLines(doc: jsPDF, text: string, maxWidth: number, maxLines: number): string[] {
 doc.setFont("helvetica", "normal");
 doc.setFontSize(9);
 const lines = splitTextLines(doc, text.trim(), maxWidth);
 if (lines.length <= maxLines) return lines;
 const clipped = lines.slice(0, maxLines);
 const last = (clipped[maxLines - 1] || "").replace(/[.,;:!?-]*\s*$/, "").trim();
 clipped[maxLines - 1] = `${last}…`;
 return clipped;
}

function measureDiscoveryHighlightsHeight(
 doc: jsPDF,
 highlights: string[],
 maxW: number,
 singleColumn = false,
 innerPadX = 0
): number {
 if (highlights.length === 0) return 0;
 const listW = Math.max(40, maxW - innerPadX * 2);
 doc.setFont("helvetica", "normal");
 doc.setFontSize(8);
 if (singleColumn || highlights.length <= 1) {
 let h = 0;
 for (const item of highlights) {
 h += splitTextLines(doc, `• ${item}`, listW).length * 9;
 }
 return h;
 }
 const colGap = 10;
 const colW = (listW - colGap) / 2;
 const mid = Math.ceil(highlights.length / 2);
 let leftY = 0;
 let rightY = 0;
 for (const h of highlights.slice(0, mid)) {
 leftY += splitTextLines(doc, `• ${h}`, colW).length * 9;
 }
 for (const h of highlights.slice(mid)) {
 rightY += splitTextLines(doc, `• ${h}`, colW).length * 9;
 }
 return Math.max(leftY, rightY);
}

function drawMapLegend(doc: jsPDF, x: number, y: number, copy: PdfCopy): void {
 const legendW = 98;
 const legendH = 20;
 const pad = 5;
 drawSoftCard(doc, x, y, legendW, legendH, [255, 255, 255]);
 doc.setDrawColor(255, 0, 0);
 doc.setLineWidth(1.6);
 const lineY = y + legendH / 2 + 0.5;
 doc.line(x + pad, lineY, x + pad + 14, lineY);
 doc.setFont("helvetica", "normal");
 doc.setFontSize(7);
 setColor(doc, BLACK);
 doc.text(copy.legendRoute, x + pad + 17, y + legendH / 2 + 2.5);
 const dotX = x + 52;
 doc.setFillColor(BRAND[0], BRAND[1], BRAND[2]);
 doc.circle(dotX, lineY, 2.4, "F");
 doc.text(copy.legendHotel, dotX + 5.5, y + legendH / 2 + 2.5);
}

function estimateDiscoveryHighlightsHeight(
 doc: jsPDF,
 highlights: string[],
 textW: number
): number {
 return measureDiscoveryHighlightsHeight(doc, highlights, textW);
}

function resolveBookingProviderLabel(stop: RouteStop): string | null {
 const explicit = stop.bookingProvider?.trim();
 if (explicit) return explicit;
 const link = (stop.bookingLink || "").toLowerCase();
 if (link.includes("hotels.com")) return "Hotels.com";
 if (link.includes("booking.com")) return "Booking.com";
 if (link.includes("expedia.")) return "Expedia";
 if (link.includes("agoda.")) return "Agoda";
 if (link.includes("trivago.")) return "trivago";
 return null;
}

function hexToRgb(hex?: string): [number, number, number] | null {
 const raw = (hex || "").trim();
 if (!raw) return null;
 const normalized = raw.startsWith("#") ? raw.slice(1) : raw;
 const full = normalized.length === 3
 ? normalized.split("").map((c) => c + c).join("")
 : normalized;
 if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
 const r = parseInt(full.slice(0, 2), 16);
 const g = parseInt(full.slice(2, 4), 16);
 const b = parseInt(full.slice(4, 6), 16);
 return [r, g, b];
}

function addDaysISO(iso: string, days: number): string {
 const [y, m, d] = iso.split("-").map(Number);
 const dt = new Date(y, m - 1, d + days);
 return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function formatDur(sec: number): string {
 const h = Math.floor(sec / 3600);
 const m = Math.floor((sec % 3600) / 60);
 return `${h}:${String(m).padStart(2, "0")} h`;
}

function formatEtappeMetricsLine(et: Etappe): string {
 const dur = (et.durationFormatted || "").trim();
 const hasDur = dur.length > 0 && dur !== "—";
 if (et.distanceKm > 0 && hasDur) return `${et.distanceKm} km - ${dur}`;
 if (et.distanceKm > 0) return `${et.distanceKm} km`;
 if (hasDur) return dur;
 return `${et.distanceKm} km`;
}

function withRoundTripReturnLeg(etappe: Etappe): Etappe {
 const legs = etappe.legs || [];
 if (legs.length < 2) return etappe;
 const startKey = normalizePlaceKey(extractCity(etappe.from || legs[0].from));
 const endKey = normalizePlaceKey(extractCity(etappe.to || legs[legs.length - 1].to));
 if (!startKey || startKey !== endKey) return etappe;
 const first = legs[0];
 if (!(first.distanceMeters > 0)) return etappe;
 const nextLegs = legs.map((l, i) =>
  i === legs.length - 1
   ? { ...l, distanceMeters: first.distanceMeters, durationSeconds: first.durationSeconds }
   : l
 );
 return { ...etappe, legs: nextLegs };
}

function enrichEtappeMetrics(etappe: Etappe, routedSegments: RoutedSegment[] | null): Etappe {
 etappe = withRoundTripReturnLeg(etappe);
 // Berechnete Legs aus dem Planer sind zuverlässiger als PDF-Neuberechnung.
 if (etappe.legs?.length) {
 const fromLegsM = etappe.legs.reduce((s, l) => s + (l.distanceMeters || 0), 0);
 const fromLegsS = etappe.legs.reduce((s, l) => s + (l.durationSeconds || 0), 0);
 if (fromLegsM > 0) {
 return {
 ...etappe,
 distanceKm: Math.round(fromLegsM / 1000),
 durationFormatted: fromLegsS > 0 ? formatDur(fromLegsS) : etappe.durationFormatted || "—",
 };
 }
 }
 if (etappe.distanceKm > 0 && etappe.durationFormatted && etappe.durationFormatted !== "—") {
 return etappe;
 }

 let distanceMeters = 0;
 let durationSeconds = 0;

 if (routedSegments?.length) {
 distanceMeters = routedSegments.reduce((s, seg) => s + (seg.distanceMeters || 0), 0);
 durationSeconds = routedSegments.reduce((s, seg) => s + (seg.durationSeconds || 0), 0);
 }
 if (distanceMeters <= 0 && durationSeconds <= 0) return etappe;

 return {
 ...etappe,
 distanceKm: Math.max(0, Math.round(distanceMeters / 1000)),
 durationFormatted: durationSeconds > 0 ? formatDur(durationSeconds) : etappe.durationFormatted || "—",
 };
}

function extractCity(name: string): string {
 const firstLine = (name || "").split("\n")[0].trim();
 if (!firstLine) return "";

 const stripPostalCodes = (value: string): string =>
 value
 // UK-style: GX11 1AA
 .replace(/\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/gi, "")
 // CH/EU common: 1000, 8001, 1200-000
 .replace(/\b\d{4,6}(?:-\d{3,4})?\b/g, "")
 .replace(/\s+/g, " ")
 .trim();

 const isAddressLike = (value: string): boolean =>
 /\b(strasse|straße|weg|gasse|rue|route|via|avenue|av\.?|road|street|st\.?|str\.?|chemin|place|boulevard|blvd|calle|rua|plaza|platz)\b/i.test(value) ||
 /\d/.test(value);

 const stripStreetPrefixAndNumbers = (value: string): string =>
 value
 .replace(/^(av\.?|avenida|rua|r\.?|calle|c\/|via|route|street|st\.?|road|rd\.?|boulevard|blvd\.?|chemin|platz|plaza)\s+/i, "")
 .replace(/\b\d+[a-zA-Z/-]*\b.*$/g, "")
 .replace(/\s+/g, " ")
 .trim();

 const parts = firstLine.split(",").map((p) => stripPostalCodes(p.trim())).filter(Boolean);
 if (parts.length > 1) {
 const candidate = parts.find((p) => p && !isAddressLike(p)) || parts.find((p) => p && !/\d/.test(p)) || parts[0];
 return candidate.trim();
 }

 const cleaned = stripPostalCodes(parts[0] || firstLine);
 if (!isAddressLike(cleaned)) {
 const inPlace = cleaned.match(/\bin\s+([^,–—]+)\s*$/i);
 if (inPlace?.[1] && cleaned.length > 40) return inPlace[1].trim();
 return cleaned;
 }
 const fallback = stripStreetPrefixAndNumbers(cleaned);
 return fallback || cleaned;
}

function splitTextLines(doc: jsPDF, text: string, maxWidth: number): string[] {
 return doc.splitTextToSize(text, maxWidth);
}

function appendPlainMultilineText(
 doc: jsPDF,
 text: string,
 x: number,
 yStart: number,
 maxWidth: number,
 opts?: { colorHex?: string; fontStyle?: "normal" | "bold" | "italic" | "bolditalic" }
): { y: number; pageBreaks: number } {
 const trimmed = text.replace(/\r\n/g, "\n");
 if (!trimmed.trim()) return { y: yStart, pageBreaks: 0 };
 let y = yStart + 8;
 let pageBreaks = 0;
 const fontStyle = opts?.fontStyle || "normal";
 doc.setFont("helvetica", fontStyle);
 doc.setFontSize(9);
 setColor(doc, hexToRgb(opts?.colorHex) || BLACK);
 for (const para of trimmed.split("\n")) {
 if (!para.trim()) {
 y += 6;
 continue;
 }
 for (const line of splitTextLines(doc, para, maxWidth)) {
 if (y > PAGE_H - 40) {
 doc.addPage();
 pageBreaks += 1;
 y = M;
 }
 doc.text(line, x, y);
 y += 11;
 }
 y += 4;
 }
 return { y: y + 4, pageBreaks };
}

// Draw a filled circle (status dot replacement for Unicode issues)
function drawDot(doc: jsPDF, x: number, y: number, r: number, filled: boolean) {
 if (filled) {
 doc.circle(x, y - 3, r, "F");
 } else {
 doc.setLineWidth(0.8);
 doc.circle(x, y - 3, r, "S");
 }
}

// --- Collect hotel stops from all routes ---
function collectAllHotelStops(trip: Trip): RouteStop[] {
 const all = [
 ...trip.stops,
 ...(trip.routes?.flights?.stops || []),
 ...(trip.routes?.car?.stops || []),
 ...(trip.routes?.train?.stops || []),
 ];
 const seen = new Set<string>();
 return all.filter((s) => {
 if (!s.isHotel || !s.name.trim()) return false;
 const key = s.name.toLowerCase().trim();
 if (seen.has(key)) return false;
 seen.add(key);
 return true;
 });
}

function normalizePlaceKey(value: string): string {
 return value
 .toLowerCase()
 .normalize("NFD")
 .replace(/[\u0300-\u036f]/g, "")
 .replace(/[^a-z0-9]+/g, " ")
 .trim();
}

function collectAiDiscoveriesByEtappe(trip: Trip): Map<number, RouteStop[]> {
 const grouped = new Map<number, RouteStop[]>();
 const seen = new Set<string>();
 for (const stop of trip.stops || []) {
 if (stop.type !== "stop" || !stop.discoverySource) continue;
 if (stop.discoveryIncludeInReport === false) continue;
 if (typeof stop.discoveryEtappeIndex !== "number") continue;
 const dedupeKey = `${stop.discoveryEtappeIndex}:${normalizePlaceKey(stop.name)}`;
 if (seen.has(dedupeKey)) continue;
 seen.add(dedupeKey);
 const current = grouped.get(stop.discoveryEtappeIndex) || [];
 current.push(stop);
 grouped.set(stop.discoveryEtappeIndex, current);
 }
 return grouped;
}

function getEtappeStopsForMap(etappe: Etappe, allStops: RouteStop[]): RouteStop[] {
 const et = normalizeEtappePlaceNames(etappe, allStops);
 const namedStops = allStops.filter((s) => s.name.trim() && isDrivingRouteStop(s));

 const pickStopForName = (name: string, usedIds: Set<string>): RouteStop | null => {
 const targetKey = normalizePlaceKey(extractCity(name));
 if (!targetKey) return null;
 for (const s of namedStops) {
 if (usedIds.has(s.id)) continue;
 const cityKey = normalizePlaceKey(extractCity(s.name));
 if (cityKey === targetKey || cityKey.includes(targetKey) || targetKey.includes(cityKey)) {
 return s;
 }
 }
 return null;
 };

 // Leg-Kette: bei Rundreisen zuverlässiger als Index-Suche (Start=Ziel).
 if (et.legs.length > 0) {
 const chainNames = [et.from, ...et.legs.map((l) => l.to)];
 const fromLegs: RouteStop[] = [];
 const usedIds = new Set<string>();
 for (const name of chainNames) {
 const stop = pickStopForName(name, usedIds);
 if (!stop) continue;
 usedIds.add(stop.id);
 const dedupe = `${stop.id}:${stop.lat ?? ""}:${stop.lng ?? ""}`;
 if (!fromLegs.some((r) => `${r.id}:${r.lat ?? ""}:${r.lng ?? ""}` === dedupe)) {
 fromLegs.push(stop);
 }
 }
 if (fromLegs.length >= 2) return fromLegs;
 }

 const startKey = normalizePlaceKey(extractCity(et.from));
 const endKey = normalizePlaceKey(extractCity(et.to));
 const matchesEtappeName = (stopName: string, targetKey: string) => {
 const cityKey = normalizePlaceKey(extractCity(stopName));
 return cityKey === targetKey || cityKey.includes(targetKey) || targetKey.includes(cityKey);
 };

 // Prefer the literal stop order in trip.stops so every intermediate stop is preserved.
 const startIdx = namedStops.findIndex((s) => matchesEtappeName(s.name, startKey));
 if (startIdx >= 0) {
 const endIdx = namedStops.findIndex((s, idx) => idx > startIdx && matchesEtappeName(s.name, endKey));
 if (endIdx > startIdx) {
 const sliced = namedStops.slice(startIdx, endIdx + 1);
 const deduped: RouteStop[] = [];
 const seen = new Set<string>();
 for (const s of sliced) {
 const dedupe = `${normalizePlaceKey(s.name)}:${s.lat ?? ""}:${s.lng ?? ""}`;
 if (seen.has(dedupe)) continue;
 seen.add(dedupe);
 deduped.push(s);
 }
 return deduped;
 }
 }

 const result: RouteStop[] = [];
 const stopByKey = new Map<string, RouteStop[]>();

 for (const s of allStops) {
 const key = normalizePlaceKey(extractCity(s.name));
 if (!stopByKey.has(key)) stopByKey.set(key, []);
 stopByKey.get(key)!.push(s);
 }

 const pushByName = (name: string) => {
 const key = normalizePlaceKey(extractCity(name));
 const candidates = stopByKey.get(key) || [];
 const picked = candidates.find((c) => c.lat != null && c.lng != null) || candidates[0];
 if (!picked) return;
 const dedupe = `${picked.id}:${picked.lat ?? ""}:${picked.lng ?? ""}`;
 if (!result.some((r) => `${r.id}:${r.lat ?? ""}:${r.lng ?? ""}` === dedupe)) {
 result.push(picked);
 }
 };

 pushByName(et.from);
 for (const leg of et.legs) {
 pushByName(leg.to);
 }
 return result;
}

function formatEtappeRouteLabel(from: string, to: string): string {
 const fromCity = extractCity(from);
 const toCity = extractCity(to);
 if (normalizePlaceKey(fromCity) === normalizePlaceKey(toCity)) {
 return fromCity;
 }
 return `${fromCity} - ${toCity}`;
}

/** PDF-safe route label (no Unicode arrows — jsPDF Helvetica breaks on →). */
function formatPdfRouteLabel(from: string, to: string): string {
 const f = (from || "").trim();
 const t = (to || "").trim();
 if (!f && !t) return "—";
 if (!t || normalizePlaceKey(f) === normalizePlaceKey(t)) return f || t;
 return `${f} - ${t}`;
}

type SegmentRow = {
 from: string;
 to: string;
 distanceMeters?: number;
 durationSeconds?: number;
};

type RoutedSegment = {
 fromKey: string;
 toKey: string;
 polyline: string;
 distanceMeters?: number;
 durationSeconds?: number;
};

type RouteByNamesResult = {
 encodedPolyline?: string;
 overviewPoints?: Array<{ lat: number; lng: number }>;
 segments: RoutedSegment[];
};

function fillMissingSegmentMetrics(
 rows: SegmentRow[],
 etappe: Etappe,
 routedSegments?: RoutedSegment[] | null
): SegmentRow[] {
 if (rows.length === 0) return rows;
 const out = rows.map((r) => ({ ...r }));
 const hasMissing = out.some(
 (r) => typeof r.distanceMeters !== "number" || typeof r.durationSeconds !== "number"
 );
 if (!hasMissing) return out;

 const etappeLegs = etappe.legs || [];
 const routed = routedSegments || [];

 // 1) Strong index-based fallback from etappe legs.
 for (let i = 0; i < out.length; i++) {
 if (typeof out[i].distanceMeters === "number" && typeof out[i].durationSeconds === "number") continue;
 const leg = etappeLegs[i];
 if (leg) {
 if (typeof out[i].distanceMeters !== "number") out[i].distanceMeters = leg.distanceMeters;
 if (typeof out[i].durationSeconds !== "number") out[i].durationSeconds = leg.durationSeconds;
 }
 }

 // 2) Index-based fallback from routed segments.
 for (let i = 0; i < out.length; i++) {
 if (typeof out[i].distanceMeters === "number" && typeof out[i].durationSeconds === "number") continue;
 const seg = routed[i];
 if (seg) {
 if (typeof out[i].distanceMeters !== "number" && typeof seg.distanceMeters === "number") {
 out[i].distanceMeters = seg.distanceMeters;
 }
 if (typeof out[i].durationSeconds !== "number" && typeof seg.durationSeconds === "number") {
 out[i].durationSeconds = seg.durationSeconds;
 }
 }
 }

 // 3) Last fallback: distribute remaining distance/time across unresolved rows.
 const totalDistance =
 etappeLegs.reduce((sum, l) => sum + (l.distanceMeters || 0), 0) ||
 routed.reduce((sum, s) => sum + (s.distanceMeters || 0), 0);
 const totalDuration =
 etappeLegs.reduce((sum, l) => sum + (l.durationSeconds || 0), 0) ||
 routed.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

 const knownDistance = out.reduce((sum, r) => sum + (typeof r.distanceMeters === "number" ? r.distanceMeters : 0), 0);
 const knownDuration = out.reduce((sum, r) => sum + (typeof r.durationSeconds === "number" ? r.durationSeconds : 0), 0);

 const missingIdx = out
 .map((r, i) =>
 typeof r.distanceMeters !== "number" || typeof r.durationSeconds !== "number" ? i : -1
 )
 .filter((i) => i >= 0);

 if (missingIdx.length > 0) {
 const distLeft = Math.max(0, totalDistance - knownDistance);
 const durLeft = Math.max(0, totalDuration - knownDuration);
 const distShare = distLeft > 0 ? Math.round(distLeft / missingIdx.length) : 0;
 const durShare = durLeft > 0 ? Math.round(durLeft / missingIdx.length) : 0;
 for (const idx of missingIdx) {
 if (typeof out[idx].distanceMeters !== "number") out[idx].distanceMeters = distShare;
 if (typeof out[idx].durationSeconds !== "number") out[idx].durationSeconds = durShare;
 }
 }

 return out;
}

function applyRoundTripReturnMetrics(rows: SegmentRow[]): SegmentRow[] {
 if (rows.length < 2) return rows;
 const startKey = normalizePlaceKey(rows[0].from);
 const endKey = normalizePlaceKey(rows[rows.length - 1].to);
 if (!startKey || startKey !== endKey) return rows;
 const first = rows[0];
 if (typeof first.distanceMeters !== "number") return rows;
 const out = rows.map((r) => ({ ...r }));
 out[out.length - 1] = {
  ...out[out.length - 1],
  distanceMeters: first.distanceMeters,
  durationSeconds: first.durationSeconds,
 };
 return out;
}

function buildSegmentRows(
 etappe: Etappe,
 etappeStops: RouteStop[],
 routedSegments?: RoutedSegment[] | null
): SegmentRow[] {
 const rows: SegmentRow[] = [];
 const hasStopChain = etappeStops.length > 1;
 const legs = etappe.legs || [];

 if (hasStopChain) {
 const useIndex = legs.length === etappeStops.length - 1;
 for (let i = 0; i < etappeStops.length - 1; i++) {
 const fromStop = etappeStops[i];
 const toStop = etappeStops[i + 1];
 const fromCity = extractCity(fromStop.name);
 const toCity = extractCity(toStop.name);
 const fromKey = normalizePlaceKey(fromCity);
 const toKey = normalizePlaceKey(toCity);
 const matchedLeg = useIndex
  ? legs[i]
  : legs.find((leg) => {
   const legFrom = normalizePlaceKey(extractCity(leg.from));
   const legTo = normalizePlaceKey(extractCity(leg.to));
   return legFrom === fromKey && legTo === toKey;
  });
 const routed = useIndex
  ? routedSegments?.[i]
  : routedSegments?.find((seg) => seg.fromKey === fromKey && seg.toKey === toKey);
 rows.push({
 from: fromCity,
 to: toCity,
 distanceMeters: matchedLeg?.distanceMeters ?? routed?.distanceMeters,
 durationSeconds: matchedLeg?.durationSeconds ?? routed?.durationSeconds,
 });
 }
 return applyRoundTripReturnMetrics(fillMissingSegmentMetrics(rows, etappe, routedSegments));
 }

 for (const leg of legs) {
 rows.push({
 from: extractCity(leg.from),
 to: extractCity(leg.to),
 distanceMeters: leg.distanceMeters,
 durationSeconds: leg.durationSeconds,
 });
 }
 return applyRoundTripReturnMetrics(fillMissingSegmentMetrics(rows, etappe, routedSegments));
}

type ZwischenstoppRow = {
 name: string;
 cumKm: number;
 cumDurationSec: number;
};

function buildZwischenstoppRows(
 etappe: Etappe,
 etappeStops: RouteStop[],
 routedSegments: RoutedSegment[] | null | undefined,
 copy: PdfCopy
): ZwischenstoppRow[] {
 const segmentRows = buildSegmentRows(etappe, etappeStops, routedSegments);
 if (segmentRows.length === 0) return [];

 const stops = etappeStops.filter((s) => (s.name || "").trim());
 const out: ZwischenstoppRow[] = [];
 let cumM = 0;
 let cumS = 0;

 for (let i = 0; i < segmentRows.length; i++) {
 const seg = segmentRows[i];
 cumM += seg.distanceMeters || 0;
 cumS += seg.durationSeconds || 0;
 const stop = stops[i + 1];
 const name = stop?.name?.trim()
 ? extractCity(stop.name)
 : seg.to || pdfFill(copy.stopN, { n: i + 1 });
 out.push({
 name,
 cumKm: Math.max(0, Math.round(cumM / 1000)),
 cumDurationSec: Math.max(0, cumS),
 });
 }
 return out;
}

function formatEtappeHotelHeaderLine(
 matchedHotel: RouteStop | undefined,
 et: Etappe,
 hotelStops: RouteStop[],
 tripStartDate: string,
 copy: PdfCopy
): string | null {
 if (matchedHotel) {
 const hIdx = hotelStops.indexOf(matchedHotel);
 const { nights } = getHotelDates(matchedHotel, hIdx, hotelStops, tripStartDate);
 const hotelName = (matchedHotel.bookingHotelName || matchedHotel.name || "").trim();
 const city = extractCity(matchedHotel.name);
 const parts = [hotelName, city].filter(Boolean);
 const nightLabel = nights === 1 ? copy.night1 : pdfFill(copy.nightsN, { n: nights });
 return [...parts, nightLabel].join(", ");
 }
 if (et.hotelName?.trim()) {
 const city = extractCity(et.to);
 return city ? `${et.hotelName.trim()}, ${city}` : et.hotelName.trim();
 }
 return null;
}

function drawEtappeDayHeader(
 doc: jsPDF,
 y: number,
 dayLabel: string,
 routeLabel: string,
 hotelLine: string | null
): number {
 doc.setFont("helvetica", "normal");
 doc.setFontSize(11);
 setColor(doc, PDF_TERRACOTTA);
 doc.text(dayLabel, M, y);
 y += 28;

 doc.setFont("helvetica", "bold");
 doc.setFontSize(20);
 setColor(doc, BLACK);
 const routeLines = splitTextLines(doc, routeLabel, CONTENT_W);
 doc.text(routeLines, M, y);
 y += Math.max(22, routeLines.length * 22);

 if (hotelLine) {
 doc.setFont("helvetica", "normal");
 doc.setFontSize(10);
 setColor(doc, PDF_TERRACOTTA);
 const hotelLines = splitTextLines(doc, hotelLine, CONTENT_W);
 doc.text(hotelLines, M, y);
 y += Math.max(14, hotelLines.length * 13);
 }

 y += 4;
 doc.setDrawColor(PDF_TERRACOTTA[0], PDF_TERRACOTTA[1], PDF_TERRACOTTA[2]);
 doc.setLineWidth(0.6);
 doc.line(M, y, RIGHT, y);
 return y + 14;
}

function drawZwischenstoppsPanel(
 doc: jsPDF,
 x: number,
 topY: number,
 w: number,
 minH: number,
 rows: ZwischenstoppRow[],
 copy: PdfCopy
): number {
 doc.setFont("helvetica", "bold");
 doc.setFontSize(10);
 setColor(doc, BLACK);
 doc.text(copy.waypoints, x, topY + 12);

 const kmColX = x + w - 52;
 const timeColX = x + w;
 let rowY = topY + 30;
 const rowStep = 16;

 doc.setFont("helvetica", "normal");
 doc.setFontSize(9);
 setColor(doc, BLACK);

 for (const row of rows) {
 const nameW = Math.max(40, kmColX - x - 10);
 const nameLines = splitTextLines(doc, row.name, nameW).slice(0, 2);
 doc.text(nameLines, x, rowY);
 doc.text(`km ${row.cumKm}`, kmColX, rowY, { align: "right" });
 doc.text(formatDur(row.cumDurationSec), timeColX, rowY, { align: "right" });
 rowY += rowStep * Math.max(1, nameLines.length);
 }

 return Math.max(minH, rowY - topY + 8);
}

function encodePolyline(points: Array<{ lat: number; lng: number }>): string {
 let lastLat = 0;
 let lastLng = 0;
 let result = "";
 const encodeValue = (value: number) => {
 let v = value < 0 ? ~(value << 1) : value << 1;
 while (v >= 0x20) {
 result += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
 v >>= 5;
 }
 result += String.fromCharCode(v + 63);
 };
 for (const p of points) {
 const lat = Math.round(p.lat * 1e5);
 const lng = Math.round(p.lng * 1e5);
 encodeValue(lat - lastLat);
 encodeValue(lng - lastLng);
 lastLat = lat;
 lastLng = lng;
 }
 return result;
}

function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
 const points: Array<{ lat: number; lng: number }> = [];
 let index = 0;
 let lat = 0;
 let lng = 0;
 while (index < encoded.length) {
 let b: number;
 let shift = 0;
 let result = 0;
 do {
 b = encoded.charCodeAt(index++) - 63;
 result |= (b & 0x1f) << shift;
 shift += 5;
 } while (b >= 0x20);
 const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
 lat += dlat;
 shift = 0;
 result = 0;
 do {
 b = encoded.charCodeAt(index++) - 63;
 result |= (b & 0x1f) << shift;
 shift += 5;
 } while (b >= 0x20);
 const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
 lng += dlng;
 points.push({ lat: lat / 1e5, lng: lng / 1e5 });
 }
 return points;
}

function simplifyPolylinePoints(
 points: Array<{ lat: number; lng: number }>,
 maxPoints: number
): Array<{ lat: number; lng: number }> {
 if (points.length <= maxPoints) return points;
 const step = Math.ceil(points.length / maxPoints);
 const out: Array<{ lat: number; lng: number }> = [];
 for (let i = 0; i < points.length; i += step) out.push(points[i]);
 const last = points[points.length - 1];
 if (out.length === 0 || out[out.length - 1] !== last) out.push(last);
 return out;
}

function chunkPolylinePoints(
 points: Array<{ lat: number; lng: number }>,
 maxChunkPoints: number
): Array<Array<{ lat: number; lng: number }>> {
 if (points.length <= maxChunkPoints) return [points];
 const chunks: Array<Array<{ lat: number; lng: number }>> = [];
 let i = 0;
 while (i < points.length - 1) {
 const end = Math.min(points.length, i + maxChunkPoints);
 const chunk = points.slice(i, end);
 if (chunk.length >= 2) chunks.push(chunk);
 if (end >= points.length) break;
 i = end - 1; // overlap by one point to keep continuity
 }
 return chunks;
}

async function loadRouteByNamesViaJsApi(
 origin: string,
 destination: string,
 waypoints: string[],
 billing?: PdfMapsBillingAccumulator
): Promise<RouteByNamesResult | null> {
 const w = window as any;
 const g = w.google;
 if (!g?.maps?.DirectionsService || !g.maps.TravelMode) return null;
 try {
 const service = new g.maps.DirectionsService();
 const saneWaypoints = filterFerryWaypointNames(origin, destination, waypoints);
 const res = await raceWithTimeout(
 routeDrivingWithFerrySanity(
 service,
 origin,
 destination,
 saneWaypoints.map((loc) => ({ location: loc, stopover: true })),
 g.maps.TravelMode.DRIVING,
 false
 ),
 PDF_DIRECTIONS_TIMEOUT_MS
 );
 if (!res) return null;
 if (billing) billing.directionsRequests += 1;
 const route = res?.routes?.[0];
 if (!route) return null;
 const names = [origin, ...saneWaypoints, destination];
 const legs: any[] = route.legs || [];
 const segments: RoutedSegment[] = [];
 for (let i = 0; i < legs.length; i++) {
 const leg = legs[i];
 const fromName = names[i] || leg?.start_address || "";
 const toName = names[i + 1] || leg?.end_address || "";
 let segPolyline = "";
 const stepPath: Array<{ lat: number; lng: number }> = [];
 for (const step of leg?.steps || []) {
 for (const p of step?.path || []) {
 const lat = typeof p.lat === "function" ? p.lat() : p.lat;
 const lng = typeof p.lng === "function" ? p.lng() : p.lng;
 if (Number.isFinite(lat) && Number.isFinite(lng)) {
 stepPath.push({ lat, lng });
 }
 }
 }
 if (stepPath.length > 1) {
 segPolyline = encodePolyline(stepPath);
 }
 segments.push({
 fromKey: normalizePlaceKey(extractCity(fromName)),
 toKey: normalizePlaceKey(extractCity(toName)),
 polyline: segPolyline,
 distanceMeters: Number(leg?.distance?.value) || undefined,
 durationSeconds: Number(leg?.duration?.value) || undefined,
 });
 }
 const overviewPath: Array<{ lat: number; lng: number }> = [];
 for (const p of route.overview_path || []) {
 const lat = Number(typeof p.lat === "function" ? p.lat() : p.lat);
 const lng = Number(typeof p.lng === "function" ? p.lng() : p.lng);
 if (Number.isFinite(lat) && Number.isFinite(lng)) {
 overviewPath.push({ lat, lng });
 }
 }
 const encodedPolyline = overviewPath.length > 1 ? encodePolyline(overviewPath) : undefined;
 return { encodedPolyline, overviewPoints: overviewPath.length > 1 ? overviewPath : undefined, segments };
 } catch {
 return null;
 }
}

function normalizeDiscoveryQuery(name: string): string {
 return name
 .replace(/\s*\([^)]*\)\s*/g, " ")
 .replace(/\s+/g, " ")
 .trim();
}

function buildDiscoveryQueryCandidates(name: string): string[] {
 const base = normalizeDiscoveryQuery(name);
 if (!base) return [];
 const candidates: string[] = [];
 const pushUnique = (v: string) => {
 const t = normalizeDiscoveryQuery(v);
 if (t && !candidates.includes(t)) candidates.push(t);
 };

 // For labels like "Annecy, Palais de l'Isle" (or legacy "Annecy - Palais..."),
 // prioritize the POI part first.
 const separatorParts = base.split(/\s*,\s*|\s[-–]\s/).map((p) => p.trim()).filter(Boolean);
 if (separatorParts.length >= 2) {
 pushUnique(separatorParts.slice(1).join(", "));
 }
 pushUnique(base);

 const strippedCategory = base
 .replace(/\b(altstadt|stadtzentrum|zentrum|old town|historic center|historic centre|vieux[-\s]?ville)\b/gi, "")
 .replace(/\s+/g, " ")
 .trim();
 pushUnique(strippedCategory);
 const beforeSeparator = strippedCategory.split(/\s*,\s*|\s[-–]\s/)[0]?.trim();
 if (beforeSeparator && beforeSeparator.length >= 3) pushUnique(beforeSeparator);

 // Art/history variants for richer descriptions (e.g. Van Gogh, Daudet).
 const lower = base.toLowerCase();
 if (lower.includes("langlois") || lower.includes("pont de langlois")) {
 pushUnique("Pont de Langlois Van Gogh");
 }
 if ((lower.includes("moulin") && lower.includes("daudet")) || lower.includes("moulin de daudet")) {
 pushUnique("Moulin de Daudet");
 pushUnique("Alphonse Daudet");
 }

 return candidates;
}

function normalizeWikiKey(value: string): string {
 return (value || "")
 .normalize("NFD")
 .replace(/[\u0300-\u036f]/g, "")
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, " ")
 .trim();
}

function normalizeDiscoveryText(text: string): string {
 return (text || "")
 .normalize("NFC")
 // Remove common pronunciation/IPA blocks like [ ... ] that often break PDF typography.
 .replace(/\s*\[[^\]]{2,}\]\s*/g, " ")
 .replace(/\s+/g, " ")
 .trim();
}

function cleanWikipediaText(text: string): string {
 return normalizeDiscoveryText(
 (text || "")
 .replace(/Vorlage:[^\n.?!]*/gi, " ")
 .replace(/\bWikidata\b/gi, " ")
 .replace(/\s*\/Wartung\/[^\n.?!]*/gi, " ")
 );
}

function isWeakWikipediaText(text?: string): boolean {
 const t = cleanWikipediaText(text || "").toLowerCase();
 if (!t) return true;
 if (t.includes("vorlage:") || t.includes("wikidata")) return true;
 if (t.includes("begriffsklarung") || t.includes("begriffsklärung")) return true;
 if (t.includes("disambiguation") || t.includes("desambiguación")) return true;
 if (t.includes("steht fur") || t.includes("steht für")) return true;
 if (t.includes("kann folgendes bedeuten")) return true;
 return t.length < 120;
}

async function fetchWikipediaSummaryByTitle(
 title: string,
 locale?: string,
 langFallback = false
): Promise<{ title: string; text?: string; photo?: string; lat?: number; lng?: number } | null> {
 const q = normalizeDiscoveryQuery(title);
 if (!q) return null;
 const endpoints = wikipediaSummaryUrls(q, locale, langFallback);
 for (const url of endpoints) {
 try {
 const resp = await fetch(url);
 if (!resp.ok) continue;
 const data = await resp.json();
 const resolvedTitle = (data?.title || q).toString().trim() || q;
 // Skip namespace/meta pages like Vorlage:, Kategorie:, Hilfe:, etc.
 if (resolvedTitle.includes(":")) continue;
 if (/\((begriffsklärung|begriffsklarung|disambiguation)\)/i.test(resolvedTitle)) continue;
 const text = typeof data?.extract === "string" ? cleanWikipediaText(data.extract) : undefined;
 const photo = typeof data?.thumbnail?.source === "string" ? data.thumbnail.source : undefined;
 const lat = typeof data?.coordinates?.lat === "number" ? data.coordinates.lat : undefined;
 const lng = typeof data?.coordinates?.lon === "number" ? data.coordinates.lon : undefined;
 if ((text && !isWeakWikipediaText(text)) || photo) return { title: resolvedTitle, text, photo, lat, lng };
 } catch {
 // ignore and try next source
 }
 }
 return null;
}

async function fetchWikipediaIntroByTitle(title: string, locale?: string, langFallback = false): Promise<string | undefined> {
 const q = normalizeDiscoveryQuery(title);
 if (!q) return undefined;
 const endpoints = wikipediaIntroExtractUrls(q, locale, langFallback);
 for (const url of endpoints) {
 try {
 const resp = await fetch(url);
 if (!resp.ok) continue;
 const data = await resp.json();
 const pages = data?.query?.pages;
 if (!pages || typeof pages !== "object") continue;
 const entries = Object.values(pages) as Array<{ extract?: unknown }>;
 const extract = cleanWikipediaText((entries.find((e) => typeof e?.extract === "string")?.extract || "")
 .toString()
 .replace(/\s+/g, " ")
 .trim());
 if (extract && !isWeakWikipediaText(extract)) return extract;
 } catch {
 // ignore and try next source
 }
 }
 return undefined;
}

async function fetchWikipediaOpenSearchTitles(query: string, locale?: string, langFallback = false): Promise<string[]> {
 const q = normalizeDiscoveryQuery(query);
 if (!q) return [];
 const endpoints = wikipediaOpenSearchUrls(q, locale, langFallback);
 const out: string[] = [];
 for (const url of endpoints) {
 try {
 const resp = await fetch(url);
 if (!resp.ok) continue;
 const data = await resp.json();
 const titles = Array.isArray(data?.[1]) ? data[1].map((t: unknown) => String(t || "").trim()) : [];
 for (const title of titles) {
 if (title && !out.includes(title)) out.push(title);
 }
 } catch {
 // ignore and try next source
 }
 }
 return out;
}

function pickBestWikipediaTitle(query: string, titles: string[]): string | undefined {
 if (!titles.length) return undefined;
 const nq = normalizeWikiKey(query);
 if (!nq) return titles[0];
 const qTokens = nq.split(" ").filter(Boolean);
 let bestTitle: string | undefined;
 let bestScore = Number.NEGATIVE_INFINITY;
 for (const title of titles) {
 const nt = normalizeWikiKey(title);
 if (!nt) continue;
 const tTokens = nt.split(" ").filter(Boolean);
 const shared = tTokens.filter((t) => qTokens.includes(t)).length;
 const tokenRatio = qTokens.length ? shared / qTokens.length : 0;
 const contains = nt.includes(nq) ? 1 : 0;
 const starts = nt.startsWith(nq) ? 1 : 0;
 const lenPenalty = Math.abs(nt.length - nq.length);
 const score = (nt === nq ? 200 : 0) + contains * 80 + starts * 20 + tokenRatio * 70 - lenPenalty;
 if (score > bestScore) {
 bestScore = score;
 bestTitle = title;
 }
 }
 return bestTitle ?? titles[0];
}

async function fetchWikipediaTitleByCoords(lat?: number, lng?: number, locale?: string, langFallback = false): Promise<string | undefined> {
 if (typeof lat !== "number" || typeof lng !== "number") return undefined;
 const endpoints = wikipediaGeosearchUrls(lat, lng, locale, langFallback);
 for (const url of endpoints) {
 try {
 const resp = await fetch(url);
 if (!resp.ok) continue;
 const data = await resp.json();
 const title = (data?.query?.geosearch?.[0]?.title || "").toString().trim();
 if (title) return title;
 } catch {
 // ignore and try next source
 }
 }
 return undefined;
}

async function fetchWikipediaDiscoveryInfo(
 name: string,
 lat?: number,
 lng?: number,
 locale?: string
): Promise<{ text?: string; photo?: string }> {
 const candidates = buildDiscoveryQueryCandidates(name);
 if (candidates.length === 0) return {};

 let photo: string | undefined;

 const take = async (query: string, titleHint?: string) => {
 const exact = await fetchWikipediaSummaryByTitle(titleHint || query, locale, false);
 if (exact?.photo && !photo) photo = exact.photo;
 if (!exact) return undefined;
 const intro = await fetchWikipediaIntroByTitle(exact.title || titleHint || query, locale, false);
 const picked = cleanWikipediaText(intro || exact.text || "");
 if (!isWeakWikipediaText(picked)) return picked;
 return undefined;
 };

 for (const query of candidates) {
 const text = await take(query);
 if (text) return { text, photo };
 const titles = await fetchWikipediaOpenSearchTitles(query, locale, false);
 const bestTitle = pickBestWikipediaTitle(query, titles);
 if (bestTitle) {
 const textFromSearch = await take(query, bestTitle);
 if (textFromSearch) return { text: textFromSearch, photo };
 }
 }

 const nearbyTitle = await fetchWikipediaTitleByCoords(lat, lng, locale, false);
 if (nearbyTitle) {
 const text = await take(nearbyTitle, nearbyTitle);
 if (text) return { text, photo };
 }

 if (!photo) {
 for (const query of candidates) {
 const loose = await fetchWikipediaSummaryByTitle(query, locale, true);
 if (loose?.photo) {
 photo = loose.photo;
 break;
 }
 }
 }

 return photo ? { photo } : {};
}

function getHotelDates(
 stop: RouteStop,
 idx: number,
 hotelStops: RouteStop[],
 tripStartDate: string
): { checkIn: string; checkOut: string; nights: number } {
 const nights = Math.max(1, Number(stop.hotelNights) || 2);
 const isBookedAnchor = !!stop.hotelBooked && !!stop.hotelCheckIn;
 let checkIn = isBookedAnchor ? (stop.hotelCheckIn || "") : "";
 if (!checkIn) {
 if (idx === 0) {
 checkIn = tripStartDate || stop.hotelCheckIn || "";
 } else {
 const prev = getHotelDates(hotelStops[idx - 1], idx - 1, hotelStops, tripStartDate);
 checkIn = prev.checkOut || stop.hotelCheckIn || "";
 }
 }
 const checkOut = checkIn ? addDaysISO(checkIn, nights) : "";
 return { checkIn, checkOut, nights };
}

// --- Google Static Maps API ---
async function loadMapImage(
 stops: RouteStop[],
 apiKey: string,
 routeByNames?: { origin: string; destination: string; waypoints: string[] },
 routedSegments?: RoutedSegment[] | null,
 encodedRouteOverride?: string | null,
 markerStops?: RouteStop[],
 hotelLabelByCityKey?: Map<string, string>,
 useTiledOverview?: boolean,
 renderMode: "overview" | "etappe" = "overview",
 billing?: PdfMapsBillingAccumulator
): Promise<string | null> {
 const isValidCoord = (lat?: number, lng?: number) => {
 if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
 // Ignore default/null-island fallback coordinates.
 if (Math.abs(Number(lat)) < 0.0001 && Math.abs(Number(lng)) < 0.0001) return false;
 return true;
 };
 const isHotelMarkerStop = (s: RouteStop) =>
 !!(
 s.isHotel ||
 s.bookingConfirmation ||
 s.bookingHotelName ||
 s.hotelCheckIn ||
 Number(s.hotelNights || 0) > 0
 );
 const valid = stops.filter((s) => isValidCoord(s.lat, s.lng));

 const markerSource = (markerStops && markerStops.length > 0 ? markerStops : valid)
 .filter((s) => isValidCoord(s.lat, s.lng));
 const hotelDotPoints = markerSource
 .filter((s) => isHotelMarkerStop(s))
 .map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) }))
 .filter((p) => isValidCoord(p.lat, p.lng));

 const jsRouteByNames = routeByNames
 ? await loadRouteByNamesViaJsApi(routeByNames.origin, routeByNames.destination, routeByNames.waypoints, billing)
 : null;
 const encodedRouteFromNames = routeByNames
 ? await loadEncodedRoutePathByNames(routeByNames.origin, routeByNames.destination, routeByNames.waypoints, apiKey, billing)
 : null;
 const encodedRouteFromCoords = valid.length >= 2 ? await loadEncodedRoutePath(valid, apiKey, billing) : null;
 const hasJsOverviewPoints = (jsRouteByNames?.overviewPoints?.length || 0) > 1;
 const encodedRoute = encodedRouteOverride || jsRouteByNames?.encodedPolyline || encodedRouteFromCoords || encodedRouteFromNames;
 const namedSegmentData = encodedRoute || hasJsOverviewPoints || valid.length < 2 ? null : await loadEncodedRoutePathSegmentsByNames(valid, apiKey, billing);
 const chunkedSegmentData = encodedRoute || hasJsOverviewPoints || valid.length < 2 ? null : await loadEncodedRoutePathSegmentsChunked(valid, apiKey, billing);
 const segmentData = encodedRoute
 ? null
 : (jsRouteByNames?.segments || chunkedSegmentData || namedSegmentData || routedSegments || await loadEncodedRoutePathSegmentsViaJsApi(valid, billing) || await loadEncodedRoutePathSegments(valid, apiKey, billing));
 const routePoints: Array<{ lat: number; lng: number }> = [];
 const pushPolyline = (encoded: string | null | undefined) => {
 if (!encoded) return;
 const decoded = decodePolyline(encoded);
 if (decoded.length < 2) return;
 const simplified = simplifyPolylinePoints(decoded, 2400);
 if (simplified.length < 2) return;
 if (routePoints.length > 0) {
 const prev = routePoints[routePoints.length - 1];
 const first = simplified[0];
 const samePoint = Math.abs(prev.lat - first.lat) < 0.00001 && Math.abs(prev.lng - first.lng) < 0.00001;
 routePoints.push(...(samePoint ? simplified.slice(1) : simplified));
 return;
 }
 routePoints.push(...simplified);
 };
 // Overview: gespeicherte Gesamt-Polyline aus dem Planer hat Vorrang (volle Reise).
 if (renderMode === "overview" && encodedRouteOverride) {
 pushPolyline(encodedRouteOverride);
 }
 if (routePoints.length < 2 && hasJsOverviewPoints) {
 const jsPoints = simplifyPolylinePoints(jsRouteByNames?.overviewPoints || [], 2400);
 if (jsPoints.length > 1) routePoints.push(...jsPoints);
 }
 if (routePoints.length < 2 && encodedRoute) {
 pushPolyline(encodedRoute);
 } else if (routePoints.length < 2) {
 for (const seg of segmentData || []) pushPolyline(seg.polyline);
 }
 if (routePoints.length < 2) {
 const perLegSegments = await loadEncodedRoutePathSegments(valid, apiKey, billing);
 for (const seg of perLegSegments || []) pushPolyline(seg.polyline);
 }
 if (routePoints.length < 2 && valid.length >= 2) {
 const chunked = await loadEncodedRoutePathSegmentsChunked(valid, apiKey, billing);
 appendSegmentPolylines(routePoints, chunked);
 }
 if (routePoints.length < 2 && valid.length >= 2) {
 const viaJs = await loadEncodedRoutePathSegmentsViaJsApi(valid, billing);
 appendSegmentPolylines(routePoints, viaJs);
 }
 if (routePoints.length < 2 && markerSource.length === 0) return null;
 const markerCoords = markerSource
 .filter((s) => Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng)))
 .map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) }));
 const boundsReference = buildBoundsReferencePoints(valid, markerCoords, routePoints);
 if (renderMode === "etappe" && routePoints.length > 0 && boundsReference.length >= 2) {
 const sanitized = sanitizeRoutePoints(routePoints, boundsReference);
 if (sanitized.length >= 2) {
 routePoints.splice(0, routePoints.length, ...sanitized);
 }
 // Nie auf Luftlinien zwischen Stopps zurückfallen — lieber volle Polyline behalten.
 } else if (routePoints.length < 2 && boundsReference.length >= 2) {
 // Nur für Viewport-Zentrierung, nicht als Route zeichnen.
 }
 // NOTE:
 // For print/PDF stability we use Google Static Maps as primary source.
 // Tiled/OSM rendering remains available in codebase, but is intentionally
 // disabled here because it introduced mismatched/straight-line artifacts.
 const STATIC_MAP_W = 640;
 const STATIC_MAP_H = 500;
 const STATIC_MAP_SCALE = 2;
 const STATIC_MAP_SUPERSAMPLE = renderMode === "overview" ? 2 : 1;
 const MAP_JPEG_QUALITY = renderMode === "overview" ? 0.86 : 0.78;
 const renderW = STATIC_MAP_W * STATIC_MAP_SCALE * STATIC_MAP_SUPERSAMPLE;
 const renderH = STATIC_MAP_H * STATIC_MAP_SCALE * STATIC_MAP_SUPERSAMPLE;
 const viewportPoints =
 routePoints.length >= 2
 ? routePoints
 : boundsReference.length >= 2
 ? boundsReference
 : markerSource.map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) }));
 const viewport = computeStaticMapViewport(
 viewportPoints,
 renderW,
 renderH,
 STATIC_MAP_SCALE,
 renderMode === "overview"
 );
 if (!viewport) return null;
 const centerWorld = latLngToWorld(viewport.centerLat, viewport.centerLng);
 const worldScale = (2 ** viewport.zoom) * STATIC_MAP_SCALE;
 const tilePixelW = STATIC_MAP_W * STATIC_MAP_SCALE;
 const tilePixelH = STATIC_MAP_H * STATIC_MAP_SCALE;
 const tileDefs = STATIC_MAP_SUPERSAMPLE > 1
 ? [
 { ox: -tilePixelW / 2, oy: -tilePixelH / 2, dx: 0, dy: 0 },
 { ox: tilePixelW / 2, oy: -tilePixelH / 2, dx: tilePixelW, dy: 0 },
 { ox: -tilePixelW / 2, oy: tilePixelH / 2, dx: 0, dy: tilePixelH },
 { ox: tilePixelW / 2, oy: tilePixelH / 2, dx: tilePixelW, dy: tilePixelH },
 ]
 : [{ ox: 0, oy: 0, dx: 0, dy: 0 }];
 const canvas = document.createElement("canvas");
 canvas.width = tilePixelW * STATIC_MAP_SUPERSAMPLE;
 canvas.height = tilePixelH * STATIC_MAP_SUPERSAMPLE;
 const ctx = canvas.getContext("2d");
 if (!ctx) return null;
 let loadedTiles = 0;
 for (const tile of tileDefs) {
 const tileWorld = {
 x: centerWorld.x + tile.ox / worldScale,
 y: centerWorld.y + tile.oy / worldScale,
 };
 const tileCenter = worldToLatLng(tileWorld.x, tileWorld.y);
 const url = `https://maps.googleapis.com/maps/api/staticmap?size=${STATIC_MAP_W}x${STATIC_MAP_H}&scale=${STATIC_MAP_SCALE}&maptype=roadmap&center=${encodeURIComponent(`${tileCenter.lat},${tileCenter.lng}`)}&zoom=${viewport.zoom}&key=${apiKey}`;
 const tileDataUrl = await fetchStaticMapDataUrl(url, billing);
 if (!tileDataUrl) continue;
 try {
 const tileImage = await loadPdfMapImageFromSrc(tileDataUrl);
 if (!tileImage) continue;
 ctx.drawImage(tileImage, tile.dx, tile.dy, tilePixelW, tilePixelH);
 loadedTiles += 1;
 } catch {
 // ignore this tile
 }
 }
 if (loadedTiles === 0) return null;
 if (routePoints.length < 2) return canvas.toDataURL("image/jpeg", MAP_JPEG_QUALITY);
 try {
 const toPx = (p: { lat: number; lng: number }) => {
 const w = latLngToWorld(p.lat, p.lng);
 return {
 x: (w.x - centerWorld.x) * worldScale + canvas.width / 2,
 y: (w.y - centerWorld.y) * worldScale + canvas.height / 2,
 };
 };
 ctx.strokeStyle = "#ff0000";
 ctx.lineWidth = 6;
 ctx.lineJoin = "round";
 ctx.lineCap = "round";
 ctx.beginPath();
 for (let i = 0; i < routePoints.length; i++) {
 const pos = toPx(routePoints[i]);
 if (i === 0) ctx.moveTo(pos.x, pos.y);
 else ctx.lineTo(pos.x, pos.y);
 }
 ctx.stroke();
 if (hotelDotPoints.length > 0) {
 const groupSizes = new Map<string, number>();
 const groupSeen = new Map<string, number>();
 for (const p of hotelDotPoints) {
 const key = `${p.lat.toFixed(5)}:${p.lng.toFixed(5)}`;
 groupSizes.set(key, (groupSizes.get(key) || 0) + 1);
 }
 ctx.fillStyle = "#2563eb";
 for (const p of hotelDotPoints) {
 const key = `${p.lat.toFixed(5)}:${p.lng.toFixed(5)}`;
 const total = groupSizes.get(key) || 1;
 const used = groupSeen.get(key) || 0;
 groupSeen.set(key, used + 1);
 const pos = toPx(p);
 const jitterRadius = total > 1 ? 8 : 0;
 const angle = total > 1 ? (Math.PI * 2 * used) / total : 0;
 const dx = Math.cos(angle) * jitterRadius;
 const dy = Math.sin(angle) * jitterRadius;
 ctx.beginPath();
 // Round overnights-only points — radius matches legend dot after PDF scale-down.
 ctx.arc(pos.x + dx, pos.y + dy, MAP_HOTEL_DOT_CANVAS_R, 0, Math.PI * 2);
 ctx.fill();
 }
 }
 return canvas.toDataURL("image/jpeg", MAP_JPEG_QUALITY);
 } catch {
 return canvas.toDataURL("image/jpeg", MAP_JPEG_QUALITY);
 }
}

function latLngToWorld(lat: number, lng: number): { x: number; y: number } {
 const siny = Math.min(Math.max(Math.sin((lat * Math.PI) / 180), -0.9999), 0.9999);
 return {
 x: 256 * (0.5 + lng / 360),
 y: 256 * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)),
 };
}

function worldToLatLng(x: number, y: number): { lat: number; lng: number } {
 const lng = (x / 256 - 0.5) * 360;
 const n = Math.PI - (2 * Math.PI * y) / 256;
 const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
 return { lat, lng };
}

function computeStaticMapViewport(
 points: Array<{ lat: number; lng: number }>,
 widthPx: number,
 heightPx: number,
 worldPixelScale = 1,
 tight = false
): { centerLat: number; centerLng: number; zoom: number } | null {
 if (points.length === 0) return null;
 let minX = Infinity;
 let maxX = -Infinity;
 let minY = Infinity;
 let maxY = -Infinity;
 for (const p of points) {
 const w = latLngToWorld(p.lat, p.lng);
 minX = Math.min(minX, w.x);
 maxX = Math.max(maxX, w.x);
 minY = Math.min(minY, w.y);
 maxY = Math.max(maxY, w.y);
 }
 const centerWorldX = (minX + maxX) / 2;
 const centerWorldY = (minY + maxY) / 2;
 const spanX = Math.max(0.0001, maxX - minX);
 const spanY = Math.max(0.0001, maxY - minY);
 const minMarginPt = 72 / 2.54; // 1 cm in PDF points
 const mapAspect = widthPx / Math.max(1, heightPx);
 const drawWPt = PAGE_W;
 const drawHPt = Math.min(PAGE_H, drawWPt / Math.max(0.1, mapAspect));
 const minMarginRatioX = minMarginPt / Math.max(1, drawWPt);
 const minMarginRatioY = minMarginPt / Math.max(1, drawHPt);
 const padRatio = tight ? 0.02 : 0.05;
 const fitMarginRatio = tight ? 0.04 : 0.08;
 const padX = Math.max(widthPx * padRatio, widthPx * minMarginRatioX);
 const padY = Math.max(heightPx * padRatio, heightPx * minMarginRatioY);
 const usableW = Math.max(64, widthPx - padX * 2);
 const usableH = Math.max(64, heightPx - padY * 2);
 const zoomX = Math.log2(usableW / Math.max(0.0001, spanX * worldPixelScale));
 const zoomY = Math.log2(usableH / Math.max(0.0001, spanY * worldPixelScale));
 const spanDeg = Math.max(spanX * 360 / 256, spanY * 360 / 256);
 const isLongRoute = spanDeg > (tight ? 2.4 : 1.2);
 const maxZoom = tight ? (isLongRoute ? 10 : 12) : isLongRoute ? 8 : 10;
 const baseZoom = Math.max(3, Math.min(maxZoom, Math.floor(Math.min(zoomX, zoomY))));
 const center = worldToLatLng(centerWorldX, centerWorldY);
 const centerWorld = latLngToWorld(center.lat, center.lng);
 const fitsAll = (zoom: number): boolean => {
 const scale = (2 ** zoom) * worldPixelScale;
 const marginX = Math.max(widthPx * fitMarginRatio, widthPx * minMarginRatioX) + (tight ? 4 : 8);
 const marginY = Math.max(heightPx * fitMarginRatio, heightPx * minMarginRatioY) + (tight ? 4 : 8);
 for (const p of points) {
 const w = latLngToWorld(p.lat, p.lng);
 const x = (w.x - centerWorld.x) * scale + widthPx / 2;
 const y = (w.y - centerWorld.y) * scale + heightPx / 2;
 if (x < marginX || x > widthPx - marginX || y < marginY || y > heightPx - marginY) {
 return false;
 }
 }
 return true;
 };
 let zoom = isLongRoute ? baseZoom : Math.min(maxZoom, baseZoom + 1);
 while (zoom > 3 && !fitsAll(zoom)) zoom -= 1;
 return { centerLat: center.lat, centerLng: center.lng, zoom };
}

function buildBoundsReferencePoints(
 stops: RouteStop[],
 markerCoords: Array<{ lat: number; lng: number }>,
 routePoints: Array<{ lat: number; lng: number }>
): Array<{ lat: number; lng: number }> {
 const out: Array<{ lat: number; lng: number }> = [];
 const seen = new Set<string>();
 const push = (p: { lat: number; lng: number }) => {
 if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return;
 const key = `${p.lat.toFixed(4)}:${p.lng.toFixed(4)}`;
 if (seen.has(key)) return;
 seen.add(key);
 out.push(p);
 };
 for (const s of stops) {
 if (Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng))) {
 push({ lat: Number(s.lat), lng: Number(s.lng) });
 }
 }
 for (const p of markerCoords) push(p);
 if (routePoints.length > 0) {
 const step = Math.max(1, Math.floor(routePoints.length / 48));
 for (let i = 0; i < routePoints.length; i += step) push(routePoints[i]);
 push(routePoints[routePoints.length - 1]);
 }
 return out;
}

function sanitizeRoutePoints(
 routePoints: Array<{ lat: number; lng: number }>,
 referencePoints: Array<{ lat: number; lng: number }>
): Array<{ lat: number; lng: number }> {
 if (routePoints.length < 2 || referencePoints.length < 2) return routePoints;
 let minLat = Infinity;
 let maxLat = -Infinity;
 let minLng = Infinity;
 let maxLng = -Infinity;
 for (const p of referencePoints) {
 minLat = Math.min(minLat, p.lat);
 maxLat = Math.max(maxLat, p.lat);
 minLng = Math.min(minLng, p.lng);
 maxLng = Math.max(maxLng, p.lng);
 }
 const latSpan = Math.max(0.05, maxLat - minLat);
 const lngSpan = Math.max(0.05, maxLng - minLng);
 const padLat = Math.max(0.25, latSpan * 0.35);
 const padLng = Math.max(0.25, lngSpan * 0.35);
 const loLat = minLat - padLat;
 const hiLat = maxLat + padLat;
 const loLng = minLng - padLng;
 const hiLng = maxLng + padLng;
 const filtered = routePoints.filter((p) => p.lat >= loLat && p.lat <= hiLat && p.lng >= loLng && p.lng <= hiLng);
 return filtered.length >= 2 ? filtered : routePoints;
}

function appendSegmentPolylines(
 target: Array<{ lat: number; lng: number }>,
 segments: RoutedSegment[] | null | undefined
): void {
 if (!segments?.length) return;
 for (const seg of segments) {
 if (!seg.polyline) continue;
 const decoded = decodePolyline(seg.polyline);
 if (decoded.length < 2) continue;
 const simplified = simplifyPolylinePoints(decoded, 2400);
 if (simplified.length < 2) continue;
 if (target.length > 0) {
 const prev = target[target.length - 1];
 const first = simplified[0];
 const samePoint =
 Math.abs(prev.lat - first.lat) < 0.00001 && Math.abs(prev.lng - first.lng) < 0.00001;
 target.push(...(samePoint ? simplified.slice(1) : simplified));
 } else {
 target.push(...simplified);
 }
 }
}

async function loadEtappeRoutedSegments(
 etappeStops: RouteStop[],
 apiKey: string,
 billing?: PdfMapsBillingAccumulator
): Promise<RoutedSegment[] | null> {
 if (etappeStops.length < 2) return null;
 const withCoords = etappeStops.filter(
 (s) => Number.isFinite(s.lat) && Number.isFinite(s.lng)
 );
 if (withCoords.length >= 2) {
 const viaJs = await loadEncodedRoutePathSegmentsViaJsApi(withCoords, billing);
 if (viaJs?.length) return viaJs;
 const viaApi = await loadEncodedRoutePathSegments(withCoords, apiKey, billing);
 if (viaApi?.length) return viaApi;
 }
 return loadEncodedRoutePathSegmentsByNames(etappeStops, apiKey, billing);
}

async function fetchStaticMapDataUrl(url: string, billing?: PdfMapsBillingAccumulator): Promise<string | null> {
 const ctrl = new AbortController();
 const tid = setTimeout(() => ctrl.abort(), PDF_FETCH_TIMEOUT_MS);
 try {
 const resp = await fetch(url, { signal: ctrl.signal });
 if (!resp.ok) return null;
 const blob = await resp.blob();
 if (billing) billing.staticMapRequests += 1;
 return await blobToDataURL(blob);
 } catch {
 return null;
 } finally {
 clearTimeout(tid);
 }
}

async function composeStaticMapLayers(dataUrls: string[]): Promise<string | null> {
 if (dataUrls.length === 0) return null;
 if (dataUrls.length === 1) return dataUrls[0];
 try {
 const images = await Promise.all(dataUrls.map((src) => loadPdfMapImageFromSrc(src)));
 const ok = images.filter((img): img is HTMLImageElement => img != null);
 if (ok.length !== images.length) return dataUrls[0] || null;
 const first = ok[0];
 const canvas = document.createElement("canvas");
 canvas.width = first.width;
 canvas.height = first.height;
 const ctx = canvas.getContext("2d");
 if (!ctx) return null;
 for (const img of ok) {
 ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
 }
 return canvas.toDataURL("image/jpeg", 0.86);
 } catch {
 return dataUrls[0] || null;
 }
}

async function loadTiledOverviewMap(
 validStops: RouteStop[],
 apiKey: string,
 markersQuery: string,
 routeParam: string,
 billing?: PdfMapsBillingAccumulator
): Promise<string | null> {
 if (validStops.length < 2) return null;
 const tileSize = 512;
 const scale = 2;
 const tilePx = tileSize * scale;
 const cols = 2;
 const rows = 2;
 const outW = cols * tilePx;
 const outH = rows * tilePx;

 let minX = Infinity;
 let maxX = -Infinity;
 let minY = Infinity;
 let maxY = -Infinity;
 for (const s of validStops) {
 const w = latLngToWorld(Number(s.lat), Number(s.lng));
 minX = Math.min(minX, w.x);
 maxX = Math.max(maxX, w.x);
 minY = Math.min(minY, w.y);
 maxY = Math.max(maxY, w.y);
 }
 const dx0 = Math.max(0.0001, maxX - minX);
 const dy0 = Math.max(0.0001, maxY - minY);
 const zoomX = Math.log2((outW * 0.78) / dx0);
 const zoomY = Math.log2((outH * 0.78) / dy0);
 const zoom = Math.max(3, Math.min(11, Math.floor(Math.min(zoomX, zoomY))));
 const centerWorld = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
 const zScale = 2 ** zoom;

 const canvas = document.createElement("canvas");
 canvas.width = outW;
 canvas.height = outH;
 const ctx = canvas.getContext("2d");
 if (!ctx) return null;

 let loadedTiles = 0;
 for (let row = 0; row < rows; row++) {
 for (let col = 0; col < cols; col++) {
 const offsetX = (col - (cols - 1) / 2) * tilePx;
 const offsetY = (row - (rows - 1) / 2) * tilePx;
 const worldX = centerWorld.x + offsetX / zScale;
 const worldY = centerWorld.y + offsetY / zScale;
 const { lat, lng } = worldToLatLng(worldX, worldY);
 const centerParam = `center=${encodeURIComponent(`${lat},${lng}`)}&zoom=${zoom}`;
 const routePart = routeParam ? `&${routeParam}` : "";
 const markerPart = markersQuery ? `&${markersQuery}` : "";
 const url = `https://maps.googleapis.com/maps/api/staticmap?size=${tileSize}x${tileSize}&scale=${scale}&maptype=roadmap&${centerParam}${markerPart}${routePart}&key=${apiKey}`;
 const tileDataUrl = await fetchStaticMapDataUrl(url, billing);
 if (!tileDataUrl) continue;
 const img = await loadPdfMapImageFromSrc(tileDataUrl);
 if (!img) continue;
 ctx.drawImage(img, col * tilePx, row * tilePx, tilePx, tilePx);
 loadedTiles += 1;
 }
 }
 if (loadedTiles !== rows * cols) return null;
 return canvas.toDataURL("image/jpeg", 0.86);
}

async function loadOsmOverviewMap(
 stops: RouteStop[],
 hotelStops: RouteStop[],
 encodedRoute?: string | null,
 segmentData?: RoutedSegment[] | null
): Promise<string | null> {
 const validStops = stops.filter((s) => s.lat != null && s.lng != null);
 if (validStops.length < 2) return null;

 let routePoints: Array<{ lat: number; lng: number }> = [];
 if (encodedRoute) {
 routePoints = decodePolyline(encodedRoute);
 } else if (segmentData && segmentData.length > 0) {
 for (const seg of segmentData) {
 if (!seg.polyline) continue;
 routePoints.push(...decodePolyline(seg.polyline));
 }
 }
 if (routePoints.length < 2) {
 routePoints = validStops.map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) }));
 }

 const pointsForBounds = routePoints.length > 1
 ? routePoints
 : validStops.map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) }));
 let minX = Infinity;
 let maxX = -Infinity;
 let minY = Infinity;
 let maxY = -Infinity;
 for (const p of pointsForBounds) {
 const w = latLngToWorld(p.lat, p.lng);
 minX = Math.min(minX, w.x);
 maxX = Math.max(maxX, w.x);
 minY = Math.min(minY, w.y);
 maxY = Math.max(maxY, w.y);
 }
 const outW = 2048;
 const outH = 1536;
 const dx0 = Math.max(0.0001, maxX - minX);
 const dy0 = Math.max(0.0001, maxY - minY);
 const zoomX = Math.log2((outW * 0.85) / dx0);
 const zoomY = Math.log2((outH * 0.85) / dy0);
 const zoom = Math.max(3, Math.min(10, Math.floor(Math.min(zoomX, zoomY))));
 const zScale = 2 ** zoom;
 const centerWorld = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
 const centerGlobalPx = { x: centerWorld.x * zScale, y: centerWorld.y * zScale };
 const left = centerGlobalPx.x - outW / 2;
 const top = centerGlobalPx.y - outH / 2;
 const right = left + outW;
 const bottom = top + outH;

 const canvas = document.createElement("canvas");
 canvas.width = outW;
 canvas.height = outH;
 const ctx = canvas.getContext("2d");
 if (!ctx) return null;

 const tileSize = 256;
 const minTileX = Math.floor(left / tileSize);
 const maxTileX = Math.floor((right - 1) / tileSize);
 const minTileY = Math.floor(top / tileSize);
 const maxTileY = Math.floor((bottom - 1) / tileSize);
 const maxTileIndex = 2 ** zoom;
 const loadTile = async (x: number, y: number): Promise<HTMLImageElement | null> => {
 if (y < 0 || y >= maxTileIndex) return null;
 const wrapX = ((x % maxTileIndex) + maxTileIndex) % maxTileIndex;
 const tileUrl = `https://tile.openstreetmap.org/${zoom}/${wrapX}/${y}.png`;
 const ctrl = new AbortController();
 const tid = setTimeout(() => ctrl.abort(), PDF_FETCH_TIMEOUT_MS);
 try {
 const proxied = await fetch(`/api/image-proxy?url=${encodeURIComponent(tileUrl)}`, {
 signal: ctrl.signal,
 });
 if (!proxied.ok) return null;
 const blob = await proxied.blob();
 const dataUrl = await blobToDataURL(blob);
 return await loadPdfMapImageFromSrc(dataUrl);
 } catch {
 return null;
 } finally {
 clearTimeout(tid);
 }
 };

 for (let ty = minTileY; ty <= maxTileY; ty++) {
 for (let tx = minTileX; tx <= maxTileX; tx++) {
 const img = await loadTile(tx, ty);
 if (!img) continue;
 const dx = tx * tileSize - left;
 const dy = ty * tileSize - top;
 ctx.drawImage(img, dx, dy, tileSize, tileSize);
 }
 }

 // Draw route on top.
 if (routePoints.length > 1) {
 ctx.strokeStyle = "#ff0000";
 ctx.lineWidth = 6;
 ctx.beginPath();
 for (let i = 0; i < routePoints.length; i++) {
 const p = routePoints[i];
 const w = latLngToWorld(p.lat, p.lng);
 const x = w.x * zScale - left;
 const y = w.y * zScale - top;
 if (i === 0) ctx.moveTo(x, y);
 else ctx.lineTo(x, y);
 }
 ctx.stroke();
 }

 // Draw hotel dots.
 ctx.fillStyle = "#f59e0b";
 for (const s of hotelStops) {
 if (s.lat == null || s.lng == null) continue;
 const w = latLngToWorld(Number(s.lat), Number(s.lng));
 const x = w.x * zScale - left;
 const y = w.y * zScale - top;
 ctx.beginPath();
 ctx.arc(x, y, MAP_HOTEL_DOT_CANVAS_R, 0, Math.PI * 2);
 ctx.fill();
 }

 return canvas.toDataURL("image/jpeg", 0.86);
}

const OVERVIEW_MAP_CACHE_PREFIX = "sniffertrek_pdf_overview_map_v17:";
const overviewMapMemoryCache = new Map<string, string>();

function isHotelLikeStop(s: RouteStop): boolean {
 return !!(
 s.isHotel ||
 s.bookingConfirmation ||
 s.bookingHotelName ||
 s.hotelCheckIn ||
 Number(s.hotelNights || 0) > 0
 );
}

function hashString(input: string): string {
 let hash = 2166136261;
 for (let i = 0; i < input.length; i++) {
 hash ^= input.charCodeAt(i);
 hash = Math.imul(hash, 16777619);
 }
 return (hash >>> 0).toString(36);
}

function buildOverviewHotelLabels(hotelStops: RouteStop[]): { legend: string[]; labelByCityKey: Map<string, string> } {
 const legend: string[] = [];
 const labelByCityKey = new Map<string, string>();
 for (const s of hotelStops) {
 const city = extractCity(s.name).trim();
 const cityKey = normalizePlaceKey(city);
 if (!city || !cityKey || labelByCityKey.has(cityKey)) continue;
 labelByCityKey.set(cityKey, city);
 legend.push(city);
 }
 return { legend, labelByCityKey };
}

function buildOverviewMarkerStops(mainStops: RouteStop[]): RouteStop[] {
 const seen = new Set<string>();
 return mainStops.filter((s) => {
 if (!s.name.trim()) return false;
 if (!(s.type === "start" || s.type === "end" || s.isHotel)) return false;
 const key = `${normalizePlaceKey(extractCity(s.name))}:${s.lat ?? ""}:${s.lng ?? ""}`;
 if (seen.has(key)) return false;
 seen.add(key);
 return true;
 });
}

function buildOverviewHotelMarkerStops(mainStops: RouteStop[], allHotelStops: RouteStop[]): RouteStop[] {
 const hotelCityKeys = new Set(
 allHotelStops
 .map((s) => normalizePlaceKey(extractCity(s.name)))
 .filter(Boolean)
 );
 const out: RouteStop[] = [];
 const seen = new Set<string>();
 const pushUnique = (s: RouteStop) => {
 if (s.lat == null || s.lng == null) return;
 const key = `${normalizePlaceKey(extractCity(s.name))}:${Number(s.lat).toFixed(5)}:${Number(s.lng).toFixed(5)}`;
 if (seen.has(key)) return;
 seen.add(key);
 out.push(s);
 };

 // Prefer on-route positions for map alignment.
 for (const s of mainStops) {
 const cityKey = normalizePlaceKey(extractCity(s.name));
 if (!cityKey) continue;
 if (isHotelLikeStop(s) || hotelCityKeys.has(cityKey)) {
 pushUnique({ ...s, isHotel: true });
 }
 }
 // Add any remaining hotel stops that are not in route list.
 for (const s of allHotelStops) {
 if (!isHotelLikeStop(s)) continue;
 pushUnique({ ...s, isHotel: true });
 }
 return out;
}

function countNamedStops(stops: RouteStop[]): number {
 return stops.filter((s) => s.name.trim()).length;
}

function buildOverviewRouteStops(trip: Trip): RouteStop[] {
 const mainStops = trip.stops || [];
 const moduleStops = trip.routes?.route?.stops || [];
 const routeStops =
 countNamedStops(mainStops) >= countNamedStops(moduleStops) && mainStops.length > 0
 ? mainStops
 : moduleStops.length > 0
 ? moduleStops
 : mainStops;
 const routeStopsNamed = filterStopsForFerryRouting(routeStops.filter((s) => s.name.trim() && isDrivingRouteStop(s)));
 const viaPoints = filterViaPointsForFerryRouting(
 (trip.routes?.route?.viaPoints || []).filter(
 (vp) => Number.isFinite(vp.lat) && Number.isFinite(vp.lng)
 ),
 routeStopsNamed
 );
 if (viaPoints.length === 0) return routeStopsNamed;

 const viaByStop = new Map<string, Array<{ id: string; lat: number; lng: number }>>();
 for (let i = 0; i < viaPoints.length; i++) {
 const vp = viaPoints[i];
 const key = vp.afterStopId || routeStopsNamed[0]?.id || "start";
 const arr = viaByStop.get(key) || [];
 arr.push({ id: vp.id || `via_${i}`, lat: vp.lat, lng: vp.lng });
 viaByStop.set(key, arr);
 }

 const merged: RouteStop[] = [];
 for (const stop of routeStopsNamed) {
 merged.push(stop);
 const list = viaByStop.get(stop.id) || [];
 for (const vp of list) {
 merged.push({
 id: `via_${vp.id}`,
 name: "",
 type: "stop",
 lat: vp.lat,
 lng: vp.lng,
 });
 }
 }
 return merged;
}

function getPreferredOverviewPolyline(trip: Trip): string | undefined {
 return (
 trip.routes?.route?.overviewPolyline ||
 trip.routes?.car?.overviewPolyline ||
 trip.routes?.train?.overviewPolyline ||
 trip.routes?.flights?.overviewPolyline
 );
}

function buildOverviewRouteByNames(mainStops: RouteStop[]): { origin: string; destination: string; waypoints: string[] } | null {
 const named = mainStops.map((s) => s.name.trim()).filter(Boolean);
 if (named.length < 2) return null;
 return {
 origin: named[0],
 destination: named[named.length - 1],
 waypoints: named.slice(1, -1).slice(0, 23),
 };
}

function buildOverviewMapCacheKey(stops: RouteStop[], legend: string[], routeSeed?: string): string {
 const payload = JSON.stringify({
 stops: stops.map((s) => ({
 name: extractCity(s.name),
 lat: s.lat ?? null,
 lng: s.lng ?? null,
 type: s.type,
 isHotel: !!s.isHotel,
 })),
 legend,
 routeSeed: routeSeed || "",
 });
 return `${OVERVIEW_MAP_CACHE_PREFIX}${hashString(payload)}`;
}

function readOverviewMapCache(cacheKey: string): string | null {
 const mem = overviewMapMemoryCache.get(cacheKey);
 if (mem) return mem;
 if (typeof window === "undefined") return null;
 try {
 const raw = localStorage.getItem(cacheKey);
 if (!raw) return null;
 overviewMapMemoryCache.set(cacheKey, raw);
 return raw;
 } catch {
 return null;
 }
}

function writeOverviewMapCache(cacheKey: string, dataUrl: string): void {
 overviewMapMemoryCache.set(cacheKey, dataUrl);
 if (typeof window === "undefined") return;
 // Avoid exhausting localStorage quota with very large map payloads.
 if (dataUrl.length > 2_000_000) return;
 try {
 localStorage.setItem(cacheKey, dataUrl);
 } catch {
 // ignore quota errors
 }
}

async function fetchDirectionsData(
 args: {
 origin: string;
 destination: string;
 waypoints?: string[];
 apiKey: string;
 alternatives?: boolean;
 },
 billing?: PdfMapsBillingAccumulator
): Promise<any | null> {
 const post = async (waypoints: string[], alternatives: boolean) => {
 const ctrl = new AbortController();
 const tid = setTimeout(() => ctrl.abort(), PDF_FETCH_TIMEOUT_MS);
 try {
 const resp = await fetch("/api/directions", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 signal: ctrl.signal,
 body: JSON.stringify({
 origin: args.origin,
 destination: args.destination,
 waypoints,
 mode: "driving",
 apiKey: args.apiKey,
 alternatives: alternatives || undefined,
 }),
 });
 if (!resp.ok) return null;
 const data = await resp.json();
 if (billing) billing.directionsRequests += 1;
 return preferSaneRestDirections(data, decodePolyline);
 } catch {
 return null;
 } finally {
 clearTimeout(tid);
 }
 };

 const baseWaypoints = args.waypoints || [];
 let data = await post(baseWaypoints, !!args.alternatives);
 if (!data) return null;
 if (!restDirectionsUsesBogusIslandTransfer(data, decodePolyline)) return data;

 data = (await post(baseWaypoints, true)) || data;
 if (!restDirectionsUsesBogusIslandTransfer(data, decodePolyline)) return data;

 for (const via of extraFerryViaFromRestResult(data, decodePolyline)) {
 const retry = await post([...baseWaypoints, `via:${via.lat},${via.lng}`], true);
 if (retry && !restDirectionsUsesBogusIslandTransfer(retry, decodePolyline)) return retry;
 }
 return data;
}

async function loadEncodedRoutePathSegments(
 stops: RouteStop[],
 apiKey: string,
 billing?: PdfMapsBillingAccumulator
): Promise<RoutedSegment[] | null> {
 if (stops.length < 2) return null;
 const segments: RoutedSegment[] = [];
 const maxSegments = Math.min(stops.length - 1, 40);
 for (let i = 0; i < maxSegments; i++) {
 const fromStop = stops[i];
 const toStop = stops[i + 1];
 if (fromStop.lat == null || fromStop.lng == null || toStop.lat == null || toStop.lng == null) continue;
 const from = `${fromStop.lat},${fromStop.lng}`;
 const to = `${toStop.lat},${toStop.lng}`;
 const fromKey = normalizePlaceKey(extractCity(fromStop.name));
 const toKey = normalizePlaceKey(extractCity(toStop.name));
 try {
 const data = await fetchDirectionsData(
 {
 origin: from,
 destination: to,
 apiKey,
 },
 billing
 );
 if (!data) continue;
 const points = data?.routes?.[0]?.overview_polyline?.points;
 if (typeof points === "string" && points.length > 0) {
 const meters = Number(data?.routes?.[0]?.legs?.[0]?.distance?.value);
 const seconds = Number(data?.routes?.[0]?.legs?.[0]?.duration?.value);
 segments.push({
 fromKey,
 toKey,
 polyline: points,
 distanceMeters: Number.isFinite(meters) ? meters : undefined,
 durationSeconds: Number.isFinite(seconds) ? seconds : undefined,
 });
 }
 } catch {
 // skip segment if routing fails
 }
 }
 return segments.length > 0 ? segments : null;
}

async function loadEncodedRoutePathSegmentsViaJsApi(
 stops: RouteStop[],
 billing?: PdfMapsBillingAccumulator
): Promise<RoutedSegment[] | null> {
 if (stops.length < 2) return null;
 const w = window as any;
 const g = w.google;
 if (!g?.maps?.DirectionsService || !g.maps.TravelMode) return null;
 const service = new g.maps.DirectionsService();
 const segments: RoutedSegment[] = [];
 const maxSegments = Math.min(stops.length - 1, 80);
 for (let i = 0; i < maxSegments; i++) {
 const fromStop = stops[i];
 const toStop = stops[i + 1];
 if (fromStop.lat == null || fromStop.lng == null || toStop.lat == null || toStop.lng == null) continue;
 const from = `${fromStop.lat},${fromStop.lng}`;
 const to = `${toStop.lat},${toStop.lng}`;
 const fromKey = normalizePlaceKey(extractCity(fromStop.name));
 const toKey = normalizePlaceKey(extractCity(toStop.name));
 try {
 const res = await raceWithTimeout(
 routeDrivingWithFerrySanity(
 service,
 from,
 to,
 [],
 g.maps.TravelMode.DRIVING,
 false
 ),
 PDF_DIRECTIONS_TIMEOUT_MS
 );
 if (!res) continue;
 if (billing) billing.directionsRequests += 1;
 const poly = res?.routes?.[0]?.overview_polyline as unknown;
 const points = typeof poly === "string" ? poly : (poly as { points?: string } | undefined)?.points;
 if (typeof points === "string" && points.length > 0) {
 const meters = Number(res?.routes?.[0]?.legs?.[0]?.distance?.value);
 const seconds = Number(res?.routes?.[0]?.legs?.[0]?.duration?.value);
 segments.push({
 fromKey,
 toKey,
 polyline: points,
 distanceMeters: Number.isFinite(meters) ? meters : undefined,
 durationSeconds: Number.isFinite(seconds) ? seconds : undefined,
 });
 }
 } catch {
 // skip segment if routing fails
 }
 }
 return segments.length > 0 ? segments : null;
}

async function loadEncodedRoutePathSegmentsByNames(
 stops: RouteStop[],
 apiKey: string,
 billing?: PdfMapsBillingAccumulator
): Promise<RoutedSegment[] | null> {
 const named = stops.filter((s) => s.name.trim());
 if (named.length < 2) return null;
 const segments: RoutedSegment[] = [];
 const maxSegments = Math.min(named.length - 1, 80);
 for (let i = 0; i < maxSegments; i++) {
 const fromStop = named[i];
 const toStop = named[i + 1];
 try {
 const points = await loadEncodedRoutePathByNames(fromStop.name, toStop.name, [], apiKey, billing);
 if (!points) continue;
 segments.push({
 fromKey: normalizePlaceKey(extractCity(fromStop.name)),
 toKey: normalizePlaceKey(extractCity(toStop.name)),
 polyline: points,
 });
 } catch {
 // skip this segment
 }
 }
 return segments.length > 0 ? segments : null;
}

async function loadEncodedRoutePathSegmentsChunked(
 stops: RouteStop[],
 apiKey: string,
 billing?: PdfMapsBillingAccumulator
): Promise<RoutedSegment[] | null> {
 const valid = stops.filter((s) => s.lat != null && s.lng != null);
 if (valid.length < 2) return null;
 const segments: RoutedSegment[] = [];
 const maxPointsPerRequest = 25; // origin + destination + 23 waypoints
 let start = 0;
 while (start < valid.length - 1) {
 const end = Math.min(valid.length - 1, start + maxPointsPerRequest - 1);
 const chunk = valid.slice(start, end + 1);
 const origin = `${chunk[0].lat},${chunk[0].lng}`;
 const destination = `${chunk[chunk.length - 1].lat},${chunk[chunk.length - 1].lng}`;
 const waypoints = chunk.slice(1, -1).map((s) => `${s.lat},${s.lng}`);
 try {
 const points = await loadEncodedRoutePathByNames(origin, destination, waypoints, apiKey, billing);
 if (points) {
 segments.push({
 fromKey: normalizePlaceKey(extractCity(chunk[0].name)),
 toKey: normalizePlaceKey(extractCity(chunk[chunk.length - 1].name)),
 polyline: points,
 });
 }
 } catch {
 // ignore and continue with next chunk
 }
 if (end >= valid.length - 1) break;
 start = end;
 }
 return segments.length > 0 ? segments : null;
}

async function loadEncodedRoutePathByNames(
 origin: string,
 destination: string,
 waypoints: string[],
 apiKey: string,
 billing?: PdfMapsBillingAccumulator
): Promise<string | null> {
 if (!origin.trim() || !destination.trim()) return null;
 try {
 const data = await fetchDirectionsData(
 {
 origin,
 destination,
 waypoints: filterFerryWaypointNames(origin, destination, waypoints.map((w) => w.trim()).filter(Boolean)),
 apiKey,
 },
 billing
 );
 if (!data) return null;
 const points = data?.routes?.[0]?.overview_polyline?.points;
 return typeof points === "string" && points.length > 0 ? points : null;
 } catch {
 return null;
 }
}

async function loadEncodedRoutePath(
 stops: RouteStop[],
 apiKey: string,
 billing?: PdfMapsBillingAccumulator
): Promise<string | null> {
 const valid = stops.filter((s) => s.lat != null && s.lng != null);
 if (valid.length < 2) return null;
 const origin = `${valid[0].lat},${valid[0].lng}`;
 const destination = `${valid[valid.length - 1].lat},${valid[valid.length - 1].lng}`;
 const waypoints = valid
 .slice(1, -1)
 .slice(0, 23)
 .map((s) => `${s.lat},${s.lng}`)
 .join("|");
 try {
 const data = await fetchDirectionsData(
 {
 origin,
 destination,
 waypoints: waypoints ? waypoints.split("|") : [],
 apiKey,
 },
 billing
 );
 if (!data) return null;
 const points = data?.routes?.[0]?.overview_polyline?.points;
 return typeof points === "string" && points.length > 0 ? points : null;
 } catch {
 return null;
 }
}

function blobToDataURL(blob: Blob): Promise<string> {
 return new Promise((resolve, reject) => {
 const reader = new FileReader();
 reader.onloadend = () => resolve(reader.result as string);
 reader.onerror = reject;
 reader.readAsDataURL(blob);
 });
}

async function loadImageAsDataURL(url: string): Promise<string | null> {
 if (!url) return null;
 if (url.startsWith("data:image/")) return url;
 const ctrl = new AbortController();
 const tid = setTimeout(() => ctrl.abort(), PDF_FETCH_TIMEOUT_MS);
 try {
 const resp = await fetch(url, { signal: ctrl.signal });
 const blob = await resp.blob();
 const dataUrl = await blobToDataURL(blob);
 if (blob.type.includes("webp")) {
 return await convertDataUrlToJpeg(dataUrl);
 }
 return dataUrl;
 } catch {
 return null;
 } finally {
 clearTimeout(tid);
 }
}

async function loadPhotoAsset(url: string): Promise<{ dataUrl: string; format: "PNG" | "JPEG"; aspect: number } | null> {
 const dataUrl = await loadImageAsDataURL(url);
 if (!dataUrl) return null;
 try {
 const img = await loadPdfMapImageFromSrc(dataUrl);
 if (!img) return { dataUrl, format: dataUrlFormat(dataUrl), aspect: 1.4 };
 const aspect = img.width > 0 && img.height > 0 ? img.width / img.height : 1.4;
 return { dataUrl, format: dataUrlFormat(dataUrl), aspect };
 } catch {
 return { dataUrl, format: dataUrlFormat(dataUrl), aspect: 1.4 };
 }
}

async function getDataUrlAspect(dataUrl: string): Promise<number | null> {
 if (!dataUrl) return null;
 try {
 const img = await loadPdfMapImageFromSrc(dataUrl);
 if (!img || !img.width || !img.height) return null;
 return img.width / img.height;
 } catch {
 return null;
 }
}

type PdfPhotoAsset = { dataUrl: string; format: "PNG" | "JPEG"; aspect: number; caption?: string };

/** Immer reservieren – einheitliches Layout mit/ohne Beschriftung. */
const PDF_PHOTO_CAPTION_RESERVE_PT = 14;

function drawImageContained(
 doc: jsPDF,
 image: { dataUrl: string; format: "PNG" | "JPEG"; aspect: number },
 x: number,
 y: number,
 boxW: number,
 boxH: number
) {
 const boxAspect = boxW / boxH;
 const imgAspect = Math.max(0.1, image.aspect);
 let drawW = boxW;
 let drawH = boxH;
 if (imgAspect > boxAspect) {
 drawH = boxW / imgAspect;
 } else {
 drawW = boxH * imgAspect;
 }
 const dx = x + (boxW - drawW) / 2;
 const dy = y + (boxH - drawH) / 2;
 doc.addImage(image.dataUrl, image.format, dx, dy, drawW, drawH);
}

function drawPhotoInBox(
 doc: jsPDF,
 image: PdfPhotoAsset,
 x: number,
 y: number,
 boxW: number,
 boxH: number
) {
 const caption = normalizePdfPhotoCaption(image.caption || "");
 const imageBoxH = Math.max(24, boxH - PDF_PHOTO_CAPTION_RESERVE_PT);
 drawImageContained(doc, image, x, y, boxW, imageBoxH);
 if (!caption) return;
 doc.setFont("helvetica", "italic");
 doc.setFontSize(8);
 setColor(doc, GRAY);
 doc.text(caption, x + boxW / 2, y + imageBoxH + 4, { align: "center", maxWidth: boxW - 6 });
}

function resolvePhotoLayout(layout: PdfPhotoLayout, count: number): PdfPhotoLayout {
 if (layout !== "auto") return layout;
 if (count <= 1) return "onePerPageMax";
 if (count === 2) return "twoPortraitSideBySide";
 if (count >= 6) return "sixPortraitGrid";
 return "grid";
}

function layoutSlotCapacity(layout: PdfPhotoLayout): number {
 if (layout === "onePerPageMax" || layout === "onePortraitTopHalf" || layout === "onePortraitBottomHalf") return 1;
 if (layout === "twoPortraitSideBySide" || layout === "twoPortraitStacked" || layout === "twoMixedStacked") return 2;
 if (layout === "twoPortraitTopOneLandscapeBottom" || layout === "oneLandscapeTopTwoPortraitBottom") return 3;
 if (layout === "threePortraitOneLandscape") return 4;
 return 6;
}

async function renderManualPhotoPages(
 doc: jsPDF,
 photoUrls: string[],
 layoutPref: PdfPhotoLayout,
 targetPages?: number,
 captionsByUrl?: Record<string, string>
): Promise<void> {
 const uniquePhotos = Array.from(new Set(photoUrls)).slice(0, 24);
 if (uniquePhotos.length === 0) return;
 const assets = (
 await Promise.all(
 uniquePhotos.map(async (url) => {
 const base = await loadPhotoAsset(url);
 if (!base) return null;
 const caption = normalizePdfPhotoCaption(captionsByUrl?.[url] || "");
 return { ...base, caption: caption || undefined };
 })
 )
 ).filter((a): a is NonNullable<typeof a> => !!a);
 if (assets.length === 0) return;

 const layout = resolvePhotoLayout(layoutPref, assets.length);
 const gap = 10;

 type Asset = PdfPhotoAsset;
 type Row = { kind: "landscape" | "portrait"; items: Asset[] };

 const isLandscape = (a: Asset) => a.aspect >= 1.05;

 // Build rows while preserving selection order and never mixing orientations in one row.
 const buildRows = (items: Asset[], portraitPerRow: number): Row[] => {
 const rows: Row[] = [];
 let pBuf: Asset[] = [];
 for (const a of items) {
 if (isLandscape(a)) {
 if (pBuf.length > 0) {
 rows.push({ kind: "portrait", items: pBuf });
 pBuf = [];
 }
 rows.push({ kind: "landscape", items: [a] });
 } else {
 pBuf.push(a);
 if (pBuf.length >= portraitPerRow) {
 rows.push({ kind: "portrait", items: pBuf });
 pBuf = [];
 }
 }
 }
 if (pBuf.length > 0) rows.push({ kind: "portrait", items: pBuf });
 return rows;
 };

 const estimateRowHeight = (row: Row): number => {
 if (row.kind === "landscape") {
 const a = row.items[0];
 return Math.max(130, Math.min(300, CONTENT_W / Math.max(1.05, a.aspect)));
 }
 const cols = row.items.length;
 const cellW = (CONTENT_W - gap * (cols - 1)) / cols;
 const avgAspect = row.items.reduce((s, it) => s + it.aspect, 0) / Math.max(1, cols);
 return Math.max(170, Math.min(320, cellW / Math.max(0.55, avgAspect)));
 };

 const drawRowsPage = (rows: Row[]) => {
 const availableH = PAGE_H - 2 * M;
 const estimated = rows.map(estimateRowHeight);
 const totalEstimated = estimated.reduce((s, h) => s + h, 0) + gap * Math.max(0, rows.length - 1);
 const scale = totalEstimated > 0 ? Math.min(1, availableH / totalEstimated) : 1;
 let y = M;
 rows.forEach((row, idx) => {
 const rowH = estimated[idx] * scale;
 if (row.kind === "landscape") {
 drawPhotoInBox(doc, row.items[0], M, y, CONTENT_W, rowH);
 } else {
 const cols = row.items.length;
 const cellW = (CONTENT_W - gap * (cols - 1)) / cols;
 for (let c = 0; c < cols; c++) {
 drawPhotoInBox(doc, row.items[c], M + c * (cellW + gap), y, cellW, rowH);
 }
 }
 y += rowH + gap;
 });
 };

 const drawRowsAcrossPages = (rows: Row[]) => {
 let idx = 0;
 while (idx < rows.length) {
 const pageRows: Row[] = [];
 let usedH = 0;
 while (idx < rows.length) {
 const h = estimateRowHeight(rows[idx]);
 const nextUsed = pageRows.length === 0 ? h : usedH + gap + h;
 if (nextUsed > PAGE_H - 2 * M && pageRows.length > 0) break;
 pageRows.push(rows[idx]);
 usedH = nextUsed;
 idx++;
 }
 doc.addPage();
 drawRowsPage(pageRows);
 }
 };

 if (layout === "onePerPageMax") {
 for (let i = 0; i < assets.length; i++) {
 doc.addPage();
 const top = M;
 const h = PAGE_H - 2 * M;
 drawPhotoInBox(doc, assets[i], M, top, CONTENT_W, h);
 }
 return;
 }

 if (layout === "onePortraitTopHalf" || layout === "onePortraitBottomHalf") {
 for (let i = 0; i < assets.length; i++) {
 doc.addPage();
 const gapY = 10;
 const boxH = (PAGE_H - 2 * M - gapY) / 2;
 const yBox = layout === "onePortraitTopHalf" ? M : M + boxH + gapY;
 drawPhotoInBox(doc, assets[i], M, yBox, CONTENT_W, boxH);
 }
 return;
 }

 if (layout === "twoPortraitSideBySide") {
 drawRowsAcrossPages(buildRows(assets, 2));
 return;
 }

 if (layout === "twoPortraitStacked" || layout === "twoMixedStacked") {
 for (let i = 0; i < assets.length; i += 2) {
 doc.addPage();
 const pair = assets.slice(i, i + 2);
 if (pair.length === 1) {
 drawPhotoInBox(doc, pair[0], M, M, CONTENT_W, PAGE_H - 2 * M);
 continue;
 }
 const gapY = 10;
 const rowH = (PAGE_H - 2 * M - gapY) / 2;
 drawPhotoInBox(doc, pair[0], M, M, CONTENT_W, rowH);
 drawPhotoInBox(doc, pair[1], M, M + rowH + gapY, CONTENT_W, rowH);
 }
 return;
 }

 if (layout === "sixPortraitGrid") {
 drawRowsAcrossPages(buildRows(assets, 3));
 return;
 }

 if (layout === "threePortraitOneLandscape") {
 drawRowsAcrossPages(buildRows(assets, 3));
 return;
 }

 if (layout === "twoPortraitTopOneLandscapeBottom" || layout === "oneLandscapeTopTwoPortraitBottom") {
 for (let i = 0; i < assets.length; i += 3) {
 doc.addPage();
 const chunk = assets.slice(i, i + 3);
 if (chunk.length === 1) {
 drawPhotoInBox(doc, chunk[0], M, M, CONTENT_W, PAGE_H - 2 * M);
 continue;
 }
 if (chunk.length === 2) {
 const gapX = 10;
 const w = (CONTENT_W - gapX) / 2;
 drawPhotoInBox(doc, chunk[0], M, M, w, PAGE_H - 2 * M);
 drawPhotoInBox(doc, chunk[1], M + w + gapX, M, w, PAGE_H - 2 * M);
 continue;
 }
 const gapY = 10;
 const topH = (PAGE_H - 2 * M - gapY) * 0.48;
 const bottomH = PAGE_H - 2 * M - gapY - topH;
 if (layout === "twoPortraitTopOneLandscapeBottom") {
 const gapX = 10;
 const topW = (CONTENT_W - gapX) / 2;
 drawPhotoInBox(doc, chunk[0], M, M, topW, topH);
 drawPhotoInBox(doc, chunk[1], M + topW + gapX, M, topW, topH);
 drawPhotoInBox(doc, chunk[2], M, M + topH + gapY, CONTENT_W, bottomH);
 } else {
 const gapX = 10;
 const bottomW = (CONTENT_W - gapX) / 2;
 drawPhotoInBox(doc, chunk[0], M, M, CONTENT_W, topH);
 drawPhotoInBox(doc, chunk[1], M, M + topH + gapY, bottomW, bottomH);
 drawPhotoInBox(doc, chunk[2], M + bottomW + gapX, M + topH + gapY, bottomW, bottomH);
 }
 }
 return;
 }

 if (layout === "smartPages") {
 const items = assets.map((a, i) => ({ index: i, aspect: a.aspect }));
 const pages = buildSmartPhotoPages(items, targetPages);
 for (const page of pages) {
 if (page.rows.length === 0) continue;
 doc.addPage();
 drawRowsPage(
 page.rows.map((row) => ({
 kind: row.kind,
 items: row.items.map((it) => assets[it.index]),
 }))
 );
 }
 return;
 }

 if (layout === "grid") {
 drawRowsAcrossPages(buildRows(assets, 3));
 return;
 }

}

async function renderManualPhotoPagesByPageLayouts(
 doc: jsPDF,
 photoUrls: string[],
 pageLayouts: PdfPhotoLayout[],
 fallbackLayout: PdfPhotoLayout,
 captionsByUrl?: Record<string, string>
): Promise<void> {
 const uniquePhotos = Array.from(new Set(photoUrls)).slice(0, 24);
 if (uniquePhotos.length === 0) return;
 let cursor = 0;
 let pageIdx = 0;
 while (cursor < uniquePhotos.length && pageIdx < 24) {
 const layoutRaw = pageLayouts[pageIdx] || fallbackLayout;
 const layout = resolvePhotoLayout(layoutRaw === "auto" ? fallbackLayout : layoutRaw, uniquePhotos.length - cursor);
 const take = Math.max(1, layoutSlotCapacity(layout));
 const chunk = uniquePhotos.slice(cursor, cursor + take);
 if (chunk.length === 0) break;
 await renderManualPhotoPages(doc, chunk, layout, 1, captionsByUrl);
 cursor += chunk.length;
 pageIdx += 1;
 }
}

function convertDataUrlToJpeg(dataUrl: string): Promise<string | null> {
 return new Promise((resolve) => {
 const img = new Image();
 img.onload = () => {
 try {
 const canvas = document.createElement("canvas");
 canvas.width = img.width;
 canvas.height = img.height;
 const ctx = canvas.getContext("2d");
 if (!ctx) return resolve(dataUrl);
 ctx.drawImage(img, 0, 0);
 resolve(canvas.toDataURL("image/jpeg", 0.9));
 } catch {
 resolve(dataUrl);
 }
 };
 img.onerror = () => resolve(dataUrl);
 img.src = dataUrl;
 });
}

function dataUrlFormat(dataUrl: string): "PNG" | "JPEG" {
 return dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
}

/** Gesamtrouten-Karte unter der Routenübersicht (Reiseübersicht-Seite). */
async function drawOverviewMapOnTravelPage(
 doc: jsPDF,
 overviewMapData: string | null,
 yStart: number,
 copy: PdfCopy
): Promise<number> {
 const mapBoxTop = yStart + 6;
 const mapBoxH = PAGE_H - mapBoxTop - 45;
 const mapBoxW = CONTENT_W;
 const mapBoxX = M;

 if (overviewMapData) {
 try {
 const mapAspect = await getDataUrlAspect(overviewMapData);
 let drawW = mapBoxW;
 let drawH = mapAspect && mapAspect > 0 ? drawW / mapAspect : mapBoxW;
 if (drawH > mapBoxH) {
 drawH = mapBoxH;
 drawW = drawH * (mapAspect || 1);
 }
 const drawX = mapBoxX + (mapBoxW - drawW) / 2;
 doc.addImage(overviewMapData, dataUrlFormat(overviewMapData), drawX, mapBoxTop, drawW, drawH);
 drawMapLegend(doc, drawX + 8, mapBoxTop + drawH - 26, copy);
 return mapBoxTop + drawH + 12;
 } catch {
 // fall through to error text
 }
 }

 doc.setFont("helvetica", "italic");
 doc.setFontSize(10);
 setColor(doc, GRAY);
 doc.text(copy.mapFail, M, mapBoxTop + 16);
 return mapBoxTop + 36;
}

function buildSentenceExcerpt(doc: jsPDF, text: string, maxWidth: number, maxLines: number): string[] {
 const clampLines = (lines: string[]): string[] => {
 if (lines.length <= maxLines) return lines;
 const clipped = lines.slice(0, maxLines);
 const last = (clipped[maxLines - 1] || "").replace(/[.,;:!?-]*\s*$/, "").trim();
 clipped[maxLines - 1] = `${last}...`;
 return clipped;
 };
 const clean = text.replace(/\s+/g, " ").trim();
 if (!clean) return [];
 const sentences = clean
 .split(/(?<=[.!?])\s+/)
 .map((s) => s.trim())
 .filter(Boolean);
 if (sentences.length === 0) return clampLines(splitTextLines(doc, clean, maxWidth));

 const hardLimit = maxLines + 1; // allow one extra line to finish a sentence
 let built = "";
 for (let i = 0; i < sentences.length; i++) {
 const next = built ? `${built} ${sentences[i]}` : sentences[i];
 const nextLines = splitTextLines(doc, next, maxWidth);
 if (nextLines.length <= maxLines) {
 built = next;
 continue;
 }

 const currentLines = built ? splitTextLines(doc, built, maxWidth).length : 0;
 const almostFull = currentLines >= Math.max(1, maxLines - 1);
 if (almostFull && nextLines.length <= hardLimit) {
 built = next;
 }
 break;
 }

 if (!built) {
 const firstSentence = sentences[0];
 const lines = splitTextLines(doc, firstSentence, maxWidth);
 if (lines.length <= hardLimit) return lines;
 const clipped = lines.slice(0, hardLimit);
 const last = (clipped[hardLimit - 1] || "").replace(/[.,;:!?-]*\s*$/, "").trim();
 clipped[hardLimit - 1] = `${last}...`;
 return clipped;
 }
 const builtLines = splitTextLines(doc, built, maxWidth);
 if (builtLines.length <= hardLimit) return builtLines;
 const clipped = builtLines.slice(0, hardLimit);
 const last = (clipped[hardLimit - 1] || "").replace(/[.,;:!?-]*\s*$/, "").trim();
 clipped[hardLimit - 1] = `${last}...`;
 return clipped;
}

// -------------------------------------------------------------------
// Main export
// -------------------------------------------------------------------
export interface PdfOptions {
 trip: Trip;
 etappen: Etappe[];
 routeInfo?: { distance: string; duration: string; stops: number };
 routeLegs?: RouteLegInfo[];
 googleApiKey?: string;
 onProgress?: (pct: number, msg: string) => void;
 /** Wird während der PDF-Erzeugung befüllt (Static Maps + Directions für Karten). */
 mapsBillingAccumulator?: PdfMapsBillingAccumulator;
 locale?: string;
}

export async function prewarmOverviewMapForPdf(trip: Trip, googleApiKey?: string): Promise<string | null> {
 if (!googleApiKey) return null;
 const mainStops = buildOverviewRouteStops(trip);
 if (mainStops.length < 2) return null;
 const hotelStops = collectAllHotelStops(trip);
 const overviewHotelMarkerStops = buildOverviewHotelMarkerStops(mainStops, hotelStops);
 const { legend, labelByCityKey } = buildOverviewHotelLabels(hotelStops);
 const overviewMarkerStops = buildOverviewMarkerStops(mainStops);
 const overviewRouteByNames = buildOverviewRouteByNames(mainStops);
 const preferredPolyline = getPreferredOverviewPolyline(trip);
 const cacheKey = buildOverviewMapCacheKey(mainStops, legend, preferredPolyline);
 const cached = readOverviewMapCache(cacheKey);
 if (cached) return cached;
 const mapData = await loadMapImage(
 mainStops,
 googleApiKey,
 overviewRouteByNames || undefined,
 undefined,
 preferredPolyline || undefined,
 overviewHotelMarkerStops.length > 0 ? overviewHotelMarkerStops : overviewMarkerStops,
 labelByCityKey,
 false,
 "overview"
 );
 if (mapData) {
 writeOverviewMapCache(cacheKey, mapData);
 return mapData;
 }
 return null;
}

export async function generateTripPDF(opts: PdfOptions): Promise<Blob> {
 const { trip, etappen: etappenInput, routeInfo, routeLegs, googleApiKey, onProgress, mapsBillingAccumulator } = opts;
 const locale = opts.locale || "de";
 const copy = getPdfCopy(locale);
 const fmtDate = (iso: string) => formatPdfDate(iso, locale);
 const exportStops = buildOverviewRouteStops(trip);
 const stopsForEtappen = filterStopsForFerryRouting(
 (trip.stops?.length ? trip.stops : exportStops).filter(
 (s) => !s.name.trim() || isDrivingRouteStop(s)
 )
 );
 const viaPoints = trip.routes?.route?.viaPoints || [];
 const collapsedRouteLegs = routeLegs?.length
  ? collapseViaInflatedLegs(routeLegs, stopsForEtappen, viaPoints)
  : routeLegs;
 let etappen =
 etappenInput.length > 0
 ? etappenInput.map((et) => normalizeEtappePlaceNames(et, stopsForEtappen))
 : resolveEtappenForExport(exportStops, collapsedRouteLegs?.length ? collapsedRouteLegs : null);

 if (collapsedRouteLegs?.length) {
 const fromRoute = buildEtappenFromRoute(stopsForEtappen, collapsedRouteLegs).map((et) =>
 normalizeEtappePlaceNames(et, stopsForEtappen)
 );
 const inputHasRealNames = etappen.some(
 (et) => !isGenericEtappePlaceLabel(et.from) && !isGenericEtappePlaceLabel(et.to)
 );
 if (fromRoute.length > 0) {
 if (etappenInput.length === 0 || !inputHasRealNames) {
 etappen = fromRoute;
 } else {
 etappen = etappen.map((et, i) => {
 const rebuilt = fromRoute[i];
 if (!rebuilt) return et;
 return {
 ...et,
 legs: rebuilt.legs.length ? rebuilt.legs : et.legs,
 distanceKm: rebuilt.distanceKm > 0 ? rebuilt.distanceKm : et.distanceKm,
 durationFormatted:
 rebuilt.durationFormatted && rebuilt.durationFormatted !== "—"
 ? rebuilt.durationFormatted
 : et.durationFormatted,
 };
 });
 }
 }
 }
 const pdfOpts = resolvePdfExportOptions(trip);
 const pdfBilling = mapsBillingAccumulator ?? { staticMapRequests: 0, directionsRequests: 0 };
 const doc = new jsPDF({ unit: "pt", format: "a4" });
 const hotelStops = collectAllHotelStops(trip);
 const aiDiscoveriesByEtappe = collectAiDiscoveriesByEtappe(trip);
 const discoveryInfoCache = new Map<string, { text?: string; photo?: string; portrait?: string; portraitHighlights?: string[] }>();
 const overviewHotelLegend: string[] = [];
 const overviewHotelLabelByCityKey = new Map<string, string>();
 let pageNumber = 1;

 const progress = (pct: number, msg: string) => onProgress?.(pct, msg);

 // Pre-load map images
 progress(5, copy.progressMaps);
 let overviewMapData: string | null = null;
 const etappeMapData: (string | null)[] = [];
 const allStops = trip.stops.filter((s) => s.name.trim() && isDrivingRouteStop(s));
 const etappeStopsByIndex: RouteStop[][] = etappen.map((et) => getEtappeStopsForMap(et, allStops));
 const routedSegmentsByIndex: (RoutedSegment[] | null)[] = etappen.map(() => null);
 const encodedRouteByIndex: (string | null)[] = etappen.map(() => null);

 if (googleApiKey) {
 const mainStops = buildOverviewRouteStops(trip);
 const overviewMarkerStops = buildOverviewMarkerStops(mainStops);
 const { legend, labelByCityKey } = buildOverviewHotelLabels(hotelStops);
 const overviewHotelMarkerStops = buildOverviewHotelMarkerStops(mainStops, hotelStops);
 const overviewRouteByNames = buildOverviewRouteByNames(mainStops);
 const preferredPolyline = getPreferredOverviewPolyline(trip);
 for (const row of legend) overviewHotelLegend.push(row);
 for (const [k, v] of labelByCityKey.entries()) overviewHotelLabelByCityKey.set(k, v);
 if (pdfOpts.travelOverview && pdfOpts.overviewMap) {
 const overviewCacheKey = buildOverviewMapCacheKey(mainStops, overviewHotelLegend, preferredPolyline);
 overviewMapData = readOverviewMapCache(overviewCacheKey);
 if (!overviewMapData) {
 overviewMapData = await loadMapImage(
 mainStops,
 googleApiKey,
 overviewRouteByNames || undefined,
 undefined,
 preferredPolyline || undefined,
 overviewHotelMarkerStops.length > 0 ? overviewHotelMarkerStops : overviewMarkerStops,
 overviewHotelLabelByCityKey,
 false,
 "overview",
 pdfBilling
 );
 if (overviewMapData) writeOverviewMapCache(overviewCacheKey, overviewMapData);
 }
 }

 for (let i = 0; i < etappen.length; i++) {
 const et = etappen[i];
 const etappeStops = etappeStopsByIndex[i] || [];
 let routedSegments: RoutedSegment[] | null = null;
 let encodedByNames: string | null = null;
 const nameChain = etappeStops.map((s) => s.name.trim()).filter(Boolean);
 const originName = nameChain[0] || et.from;
 const destinationName = nameChain[nameChain.length - 1] || et.to;
 const waypointNames =
 nameChain.length > 2 ? nameChain.slice(1, -1) : et.legs.slice(0, -1).map((l) => l.to);

 routedSegments = await loadEtappeRoutedSegments(etappeStops, googleApiKey, pdfBilling);

 if (routedSegments?.length) {
 const routePoints: Array<{ lat: number; lng: number }> = [];
 appendSegmentPolylines(routePoints, routedSegments);
 if (routePoints.length > 1) {
 encodedByNames = encodePolyline(routePoints);
 }
 }

 if (!routedSegments?.length && nameChain.length >= 2) {
 const jsRoute = await loadRouteByNamesViaJsApi(originName, destinationName, waypointNames, pdfBilling);
 if (jsRoute) {
 routedSegments = jsRoute.segments;
 encodedByNames = jsRoute.encodedPolyline || encodedByNames;
 }
 }

 routedSegmentsByIndex[i] = routedSegments;
 encodedRouteByIndex[i] = encodedByNames;
 if (pdfOpts.etappeMaps && etappeStops.length >= 2) {
 const waypoints = waypointNames;
 etappeMapData.push(
 await loadMapImage(
 etappeStops,
 googleApiKey,
 {
 origin: originName,
 destination: destinationName,
 waypoints,
 },
 routedSegments,
 encodedByNames,
 undefined,
 undefined,
 undefined,
 "etappe",
 pdfBilling
 )
 );
 } else {
 etappeMapData.push(null);
 }
 }
 }

 etappen = etappen.map((et, i) => enrichEtappeMetrics(et, routedSegmentsByIndex[i]));

 const ensureEtappeMapData = async (index: number): Promise<string | null> => {
 const existing = etappeMapData[index];
 if (existing) return existing;
 if (!googleApiKey) return null;
 const etappeStops = etappeStopsByIndex[index] || [];
 if (etappeStops.length < 2) return null;
 const et = etappen[index];
 const nameChain = etappeStops.map((s) => s.name.trim()).filter(Boolean);
 const originName = nameChain[0] || et.from;
 const destinationName = nameChain[nameChain.length - 1] || et.to;
 const waypointNames =
 nameChain.length > 2 ? nameChain.slice(1, -1) : et.legs.slice(0, -1).map((l) => l.to);

 // Retry map loading with progressively simpler inputs for stability on large PDFs.
 let mapData = await loadMapImage(
 etappeStops,
 googleApiKey,
 { origin: originName, destination: destinationName, waypoints: waypointNames },
 routedSegmentsByIndex[index],
 encodedRouteByIndex[index],
 undefined,
 undefined,
 undefined,
 "etappe",
 pdfBilling
 );
 if (!mapData) {
 mapData = await loadMapImage(
 etappeStops,
 googleApiKey,
 undefined,
 routedSegmentsByIndex[index],
 encodedRouteByIndex[index],
 etappeStops,
 undefined,
 undefined,
 "etappe",
 pdfBilling
 );
 }
 etappeMapData[index] = mapData || null;
 return etappeMapData[index];
 };

 // Load logo
 progress(10, copy.progressLogo);
 let logoData: string | null = null;
 try {
 logoData = await loadImageAsDataURL("/images/sniffertrek-logo.png");
 } catch { /* ignore */ }
 const coverPhotoData = trip.pdfCoverPhotoDataUrl || null;
 const coverStyle = trip.pdfCoverPhotoStyle || "belowTitle";
 const coverTitleSize = Math.max(18, Math.min(64, Number(trip.pdfCoverTitleSize) || 32));
 const coverDateSize = Math.max(10, Math.min(36, Number(trip.pdfCoverDateSize) || 14));
 const coverTitleColor = hexToRgb(trip.pdfCoverTitleColor) || BLUE;
 const coverDateColor = hexToRgb(trip.pdfCoverDateColor) || coverTitleColor;
 const coverTitleFont =
 trip.pdfCoverTitleFont === "times" || trip.pdfCoverTitleFont === "courier"
 ? trip.pdfCoverTitleFont
 : "helvetica";
 const coverDateFont =
 trip.pdfCoverDateFont === "times" || trip.pdfCoverDateFont === "courier"
 ? trip.pdfCoverDateFont
 : "helvetica";
 const normalizeCoverAlign = (align?: string): "left" | "center" | "right" => {
 if (align === "left" || align === "right") return align;
 return "center";
 };
 const coverTitleAlign = normalizeCoverAlign(trip.pdfCoverTitleAlign);
 const coverDateAlign = normalizeCoverAlign(trip.pdfCoverDateAlign);
 const coverExtraText = trip.pdfCoverExtraText || "";
 const coverExtraPlacement = trip.pdfCoverExtraTextPlacement || "afterDate";
 const coverExtraSize = Math.max(10, Math.min(28, Number(trip.pdfCoverExtraTextSize) || 14));
 const coverExtraColor = hexToRgb(trip.pdfCoverExtraTextColor) || coverTitleColor;
 const coverExtraFont =
 trip.pdfCoverExtraTextFont === "times" || trip.pdfCoverExtraTextFont === "courier"
 ? trip.pdfCoverExtraTextFont
 : "helvetica";
 const coverExtraAlign = normalizeCoverAlign(trip.pdfCoverExtraTextAlign);

 const drawCoverExtraTextAt = (slot: CoverTextSlot): void => {
 if (!coverExtraText.trim()) return;
 doc.setFont(coverExtraFont, "normal");
 let extraSize = coverExtraSize;
 doc.setFontSize(extraSize);
 setColor(doc, coverExtraColor);
 const extraX = coverExtraAlign === "left" ? M : coverExtraAlign === "right" ? RIGHT : PAGE_W / 2;
 const lineGap = Math.max(14, Math.round(extraSize * 1.35));
 const renderedLines: string[] = [];
 for (const para of coverExtraText.replace(/\r\n/g, "\n").split("\n")) {
 if (!para.trim()) {
 renderedLines.push("");
 continue;
 }
 renderedLines.push(...splitTextLines(doc, para, COVER_CONTENT_W_PT - 8));
 }
 if (renderedLines.length === 0) return;
 const startY = slot.anchorFromBottom
 ? slot.topPt - Math.max(0, renderedLines.length - 1) * lineGap
 : slot.topPt;
 let ey = startY;
 for (const line of renderedLines) {
 if (line) doc.text(line, extraX, ey, { align: coverExtraAlign });
 ey += lineGap;
 }
 };

 // =====================================================================
 // PAGE 1 — Deckblatt
 // =====================================================================
 progress(15, copy.progressCover);

 const coverAspect = coverPhotoData ? await getDataUrlAspect(coverPhotoData) : null;
 const coverIsPortrait = typeof coverAspect === "number" ? coverAspect < 1 : false;
 const coverLayout = computeCoverLayout(trip, coverIsPortrait);
 const useCoverAsBackground = coverLayout.useBackground;

 if (useCoverAsBackground && coverPhotoData) {
 try {
 doc.addImage(coverPhotoData, dataUrlFormat(coverPhotoData), 0, 0, PAGE_W, PAGE_H);
 } catch {
 // ignore
 }
 }

 doc.setFont(coverTitleFont, "bold");
 let titleSize = coverTitleSize;
 doc.setFontSize(titleSize);
 setColor(doc, coverTitleColor);
 const title = trip.name || copy.newTrip;
 const titleX = coverTitleAlign === "left" ? M : coverTitleAlign === "right" ? RIGHT : PAGE_W / 2;
 const maxTitleWidth = COVER_CONTENT_W_PT - 8;
 while (titleSize > 18 && doc.getTextWidth(title) > maxTitleWidth) {
 titleSize -= 1;
 doc.setFontSize(titleSize);
 }
 doc.text(title, titleX, coverLayout.titleStartYPt, { align: coverTitleAlign });

 if (coverLayout.date) {
 doc.setFont(coverDateFont, "normal");
 let dateSize = coverDateSize;
 doc.setFontSize(dateSize);
 setColor(doc, coverDateColor);
 const dateText = getCoverDateDisplayText(trip, locale);
 const dateX = coverDateAlign === "left" ? M : coverDateAlign === "right" ? RIGHT : PAGE_W / 2;
 const maxDateWidth = COVER_CONTENT_W_PT - 20;
 while (dateSize > 10 && doc.getTextWidth(dateText) > maxDateWidth) {
 dateSize -= 1;
 doc.setFontSize(dateSize);
 }
 doc.text(dateText, dateX, coverLayout.date.topPt, { align: coverDateAlign });
 }

 const coverTop = coverLayout.imageTopPt ?? coverLayout.titleStartYPt + 80;

 if (coverPhotoData && !useCoverAsBackground) {
 try {
 const maxH = Math.max(120, PAGE_H - coverTop - 32);
 const aspect = typeof coverAspect === "number" && coverAspect > 0 ? coverAspect : 1.5;
 let drawW = PAGE_W;
 let drawH = drawW / aspect;
 if (drawH > maxH) {
 drawH = maxH;
 drawW = drawH * aspect;
 }
 const drawX = (PAGE_W - drawW) / 2;
 doc.addImage(
 coverPhotoData,
 dataUrlFormat(coverPhotoData),
 drawX,
 coverTop,
 drawW,
 drawH
 );
 } catch {
 // Fallback to logo below.
 }
 } else if (logoData) {
 try {
 const imgW = 280;
 const imgH = 400;
 const availH = PAGE_H - coverTop - 60;
 const finalH = Math.min(imgH, availH);
 const finalW = finalH * (imgW / imgH);
 const imgX = (PAGE_W - finalW) / 2;
 doc.addImage(logoData, "PNG", imgX, coverTop, finalW, finalH);
 } catch { /* ignore */ }
 }

 if (coverLayout.extra && coverExtraText.trim()) {
 drawCoverExtraTextAt(coverLayout.extra);
 }

 drawCoverBrandMark(doc, !!(useCoverAsBackground && coverPhotoData));

 type TocRow = { label: string; km: string; page: number; dateLabel?: string; routeLabel?: string };

 const estimateHotelSectionPages = (count: number): number => {
 if (count === 0) return 1;
 return Math.max(1, Math.ceil(count / 6));
 };

 const planPdfToc = (): { frontRows: TocRow[]; dayRows: TocRow[] } => {
 const contentStartPage = pdfOpts.tableOfContents ? 3 : 2;
 let p = contentStartPage;
 const frontRows: TocRow[] = [{ label: copy.cover, km: "", page: 1 }];

 if (pdfOpts.travelOverview) {
 frontRows.push({ label: copy.overview, km: "", page: p++ });
 }
 if (pdfOpts.accommodations) {
 frontRows.push({ label: copy.accommodations, km: "", page: p });
 p += estimateHotelSectionPages(hotelStops.length);
 }
 const bookedFlightsCount = Array.isArray(trip.bookedFlights)
 ? trip.bookedFlights.length
 : Array.isArray(trip.routes?.bookedFlights)
 ? trip.routes!.bookedFlights!.length
 : 0;
 if (pdfOpts.flights && bookedFlightsCount > 0) {
 frontRows.push({ label: copy.flights, km: "", page: p++ });
 }

 const dayStart = p;
 const dayRows: TocRow[] = etappen.map((et, i) => {
 const dayLabel = trip.startDate
 ? fmtDate(addDaysISO(trip.startDate, i))
 : pdfFill(copy.dayN, { n: i + 1 });
 const routeLabel = formatEtappeRouteLabel(et.from, et.to);
 return {
 label: `${dayLabel}  ${routeLabel}`,
 dateLabel: dayLabel,
 routeLabel,
 km: formatEtappeMetricsLine(et),
 page: dayStart + i,
 };
 });

 return { frontRows, dayRows };
 };

 const tocPlan = planPdfToc();
 let y = M;

 // =====================================================================
 // Inhaltsverzeichnis — Seite 2 (Auflistung ab Seite 3)
 // =====================================================================
 if (pdfOpts.tableOfContents) {
 progress(18, copy.progressToc);
 doc.addPage();
 pageNumber = 2;
 y = M;

 y = drawSectionTitle(doc, copy.toc, y);

 doc.setFontSize(10);
 setColor(doc, BLACK);

 const KM_TAB = RIGHT - 110;
 const PAGE_TAB = RIGHT;
 /** Abstand Datum → Ort: doppelt so breit wie ein normales Leerzeichen. */
 const TOC_DATE_ROUTE_GAP = doc.getTextWidth(" ") * 2;

 const fitTextToWidth = (text: string, maxWidth: number): string => {
 const t = (text || "").trim();
 if (!t || maxWidth <= 0) return "";
 if (doc.getTextWidth(t) <= maxWidth) return t;
 const ellipsis = "…";
 const ellipsisW = doc.getTextWidth(ellipsis);
 let lo = 0;
 let hi = t.length;
 while (lo < hi) {
 const mid = Math.ceil((lo + hi) / 2);
 const candidate = t.slice(0, mid).trimEnd() + ellipsis;
 if (doc.getTextWidth(candidate) <= maxWidth) lo = mid;
 else hi = mid - 1;
 }
 return lo > 0 ? t.slice(0, lo).trimEnd() + ellipsis : ellipsis;
 };

 const drawTocRow = (row: TocRow) => {
 doc.setFont("helvetica", "normal");
 if (row.dateLabel && row.routeLabel) {
 doc.text(row.dateLabel, M, y);
 const routeX = M + doc.getTextWidth(row.dateLabel) + TOC_DATE_ROUTE_GAP;
 const maxRouteW = Math.max(40, KM_TAB - routeX - 10);
 doc.text(fitTextToWidth(row.routeLabel, maxRouteW), routeX, y);
 } else {
 const maxLabelW = Math.max(40, KM_TAB - M - 10);
 doc.text(fitTextToWidth(row.label, maxLabelW), M, y);
 }
 if (row.km) {
 doc.text(row.km, KM_TAB, y, { align: "right" });
 }
 doc.text(String(row.page), PAGE_TAB, y, { align: "right" });
 y += 18;
 };

 for (const row of tocPlan.frontRows) {
 drawTocRow(row);
 }

 if (tocPlan.dayRows.length > 0) {
 y += 5;

 for (const row of tocPlan.dayRows) {
 if (y > PAGE_H - 60) {
 doc.addPage();
 pageNumber++;
 y = M;
 }
 drawTocRow(row);
 }
 }
 }

 // =====================================================================
 // Reiseübersicht (optional, inkl. Übersichtskarte unter Routenübersicht)
 // =====================================================================
 if (pdfOpts.travelOverview) {
 progress(25, copy.progressOverview);
 doc.addPage();
 pageNumber++;
 y = M;

 y = drawSectionTitle(doc, copy.overview, y);

 // Key stats in 2 columns with right-aligned values
 const TAB_X = M + 160; // tab stop for values

 doc.setFontSize(10);

 const drawStatRow = (label: string, value: string) => {
 doc.setFont("helvetica", "normal");
 setColor(doc, BLACK);
 doc.text(label, M, y);
 doc.setFont("helvetica", "bold");
 setColor(doc, BLACK);
 doc.text(value, TAB_X, y);
 y += 16;
 };

 if (trip.startDate && trip.endDate) {
 drawStatRow(copy.travelDate, `${fmtDate(trip.startDate)} - ${fmtDate(trip.endDate)}`);
 }
 if (routeInfo) {
 drawStatRow(copy.totalDistance, routeInfo.distance);
 drawStatRow(copy.totalDriveTime, routeInfo.duration);
 drawStatRow(copy.stops, `${routeInfo.stops}`);
 }
 drawStatRow(copy.stages, `${etappen.length}`);
 drawStatRow(copy.hotels, `${hotelStops.length}`);

 const bookedCount = hotelStops.filter((s) => !!s.hotelBooked).length;
 if (hotelStops.length > 0) {
 drawStatRow(copy.hotelsBooked, `${bookedCount} / ${hotelStops.length}`);
 }
 y += 15;

 // Routenübersicht in 2 columns
 if (etappen.length > 0) {
 y = drawSectionTitle(doc, copy.routeOverview, y, 12);

 doc.setFontSize(9);
 setColor(doc, BLACK);

 const COL_GAP = 30;
 const colW = (CONTENT_W - COL_GAP) / 2;
 const half = Math.ceil(etappen.length / 2);
 const col0X = M;
 const col1X = M + colW + COL_GAP;
 let col0Y = y;
 let col1Y = y;

 for (let i = 0; i < etappen.length; i++) {
 const et = etappen[i];
 const isLeft = i < half;
 const colX = isLeft ? col0X : col1X;
 let colY = isLeft ? col0Y : col1Y;

 const padX = 10;
 const padTop = 12;
 const padBottom = 15;
 const headerRouteGap = 20;
 const innerW = colW - padX * 2;

 doc.setFont("helvetica", "normal");
 doc.setFontSize(9);
 const routeLabel = formatPdfRouteLabel(et.from, et.to);
 const routeLines = splitTextLines(doc, routeLabel, innerW).slice(0, 3);
 const contentH = headerRouteGap + routeLines.length * 11;
 const blockH = padTop + contentH + padBottom;

 drawSoftCard(doc, colX, colY, colW, blockH);

 const textX = colX + padX;
 const headerY = colY + padTop + 2;

 doc.setFont("helvetica", "bold");
 doc.setFontSize(9);
 setColor(doc, BLACK);
 doc.text(`${pdfFill(copy.dayN, { n: i + 1 })}:`, textX, headerY);
 const metrics = formatEtappeMetricsLine(et);
 if (metrics && metrics !== "0 km") {
 doc.setFont("helvetica", "bold");
 doc.setFontSize(9);
 setColor(doc, BLACK);
 doc.text(metrics, colX + colW - padX, headerY, { align: "right" });
 }
 colY = headerY + headerRouteGap;

 doc.setFont("helvetica", "normal");
 setColor(doc, BLACK);
 doc.text(routeLines, textX, colY);

 const totalBlockH = blockH + 8;
 if (isLeft) col0Y += totalBlockH;
 else col1Y += totalBlockH;
 }
 y = Math.max(col0Y, col1Y) + 10;

 if (etappen.every((et) => et.distanceKm <= 0)) {
 doc.setFont("helvetica", "italic");
 doc.setFontSize(8);
 setColor(doc, GRAY);
 doc.text(copy.kmHint, M, y);
 y += 12;
 }
 }

 if (pdfOpts.overviewMap) {
 progress(28, copy.progressOverviewMap);
 y = await drawOverviewMapOnTravelPage(doc, overviewMapData, y, copy);
 }
 }

 // =====================================================================
 // Hotelliste (optional)
 // =====================================================================
 if (pdfOpts.accommodations) {
 progress(35, copy.progressHotels);
 doc.addPage();
 pageNumber++;
 y = M;

 y = drawSectionTitle(doc, copy.accommodations, y);

 if (hotelStops.length === 0) {
 doc.setFont("helvetica", "italic");
 doc.setFontSize(10);
 setColor(doc, GRAY);
 doc.text(copy.noHotels, M, y);
 y += 20;
 } else {
 const cols = 3;
 const gapX = 10;
 const gapY = 10;
 const cardW = (CONTENT_W - gapX * (cols - 1)) / cols;
 const cardH = 71;
 let cardRow = 0;
 let cardCol = 0;

 const drawHotelCard = (stop: RouteStop, idx: number, x: number, cardTop: number) => {
 const isBooked = !!stop.hotelBooked;
 const { checkIn, checkOut, nights } = getHotelDates(stop, idx, hotelStops, trip.startDate);
 const guests = stop.hotelGuests || trip.travelers || 2;
 const rooms = stop.hotelRooms || 1;
 const dotColor = isBooked ? GREEN : RED;
 const cardBg = isBooked ? [248, 255, 251] as [number, number, number] : [255, 252, 252] as [number, number, number];

 drawSoftCard(doc, x, cardTop, cardW, cardH, cardBg, { border: false });

 // Header: dot + city
 const headY = cardTop + 14;
 doc.setFillColor(dotColor[0], dotColor[1], dotColor[2]);
 doc.setDrawColor(dotColor[0], dotColor[1], dotColor[2]);
 drawDot(doc, x + 8, headY - 1, 2.4, isBooked);

 doc.setFont("helvetica", "bold");
 doc.setFontSize(10);
 setColor(doc, isBooked ? GREEN : RED);
 const city = extractCity(stop.name);
 const cityLines = splitTextLines(doc, city, cardW - 18).slice(0, 1);
 doc.text(cityLines[0] || city, x + 14, headY);

 // Dates
 doc.setFont("helvetica", "normal");
 doc.setFontSize(8);
 setColor(doc, isBooked ? GREEN : RED);
 if (checkIn) {
 const dateTxt = `${fmtDate(checkIn)} - ${fmtDate(checkOut)}, ${nights}N`;
 const dateLines = splitTextLines(doc, dateTxt, cardW - 14).slice(0, 1);
 doc.text(dateLines[0] || dateTxt, x + 7, cardTop + 28);
 }

 // Detail lines (gleiche Farbe wie Status/Ort)
 setColor(doc, isBooked ? GREEN : RED);
 doc.setFont("helvetica", "normal");
 doc.setFontSize(8);
 const detailParts: string[] = [];
 if (stop.bookingHotelName) detailParts.push(stop.bookingHotelName);
 detailParts.push(pdfFill(copy.guestsRooms, { guests, rooms }));
 if (stop.bookingPrice) detailParts.push(pdfFill(copy.price, { value: stop.bookingPrice }));
 if (stop.bookingConfirmation) detailParts.push(pdfFill(copy.nr, { value: stop.bookingConfirmation }));
 const detailStr = detailParts.join(" | ");
 const detailLines = splitTextLines(doc, detailStr, cardW - 14).slice(0, 3);
 doc.text(detailLines, x + 7, cardTop + 42);
 };

 for (let idx = 0; idx < hotelStops.length; idx++) {
 const stop = hotelStops[idx];
 const rowY = y + cardRow * (cardH + gapY);
 if (rowY + cardH > PAGE_H - M) {
 doc.addPage();
 pageNumber++;
 y = M;
 cardRow = 0;
 cardCol = 0;
 }
 const x = M + cardCol * (cardW + gapX);
 const cardTop = y + cardRow * (cardH + gapY);
 drawHotelCard(stop, idx, x, cardTop);

 cardCol += 1;
 if (cardCol >= cols) {
 cardCol = 0;
 cardRow += 1;
 }
 }

 y += (cardRow + (cardCol > 0 ? 1 : 0)) * (cardH + gapY);
 }
 }

 // =====================================================================
 // Gebuchte Flüge (optional)
 // =====================================================================
 const bookedFlights = Array.isArray(trip.bookedFlights)
 ? trip.bookedFlights
 : Array.isArray(trip.routes?.bookedFlights)
 ? trip.routes!.bookedFlights!
 : [];
 if (pdfOpts.flights && bookedFlights.length > 0) {
 progress(40, copy.progressFlights);
 doc.addPage();
 pageNumber++;
 y = M;
 y = drawSectionTitle(doc, copy.flights, y);

 const dirLabel = (d?: string) =>
 d === "outbound" ? copy.outbound : d === "return" ? copy.returnFlight : copy.flight;

 for (let i = 0; i < bookedFlights.length; i++) {
 const f = bookedFlights[i];
 const lines: string[] = [];
 const head = [
 dirLabel(f.direction),
 [f.airline, f.flightNumber].filter(Boolean).join(" "),
 ]
 .filter(Boolean)
 .join(" · ");
 lines.push(head || pdfFill(copy.flightN, { n: i + 1 }));

 const route = [f.departureAirport, f.arrivalAirport]
 .filter(Boolean)
 .join(" → ");
 if (route) lines.push(route);

 const dep = [
 f.departureDate ? fmtDate(f.departureDate) : "",
 f.departureTime || "",
 ]
 .filter(Boolean)
 .join(" ");
 const arr = [
 f.arrivalDate ? fmtDate(f.arrivalDate) : "",
 f.arrivalTime || "",
 ]
 .filter(Boolean)
 .join(" ");
 if (dep || arr) {
 lines.push(
 [dep ? pdfFill(copy.dep, { value: dep }) : "", arr ? pdfFill(copy.arr, { value: arr }) : ""]
 .filter(Boolean)
 .join(" · ")
 );
 }

 const meta = [
 f.confirmation ? pdfFill(copy.booking, { value: f.confirmation }) : "",
 f.bookingProvider || "",
 f.bookingPrice || "",
 ]
 .filter(Boolean)
 .join(" · ");
 if (meta) lines.push(meta);
 if (f.notes?.trim()) lines.push(f.notes.trim());

 const blockH = 14 + lines.length * 12 + 10;
 if (y + blockH > PAGE_H - M) {
 doc.addPage();
 pageNumber++;
 y = M;
 }

 drawSoftCard(doc, M, y, CONTENT_W, blockH);
 let ty = y + 16;
 doc.setFont("helvetica", "bold");
 doc.setFontSize(10);
 setColor(doc, BLACK);
 doc.text(lines[0], M + 10, ty);
 ty += 14;
 doc.setFont("helvetica", "normal");
 doc.setFontSize(9);
 setColor(doc, GRAY);
 for (let li = 1; li < lines.length; li++) {
 doc.text(lines[li], M + 10, ty);
 ty += 12;
 }
 y += blockH + 8;
 }
 }

 // =====================================================================
 // Tag für Tag
 // =====================================================================
 for (let i = 0; i < etappen.length; i++) {
 const pct = 50 + Math.round((i / Math.max(etappen.length, 1)) * 45);
 progress(pct, pdfFill(copy.progressDay, { n: i + 1, total: etappen.length }));

 const et = etappen[i];
 doc.addPage();
 pageNumber++;
 y = M;

 // Day header: Datum / Strecke / Hotel (wie Reiseplanungs-PDF)
 let dayLabel: string;
 if (trip.startDate) {
 const dateISO = addDaysISO(trip.startDate, i);
 dayLabel = fmtDate(dateISO);
 } else {
 dayLabel = pdfFill(copy.dayN, { n: i + 1 });
 }

 const matchedHotel = hotelStops.find(
 (s) => extractCity(s.name).toLowerCase() === extractCity(et.to).toLowerCase()
 );
 const hotelHeaderLine = formatEtappeHotelHeaderLine(
 matchedHotel,
 et,
 hotelStops,
 trip.startDate || "",
 copy
 );
 y = drawEtappeDayHeader(
 doc,
 y,
 dayLabel,
 formatEtappeRouteLabel(et.from, et.to),
 hotelHeaderLine
 );

 const etappeStops = etappeStopsByIndex[i] || [];
 const zwischenRows = buildZwischenstoppRows(
 et,
 etappeStops,
 routedSegmentsByIndex[i],
 copy
 );
 const hasZwischenPanel = zwischenRows.length > 0;

 const rowStartY = y;
 const mapH = 180;
 const mapHotelGap = 14;
 const mapMaxW = hasZwischenPanel ? CONTENT_W * 0.52 : CONTENT_W;
 let mapBlockH = 0;
 let mapW = 0;

 const currentEtappeMap = pdfOpts.etappeMaps ? await ensureEtappeMapData(i) : null;
 if (currentEtappeMap) {
 try {
 const aspect = await getDataUrlAspect(currentEtappeMap);
 mapW = aspect ? Math.min(mapMaxW, mapH * aspect) : mapMaxW;
 doc.addImage(currentEtappeMap, dataUrlFormat(currentEtappeMap), M, rowStartY, mapW, mapH);
 mapBlockH = mapH;
 } catch { /* ignore */ }
 } else if (!hasZwischenPanel) {
 doc.setFont("helvetica", "italic");
 doc.setFontSize(9);
 setColor(doc, GRAY);
 doc.text(copy.etappeMapFail, M, rowStartY + 12);
 mapBlockH = 26;
 }

 if (hasZwischenPanel) {
 const panelX = mapBlockH > 0 ? M + mapW + mapHotelGap : M;
 const panelW = mapBlockH > 0 ? CONTENT_W - mapW - mapHotelGap : CONTENT_W;
 const panelH = drawZwischenstoppsPanel(
 doc,
 panelX,
 rowStartY,
 panelW,
 mapBlockH > 0 ? mapBlockH : mapH,
 zwischenRows,
 copy
 );
 y = rowStartY + Math.max(mapBlockH, panelH) + 15;
 } else {
 y = rowStartY + mapBlockH + 15;
 }

 const segmentIndex = etappen[i].routeSegmentIndex ?? i;
 const discoveries = aiDiscoveriesByEtappe.get(segmentIndex) || [];
 const selectedManualPhotos = trip.pdfPhotosByEtappe?.[String(i)] || [];
 const extraTextEntries = (trip.pdfExtraTextByEtappe?.[String(i)] || []).filter((entry) => (entry?.text || "").trim().length > 0);
 const photoPlacement: PdfPhotoPlacement = trip.pdfPhotoPlacementByEtappe?.[String(i)] || "afterEntdecken";
 const photoLayout: PdfPhotoLayout = trip.pdfPhotoLayoutByEtappe?.[String(i)] || "auto";
 const photoTargetPages = trip.pdfPhotoPagesByEtappe?.[String(i)] || 1;
 const photoLayoutsByPage: PdfPhotoLayout[] = trip.pdfPhotoLayoutsByPageByEtappe?.[String(i)] || [];
 const photoCaptionsByUrl: Record<string, string> = {};
 let renderedManualPhotoPage = false;
 const renderManualPhotoPageIfNeeded = async (target: PdfPhotoPlacement) => {
 if (renderedManualPhotoPage || photoPlacement !== target || selectedManualPhotos.length === 0) return;
 const beforePages = doc.getNumberOfPages();
 if (photoLayoutsByPage.length > 0) {
 await renderManualPhotoPagesByPageLayouts(
 doc,
 selectedManualPhotos,
 photoLayoutsByPage,
 photoLayout,
 photoCaptionsByUrl
 );
 } else {
 await renderManualPhotoPages(
 doc,
 selectedManualPhotos,
 photoLayout,
 photoTargetPages,
 photoCaptionsByUrl
 );
 }
 const afterPages = doc.getNumberOfPages();
 pageNumber += Math.max(0, afterPages - beforePages);
 renderedManualPhotoPage = true;
 };

 const etappeCustomText = (trip.pdfEtappeCustomTextByEtappe?.[String(i)] || "").trim();
 const etappeCustomTextColor = trip.pdfEtappeCustomTextColorByEtappe?.[String(i)] || "#1f2937";
 const etappeCustomTextFontStyle = trip.pdfEtappeCustomTextFontStyleByEtappe?.[String(i)] || "normal";
 let renderedEtappeCustomText = false;
 const renderEtappeCustomTextIfNeeded = (target: PdfPhotoPlacement) => {
 if (renderedEtappeCustomText || !etappeCustomText || photoPlacement !== target) return;
 const customResult = appendPlainMultilineText(doc, etappeCustomText, M, y, CONTENT_W, {
 colorHex: etappeCustomTextColor,
 fontStyle: customTextFontJsPdfStyle(etappeCustomTextFontStyle),
 });
 y = customResult.y;
 pageNumber += customResult.pageBreaks;
 renderedEtappeCustomText = true;
 };

 const renderExtraTextEntriesIfNeeded = async (target: PdfPhotoPlacement) => {
 const entries = extraTextEntries.filter((entry) => (entry.placement || "afterHotel") === target);
 if (entries.length === 0) return;
 if (y > PAGE_H - 120) {
 doc.addPage();
 pageNumber++;
 y = M;
 }
 y = drawSectionTitle(doc, copy.extraText, y, 12);

 for (const entry of entries) {
 if (y > PAGE_H - 120) {
 doc.addPage();
 pageNumber++;
 y = M;
 }
 const title = (entry.title || entry.poiName || copy.entry).trim();
 doc.setFont("helvetica", "bold");
 doc.setFontSize(9);
 setColor(doc, BLACK);
 doc.text(title, M, y);
 y += 10;

 const photoW = 74;
 const photoH = 56;
 const textX = entry.photoDataUrl ? M + photoW + 10 : M;
 const textW = entry.photoDataUrl ? (RIGHT - textX) : CONTENT_W;
 const lines = splitTextLines(doc, (entry.text || "").trim(), textW);
 let blockH = Math.max(14, lines.length * 10);
 if (entry.photoDataUrl) {
 try {
 const img = await loadImageAsDataURL(entry.photoDataUrl);
 if (img) {
 doc.addImage(img, dataUrlFormat(img), M, y, photoW, photoH);
 blockH = Math.max(blockH, photoH);
 }
 } catch {
 // ignore image failures
 }
 }
 doc.setFont("helvetica", "normal");
 doc.setFontSize(9);
 setColor(doc, BLACK);
 if (lines.length > 0) {
 doc.text(lines, textX, y + 9, { maxWidth: textW, align: "justify" });
 }
 y += blockH + 16;
 }
 y += 4;
 };

 await renderManualPhotoPageIfNeeded("afterHotel");
 renderEtappeCustomTextIfNeeded("afterHotel");
 await renderExtraTextEntriesIfNeeded("afterHotel");

 // Legs detail (optional)
 const segmentRows = buildSegmentRows(et, etappeStopsByIndex[i] || [], routedSegmentsByIndex[i]);
 if (pdfOpts.teilstrecken && segmentRows.length > 1) {
 if (y > PAGE_H - 120) {
 doc.addPage();
 pageNumber++;
 y = M;
 }
 y = drawSectionTitle(doc, copy.legs, y, 12);

 const segCardPadX = 10;
 const segCardPadTop = 10;
 const segCardPadBottom = 10;
 const segRowH = 13;
 const segCardH = segCardPadTop + segmentRows.length * segRowH + segCardPadBottom;
 drawSoftCard(doc, M, y, CONTENT_W, segCardH);

 let segY = y + segCardPadTop + 9;
 doc.setFont("helvetica", "normal");
 doc.setFontSize(9);
 setColor(doc, BLACK);

 for (const seg of segmentRows) {
 if (segY > y + segCardH - 4) {
 break;
 }
 const routeLabel = `${seg.from} -> ${seg.to}`;
 doc.text(routeLabel, M + segCardPadX, segY);
 if (typeof seg.distanceMeters === "number" && typeof seg.durationSeconds === "number") {
 const km = Math.round(seg.distanceMeters / 1000);
 const dur = formatDur(seg.durationSeconds);
 doc.text(`${km} km - ${dur}`, RIGHT - segCardPadX, segY, { align: "right" });
 }
 segY += segRowH;
 }
 y += segCardH + 10;
 }

 await renderManualPhotoPageIfNeeded("afterTeilstrecken");
 renderEtappeCustomTextIfNeeded("afterTeilstrecken");
 await renderExtraTextEntriesIfNeeded("afterTeilstrecken");

 // Discoveries selected from "Entdecken" (optional: can be disabled for PDF)
 if (pdfOpts.entdeckenHighlights && discoveries.length > 0) {
 // Extra spacing before "Entdecken Highlights" for readability (approx. 2 blank lines).
 y += 22;
 if (y > PAGE_H - 150) {
 doc.addPage();
 pageNumber++;
 y = M;
 }
 doc.setFont("helvetica", "bold");
 doc.setFontSize(12);
 setColor(doc, BRAND);
 doc.text(copy.discover, M, y);
 doc.setFont("helvetica", "italic");
 doc.setFontSize(8);
 setColor(doc, GRAY);
 doc.text(copy.aiGenerated, M, y + 12);
 y += 26;

 for (const stop of discoveries) {
 const cardPad = 10;
 const photoW = 150;
 const photoH = 112;
 const highlightsInnerPad = 6;
 const titleText = stop.name;

 const key = `${locale}:${normalizePlaceKey(stop.name)}`;
 if (!discoveryInfoCache.has(key)) {
 if (stop.discoveryWikipediaTitle) {
 const exact = await fetchWikipediaSummaryByTitle(stop.discoveryWikipediaTitle, locale, false);
 const intro = exact
 ? await fetchWikipediaIntroByTitle(exact.title || stop.discoveryWikipediaTitle, locale, false)
 : undefined;
 const picked = cleanWikipediaText(intro || exact?.text || "");
 discoveryInfoCache.set(key, {
 text: isWeakWikipediaText(picked) ? undefined : picked,
 photo: exact?.photo,
 });
 } else {
 discoveryInfoCache.set(key, await fetchWikipediaDiscoveryInfo(stop.name, stop.lat, stop.lng, locale));
 }
 }
 const info = discoveryInfoCache.get(key) || {};

 const imageUrl = stop.discoveryPhotoDataUrl || stop.discoveryPhotoUrl || info.photo;
 let discoveryImg: string | null = null;
 if (imageUrl) {
 try {
 discoveryImg = await loadImageAsDataURL(imageUrl);
 } catch {
 discoveryImg = null;
 }
 }

 const innerW = CONTENT_W - cardPad * 2;
 const hasDiscoveryPhoto = !!discoveryImg;
 const textX = M + cardPad;
 const wikiText = normalizeDiscoveryText(info.text || "");
 const stopText = normalizeDiscoveryText(stop.discoveryDescription || "");
 const stopTextUsable = !isWeakDiscoveryBody(stopText);
 const storedLang = stop.discoveryLanguage;
 const localeMatchesStored = storedLang ? storedLang === locale : locale === "de";
 const useStoredText = stopTextUsable && localeMatchesStored;
 const isMapOrBucketPoi =
 stop.discoverySource === "custom" ||
 stop.discoverySource === "google" ||
 stop.discoverySource === "bucket";
 let rawText = "";
 let highlights: string[] = [];
 if (useStoredText && !isMapOrBucketPoi) {
 rawText = trimPoiTextToWordRange(stopText);
 highlights = (stop.discoveryHighlights || []).filter(Boolean).slice(0, 8);
 } else if (wikiText) {
 rawText = trimPoiTextToWordRange(wikiText);
 } else if (isMapOrBucketPoi) {
 rawText = "";
 highlights = [];
 } else {
 if (info.portrait === undefined) {
 const report = await generatePoiReportText({
 name: stop.name,
 category: stop.discoveryCategory,
 wikiGrounding: stopText || undefined,
 plannerHint: stopText || undefined,
 language: asAppLocale(locale),
 });
 discoveryInfoCache.set(key, {
 ...info,
 portrait: report?.text || "",
 portraitHighlights: report?.highlights || [],
 });
 }
 const generated = discoveryInfoCache.get(key);
 rawText = trimPoiTextToWordRange(
 generated?.portrait || (stopTextUsable ? stopText : "")
 );
 highlights = (generated?.portraitHighlights || []).filter(Boolean).slice(0, 8);
 }
 const narrowTextW = Math.max(40, innerW - photoW - POI_PHOTO_GAP);
 const highlightsMeasureW = hasDiscoveryPhoto ? narrowTextW : innerW;
 const highlightsListH =
 highlights.length > 0
 ? measureDiscoveryHighlightsHeight(doc, highlights, highlightsMeasureW, false, highlightsInnerPad)
 : 0;
 const highlightsInnerH =
 highlights.length > 0 ? highlightsInnerPad + POI_HIGHLIGHTS_TITLE_GAP + highlightsListH + highlightsInnerPad : 0;
 const poiLayout = layoutPoiCard(
 doc,
 rawText,
 innerW,
 photoW,
 photoH,
 highlightsInnerH,
 hasDiscoveryPhoto,
 hasDiscoveryPhoto ? 14 : PDF_POI_DESC_MAX_LINES
 );
 const rightColX = textX + photoW + POI_PHOTO_GAP;

 doc.setFont("helvetica", "bold");
 doc.setFontSize(10);
 const titleColW = hasDiscoveryPhoto ? photoW : innerW;
 const titleLines = splitTextLines(doc, titleText, titleColW);
 const titleLineH = 12;
 const titleH = Math.max(titleLineH, titleLines.length * titleLineH);
 const firstLineOffset = 10;
 const leftColH = titleH + (hasDiscoveryPhoto ? 6 + photoH : 0);
 const textVisualH =
 poiLayout.besideLines.length > 0
 ? firstLineOffset + poiLayout.besideTextH
 : poiLayout.fullLines.length > 0
 ? firstLineOffset + poiLayout.fullH
 : 0;
 const highlightsStackH = highlights.length > 0
 ? (textVisualH > 0 ? POI_HIGHLIGHTS_ABOVE_GAP : 0) + highlightsInnerH
 : 0;
 const rightColH = textVisualH + highlightsStackH;
 const rowH = hasDiscoveryPhoto ? Math.max(leftColH, rightColH, 8) : 0;
 const titleBlockH = titleH;
 const bodyContentH = poiLayout.bodyH > 0 ? 9 + poiLayout.bodyH : 0;
 const cardH = hasDiscoveryPhoto
 ? cardPad + rowH + cardPad
 : cardPad + titleBlockH + 6 + Math.max(bodyContentH, 8) + cardPad;

 if (y + cardH > PAGE_H - 40) {
 doc.addPage();
 pageNumber++;
 y = M;
 }

 drawSoftCard(doc, M, y, CONTENT_W, cardH, DISCOVERY_CARD_BG);

 const contentTop = y + cardPad;
 const leftTop = hasDiscoveryPhoto ? contentTop + Math.max(0, (rowH - leftColH) / 2) : contentTop;
 const rightTop = hasDiscoveryPhoto ? contentTop + Math.max(0, (rowH - rightColH) / 2) : contentTop + titleBlockH + 6;
 const photoY = hasDiscoveryPhoto ? leftTop + titleH + 6 : contentTop + titleBlockH + 6;
 const descTextY = hasDiscoveryPhoto
 ? rightTop + (poiLayout.besideLines.length > 0 ? firstLineOffset : 0)
 : rightTop + firstLineOffset;
 const highlightsTop = hasDiscoveryPhoto
 ? rightTop + textVisualH + (highlights.length > 0 && textVisualH > 0 ? POI_HIGHLIGHTS_ABOVE_GAP : 0)
 : descTextY + poiLayout.fullH + POI_HIGHLIGHTS_ABOVE_GAP;

 doc.setFont("helvetica", "bold");
 doc.setFontSize(10);
 setColor(doc, BRAND);
 titleLines.forEach((line, idx) => {
 doc.text(line, textX, leftTop + firstLineOffset + idx * titleLineH);
 });

 if (hasDiscoveryPhoto && discoveryImg) {
 try {
 doc.addImage(discoveryImg, dataUrlFormat(discoveryImg), textX, photoY, photoW, photoH);
 } catch {
 // ignore image errors in PDF rendering
 }
 }

 doc.setFont("helvetica", "normal");
 doc.setFontSize(PDF_POI_DESC_FONT_SIZE);
 setColor(doc, DARK_GRAY);

 if (poiLayout.fullLines.length > 0) {
 drawPoiDescLines(doc, poiLayout.fullLines, textX, descTextY, innerW, false);
 }

 if (poiLayout.besideLines.length > 0) {
 drawPoiDescLines(doc, poiLayout.besideLines, rightColX, descTextY, narrowTextW, false);
 }

 if (highlights.length > 0) {
 const highlightsX = hasDiscoveryPhoto ? rightColX : M + cardPad;
 const highlightsWDraw = hasDiscoveryPhoto ? narrowTextW : innerW;

 drawSoftCard(
 doc,
 highlightsX,
 highlightsTop,
 highlightsWDraw,
 highlightsInnerH,
 POI_HIGHLIGHTS_CARD_BG
 );

 const innerX = highlightsX + highlightsInnerPad;
 const innerWHighlights = highlightsWDraw - highlightsInnerPad * 2;
 let listY = highlightsTop + highlightsInnerPad + 8;
 doc.setFont("helvetica", "bold");
 doc.setFontSize(7.5);
 setColor(doc, BRAND);
 doc.text(copy.sights, innerX, listY);
 listY += POI_HIGHLIGHTS_TITLE_GAP;
 doc.setFont("helvetica", "normal");
 doc.setFontSize(8);
 setColor(doc, BLACK);
 const colGap = 10;
 const colW = (innerWHighlights - colGap) / 2;
 const leftX = innerX;
 const rightX = leftX + colW + colGap;
 const mid = Math.ceil(highlights.length / 2);
 let leftY = listY;
 let rightY = listY;
 for (const h of highlights.slice(0, mid)) {
 const lines = splitTextLines(doc, `• ${h}`, colW);
 doc.text(lines, leftX, leftY);
 leftY += lines.length * 9;
 }
 for (const h of highlights.slice(mid)) {
 const lines = splitTextLines(doc, `• ${h}`, colW);
 doc.text(lines, rightX, rightY);
 rightY += lines.length * 9;
 }
 }

 y += cardH + 10;
 }
 y += 8;
 }

 await renderManualPhotoPageIfNeeded("afterEntdecken");
 renderEtappeCustomTextIfNeeded("afterEntdecken");
 await renderExtraTextEntriesIfNeeded("afterEntdecken");

 // Notes (only on first day page)
 if (trip.notes && i === 0) {
 if (y > PAGE_H - 100) {
 doc.addPage();
 pageNumber++;
 y = M;
 }
 y = drawSectionTitle(doc, copy.notes, y, 12);

 doc.setFont("helvetica", "normal");
 doc.setFontSize(9);
 setColor(doc, BLACK);
 const noteLines = splitTextLines(doc, trip.notes, CONTENT_W);
 for (const line of noteLines) {
 if (y > PAGE_H - 40) {
 doc.addPage();
 pageNumber++;
 y = M;
 }
 doc.text(line, M, y);
 y += 12;
 }
 }

 }

 // Add page numbers + footer to all pages
 const totalPages = doc.getNumberOfPages();
 const printDateLabel = pdfFill(copy.printDate, { date: formatPdfPrintDate(locale) });
 for (let p = 1; p <= totalPages; p++) {
 doc.setPage(p);
 doc.setFont("helvetica", "normal");
 doc.setFontSize(8);
 setColor(doc, GRAY);
 if (p > 1) {
 doc.text(printDateLabel, M, PAGE_H - 25, { align: "left" });
 doc.text(pdfFill(copy.page, { n: p, total: totalPages }), PAGE_W / 2, PAGE_H - 25, { align: "center" });
 doc.setFont("helvetica", "bold");
 doc.setFontSize(8.5);
 const wordmarkW = doc.getTextWidth("Sniffer") + doc.getTextWidth("Trek") + 25;
 drawPdfWordmark(doc, RIGHT - wordmarkW, PAGE_H - 23);
 }
 }

 progress(100, copy.progressDone);
 return doc.output("blob");
}
