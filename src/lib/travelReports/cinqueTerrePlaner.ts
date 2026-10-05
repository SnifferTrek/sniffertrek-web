/**
 * Planer-Vorlage: Porto Venere / Cinque Terre (4 Nächte Basis).
 * Deep-Link: /planer?new=1&template=cinque-terre
 */

import type { RouteStop, Trip, TripModule } from "@/lib/types";
import { createNewTrip } from "@/lib/tripStorage";
import { buildCinqueTerreHotelSearchWindow } from "@/lib/travelReports/cinqueTerreReport";
import { CINQUE_TERRE_MAP_POIS_DETAILED } from "@/lib/travelReports/cinqueTerreMapPois";

export const CINQUE_TERRE_PLANER_MODULES: TripModule[] = [
  "hotels",
  "train",
  "route",
  "poi",
];

export const CINQUE_TERRE_PLANER_TEMPLATE = "cinque-terre";

function stopId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Route-Stops aus den Karten-POIs (Tag 1–4), Hotel in Porto Venere. */
export function buildCinqueTerreRouteStops(
  checkIn: string,
  nights = 4
): RouteStop[] {
  const byId = Object.fromEntries(
    CINQUE_TERRE_MAP_POIS_DETAILED.map((p) => [p.id, p])
  );
  const porto = byId["porto-venere"];
  const chain = [
    byId["la-spezia"],
    byId["riomaggiore"],
    byId["manarola"],
    byId["vernazza"],
    byId["monterosso"],
  ].filter(Boolean);

  const start: RouteStop = {
    id: "start",
    name: "Porto Venere, Italien",
    type: "start",
    lat: porto?.lat,
    lng: porto?.lng,
    isHotel: true,
    hotelCheckIn: checkIn,
    hotelNights: nights,
    hotelGuests: 2,
    hotelRooms: 1,
  };

  const midStops = chain.slice(0, -1);
  const last = chain[chain.length - 1];

  const mids: RouteStop[] = midStops.map((p) => ({
    id: stopId(p.id),
    name: p.name,
    type: "stop" as const,
    lat: p.lat,
    lng: p.lng,
    discoveryDescription: p.tip,
    discoveryIncludeInReport: true,
  }));

  const end: RouteStop = {
    id: "end",
    name: last ? `${last.name}, Italien` : "Monterosso al Mare, Italien",
    type: "end",
    lat: last?.lat,
    lng: last?.lng,
  };

  return [start, ...mids, end];
}

export function createCinqueTerreTrip(): Trip {
  const { checkIn, checkOut } = buildCinqueTerreHotelSearchWindow();
  const stops = buildCinqueTerreRouteStops(checkIn, 4);
  const base = createNewTrip("Porto Venere & Cinque Terre");
  const porto = CINQUE_TERRE_MAP_POIS_DETAILED.find((p) => p.id === "porto-venere");

  return {
    ...base,
    name: "Porto Venere & Cinque Terre",
    startDate: checkIn,
    endDate: checkOut,
    travelers: 2,
    modules: [...CINQUE_TERRE_PLANER_MODULES],
    stops,
    routes: {
      route: { stops, viaPoints: [] },
      train: { stops: [...stops], viaPoints: [] },
    },
    poiSearchRegion: "Cinque Terre, Ligurien",
    poiSearchLat: porto?.lat ?? 44.1,
    poiSearchLng: porto?.lng ?? 9.73,
    poiSearchRadiusKm: 30,
    notes:
      "4 Nächte Porto Venere als Basis. Cinque Terre Card für Zug & Wege. Via dell'Amore-Status vorab prüfen.",
  };
}

export type CinqueTerrePlanerHotelSeed = {
  destination: string;
  checkIn: string;
  checkOut: string;
  travelers: number;
  rooms: number;
};

export function getCinqueTerrePlanerHotelSeed(): CinqueTerrePlanerHotelSeed {
  const { checkIn, checkOut } = buildCinqueTerreHotelSearchWindow();
  return {
    destination: "Porto Venere, Italien",
    checkIn,
    checkOut,
    travelers: 2,
    rooms: 1,
  };
}

export function buildCinqueTerrePlanerUrl(): string {
  const params = new URLSearchParams({
    new: "1",
    template: CINQUE_TERRE_PLANER_TEMPLATE,
    name: "Porto Venere & Cinque Terre",
    tab: "hotels",
    hptype: "hotel",
    hdest: "Porto Venere, Italien",
    modules: CINQUE_TERRE_PLANER_MODULES.join(","),
  });
  const seed = getCinqueTerrePlanerHotelSeed();
  params.set("hci", seed.checkIn);
  params.set("hco", seed.checkOut);
  params.set("hadults", String(seed.travelers));
  params.set("hrooms", String(seed.rooms));
  return `/planer?${params.toString()}`;
}

export const CINQUE_TERRE_PLANER_HINT =
  "Legt eine neue Reise an: 4 Nächte Porto Venere, Route über die Dörfer, Zug & Entdecken – Hotel-Suche vorausgefüllt.";
