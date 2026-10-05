import type { RouteStop, Trip, TripModule } from "@/lib/types";
import { createNewTrip } from "@/lib/tripStorage";

export const PROVENCE_PLANER_MODULES: TripModule[] = [
  "route",
  "hotels",
  "poi",
];

export const PROVENCE_PLANER_TEMPLATE = "provence";

const DAY_MS = 86_400_000;

function dateIso(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * DAY_MS).toISOString().slice(0, 10);
}

function stop(
  id: string,
  name: string,
  lat: number,
  lng: number,
  type: RouteStop["type"],
  hotelCheckIn?: string,
  hotelNights?: number,
): RouteStop {
  return {
    id,
    name,
    lat,
    lng,
    type,
    isHotel: Boolean(hotelNights),
    hotelCheckIn,
    hotelNights,
    hotelGuests: 2,
    hotelRooms: 1,
  };
}

export function getProvencePlanerHotelSeed() {
  const checkIn = dateIso(14);
  return {
    destination: "Gordes, Provence, France",
    checkIn,
    checkOut: dateIso(19),
    travelers: 2,
    rooms: 1,
  };
}

export function createProvenceTrip(): Trip {
  const checkIn = dateIso(14);
  const stops: RouteStop[] = [
    stop("start", "Avignon, France", 43.9493, 4.8055, "start", checkIn, 1),
    stop("gordes", "Gordes, France", 43.911, 5.2009, "stop", dateIso(15), 2),
    stop("goult", "Goult, France", 43.8639, 5.2437, "stop"),
    stop("roussillon", "Roussillon, France", 43.902, 5.2931, "stop"),
    stop("saignon", "Saignon, France", 43.8631, 5.4281, "stop"),
    stop("lourmarin", "Lourmarin, France", 43.7637, 5.3626, "stop"),
    stop(
      "aix",
      "Aix-en-Provence, France",
      43.5297,
      5.4474,
      "stop",
      dateIso(17),
      1,
    ),
    stop("valensole", "Valensole, France", 43.8375, 5.9833, "stop"),
    stop(
      "end",
      "Moustiers-Sainte-Marie, France",
      43.8463,
      6.2219,
      "end",
      dateIso(18),
      1,
    ),
  ];
  const base = createNewTrip("Provence");

  return {
    ...base,
    name: "Provence · 5 Nächte",
    startDate: checkIn,
    endDate: dateIso(19),
    travelers: 2,
    modules: [...PROVENCE_PLANER_MODULES],
    stops,
    routes: {
      route: { stops, viaPoints: [] },
    },
    poiSearchRegion: "Provence, France",
    poiSearchLat: 43.77,
    poiSearchLng: 5.45,
    poiSearchRadiusKm: 110,
    notes:
      "Route: Avignon → Luberon → Aix-en-Provence → Valensole → Moustiers-Sainte-Marie. Goult und Saignon sind optionale ruhigere Stopps; nicht beide zusätzlich erzwingen. Valensole ist ausserhalb der Lavendelblüte optional; im Verdon Wetter und Strassenzustand prüfen.",
  };
}

export function buildProvencePlanerUrl(): string {
  const seed = getProvencePlanerHotelSeed();
  const params = new URLSearchParams({
    new: "1",
    template: PROVENCE_PLANER_TEMPLATE,
    name: "Provence",
    tab: "route",
    hptype: "hotel",
    hdest: seed.destination,
    hci: seed.checkIn,
    hco: seed.checkOut,
    hadults: String(seed.travelers),
    hrooms: String(seed.rooms),
    modules: PROVENCE_PLANER_MODULES.join(","),
  });
  return `/planer?${params.toString()}`;
}

export const PROVENCE_PLANER_HINT =
  "Legt eine 5-Nächte-Route mit Hotelstopps in Avignon, Gordes, Aix-en-Provence und Moustiers-Sainte-Marie an.";
