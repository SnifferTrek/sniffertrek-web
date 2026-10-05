import type { TravelReportConfig } from "@/lib/travelReports/types";
import {
  GRANDES_ALPES_HERO_PHOTO,
  GRANDES_ALPES_HERO_PHOTO_ALT,
  GRANDES_ALPES_HOTEL_PICKS,
  GRANDES_ALPES_HOTEL_TIPS,
  GRANDES_ALPES_MUST_SEE,
  GRANDES_ALPES_POI_PHOTOS,
  GRANDES_ALPES_REPORT,
  GRANDES_ALPES_SECTIONS,
  buildGrandesAlpesHotelPickLink,
  buildGrandesAlpesHotelSearchWindow,
  formatGrandesAlpesHotelWindowLabel,
} from "@/lib/travelReports/grandesAlpesReport";
import {
  buildGrandesAlpesPlanerUrl,
  GRANDES_ALPES_PLANER_HINT,
} from "@/lib/travelReports/grandesAlpesPlaner";
import { GRANDES_ALPES_GENERAL_INFO } from "@/lib/travelReports/grandesAlpesGeneralInfo";
import {
  GRANDES_ALPES_CLOSING,
  GRANDES_ALPES_FAQ,
  GRANDES_ALPES_META,
  getGrandesAlpesRelatedLinks,
} from "@/lib/travelReports/grandesAlpesSeo";
import {
  GRANDES_ALPES_LIGHTBOX_GALLERY,
  grandesAlpesGalleryIndexForSrc,
} from "@/lib/travelReports/grandesAlpesLightboxGallery";
import {
  GRANDES_ALPES_AT_A_GLANCE,
  GRANDES_ALPES_BUDGET,
  GRANDES_ALPES_DURATION_COMPARE,
  GRANDES_ALPES_EVENTS,
  GRANDES_ALPES_ITINERARY_7_DAYS,
  GRANDES_ALPES_JOURNEY_AXIS,
  GRANDES_ALPES_TOC,
  GRANDES_ALPES_TRANSFER_OPTIONS,
} from "@/lib/travelReports/grandesAlpesPlanning";
import { GRANDES_ALPES_FAVORITE_SPOTS } from "@/lib/travelReports/grandesAlpesSpots";
import {
  GRANDES_ALPES_AFFILIATE_DISCLOSURE,
  GRANDES_ALPES_ARTICLE_META,
  GRANDES_ALPES_CARD_CALLOUT,
  GRANDES_ALPES_FREE_ACTIVITIES,
  GRANDES_ALPES_GUIDE_CARDS,
  GRANDES_ALPES_SEASON_ROWS,
  getGrandesAlpesCuratedTours,
  GRANDES_ALPES_MUST_SEE_TRAILS,
  GRANDES_ALPES_RAIN_ALTERNATIVES,
  GRANDES_ALPES_CAR_ARRIVAL,
  GRANDES_ALPES_CAR_PARKING,
} from "@/lib/travelReports/grandesAlpesExtras";
import { applyAppleCopy } from "@/lib/travelReports/appleCopy";
import { GRANDES_ALPES_APPLE_EN } from "@/lib/travelReports/grandesAlpesApple.en";
import { GRANDES_ALPES_APPLE_ES } from "@/lib/travelReports/grandesAlpesApple.es";
import { pickLocaleCopy } from "@/lib/localeCopy";

export function getGrandesAlpesTravelReportConfig(locale = "de"): TravelReportConfig {
  const hotelWindow = buildGrandesAlpesHotelSearchWindow();

  const config: TravelReportConfig = {
    slug: "grandes-alpes",
    path: "/reisebericht/grandes-alpes",
    breadcrumbLabel: "Route des Grandes Alpes Reisebericht",
    layoutVariant: "coastal",
    journeyAxis: {
      title: GRANDES_ALPES_JOURNEY_AXIS.title,
      subtitle: GRANDES_ALPES_JOURNEY_AXIS.subtitle,
      stops: GRANDES_ALPES_JOURNEY_AXIS.stops,
      outro: GRANDES_ALPES_JOURNEY_AXIS.outro,
    },

    meta: {
      title: GRANDES_ALPES_META.title,
      description: GRANDES_ALPES_META.description,
      datePublished: GRANDES_ALPES_META.datePublished,
      dateModified: GRANDES_ALPES_META.dateModified,
    },

    hero: {
      photo: GRANDES_ALPES_HERO_PHOTO,
      photoAlt: GRANDES_ALPES_HERO_PHOTO_ALT,
      title: GRANDES_ALPES_REPORT.title,
      subtitle: GRANDES_ALPES_REPORT.subtitle,
      duration: GRANDES_ALPES_REPORT.duration,
      seoSubtitle: GRANDES_ALPES_REPORT.seoSubtitle,
      experienceNote: GRANDES_ALPES_ARTICLE_META.experienceNote,
      dateModifiedLabel: GRANDES_ALPES_ARTICLE_META.dateModifiedLabel,
    },

    lead: GRANDES_ALPES_REPORT.lead,
    printLead: GRANDES_ALPES_REPORT.printLead,
    affiliateDisclosure: GRANDES_ALPES_AFFILIATE_DISCLOSURE,

    specialCallout: {
      id: "paesse-statt-autobahn",
      title: GRANDES_ALPES_CARD_CALLOUT.title,
      body: GRANDES_ALPES_CARD_CALLOUT.body,
      bullets: GRANDES_ALPES_CARD_CALLOUT.bullets,
      href: GRANDES_ALPES_CARD_CALLOUT.officialHref,
      linkLabel: GRANDES_ALPES_CARD_CALLOUT.officialLabel,
      secondaryHref: GRANDES_ALPES_CARD_CALLOUT.faqHref,
      secondaryLinkLabel: GRANDES_ALPES_CARD_CALLOUT.faqLabel,
      variant: "info",
    },

    atAGlance: {
      mustSees: GRANDES_ALPES_AT_A_GLANCE.mustSees,
      quarters: GRANDES_ALPES_AT_A_GLANCE.quarters,
      transport: GRANDES_ALPES_AT_A_GLANCE.transport,
      planHint: GRANDES_ALPES_AT_A_GLANCE.planHint,
      planerHref: buildGrandesAlpesPlanerUrl(),
      planAnchorId: "plan-7-tage",
      planAnchorLabel: "7-Nächte-Plan ansehen",
    },

    freeActivities: GRANDES_ALPES_FREE_ACTIVITIES,

    printMap: {
      center: { lat: 45.1, lng: 6.7 },
      zoom: 7,
      mustSees: [
        { id: "ms-1", label: "Megève · 1. Nacht", lat: 45.8569, lng: 6.6178 },
        { id: "ms-2", label: "Col de l'Iseran", lat: 45.417, lng: 7.0306 },
        { id: "ms-3", label: "Briançon · 3. Nacht", lat: 44.8996, lng: 6.6435 },
        { id: "ms-4", label: "Cime de la Bonette", lat: 44.3211, lng: 6.8072 },
        { id: "ms-5", label: "Cannes · 7. Nacht", lat: 43.5528, lng: 7.0174 },
      ],
      orte: [
        { id: "o-a", label: "Genf · Start", lat: 46.2044, lng: 6.1432 },
        { id: "o-b", label: "Roselend", lat: 45.691, lng: 6.691, note: "See" },
        { id: "o-c", label: "Val-d'Isère", lat: 45.4481, lng: 6.9802, note: "2. Nacht" },
        { id: "o-d", label: "Galibier", lat: 45.064, lng: 6.4078 },
        { id: "o-e", label: "Izoard", lat: 44.8197, lng: 6.735, note: "Casse Déserte" },
        { id: "o-f", label: "Barcelonnette", lat: 44.3867, lng: 6.6528, note: "5. Nacht" },
        { id: "o-g", label: "Saint-Martin-Vésubie", lat: 44.0686, lng: 7.2564, note: "6. Nacht" },
        { id: "o-h", label: "Turini", lat: 43.981, lng: 7.392, note: "Meer" },
      ],
    },

    arrival: {
      callout: {
        title: GRANDES_ALPES_CAR_ARRIVAL.title,
        body: GRANDES_ALPES_CAR_ARRIVAL.intro,
        bullets: GRANDES_ALPES_CAR_ARRIVAL.warnings,
        href: GRANDES_ALPES_CAR_ARRIVAL.officialHref,
        linkLabel: GRANDES_ALPES_CAR_ARRIVAL.officialLabel,
        secondaryHref: GRANDES_ALPES_CAR_ARRIVAL.secondaryHref,
        secondaryLinkLabel: GRANDES_ALPES_CAR_ARRIVAL.secondaryLinkLabel,
        variant: "info",
      },
      parking: {
        id: "anreise-parken",
        title: "Anreise & Parken",
        intro: "Sieben Täler: Auto am Hotel, Pässe zu Fuss nur auf den Höhen.",
        items: GRANDES_ALPES_CAR_PARKING,
        collapsible: true,
      },
      transferTitle: "Auto aus der Schweiz · oder Flug Genf + Mietwagen",
      transferOptions: GRANDES_ALPES_TRANSFER_OPTIONS,
    },

    toc: GRANDES_ALPES_TOC,

    guideCards: {
      title: "Lohnt sich? · Iseran, Izoard & Bonette",
      cards: GRANDES_ALPES_GUIDE_CARDS,
    },

    rainAlternatives: {
      id: "regen",
      title: "Bei Regen · unsere Alternativen",
      intro: "Briançon zu Fuss, Barcelonnette, Suquet – nicht den Col im Nebel.",
      items: GRANDES_ALPES_RAIN_ALTERNATIVES,
    },

    specialVenueList: {
      id: "pass-stopps",
      title: "Pass-Stopps · nicht nur durchfahren",
      intro: "Roselend, Casse Déserte, Bonette-Schleife – Timer setzen.",
      items: GRANDES_ALPES_MUST_SEE_TRAILS,
      collapsible: true,
    },

    durationCompare: GRANDES_ALPES_DURATION_COMPARE,

    itinerary: {
      id: "plan-7-tage",
      title: "7 Nächte · zum Abhaken",
      subtitle: "Checkliste – die Geschichten stehen darunter.",
      days: GRANDES_ALPES_ITINERARY_7_DAYS,
    },

    sections: GRANDES_ALPES_SECTIONS,
    printStoryIds: [
      "genf-megeve",
      "roseland-valdisere",
      "iseran-galibier",
      "izoard-guillestre",
      "bonette-vesubie",
    ],
    favoriteSpots: GRANDES_ALPES_FAVORITE_SPOTS,

    lightboxGallery: GRANDES_ALPES_LIGHTBOX_GALLERY,
    galleryIndexForSrc: grandesAlpesGalleryIndexForSrc,

    poiCards: {
      title: "Highlights · Pässe und Nächte",
      subtitle: "Roselend, Iseran, Izoard, Bonette, Cannes – Bild antippen.",
      pois: GRANDES_ALPES_POI_PHOTOS,
    },

    mustSees: {
      heading: "Must-sees · 7 Nächte Alpen",
      items: GRANDES_ALPES_MUST_SEE,
      itemListName: "Must-sees Route des Grandes Alpes",
    },

    seasonRows: GRANDES_ALPES_SEASON_ROWS,
    tours: {
      title: "Geführte Touren · Savoyen & Küste",
      items: getGrandesAlpesCuratedTours(),
    },
    budget: {
      title: "Budget · Pässe & sieben Nächte",
      lines: GRANDES_ALPES_BUDGET,
      priceStandLabel: GRANDES_ALPES_ARTICLE_META.priceStandLabel,
    },
    events: GRANDES_ALPES_EVENTS,
    faq: {
      title: "Häufige Fragen zur Route des Grandes Alpes",
      items: GRANDES_ALPES_FAQ,
    },
    relatedLinks: getGrandesAlpesRelatedLinks(),

    hotels: {
      destinationLabel: GRANDES_ALPES_REPORT.title,
      intro: GRANDES_ALPES_HOTEL_TIPS.intro,
      searchLabel: formatGrandesAlpesHotelWindowLabel(),
      clickRef: "grandes-alpes-report",
      affiliateDestination: GRANDES_ALPES_REPORT.affiliateDestination,
      checkIn: hotelWindow.checkIn,
      checkOut: hotelWindow.checkOut,
      picks: GRANDES_ALPES_HOTEL_PICKS.map((pick) => ({
        ...pick,
        href: buildGrandesAlpesHotelPickLink(pick),
      })),
    },

    generalInfo: {
      title: GRANDES_ALPES_GENERAL_INFO.title,
      sections: GRANDES_ALPES_GENERAL_INFO.sections,
    },

    closing: GRANDES_ALPES_CLOSING,
    planer: {
      href: buildGrandesAlpesPlanerUrl(),
      ctaLabel: "Grandes Alpes im Planer anlegen",
      hint: GRANDES_ALPES_PLANER_HINT,
    },

    jsonLdAbout: {
      "@type": "Place",
      name: "Route des Grandes Alpes",
      containedInPlace: { "@type": "Country", name: "France" },
    },
  };
  const copy = pickLocaleCopy(locale, { en: GRANDES_ALPES_APPLE_EN, es: GRANDES_ALPES_APPLE_ES });
  return copy ? applyAppleCopy(config, copy) : config;
}
