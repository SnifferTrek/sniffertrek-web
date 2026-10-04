export type TravelMode = "auto";

export interface RouteStop {
 id: string;
 name: string;
 type: "start" | "stop" | "end";
 lat?: number;
 lng?: number;
 isHotel?: boolean;
 hotelCheckIn?: string;
 hotelNights?: number;
 hotelGuests?: number;
 hotelRooms?: number;
 bookingHotelName?: string;
 bookingAddress?: string;
 bookingConfirmation?: string;
 bookingPrice?: string;
 bookingLink?: string;
 bookingProvider?: string;
 /** Manuell vom Nutzer gesetzt – unabhängig von Buchungsformular. */
 hotelBooked?: boolean;
 discoverySource?: "ai" | "custom" | "google" | "bucket";
 discoveryEtappeIndex?: number;
 discoveryCategory?: string;
 discoveryDescription?: string;
 /** Sprache, in der description/highlights erzeugt wurden. */
 discoveryLanguage?: "de" | "en" | "es";
 /** Wichtigste Sehenswürdigkeiten (KI, max. 10). */
 discoveryHighlights?: string[];
 discoveryPhotoUrl?: string;
 discoveryPhotoDataUrl?: string;
 discoveryWikipediaTitle?: string;
 discoveryIncludeInReport?: boolean;
 /** false = nur Entdecken/PDF, nicht in der Autofahrt. undefined/true = in der Route. */
 discoveryInRoute?: boolean;
 discoveryAddedAt?: string;
}

/** Start/Ziel immer; Zwischenstopps nur wenn nicht als Nur-POI markiert. */
export function isDrivingRouteStop(stop: Pick<RouteStop, "type" | "discoveryInRoute">): boolean {
 if (stop.type === "start" || stop.type === "end") return true;
 return stop.discoveryInRoute !== false;
}

export interface ViaPoint {
 id: string;
 lat: number;
 lng: number;
 afterStopId?: string;
}

export interface RouteLegInfo {
 from: string;
 to: string;
 distanceMeters: number;
 durationSeconds: number;
}

export interface Etappe {
 index: number;
 label: string;
 from: string;
 to: string;
 legs: RouteLegInfo[];
 distanceKm: number;
 durationFormatted: string;
 hotelBooked?: boolean;
 hotelName?: string;
 hotelAddress?: string;
 hotelNights?: number;
 /** Index des zugehörigen Streckenabschnitts (für discoveryEtappeIndex-Zuordnung bei Aufenthalts-Etappen). */
 routeSegmentIndex?: number;
}

export interface PlannedHotel {
 id: string;
 name: string;
 location: string;
 stars: number;
 rating: number;
 pricePerNight: number;
 currency: string;
 provider: string;
 checkIn: string;
 checkOut: string;
 affiliateUrl?: string;
}

/** Gebuchte Flugverbindung für Planer + Reisebericht. */
export interface BookedFlight {
 id: string;
 /** Hin-, Rückflug oder Zwischenflug */
 direction?: "outbound" | "return" | "other";
 airline?: string;
 flightNumber?: string;
 departureAirport?: string;
 arrivalAirport?: string;
 departureDate?: string;
 departureTime?: string;
 arrivalDate?: string;
 arrivalTime?: string;
 confirmation?: string;
 bookingPrice?: string;
 bookingProvider?: string;
 bookingLink?: string;
 notes?: string;
}

export interface BucketListItem {
 id: string;
 name: string;
 category: string;
 rating: number;
 description: string;
 added: string; // ISO date
 lat?: number;
 lng?: number;
 wikipediaTitle?: string;
}

export type TravelInterest =
 | "kultur"
 | "natur"
 | "kulinarik"
 | "straende"
 | "fotospots"
 | "familien"
 | "abenteuer"
 | "shopping";

export interface AiPoiSuggestion {
 name: string;
 description: string;
 category: string;
 detourMinutes?: number;
 lat?: number;
 lng?: number;
 etappeIndex: number;
 highlights?: string[];
}

export type TripModule =
 | "route"
 | "flights"
 | "hotels"
 | "car"
 | "train"
 | "poi"
 | "report"
 | "bucket"
 | "esim"
 | "droneMaps"
 | "insurance"
 | "cruise"
 | "lastminute"
 | "veloSchweiz"
 | "apartment"
 | "camping"
 | "activities";

export type TransportModule = "route" | "flights" | "car" | "train";

export interface ModuleRoute {
 stops: RouteStop[];
 viaPoints?: ViaPoint[];
 overviewPolyline?: string;
}

/** Persistiert mit der Reise (lokal + in routes-JSON für Cloud). */
export interface TripRoutingOptions {
 avoidHighways?: boolean;
 avoidTolls?: boolean;
 avoidFerries?: boolean;
 distanceUnit?: "auto" | "km" | "mi";
}

export interface TripRoutes {
 route?: ModuleRoute;
 flights?: ModuleRoute;
 car?: ModuleRoute;
 train?: ModuleRoute;
 /** Autoroute-Optionen – überlebt Cloud-Sync ohne extra DB-Spalten */
 routingOptions?: TripRoutingOptions;
 /** Gebuchte Flüge – in routes-JSON für Cloud ohne neue Spalte */
 bookedFlights?: BookedFlight[];
}

export type PdfPhotoPlacement = "afterHotel" | "afterTeilstrecken" | "afterEntdecken";
export type PdfEtappeCustomTextFontStyle = "normal" | "bold" | "italic" | "bolditalic";

export function resolveCustomTextFontParts(
 style?: PdfEtappeCustomTextFontStyle
): { bold: boolean; italic: boolean } {
 switch (style) {
 case "bold":
 return { bold: true, italic: false };
 case "italic":
 return { bold: false, italic: true };
 case "bolditalic":
 return { bold: true, italic: true };
 default:
 return { bold: false, italic: false };
 }
}

export function customTextFontFromParts(
 bold: boolean,
 italic: boolean
): PdfEtappeCustomTextFontStyle {
 if (bold && italic) return "bolditalic";
 if (bold) return "bold";
 if (italic) return "italic";
 return "normal";
}

export function setCustomTextBold(
 current: PdfEtappeCustomTextFontStyle | undefined,
 bold: boolean
): PdfEtappeCustomTextFontStyle {
 const { italic } = resolveCustomTextFontParts(current);
 return customTextFontFromParts(bold, italic);
}

export function toggleCustomTextItalic(
 current: PdfEtappeCustomTextFontStyle | undefined
): PdfEtappeCustomTextFontStyle {
 const parts = resolveCustomTextFontParts(current);
 return customTextFontFromParts(parts.bold, !parts.italic);
}

export function customTextFontJsPdfStyle(
 style?: PdfEtappeCustomTextFontStyle
): "normal" | "bold" | "italic" | "bolditalic" {
 const parts = resolveCustomTextFontParts(style);
 return customTextFontFromParts(parts.bold, parts.italic);
}
export type PdfPhotoLayout =
 | "auto"
 | "onePerPageMax"
 | "onePortraitTopHalf"
 | "onePortraitBottomHalf"
 | "twoPortraitSideBySide"
 | "twoPortraitStacked"
 | "twoMixedStacked"
 | "sixPortraitGrid"
 | "threePortraitOneLandscape"
 | "twoPortraitTopOneLandscapeBottom"
 | "oneLandscapeTopTwoPortraitBottom"
 | "grid"
 | "smartPages";

export type PdfCoverExtraTextPlacement = "bottom" | "middle" | "afterDate" | "beforeDate";

export type TripShareRole = "owner" | "viewer" | "editor";

export interface PdfExtraTextEntry {
 id: string;
 placement: PdfPhotoPlacement;
 title?: string;
 text: string;
 photoDataUrl?: string;
 poiName?: string;
 poiDescription?: string;
 source?: "free" | "poi";
 createdAt: string;
}

export interface Trip {
 id: string;
 name: string;
 travelMode: TravelMode;
 modules?: TripModule[];
 stops: RouteStop[];
 routes?: TripRoutes;
 startDate: string;
 endDate: string;
 travelers: number;
 interests?: TravelInterest[];
 /** Entdecken: Suchort für KI / Google Places */
 poiSearchRegion?: string;
 poiSearchLat?: number;
 poiSearchLng?: number;
 /** Entdecken: Umkreis in km (Standard 25) */
 poiSearchRadiusKm?: number;
 hotels: PlannedHotel[];
 /** Gebuchte Flüge (auch in routes.bookedFlights für Cloud) */
 bookedFlights?: BookedFlight[];
 bucketList: BucketListItem[];
 pdfPhotosByEtappe?: Record<string, string[]>;
 pdfPhotoLibraryByEtappe?: Record<string, string[]>;
 /** Etappen-Key → Foto-URL → Beschriftung unter dem Bild im PDF */
 pdfPhotoCaptionsByEtappe?: Record<string, Record<string, string>>;
 pdfCoverPhotoDataUrl?: string;
 pdfCoverPhotoStyle?: "background" | "belowTitle";
 pdfCoverTitleColor?: string;
 pdfCoverTitleSize?: number;
 pdfCoverTitleFont?: "helvetica" | "times" | "courier";
 pdfCoverTitleAlign?: "left" | "center" | "right";
 pdfCoverDateColor?: string;
 pdfCoverDateSize?: number;
 pdfCoverDateFont?: "helvetica" | "times" | "courier";
 pdfCoverDateAlign?: "left" | "center" | "right";
 pdfCoverExtraText?: string;
 pdfCoverExtraTextColor?: string;
 pdfCoverExtraTextSize?: number;
 pdfCoverExtraTextFont?: "helvetica" | "times" | "courier";
 pdfCoverExtraTextAlign?: "left" | "center" | "right";
 pdfCoverExtraTextPlacement?: PdfCoverExtraTextPlacement;
 pdfPhotoPlacementByEtappe?: Record<string, PdfPhotoPlacement>;
 pdfPhotoLayoutByEtappe?: Record<string, PdfPhotoLayout>;
 pdfPhotoLayoutsByPageByEtappe?: Record<string, PdfPhotoLayout[]>;
 pdfPhotoPagesByEtappe?: Record<string, number>;
 pdfExtraTextByEtappe?: Record<string, PdfExtraTextEntry[]>;
 /** Freitext pro Etappe — Position über pdfPhotoPlacementByEtappe */
 pdfEtappeCustomTextByEtappe?: Record<string, string>;
 pdfEtappeCustomTextColorByEtappe?: Record<string, string>;
 pdfEtappeCustomTextFontStyleByEtappe?: Record<string, PdfEtappeCustomTextFontStyle>;
 pdfIncludeEntdeckenHighlights?: boolean;
 pdfIncludeTableOfContents?: boolean;
 pdfIncludeOverviewMap?: boolean;
 pdfIncludeTravelOverview?: boolean;
 pdfIncludeAccommodations?: boolean;
 /** Reisebericht: gebuchte Flüge */
 pdfIncludeFlights?: boolean;
 pdfIncludeEtappeMaps?: boolean;
 pdfIncludeTeilstrecken?: boolean;
 pdfOverviewMapStoragePath?: string;
 pdfOverviewMapPublicUrl?: string;
 pdfOverviewMapPreparedAt?: string;
 notes: string;
 /** Autoroute: Autobahnen vermeiden */
 routeAvoidHighways?: boolean;
 /** Autoroute: Maut vermeiden */
 routeAvoidTolls?: boolean;
 /** Autoroute: Fähren vermeiden */
 routeAvoidFerries?: boolean;
 /** Autoroute: Entfernungseinheit in der Anzeige */
 routeDistanceUnit?: "auto" | "km" | "mi";
 /** Cloud-Besitzer (bei geteilten Reisen ≠ aktueller User) */
 cloudOwnerId?: string;
 /** Freigabe-Rolle lokal; owner = eigene Reise */
 shareRole?: TripShareRole;
 createdAt: string;
 updatedAt: string;
}

/** Liest gebuchte Flüge aus Trip-Feld oder routes.bookedFlights. */
export function hydrateBookedFlights(trip: Trip): Trip {
 const fromTrip = Array.isArray(trip.bookedFlights) ? trip.bookedFlights : [];
 const fromRoutes = Array.isArray(trip.routes?.bookedFlights)
 ? trip.routes!.bookedFlights!
 : [];
 const bookedFlights = fromTrip.length > 0 ? fromTrip : fromRoutes;
 return {
 ...trip,
 bookedFlights,
 routes: {
 ...(trip.routes || {}),
 bookedFlights,
 },
 };
}

/** Liest Routenoptionen aus Trip-Feldern oder routes.routingOptions. */
export function hydrateTripRoutingOptions(trip: Trip): Trip {
 const opts = trip.routes?.routingOptions;
 const hasTop =
 trip.routeAvoidHighways != null ||
 trip.routeAvoidTolls != null ||
 trip.routeAvoidFerries != null ||
 trip.routeDistanceUnit != null;
 if (hasTop) {
 return {
 ...trip,
 routes: {
 ...(trip.routes || {}),
 routingOptions: {
 avoidHighways: !!trip.routeAvoidHighways,
 avoidTolls: !!trip.routeAvoidTolls,
 avoidFerries: !!trip.routeAvoidFerries,
 distanceUnit: trip.routeDistanceUnit || "auto",
 },
 },
 };
 }
 if (!opts) return trip;
 return {
 ...trip,
 routeAvoidHighways: !!opts.avoidHighways,
 routeAvoidTolls: !!opts.avoidTolls,
 routeAvoidFerries: !!opts.avoidFerries,
 routeDistanceUnit: opts.distanceUnit || "auto",
 };
}
