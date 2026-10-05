/** POIs für die interaktive Venedig-Karte – Must-sees & Nice-to-sees. */

export type VeniceMapPoiDay = 1 | 2 | 3;
export type VeniceMapPoiKind = "must" | "nice";

export type VeniceMapPoi = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  day: VeniceMapPoiDay;
  kind: VeniceMapPoiKind;
  tip: string;
};

export const VENICE_MAP_POI_LEGEND = [
  { kind: "must" as const, label: "Must-see", color: "#0071e3" },
  { kind: "nice" as const, label: "Nice-to-see", color: "#86868b" },
] as const;

export const VENICE_MAP_POIS_DETAILED: VeniceMapPoi[] = [
  {
    id: "san-marco",
    name: "San Marco",
    lat: 45.4341,
    lng: 12.3388,
    day: 1,
    kind: "must",
    tip: "Einstieg – früh oder spät, nicht mittags",
  },
  {
    id: "rialto",
    name: "Rialto & Markt",
    lat: 45.438,
    lng: 12.3359,
    day: 1,
    kind: "must",
    tip: "Markt ab 7 Uhr – vor den Gruppen",
  },
  {
    id: "dogenpalast",
    name: "Dogenpalast",
    lat: 45.4337,
    lng: 12.3405,
    day: 2,
    kind: "must",
    tip: "Ticket online – spart die Schlange",
  },
  {
    id: "vaporetto",
    name: "Vaporetto · Linie 1",
    lat: 45.437,
    lng: 12.332,
    day: 2,
    kind: "must",
    tip: "Canal Grande hin & zurück",
  },
  {
    id: "cannaregio",
    name: "Cannaregio",
    lat: 45.445,
    lng: 12.33,
    day: 1,
    kind: "must",
    tip: "Quartier-Tipp – ruhiger als San Marco",
  },
  {
    id: "burano",
    name: "Burano",
    lat: 45.485,
    lng: 12.417,
    day: 3,
    kind: "must",
    tip: "Früh hin – mittags voll",
  },
  {
    id: "salute",
    name: "Santa Maria della Salute",
    lat: 45.4308,
    lng: 12.3347,
    day: 2,
    kind: "nice",
    tip: "Dorsoduro · Kuppel ca. 8 €",
  },
  {
    id: "san-giorgio",
    name: "San Giorgio Maggiore",
    lat: 45.4289,
    lng: 12.3437,
    day: 2,
    kind: "nice",
    tip: "Aussicht per Aufzug · weniger Schlange als Campanile",
  },
  {
    id: "fondamente-nove",
    name: "Fondamente Nove",
    lat: 45.444,
    lng: 12.341,
    day: 1,
    kind: "nice",
    tip: "Abend · Blick über die Lagune",
  },
  {
    id: "murano",
    name: "Murano",
    lat: 45.458,
    lng: 12.352,
    day: 3,
    kind: "nice",
    tip: "Glasbläserei mit Termin",
  },
];

export const VENICE_MAP_POIS = VENICE_MAP_POIS_DETAILED.map((p) => ({
  name: p.name,
  lat: p.lat,
  lng: p.lng,
}));
