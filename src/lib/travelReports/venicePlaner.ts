/**
 * Planer-Vorlage: Venedig.
 * Deep-Link: /planer?new=1&template=venedig
 */

import type { RouteStop, Trip, TripModule } from "@/lib/types";
import { createNewTrip } from "@/lib/tripStorage";

export const VENICE_PLANER_MODULES: TripModule[] = [
  "hotels",
  "flights",
  "route",
  "poi",
];

export const VENICE_PLANER_TEMPLATE = "venedig";

/** Zentrum Altstadt / San Marco – für Entdecken-Suchgebiet */
export const VENICE_POI_CENTER = { lat: 45.4341, lng: 12.3388 } as const;

export type VenicePlanerHotelSeed = {
  destination: string;
  checkIn: string;
  checkOut: string;
  travelers: number;
  rooms: number;
};

function addDaysIso(daysAhead: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

export function getVenicePlanerHotelSeed(): VenicePlanerHotelSeed {
  const checkIn = addDaysIso(14);
  const checkOut = addDaysIso(17); // 3 Nächte
  return {
    destination: "Venedig, Italien",
    checkIn,
    checkOut,
    travelers: 2,
    rooms: 1,
  };
}

export function createVeniceTrip(): Trip {
  const seed = getVenicePlanerHotelSeed();
  const base = createNewTrip("Venedig");
  const start: RouteStop = {
    id: "start",
    name: "Venedig, Italien",
    type: "start",
    lat: VENICE_POI_CENTER.lat,
    lng: VENICE_POI_CENTER.lng,
    isHotel: true,
    hotelCheckIn: seed.checkIn,
    hotelNights: 3,
    hotelGuests: 2,
    hotelRooms: 1,
  };
  const end: RouteStop = {
    id: "end",
    name: "Venedig, Italien",
    type: "end",
    lat: VENICE_POI_CENTER.lat,
    lng: VENICE_POI_CENTER.lng,
  };
  const stops = [start, end];

  return {
    ...base,
    name: "Venedig",
    startDate: seed.checkIn,
    endDate: seed.checkOut,
    travelers: 2,
    modules: [...VENICE_PLANER_MODULES],
    stops,
    routes: {
      route: { stops, viaPoints: [] },
      flights: { stops: [...stops], viaPoints: [] },
    },
    poiSearchRegion: "Venedig",
    poiSearchLat: VENICE_POI_CENTER.lat,
    poiSearchLng: VENICE_POI_CENTER.lng,
    poiSearchRadiusKm: 25,
    notes: "3 Tage in der Lagune – Tickets online, ACTV-Tageskarte, Quartier abseits San Marco.",
  };
}

export function buildVenicePlanerUrl(): string {
  const seed = getVenicePlanerHotelSeed();
  const params = new URLSearchParams({
    new: "1",
    template: VENICE_PLANER_TEMPLATE,
    name: "Venedig",
    tab: "poi",
    hptype: "hotel",
    hdest: seed.destination,
    hci: seed.checkIn,
    hco: seed.checkOut,
    hadults: String(seed.travelers),
    hrooms: String(seed.rooms),
    modules: VENICE_PLANER_MODULES.join(","),
  });
  return `/planer?${params.toString()}`;
}

export const VENICE_PLANER_HINT =
  "Legt eine neue Reise «Venedig» an: Hotels, Flug, Route und Entdecken mit Suchgebiet Venedig.";
