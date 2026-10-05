import type { TravelReportConfig } from "@/lib/travelReports/types";
import {
  COTE_DAZUR_HERO_PHOTO,
  COTE_DAZUR_HERO_PHOTO_ALT,
  COTE_DAZUR_HOTEL_PICKS,
  COTE_DAZUR_HOTEL_TIPS,
  COTE_DAZUR_MUST_SEE,
  COTE_DAZUR_POI_PHOTOS,
  COTE_DAZUR_REPORT,
  COTE_DAZUR_SECTIONS,
  buildCoteDazurHotelPickLink,
  buildCoteDazurHotelSearchWindow,
  formatCoteDazurHotelWindowLabel,
} from "@/lib/travelReports/coteDazurReport";
import {
  buildCoteDazurPlanerUrl,
  COTE_DAZUR_PLANER_HINT,
} from "@/lib/travelReports/coteDazurPlaner";
import { COTE_DAZUR_GENERAL_INFO } from "@/lib/travelReports/coteDazurGeneralInfo";
import {
  COTE_DAZUR_CLOSING,
  COTE_DAZUR_FAQ,
  COTE_DAZUR_META,
  getCoteDazurRelatedLinks,
} from "@/lib/travelReports/coteDazurSeo";
import {
  COTE_DAZUR_LIGHTBOX_GALLERY,
  coteDazurGalleryIndexForSrc,
} from "@/lib/travelReports/coteDazurLightboxGallery";
import {
  COTE_DAZUR_AT_A_GLANCE,
  COTE_DAZUR_BUDGET,
  COTE_DAZUR_DURATION_COMPARE,
  COTE_DAZUR_EVENTS,
  COTE_DAZUR_ITINERARY_5_DAYS,
  COTE_DAZUR_JOURNEY_AXIS,
  COTE_DAZUR_TOC,
  COTE_DAZUR_TRANSFER_OPTIONS,
} from "@/lib/travelReports/coteDazurPlanning";
import { COTE_DAZUR_FAVORITE_SPOTS } from "@/lib/travelReports/coteDazurSpots";
import {
  COTE_DAZUR_AFFILIATE_DISCLOSURE,
  COTE_DAZUR_ARTICLE_META,
  COTE_DAZUR_CARD_CALLOUT,
  COTE_DAZUR_FREE_ACTIVITIES,
  COTE_DAZUR_GUIDE_CARDS,
  COTE_DAZUR_SEASON_ROWS,
  getCoteDazurCuratedTours,
  COTE_DAZUR_MUST_SEE_TRAILS,
  COTE_DAZUR_RAIN_ALTERNATIVES,
  COTE_DAZUR_CAR_ARRIVAL,
  COTE_DAZUR_CAR_PARKING,
} from "@/lib/travelReports/coteDazurExtras";
import { applyAppleCopy } from "@/lib/travelReports/appleCopy";
import { COTE_DAZUR_APPLE_EN } from "@/lib/travelReports/coteDazurApple.en";
import { COTE_DAZUR_APPLE_ES } from "@/lib/travelReports/coteDazurApple.es";
import { pickLocaleCopy } from "@/lib/localeCopy";

export function getCoteDazurTravelReportConfig(locale = "de"): TravelReportConfig {
  const hotelWindow = buildCoteDazurHotelSearchWindow();

  const config: TravelReportConfig = {
    slug: "cote-dazur",
    path: "/reisebericht/cote-dazur",
    breadcrumbLabel: "Côte d'Azur Reisebericht",
    layoutVariant: "coastal",
    journeyAxis: {
      title: COTE_DAZUR_JOURNEY_AXIS.title,
      subtitle: COTE_DAZUR_JOURNEY_AXIS.subtitle,
      stops: COTE_DAZUR_JOURNEY_AXIS.stops,
      outro: COTE_DAZUR_JOURNEY_AXIS.outro,
    },

    meta: {
      title: COTE_DAZUR_META.title,
      description: COTE_DAZUR_META.description,
      datePublished: COTE_DAZUR_META.datePublished,
      dateModified: COTE_DAZUR_META.dateModified,
    },

    hero: {
      photo: COTE_DAZUR_HERO_PHOTO,
      photoAlt: COTE_DAZUR_HERO_PHOTO_ALT,
      title: COTE_DAZUR_REPORT.title,
      subtitle: COTE_DAZUR_REPORT.subtitle,
      duration: COTE_DAZUR_REPORT.duration,
      seoSubtitle: COTE_DAZUR_REPORT.seoSubtitle,
      experienceNote: COTE_DAZUR_ARTICLE_META.experienceNote,
      dateModifiedLabel: COTE_DAZUR_ARTICLE_META.dateModifiedLabel,
    },

    lead: COTE_DAZUR_REPORT.lead,
    printLead: COTE_DAZUR_REPORT.printLead,
    affiliateDisclosure: COTE_DAZUR_AFFILIATE_DISCLOSURE,

    specialCallout: {
      id: "kueste-statt-a8",
      title: COTE_DAZUR_CARD_CALLOUT.title,
      body: COTE_DAZUR_CARD_CALLOUT.body,
      bullets: COTE_DAZUR_CARD_CALLOUT.bullets,
      href: COTE_DAZUR_CARD_CALLOUT.officialHref,
      linkLabel: COTE_DAZUR_CARD_CALLOUT.officialLabel,
      secondaryHref: COTE_DAZUR_CARD_CALLOUT.faqHref,
      secondaryLinkLabel: COTE_DAZUR_CARD_CALLOUT.faqLabel,
      variant: "info",
    },

    atAGlance: {
      mustSees: COTE_DAZUR_AT_A_GLANCE.mustSees,
      quarters: COTE_DAZUR_AT_A_GLANCE.quarters,
      transport: COTE_DAZUR_AT_A_GLANCE.transport,
      planHint: COTE_DAZUR_AT_A_GLANCE.planHint,
      planerHref: buildCoteDazurPlanerUrl(),
      planAnchorId: "plan-5-tage",
      planAnchorLabel: "5-Nächte-Plan ansehen",
    },

    freeActivities: COTE_DAZUR_FREE_ACTIVITIES,

    printMap: {
      center: { lat: 43.4, lng: 6.85 },
      zoom: 9,
      mustSees: [
        { id: "ms-1", label: "Nizza · 1 Nacht", lat: 43.7102, lng: 7.262 },
        { id: "ms-2", label: "Plage Keller", lat: 43.5515, lng: 7.1345 },
        { id: "ms-3", label: "Mougins · 2 Nächte", lat: 43.6004, lng: 6.9956 },
        { id: "ms-4", label: "Port Grimaud", lat: 43.2728, lng: 6.5806 },
        { id: "ms-5", label: "Ramatuelle", lat: 43.2156, lng: 6.6122 },
      ],
      orte: [
        { id: "o-a", label: "Agay · rote Felsen", lat: 43.4317, lng: 6.8619, note: "Corniche" },
        { id: "o-b", label: "Antibes · Picasso", lat: 43.5804, lng: 7.1251 },
        { id: "o-c", label: "Cannes", lat: 43.5528, lng: 7.0174 },
        { id: "o-d", label: "Saint-Tropez · früh", lat: 43.2677, lng: 6.6407 },
        { id: "o-e", label: "Grimaud", lat: 43.2742, lng: 6.5225 },
        { id: "o-f", label: "Hotel de Mougins", lat: 43.6004, lng: 6.9956, note: "2 Nächte" },
        { id: "o-g", label: "Region St-Tropez", lat: 43.25, lng: 6.58, note: "2 Nächte" },
        { id: "o-h", label: "Théoule · Estérel", lat: 43.506, lng: 6.938, note: "Meer" },
      ],
    },

    arrival: {
      callout: {
        title: COTE_DAZUR_CAR_ARRIVAL.title,
        body: COTE_DAZUR_CAR_ARRIVAL.intro,
        bullets: COTE_DAZUR_CAR_ARRIVAL.warnings,
        href: COTE_DAZUR_CAR_ARRIVAL.officialHref,
        linkLabel: COTE_DAZUR_CAR_ARRIVAL.officialLabel,
        secondaryHref: COTE_DAZUR_CAR_ARRIVAL.secondaryHref,
        secondaryLinkLabel: COTE_DAZUR_CAR_ARRIVAL.secondaryLinkLabel,
        variant: "info",
      },
      parking: {
        id: "anreise-parken",
        title: "Anreise & Parken",
        intro: "Gestaffelte Nächte: Nizza → Mougins/Cannes → Region St-Tropez.",
        items: COTE_DAZUR_CAR_PARKING,
        collapsible: true,
      },
      transferTitle: "Auto aus Italien · oder Flug Nizza + Mietwagen",
      transferOptions: COTE_DAZUR_TRANSFER_OPTIONS,
    },

    toc: COTE_DAZUR_TOC,

    guideCards: {
      title: "Lohnt sich? · Keller, Port Grimaud & Region",
      cards: COTE_DAZUR_GUIDE_CARDS,
    },

    rainAlternatives: {
      id: "regen",
      title: "Bei Regen · unsere Alternativen",
      intro: "Picasso, Port Grimaud zu Fuss, Galerien in Mougins.",
      items: COTE_DAZUR_RAIN_ALTERNATIVES,
    },

    specialVenueList: {
      id: "kuestenwege",
      title: "Küstenfahrten & Region zu Fuss",
      intro: "Corniche d'Or über Agay (rote Felsen) – und Grimaud, Port Grimaud, Ramatuelle vor Ort.",
      items: COTE_DAZUR_MUST_SEE_TRAILS,
      collapsible: true,
    },

    durationCompare: COTE_DAZUR_DURATION_COMPARE,

    itinerary: {
      id: "plan-5-tage",
      title: "5 Nächte · zum Abhaken",
      subtitle: "Checkliste – die Geschichten stehen darunter.",
      days: COTE_DAZUR_ITINERARY_5_DAYS,
    },

    sections: COTE_DAZUR_SECTIONS,
    /** PDF Unterwegs · 1 Seite · Tages-Kern */
    printStoryIds: [
      "ankunft",
      "keller-antibes",
      "mougins-cannes",
      "saint-tropez",
      "grimaud-ramatuelle",
    ],
    favoriteSpots: COTE_DAZUR_FAVORITE_SPOTS,

    lightboxGallery: COTE_DAZUR_LIGHTBOX_GALLERY,
    galleryIndexForSrc: coteDazurGalleryIndexForSrc,

    poiCards: {
      title: "Highlights · was wir gesehen und gegessen haben",
      subtitle:
        "Nizza, Plage Keller, Mougins, Port Grimaud, Grimaud & Ramatuelle – Bild antippen.",
      pois: COTE_DAZUR_POI_PHOTOS,
    },

    mustSees: {
      heading: "Must-sees · 5 Nächte Riviera",
      items: COTE_DAZUR_MUST_SEE,
      itemListName: "Must-sees Côte d'Azur",
    },

    seasonRows: COTE_DAZUR_SEASON_ROWS,
    tours: {
      title: "Geführte Touren · Riviera & Region St-Tropez",
      items: getCoteDazurCuratedTours(),
    },
    budget: {
      title: "Budget · gestaffelte Nächte & Keller",
      lines: COTE_DAZUR_BUDGET,
      priceStandLabel: COTE_DAZUR_ARTICLE_META.priceStandLabel,
    },
    events: COTE_DAZUR_EVENTS,
    faq: {
      title: "Häufige Fragen zur Côte d'Azur",
      items: COTE_DAZUR_FAQ,
    },
    relatedLinks: getCoteDazurRelatedLinks(),

    hotels: {
      destinationLabel: COTE_DAZUR_REPORT.title,
      intro: COTE_DAZUR_HOTEL_TIPS.intro,
      searchLabel: formatCoteDazurHotelWindowLabel(),
      clickRef: "cote-dazur-report",
      affiliateDestination: COTE_DAZUR_REPORT.affiliateDestination,
      checkIn: hotelWindow.checkIn,
      checkOut: hotelWindow.checkOut,
      picks: COTE_DAZUR_HOTEL_PICKS.map((pick) => ({
        ...pick,
        href: buildCoteDazurHotelPickLink(pick),
      })),
    },

    generalInfo: {
      title: COTE_DAZUR_GENERAL_INFO.title,
      sections: COTE_DAZUR_GENERAL_INFO.sections,
    },

    closing: COTE_DAZUR_CLOSING,
    planer: {
      href: buildCoteDazurPlanerUrl(),
      ctaLabel: "Côte d'Azur im Planer anlegen",
      hint: COTE_DAZUR_PLANER_HINT,
    },

    jsonLdAbout: {
      "@type": "Place",
      name: "Mougins",
      containedInPlace: { "@type": "Country", name: "France" },
    },
  };
  const copy = pickLocaleCopy(locale, { en: COTE_DAZUR_APPLE_EN, es: COTE_DAZUR_APPLE_ES });
  return copy ? applyAppleCopy(config, copy) : config;
}
