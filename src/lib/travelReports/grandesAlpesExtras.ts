/** Zusatz-Inhalte – Route des Grandes Alpes. */

import { buildGetYourGuideLink } from "@/lib/affiliateLinks";
import { GRANDES_ALPES_ROUTE_WAYPOINTS } from "@/lib/travelReports/grandesAlpesMapPois";
import { GRANDES_ALPES_OFFICIAL_LINKS } from "@/lib/travelReports/grandesAlpesOfficialLinks";

export const GRANDES_ALPES_ARTICLE_META = {
  dateModifiedLabel: "16. September 2026",
  priceStandLabel: "Preise Stand September 2026",
  experienceNote:
    "Reisebericht aus unserer Sicht · 7 Nächte · Genf → Cannes · Juli",
} as const;

export const GRANDES_ALPES_AFFILIATE_DISCLOSURE =
  "Einige Links zu Booking.com, Hotels.com und Touren sind Affiliate-Links – bei einer Buchung erhalten wir ggf. eine Provision, für dich ohne Mehrkosten.";

export const GRANDES_ALPES_CARD_CALLOUT = {
  title: "Die eine Regel",
  body: "Zum Kennenlernen der **Route des Grandes Alpes**: **Pässe statt Autobahn**. Iseran, Galibier, Izoard, Bonette am **Vorabend** prüfen – GPS schickt euch sonst nach Grenoble.",
  bullets: [
    "Saisonfenster: oft Mitte Juni bis Mitte September",
    "Schwere Tage nicht stapeln: Iseran+Galibier, später Bonette extra",
  ],
  officialLabel: "Pässe & Hinweise",
  officialHref: GRANDES_ALPES_OFFICIAL_LINKS.route,
  faqLabel: "Côte danach",
  faqHref: "/reisebericht/cote-dazur",
} as const;

export const GRANDES_ALPES_FREE_ACTIVITIES = [
  { label: "Aravis / Colombière", anchor: "genf-megeve", note: "Tag 1" },
  { label: "Lac de Roselend", anchor: "roseland-valdisere" },
  { label: "Col de l'Iseran", anchor: "iseran-galibier" },
  { label: "Casse Déserte", anchor: "izoard-guillestre" },
  { label: "Cime de la Bonette", anchor: "bonette-vesubie" },
  { label: "Suquet · Cannes", anchor: "turini-cannes" },
];

export const GRANDES_ALPES_GUIDE_CARDS = [
  {
    id: "iseran",
    title: "Iseran am Morgen – lohnt sich?",
    verdict: "Ja – der höchste Asphaltpass, aber nicht müde und nicht bei Neuschnee.",
    price: "gratis (Strasse)",
    timing: "Früh nach Val-d'Isère / Séez",
    tip: "Windjacke, nicht mit Galibier tauschen wenn einer gesperrt ist.",
    href: GRANDES_ALPES_OFFICIAL_LINKS.route,
    linkLabel: "Pass-Status",
  },
  {
    id: "bonette",
    title: "Bonette-Schleife – lohnt sich?",
    verdict: "Ja – nur wenn ihr die Kamm-Runde oben mitfahrt, nicht nur Restefond.",
    price: "gratis",
    timing: "Eigener Tag ab Barcelonnette",
    tip: "Dünne Luft, wenig Schutz – Timer oben, dann Vésubie.",
    href: GRANDES_ALPES_OFFICIAL_LINKS.ubaye,
    linkLabel: "Ubaye",
  },
  {
    id: "izoard",
    title: "Kurzer Tag am Izoard?",
    verdict: "Ja – deshalb 7 Nächte, nicht 5.",
    price: "gratis",
    timing: "Nach Iseran/Galibier",
    tip: "Casse Déserte ist der Grund, nicht die Kilometerzahl.",
    href: GRANDES_ALPES_OFFICIAL_LINKS.queyras,
    linkLabel: "Queyras",
  },
];

export const GRANDES_ALPES_SEASON_ROWS = [
  { season: "Frühling", months: "Apr–Mai", temp: "Tal 10–18 °C", crowd: "ruhig", note: "Hohe Pässe oft zu" },
  { season: "Sommer", months: "Jun–Aug", temp: "Pass 5–20 °C", crowd: "Juli voll", note: "Saisonfenster" },
  { season: "Frühherbst", months: "Sep", temp: "kühl oben", crowd: "mittel", note: "Erste Sperrungen" },
  { season: "Winter", months: "Okt–Mär", temp: "Schnee", crowd: "Skigebiete", note: "Keine Grandes Alpes" },
] as const;

export function getGrandesAlpesCuratedTours() {
  return [
    {
      title: "Annecy / Savoyen",
      body: "Falls die Anreise ein Puffertag vor Genf braucht – nicht statt Aravis.",
      href: buildGetYourGuideLink("Annecy day trip"),
      linkLabel: "Touren auf GetYourGuide",
    },
    {
      title: "Nice & Cannes",
      body: "Nur wenn ihr nach der Route noch Küste wollt – sonst Suquet zu Fuss.",
      href: buildGetYourGuideLink("Cannes Nice tour"),
      linkLabel: "Cannes / Nizza",
    },
  ];
}

export function buildGrandesAlpesGoogleMapsRouteUrl(): string {
  const pts = GRANDES_ALPES_ROUTE_WAYPOINTS;
  const origin = `${pts[0].lat},${pts[0].lng}`;
  const destination = `${pts[pts.length - 1].lat},${pts[pts.length - 1].lng}`;
  const waypoints = pts
    .slice(1, -1)
    .map((p) => `${p.lat},${p.lng}`)
    .join("|");
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
    avoid: "highways",
  });
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export const GRANDES_ALPES_CAR_ARRIVAL = {
  title: "Anreise mit dem Auto · Genf, dann Pässe",
  intro:
    "Wir kamen **mit dem Auto** – **aus der Schweiz** oder per **Flug Genf + Mietwagen**. Vor Ort gilt: **Pässe statt Autobahn**. Die A41/A43 ist Plan B bei Sperrung, nicht die Route.",
  warnings: [
    "**Iseran, Galibier, Bonette** am Vorabend prüfen – Schnee bis in den Juni möglich.",
    "**GPS** oft auf Autobahn; «Autobahnen meiden» fest einstellen.",
    "**Zwei schwere Tage** nicht hintereinander ohne die kurze Izoard-Etappe.",
  ],
  officialLabel: "Route des Grandes Alpes",
  officialHref: GRANDES_ALPES_OFFICIAL_LINKS.route,
  secondaryLinkLabel: "Flughafen Genf",
  secondaryHref: GRANDES_ALPES_OFFICIAL_LINKS.genevaAirport,
} as const;

export const GRANDES_ALPES_CAR_PARKING = [
  {
    name: "Megève / Grand-Bornand",
    subtitle: "1. Nacht",
    description: "Hotelparkplatz – Dorf zu Fuss. Nicht in der Fussgängerzone suchen.",
    price: "oft inkl.",
    duration: "Ankunftstag",
  },
  {
    name: "Val-d'Isère / Séez",
    subtitle: "2. Nacht",
    description: "Séez einfacher zum Parken. Val-d'Isère: Hotelgarage vorab.",
    price: "variabel",
  },
  {
    name: "Briançon Altstadt",
    subtitle: "3. Nacht",
    description: "Cité Vauban eng – Parken unterhalb, zu Fuss hoch.",
    price: "ca. 8–15 € / Nacht",
    href: GRANDES_ALPES_OFFICIAL_LINKS.briancon,
    linkLabel: "Briançon",
  },
  {
    name: "Cannes",
    subtitle: "7. Nacht",
    description: "Hotelgarage oder Parkhaus Suquet – Croisette teuer.",
    price: "ca. 20–35 € / Nacht",
  },
];

export const GRANDES_ALPES_RAIN_ALTERNATIVES = [
  {
    name: "Briançon · Cité Vauban",
    subtitle: "Indoor / Stadt",
    description: "Festungsstadt zu Fuss – sinnvoller als ein Pass im Nebel.",
    price: "gratis / Museum variabel",
    duration: "ca. 2 Std.",
    href: GRANDES_ALPES_OFFICIAL_LINKS.briancon,
    linkLabel: "Briançon",
  },
  {
    name: "Barcelonnette · Villen",
    subtitle: "Ort",
    description: "Mexiko-Villen und Café – wenn die Bonette einen Tag wartet.",
    price: "gratis",
    duration: "ca. 1 Std.",
  },
  {
    name: "Cannes · Suquet",
    subtitle: "Ziel",
    description: "Gassen und Museum – falls der Turini nass ist: Küste früher ansteuern.",
    price: "gratis",
    href: GRANDES_ALPES_OFFICIAL_LINKS.cannes,
    linkLabel: "Cannes",
  },
];

export const GRANDES_ALPES_MUST_SEE_TRAILS = [
  {
    name: "Cormet de Roselend",
    subtitle: "Tag 2",
    description: "See und Kehren – zehn Minuten an der Staumauer, nicht nur durchfahren.",
    duration: "Stopp 15–30 Min.",
  },
  {
    name: "Casse Déserte · Izoard",
    subtitle: "Tag 4",
    description: "Mondlandschaft südlich der Passhöhe – Timer, Jacke.",
    duration: "Stopp 20–40 Min.",
  },
  {
    name: "Cime de la Bonette · Schleife",
    subtitle: "Tag 6",
    description: "Kurze Kamm-Runde oben mitfahren – sonst nur Restefond.",
    duration: "Stopp 20 Min.",
  },
];
