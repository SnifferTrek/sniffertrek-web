import type { TravelReportConfig } from "@/lib/travelReports/types";

export type TravelReportAppleSectionCopy = {
  kicker?: string;
  title: string;
  paragraphs: readonly string[];
  story?: string;
  photoAlt?: string;
  photoCaption?: string;
  tips?: readonly { title: string; body: string; linkLabel?: string }[];
};

export type TravelReportAppleCopy = {
  metaTitle: string;
  metaDescription: string;
  breadcrumbLabel: string;
  displayTitle: string;
  heroSubtitle: readonly [string, string?];
  heroPhotoAlt: string;
  experienceNote: string;
  lead: string;
  closing: string;
  affiliateDisclosure: string;
  transferTitle: string;
  transferSubtitle: string;
  glanceTitle: string;
  hotelTitle: string;
  hotelSearchLabel: string;
  hotelIntro: string;
  mapTitle: string;
  mapSubtitle: string;
  journeyTitle: string;
  journeySubtitle: string;
  journeyOutro?: string;
  journeyStops: readonly { nights: string; place: string; note: string }[];
  transferOptions: readonly {
    title: string;
    body: string;
    price: string;
    linkLabel?: string;
    secondaryLinkLabel?: string;
  }[];
  mustSees: readonly string[];
  quarters: string;
  transport: string;
  faqTitle: string;
  faqItems: readonly { question: string; answer: string; linkLabel?: string }[];
  hotelPicks: Record<string, { area?: string; note: string; audience?: string }>;
  sections: Record<string, TravelReportAppleSectionCopy>;
  mapPois: Record<string, { name?: string; tip: string }>;
};

export function applyAppleCopy(
  config: TravelReportConfig,
  copy: TravelReportAppleCopy,
): TravelReportConfig {
  return {
    ...config,
    breadcrumbLabel: copy.breadcrumbLabel,
    meta: {
      ...config.meta,
      title: copy.metaTitle,
      description: copy.metaDescription,
    },
    hero: {
      ...config.hero,
      photoAlt: copy.heroPhotoAlt,
      experienceNote: copy.experienceNote,
    },
    lead: copy.lead,
    closing: copy.closing,
    affiliateDisclosure: copy.affiliateDisclosure,
    journeyAxis: config.journeyAxis
      ? {
          title: copy.journeyTitle,
          subtitle: copy.journeySubtitle,
          outro: copy.journeyOutro,
          stops: copy.journeyStops.map((stop) => ({ ...stop })),
        }
      : config.journeyAxis,
    arrival: {
      ...config.arrival,
      transferTitle: copy.transferTitle,
      transferOptions: config.arrival.transferOptions.map((opt, i) => {
        const overlay = copy.transferOptions[i];
        if (!overlay) return opt;
        return {
          ...opt,
          title: overlay.title,
          body: overlay.body,
          price: overlay.price,
          linkLabel: overlay.linkLabel ?? opt.linkLabel,
          secondaryLinkLabel: overlay.secondaryLinkLabel ?? opt.secondaryLinkLabel,
        };
      }),
    },
    atAGlance: {
      ...config.atAGlance,
      mustSees: [...copy.mustSees],
      quarters: copy.quarters,
      transport: copy.transport,
    },
    faq: {
      title: copy.faqTitle,
      items: config.faq.items.map((item, i) => {
        const overlay = copy.faqItems[i];
        if (!overlay) return item;
        return {
          ...item,
          question: overlay.question,
          answer: overlay.answer,
          linkLabel: overlay.linkLabel ?? item.linkLabel,
        };
      }),
    },
    hotels: {
      ...config.hotels,
      intro: copy.hotelIntro,
      picks: config.hotels.picks.map((pick) => {
        const overlay = copy.hotelPicks[pick.id];
        return overlay ? { ...pick, ...overlay } : pick;
      }),
    },
    sections: config.sections.map((section) => {
      const overlay = copy.sections[section.id];
      if (!overlay) return section;
      return {
        ...section,
        kicker: overlay.kicker ?? section.kicker,
        title: overlay.title,
        paragraphs: [...overlay.paragraphs],
        story: overlay.story ?? section.story,
        photoAlt: overlay.photoAlt ?? section.photoAlt,
        photoCaption: overlay.photoCaption ?? section.photoCaption,
        tips: section.tips?.map((tip, i) => {
          const tipOverlay = overlay.tips?.[i];
          if (!tipOverlay) return tip;
          return {
            ...tip,
            title: tipOverlay.title,
            body: tipOverlay.body,
            linkLabel: tipOverlay.linkLabel ?? tip.linkLabel,
          };
        }),
      };
    }),
  };
}

export function localizeMapPois<T extends { id: string; name: string; tip: string }>(
  pois: readonly T[],
  overlay: Record<string, { name?: string; tip: string }> | undefined,
): T[] {
  if (!overlay) return [...pois];
  return pois.map((poi) => {
    const next = overlay[poi.id];
    return next ? { ...poi, name: next.name ?? poi.name, tip: next.tip } : poi;
  });
}

export function applePageOptions(copy: TravelReportAppleCopy | null) {
  if (!copy) return null;
  return {
    displayTitle: copy.displayTitle,
    heroSubtitle: copy.heroSubtitle,
    transferSubtitle: copy.transferSubtitle,
    glanceTitle: copy.glanceTitle,
    hotelTitle: copy.hotelTitle,
    hotelSearchLabel: copy.hotelSearchLabel,
    mapTitle: copy.mapTitle,
    mapSubtitle: copy.mapSubtitle,
  };
}
