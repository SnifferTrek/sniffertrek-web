import type { Trip } from "@/lib/types";

/** Welche PDF-Abschnitte exportiert werden (Standard: alles an). */
export type PdfExportOptions = {
 tableOfContents: boolean;
 overviewMap: boolean;
 travelOverview: boolean;
 accommodations: boolean;
 flights: boolean;
 etappeMaps: boolean;
 teilstrecken: boolean;
 entdeckenHighlights: boolean;
};

export const PDF_EXPORT_OPTION_DEFS: ReadonlyArray<{
 key: keyof PdfExportOptions;
 label: string;
 description: string;
 tripField: keyof Trip;
}> = [
 {
 key: "tableOfContents",
 tripField: "pdfIncludeTableOfContents",
 label: "Inhaltsverzeichnis",
 description: "Seite 2 nach dem Deckblatt, Inhalt ab Seite 3",
 },
 {
 key: "travelOverview",
 tripField: "pdfIncludeTravelOverview",
 label: "Reiseübersicht",
 description: "Daten, Etappenliste und Übersichtskarte der Gesamtroute",
 },
 {
 key: "accommodations",
 tripField: "pdfIncludeAccommodations",
 label: "Unterkünfte",
 description: "Hotelübersicht mit Buchungsstatus",
 },
 {
 key: "flights",
 tripField: "pdfIncludeFlights",
 label: "Flüge",
 description: "Gebuchte Flüge aus dem Flug-Tab",
 },
 {
 key: "etappeMaps",
 tripField: "pdfIncludeEtappeMaps",
 label: "Detailkarten",
 description: "Karte pro Etappe im Tagesabschnitt",
 },
 {
 key: "teilstrecken",
 tripField: "pdfIncludeTeilstrecken",
 label: "Teilstrecken",
 description: "km und Fahrzeit je Abschnitt",
 },
 {
 key: "entdeckenHighlights",
 tripField: "pdfIncludeEntdeckenHighlights",
 label: "Entdecken-Highlights",
 description: "POIs aus dem Tab Entdecken",
 },
];

export function resolvePdfExportOptions(trip: Trip): PdfExportOptions {
 const travelOverview = trip.pdfIncludeTravelOverview !== false;
 return {
 tableOfContents: trip.pdfIncludeTableOfContents !== false,
 overviewMap: travelOverview && trip.pdfIncludeOverviewMap !== false,
 travelOverview,
 accommodations: trip.pdfIncludeAccommodations !== false,
 flights: trip.pdfIncludeFlights !== false,
 etappeMaps: trip.pdfIncludeEtappeMaps !== false,
 teilstrecken: trip.pdfIncludeTeilstrecken !== false,
 entdeckenHighlights: trip.pdfIncludeEntdeckenHighlights !== false,
 };
}

export function isPdfExportOptionEnabled(trip: Trip, key: keyof PdfExportOptions): boolean {
 return resolvePdfExportOptions(trip)[key];
}
