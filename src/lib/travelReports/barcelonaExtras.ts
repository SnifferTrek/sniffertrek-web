import { buildGetYourGuideLink } from "@/lib/affiliateLinks";
import { BARCELONA_MAP_POIS_DETAILED } from "@/lib/travelReports/barcelonaMapPois";
import { BARCELONA_OFFICIAL_LINKS } from "@/lib/travelReports/barcelonaOfficialLinks";

export const BARCELONA_ARTICLE_META = {
  dateModifiedLabel: "28. Juli 2026",
  priceStandLabel: "Preise Stand Juli 2026",
  experienceNote: "Reisebericht · Barcelona · 4 Tage · Anreise mit Flug, ohne Mietauto",
} as const;

export const BARCELONA_AFFILIATE_DISCLOSURE =
  "Einige Links zu Booking.com, Hotels.com und Touren sind Affiliate-Links – bei einer Buchung erhalten wir ggf. eine Provision, für dich ohne Mehrkosten.";

export const BARCELONA_FLIGHT_CALLOUT = {
  title: "Anreise mit Flug · kein Mietauto",
  body: "Wir fliegen nach **BCN El Prat** und bleiben **vier Tage ohne Auto**. Metro **L9 Sud** oder **Aerobús** ins Zentrum – in der Stadt reichen **Metro, Bus und zu Fuss**.",
  bullets: [
    "Mietauto in Barcelona: Parken teuer, Zentrum eng – für City-Trip unnötig",
    "T-Casual (10 Fahrten) oder Hola BCN für mehrere Tage",
    "Sagrada & Park Güell nur mit Online-Zeitfenster",
  ],
  officialLabel: "Flughafen BCN · Anreiseinfos",
  officialHref: BARCELONA_OFFICIAL_LINKS.aeroport,
  faqLabel: "TMB Tickets & Metro",
  faqHref: BARCELONA_OFFICIAL_LINKS.tmbTickets,
} as const;

export const BARCELONA_FREE_ACTIVITIES = [
  { label: "Barri Gòtic zu Fuss", anchor: "ankunft" },
  { label: "Plaça del Rei & Gassen", anchor: "ankunft" },
  { label: "Strand Barceloneta", anchor: "strand", note: "Liege teuer – Handtuch reicht" },
  { label: "Bunkers del Carmel", anchor: "montjuic", note: "Sunset · Bus hin" },
  { label: "Arc de Triomf & Ciutadella", anchor: "ankunft" },
  { label: "Passeig de Gràcia · Fassaden", anchor: "modernisme", note: "Innen extra" },
] as const;

export const BARCELONA_GUIDE_CARDS = [
  {
    id: "sagrada",
    title: "Sagrada Família – lohnt sich?",
    verdict: "Ja – aber nur mit gebuchtem Slot, nicht spontan.",
    price: "ca. 26–36 €",
    timing: "Erste oder letzte Stunde des Tages",
    tip: "Turm optional – innen reicht für den ersten Besuch.",
    href: BARCELONA_OFFICIAL_LINKS.sagradaTickets,
    linkLabel: "Offizielle Tickets",
  },
  {
    id: "park-guell",
    title: "Park Güell – lohnt sich?",
    verdict: "Ja morgens – Mosaikbank & Aussicht.",
    price: "ca. 10 € (besuchte Zone)",
    timing: "Erster Slot · freier Bereich drumherum",
    tip: "Ohne Ticket nur Aussenbereich – für Fotos oft genug.",
    href: BARCELONA_OFFICIAL_LINKS.parkGuellTickets,
    linkLabel: "Park Güell Tickets",
  },
  {
    id: "mietauto",
    title: "Mietauto – lohnt sich?",
    verdict: "Nein für diesen 4-Tage-City-Trip.",
    price: "Parken ab 30 €/Tag",
    timing: "Metro schneller ins Zentrum",
    tip: "Sitges oder Montserrat nur mit Extra-Tag und Zug.",
  },
] as const;

export const BARCELONA_SEASON_ROWS = [
  { season: "Winter", months: "Dez–Feb", temp: "10–15 °C", crowd: "ruhig", note: "Strand leer · Museums offen" },
  { season: "Frühling", months: "Mär–Jun", temp: "15–26 °C", crowd: "mittel", note: "Unser Favorit · Sant Jordi im April" },
  { season: "Sommer", months: "Jul–Aug", temp: "bis 32 °C", crowd: "sehr voll", note: "Mittagspause · Tickets vorab" },
  { season: "Herbst", months: "Sep–Nov", temp: "18–24 °C", crowd: "La Mercè voll", note: "Noch baden bis Oktober" },
] as const;

export function getBarcelonaCuratedTours() {
  return [
    {
      title: "Sagrada Família mit Guide",
      body: "Skip-the-Line mit Erklärung – sinnvoll beim ersten Besuch.",
      href: buildGetYourGuideLink("Sagrada Familia Barcelona"),
      linkLabel: "Touren auf GetYourGuide",
    },
    {
      title: "Gaudí & Modernisme",
      body: "Halbtages-Rundgang Eixample – Kontext zu Batlló & Pedrera.",
      href: buildGetYourGuideLink("Gaudi Barcelona"),
      linkLabel: "Gaudí-Touren",
    },
    {
      title: "Tapas & Born",
      body: "Abendliche Food-Tour – gute Einstieg in El Born.",
      href: buildGetYourGuideLink("Tapas Barcelona Born"),
      linkLabel: "Food-Touren",
    },
  ];
}

export function buildBarcelonaGoogleMapsRouteUrl(): string {
  const pois = BARCELONA_MAP_POIS_DETAILED;
  if (pois.length < 2) return "https://www.google.com/maps/search/Barcelona+Spain";
  const origin = `${pois[0].lat},${pois[0].lng}`;
  const destination = `${pois[pois.length - 1].lat},${pois[pois.length - 1].lng}`;
  const waypoints = pois
    .slice(1, -1)
    .map((p) => `${p.lat},${p.lng}`)
    .join("|");
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "walking",
  });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function buildBarcelonaPoiListText(): string {
  return BARCELONA_MAP_POIS_DETAILED.map(
    (p) =>
      `${p.kind === "must" ? "Must" : "Nice"}: ${p.name} (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`,
  ).join("\n");
}

export type BarcelonaVenueTip = {
  name: string;
  subtitle?: string;
  description: string;
  price?: string;
  duration?: string;
  href?: string;
  linkLabel?: string;
};

export const BARCELONA_PUBLIC_TRANSIT = {
  title: "ÖPNV in Barcelona · ohne Auto",
  intro:
    "Vier Tage **ohne Mietauto**: vom Flughafen mit **Metro L9** oder **Aerobús**, in der Stadt **T-Casual** (10 Fahrten) oder **Hola BCN**. Mit viel Gepäck oder spät nachts: **Taxi**, **Uber** oder **Cabify**.",
  warnings: [
    "Flughafen-Zuschlag auf Einzeltickets – T-Casual oft günstiger ab 4 Fahrten.",
    "Taschendiebe in Metro L3 (Rambla) und an Boquería – Rucksack vorne.",
    "Park Güell & Sagrada nur mit Slot – Fahrtzeit in Metro einplanen.",
  ],
  officialLabel: "TMB Tickets & Fahrplan",
  officialHref: BARCELONA_OFFICIAL_LINKS.tmbTickets,
  secondaryLinkLabel: "Flughafen BCN",
  secondaryHref: BARCELONA_OFFICIAL_LINKS.aeroport,
} as const;

export const BARCELONA_TRANSIT_TIPS: BarcelonaVenueTip[] = [
  {
    name: "T-Casual (10 Fahrten)",
    subtitle: "Unser Standard",
    description: "Ein Ticket, zehn Fahrten – für zwei Personen vier Tage oft ausreichend mit Bus dazu.",
    price: "ca. 12 €",
    href: BARCELONA_OFFICIAL_LINKS.tmbTickets,
    linkLabel: "TMB kaufen",
  },
  {
    name: "Hola BCN (2–5 Tage)",
    subtitle: "Unbegrenzt",
    description: "Lohnt bei vielen Einzelfahrten und Montjuïc-Hin-und-her.",
    price: "ca. 17–38 €",
    href: BARCELONA_OFFICIAL_LINKS.tmbTickets,
    linkLabel: "Hola BCN",
  },
  {
    name: "Metro L9 Flughafen",
    subtitle: "Ankunft",
    description: "El Prat T1/T2 → Zona Universitària → Umsteigen ins Zentrum.",
    price: "ca. 5 € inkl. Zuschlag",
    duration: "ca. 35–45 Min.",
  },
];

export const BARCELONA_RAIN_ALTERNATIVES: BarcelonaVenueTip[] = [
  {
    name: "Museu Picasso",
    subtitle: "El Born",
    description: "Überdacht, stundenfüllend – Barcelona-Jahre von Picasso.",
    price: "ca. 15 €",
    href: BARCELONA_OFFICIAL_LINKS.picassoTickets,
    linkLabel: "Tickets",
  },
  {
    name: "Palau de la Música",
    subtitle: "Modernisme",
    description: "Geführte Tour durch den Konzertsaal – eines der schönsten Interieurs.",
    price: "ca. 18 €",
    href: BARCELONA_OFFICIAL_LINKS.palauMusica,
    linkLabel: "Führungen",
  },
  {
    name: "Fundació Joan Miró",
    subtitle: "Montjuïc",
    description: "Regen auf dem Hügel: Miró-Sammlung mit Aussicht wenn es aufklart.",
    price: "ca. 13 €",
    duration: "ca. 1–2 Std.",
  },
  {
    name: "Casa Batlló / La Pedrera",
    subtitle: "Indoor Modernisme",
    description: "Wenn draussen nass: Gaudí innen – Zeitfenster online.",
    price: "ca. 28–35 €",
    href: BARCELONA_OFFICIAL_LINKS.casaBatlloTickets,
    linkLabel: "Casa Batlló Tickets",
  },
];

export const BARCELONA_MUST_SEE_MUSEUMS: BarcelonaVenueTip[] = [
  {
    name: "Museu Picasso",
    subtitle: "Must-see #1",
    description: "Frühwerke & Barcelona-Perioden – im Born verortet.",
    price: "ca. 15 €",
    href: BARCELONA_OFFICIAL_LINKS.picassoTickets,
    linkLabel: "Tickets",
  },
  {
    name: "Fundació Joan Miró",
    subtitle: "Must-see #2",
    description: "Katalanische Moderne auf Montjuïc.",
    price: "ca. 13 €",
    duration: "1–2 Std.",
  },
  {
    name: "Palau de la Música",
    subtitle: "Architektur",
    description: "Modernisme-Unesco – Führung buchen.",
    price: "ca. 18 €",
    href: BARCELONA_OFFICIAL_LINKS.palauMusica,
    linkLabel: "Infos",
  },
  {
    name: "MUHBA · Plaça del Rei",
    subtitle: "Unter der Stadt",
    description: "Römische Ruinen unter dem Gòtic – weniger bekannt.",
    price: "ca. 7 €",
    duration: "ca. 45 Min.",
  },
];
