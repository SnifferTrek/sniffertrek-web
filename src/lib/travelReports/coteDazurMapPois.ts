/** POIs für interaktive Côte-d'Azur-Karte – Must-sees & Nice-to-sees. */

export type CoteDazurMapPoiDay = 1 | 2 | 3 | 4 | 5;
export type CoteDazurMapPoiKind = "must" | "nice";

export type CoteDazurMapPoi = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  day: CoteDazurMapPoiDay;
  kind: CoteDazurMapPoiKind;
  tip: string;
};

export const COTE_DAZUR_MAP_POI_LEGEND = [
  { kind: "must" as const, label: "Must-see", color: "#0071e3" },
  { kind: "nice" as const, label: "Nice-to-see", color: "#86868b" },
] as const;

/**
 * Reihenfolge = sinnvolle Küstenroute (nicht A8).
 * Google Maps: Waypoints zwingen die Strecke über Agay / Estérel.
 */
export const COTE_DAZUR_MAP_POIS_DETAILED: CoteDazurMapPoi[] = [
  {
    id: "nice",
    name: "Nizza",
    lat: 43.7102,
    lng: 7.262,
    day: 1,
    kind: "must",
    tip: "1 Nacht · Ankunft verdauen",
  },
  {
    id: "plage-keller",
    name: "Plage Keller",
    lat: 43.5515,
    lng: 7.1345,
    day: 2,
    kind: "must",
    tip: "Mittagessen am Strand · Cap d'Antibes",
  },
  {
    id: "antibes",
    name: "Antibes · Picasso",
    lat: 43.5804,
    lng: 7.1251,
    day: 2,
    kind: "must",
    tip: "Musée Picasso · Altstadt",
  },
  {
    id: "mougins",
    name: "Mougins",
    lat: 43.6004,
    lng: 6.9956,
    day: 3,
    kind: "must",
    tip: "2 Nächte · Hotel de Mougins / Cannes",
  },
  {
    id: "agay",
    name: "Agay · rote Felsen",
    lat: 43.4317,
    lng: 6.8619,
    day: 4,
    kind: "must",
    tip: "Corniche d'Or / Estérel · nicht A8",
  },
  {
    id: "saint-tropez",
    name: "Saint-Tropez",
    lat: 43.2677,
    lng: 6.6407,
    day: 4,
    kind: "must",
    tip: "Hafen früh · 2 Nächte Region",
  },
  {
    id: "nice-airport",
    name: "Flughafen Nizza",
    lat: 43.6584,
    lng: 7.2159,
    day: 1,
    kind: "nice",
    tip: "Flug + Mietwagen · Anreise aus Italien über A8 ok",
  },
  {
    id: "eze",
    name: "Èze",
    lat: 43.7277,
    lng: 7.3618,
    day: 1,
    kind: "nice",
    tip: "Optional · Les Terrasses d'Èze",
  },
  {
    id: "cannes",
    name: "Cannes",
    lat: 43.5528,
    lng: 7.0174,
    day: 3,
    kind: "nice",
    tip: "Start Corniche d'Or · dem Meer entlang",
  },
  {
    id: "port-grimaud",
    name: "Port Grimaud",
    lat: 43.2728,
    lng: 6.5806,
    day: 4,
    kind: "nice",
    tip: "Kanäle · «kleines Venedig»",
  },
  {
    id: "grimaud",
    name: "Grimaud",
    lat: 43.2742,
    lng: 6.5225,
    day: 5,
    kind: "nice",
    tip: "Burgdorf über dem Golf",
  },
  {
    id: "ramatuelle",
    name: "Ramatuelle",
    lat: 43.2156,
    lng: 6.6122,
    day: 5,
    kind: "nice",
    tip: "Dorf & Strände · Pampelonne",
  },
];

/** Küsten-Waypoints für Google Maps (Cannes → Agay → St-Tropez, ohne Autobahn-Shortcut). */
export const COTE_DAZUR_COASTAL_ROUTE_WAYPOINTS = [
  { id: "cannes", lat: 43.5528, lng: 7.0174 },
  { id: "theoule", lat: 43.506, lng: 6.938, name: "Théoule-sur-Mer" },
  { id: "agay", lat: 43.4317, lng: 6.8619 },
  { id: "sainte-maxime", lat: 43.308, lng: 6.638 },
  { id: "saint-tropez", lat: 43.2677, lng: 6.6407 },
] as const;
