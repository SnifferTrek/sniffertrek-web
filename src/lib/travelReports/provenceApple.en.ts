import type { TravelReportAppleCopy } from "@/lib/travelReports/appleCopy";

export const PROVENCE_APPLE_EN: TravelReportAppleCopy = {
  metaTitle: "Provence road trip: 6-day route, places & hotels",
  metaDescription:
    "A 6-day Provence road trip: Avignon, Gordes, Roussillon, Aix-en-Provence, Valensole and the Verdon. With map, hotel bases, FAQ and a planner template.",
  breadcrumbLabel: "Provence route",
  displayTitle: "Provence.",
  heroSubtitle: ["Six days. Four bases.", "Avignon, ochre, Aix and Verdon."],
  heroPhotoAlt: "Provence landscape with lavender",
  experienceNote: "Curated by SnifferTrek · Planning status August 2026",
  lead:
    "A **6-day Provence road trip** does not need twelve villages. Our route links **Avignon**, two nights in the **Luberon**, **Aix-en-Provence** and the **Verdon** – with hotel bases instead of packing every day.",
  closing:
    "Provence does not get better by stacking as many villages as possible. With four bases you keep time for ochre dust, a long market and a Verdon day that can also drop out if the weather turns.",
  affiliateDisclosure:
    "Hotel links may be affiliate links. The price stays the same for you; SnifferTrek may earn a commission.",
  transferTitle: "Car, TGV or a flight to Marseille",
  transferSubtitle:
    "By car through the Luberon – arrival by TGV to Avignon or a flight to Marseille is possible.",
  glanceTitle: "Fewer villages. More Provence.",
  hotelTitle: "Four bases. Five nights.",
  hotelSearchLabel: "Hotels in Provence",
  hotelIntro: "Four bases cut down on backtracking and packing every day.",
  mapTitle: "Route & places",
  mapSubtitle:
    "Blue = core route. Grey = seasonal or optional. Tap a marker for notes.",
  journeyTitle: "The route",
  journeySubtitle: "5 nights. Four bases. Fewer suitcases than photo stops.",
  journeyOutro:
    "The route is about 300 kilometres – the slow days matter more than the distance.",
  journeyStops: [
    { nights: "1 night", place: "Avignon", note: "History & arriving" },
    { nights: "2 nights", place: "Gordes / Luberon", note: "Villages & ochre" },
    { nights: "1 night", place: "Aix-en-Provence", note: "Market & old town" },
    { nights: "1 night", place: "Moustiers", note: "Valensole & Verdon" },
  ],
  transferOptions: [
    {
      title: "Your own car",
      body: "Flexible for the Luberon and Verdon; count a long drive separately.",
      price: "Tolls + fuel",
    },
    {
      title: "TGV to Avignon",
      body: "A good start without city traffic; a rental car from Avignon is possible.",
      price: "Price depends on date",
    },
    {
      title: "Flight to Marseille + rental car",
      body: "Practical for Aix and the return; check one-way fees.",
      price: "Price depends on date",
    },
  ],
  mustSees: ["Avignon", "Gordes", "Roussillon", "Aix", "Moustiers"],
  quarters: "4 bases: Avignon · Gordes · Aix · Moustiers",
  transport: "Your own car or a rental car; old towns on foot",
  faqTitle: "Common questions about a Provence road trip",
  faqItems: [
    {
      question: "How many days do you need for Provence?",
      answer:
        "Six days are a good start for Avignon, the Luberon, Aix and the Verdon. With four days you should drop the Verdon; with eight days the route becomes much calmer.",
    },
    {
      question: "Do you need a car in Provence?",
      answer:
        "For this road trip, yes. Avignon and Aix are reachable by train, but villages in the Luberon and the Verdon connect much more sensibly by car.",
    },
    {
      question: "When does the lavender bloom?",
      answer:
        "It depends on altitude, weather and harvest. Instead of fixed promises, check regional notes shortly before you travel and treat Valensole only as a seasonal extra.",
      linkLabel: "Regional notes",
    },
    {
      question: "Where should you stay?",
      answer:
        "On this route: one night each in Avignon and Aix, two nights in the Luberon around Gordes, and one night in Moustiers-Sainte-Marie.",
    },
    {
      question: "Is the route suitable with children?",
      answer:
        "Yes in principle, if daily distances stay short. For ochre trails, heat and Verdon activities, factor in age, weather and local safety rules.",
    },
  ],
  hotelPicks: {
    avignon: {
      area: "Avignon",
      note: "For the compact start.",
      audience: "History & TGV arrival",
    },
    luberon: {
      area: "Gordes",
      note: "Two nights for villages and ochre.",
      audience: "Road trip by car",
    },
    aix: {
      area: "Aix",
      note: "A city evening without another drive.",
      audience: "Market & old town",
    },
    moustiers: {
      area: "Verdon",
      note: "For an early start at the Verdon.",
      audience: "Nature & weather buffer",
    },
  },
  sections: {
    avignon: {
      kicker: "Day 1 · Avignon",
      title: "Arriving behind the city wall",
      photoAlt: "Palais des Papes in Avignon",
      photoCaption: "Avignon · Palais des Papes",
      story:
        "We curated this route; we are not presenting it as a personal on-the-ground experience. That is why we always check opening hours and access again directly with the official sources.",
      paragraphs: [
        "**Avignon** packs history and short walks. Keep the car at the hotel or in a car park outside the tightest old town; the Palais des Papes, squares and the Rhône bank connect on foot.",
        "For a single day: do not try every exhibition. One main visit, a slow loop and an evening square are enough as a start.",
      ],
      tips: [
        {
          title: "Official information",
          body: "Hours, tickets and current notes.",
          linkLabel: "Avignon Tourisme",
        },
      ],
    },
    luberon: {
      kicker: "Day 2 · Luberon",
      title: "Gordes as a base, not a photo stop",
      photoAlt: "Hill village of Gordes in the Luberon",
      photoCaption: "Gordes · two nights as a quiet base",
      paragraphs: [
        "The Luberon works better with a fixed base than with packing every day. **Gordes** is prominent and visited accordingly; if you start early and stay into the evening, you see the place more calmly.",
        "For the second half of the day pick only one extra: Abbaye de Sénanque, Bonnieux or Lacoste. Too many villages turn the landscape into a checklist.",
      ],
    },
    ocker: {
      kicker: "Day 3 · Roussillon & Lourmarin",
      title: "Ochre in the morning, village square at night",
      photoAlt: "Ochre-coloured houses in Roussillon",
      photoCaption: "Roussillon · ochre in the village",
      paragraphs: [
        "In **Roussillon** colour comes first: façades, earth and the short ochre trail. Sturdy shoes help; light clothing is impractical because of the dust.",
        "Afterwards **Lourmarin** works as a contrast south of the Luberon. The drive should be part of the day – not just the link between two photo spots.",
      ],
    },
    aix: {
      kicker: "Day 4 · Aix-en-Provence",
      title: "A city day between markets and shade",
      photoAlt: "Market in Aix-en-Provence",
      photoCaption: "Aix · market and a city pause",
      paragraphs: [
        "In **Aix-en-Provence** the car stays put. Old town, markets and squares sit close enough for a full day on foot; in summer the shade sets the pace.",
        "Cézanne sites are a possible deeper dive, not a must. If you would rather wander the lanes, you miss nothing.",
      ],
      tips: [
        {
          title: "Plan the city visit",
          body: "Current markets, museums and getting around.",
          linkLabel: "Aix tourism",
        },
      ],
    },
    "ruhige-doerfer": {
      kicker: "Hidden tips · Luberon",
      title: "Goult and Saignon instead of another queue",
      paragraphs: [
        "**Goult** sits between Gordes and Roussillon and the tourist office describes it as a “village caché”. The small centre, the mill path and the Thursday market are an alternative when the better-known viewpoint villages fill up.",
        "**Saignon** fits better on the drive towards Aix: short lanes, a viewpoint rock and less of a must-do list. Neither place is an extra day stage – pick one, do not tick both.",
      ],
      tips: [
        {
          title: "Goult official",
          body: "Village, market and current notes from the Pays d’Apt Luberon tourist office.",
          linkLabel: "Discover Goult",
        },
      ],
    },
    "markt-genuss": {
      kicker: "Hidden tips · market & food",
      title: "Build the market day into the route",
      paragraphs: [
        "The best food tip is not a single restaurant, but a matching **market day**. In Goult the market is seasonal on Thursday morning; in Aix there are several markets with different days and focuses.",
        "Buy only what you can eat the same day: bread, cheese, fruit and something for a picnic. Market hours change with the season – so check with the town or tourist office shortly before you travel.",
      ],
      tips: [
        {
          title: "Do not sell it as a secret tip",
          body: "Lourmarin and Gordes are well known. It gets quieter through the time of day, the weekday and a smaller village – not through a secret Instagram motif.",
        },
      ],
    },
    verdon: {
      kicker: "Days 5–6 · Valensole & Verdon",
      title: "Lavender is seasonal. The gorge stays.",
      photoAlt: "Verdon Gorge with a turquoise river",
      photoCaption: "Gorges du Verdon · finish with a weather buffer",
      paragraphs: [
        "The Plateau de **Valensole** is not a year-round purple promise. Outside bloom it remains a landscape stop; fields are working land and you do not walk onto them for photos.",
        "**Moustiers-Sainte-Marie** is the last base. The Verdon needs a weather buffer: wind, heat, water level and road conditions can change the plan.",
      ],
      tips: [
        {
          title: "Verdon Nature Park",
          body: "Protection, access and current notes.",
          linkLabel: "Parc du Verdon",
        },
      ],
    },
  },
  mapPois: {
    avignon: {
      name: "Avignon",
      tip: "Palais des Papes and old town early or in the late afternoon.",
    },
    gordes: {
      name: "Gordes",
      tip: "Viewpoint before the village, then on foot through the lanes.",
    },
    roussillon: {
      name: "Roussillon",
      tip: "Ochre trail in sturdy shoes; clothes can get dusty.",
    },
    lourmarin: {
      name: "Lourmarin",
      tip: "A quieter village stop south of the Luberon.",
    },
    goult: {
      name: "Goult",
      tip: "A smaller Luberon stop between Gordes and Roussillon.",
    },
    saignon: {
      name: "Saignon",
      tip: "Village and viewpoint rock near Apt; add only if you have time.",
    },
    aix: {
      name: "Aix-en-Provence",
      tip: "Old town on foot; leave the car outside the centre.",
    },
    valensole: {
      name: "Valensole",
      tip: "Lavender only in season; do not walk onto the fields.",
    },
    moustiers: {
      name: "Moustiers-Sainte-Marie",
      tip: "Last base before the Verdon Gorge.",
    },
    verdon: {
      name: "Pont du Galetas",
      tip: "Check water level, wind and local notes before activities.",
    },
  },
};
