/** Zusatz-Inhalte – gestaffelte Nächte, Plage Keller, St-Tropez-Region. */

import { buildGetYourGuideLink } from "@/lib/affiliateLinks";
import {
  COTE_DAZUR_COASTAL_ROUTE_WAYPOINTS,
} from "@/lib/travelReports/coteDazurMapPois";
import { COTE_DAZUR_OFFICIAL_LINKS } from "@/lib/travelReports/coteDazurOfficialLinks";

export const COTE_DAZUR_ARTICLE_META = {
  dateModifiedLabel: "26. Juli 2026",
  priceStandLabel: "Preise Stand Juli 2026",
  experienceNote:
    "Reisebericht aus unserer Sicht · 5 Nächte gestaffelt · Plage Keller · Mai",
} as const;

export const COTE_DAZUR_AFFILIATE_DISCLOSURE =
  "Einige Links zu Booking.com, Hotels.com und Touren sind Affiliate-Links – bei einer Buchung erhalten wir ggf. eine Provision, für dich ohne Mehrkosten.";

export const COTE_DAZUR_CARD_CALLOUT = {
  title: "Die eine Regel",
  body: "Zum Kennenlernen der Côte: **dem Meer entlang über Agay** – die **roten Felsen** der Corniche d'Or. Die **A8** ist schneller, zeigt aber kaum Riviera.",
  bullets: [
    "GPS oft auf Autobahn – Küstenroute fest einstellen",
    "Zeit für Fotostopps einplanen",
  ],
  officialLabel: "Plage Keller",
  officialHref: COTE_DAZUR_OFFICIAL_LINKS.plageKeller,
  faqLabel: "Hotel de Mougins",
  faqHref: COTE_DAZUR_OFFICIAL_LINKS.hotelDeMougins,
} as const;

export type CoteDazurFreeActivity = {
  label: string;
  anchor: string;
  note?: string;
};

export const COTE_DAZUR_FREE_ACTIVITIES: CoteDazurFreeActivity[] = [
  { label: "Promenade / Vieux Nice", anchor: "ankunft", note: "1. Abend" },
  { label: "Corniche · Agay rote Felsen", anchor: "saint-tropez" },
  { label: "Mougins · Dorfgassen", anchor: "mougins-cannes" },
  { label: "Port Grimaud · Kanäle", anchor: "saint-tropez" },
  { label: "Grimaud · Burgdorf", anchor: "grimaud-ramatuelle" },
  { label: "Ramatuelle · Dorf", anchor: "grimaud-ramatuelle" },
];

export type CoteDazurGuideCard = {
  id: string;
  title: string;
  verdict: string;
  price: string;
  timing: string;
  tip: string;
  href?: string;
  linkLabel?: string;
};

export const COTE_DAZUR_GUIDE_CARDS: CoteDazurGuideCard[] = [
  {
    id: "keller",
    title: "Plage Keller – lohnt sich?",
    verdict: "Ja – unser persönliches Highlight am Cap.",
    price: "Mittag ca. 45–80 € p. P.",
    timing: "Reservation · nach Picasso Antibes",
    tip: "Sand, Fisch, kein Hetzen – ein Moment setzen.",
    href: COTE_DAZUR_OFFICIAL_LINKS.plageKeller,
    linkLabel: "Plage Keller",
  },
  {
    id: "port-grimaud",
    title: "Port Grimaud – lohnt sich?",
    verdict: "Ja – ruhiger als der St-Tropez-Hafen.",
    price: "zu Fuss gratis",
    timing: "Nachmittag nach dem Hafen-Frühstart",
    tip: "Kanäle statt Souvenirmeile.",
  },
  {
    id: "grimaud-ramatuelle",
    title: "Grimaud & Ramatuelle?",
    verdict: "Ja – deshalb 2 Nächte in der Region.",
    price: "Parken variabel",
    timing: "Eigener Tag · nicht als Abstecher",
    tip: "Burgdorf + Strand – unser Tempo.",
    href: COTE_DAZUR_OFFICIAL_LINKS.grimaudTourism,
    linkLabel: "Grimaud · Tourismus",
  },
];

export const COTE_DAZUR_SEASON_ROWS = [
  { season: "Winter", months: "Dez–Feb", temp: "10–14 °C", crowd: "ruhig", note: "Keller oft zu" },
  { season: "Frühling", months: "Mär–Mai", temp: "16–24 °C", crowd: "mittel", note: "Mai Favorit" },
  { season: "Sommer", months: "Jun–Aug", temp: "bis 32 °C", crowd: "sehr voll", note: "St-Tropez extrem" },
  { season: "Herbst", months: "Sep–Nov", temp: "18–25 °C", crowd: "Sep noch voll", note: "Gute Autotage" },
] as const;

export type CoteDazurCuratedTour = {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
};

export function getCoteDazurCuratedTours(): CoteDazurCuratedTour[] {
  return [
    {
      title: "Picasso & Antibes",
      body: "Wenn ihr Museums-Slots nicht selbst organisieren wollt – vor dem Keller-Mittag.",
      href: buildGetYourGuideLink("Picasso Antibes Tour"),
      linkLabel: "Touren auf GetYourGuide",
    },
    {
      title: "Saint-Tropez & Region",
      body: "Geführter Tag – Alternative, wenn Parken nervt; wir blieben mit Auto vor Ort.",
      href: buildGetYourGuideLink("Saint Tropez Day Trip"),
      linkLabel: "St-Tropez Touren",
    },
    {
      title: "Port Grimaud Boot",
      body: "Kleine Kanalfahrt – ergänzt den Fussweg durch Port Grimaud.",
      href: buildGetYourGuideLink("Port Grimaud Boat"),
      linkLabel: "Boot Port Grimaud",
    },
  ];
}

export function buildCoteDazurGoogleMapsRouteUrl(): string {
  const coast = COTE_DAZUR_COASTAL_ROUTE_WAYPOINTS;
  const origin = `${coast[0].lat},${coast[0].lng}`;
  const destination = `${coast[coast.length - 1].lat},${coast[coast.length - 1].lng}`;
  const waypoints = coast
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

export type CoteDazurVenueTip = {
  name: string;
  subtitle?: string;
  description: string;
  price?: string;
  duration?: string;
  href?: string;
  linkLabel?: string;
};

export const COTE_DAZUR_CAR_ARRIVAL = {
  title: "Anreise mit dem Auto · aus Italien oder Mietwagen Nizza",
  intro:
    "Wir kamen **mit dem Auto** – **aus Italien** über die A8 oder per **Flug Nizza + Mietwagen**. Vor Ort gilt: **Küste statt Autobahn**. Die schönste Strecke ist die **Corniche d'Or** von **Cannes dem Meer entlang über Agay** (rote Felsen) in die St-Tropez-Region.",
  warnings: [
    "**Nicht die A8**, wenn ihr die Côte d'Azur kennenlernen wollt – GPS oft auf Autobahn; Küstenroute fest wählen.",
    "**Plage Keller**: Reservation – ohne kann die Wartezeit den Tag fressen.",
    "**Saint-Tropez** mittags: Parken und Nerven – früh starten, dann Port Grimaud.",
  ],
  officialLabel: "Plage Keller",
  officialHref: COTE_DAZUR_OFFICIAL_LINKS.plageKeller,
  secondaryLinkLabel: "Hotel de Mougins",
  secondaryHref: COTE_DAZUR_OFFICIAL_LINKS.hotelDeMougins,
} as const;

export const COTE_DAZUR_CAR_PARKING: CoteDazurVenueTip[] = [
  {
    name: "1 Nacht Nizza",
    subtitle: "Ankunft",
    description: "Parkhaus am Hotel oder nahe Zentrum – Mietwagen erst am nächsten Morgen intensiv nutzen.",
    price: "ca. 20–35 € / Nacht",
    duration: "Ankunftstag",
    href: COTE_DAZUR_OFFICIAL_LINKS.niceTourism,
    linkLabel: "Nizza · Infos",
  },
  {
    name: "Hotel de Mougins / Cannes",
    subtitle: "2 Nächte",
    description: "Parken am Hotel – Ausflüge Antibes, Keller, Küstenstrasse.",
    price: "oft inkl. / nach Absprache",
    href: COTE_DAZUR_OFFICIAL_LINKS.hotelDeMougins,
    linkLabel: "Hotel de Mougins",
  },
  {
    name: "Region Saint-Tropez",
    subtitle: "2 Nächte",
    description: "Hotel ausserhalb Hafen · für St-Tropez-Zentrum Parkhaus + Timer.",
    price: "Parken Hafen ca. 20–40 €",
    duration: "Kurzstopp früh",
  },
];

export const COTE_DAZUR_RAIN_ALTERNATIVES: CoteDazurVenueTip[] = [
  {
    name: "Musée Picasso · Antibes",
    subtitle: "Indoor",
    description: "Festung Grimaldi – auch ohne Strandwetter lohnenswert vor/nach Keller.",
    price: "ca. 8–12 €",
    duration: "ca. 1–2 Std.",
    href: COTE_DAZUR_OFFICIAL_LINKS.picassoAntibes,
    linkLabel: "Musée Picasso",
  },
  {
    name: "Port Grimaud zu Fuss",
    subtitle: "Kanäle",
    description: "Unter Schirm entlang der Wasserwege – weniger Wind als am offenen Strand.",
    price: "gratis",
    duration: "ca. 1 Std.",
  },
  {
    name: "Galerien · Mougins",
    subtitle: "Kunst",
    description: "Dorf und Café – Regen aushalten ohne weit zu fahren.",
    price: "gratis / Café",
    href: COTE_DAZUR_OFFICIAL_LINKS.mouginsTourism,
    linkLabel: "Mougins",
  },
];

export const COTE_DAZUR_MUST_SEE_TRAILS: CoteDazurVenueTip[] = [
  {
    name: "Corniche d'Or · Cannes–Agay",
    subtitle: "rote Felsen · kein A8",
    description:
      "Die schönste Strecke: dem Meer entlang über Théoule und Agay – Estérel-Porphyr, Buchten, Fotostopps. Autobahn meiden.",
    price: "gratis (Fahrt)",
    duration: "mit Stopps 1,5–3 Std.",
  },
  {
    name: "Port Grimaud · Kanäle",
    subtitle: "zu Fuss",
    description: "Besser als St-Tropez mittags – farbige Häuser am Wasser.",
    price: "gratis",
    duration: "ca. 50 Min.",
  },
  {
    name: "Grimaud · Burgdorf",
    subtitle: "zu Fuss",
    description: "Blick über den Golf – Kontrast zu Port Grimaud.",
    price: "gratis",
    duration: "ca. 45 Min.",
    href: COTE_DAZUR_OFFICIAL_LINKS.grimaudTourism,
    linkLabel: "Grimaud",
  },
  {
    name: "Ramatuelle · Dorf & Strand",
    subtitle: "Region",
    description: "Zweiter Regionstag – Pinien, Sand, weniger Pose.",
    price: "Parken variabel",
    duration: "halber Tag",
    href: COTE_DAZUR_OFFICIAL_LINKS.ramatuelleTourism,
    linkLabel: "Ramatuelle",
  },
];
