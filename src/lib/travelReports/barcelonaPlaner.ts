import type { RouteStop, Trip, TripModule } from "@/lib/types";
import { createNewTrip } from "@/lib/tripStorage";

export const BARCELONA_PLANER_MODULES: TripModule[] = ["hotels", "flights", "poi"];

export const BARCELONA_PLANER_TEMPLATE = "barcelona";

export const BARCELONA_POI_CENTER = { lat: 41.3851, lng: 2.1734 } as const;

function addDaysIso(daysAhead: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

export function getBarcelonaPlanerHotelSeed() {
  const checkIn = addDaysIso(14);
  const checkOut = addDaysIso(17); // 3 Nächte
  return {
    destination: "Barcelona, Spanien",
    checkIn,
    checkOut,
    travelers: 2,
    rooms: 1,
  };
}

export function createBarcelonaTrip(): Trip {
  const seed = getBarcelonaPlanerHotelSeed();
  const base = createNewTrip("Barcelona");
  const start: RouteStop = {
    id: "start",
    name: "Barcelona, Spanien",
    type: "start",
    lat: BARCELONA_POI_CENTER.lat,
    lng: BARCELONA_POI_CENTER.lng,
    isHotel: true,
    hotelCheckIn: seed.checkIn,
    hotelNights: 3,
    hotelGuests: 2,
    hotelRooms: 1,
  };
  const end: RouteStop = {
    id: "end",
    name: "Barcelona, Spanien",
    type: "end",
    lat: BARCELONA_POI_CENTER.lat,
    lng: BARCELONA_POI_CENTER.lng,
  };
  const stops = [start, end];

  return {
    ...base,
    name: "Barcelona",
    startDate: seed.checkIn,
    endDate: seed.checkOut,
    travelers: 2,
    modules: [...BARCELONA_PLANER_MODULES],
    stops,
    routes: {
      route: { stops, viaPoints: [] },
      flights: { stops: [...stops], viaPoints: [] },
    },
    poiSearchRegion: "Barcelona",
    poiSearchLat: BARCELONA_POI_CENTER.lat,
    poiSearchLng: BARCELONA_POI_CENTER.lng,
    poiSearchRadiusKm: 15,
    notes:
      "4 Tage ohne Mietauto – Metro T-Casual, Sagrada & Park Güell online buchen, Basis El Born oder Eixample.",
  };
}

export function buildBarcelonaPlanerUrl(): string {
  const seed = getBarcelonaPlanerHotelSeed();
  const params = new URLSearchParams({
    new: "1",
    template: BARCELONA_PLANER_TEMPLATE,
    name: "Barcelona",
    tab: "poi",
    hptype: "hotel",
    hdest: seed.destination,
    hci: seed.checkIn,
    hco: seed.checkOut,
    hadults: String(seed.travelers),
    hrooms: String(seed.rooms),
    modules: BARCELONA_PLANER_MODULES.join(","),
  });
  return `/planer?${params.toString()}`;
}

export const BARCELONA_PLANER_HINT =
  "Legt eine neue Reise «Barcelona» an: Flug, Hotels und POIs – ohne Mietauto-Modul.";
