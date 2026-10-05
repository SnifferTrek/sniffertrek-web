import type { TravelReportConfig } from "@/lib/travelReports/types";
import {
  BARCELONA_HERO_PHOTO,
  BARCELONA_HERO_PHOTO_ALT,
  BARCELONA_HOTEL_PICKS,
  BARCELONA_HOTEL_TIPS,
  BARCELONA_MUST_SEE,
  BARCELONA_POI_PHOTOS,
  BARCELONA_REPORT,
  BARCELONA_SECTIONS,
  buildBarcelonaHotelPickLink,
  buildBarcelonaHotelSearchWindow,
  formatBarcelonaHotelWindowLabel,
} from "@/lib/travelReports/barcelonaReport";
import {
  buildBarcelonaPlanerUrl,
  BARCELONA_PLANER_HINT,
} from "@/lib/travelReports/barcelonaPlaner";
import { BARCELONA_GENERAL_INFO } from "@/lib/travelReports/barcelonaGeneralInfo";
import {
  BARCELONA_CLOSING,
  BARCELONA_FAQ,
  BARCELONA_META,
  getBarcelonaRelatedLinks,
} from "@/lib/travelReports/barcelonaSeo";
import {
  BARCELONA_LIGHTBOX_GALLERY,
  barcelonaGalleryIndexForSrc,
} from "@/lib/travelReports/barcelonaLightboxGallery";
import {
  BARCELONA_AT_A_GLANCE,
  BARCELONA_BUDGET,
  BARCELONA_DURATION_COMPARE,
  BARCELONA_EVENTS,
  BARCELONA_ITINERARY_4_DAYS,
  BARCELONA_JOURNEY_AXIS,
  BARCELONA_TOC,
  BARCELONA_TRANSFER_OPTIONS,
} from "@/lib/travelReports/barcelonaPlanning";
import { BARCELONA_FAVORITE_SPOTS } from "@/lib/travelReports/barcelonaSpots";
import {
  BARCELONA_AFFILIATE_DISCLOSURE,
  BARCELONA_ARTICLE_META,
  BARCELONA_FLIGHT_CALLOUT,
  BARCELONA_FREE_ACTIVITIES,
  BARCELONA_GUIDE_CARDS,
  BARCELONA_SEASON_ROWS,
  getBarcelonaCuratedTours,
  BARCELONA_MUST_SEE_MUSEUMS,
  BARCELONA_RAIN_ALTERNATIVES,
  BARCELONA_PUBLIC_TRANSIT,
  BARCELONA_TRANSIT_TIPS,
} from "@/lib/travelReports/barcelonaExtras";
import { applyAppleCopy } from "@/lib/travelReports/appleCopy";
import { BARCELONA_APPLE_EN } from "@/lib/travelReports/barcelonaApple.en";
import { BARCELONA_APPLE_ES } from "@/lib/travelReports/barcelonaApple.es";
import { pickLocaleCopy } from "@/lib/localeCopy";

export function getBarcelonaTravelReportConfig(locale = "de"): TravelReportConfig {
  const hotelWindow = buildBarcelonaHotelSearchWindow();

  const config: TravelReportConfig = {
    slug: "barcelona",
    path: "/reisebericht/barcelona",
    breadcrumbLabel: "Barcelona Reisebericht",
    layoutVariant: "coastal",
    journeyAxis: {
      title: BARCELONA_JOURNEY_AXIS.title,
      subtitle: BARCELONA_JOURNEY_AXIS.subtitle,
      stops: BARCELONA_JOURNEY_AXIS.stops,
      outro: BARCELONA_JOURNEY_AXIS.outro,
    },

    meta: {
      title: BARCELONA_META.title,
      description: BARCELONA_META.description,
      datePublished: BARCELONA_META.datePublished,
      dateModified: BARCELONA_META.dateModified,
    },

    hero: {
      photo: BARCELONA_HERO_PHOTO,
      photoAlt: BARCELONA_HERO_PHOTO_ALT,
      title: BARCELONA_REPORT.title,
      subtitle: BARCELONA_REPORT.subtitle,
      duration: BARCELONA_REPORT.duration,
      seoSubtitle: BARCELONA_REPORT.seoSubtitle,
      experienceNote: BARCELONA_ARTICLE_META.experienceNote,
      dateModifiedLabel: BARCELONA_ARTICLE_META.dateModifiedLabel,
    },

    lead: BARCELONA_REPORT.lead,
    printLead: BARCELONA_REPORT.printLead,
    affiliateDisclosure: BARCELONA_AFFILIATE_DISCLOSURE,

    specialCallout: {
      id: "flug-kein-auto",
      title: BARCELONA_FLIGHT_CALLOUT.title,
      body: BARCELONA_FLIGHT_CALLOUT.body,
      bullets: BARCELONA_FLIGHT_CALLOUT.bullets,
      href: BARCELONA_FLIGHT_CALLOUT.officialHref,
      linkLabel: BARCELONA_FLIGHT_CALLOUT.officialLabel,
      secondaryHref: BARCELONA_FLIGHT_CALLOUT.faqHref,
      secondaryLinkLabel: BARCELONA_FLIGHT_CALLOUT.faqLabel,
      variant: "info",
    },

    atAGlance: {
      mustSees: BARCELONA_AT_A_GLANCE.mustSees,
      quarters: BARCELONA_AT_A_GLANCE.quarters,
      transport: BARCELONA_AT_A_GLANCE.transport,
      planHint: BARCELONA_AT_A_GLANCE.planHint,
      planerHref: buildBarcelonaPlanerUrl(),
      planAnchorId: "plan-4-tage",
      planAnchorLabel: "4-Tage-Plan ansehen",
    },

    freeActivities: BARCELONA_FREE_ACTIVITIES,

    printMap: {
      center: { lat: 41.3874, lng: 2.1686 },
      zoom: 13,
      mustSees: [
        { id: "ms-1", label: "Sagrada Família", lat: 41.4036, lng: 2.1744 },
        { id: "ms-2", label: "Park Güell", lat: 41.4145, lng: 2.1527 },
        { id: "ms-3", label: "Barri Gòtic", lat: 41.3839, lng: 2.1763 },
        { id: "ms-4", label: "Passeig de Gràcia", lat: 41.3917, lng: 2.1649 },
        { id: "ms-5", label: "Barceloneta", lat: 41.3788, lng: 2.189 },
      ],
      orte: [
        { id: "o-a", label: "El Born", lat: 41.3851, lng: 2.1834, note: "Basis" },
        { id: "o-b", label: "La Boquería", lat: 41.3816, lng: 2.1715, note: "Früh" },
        { id: "o-c", label: "Museu Picasso", lat: 41.3851, lng: 2.1809 },
        { id: "o-d", label: "Gràcia", lat: 41.4036, lng: 2.1564 },
        { id: "o-e", label: "Montjuïc", lat: 41.3634, lng: 2.1587, note: "Optional" },
        { id: "o-f", label: "Plaça Catalunya", lat: 41.387, lng: 2.1701, note: "Metro" },
      ],
    },

    arrival: {
      callout: {
        title: BARCELONA_PUBLIC_TRANSIT.title,
        body: BARCELONA_PUBLIC_TRANSIT.intro,
        bullets: BARCELONA_PUBLIC_TRANSIT.warnings,
        href: BARCELONA_PUBLIC_TRANSIT.officialHref,
        linkLabel: BARCELONA_PUBLIC_TRANSIT.officialLabel,
        secondaryHref: BARCELONA_PUBLIC_TRANSIT.secondaryHref,
        secondaryLinkLabel: BARCELONA_PUBLIC_TRANSIT.secondaryLinkLabel,
        variant: "info",
      },
      parking: {
        id: "anreise-oepnv",
        title: "Tickets & Metro",
        intro: "Kurz verglichen – ohne Mietauto.",
        items: BARCELONA_TRANSIT_TIPS,
        collapsible: true,
      },
      transferTitle: "Flughafen El Prat → Zentrum",
      transferOptions: BARCELONA_TRANSFER_OPTIONS,
    },

    toc: BARCELONA_TOC,

    guideCards: {
      title: "Lohnt sich? · Sagrada, Park Güell & Mietauto",
      cards: BARCELONA_GUIDE_CARDS,
    },

    rainAlternatives: {
      id: "regen",
      title: "Bei Regen · unsere Alternativen",
      intro: "Museum, Palau oder Gaudí innen – statt nasser Strassen.",
      items: BARCELONA_RAIN_ALTERNATIVES,
    },

    specialVenueList: {
      id: "museen",
      title: "Must-see Museen",
      intro: "Zwei bis drei reichen – Qualität vor Quantität.",
      items: BARCELONA_MUST_SEE_MUSEUMS,
      collapsible: true,
    },

    durationCompare: BARCELONA_DURATION_COMPARE,

    itinerary: {
      id: "plan-4-tage",
      title: "4 Tage · zum Abhaken",
      subtitle: "Checkliste – die Geschichten stehen darunter.",
      days: BARCELONA_ITINERARY_4_DAYS,
    },

    sections: BARCELONA_SECTIONS,
    printStoryIds: ["ankunft", "sagrada", "park-guell", "strand"],
    favoriteSpots: BARCELONA_FAVORITE_SPOTS,

    lightboxGallery: BARCELONA_LIGHTBOX_GALLERY,
    galleryIndexForSrc: barcelonaGalleryIndexForSrc,

    poiCards: {
      title: "Sehenswürdigkeiten in Barcelona",
      subtitle: "Unsere Tipps – kurz und auf den Punkt. Bild antippen zum Vergrössern.",
      pois: BARCELONA_POI_PHOTOS,
    },

    mustSees: {
      heading: "Must-sees · 4 Tage Barcelona",
      items: BARCELONA_MUST_SEE,
      itemListName: "Must-sees Barcelona in 4 Tagen",
    },

    seasonRows: BARCELONA_SEASON_ROWS,
    tours: {
      title: "Geführte Touren · Barcelona",
      items: getBarcelonaCuratedTours(),
    },
    budget: {
      title: "Budget · Was kostet Barcelona?",
      lines: BARCELONA_BUDGET,
      priceStandLabel: BARCELONA_ARTICLE_META.priceStandLabel,
    },
    events: BARCELONA_EVENTS,
    faq: {
      title: "Häufige Fragen zu Barcelona",
      items: BARCELONA_FAQ,
    },
    relatedLinks: getBarcelonaRelatedLinks(),

    hotels: {
      destinationLabel: BARCELONA_REPORT.title,
      intro: BARCELONA_HOTEL_TIPS.intro,
      searchLabel: formatBarcelonaHotelWindowLabel(),
      clickRef: "barcelona-report",
      affiliateDestination: BARCELONA_REPORT.affiliateDestination,
      checkIn: hotelWindow.checkIn,
      checkOut: hotelWindow.checkOut,
      picks: BARCELONA_HOTEL_PICKS.map((pick) => ({
        ...pick,
        href: buildBarcelonaHotelPickLink(pick),
      })),
    },

    generalInfo: {
      title: BARCELONA_GENERAL_INFO.title,
      sections: BARCELONA_GENERAL_INFO.sections,
    },

    closing: BARCELONA_CLOSING,
    planer: {
      href: buildBarcelonaPlanerUrl(),
      ctaLabel: "Barcelona im Planer anlegen",
      hint: BARCELONA_PLANER_HINT,
    },

    jsonLdAbout: {
      "@type": "City",
      name: "Barcelona",
      containedInPlace: { "@type": "Country", name: "Spanien" },
    },
  };
  const copy = pickLocaleCopy(locale, { en: BARCELONA_APPLE_EN, es: BARCELONA_APPLE_ES });
  return copy ? applyAppleCopy(config, copy) : config;
}
