/** POIs für die interaktive Barcelona-Karte – Must-sees & Nice-to-sees. */

export type BarcelonaMapPoiDay = 1 | 2 | 3 | 4;
export type BarcelonaMapPoiKind = "must" | "nice";

export type BarcelonaMapPoi = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  day: BarcelonaMapPoiDay;
  kind: BarcelonaMapPoiKind;
  tip: string;
};

export const BARCELONA_MAP_POI_LEGEND = [
  { kind: "must" as const, label: "Must-see", color: "#0071e3" },
  { kind: "nice" as const, label: "Nice-to-see", color: "#86868b" },
] as const;

export const BARCELONA_MAP_POIS_DETAILED: BarcelonaMapPoi[] = [
  {
    id: "sagrada",
    name: "Sagrada Família",
    lat: 41.4036,
    lng: 2.1744,
    day: 2,
    kind: "must",
    tip: "Online-Zeitfenster Pflicht",
  },
  {
    id: "park-guell",
    name: "Park Güell",
    lat: 41.4145,
    lng: 2.1527,
    day: 3,
    kind: "must",
    tip: "Erster Slot morgens",
  },
  {
    id: "gothic",
    name: "Barri Gòtic",
    lat: 41.3839,
    lng: 2.1763,
    day: 1,
    kind: "must",
    tip: "Kathedrale & Plaça del Rei früh",
  },
  {
    id: "passeig",
    name: "Passeig de Gràcia",
    lat: 41.3917,
    lng: 2.1649,
    day: 2,
    kind: "must",
    tip: "Casa Batlló · La Pedrera",
  },
  {
    id: "picasso",
    name: "Museu Picasso",
    lat: 41.3851,
    lng: 2.1809,
    day: 4,
    kind: "must",
    tip: "Ticket vorab · El Born",
  },
  {
    id: "barceloneta",
    name: "Barceloneta",
    lat: 41.3788,
    lng: 2.189,
    day: 4,
    kind: "must",
    tip: "Strand · Hafenpromenade",
  },
  {
    id: "montjuic",
    name: "Montjuïc",
    lat: 41.3634,
    lng: 2.1587,
    day: 3,
    kind: "nice",
    tip: "Miró · Aussicht · optional",
  },
  {
    id: "gracia",
    name: "Gràcia",
    lat: 41.4036,
    lng: 2.1564,
    day: 3,
    kind: "nice",
    tip: "Plaça del Sol · Abende",
  },
  {
    id: "boqueria",
    name: "La Boquería",
    lat: 41.3816,
    lng: 2.1715,
    day: 1,
    kind: "nice",
    tip: "Markt vor 9 Uhr",
  },
  {
    id: "palau",
    name: "Palau de la Música",
    lat: 41.3875,
    lng: 2.1752,
    day: 1,
    kind: "nice",
    tip: "Innenführung bei Regen",
  },
  {
    id: "santa-maria",
    name: "Santa Maria del Mar",
    lat: 41.3839,
    lng: 2.1821,
    day: 1,
    kind: "nice",
    tip: "Gotik im Born · ruhiger als die Kathedrale",
  },
  {
    id: "bunkers",
    name: "Bunkers del Carmel",
    lat: 41.4189,
    lng: 2.1608,
    day: 3,
    kind: "nice",
    tip: "Sonnenuntergang · gratis Aussicht",
  },
];

export const BARCELONA_MAP_POIS = BARCELONA_MAP_POIS_DETAILED.map((p) => ({
  name: p.name,
  lat: p.lat,
  lng: p.lng,
}));
