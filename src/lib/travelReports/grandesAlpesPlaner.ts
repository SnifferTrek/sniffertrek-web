/**
 * Planer-Vorlage: Route des Grandes Alpes (7 Nächte Genf → Cannes).
 * Deep-Link: /planer?new=1&template=grandes-alpes
 */

import type { RouteStop, Trip, TripModule } from "@/lib/types";
import { createNewTrip } from "@/lib/tripStorage";
import { buildGrandesAlpesHotelSearchWindow } from "@/lib/travelReports/grandesAlpesReport";
import { GRANDES_ALPES_MAP_POIS_DETAILED } from "@/lib/travelReports/grandesAlpesMapPois";

export const GRANDES_ALPES_PLANER_MODULES: TripModule[] = [
  "hotels",
  "car",
  "flights",
  "route",
  "poi",
];

export const GRANDES_ALPES_PLANER_TEMPLATE = "grandes-alpes";

function stopId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function poi(id: string) {
  return GRANDES_ALPES_MAP_POIS_DETAILED.find((p) => p.id === id);
}

export function buildGrandesAlpesRouteStops(checkIn: string): RouteStop[] {
  const geneve = poi("geneve");
  const megeve = poi("megeve");
  const roselend = poi("roselend");
  const valDisere = poi("val-disere");
  const iseran = poi("iseran");
  const galibier = poi("galibier");
  const briancon = poi("briancon");
  const izoard = poi("izoard");
  const guillestre = poi("guillestre");
  const barcelonnette = poi("barcelonnette");
  const bonette = poi("bonette");
  const vesubie = poi("saint-martin-vesubie");
  const cannes = poi("cannes");

  const hotel = (
    id: string,
    name: string,
    lat: number | undefined,
    lng: number | undefined,
    nightOffset: number,
    tip: string,
    type: RouteStop["type"] = "stop",
  ): RouteStop => ({
    id: type === "end" ? "end" : stopId(id),
    name,
    type,
    lat,
    lng,
    isHotel: true,
    hotelCheckIn: addDaysIso(checkIn, nightOffset),
    hotelNights: 1,
    hotelGuests: 2,
    hotelRooms: 1,
    discoveryDescription: tip,
    discoveryIncludeInReport: true,
  });

  const via = (
    id: string,
    name: string,
    lat: number | undefined,
    lng: number | undefined,
    tip: string,
  ): RouteStop => ({
    id: stopId(id),
    name,
    type: "stop",
    lat,
    lng,
    discoveryDescription: tip,
    discoveryIncludeInReport: true,
  });

  const start: RouteStop = {
    id: "start",
    name: "Geneva, Switzerland",
    type: "start",
    lat: geneve?.lat,
    lng: geneve?.lng,
  };

  return [
    start,
    hotel("megeve", "Megève, France", megeve?.lat, megeve?.lng, 0, "1. Nacht · oder Grand-Bornand"),
    via("roselend", "Cormet de Roselend", roselend?.lat, roselend?.lng, "See und Kehren"),
    hotel(
      "val-disere",
      "Val-d'Isère, France",
      valDisere?.lat,
      valDisere?.lng,
      1,
      "2. Nacht · oder Séez",
    ),
    via("iseran", "Col de l'Iseran", iseran?.lat, iseran?.lng, "Morgens · 2770 m"),
    via("galibier", "Col du Galibier", galibier?.lat, galibier?.lng, "Nach Valloire"),
    hotel("briancon", "Briançon, France", briancon?.lat, briancon?.lng, 2, "3. Nacht · Vauban"),
    via("izoard", "Col d'Izoard", izoard?.lat, izoard?.lng, "Casse Déserte"),
    hotel(
      "guillestre",
      "Guillestre, France",
      guillestre?.lat,
      guillestre?.lng,
      3,
      "4. Nacht · oder Château-Queyras",
    ),
    hotel(
      "barcelonnette",
      "Barcelonnette, France",
      barcelonnette?.lat,
      barcelonnette?.lng,
      4,
      "5. Nacht · vor der Bonette",
    ),
    via("bonette", "Cime de la Bonette", bonette?.lat, bonette?.lng, "Schleife oben mitfahren"),
    hotel(
      "vesubie",
      "Saint-Martin-Vésubie, France",
      vesubie?.lat,
      vesubie?.lng,
      5,
      "6. Nacht · letzte Bergnacht",
    ),
    hotel(
      "cannes",
      "Cannes, France",
      cannes?.lat,
      cannes?.lng,
      6,
      "7. Nacht · Suquet",
      "end",
    ),
  ];
}

export function createGrandesAlpesTrip(): Trip {
  const { checkIn, checkOut } = buildGrandesAlpesHotelSearchWindow();
  const stops = buildGrandesAlpesRouteStops(checkIn);
  const base = createNewTrip("Route des Grandes Alpes");
  const briancon = poi("briancon");

  return {
    ...base,
    name: "Route des Grandes Alpes",
    startDate: checkIn,
    endDate: checkOut,
    travelers: 2,
    modules: [...GRANDES_ALPES_PLANER_MODULES],
    stops,
    routes: {
      route: { stops, viaPoints: [] },
      car: { stops: [...stops], viaPoints: [] },
      flights: { stops: [...stops], viaPoints: [] },
    },
    poiSearchRegion: "Alpes, France",
    poiSearchLat: briancon?.lat ?? 44.8996,
    poiSearchLng: briancon?.lng ?? 6.6435,
    poiSearchRadiusKm: 120,
    notes:
      "7 Nächte Genf → Cannes. Pässe statt Autobahn. Iseran und Galibier an einem Tag, Izoard kurz, Bonette extra. Cannes erst am Schluss. Danach: /reisebericht/cote-dazur.",
  };
}

export type GrandesAlpesPlanerHotelSeed = {
  destination: string;
  checkIn: string;
  checkOut: string;
  travelers: number;
  rooms: number;
};

export function getGrandesAlpesPlanerHotelSeed(): GrandesAlpesPlanerHotelSeed {
  const { checkIn } = buildGrandesAlpesHotelSearchWindow();
  return {
    destination: "Megève, France",
    checkIn,
    checkOut: addDaysIso(checkIn, 1),
    travelers: 2,
    rooms: 1,
  };
}

export function buildGrandesAlpesPlanerUrl(): string {
  const params = new URLSearchParams({
    new: "1",
    template: GRANDES_ALPES_PLANER_TEMPLATE,
    name: "Route des Grandes Alpes",
    tab: "hotels",
    hptype: "hotel",
    hdest: "Megève, France",
    modules: GRANDES_ALPES_PLANER_MODULES.join(","),
  });
  const seed = getGrandesAlpesPlanerHotelSeed();
  params.set("hci", seed.checkIn);
  params.set("hco", seed.checkOut);
  params.set("hadults", String(seed.travelers));
  params.set("hrooms", String(seed.rooms));
  return `/planer?${params.toString()}`;
}

export const GRANDES_ALPES_PLANER_HINT =
  "Legt eine Reise an: sieben Hotelnächte Genf → Cannes, Pass-Stopps Iseran, Galibier, Izoard, Bonette – Hotel-Suche Megève vorausgefüllt.";
