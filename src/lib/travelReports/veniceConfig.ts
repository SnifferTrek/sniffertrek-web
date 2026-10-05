import type { TravelReportConfig } from "@/lib/travelReports/types";
import {
  VENICE_HERO_PHOTO,
  VENICE_HERO_PHOTO_ALT,
  VENICE_HOTEL_PICKS,
  VENICE_HOTEL_TIPS,
  VENICE_MUST_SEE,
  VENICE_POI_PHOTOS,
  VENICE_REPORT,
  VENICE_SECTIONS,
  buildVeniceHotelPickLink,
  buildVeniceHotelSearchWindow,
  formatVeniceHotelWindowLabel,
} from "@/lib/travelReports/veniceReport";
import { buildVenicePlanerUrl, VENICE_PLANER_HINT } from "@/lib/travelReports/venicePlaner";
import { VENICE_GENERAL_INFO } from "@/lib/travelReports/veniceGeneralInfo";
import {
  VENICE_CLOSING,
  VENICE_FAQ,
  VENICE_META,
  getVeniceRelatedLinks,
} from "@/lib/travelReports/veniceSeo";
import {
  VENICE_LIGHTBOX_GALLERY,
  veniceGalleryIndexForSrc,
} from "@/lib/travelReports/veniceLightboxGallery";
import {
  VENICE_AT_A_GLANCE,
  VENICE_BUDGET,
  VENICE_DURATION_COMPARE,
  VENICE_EVENTS,
  VENICE_ITINERARY_3_DAYS,
  VENICE_JOURNEY_AXIS,
  VENICE_TOC,
  VENICE_TRANSFER_OPTIONS,
} from "@/lib/travelReports/venicePlanning";
import { VENICE_FAVORITE_SPOTS } from "@/lib/travelReports/veniceSpots";
import {
  VENICE_AFFILIATE_DISCLOSURE,
  VENICE_ARTICLE_META,
  VENICE_ENTRY_FEE,
  VENICE_FREE_ACTIVITIES,
  VENICE_GUIDE_CARDS,
  VENICE_SEASON_ROWS,
  getVeniceCuratedTours,
  VENICE_MUST_SEE_MUSEUMS,
  VENICE_RAIN_ALTERNATIVES,
  VENICE_CAR_ARRIVAL,
  VENICE_CAR_PARKING,
} from "@/lib/travelReports/veniceExtras";
import { applyAppleCopy } from "@/lib/travelReports/appleCopy";
import { VENICE_APPLE_EN } from "@/lib/travelReports/veniceApple.en";
import { VENICE_APPLE_ES } from "@/lib/travelReports/veniceApple.es";
import { pickLocaleCopy } from "@/lib/localeCopy";

export function getVeniceTravelReportConfig(locale = "de"): TravelReportConfig {
  const hotelWindow = buildVeniceHotelSearchWindow();

  const config: TravelReportConfig = {
    slug: "venedig",
    path: "/reisebericht/venedig",
    breadcrumbLabel: "Venedig Reisebericht",
    layoutVariant: "coastal",
    journeyAxis: {
      title: VENICE_JOURNEY_AXIS.title,
      subtitle: VENICE_JOURNEY_AXIS.subtitle,
      stops: VENICE_JOURNEY_AXIS.stops,
      outro: VENICE_JOURNEY_AXIS.outro,
    },

    meta: {
      title: VENICE_META.title,
      description: VENICE_META.description,
      datePublished: VENICE_META.datePublished,
      dateModified: VENICE_META.dateModified,
    },

    hero: {
      photo: VENICE_HERO_PHOTO,
      photoAlt: VENICE_HERO_PHOTO_ALT,
      title: VENICE_REPORT.title,
      subtitle: VENICE_REPORT.subtitle,
      duration: VENICE_REPORT.duration,
      seoSubtitle: VENICE_REPORT.seoSubtitle,
      experienceNote: VENICE_ARTICLE_META.experienceNote,
      dateModifiedLabel: VENICE_ARTICLE_META.dateModifiedLabel,
    },

    lead: VENICE_REPORT.lead,
    printLead: VENICE_REPORT.printLead,
    affiliateDisclosure: VENICE_AFFILIATE_DISCLOSURE,

    specialCallout: {
      id: "eintrittsgebuehr",
      title: VENICE_ENTRY_FEE.title,
      body: VENICE_ENTRY_FEE.body,
      bullets: VENICE_ENTRY_FEE.bullets,
      href: VENICE_ENTRY_FEE.officialHref,
      linkLabel: VENICE_ENTRY_FEE.officialLabel,
      secondaryHref: VENICE_ENTRY_FEE.faqHref,
      secondaryLinkLabel: VENICE_ENTRY_FEE.faqLabel,
      variant: "info",
    },

    atAGlance: {
      mustSees: VENICE_AT_A_GLANCE.mustSees,
      quarters: VENICE_AT_A_GLANCE.quarters,
      transport: VENICE_AT_A_GLANCE.transport,
      // Ein Satz für PDF-Slot «Rhythmus» – Saison steht in Hero-Meta
      planHint: VENICE_AT_A_GLANCE.planHint,
      planerHref: buildVenicePlanerUrl(),
      planAnchorId: "plan-3-tage",
      planAnchorLabel: "3-Tage-Plan ansehen",
    },

    freeActivities: VENICE_FREE_ACTIVITIES,

    printMap: {
      center: { lat: 45.437, lng: 12.34 },
      zoom: 13,
      // Genau 5 Must-sees / 8 Orte – Slot-Budget Seite 1
      mustSees: [
        { id: "ms-1", label: "Markusdom & Dogenpalast", lat: 45.4341, lng: 12.3388 },
        { id: "ms-2", label: "Museen Accademia / Guggenheim", lat: 45.4314, lng: 12.3283 },
        { id: "ms-3", label: "Rialtomarkt", lat: 45.438, lng: 12.3359 },
        { id: "ms-4", label: "Vaporetto Linie 1", lat: 45.437, lng: 12.332 },
        { id: "ms-5", label: "Burano", lat: 45.485, lng: 12.417 },
      ],
      orte: [
        { id: "o-a", label: "Gassen ohne Plan", lat: 45.445, lng: 12.33, note: "Verlaufen" },
        { id: "o-b", label: "Markusplatz & Riva", lat: 45.4341, lng: 12.3388 },
        { id: "o-c", label: "Rialtobrücke", lat: 45.438, lng: 12.3359, note: "Früh" },
        { id: "o-d", label: "Seufzerbrücke aussen", lat: 45.4337, lng: 12.3409, note: "Paglia" },
        { id: "o-e", label: "Accademia-Brücke", lat: 45.4314, lng: 12.3283 },
        { id: "o-f", label: "Zattere Sonnenuntergang", lat: 45.4295, lng: 12.3275, note: "Salute" },
        { id: "o-g", label: "Salute-Basilika", lat: 45.4308, lng: 12.3347, note: "Kuppel 8 €" },
        { id: "o-h", label: "Ghetto Nuovo", lat: 45.4455, lng: 12.3265 },
      ],
    },

    arrival: {
      callout: {
        title: VENICE_CAR_ARRIVAL.title,
        body: VENICE_CAR_ARRIVAL.intro,
        bullets: VENICE_CAR_ARRIVAL.warnings,
        href: VENICE_CAR_ARRIVAL.officialHref,
        linkLabel: VENICE_CAR_ARRIVAL.officialLabel,
        secondaryHref: VENICE_CAR_ARRIVAL.secondaryHref,
        secondaryLinkLabel: VENICE_CAR_ARRIVAL.secondaryLinkLabel,
        variant: "info",
      },
      parking: {
        id: "anreise-parken",
        title: "Wo wir parken",
        intro: "Kurz verglichen – Preise je nach Saison.",
        items: VENICE_CAR_PARKING,
        collapsible: true,
      },
      transferTitle: "Flughafen Marco Polo → Piazzale Roma",
      transferOptions: VENICE_TRANSFER_OPTIONS,
    },

    toc: VENICE_TOC,

    guideCards: {
      title: "Lohnt sich? · Markusdom, Gondel & Aussicht",
      cards: VENICE_GUIDE_CARDS,
    },

    rainAlternatives: {
      id: "regen",
      title: "Bei Regen · unsere Alternativen",
      intro:
        "April kann nass sein – wir tauschen dann einen Aussen-Block gegen Indoor: Museen, La Fenice oder Cicchetti.",
      items: VENICE_RAIN_ALTERNATIVES,
    },

    specialVenueList: {
      id: "museen",
      title: "Must-see Museen",
      intro: "Zwei bis drei Museen reichen – Qualität vor Quantität.",
      items: VENICE_MUST_SEE_MUSEUMS,
      collapsible: true,
    },

    durationCompare: VENICE_DURATION_COMPARE,

    itinerary: {
      id: "plan-3-tage",
      title: "3 Tage · zum Abhaken",
      subtitle: "Checkliste – die Geschichten stehen darunter.",
      days: VENICE_ITINERARY_3_DAYS,
    },

    sections: VENICE_SECTIONS,
    /** PDF Unterwegs · 1 Seite · Tages-Kern */
    printStoryIds: ["ankunft", "morgen", "dogenpalast", "vaporetto", "inseln"],
    favoriteSpots: VENICE_FAVORITE_SPOTS,

    lightboxGallery: VENICE_LIGHTBOX_GALLERY,
    galleryIndexForSrc: veniceGalleryIndexForSrc,

    poiCards: {
      title: "Sehenswürdigkeiten in Venedig",
      subtitle:
        "Unsere Venedig-Tipps und Geheimtipps – kurz und auf den Punkt. Bild antippen zum Vergrössern.",
      pois: VENICE_POI_PHOTOS,
    },

    mustSees: {
      heading: "Must-sees · 3 Tage Venedig",
      items: VENICE_MUST_SEE,
      itemListName: "Must-sees Venedig in 3 Tagen",
    },

    seasonRows: VENICE_SEASON_ROWS,
    tours: {
      title: "Geführte Touren · Venedig",
      items: getVeniceCuratedTours(),
    },
    budget: {
      title: "Budget · Was kostet Venedig?",
      lines: VENICE_BUDGET,
      priceStandLabel: VENICE_ARTICLE_META.priceStandLabel,
    },
    events: VENICE_EVENTS,
    faq: {
      title: "Häufige Fragen zu Venedig",
      items: VENICE_FAQ,
    },
    relatedLinks: getVeniceRelatedLinks(),

    hotels: {
      destinationLabel: VENICE_REPORT.title,
      intro: VENICE_HOTEL_TIPS.intro,
      searchLabel: formatVeniceHotelWindowLabel(),
      clickRef: "venice-report",
      affiliateDestination: VENICE_REPORT.affiliateDestination,
      checkIn: hotelWindow.checkIn,
      checkOut: hotelWindow.checkOut,
      picks: VENICE_HOTEL_PICKS.map((pick) => ({
        ...pick,
        href: buildVeniceHotelPickLink(pick),
      })),
    },

    generalInfo: {
      title: VENICE_GENERAL_INFO.title,
      sections: VENICE_GENERAL_INFO.sections,
    },

    closing: VENICE_CLOSING,
    planer: {
      href: buildVenicePlanerUrl(),
      ctaLabel: "Venedig im Planer anlegen",
      hint: VENICE_PLANER_HINT,
    },

    jsonLdAbout: {
      "@type": "City",
      name: "Venedig",
      containedInPlace: { "@type": "Country", name: "Italien" },
    },
  };
  const copy = pickLocaleCopy(locale, { en: VENICE_APPLE_EN, es: VENICE_APPLE_ES });
  return copy ? applyAppleCopy(config, copy) : config;
}
