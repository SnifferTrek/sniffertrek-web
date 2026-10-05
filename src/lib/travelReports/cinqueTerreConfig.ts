import type { TravelReportConfig } from "@/lib/travelReports/types";
import {
  CINQUE_TERRE_HERO_PHOTO,
  CINQUE_TERRE_HERO_PHOTO_ALT,
  CINQUE_TERRE_HOTEL_PICKS,
  CINQUE_TERRE_HOTEL_TIPS,
  CINQUE_TERRE_MUST_SEE,
  CINQUE_TERRE_POI_PHOTOS,
  CINQUE_TERRE_REPORT,
  CINQUE_TERRE_SECTIONS,
  buildCinqueTerreHotelPickLink,
  buildCinqueTerreHotelSearchWindow,
  formatCinqueTerreHotelWindowLabel,
} from "@/lib/travelReports/cinqueTerreReport";
import {
  buildCinqueTerrePlanerUrl,
  CINQUE_TERRE_PLANER_HINT,
} from "@/lib/travelReports/cinqueTerrePlaner";
import { CINQUE_TERRE_GENERAL_INFO } from "@/lib/travelReports/cinqueTerreGeneralInfo";
import {
  CINQUE_TERRE_CLOSING,
  CINQUE_TERRE_FAQ,
  CINQUE_TERRE_META,
  getCinqueTerreRelatedLinks,
} from "@/lib/travelReports/cinqueTerreSeo";
import {
  CINQUE_TERRE_LIGHTBOX_GALLERY,
  cinqueTerreGalleryIndexForSrc,
} from "@/lib/travelReports/cinqueTerreLightboxGallery";
import {
  CINQUE_TERRE_AT_A_GLANCE,
  CINQUE_TERRE_BUDGET,
  CINQUE_TERRE_DURATION_COMPARE,
  CINQUE_TERRE_EVENTS,
  CINQUE_TERRE_ITINERARY_4_DAYS,
  CINQUE_TERRE_JOURNEY_AXIS,
  CINQUE_TERRE_TOC,
  CINQUE_TERRE_TRANSFER_OPTIONS,
} from "@/lib/travelReports/cinqueTerrePlanning";
import { CINQUE_TERRE_FAVORITE_SPOTS } from "@/lib/travelReports/cinqueTerreSpots";
import {
  CINQUE_TERRE_AFFILIATE_DISCLOSURE,
  CINQUE_TERRE_ARTICLE_META,
  CINQUE_TERRE_CARD_CALLOUT,
  CINQUE_TERRE_FREE_ACTIVITIES,
  CINQUE_TERRE_GUIDE_CARDS,
  CINQUE_TERRE_SEASON_ROWS,
  getCinqueTerreCuratedTours,
  CINQUE_TERRE_MUST_SEE_TRAILS,
  CINQUE_TERRE_RAIN_ALTERNATIVES,
  CINQUE_TERRE_CAR_ARRIVAL,
  CINQUE_TERRE_CAR_PARKING,
} from "@/lib/travelReports/cinqueTerreExtras";
import { applyAppleCopy } from "@/lib/travelReports/appleCopy";
import { CINQUE_TERRE_APPLE_EN } from "@/lib/travelReports/cinqueTerreApple.en";
import { CINQUE_TERRE_APPLE_ES } from "@/lib/travelReports/cinqueTerreApple.es";
import { pickLocaleCopy } from "@/lib/localeCopy";

export function getCinqueTerreTravelReportConfig(locale = "de"): TravelReportConfig {
  const hotelWindow = buildCinqueTerreHotelSearchWindow();

  const config: TravelReportConfig = {
    slug: "cinque-terre",
    path: "/reisebericht/cinque-terre",
    breadcrumbLabel: "Cinque Terre Reisebericht",
    layoutVariant: "coastal",
    journeyAxis: {
      title: CINQUE_TERRE_JOURNEY_AXIS.title,
      subtitle: CINQUE_TERRE_JOURNEY_AXIS.subtitle,
      stops: CINQUE_TERRE_JOURNEY_AXIS.stops,
      outro: CINQUE_TERRE_JOURNEY_AXIS.outro,
    },

    meta: {
      title: CINQUE_TERRE_META.title,
      description: CINQUE_TERRE_META.description,
      datePublished: CINQUE_TERRE_META.datePublished,
      dateModified: CINQUE_TERRE_META.dateModified,
    },

    hero: {
      photo: CINQUE_TERRE_HERO_PHOTO,
      photoAlt: CINQUE_TERRE_HERO_PHOTO_ALT,
      title: CINQUE_TERRE_REPORT.title,
      subtitle: CINQUE_TERRE_REPORT.subtitle,
      duration: CINQUE_TERRE_REPORT.duration,
      seoSubtitle: CINQUE_TERRE_REPORT.seoSubtitle,
      experienceNote: CINQUE_TERRE_ARTICLE_META.experienceNote,
      dateModifiedLabel: CINQUE_TERRE_ARTICLE_META.dateModifiedLabel,
    },

    lead: CINQUE_TERRE_REPORT.lead,
    printLead: CINQUE_TERRE_REPORT.printLead,
    affiliateDisclosure: CINQUE_TERRE_AFFILIATE_DISCLOSURE,

    specialCallout: {
      id: "cinque-terre-card",
      title: CINQUE_TERRE_CARD_CALLOUT.title,
      body: CINQUE_TERRE_CARD_CALLOUT.body,
      bullets: CINQUE_TERRE_CARD_CALLOUT.bullets,
      href: CINQUE_TERRE_CARD_CALLOUT.officialHref,
      linkLabel: CINQUE_TERRE_CARD_CALLOUT.officialLabel,
      secondaryHref: CINQUE_TERRE_CARD_CALLOUT.faqHref,
      secondaryLinkLabel: CINQUE_TERRE_CARD_CALLOUT.faqLabel,
      variant: "info",
    },

    atAGlance: {
      mustSees: CINQUE_TERRE_AT_A_GLANCE.mustSees,
      quarters: CINQUE_TERRE_AT_A_GLANCE.quarters,
      transport: CINQUE_TERRE_AT_A_GLANCE.transport,
      // Ein Satz für PDF-Slot «Rhythmus» – Saison steht in Hero-Meta
      planHint: CINQUE_TERRE_AT_A_GLANCE.planHint,
      planerHref: buildCinqueTerrePlanerUrl(),
      planAnchorId: "plan-4-tage",
      planAnchorLabel: "4-Tage-Plan ansehen",
    },

    freeActivities: CINQUE_TERRE_FREE_ACTIVITIES,

    printMap: {
      center: { lat: 44.1, lng: 9.78 },
      zoom: 11,
      // Genau 5 Must-sees / 8 Orte – Slot-Budget Seite 1
      mustSees: [
        { id: "ms-1", label: "Porto Venere", lat: 44.0494, lng: 9.8343 },
        { id: "ms-2", label: "Via dell'Amore", lat: 44.102, lng: 9.732 },
        { id: "ms-3", label: "Vernazza", lat: 44.1351, lng: 9.6842 },
        { id: "ms-4", label: "Monterosso", lat: 44.1456, lng: 9.6549 },
        { id: "ms-5", label: "Isola Palmaria", lat: 44.042, lng: 9.842 },
      ],
      orte: [
        { id: "o-a", label: "Hafenpromenade", lat: 44.0494, lng: 9.8343 },
        { id: "o-b", label: "Byron-Grotte & San Pietro", lat: 44.0482, lng: 9.8368, note: "Abend" },
        { id: "o-c", label: "Belvedere Manarola", lat: 44.1063, lng: 9.7276, note: "Frei" },
        { id: "o-d", label: "Gassen Riomaggiore", lat: 44.0994, lng: 9.7377 },
        { id: "o-e", label: "Strand Monterosso", lat: 44.1456, lng: 9.6549, note: "Nach Trail" },
        { id: "o-f", label: "Aussicht vom Zug", lat: 44.12, lng: 9.71, note: "Küste" },
        { id: "o-g", label: "Manarola Hafen", lat: 44.106, lng: 9.728 },
        { id: "o-h", label: "Corniglia Plateau", lat: 44.1194, lng: 9.709 },
      ],
    },

    arrival: {
      callout: {
        title: CINQUE_TERRE_CAR_ARRIVAL.title,
        body: CINQUE_TERRE_CAR_ARRIVAL.intro,
        bullets: CINQUE_TERRE_CAR_ARRIVAL.warnings,
        href: CINQUE_TERRE_CAR_ARRIVAL.officialHref,
        linkLabel: CINQUE_TERRE_CAR_ARRIVAL.officialLabel,
        secondaryHref: CINQUE_TERRE_CAR_ARRIVAL.secondaryHref,
        secondaryLinkLabel: CINQUE_TERRE_CAR_ARRIVAL.secondaryLinkLabel,
        variant: "info",
      },
      parking: {
        id: "anreise-parken",
        title: "Anreise & Parken",
        intro: "Auto, Zug oder Flughafen – Kurzüberblick.",
        items: CINQUE_TERRE_CAR_PARKING,
        collapsible: true,
      },
      transferTitle: "Pisa oder Genua → La Spezia → Porto Venere",
      transferOptions: CINQUE_TERRE_TRANSFER_OPTIONS,
    },

    toc: CINQUE_TERRE_TOC,

    guideCards: {
      title: "Lohnt sich? · Via dell'Amore, Wandern & Boot",
      cards: CINQUE_TERRE_GUIDE_CARDS,
    },

    rainAlternatives: {
      id: "regen",
      title: "Bei Regen · unsere Alternativen",
      intro: "Mai kann nass sein – dann Zug statt Trail oder länger essen.",
      items: CINQUE_TERRE_RAIN_ALTERNATIVES,
    },

    specialVenueList: {
      id: "wanderwege",
      title: "Wanderwege & Via dell'Amore",
      intro: "Für vier Tage reichen zwei Trails – Card und Status vorher klären.",
      items: CINQUE_TERRE_MUST_SEE_TRAILS,
      collapsible: true,
    },

    durationCompare: CINQUE_TERRE_DURATION_COMPARE,

    itinerary: {
      id: "plan-4-tage",
      title: "4 Nächte · zum Abhaken",
      subtitle: "Checkliste – die Geschichten stehen darunter.",
      days: CINQUE_TERRE_ITINERARY_4_DAYS,
    },

    sections: CINQUE_TERRE_SECTIONS,
    /** PDF Unterwegs · 1 Seite · Tages-Kern */
    printStoryIds: ["ankunft", "cinque-terre-zug", "via-amore", "wanderung", "boot"],
    favoriteSpots: CINQUE_TERRE_FAVORITE_SPOTS,

    lightboxGallery: CINQUE_TERRE_LIGHTBOX_GALLERY,
    galleryIndexForSrc: cinqueTerreGalleryIndexForSrc,

    poiCards: {
      title: "Highlights · Porto Venere & Cinque Terre",
      subtitle:
        "Unsere Lieblingsorte an der Küste – kurz und auf den Punkt. Bild antippen zum Vergrössern.",
      pois: CINQUE_TERRE_POI_PHOTOS,
    },

    mustSees: {
      heading: "Must-sees · 4 Tage Ligurien",
      items: CINQUE_TERRE_MUST_SEE,
      itemListName: "Must-sees Porto Venere & Cinque Terre",
    },

    seasonRows: CINQUE_TERRE_SEASON_ROWS,
    tours: {
      title: "Geführte Touren · Cinque Terre & Ligurien",
      items: getCinqueTerreCuratedTours(),
    },
    budget: {
      title: "Budget · Cinque Terre & Porto Venere",
      lines: CINQUE_TERRE_BUDGET,
      priceStandLabel: CINQUE_TERRE_ARTICLE_META.priceStandLabel,
    },
    events: CINQUE_TERRE_EVENTS,
    faq: {
      title: "Häufige Fragen zur Cinque Terre",
      items: CINQUE_TERRE_FAQ,
    },
    relatedLinks: getCinqueTerreRelatedLinks(),

    hotels: {
      destinationLabel: CINQUE_TERRE_REPORT.title,
      intro: CINQUE_TERRE_HOTEL_TIPS.intro,
      searchLabel: formatCinqueTerreHotelWindowLabel(),
      clickRef: "cinque-terre-report",
      affiliateDestination: CINQUE_TERRE_REPORT.affiliateDestination,
      checkIn: hotelWindow.checkIn,
      checkOut: hotelWindow.checkOut,
      picks: CINQUE_TERRE_HOTEL_PICKS.map((pick) => ({
        ...pick,
        href: buildCinqueTerreHotelPickLink(pick),
      })),
    },

    generalInfo: {
      title: CINQUE_TERRE_GENERAL_INFO.title,
      sections: CINQUE_TERRE_GENERAL_INFO.sections,
    },

    closing: CINQUE_TERRE_CLOSING,
    planer: {
      href: buildCinqueTerrePlanerUrl(),
      ctaLabel: "Cinque Terre im Planer anlegen",
      hint: CINQUE_TERRE_PLANER_HINT,
    },

    jsonLdAbout: {
      "@type": "Place",
      name: "Porto Venere",
      containedInPlace: { "@type": "Country", name: "Italien" },
    },
  };
  const copy = pickLocaleCopy(locale, { en: CINQUE_TERRE_APPLE_EN, es: CINQUE_TERRE_APPLE_ES });
  return copy ? applyAppleCopy(config, copy) : config;
}
