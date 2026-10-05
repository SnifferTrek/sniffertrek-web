import { getTravelReportInfo } from "@/lib/travelReportInfo";
import type { TravelReportConfig } from "@/lib/travelReports/types";
import { buildTravelReportPrintMapUrl } from "@/lib/travelReports/printMap";
import {
  PRINT_APPENDIX,
  PRINT_FAQ,
  PRINT_PAGE1,
  PRINT_PLAN,
  PRINT_PRAXIS,
  PRINT_STORY,
  clampBulletList,
  trimToMaxChars,
  trimToMaxWords,
} from "@/lib/travelReports/printSlotLimits";

/** Drucktext: Markdown-Fett behalten, Links/URLs entfernen. */
export function printText(raw: string): string {
  return raw
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Gemeinsames, gekürztes Inhaltsmodell für alle Print-Varianten.
 * Slot-Budgets bleiben identisch – nur die Optik unterscheidet sich.
 */
export function buildTravelReportPrintModel(
  config: TravelReportConfig,
  locale = "de"
) {
  const mapUrl = buildTravelReportPrintMapUrl(config.printMap);
  const page1Lead = trimToMaxWords(
    config.printLead || config.lead,
    PRINT_PAGE1.leadMaxWords
  );
  const quarters = trimToMaxWords(config.atAGlance.quarters, PRINT_PAGE1.metaMaxWords);
  const transport = trimToMaxWords(config.atAGlance.transport, PRINT_PAGE1.metaMaxWords);
  const rhythm = trimToMaxWords(config.atAGlance.planHint, PRINT_PAGE1.metaMaxWords);
  const calloutBody = trimToMaxWords(
    config.specialCallout.body,
    PRINT_PAGE1.calloutBodyMaxWords
  );
  const calloutBullets = clampBulletList(config.specialCallout.bullets);
  const mustSees = config.printMap.mustSees.slice(0, PRINT_PAGE1.mustSeeCount);
  const orte = config.printMap.orte.slice(0, PRINT_PAGE1.orteCount);

  const durationOpts = config.durationCompare
    .slice(0, PRINT_PLAN.durationCount)
    .map((opt) => ({
      ...opt,
      summary: trimToMaxWords(opt.summary, PRINT_PLAN.durationSummaryMaxWords),
    }));
  const itineraryDays = config.itinerary.days
    .slice(0, PRINT_PLAN.itineraryMaxDays)
    .map((day) => ({
      ...day,
      title: trimToMaxWords(day.title, PRINT_PLAN.itineraryTitleMaxWords),
      items: day.items
        .slice(0, PRINT_PLAN.itineraryItemsPerDay)
        .map((item) => trimToMaxWords(item, PRINT_PLAN.itineraryItemMaxWords)),
    }));
  const parkingIntro = config.arrival.parking.intro
    ? trimToMaxWords(config.arrival.parking.intro, PRINT_PLAN.parkingIntroMaxWords)
    : "";
  const parkingItems = config.arrival.parking.items
    .slice(0, PRINT_PLAN.parkingMaxItems)
    .map((p) => ({
      ...p,
      description: trimToMaxWords(p.description, PRINT_PLAN.parkingDescMaxWords),
    }));
  const transfers = config.arrival.transferOptions
    .slice(0, PRINT_PLAN.transferCount)
    .map((t) => ({
      ...t,
      body: trimToMaxWords(t.body, PRINT_PLAN.transferBodyMaxWords),
    }));

  const storyById = new Map(config.sections.map((s) => [s.id, s]));
  const storySource = (config.printStoryIds?.length
    ? config.printStoryIds.map((id) => storyById.get(id)).filter(Boolean)
    : config.sections) as typeof config.sections;
  const storySections = storySource.slice(0, PRINT_STORY.maxSections).map((section) => {
    const rawPara =
      section.printParagraph?.trim() || section.paragraphs[0] || "";
    return {
      ...section,
      paragraphs: rawPara
        ? [trimToMaxWords(rawPara, PRINT_STORY.paragraphMaxWords)]
        : [],
      story:
        PRINT_STORY.includeStory && section.story
          ? trimToMaxWords(section.story, PRINT_STORY.storyMaxWords)
          : undefined,
    };
  });

  const venueIntro = config.specialVenueList.intro
    ? trimToMaxWords(config.specialVenueList.intro, PRINT_PRAXIS.venueIntroMaxWords)
    : "";
  const venueItems = config.specialVenueList.items
    .slice(0, PRINT_PRAXIS.venueMaxItems)
    .map((m) => ({
      ...m,
      description: trimToMaxWords(m.description, PRINT_PRAXIS.venueDescMaxWords),
    }));
  const mustSeeItems = config.mustSees.items
    .slice(0, PRINT_PRAXIS.mustSeeMaxItems)
    .map((item) => trimToMaxWords(item, PRINT_PRAXIS.mustSeeItemMaxWords));
  const guideCards = config.guideCards.cards.slice(0, PRINT_PRAXIS.guideMaxCards).map((card) => ({
    ...card,
    price: trimToMaxChars(card.price, PRINT_PRAXIS.guideMetaMaxChars),
    timing: trimToMaxChars(card.timing, PRINT_PRAXIS.guideMetaMaxChars),
    body: trimToMaxWords(
      `${printText(card.verdict)} ${printText(card.tip)}`,
      PRINT_PRAXIS.guideBodyMaxWords
    ),
  }));
  const favoriteSpots = config.favoriteSpots
    .slice(0, PRINT_PRAXIS.spotMaxItems)
    .map((spot) => ({
      ...spot,
      note: trimToMaxWords(spot.note, PRINT_PRAXIS.spotNoteMaxWords),
    }));
  const budgetLines = config.budget.lines.slice(0, PRINT_PRAXIS.budgetMaxLines).map((line) => ({
    ...line,
    note: line.note
      ? trimToMaxWords(line.note, PRINT_PRAXIS.budgetNoteMaxWords)
      : undefined,
  }));
  const seasonRows = config.seasonRows.map((r) => ({
    ...r,
    note: trimToMaxWords(r.note, PRINT_PRAXIS.seasonNoteMaxWords),
  }));
  const events = config.events.slice(0, PRINT_PRAXIS.eventMaxItems).map((e) => ({
    ...e,
    note: trimToMaxWords(e.note, PRINT_PRAXIS.eventNoteMaxWords),
  }));

  const faqItems = config.faq.items.slice(0, PRINT_FAQ.maxItems).map((item) => ({
    question: trimToMaxWords(item.question, PRINT_FAQ.questionMaxWords),
    answer: trimToMaxWords(item.answer, PRINT_FAQ.answerMaxWords),
  }));

  const hotelIntro = trimToMaxWords(config.hotels.intro, PRINT_APPENDIX.hotelIntroMaxWords);
  const hotelPicks = config.hotels.picks.slice(0, PRINT_APPENDIX.hotelMaxPicks).map((h) => ({
    ...h,
    note: trimToMaxWords(h.note, PRINT_APPENDIX.hotelNoteMaxWords),
  }));
  const info = getTravelReportInfo(locale);
  const infoParagraphs = info.paragraphs
    .slice(0, PRINT_APPENDIX.infoMaxParagraphs)
    .map((p) => trimToMaxWords(p, PRINT_APPENDIX.infoParagraphMaxWords));
  const generalSections = config.generalInfo.sections
    .slice(0, PRINT_APPENDIX.generalMaxSections)
    .map((s) => ({
      ...s,
      body: trimToMaxWords(s.body, PRINT_APPENDIX.generalBodyMaxWords),
    }));
  const closing = trimToMaxWords(config.closing, PRINT_APPENDIX.closingMaxWords);

  return {
    config,
    mapUrl,
    page1Lead,
    quarters,
    transport,
    rhythm,
    calloutBody,
    calloutBullets,
    mustSees,
    orte,
    durationOpts,
    itineraryDays,
    parkingIntro,
    parkingItems,
    transfers,
    storySections,
    venueIntro,
    venueItems,
    mustSeeItems,
    guideCards,
    favoriteSpots,
    budgetLines,
    seasonRows,
    events,
    faqItems,
    hotelIntro,
    hotelPicks,
    infoParagraphs,
    generalSections,
    closing,
    limits: {
      PAGE1: PRINT_PAGE1,
      PLAN: PRINT_PLAN,
      PRAXIS: PRINT_PRAXIS,
    },
  };
}

export type TravelReportPrintModel = ReturnType<typeof buildTravelReportPrintModel>;
