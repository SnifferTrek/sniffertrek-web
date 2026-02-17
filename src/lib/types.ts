export type TravelMode = "auto" | "zug" | "flug";

export interface RouteStop {
  id: string;
  name: string;
  type: "start" | "stop" | "end";
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
