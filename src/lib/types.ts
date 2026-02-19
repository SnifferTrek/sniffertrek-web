export type TravelMode = "auto" | "zug" | "flug";

export type HotelCategory = "" | "1" | "2" | "3" | "4" | "5";

export interface RouteStop {
  id: string;
  name: string;
  type: "start" | "stop" | "end";
  isHotel?: boolean;
  hotelCheckIn?: string;
  hotelCheckOut?: string;
  hotelNights?: number;
  hotelGuests?: number;
  hotelRooms?: number;
  hotelCategory?: HotelCategory;
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

export interface Trip {
  id: string;
  name: string;
  travelMode: TravelMode;
  stops: RouteStop[];
  startDate: string;
  endDate: string;
  travelers: number;
  hotels: PlannedHotel[];
  bucketList: BucketListItem[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}
