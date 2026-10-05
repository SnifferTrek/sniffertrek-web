import { BARCELONA_OFFICIAL_LINKS } from "@/lib/travelReports/barcelonaOfficialLinks";

export const BARCELONA_JOURNEY_AXIS = {
  title: "Vier Tage · ohne Mietauto",
  subtitle: "Flug rein, Metro & zu Fuss – eine Basis in Born oder Eixample.",
  stops: [
    { nights: "Tag 1", place: "Ankommen", note: "Gòtic · Born · kein Auto" },
    { nights: "Tag 2", place: "Modernisme", note: "Sagrada · Passeig de Gràcia" },
    { nights: "Tag 3", place: "Park & Hügel", note: "Park Güell · Gràcia · Montjuïc" },
    { nights: "Tag 4", place: "Meer & Kunst", note: "Picasso · Barceloneta · Abflug" },
  ],
  outro: "Basis: El Born, Eixample oder Gràcia – nicht direkt an der Rambla.",
} as const;

export const BARCELONA_AT_A_GLANCE = {
  mustSees: [
    "Sagrada Família – Online-Zeitfenster Pflicht",
    "Park Güell – ersten Slot morgens",
    "Barri Gòtic & Kathedrale – früh",
    "Passeig de Gràcia – Casa Batlló & La Pedrera",
    "Museu Picasso im El Born",
    "Barceloneta & Hafenpromenade",
    "T-Casual oder Hola BCN – Metro statt Taxi",
  ],
  quarters: "El Born, Eixample (nahe Diagonal) oder Gràcia – ruhiger als Rambla.",
  transport: "Metro L9 vom Flughafen · TMB T-Casual 10 Fahrten · kein Mietauto.",
  planHint: "4 Tage = ein Tempo; Tag 3 Montjuïc oder Gràcia je nach Wetter tauschen.",
} as const;

export const BARCELONA_DURATION_COMPARE = [
  { days: "2 Tage", summary: "Nur Eindruck: Sagrada, Gòtic, ein Abend in Born – zu knapp." },
  { days: "3 Tage", summary: "Sagrada + Park Güell + Gòtic – ohne Strand oder Picasso." },
  { days: "4 Tage", summary: "Sweet Spot: Modernisme, Park, Born & Meer – unser Plan." },
  { days: "5+ Tage", summary: "Montserrat, Sitges oder Girona – oder einfach langsamer." },
] as const;

export type BarcelonaWalkRoute = {
  id: string;
  title: string;
  duration: string;
  description: string;
  osmDirectionsUrl: string;
};

export const BARCELONA_WALK_ROUTES: BarcelonaWalkRoute[] = [
  {
    id: "gotic-born",
    title: "Gòtic → El Born",
    duration: "ca. 40 Min.",
    description: "Kathedrale, Plaça del Rei, dann Santa Maria del Mar – ohne Rambla.",
    osmDirectionsUrl:
      "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=41.3839,2.1763;41.3840,2.1800;41.3851,2.1834",
  },
  {
    id: "passeig-eixample",
    title: "Sagrada → Passeig de Gràcia",
    duration: "ca. 25 Min.",
    description: "Nach dem Zeitfenster zu Fuss durch Eixample – gerade Gitter, Schatten.",
    osmDirectionsUrl:
      "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=41.4036,2.1744;41.3952,2.1619;41.3917,2.1649",
  },
  {
    id: "barceloneta-abend",
    title: "Barceloneta · Abend",
    duration: "ca. 35 Min.",
    description: "Strandpromenade, dann eine Gasse landeinwärts – weniger Touristenpreise.",
    osmDirectionsUrl:
      "https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=41.3788,2.1890;41.3805,2.1850;41.3820,2.1800",
  },
];

export const BARCELONA_TOC = [
  { id: "route-achse", label: "Route" },
  { id: "auf-einen-blick", label: "Überblick" },
  { id: "plan-4-tage", label: "4-Tage-Plan" },
  { id: "ankunft", label: "1 · Ankommen" },
  { id: "sagrada", label: "2 · Sagrada" },
  { id: "modernisme", label: "2 · Modernisme" },
  { id: "park-guell", label: "3 · Park Güell" },
  { id: "montjuic", label: "3 · Montjuïc" },
  { id: "strand", label: "4 · Meer" },
  { id: "karte", label: "Karte" },
  { id: "anreise", label: "Anreise" },
  { id: "budget", label: "Budget" },
  { id: "hotels", label: "Hotels" },
  { id: "faq", label: "FAQ" },
] as const;

export const BARCELONA_ITINERARY_4_DAYS = [
  {
    day: 1,
    title: "Ankommen & Barri Gòtic",
    items: [
      "Flughafen BCN → Metro L9 Sud → Hotel check-in",
      "Barri Gòtic & Kathedrale – ohne Rambla-Mittag",
      "Abend El Born · Tapas bei El Xampanyet",
    ],
  },
  {
    day: 2,
    title: "Sagrada & Eixample",
    items: [
      "Sagrada Família – gebuchtes Zeitfenster",
      "Passeig de Gràcia · Casa Batlló / La Pedrera",
      "Abend Gràcia oder zurück nach Born",
    ],
  },
  {
    day: 3,
    title: "Park Güell & Montjuïc",
    items: [
      "Park Güell – erster Slot",
      "Gràcia zum Mittagessen",
      "Optional Montjuïc · Miró & Aussicht",
    ],
  },
  {
    day: 4,
    title: "Picasso & Barceloneta",
    items: [
      "Museu Picasso – morgens",
      "Boquería oder Santa Caterina – Snack",
      "Barceloneta · Abflug mit Gepäck-Puffer",
    ],
  },
] as const;

export const BARCELONA_BUDGET = [
  { label: "Metro T-Casual (10 Fahrten)", price: "ca. 12 €", note: "TMB · Flughafen zählt extra", anchorId: "anreise" },
  { label: "Aerobús Flughafen", price: "ca. 7–8 €", note: "Alternative zur Metro", anchorId: "anreise" },
  { label: "Taxi / Uber / Cabify", price: "ca. 30–45 €", note: "Fixpreis oder App-Preis", anchorId: "anreise" },
  { label: "Sagrada Família", price: "ca. 26–36 €", note: "Online · je nach Turm", anchorId: "sagrada" },
  { label: "Park Güell (Zone)", price: "ca. 10 €", note: "Zeitfenster Pflicht", anchorId: "park-guell" },
  { label: "Casa Batlló", price: "ca. 35 €", note: "Aussen oft genug", anchorId: "modernisme" },
  { label: "La Pedrera", price: "ca. 28 €", note: "Dachterrasse ikonisch", anchorId: "modernisme" },
  { label: "Museu Picasso", price: "ca. 15 €", note: "Online buchen", anchorId: "strand" },
  { label: "Tapas & Cava (Abend)", price: "ca. 25–40 €", note: "Pro Person in Born", anchorId: "essen" },
  { label: "Hotel Doppelzimmer", price: "ca. 100–180 €", note: "Born/Eixample · Früh buchen" },
  { label: "Flug ZRH–BCN (Hin/Rück)", price: "ca. 120–250 €", note: "Saisonabhängig", anchorId: "anreise" },
] as const;

export const BARCELONA_EVENTS = [
  { name: "La Mercè", when: "September", note: "Stadtfest · voll, aber stimmungsvoll" },
  { name: "Mobile World Congress", when: "Februar/März", note: "Hotels teuer · früh buchen" },
  { name: "Sant Jordi", when: "23. April", note: "Rosen & Bücher · Plaça Catalunya voll" },
  { name: "Sommer-Hitze", when: "Jul–Aug", note: "Siesta einplanen · Strand mittags" },
] as const;

export const BARCELONA_TRANSFER_OPTIONS = [
  {
    title: "Metro L9 Sud",
    body: "Günstig · Umsteigen in Torrassa oder Zona Universitària · mit Koffer machbar.",
    price: "ca. 5 € (Einzel + Zuschlag Flughafen)",
    href: BARCELONA_OFFICIAL_LINKS.tmbTickets,
    linkLabel: "TMB · Tickets & Fahrplan",
  },
  {
    title: "Aerobús A1/A2",
    body: "Direkt Plaça Catalunya – schneller bei viel Gepäck.",
    price: "ca. 7–8 €",
    href: BARCELONA_OFFICIAL_LINKS.aerobus,
    linkLabel: "Aerobús buchen / Infos",
  },
  {
    title: "Taxi",
    body: "Offizielle schwarze/gelbe Taxis am Stand · Fixpreis-Zone zum Zentrum.",
    price: "ca. 35–45 €",
    href: BARCELONA_OFFICIAL_LINKS.aeroport,
    linkLabel: "Flughafen · Transfer-Infos",
  },
  {
    title: "Uber / Cabify",
    body: "App-Alternative zum Taxi – Preis vorab in der App. Cabify ist in Spanien sehr verbreitet.",
    price: "ca. 30–45 €",
    href: BARCELONA_OFFICIAL_LINKS.uber,
    linkLabel: "Uber öffnen",
    secondaryHref: BARCELONA_OFFICIAL_LINKS.cabify,
    secondaryLinkLabel: "Cabify öffnen",
  },
] as const;
