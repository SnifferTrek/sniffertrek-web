import { inspirationPhoto } from "@/lib/inspirationDestinations";
import type { GeoRoutePoint } from "@/lib/v2MapProjection";

const COTE_DAZUR_PHOTOS = {
  hero: {
    url: inspirationPhoto("1643914729809-4aa59fdc4c17", 2000),
    alt: "Nizza von oben – Baie des Anges und Promenade des Anglais",
  },
  nice: {
    url: inspirationPhoto("1694725330422-64ed85b9f26e", 1800),
    alt: "Promenade des Anglais in Nizza mit Palmen und Kieselstrand",
  },
  cannes: {
    url: inspirationPhoto("1677182302564-ffc6bb3252cd", 1800),
    alt: "Cannes – Yachthafen und Altstadt Suquet mit Turm",
  },
  coast: {
    url: inspirationPhoto("1703152792682-a1fe5f3dedb4", 1600),
    alt: "Küstenstrasse an der Riviera – bunte Häuser direkt am Meer",
  },
} as const;

export const V2_PLAN_HREF = "/reise-planen";
export const V2_TRIPS_HREF = "/meine-reisen";
export const V2_IDEAS_HREF = "/unsere-reisen";
export const V2_DESTINATIONS_HREF = "/inspiration";
export const V2_HOW_HREF = "/info#how-it-works";
export const V2_EXAMPLE_HREF = "/unsere-reisen#cote-dazur";

const STOP_PHOTOS = {
  Zurich: inspirationPhoto("1524661132064-de39d336c57d", 240),
  Nice: COTE_DAZUR_PHOTOS.nice.url,
  Cannes: COTE_DAZUR_PHOTOS.cannes.url,
  SaintTropez: COTE_DAZUR_PHOTOS.coast.url,
} as const;

/** Reale Koordinaten – Côte-d'Azur-Beispielroute */
export const V2_ROUTE_GEO: GeoRoutePoint[] = [
  { name: "Zürich", lat: 47.3769, lng: 8.5417, kind: "origin" },
  { name: "Nizza", lat: 43.7102, lng: 7.262, kind: "stop" },
  { name: "Cannes", lat: 43.5528, lng: 7.0174, kind: "stop" },
  { name: "Saint-Tropez", lat: 43.2677, lng: 6.6407, kind: "stop" },
];

export const V2_DEMO_TRIP = {
  title: "Côte d'Azur",
  meta: "5 Nächte · Roadtrip",
  corridor: "Zürich → Nizza → Cannes → Saint-Tropez",
  origin: "Zürich",
  selectedStop: "Nizza",
  distance: "ca. 720 km",
  duration: "5 Nächte",
  savedPlaces: 5,
  stops: [
    { name: "Zürich", nights: 0, kind: "origin" as const, subtitle: "Abfahrt", photo: STOP_PHOTOS.Zurich },
    { name: "Nizza", nights: 2, kind: "stop" as const, subtitle: "2 Nächte", photo: STOP_PHOTOS.Nice },
    { name: "Cannes", nights: 1, kind: "stop" as const, subtitle: "1 Nacht", photo: STOP_PHOTOS.Cannes },
    { name: "Saint-Tropez", nights: 2, kind: "stop" as const, subtitle: "2 Nächte", photo: STOP_PHOTOS.SaintTropez },
  ],
  selected: {
    name: "Nizza",
    nightsLabel: "2 Nächte",
    photo: STOP_PHOTOS.Nice,
    photoAlt: COTE_DAZUR_PHOTOS.nice.alt,
    summary: "Erste Basis an der Riviera – Cours Saleya, Altstadt und Meer.",
  },
  pois: ["Cours Saleya", "Èze", "Promenade des Anglais"],
  hotel: "Hôtel Les Terrasses d'Èze",
} as const;

export const V2_PRODUCT_DETAILS = [
  {
    title: "Route",
    lines: ["Zürich → Nizza → Cannes → Saint-Tropez"],
  },
  {
    title: "Unterkünfte",
    lines: ["Nizza", "2 Nächte"],
  },
  {
    title: "Orte",
    lines: ["Cours Saleya", "Èze", "Promenade des Anglais"],
  },
  {
    title: "Reiseplan",
    lines: ["5 Nächte", "4 Stopps", "PDF"],
  },
] as const;

export const V2_EXAMPLE_TRIP = {
  href: V2_EXAMPLE_HREF,
  title: "Côte d'Azur",
  subtitle: "Drei Basen · Küste statt Autobahn",
  duration: "5 Nächte · Mai",
  photo: COTE_DAZUR_PHOTOS.hero.url,
  photoAlt: COTE_DAZUR_PHOTOS.hero.alt,
  highlights: ["Plage Keller", "Cours Saleya", "Corniche d'Or"],
  stops: 4,
  nights: 5,
  distance: "ca. 720 km",
  travelType: "Roadtrip",
  route: "Zürich → Nizza → Cannes → Saint-Tropez",
} as const;

export const V2_INSPIRATION = [
  {
    slug: "provence",
    travelTypeKey: "roadtrip",
    href: "/unsere-reisen#provence",
    label: "Provence",
    tagline: "Avignon · Luberon · Aix & Verdon",
    duration: "5 Nächte",
    travelType: "Roadtrip",
    photo: inspirationPhoto("1499002238440-d264edd596ec", 1200),
    photoAlt: "Provence · Landschaft und Lavendel",
  },
  {
    slug: "venedig",
    travelTypeKey: "cityTrip",
    href: "/unsere-reisen#venedig",
    label: "Venedig",
    tagline: "Ruhige Gassen · Vaporetto · Lagune",
    duration: "3 Tage",
    travelType: "Städtetrip",
    photo: inspirationPhoto("1523906834658-6e24ef2386f9", 1200),
    photoAlt: "Venedig · Kanal und Fassaden",
  },
  {
    slug: "grandes-alpes",
    travelTypeKey: "roadtrip",
    href: "/unsere-reisen#grandes-alpes",
    label: "Grandes Alpes",
    tagline: "Genf → Cannes · Pässe statt Autobahn",
    duration: "7 Nächte",
    travelType: "Roadtrip",
    photo: inspirationPhoto("1519904981063-b0cf448d479e", 1200),
    photoAlt: "Route des Grandes Alpes · Passstrasse in den französischen Alpen",
  },
] as const;

export const V2_HOW_STEPS = [
  { step: "01", title: "Ziel eingeben", text: "Sag SnifferTrek, wohin du möchtest." },
  { step: "02", title: "Reise zusammenstellen", text: "Route, Hotels und Orte an einem Ort." },
  { step: "03", title: "Plan mitnehmen", text: "Anpassen, speichern und losreisen." },
] as const;

export const V2_PROBLEM_SOURCES = ["Route", "Hotels", "Flüge", "Notizen", "Orte"] as const;
