/** Planungs-Blöcke – Porto Venere & Cinque Terre (4 Nächte). */

export const CINQUE_TERRE_JOURNEY_AXIS = {
  title: "Vier Nächte · eine Basis",
  subtitle: "Porto Venere als Quartier – Cinque Terre per Zug, Trail und Boot.",
  stops: [
    {
      nights: "Basis",
      place: "Porto Venere",
      note: "4 Nächte · Golfo dei Poeti",
    },
    {
      nights: "Tag 2–3",
      place: "Cinque Terre",
      note: "Zug · Via dell'Amore · Sentiero",
    },
    {
      nights: "Tag 4",
      place: "Palmaria",
      note: "Fähre · Bootstag",
    },
  ],
  outro: "Ohne Hotel-Hopping: morgens raus, abends zurück nach Porto Venere.",
} as const;

export const CINQUE_TERRE_AT_A_GLANCE = {
 mustSees: [
 "Porto Venere · 4 Nächte Basis – Byron-Grotte, Kirche",
 "Cinque Terre Card · Zug + Wanderwege",
 "Via dell'Amore · Riomaggiore–Manarola (Status prüfen)",
 "Zug La Spezia → Dörfer · früh starten",
 "Sentiero Azzurro · z. B. Vernazza–Monterosso",
 "Fähre Porto Venere → Isola Palmaria",
 ],
 /** PDF/Web Meta-Slots: je ~1–2 Zeilen */
 quarters: "Porto Venere Altstadt oder Lerici – ruhiger als Monterosso.",
 transport: "Trenitalia Regional · Cinque Terre Card · Golfo-dei-Poeti-Fähren.",
 planHint: "4 Nächte: ein Zug-Tag, ein Wander-Tag, ein Boot-Tag – ohne Hetze.",
 visitedSeason: "Wir waren im **Mai** unterwegs – warm, Wege offen, Via dell'Amore mit Slot gebucht.",
 rainHint: "Bei Regen: Zug statt Trail, Museo in La Spezia oder länger in Trattoria.",
} as const;

export const CINQUE_TERRE_DURATION_COMPARE = [
 {
 days: "2 Tage",
 summary: "Nur Hauch: ein Dorf + Zug – zu wenig für Trail & Via.",
 },
 {
 days: "3 Tage",
 summary: "Ein Zug-Tag, halber Wander-/Boot-Tag – eng, machbar.",
 },
 {
 days: "4 Nächte",
 summary: "Sweet Spot: Zug, Trail, Palmaria – Basis Porto Venere.",
 },
 {
 days: "5+ Tage",
 summary: "Extra Trail, Genua/Portofino – und ein Tag ohne Plan.",
 },
] as const;

export type CinqueTerreWalkRoute = {
 id: string;
 title: string;
 duration: string;
 description: string;
 osmDirectionsUrl: string;
};

export const CINQUE_TERRE_WALK_ROUTES: CinqueTerreWalkRoute[] = [
 {
 id: "porto-venere-abend",
 title: "Abendrunde Porto Venere",
 duration: "ca. 40 Min.",
 description: "Vom Hafen zur Chiesa di San Pietro und Byron-Grotte – ohne Cinque-Terre-Ticket.",
 osmDirectionsUrl:
 "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=44.0505,9.8340;44.0480,9.8365;44.0465,9.8380",
 },
 {
 id: "vernazza-monterosso",
 title: "Sentiero · Vernazza → Monterosso",
 duration: "ca. 2 h",
 description: "Klassischer Blue-Trail-Abschnitt – nur mit Card, feste Schuhe, Wasser.",
 osmDirectionsUrl:
 "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=44.1351,9.6842;44.1456,9.6549",
 },
 {
 id: "via-amore",
 title: "Via dell'Amore",
 duration: "ca. 20 Min.",
 description: "Riomaggiore–Manarola – wenn offen: Reservierung und Helm laut Park.",
 osmDirectionsUrl:
 "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=44.0994,9.7377;44.1063,9.7276",
 },
];

export const CINQUE_TERRE_TOC = [
  { id: "route-achse", label: "Route" },
  { id: "auf-einen-blick", label: "Überblick" },
  { id: "plan-4-tage", label: "4-Tage-Plan" },
  { id: "ankunft", label: "1 · Porto Venere" },
  { id: "cinque-terre-zug", label: "2 · Zug" },
  { id: "via-amore", label: "Via dell'Amore" },
  { id: "wanderung", label: "3 · Trail" },
  { id: "boot", label: "4 · Boot" },
  { id: "karte", label: "Karte" },
  { id: "anreise", label: "Anreise" },
  { id: "budget", label: "Budget" },
  { id: "hotels", label: "Hotels" },
  { id: "faq", label: "FAQ" },
] as const;

export const CINQUE_TERRE_ITINERARY_4_DAYS = [
 {
 day: 1,
 title: "Ankunft · Porto Venere",
 items: [
 "Check-in · Gepäck leicht (Stufen)",
 "Hafen, San Pietro, Byron-Grotte",
 "Abendessen in der Altstadt",
 ],
 },
 {
 day: 2,
 title: "Cinque Terre per Zug",
 items: [
 "Früh La Spezia · Card kaufen",
 "Riomaggiore → Manarola (Via wenn offen)",
 "Vernazza · Gelato · Zug zurück",
 ],
 },
 {
 day: 3,
 title: "Wanderung Sentiero",
 items: [
 "Zug nach Vernazza oder Monterosso",
 "Trail Vernazza–Monterosso",
 "Baden · Zug/Bus zurück",
 ],
 },
 {
 day: 4,
 title: "Boot · Palmaria",
 items: [
 "Fähre Porto Venere → Palmaria",
 "Leichte Inselrunde oder Strand",
 "Optional Lerici · Aperitivo am Hafen",
 ],
 },
] as const;

export type BudgetLine = {
 label: string;
 price: string;
 note?: string;
 anchorId?: string;
};

export const CINQUE_TERRE_BUDGET: BudgetLine[] = [
 {
 label: "Cinque Terre Card (1 Tag)",
 price: "ca. 18–20 €",
 note: "Zug + Wege · online günstiger",
 anchorId: "cinque-terre-card",
 },
 {
 label: "Cinque Terre Card (2 Tage)",
 price: "ca. 33–35 €",
 note: "Für Trail + separater Zugtag",
 anchorId: "cinque-terre-card",
 },
 {
 label: "Regionalzug La Spezia ↔ Dörfer",
 price: "in Card · sonst ca. 5 €/Strecke",
 note: "Ohne Card teurer",
 anchorId: "cinque-terre-zug",
 },
 {
 label: "Via dell'Amore (wenn kostenpflichtig)",
 price: "ca. 5–10 €",
 note: "Reservierungspflicht je nach Phase",
 anchorId: "via-amore",
 },
 {
 label: "Fähre Porto Venere–Palmaria",
 price: "ca. 6–8 €",
 note: "Hin & zurück · Saison",
 anchorId: "boot",
 },
 {
 label: "Boot Cinque Terre (optional)",
 price: "ca. 25–35 €",
 note: "Tageskarte Sommer",
 anchorId: "boot",
 },
 {
 label: "Trattoria · Abendessen",
 price: "ca. 25–40 €",
 note: "Pro Person · Pesto & Fisch",
 anchorId: "essen",
 },
 {
 label: "Hotel Porto Venere (DZ)",
 price: "ca. 100–180 €",
 note: "Früh buchen · Mai/Juni voll",
 },
 {
 label: "Parken Porto Venere",
 price: "ca. 15–25 € / Tag",
 note: "Begrenzt · kleines Auto",
 anchorId: "anreise",
 },
 {
 label: "Pisa → La Spezia (Zug)",
 price: "ca. 10–15 €",
 note: "Regional · 1–1,5 h",
 anchorId: "anreise",
 },
];

export const CINQUE_TERRE_EVENTS = [
 {
 name: "Lemon Festival · Monterosso",
 when: "Mai",
 note: "Mehr Besucher – früh wandern",
 },
 {
 name: "Palio del Golfo · La Spezia",
 when: "August",
 note: "Ruderregatta · Hotels voll",
 },
 {
 name: "Weinlese Sciacchetrà",
 when: "September",
 note: "Verkostungen in Manarola/Corniglia",
 },
] as const;

import { CINQUE_TERRE_OFFICIAL_LINKS } from "@/lib/travelReports/cinqueTerreOfficialLinks";

export const CINQUE_TERRE_TRANSFER_OPTIONS = [
  {
    title: "Zug Pisa → La Spezia",
    body: "Regionalzug ab Pisa Centrale – oft Umstieg.",
    price: "ca. 10–15 €",
    href: CINQUE_TERRE_OFFICIAL_LINKS.trenitalia,
    linkLabel: "Trenitalia · Fahrplan",
  },
  {
    title: "Bus → Porto Venere",
    body: "Ab La Spezia bis Hafen – günstiger als Taxi.",
    price: "ca. 2–3 €",
    href: CINQUE_TERRE_OFFICIAL_LINKS.portoVenereInfo,
    linkLabel: "Porto Venere · Infos",
  },
  {
    title: "Taxi / Transfer",
    body: "Bei Spätankunft oder viel Gepäck · ca. 20 Min.",
    price: "ca. 35–50 €",
    href: CINQUE_TERRE_OFFICIAL_LINKS.golfoPoetiFerry,
    linkLabel: "Fähre Golfo dei Poeti",
  },
] as const;
