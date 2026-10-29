import type { Trip, TripModule, RouteStop } from "@/lib/types";
import { hydrateBookedFlights } from "@/lib/types";
import { getRouteStopsWithBrief } from "@/lib/stopBrief";

const PLANER_DEFAULT_MODULES: TripModule[] = ["route", "hotels", "report", "bucket"];

export type PdfExportPlanContext = {
  etappenCount: number;
  hasRouteInfo: boolean;
};

function tripModules(trip: Trip): TripModule[] {
  const raw = trip.modules?.length ? trip.modules : PLANER_DEFAULT_MODULES;
  return raw as TripModule[];
}

function hasModule(trip: Trip, mod: TripModule): boolean {
  return tripModules(trip).includes(mod);
}

function collectHotelStops(trip: Trip): RouteStop[] {
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

function hasEntdeckenHighlights(trip: Trip): boolean {
  return trip.stops.some((s) => s.type === "stop" && !!s.discoverySource);
}

function hasBookedFlights(trip: Trip): boolean {
  const hydrated = hydrateBookedFlights(trip);
  return (hydrated.bookedFlights?.length ?? 0) > 0;
}

function hasPlannableRoute(ctx: PdfExportPlanContext): boolean {
  return ctx.etappenCount > 0 || ctx.hasRouteInfo;
}

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
  stopBriefs: boolean;
};

export const PDF_EXPORT_OPTION_DEFS: ReadonlyArray<{
  key: keyof PdfExportOptions;
  labelKey: string;
  descKey: string;
  tripField: keyof Trip;
}> = [
  {
    key: "tableOfContents",
    tripField: "pdfIncludeTableOfContents",
    labelKey: "pdf_tableOfContents",
    descKey: "pdfDesc_tableOfContents",
  },
  {
    key: "travelOverview",
    tripField: "pdfIncludeTravelOverview",
    labelKey: "pdf_travelOverview",
    descKey: "pdfDesc_travelOverview",
  },
  {
    key: "accommodations",
    tripField: "pdfIncludeAccommodations",
    labelKey: "pdf_accommodations",
    descKey: "pdfDesc_accommodations",
  },
  {
    key: "flights",
    tripField: "pdfIncludeFlights",
    labelKey: "pdf_flights",
    descKey: "pdfDesc_flights",
  },
  {
    key: "etappeMaps",
    tripField: "pdfIncludeEtappeMaps",
    labelKey: "pdf_etappeMaps",
    descKey: "pdfDesc_etappeMaps",
  },
  {
    key: "teilstrecken",
    tripField: "pdfIncludeTeilstrecken",
    labelKey: "pdf_teilstrecken",
    descKey: "pdfDesc_teilstrecken",
  },
  {
    key: "entdeckenHighlights",
    tripField: "pdfIncludeEntdeckenHighlights",
    labelKey: "pdf_entdeckenHighlights",
    descKey: "pdfDesc_entdeckenHighlights",
  },
  {
    key: "stopBriefs",
    tripField: "pdfIncludeStopBriefs",
    labelKey: "pdf_stopBriefs",
    descKey: "pdfDesc_stopBriefs",
  },
];

/** Ob diese PDF-Sektion für die aktuelle Reise überhaupt Sinn hat (Modul + Daten). */
export function isPdfExportOptionAvailable(
  trip: Trip,
  key: keyof PdfExportOptions,
  ctx: PdfExportPlanContext,
): boolean {
  switch (key) {
    case "tableOfContents":
      return ctx.etappenCount > 0;
    case "travelOverview":
    case "overviewMap":
      return hasModule(trip, "route") && hasPlannableRoute(ctx);
    case "accommodations":
      return hasModule(trip, "hotels") && collectHotelStops(trip).length > 0;
    case "flights":
      return hasModule(trip, "flights") && hasBookedFlights(trip);
    case "etappeMaps":
    case "teilstrecken":
      return hasModule(trip, "route") && ctx.etappenCount > 0;
    case "entdeckenHighlights":
      return hasModule(trip, "poi") && hasEntdeckenHighlights(trip);
    case "stopBriefs":
      return hasModule(trip, "route") && getRouteStopsWithBrief(trip).length > 0;
    default:
      return false;
  }
}

export function getApplicablePdfExportOptionDefs(
  trip: Trip,
  ctx: PdfExportPlanContext,
) {
  return PDF_EXPORT_OPTION_DEFS.filter((def) =>
    isPdfExportOptionAvailable(trip, def.key, ctx),
  );
}

export function resolvePdfExportOptions(
  trip: Trip,
  ctx?: PdfExportPlanContext,
): PdfExportOptions {
  const travelOverviewPref = trip.pdfIncludeTravelOverview !== false;
  const raw: PdfExportOptions = {
    tableOfContents: trip.pdfIncludeTableOfContents !== false,
    overviewMap: travelOverviewPref && trip.pdfIncludeOverviewMap !== false,
    travelOverview: travelOverviewPref,
    accommodations: trip.pdfIncludeAccommodations !== false,
    flights: trip.pdfIncludeFlights !== false,
    etappeMaps: trip.pdfIncludeEtappeMaps !== false,
    teilstrecken: trip.pdfIncludeTeilstrecken !== false,
    entdeckenHighlights: trip.pdfIncludeEntdeckenHighlights !== false,
    stopBriefs: trip.pdfIncludeStopBriefs !== false,
  };
  if (!ctx) return raw;
  const out = { ...raw };
  for (const def of PDF_EXPORT_OPTION_DEFS) {
    if (!isPdfExportOptionAvailable(trip, def.key, ctx)) {
      out[def.key] = false;
    }
  }
  if (!out.travelOverview) {
    out.overviewMap = false;
  }
  return out;
}

export function isPdfExportOptionEnabled(
  trip: Trip,
  key: keyof PdfExportOptions,
  ctx?: PdfExportPlanContext,
): boolean {
  return resolvePdfExportOptions(trip, ctx)[key];
}
