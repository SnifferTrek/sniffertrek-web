/** Planungs-Blöcke – Route des Grandes Alpes (7 Nächte Genf → Cannes). */

import { GRANDES_ALPES_OFFICIAL_LINKS } from "@/lib/travelReports/grandesAlpesOfficialLinks";

export const GRANDES_ALPES_JOURNEY_AXIS = {
  title: "Sieben Nächte · eine Passkette",
  subtitle: "Genf nach Cannes. Jeden Abend ein Tal, nicht der Pass selbst.",
  stops: [
    { nights: "1 Nacht", place: "Megève / Grand-Bornand", note: "Aravis · ankommen" },
    { nights: "1 Nacht", place: "Val-d'Isère / Séez", note: "Roselend · vor dem Iseran" },
    { nights: "1 Nacht", place: "Briançon", note: "Iseran + Galibier" },
    { nights: "1 Nacht", place: "Guillestre / Queyras", note: "Izoard · kurze Etappe" },
    { nights: "1 Nacht", place: "Barcelonnette", note: "Vars · vor der Bonette" },
    { nights: "1 Nacht", place: "Saint-Martin-Vésubie", note: "Bonette · letzte Bergnacht" },
    { nights: "1 Nacht", place: "Cannes", note: "Turini · Meer" },
  ],
  outro: "Autobahn ist Plan B bei Sperrung – nicht die Strecke zum Kennenlernen.",
} as const;

export const GRANDES_ALPES_AT_A_GLANCE = {
  mustSees: [
    "Col des Aravis / Colombière",
    "Cormet de Roselend",
    "Col de l'Iseran",
    "Col du Galibier",
    "Briançon · Vauban",
    "Col d'Izoard · Casse Déserte",
    "Cime de la Bonette",
    "Col de Turini",
    "Cannes · Suquet",
  ],
  quarters:
    "Megève → Val-d'Isère → Briançon → Guillestre → Barcelonnette → Vésubie → Cannes.",
  transport: "Auto · keine Autobahn · Pässe am Vorabend prüfen.",
  planHint:
    "Kern in 7 Nächten: Iseran und Galibier an einem Tag, Izoard als Pause, Bonette extra. Cannes erst am Schluss.",
  visitedSeason: "Wir waren im **Juli** unterwegs – Pässe offen, Motorräder, früher Start.",
  rainHint: "Bei Gewitter: Tal und Museum Briançon, nicht den Col erzwingen.",
} as const;

export const GRANDES_ALPES_DURATION_COMPARE = [
  {
    days: "5 Tage",
    summary: "Zu eng: Iseran oder Bonette wird Hetze, Hotels in den Tälern leiden.",
  },
  {
    days: "7 Nächte",
    summary: "Sweet Spot: ein Tal pro Abend, zwei schwere Passtage, eine kurze Etappe.",
  },
  {
    days: "9+ Tage",
    summary: "Cayolle extra, Queyras-Wanderung, Côte d'Azur danach anhängen.",
  },
] as const;

export const GRANDES_ALPES_TOC = [
  { id: "route-achse", label: "Route" },
  { id: "auf-einen-blick", label: "Überblick" },
  { id: "plan-7-tage", label: "7-Nächte-Plan" },
  { id: "genf-megeve", label: "1 · Megève" },
  { id: "roseland-valdisere", label: "2 · Roselend" },
  { id: "iseran-galibier", label: "3 · Iseran" },
  { id: "izoard-guillestre", label: "4 · Izoard" },
  { id: "vars-barcelonnette", label: "5 · Ubaye" },
  { id: "bonette-vesubie", label: "6 · Bonette" },
  { id: "turini-cannes", label: "7 · Cannes" },
  { id: "karte", label: "Karte" },
  { id: "anreise", label: "Anreise" },
  { id: "budget", label: "Budget" },
  { id: "hotels", label: "Hotels" },
  { id: "faq", label: "FAQ" },
] as const;

export const GRANDES_ALPES_ITINERARY_7_DAYS = [
  {
    day: 1,
    title: "Genf → Megève · ~140 km",
    items: [
      "Start Genf (Flug GVA oder Anreise Schweiz)",
      "Col des Gets / Colombière / Aravis – nicht Autobahn",
      "Check-in Megève oder Grand-Bornand",
      "Abend Dorf · früh schlafen",
    ],
  },
  {
    day: 2,
    title: "Megève → Val-d'Isère · ~130 km",
    items: [
      "Col des Saisies",
      "Cormet de Roselend · Stopp am See",
      "Bourg-Saint-Maurice",
      "Check-in Val-d'Isère oder Séez – kein Iseran",
    ],
  },
  {
    day: 3,
    title: "Val-d'Isère → Briançon · ~160 km",
    items: [
      "Col de l'Iseran morgens",
      "Bonneval / Lanslebourg",
      "Pause Valloire · Col du Galibier",
      "Check-in Briançon · Altstadt zu Fuss",
    ],
  },
  {
    day: 4,
    title: "Briançon → Guillestre · ~70 km",
    items: [
      "Col d'Izoard",
      "Casse Déserte · Timer",
      "Check-in Guillestre oder Château-Queyras",
      "Nachmittag Dorf – kein Vars",
    ],
  },
  {
    day: 5,
    title: "Guillestre → Barcelonnette · ~55 km",
    items: [
      "Col de Vars",
      "Check-in Barcelonnette",
      "Villen / Platz · früher Abend",
      "Bonette-Wetter prüfen",
    ],
  },
  {
    day: 6,
    title: "Barcelonnette → Vésubie · ~110 km",
    items: [
      "Cime de la Bonette inkl. Schleife",
      "Abfahrt Tinée",
      "Check-in Saint-Martin-Vésubie",
      "Letzte Bergnacht",
    ],
  },
  {
    day: 7,
    title: "Vésubie → Cannes · ~130 km",
    items: [
      "Col de Turini",
      "Optional Nizza kurz – kein Stadtprogramm",
      "Check-in Cannes",
      "Abend Suquet",
    ],
  },
] as const;

export const GRANDES_ALPES_BUDGET = [
  {
    label: "Mietwagen · Tag",
    price: "ca. 50–95 €",
    note: "GVA oder eigenes Auto",
    anchorId: "anreise",
  },
  {
    label: "Diesel / Benzin · 7 Tage",
    price: "ca. 180–260 €",
    note: "Pässe, nicht Autobahn-Schnitt",
  },
  {
    label: "Hotel Tal · Nacht",
    price: "ca. 90–160 €",
    note: "DZ · Séez / Guillestre / Vésubie",
    anchorId: "hotels",
  },
  {
    label: "Hotel Megève / Cannes · Nacht",
    price: "ca. 140–280 €",
    note: "Saison Juli",
    anchorId: "hotels",
  },
  {
    label: "Mittag am Pass",
    price: "ca. 18–35 €",
    note: "Pro Person · oft einfach",
  },
  {
    label: "Abendessen Dorf",
    price: "ca. 30–50 €",
    note: "Pro Person",
    anchorId: "essen",
  },
];

export const GRANDES_ALPES_EVENTS = [
  {
    name: "Tour de France (Pässe)",
    when: "Juli",
    note: "Sperrungen Galibier / Izoard / Bonette prüfen",
  },
  {
    name: "Pass-Saisonende",
    when: "Mitte–Ende September",
    note: "Erster Schnee · Iseran oft zuerst zu",
  },
  {
    name: "Festival de Cannes",
    when: "Mitte Mai",
    note: "Liegt vor der Pass-Saison – trotzdem Hotelpreise Cannes",
  },
] as const;

export const GRANDES_ALPES_TRANSFER_OPTIONS = [
  {
    title: "Eigenes Auto aus der Schweiz",
    body: "Genf als Start – dann Pässe, nicht A41 nach Grenoble.",
    price: "Maut nur falls Plan B Autobahn",
    href: GRANDES_ALPES_OFFICIAL_LINKS.route,
    linkLabel: "Pässe prüfen",
  },
  {
    title: "Flug Genf + Mietwagen",
    body: "GVA morgens, erste Etappe kurz halten – Megève/Grand-Bornand.",
    price: "Mietwagen ab ca. 50 € / Tag",
    href: GRANDES_ALPES_OFFICIAL_LINKS.genevaAirport,
    linkLabel: "Flughafen Genf",
  },
  {
    title: "Rückflug Nizza",
    body: "Cannes als Ziel, Auto in NCE abgeben – oder zurück in die Schweiz über die Küste.",
    price: "Einweggebühr prüfen",
    href: GRANDES_ALPES_OFFICIAL_LINKS.niceAirport,
    linkLabel: "Flughafen Nizza",
    secondaryHref: "/reisebericht/cote-dazur",
    secondaryLinkLabel: "Côte d'Azur",
  },
];
