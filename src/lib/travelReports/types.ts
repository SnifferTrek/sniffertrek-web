import type { GuideCard } from "@/components/TravelReportGuideCards";
import type { HotelPickLink } from "@/components/TravelReportFooterTabs";
import type { TravelReportPoiCard } from "@/components/TravelReportPoiCards";
import type { VenueListItem } from "@/components/TravelReportVenueList";
import type { TravelReportPrintMap } from "@/lib/travelReports/printMap";

export type TravelReportSlug =
  | "venedig"
  | "cinque-terre"
  | "cote-dazur"
  | "barcelona"
  | "provence"
  | "grandes-alpes";

/** Vergrösserbare Bilder in Lightbox-Galerien. */
export type LightboxSlide = {
  src: string;
  alt: string;
  caption?: string;
};

export type ReportTip = {
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
  image?: string;
  imageAlt?: string;
  imageCaption?: string;
};

export type ReportSection = {
  id: string;
  kicker?: string;
  title: string;
  paragraphs: string[];
  /**
   * PDF «Unterwegs» (1 Seite): ein kompakter Absatz.
   * Fehlt → erster `paragraphs`-Eintrag, auf Slot-Budget gekürzt.
   */
  printParagraph?: string;
  tips?: ReportTip[];
  photo?: string;
  photoAlt?: string;
  photoCaption?: string;
  inlinePhoto?: string;
  inlinePhotoAlt?: string;
  inlinePhotoCaption?: string;
  couplePhoto?: string;
  couplePhotoAlt?: string;
  coupleCaption?: string;
  /** Kurze «Anna & Thomas»-Einblendung (2–3 Sätze). */
  story?: string;
};

export type TravelReportCalloutData = {
  id: string;
  title: string;
  body: string;
  bullets?: readonly string[];
  href?: string;
  linkLabel?: string;
  secondaryHref?: string;
  secondaryLinkLabel?: string;
  /** warn = amber (z. B. Eintrittsgebühr), info = teal (z. B. Destination Card) */
  variant?: "info" | "warn";
};

export type TravelReportVenueBlock = {
  id: string;
  title: string;
  intro?: string;
  items: readonly VenueListItem[];
  collapsible?: boolean;
};

export type TravelReportFavoriteSpot = {
  id: string;
  name: string;
  type: string;
  note: string;
};

export type TravelReportHotelPick = {
  id: string;
  name: string;
  stars: string;
  area: string;
  note: string;
  audience?: string;
  tier: HotelPickLink["tier"];
  href: string;
};

export type TravelReportTocItem = {
  id: string;
  label: string;
};

export type TravelReportItineraryDay = {
  day: number;
  title: string;
  items: readonly string[];
};

export type TravelReportDurationOption = {
  days: string;
  summary: string;
};

export type TravelReportTransferOption = {
  title: string;
  body: string;
  price: string;
  href?: string;
  linkLabel?: string;
  secondaryHref?: string;
  secondaryLinkLabel?: string;
};

export type TravelReportBudgetLine = {
  label: string;
  price: string;
  note?: string;
  anchorId?: string;
};

export type TravelReportSeasonRow = {
  season: string;
  months: string;
  temp: string;
  crowd: string;
  note: string;
};

export type TravelReportTour = {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
};

export type TravelReportEvent = {
  name: string;
  when: string;
  note: string;
};

export type TravelReportFaqItem = {
  question: string;
  answer: string;
  href?: string;
  linkLabel?: string;
};

export type TravelReportRelatedLink = {
  href: string;
  label: string;
  description: string;
};

export type TravelReportJsonLdAbout = {
  "@type": "City" | "Place";
  name: string;
  containedInPlace: { "@type": "Country"; name: string };
};

/**
 * Einheitliche Seitenstruktur für alle Reiseberichte.
 * Variable Inhalte (Callouts, Abschnitte, Karte) füllen feste Slots.
 */
/** Optional: Küsten-Layout (Orientierung → Geschichte → Praxis). */
export type TravelReportLayoutVariant = "default" | "coastal";

export type TravelReportJourneyStop = {
  nights: string;
  place: string;
  note: string;
};

export type TravelReportConfig = {
  slug: TravelReportSlug;
  path: string;
  breadcrumbLabel: string;

  /** default = bestehende Reihenfolge; coastal = Côte-Struktur + Look */
  layoutVariant?: TravelReportLayoutVariant;

  /** Visuelle Route-Achse (nur coastal sinnvoll) */
  journeyAxis?: {
    title?: string;
    subtitle?: string;
    stops: readonly TravelReportJourneyStop[];
    outro?: string;
  };

  meta: {
    title: string;
    description: string;
    datePublished: string;
    dateModified: string;
  };

  hero: {
    photo: string;
    photoAlt: string;
    title: string;
    subtitle: string;
    duration: string;
    seoSubtitle: string;
    experienceNote: string;
    dateModifiedLabel: string;
  };

  lead: string;
  /**
   * PDF Seite 1: Lead auf Slot-Budget (~2–3 Zeilen).
   * Web behält `lead` (länger).
   */
  printLead: string;
  affiliateDisclosure: string;

  /** Top-Callout: Eintrittsgebühr, Destination Card, … */
  specialCallout: TravelReportCalloutData;

  atAGlance: {
    mustSees: readonly string[];
    quarters: string;
    transport: string;
    planHint: string;
    planerHref: string;
    planAnchorId?: string;
    planAnchorLabel?: string;
  };

  freeActivities: readonly { label: string; anchor: string; note?: string }[];

  /** Überblick-Druckkarte: Must-sees (1–9) + Orte (A–Z). */
  printMap: TravelReportPrintMap;

  arrival: {
    callout: Omit<TravelReportCalloutData, "id" | "variant"> & { variant?: "info" | "warn" };
    parking: TravelReportVenueBlock;
    transferTitle: string;
    transferOptions: readonly TravelReportTransferOption[];
  };

  toc: readonly TravelReportTocItem[];

  guideCards: {
    title: string;
    cards: readonly GuideCard[];
  };

  rainAlternatives: TravelReportVenueBlock;

  /** Museen, Wanderwege, … */
  specialVenueList: TravelReportVenueBlock;

  durationCompare: readonly TravelReportDurationOption[];

  itinerary: {
    id: string;
    title: string;
    subtitle?: string;
    days: readonly TravelReportItineraryDay[];
  };

  sections: readonly ReportSection[];
  /**
   * PDF «Unterwegs» (max. 1 Seite): Reihenfolge/Auswahl der Abschnitte.
   * Fehlt → erste `PRINT_STORY.maxSections` aus `sections`.
   */
  printStoryIds?: readonly string[];
  favoriteSpots: readonly TravelReportFavoriteSpot[];

  lightboxGallery: readonly LightboxSlide[];
  galleryIndexForSrc: (src: string) => number;

  poiCards: {
    title: string;
    subtitle: string;
    pois: readonly TravelReportPoiCard[];
  };

  mustSees: {
    heading: string;
    items: readonly string[];
    itemListName: string;
  };

  seasonRows: readonly TravelReportSeasonRow[];
  tours: {
    title: string;
    items: readonly TravelReportTour[];
  };
  budget: {
    title: string;
    lines: readonly TravelReportBudgetLine[];
    priceStandLabel: string;
  };
  events: readonly TravelReportEvent[];
  faq: {
    title: string;
    items: readonly TravelReportFaqItem[];
  };
  relatedLinks: readonly TravelReportRelatedLink[];

  hotels: {
    destinationLabel: string;
    intro: string;
    searchLabel: string;
    clickRef: string;
    affiliateDestination: string;
    checkIn: string;
    checkOut: string;
    picks: readonly TravelReportHotelPick[];
  };

  generalInfo: {
    title: string;
    sections: readonly { heading: string; body: string }[];
  };

  closing: string;
  planer: {
    href: string;
    ctaLabel: string;
    hint: string;
  };

  jsonLdAbout: TravelReportJsonLdAbout;
};
