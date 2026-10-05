/** Planungs-Blöcke – Côte d'Azur (5 Nächte gestaffelt). */

export const COTE_DAZUR_JOURNEY_AXIS = {
  title: "Drei Basen · eine Küstenlinie",
  subtitle: "1 + 2 + 2 Nächte. Die Provence kommt erst auf der Rückfahrt.",
  stops: [
    {
      nights: "1 Nacht",
      place: "Nizza / Èze",
      note: "Ankommen · optional Monaco kurz",
    },
    {
      nights: "2 Nächte",
      place: "Mougins / Cannes",
      note: "Plage Keller · Picasso",
    },
    {
      nights: "2 Nächte",
      place: "Region St-Tropez",
      note: "Corniche · Grimaud · Ramatuelle",
    },
  ],
  outro: "Übergang: Corniche d'Or über Agay (rote Felsen) – nicht die A8.",
} as const;

export const COTE_DAZUR_AT_A_GLANCE = {
  mustSees: [
    "Nizza · Vieux Nice & Promenade",
    "Èze · Dorf über dem Meer",
    "Saint-Paul-de-Vence",
    "Grasse · Parfum & Vieille Ville",
    "Antibes · Picasso & Altstadt",
    "Plage Keller · Cap d'Antibes",
    "Mougins Village",
    "Cannes · Suquet / Croisette",
    "Corniche d'Or · Cannes–Agay",
    "Saint-Tropez · Hafen früh",
    "Port Grimaud · Grimaud · Ramatuelle",
  ],
  quarters: "Nizza → Mougins/Cannes → Region Saint-Tropez.",
  transport: "Auto · Küste statt A8 · Parken in Monaco & St-Tropez teuer.",
  planHint:
    "Kern in 5 Nächten: Keller, Mougins, Corniche, St-Tropez-Region. Grasse & St-Paul als Tagesabstecher von Mougins.",
  visitedSeason: "Wir waren im **Mai** unterwegs – warm, Plage Keller offen, Corniche fahrbar.",
  rainHint: "Bei Regen: Picasso-Museen, Galerien Mougins, Port Grimaud zu Fuss.",
} as const;

export const COTE_DAZUR_DURATION_COMPARE = [
  {
    days: "3 Tage",
    summary: "Nur Nizza + Mougins – St-Tropez bleibt Tageshetze.",
  },
  {
    days: "4 Nächte",
    summary: "Nizza + Mougins ok – Region St-Tropez nur 1 Nacht, eng.",
  },
  {
    days: "5 Nächte",
    summary: "Sweet Spot: 1+2+2, Keller und Region ohne Hetze.",
  },
  {
    days: "7+ Tage",
    summary: "Golf-Tag (#golf), Èze länger, Provence anhängen.",
  },
] as const;

export type CoteDazurWalkRoute = {
  id: string;
  title: string;
  duration: string;
  description: string;
  osmDirectionsUrl: string;
};

export const COTE_DAZUR_WALK_ROUTES: CoteDazurWalkRoute[] = [
  {
    id: "mougins-dorf",
    title: "Mougins · Dorfspaziergang",
    duration: "ca. 40 Min.",
    description: "Gassen und Blick zur Küste – zwischen den zwei Nächten an der Basis.",
    osmDirectionsUrl:
      "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=43.6004,6.9956;43.6012,6.9965;43.5998,6.9945",
  },
  {
    id: "port-grimaud",
    title: "Port Grimaud · Kanäle",
    duration: "ca. 50 Min.",
    description: "Entlang der Wasserwege – ruhiger Kontrast zum St-Tropez-Hafen.",
    osmDirectionsUrl:
      "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=43.2728,6.5806;43.2740,6.5820;43.2715,6.5790",
  },
  {
    id: "grimaud-dorf",
    title: "Grimaud · Burgdorf",
    duration: "ca. 45 Min.",
    description: "Hoch zum Dorf und Burgblick über den Golf.",
    osmDirectionsUrl:
      "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=43.2742,6.5225;43.2750,6.5235;43.2735,6.5215",
  },
];

/** Schlankes TOC: Orientierung · Kapitel · Praxis */
export const COTE_DAZUR_TOC = [
  { id: "route-achse", label: "Route" },
  { id: "auf-einen-blick", label: "Überblick" },
  { id: "plan-5-tage", label: "5-Nächte-Plan" },
  { id: "ankunft", label: "1 · Nizza" },
  { id: "keller-antibes", label: "2 · Keller" },
  { id: "mougins-cannes", label: "3 · Mougins" },
  { id: "saint-tropez", label: "4 · Corniche" },
  { id: "grimaud-ramatuelle", label: "5 · Region" },
  { id: "karte", label: "Karte" },
  { id: "golf", label: "Golf" },
  { id: "anreise", label: "Anreise" },
  { id: "budget", label: "Budget" },
  { id: "hotels", label: "Hotels" },
  { id: "faq", label: "FAQ" },
] as const;

export const COTE_DAZUR_ITINERARY_5_DAYS = [
  {
    day: 1,
    title: "Ankunft · 1 Nacht Nizza",
    items: [
      "Auto aus Italien oder Flug NCE + Mietwagen",
      "Check-in nahe Nizza / Èze",
      "Optional Monaco kurz – oder einfach ankommen",
      "Abend Vieux Nice · früh schlafen",
    ],
  },
  {
    day: 2,
    title: "Keller · Antibes · Basiswechsel",
    items: [
      "Musée Picasso Antibes",
      "Mittag Plage Keller",
      "Check-in Mougins oder Cannes",
      "Abend Dorf / Suquet",
    ],
  },
  {
    day: 3,
    title: "Mougins · zweite Nacht",
    items: [
      "Mougins Dorf & Galerien",
      "Vallauris · Picasso-Keramik",
      "Pool oder Cannes",
      "Zweite Nacht Mougins/Cannes",
    ],
  },
  {
    day: 4,
    title: "Corniche · Region St-Tropez",
    items: [
      "Cannes dem Meer entlang · Théoule · Agay",
      "Rote Felsen – nicht A8",
      "Saint-Tropez Hafen früh",
      "Port Grimaud · 1. Nacht Region",
    ],
  },
  {
    day: 5,
    title: "Grimaud · Ramatuelle",
    items: [
      "Grimaud · Burgdorf",
      "Ramatuelle · Dorf & Strand",
      "Zweite Nacht Region",
      "Abschied – Rückfahrt Provence (separat)",
    ],
  },
] as const;

export type BudgetLine = {
  label: string;
  price: string;
  note?: string;
  anchorId?: string;
};

export const COTE_DAZUR_BUDGET: BudgetLine[] = [
  {
    label: "Mietwagen · Tag",
    price: "ca. 45–90 €",
    note: "Flughafen NCE",
    anchorId: "anreise",
  },
  {
    label: "Plage Keller · Mittagessen",
    price: "ca. 45–80 €",
    note: "Pro Person · Reservation",
    anchorId: "keller-antibes",
  },
  {
    label: "Musée Picasso · Antibes",
    price: "ca. 8–12 €",
    anchorId: "keller-antibes",
  },
  {
    label: "Hotel Nizza (1 Nacht)",
    price: "ca. 100–180 €",
    note: "DZ",
  },
  {
    label: "Hotel de Mougins (2 Nächte)",
    price: "ca. 180–320 € / Nacht",
    note: "Saison abhängig",
    anchorId: "hotels",
  },
  {
    label: "Hotel Region St-Tropez (2 Nächte)",
    price: "ca. 140–280 € / Nacht",
    note: "Ausserhalb Hafen oft besser",
  },
  {
    label: "Parken St-Tropez / Monaco",
    price: "ca. 20–40 € / Stopp",
    anchorId: "anreise",
  },
  {
    label: "Restaurant · Abend Region",
    price: "ca. 35–55 €",
    note: "Pro Person · nicht Hafenzeile",
    anchorId: "essen",
  },
];

export const COTE_DAZUR_EVENTS = [
  {
    name: "Festival de Cannes",
    when: "Mitte Mai",
    note: "Hotels teuer · Promenade gesperrt",
  },
  {
    name: "Monaco Grand Prix",
    when: "Mai",
    note: "Verkehr & Preise",
  },
  {
    name: "Hochsaison St-Tropez",
    when: "Jul–Aug",
    note: "Parken & Hafen extrem voll",
  },
] as const;

import { COTE_DAZUR_OFFICIAL_LINKS } from "@/lib/travelReports/coteDazurOfficialLinks";

export const COTE_DAZUR_TRANSFER_OPTIONS = [
  {
    title: "Auto aus Italien · A8",
    body: "Anreise ok – vor Ort danach Küste statt Autobahn.",
    price: "Maut + Benzin",
    href: COTE_DAZUR_OFFICIAL_LINKS.niceTourism,
    linkLabel: "Nizza · Tourismus",
  },
  {
    title: "Flug Nizza + Mietwagen",
    body: "NCE → erste Nacht Nizza → weiter Richtung Cap und Mougins.",
    price: "Mietwagen ab ca. 45 € / Tag",
    href: COTE_DAZUR_OFFICIAL_LINKS.niceAirport,
    linkLabel: "Flughafen Nizza",
  },
  {
    title: "Corniche d'Or",
    body: "Cannes → Agay → St-Tropez dem Meer entlang. Rückfahrt Provence separat.",
    price: "mehr Zeit, mehr Riviera",
    href: COTE_DAZUR_OFFICIAL_LINKS.cannesTourism,
    linkLabel: "Cannes · Infos",
  },
] as const;
