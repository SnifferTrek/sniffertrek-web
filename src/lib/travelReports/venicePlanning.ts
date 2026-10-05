/** Planungs-Blöcke für den Venedig-Reisebericht (TOC, Budget, Tagesplan). */

export const VENICE_JOURNEY_AXIS = {
  title: "Drei Tage · eine Lagune",
  subtitle: "Rhythmus statt Hetze – Inseln nur, wenn noch Luft bleibt.",
  stops: [
    {
      nights: "Tag 1",
      place: "Ankommen",
      note: "San Marco kurz · ruhiges Quartier",
    },
    {
      nights: "Tag 2",
      place: "Canal Grande",
      note: "Rialto früh · Dogenpalast · Vaporetto",
    },
    {
      nights: "Tag 3",
      place: "Lagune",
      note: "Optional Murano & Burano",
    },
  ],
  outro: "Basis: Cannaregio, Castello oder Dorsoduro – nicht direkt am Markusplatz.",
} as const;

export const VENICE_AT_A_GLANCE = {
 mustSees: [
 "Markusdom & Dogenpalast – Tickets online",
 "Museen: Accademia, San Rocco, Peggy Guggenheim",
 "Rialtomarkt am Morgen (ab 7 Uhr)",
 "Vaporetto Linie 1 – ganzer Canal Grande",
 "Bei Regen: Indoor-Plan – Abschnitt «Bei Regen»",
 "Burano – halber Tag, früh starten",
 ],
 /** PDF/Web Meta-Slots: je ~1–2 Zeilen */
 quarters: "Cannaregio, Castello oder Dorsoduro – nicht direkt am Markusplatz.",
 transport: "ACTV-Tageskarte · Bahn/Bus/Auto bis Tronchetto oder Piazzale Roma.",
 planHint: "3 Tage = Rhythmus statt Hetze; Tag 3 optional Murano & Burano.",
 visitedSeason: "Wir waren im **April** unterwegs – mild, wenig Regen, der Rialtomarkt um sieben Uhr fast leer.",
 rainHint: "Regenplan: Dogenpalast, San Rocco oder Accademia – siehe Abschnitt «Bei Regen».",
} as const;

export const VENICE_DURATION_COMPARE = [
 {
 days: "1 Tag",
 summary: "Nur Eindruck: Markusplatz, Dogenpalast, Rialto – kein Murano.",
 },
 {
 days: "2 Tage",
 summary: "San Marco & Rialto, dann Vaporetto und ein ruhiges Viertel.",
 },
 {
 days: "3 Tage",
 summary: "Sweet Spot: Rhythmus, Pausen, optional Murano/Burano.",
 },
 {
 days: "4+ Tage",
 summary: "Torcello, Accademia oder Verona – und Tage ohne Liste.",
 },
] as const;

export type VeniceWalkRoute = {
 id: string;
 title: string;
 duration: string;
 description: string;
 /** OpenStreetMap-Fussweg (Start → Ende). */
 osmDirectionsUrl: string;
};

export const VENICE_WALK_ROUTES: VeniceWalkRoute[] = [
 {
 id: "cannaregio-abend",
 title: "Abendroute Cannaregio",
 duration: "ca. 45 Min.",
 description: "Vom Bahnhof durchs Ghetto Novo, ruhige Fondamente – ohne Markusplatz.",
 osmDirectionsUrl:
 "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=45.4414,12.3206;45.4483,12.3285;45.4462,12.3348",
 },
 {
 id: "rialto-dorsoduro",
 title: "Rialto → Dorsoduro",
 duration: "ca. 35 Min.",
 description: "Nach dem Markt über die Brücke, Accademia, dann die Zattere zum Sonnenuntergang.",
 osmDirectionsUrl:
 "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=45.4380,12.3359;45.4310,12.3285;45.4285,12.3270",
 },
 {
 id: "castello-morgen",
 title: "Castello ohne Plan",
 duration: "ca. 50 Min.",
 description: "Von San Zaccaria durch enge Gassen zum Campo Santa Maria Formosa – wenig Kartenlesen nötig.",
 osmDirectionsUrl:
 "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=45.4335,12.3435;45.4375,12.3410;45.4378,12.3375",
 },
];

export const VENICE_TOC = [
  { id: "route-achse", label: "Route" },
  { id: "auf-einen-blick", label: "Überblick" },
  { id: "plan-3-tage", label: "3-Tage-Plan" },
  { id: "ankunft", label: "1 · Ankommen" },
  { id: "morgen", label: "2 · Rialto" },
  { id: "dogenpalast", label: "2 · Dogenpalast" },
  { id: "vaporetto", label: "2 · Vaporetto" },
  { id: "inseln", label: "3 · Inseln" },
  { id: "karte", label: "Karte" },
  { id: "anreise", label: "Anreise" },
  { id: "budget", label: "Budget" },
  { id: "hotels", label: "Hotels" },
  { id: "faq", label: "FAQ" },
] as const;

export const VENICE_ITINERARY_3_DAYS = [
 {
 day: 1,
 title: "Ankommen & erster Eindruck",
 items: [
 "Ankunft Cannaregio/Castello – Gepäck leicht",
 "Markusplatz kurz, dann weg von der Menge",
 "Abend: Fondamente Nove oder Dorsoduro",
 ],
 },
 {
 day: 2,
 title: "Rialto, Dogenpalast & Vaporetto",
 items: [
 "Rialtomarkt früh (7–9 Uhr)",
 "Dogenpalast online · Campanile bei Öffnung",
 "Linie 1 Canal Grande (Tageskarte)",
 ],
 },
 {
 day: 3,
 title: "Optional · Lagune",
 items: [
 "Murano ab Fondamente Nove (Termin)",
 "Burano vor Mittag · Fisch essen",
 "Oder: Giardini, Ghetto, Salute",
 ],
 },
] as const;

export type BudgetLine = {
 label: string;
 price: string;
 note?: string;
 /** Sprungmarke im Bericht */
 anchorId?: string;
};

export const VENICE_BUDGET: BudgetLine[] = [
 {
 label: "Vaporetto 24 h / 48 h / 72 h",
 price: "ca. 25 / 35 / 45 €",
 note: "ACTV · Tickets online",
 anchorId: "vaporetto",
 },
 {
 label: "Markusdom",
 price: "ca. 10 €",
 note: "Ticket online · Terrasse extra",
 anchorId: "tipps-sehenswertes",
 },
 {
 label: "Dogenpalast (Einzel)",
 price: "ca. 30 €",
 note: "Online buchen spart Wartezeit",
 anchorId: "dogenpalast",
 },
 {
 label: "Gallerie dell'Accademia",
 price: "ca. 15 €",
 note: "Vitruvian-Mann oft Zeitfenster",
 anchorId: "museen",
 },
 {
 label: "Scuola San Rocco",
 price: "ca. 10 €",
 note: "Tintoretto · weniger voll",
 anchorId: "museen",
 },
 {
 label: "Peggy Guggenheim",
 price: "ca. 18 €",
 note: "Moderne · Dorsoduro",
 anchorId: "museen",
 },
 {
 label: "Campanile · Aussicht",
 price: "ca. 10 €",
 note: "Alternative: San Giorgio · siehe Tipps",
 anchorId: "tipps-sehenswertes",
 },
 {
 label: "Salute-Kuppel",
 price: "ca. 8 €",
 note: "Mo/Di zu · stündlich",
 anchorId: "tipps-sehenswertes",
 },
 {
 label: "Traghetto (Canal Grande)",
 price: "ca. 2–5 €",
 note: "Gondola-Fähre, stehend, schnell",
 anchorId: "tipps-sehenswertes",
 },
 {
 label: "Gondel privat (30 Min.)",
 price: "ca. 90–110 €",
 note: "Abends teurer · Traghetto als Alternative",
 anchorId: "tipps-sehenswertes",
 },
 {
 label: "Cicchetti & Ombra",
 price: "ca. 8–15 €",
 note: "Pro Person, abseits Markusplatz",
 anchorId: "essen",
 },
 {
 label: "Trattoria (Abendessen)",
 price: "ca. 30–45 €",
 note: "Pro Person inkl. Wein",
 },
 {
 label: "Hotel in der Lagune (Doppelzimmer)",
 price: "ca. 120–220 €",
 note: "Früh buchen · Mestre ab ca. 60 €",
 },
 {
 label: "Flughafen Marco Polo → Zentrum",
 price: "ca. 8–15 €",
 note: "Bus ATVO · Alilaguna ca. 15 €",
 },
 {
 label: "Parken Tronchetto (24 h)",
 price: "ca. 23–29 €",
 note: "People Mover → Piazzale Roma",
 anchorId: "anreise",
 },
 {
 label: "Parken Mestre (24 h)",
 price: "ab ca. 10 €",
 note: "+ Zug nach Santa Lucia",
 anchorId: "anreise",
 },
];

export const VENICE_EVENTS = [
 {
 name: "Karneval",
 when: "Februar",
 note: "Voll und teuer – Wochenenden meiden",
 },
 {
 name: "Biennale",
 when: "Mai–November (ungerade Jahre)",
 note: "Giardini & Arsenale – mehr Trubel",
 },
 {
 name: "Acqua alta",
 when: "Oktober–Dezember",
 note: "Stege auf dem Markusplatz · MOSE hält vieles ab",
 },
 {
 name: "Venedig-Marathon",
 when: "Oktober",
 note: "Einige Brücken gesperrt am Renntag",
 },
] as const;

import { VENICE_OFFICIAL_LINKS } from "@/lib/travelReports/veniceOfficialLinks";

export const VENICE_TRANSFER_OPTIONS = [
  {
    title: "ATVO-Bus",
    body: "Günstig · Endstation Piazzale Roma · mit Koffer mühsam.",
    price: "ca. 8–10 €",
    href: "https://www.atvo.it/en/",
    linkLabel: "ATVO · Tickets",
  },
  {
    title: "Alilaguna-Boot",
    body: "Haltestellen am Canal Grande – näher ans Quartier.",
    price: "ca. 15 €",
    href: "https://www.alilaguna.it/en",
    linkLabel: "Alilaguna · Tickets",
  },
  {
    title: "Wassertaxi",
    body: "Direkt ans Hotel – lohnt mit schwerem Gepäck.",
    price: "ab ca. 100 €",
    href: VENICE_OFFICIAL_LINKS.actvTickets,
    linkLabel: "Venezia Unica · Infos",
  },
] as const;
