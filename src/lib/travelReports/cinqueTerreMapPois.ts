/** POIs für die interaktive Cinque-Terre-Karte – Must-sees & Nice-to-sees. */

export type CinqueTerreMapPoiDay = 1 | 2 | 3 | 4;
export type CinqueTerreMapPoiKind = "must" | "nice";

export type CinqueTerreMapPoi = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  day: CinqueTerreMapPoiDay;
  kind: CinqueTerreMapPoiKind;
  tip: string;
};

export const CINQUE_TERRE_MAP_POI_LEGEND = [
  { kind: "must" as const, label: "Must-see", color: "#0071e3" },
  { kind: "nice" as const, label: "Nice-to-see", color: "#86868b" },
] as const;

export const CINQUE_TERRE_MAP_POIS_DETAILED: CinqueTerreMapPoi[] = [
  {
    id: "porto-venere",
    name: "Porto Venere",
    lat: 44.0494,
    lng: 9.8343,
    day: 1,
    kind: "must",
    tip: "Basis · Byron-Grotte · Abendspaziergang",
  },
  {
    id: "riomaggiore",
    name: "Riomaggiore",
    lat: 44.0994,
    lng: 9.7377,
    day: 2,
    kind: "must",
    tip: "Via dell'Amore Start · früh",
  },
  {
    id: "manarola",
    name: "Manarola",
    lat: 44.1063,
    lng: 9.7276,
    day: 2,
    kind: "must",
    tip: "Viewpoint · Gelato danach",
  },
  {
    id: "vernazza",
    name: "Vernazza",
    lat: 44.1351,
    lng: 9.6842,
    day: 3,
    kind: "must",
    tip: "Wanderziel · Hafenlunch",
  },
  {
    id: "monterosso",
    name: "Monterosso",
    lat: 44.1456,
    lng: 9.6549,
    day: 3,
    kind: "must",
    tip: "Sandstrand · Zug zurück",
  },
  {
    id: "la-spezia",
    name: "La Spezia",
    lat: 44.1025,
    lng: 9.8242,
    day: 2,
    kind: "nice",
    tip: "Zug-Hub · Cinque Terre Card kaufen",
  },
  {
    id: "palmaria",
    name: "Isola Palmaria",
    lat: 44.042,
    lng: 9.842,
    day: 4,
    kind: "nice",
    tip: "Fähre · leichte Wanderung",
  },
  {
    id: "lerici",
    name: "Lerici",
    lat: 44.0761,
    lng: 9.9112,
    day: 4,
    kind: "nice",
    tip: "Optional · Boot oder Bus",
  },
];
