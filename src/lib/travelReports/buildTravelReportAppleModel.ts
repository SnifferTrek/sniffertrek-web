import type { ReactNode } from "react";
import type { TravelReportConfig } from "@/lib/travelReports/types";
import type { TravelReportAppleViewModel } from "@/components/TravelReportAppleLayout";

export type BuildTravelReportAppleModelOptions = {
  displayTitle: string;
  heroSubtitle: readonly [string, string?];
  transferSubtitle: string;
  glanceTitle: string;
  hotelTitle: string;
  hotelSearchLabel: string;
  inspirationHref: string;
  bookingClickRef: string;
  storyIds: readonly string[];
  map: ReactNode;
  mapTitle?: string;
  mapSubtitle?: string;
};

export function buildTravelReportAppleModel(
  config: TravelReportConfig,
  options: BuildTravelReportAppleModelOptions,
): TravelReportAppleViewModel {
  const storyIdSet = new Set(options.storyIds);
  return {
    displayTitle: options.displayTitle,
    heroSubtitle: options.heroSubtitle,
    lead: config.lead,
    closing: config.closing,
    experienceNote: config.hero.experienceNote,
    heroPhoto: config.hero.photo,
    heroPhotoAlt: config.hero.photoAlt,
    affiliateDisclosure: config.affiliateDisclosure,
    planerHref: config.planer.href,
    hotelIntro: config.hotels.intro,
    hotelTitle: options.hotelTitle,
    hotelSearchLabel: options.hotelSearchLabel,
    hotelDestination: config.hotels.affiliateDestination,
    hotelCheckIn: config.hotels.checkIn,
    hotelCheckOut: config.hotels.checkOut,
    bookingClickRef: options.bookingClickRef,
    hotelPicks: config.hotels.picks.map((pick) => ({
      id: pick.id,
      name: pick.name,
      stars: pick.stars,
      area: pick.area,
      note: pick.note,
      audience: pick.audience,
      href: pick.href,
    })),
    journeyTitle: config.journeyAxis?.title ?? "Die Route",
    journeySubtitle: config.journeyAxis?.subtitle ?? "",
    journeyOutro: config.journeyAxis?.outro,
    journeyStops: config.journeyAxis?.stops ?? [],
    transferTitle: config.arrival.transferTitle,
    transferSubtitle: options.transferSubtitle,
    transferOptions: config.arrival.transferOptions,
    mustSees: config.atAGlance.mustSees,
    glanceTitle: options.glanceTitle,
    quarters: config.atAGlance.quarters,
    transport: config.atAGlance.transport,
    map: options.map,
    mapTitle: options.mapTitle ?? "Must-sees & Nice-to-sees",
    mapSubtitle:
      options.mapSubtitle ??
      "Blau = Pflichtprogramm. Grau = wenn Zeit und Beine noch wollen. Marker antippen für Kurzinfo.",
    faqTitle: config.faq.title,
    faqItems: config.faq.items,
    inspirationHref: options.inspirationHref,
    storySections: config.sections
      .filter((s) => storyIdSet.has(s.id))
      .map((s) => ({
        id: s.id,
        kicker: s.kicker,
        title: s.title,
        paragraphs: s.paragraphs,
        story: s.story,
        photo: s.photo,
        photoAlt: s.photoAlt,
        photoCaption: s.photoCaption,
        bookLinks: (s.tips ?? [])
          .filter(
            (t): t is typeof t & { href: string; linkLabel: string } =>
              Boolean(t.href && t.linkLabel),
          )
          .map((t) => ({
            title: t.title,
            body: t.body,
            href: t.href,
            linkLabel: t.linkLabel,
          })),
      })),
  };
}
