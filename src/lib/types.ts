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
  | "bucket"
  | "esim"
  | "insurance"
  | "cruise"
  | "lastminute"
  | "apartment"
  | "camping"
  | "activities";

export interface Trip {
  id: string;
  name: string;
  travelMode: TravelMode;
  modules?: TripModule[];
  stops: RouteStop[];
  startDate: string;
  endDate: string;
  travelers: number;
  interests?: TravelInterest[];
  hotels: PlannedHotel[];
  bucketList: BucketListItem[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}
