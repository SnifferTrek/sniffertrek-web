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
  discoverySource?: "ai" | "custom";
  discoveryEtappeIndex?: number;
  discoveryCategory?: string;
  discoveryDescription?: string;
  discoveryPhotoUrl?: string;
  discoveryPhotoDataUrl?: string;
  discoveryAddedAt?: string;
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

export interface BucketListItem {
  id: string;
  name: string;
  category: string;
  rating: number;
  description: string;
  added: string; // ISO date
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
  | "apartment"
  | "camping"
  | "activities";

export type TransportModule = "route" | "flights" | "car" | "train";

export interface ModuleRoute {
  stops: RouteStop[];
  viaPoints?: ViaPoint[];
  overviewPolyline?: string;
}

export interface TripRoutes {
  route?: ModuleRoute;
  flights?: ModuleRoute;
  car?: ModuleRoute;
  train?: ModuleRoute;
}

export type PdfPhotoPlacement = "afterHotel" | "afterTeilstrecken" | "afterEntdecken";
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
  | "grid"
  | "smartPages";

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
  hotels: PlannedHotel[];
  bucketList: BucketListItem[];
  pdfPhotosByEtappe?: Record<string, string[]>;
  pdfPhotoLibraryByEtappe?: Record<string, string[]>;
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
  pdfPhotoPlacementByEtappe?: Record<string, PdfPhotoPlacement>;
  pdfPhotoLayoutByEtappe?: Record<string, PdfPhotoLayout>;
  pdfPhotoPagesByEtappe?: Record<string, number>;
  pdfOverviewMapStoragePath?: string;
  pdfOverviewMapPublicUrl?: string;
  pdfOverviewMapPreparedAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
