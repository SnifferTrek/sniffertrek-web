/**
 * Planer-Vorlage: Côte d'Azur (gestaffelte Nächte, Auto, Küste statt A8).
 * Deep-Link: /planer?new=1&template=cote-dazur
 */

import type { RouteStop, Trip, TripModule } from "@/lib/types";
import { createNewTrip } from "@/lib/tripStorage";
import { buildCoteDazurHotelSearchWindow } from "@/lib/travelReports/coteDazurReport";
import { COTE_DAZUR_MAP_POIS_DETAILED } from "@/lib/travelReports/coteDazurMapPois";

export const COTE_DAZUR_PLANER_MODULES: TripModule[] = [
  "hotels",
  "car",
  "flights",
  "route",
  "poi",
];

export const COTE_DAZUR_PLANER_TEMPLATE = "cote-dazur";

function stopId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Route entlang der Küste: … Cannes → Agay (rote Felsen) → St-Tropez-Region. Ende Ramatuelle. */
export function buildCoteDazurRouteStops(
  checkIn: string,
  nights = 2,
): RouteStop[] {
  const byId = Object.fromEntries(
    COTE_DAZUR_MAP_POIS_DETAILED.map((p) => [p.id, p]),
  );
  const nice = byId["nice"];
  const chain = [
    byId["plage-keller"],
    byId["antibes"],
    byId["cannes"],
    byId["mougins"],
    byId["agay"],
    byId["saint-tropez"],
    byId["port-grimaud"],
    byId["grimaud"],
    byId["ramatuelle"],
  ].filter(Boolean);

  const start: RouteStop = {
    id: "start",
    name: "Nice, France",
    type: "start",
    lat: nice?.lat,
    lng: nice?.lng,
    isHotel: true,
    hotelCheckIn: checkIn,
    hotelNights: 1,
    hotelGuests: 2,
    hotelRooms: 1,
  };

  const mougins = byId["mougins"];
  const midCore: RouteStop[] = [
    {
      id: stopId("mougins"),
      name: "Mougins, France",
      type: "stop" as const,
      lat: mougins?.lat,
      lng: mougins?.lng,
      isHotel: true,
      hotelCheckIn: checkIn,
      hotelNights: nights,
      hotelGuests: 2,
      hotelRooms: 1,
      discoveryDescription: "2 Nächte · Hotel de Mougins oder Cannes",
      discoveryIncludeInReport: true,
    },
  ];

  const rest = chain
    .filter((p) => p.id !== "mougins" && p.id !== "ramatuelle")
    .map((p) => ({
      id: stopId(p.id),
      name: p.name,
      type: "stop" as const,
      lat: p.lat,
      lng: p.lng,
      discoveryDescription: p.tip,
      discoveryIncludeInReport: true,
    }));

  const ramatuelle = byId["ramatuelle"];
  const end: RouteStop = {
    id: "end",
    name: ramatuelle ? `${ramatuelle.name}, France` : "Ramatuelle, France",
    type: "end",
    lat: ramatuelle?.lat ?? 43.2156,
    lng: ramatuelle?.lng ?? 6.6122,
  };

  return [start, ...midCore, ...rest, end];
}

export function createCoteDazurTrip(): Trip {
  const { checkIn, checkOut } = buildCoteDazurHotelSearchWindow();
  const stops = buildCoteDazurRouteStops(checkIn, 2);
  const base = createNewTrip("Côte d'Azur");
  const mougins = COTE_DAZUR_MAP_POIS_DETAILED.find((p) => p.id === "mougins");

  return {
    ...base,
    name: "Côte d'Azur",
    startDate: checkIn,
    endDate: checkOut,
    travelers: 2,
    modules: [...COTE_DAZUR_PLANER_MODULES],
    stops,
    routes: {
      route: { stops, viaPoints: [] },
      car: { stops: [...stops], viaPoints: [] },
      flights: { stops: [...stops], viaPoints: [] },
    },
    poiSearchRegion: "Côte d'Azur, France",
    poiSearchLat: mougins?.lat ?? 43.6004,
    poiSearchLng: mougins?.lng ?? 6.9956,
    poiSearchRadiusKm: 90,
    notes:
      "5 Nächte gestaffelt. Plage Keller. Corniche d'Or Cannes–Agay (rote Felsen) – nicht A8. Port Grimaud, Grimaud, Ramatuelle. Anschliessend: /reisebericht/provence.",
  };
}

export type CoteDazurPlanerHotelSeed = {
  destination: string;
  checkIn: string;
  checkOut: string;
  travelers: number;
  rooms: number;
};

export function getCoteDazurPlanerHotelSeed(): CoteDazurPlanerHotelSeed {
  const { checkIn, checkOut } = buildCoteDazurHotelSearchWindow();
  return {
    destination: "Mougins, France",
    checkIn,
    checkOut,
    travelers: 2,
    rooms: 1,
  };
}

export function buildCoteDazurPlanerUrl(): string {
  const params = new URLSearchParams({
    new: "1",
    template: COTE_DAZUR_PLANER_TEMPLATE,
    name: "Côte d'Azur",
    tab: "hotels",
    hptype: "hotel",
    hdest: "Mougins, France",
    modules: COTE_DAZUR_PLANER_MODULES.join(","),
  });
  const seed = getCoteDazurPlanerHotelSeed();
  params.set("hci", seed.checkIn);
  params.set("hco", seed.checkOut);
  params.set("hadults", String(seed.travelers));
  params.set("hrooms", String(seed.rooms));
  return `/planer?${params.toString()}`;
}

export const COTE_DAZUR_PLANER_HINT =
  "Legt eine Reise an: gestaffelte Nächte, Küstenroute über Agay (rote Felsen) statt Autobahn – Hotel-Suche Mougins vorausgefüllt.";
