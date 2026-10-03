import { inspirationPhoto } from "@/lib/inspirationDestinations";

type TravelReportSlug =
  | "venedig"
  | "cinque-terre"
  | "cote-dazur"
  | "barcelona"
  | "provence"
  | "grandes-alpes";

/** Zentrale Liste der veröffentlichten Reiseberichte (Header, Übersicht, Sibling-Nav). */
export const TRAVEL_REPORT_NAV: {
  slug: TravelReportSlug;
  href: string;
  label: string;
  tagline: string;
  duration: string;
  photo: string;
  photoAlt: string;
}[] = [
  {
    slug: "venedig",
    href: "/reisebericht/venedig",
    label: "Venedig",
    tagline: "Ruhige Gassen · Vaporetto · Lagune",
    duration: "3 Tage",
    photo: inspirationPhoto("1523906834658-6e24ef2386f9", 1200),
    photoAlt: "Venedig · Kanal und Fassaden",
  },
  {
    slug: "cinque-terre",
    href: "/reisebericht/cinque-terre",
    label: "Cinque Terre",
    tagline: "Basis Porto Venere · Zug, Trail & Boot",
    duration: "4 Nächte",
    photo: inspirationPhoto("1729710442373-a4eebca181ef", 1200),
    photoAlt: "Cinque Terre · bunte Häuser am Meer",
  },
  {
    slug: "barcelona",
    href: "/reisebericht/barcelona",
    label: "Barcelona",
    tagline: "Flug · Metro · Gaudí & Meer",
    duration: "4 Tage",
    photo: inspirationPhoto("1722863380905-539ae092fc5f", 1200),
    photoAlt: "Barcelona · Sagrada Família und Skyline",
  },
  {
    slug: "cote-dazur",
    href: "/reisebericht/cote-dazur",
    label: "Côte d'Azur",
    tagline: "Drei Basen · Küste statt Autobahn",
    duration: "5 Nächte",
    photo: inspirationPhoto("1643914729809-4aa59fdc4c17", 1200),
    photoAlt: "Côte d'Azur · Nizza und Baie des Anges",
  },
  {
    slug: "provence",
    href: "/reisebericht/provence",
    label: "Provence",
    tagline: "Avignon · Luberon · Aix & Verdon",
    duration: "5 Nächte",
    photo: inspirationPhoto("1499002238440-d264edd596ec", 1200),
    photoAlt: "Provence · Landschaft und Lavendel",
  },
  {
    slug: "grandes-alpes",
    href: "/reisebericht/grandes-alpes",
    label: "Grandes Alpes",
    tagline: "Genf → Cannes · Pässe statt Autobahn",
    duration: "7 Nächte",
    photo: inspirationPhoto("1519904981063-b0cf448d479e", 1200),
    photoAlt: "Route des Grandes Alpes · Passstrasse in den französischen Alpen",
  },
];
