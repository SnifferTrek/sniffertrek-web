/** POIs für interaktive Grandes-Alpes-Karte – Übernachtungen & Pässe. */

export type GrandesAlpesMapPoiDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type GrandesAlpesMapPoiKind = "must" | "nice";

export type GrandesAlpesMapPoi = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  day: GrandesAlpesMapPoiDay;
  kind: GrandesAlpesMapPoiKind;
  tip: string;
};

export const GRANDES_ALPES_MAP_POI_LEGEND = [
  { kind: "must" as const, label: "Must-see", color: "#0071e3" },
  { kind: "nice" as const, label: "Nice-to-see", color: "#86868b" },
] as const;

/** Nord → Süd, Hotels als Must, Pässe dazwischen. */
export const GRANDES_ALPES_MAP_POIS_DETAILED: GrandesAlpesMapPoi[] = [
  {
    id: "geneve",
    name: "Genf",
    lat: 46.2044,
    lng: 6.1432,
    day: 1,
    kind: "nice",
    tip: "Start · See und Flughafen, nicht übernachten",
  },
  {
    id: "aravis",
    name: "Col des Aravis",
    lat: 45.872,
    lng: 6.467,
    day: 1,
    kind: "nice",
    tip: "Erster richtiger Pass · Foto, nicht Hetzen",
  },
  {
    id: "megeve",
    name: "Megève",
    lat: 45.8569,
    lng: 6.6178,
    day: 1,
    kind: "must",
    tip: "1. Nacht · oder Grand-Bornand",
  },
  {
    id: "roselend",
    name: "Cormet de Roselend",
    lat: 45.691,
    lng: 6.691,
    day: 2,
    kind: "must",
    tip: "See und Kehren · langsamer als die Karte sagt",
  },
  {
    id: "val-disere",
    name: "Val-d'Isère",
    lat: 45.4481,
    lng: 6.9802,
    day: 2,
    kind: "must",
    tip: "2. Nacht · oder Séez im Tal",
  },
  {
    id: "iseran",
    name: "Col de l'Iseran",
    lat: 45.417,
    lng: 7.0306,
    day: 3,
    kind: "must",
    tip: "Höchster asphaltierter Pass der Alpen · frisch am Morgen",
  },
  {
    id: "galibier",
    name: "Col du Galibier",
    lat: 45.064,
    lng: 6.4078,
    day: 3,
    kind: "must",
    tip: "Tour-de-France-Pass · Wind, wenig Bäume",
  },
  {
    id: "briancon",
    name: "Briançon",
    lat: 44.8996,
    lng: 6.6435,
    day: 3,
    kind: "must",
    tip: "3. Nacht · Vauban-Altstadt zu Fuss",
  },
  {
    id: "izoard",
    name: "Col d'Izoard",
    lat: 44.8197,
    lng: 6.735,
    day: 4,
    kind: "must",
    tip: "Casse Déserte · kurze Etappe, viel Fotozeit",
  },
  {
    id: "guillestre",
    name: "Guillestre",
    lat: 44.6597,
    lng: 6.6494,
    day: 4,
    kind: "must",
    tip: "4. Nacht · oder Château-Queyras",
  },
  {
    id: "vars",
    name: "Col de Vars",
    lat: 44.537,
    lng: 6.7028,
    day: 5,
    kind: "nice",
    tip: "Übergang ins Ubaye · nicht unterschätzen bei Nebel",
  },
  {
    id: "barcelonnette",
    name: "Barcelonnette",
    lat: 44.3867,
    lng: 6.6528,
    day: 5,
    kind: "must",
    tip: "5. Nacht · mexikanische Villen, früher Abend",
  },
  {
    id: "bonette",
    name: "Cime de la Bonette",
    lat: 44.3211,
    lng: 6.8072,
    day: 6,
    kind: "must",
    tip: "Höchste asphaltierte Strasse Europas · Schleife oben fahren",
  },
  {
    id: "saint-martin-vesubie",
    name: "Saint-Martin-Vésubie",
    lat: 44.0686,
    lng: 7.2564,
    day: 6,
    kind: "must",
    tip: "6. Nacht · Mercantour, letzte Bergnacht",
  },
  {
    id: "turini",
    name: "Col de Turini",
    lat: 43.981,
    lng: 7.392,
    day: 7,
    kind: "nice",
    tip: "Monte-Carlo-Kehren · dann runter ans Meer",
  },
  {
    id: "cannes",
    name: "Cannes",
    lat: 43.5528,
    lng: 7.0174,
    day: 7,
    kind: "must",
    tip: "7. Nacht · Suquet, nicht Croisette-Hetze",
  },
];

export const GRANDES_ALPES_ROUTE_WAYPOINTS = [
  { lat: 46.2044, lng: 6.1432 },
  { lat: 45.8569, lng: 6.6178 },
  { lat: 45.4481, lng: 6.9802 },
  { lat: 45.417, lng: 7.0306 },
  { lat: 45.064, lng: 6.4078 },
  { lat: 44.8996, lng: 6.6435 },
  { lat: 44.8197, lng: 6.735 },
  { lat: 44.3867, lng: 6.6528 },
  { lat: 44.3211, lng: 6.8072 },
  { lat: 44.0686, lng: 7.2564 },
  { lat: 43.5528, lng: 7.0174 },
] as const;
