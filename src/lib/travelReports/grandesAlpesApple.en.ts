import type { TravelReportAppleCopy } from "@/lib/travelReports/appleCopy";

export const GRANDES_ALPES_APPLE_EN: TravelReportAppleCopy = {
  metaTitle: "Route des Grandes Alpes in 7 days: Geneva, Iseran, Bonette, Cannes",
  metaDescription:
    "7 nights from Geneva to Cannes: Megève, Val-d'Isère, Briançon, Guillestre, Barcelonnette, Saint-Martin-Vésubie. Iseran, Galibier, Izoard, Cime de la Bonette – passes, not the motorway.",
  breadcrumbLabel: "Route des Grandes Alpes travel report",
  displayTitle: "Grandes Alpes.",
  heroSubtitle: ["Seven nights. Geneva to Cannes.", "Passes, not the motorway."],
  heroPhotoAlt: "Hairpin bends on a high mountain road in the French Alps",
  experienceNote: "Travel report from our point of view · 7 nights · Geneva → Cannes · July",
  lead:
    "Seven nights from **Geneva** to **Cannes**: **Megève**, **Val-d'Isère**, **Briançon**, **Guillestre**, **Barcelonnette**, **Saint-Martin-Vésubie**. What stays: **Iseran** in the morning, **Casse Déserte**, the **Bonette loop** – and the sea only at the end.",
  closing:
    "What stays: **Roselend** by the lake, **Iseran** in cool air, **Casse Déserte**, the **Bonette loop** – and **Cannes** only when the mountains are behind you. The Côte afterwards: a report of its own, not day 8.",
  affiliateDisclosure:
    "Some links to Booking.com, Hotels.com and tours are affiliate links – if you book, we may earn a commission, at no extra cost to you.",
  transferTitle: "Car from Switzerland · or fly Geneva + rental car",
  transferSubtitle:
    "Start in Geneva, then the passes. The motorway is plan B if a col is closed.",
  glanceTitle: "Less motorway. More cols.",
  hotelTitle: "Seven valleys. Seven nights.",
  hotelSearchLabel: "All Route des Grandes Alpes hotels",
  hotelIntro:
    "Seven valleys, seven nights: one each in Megève or Grand-Bornand, Val-d'Isère or Séez, Briançon, Guillestre in the Queyras, Barcelonnette, Saint-Martin-Vésubie and Cannes. A village hotel with parking beats a spa palace – and do not sleep on the pass itself.",
  mapTitle: "Must-sees & nice-to-sees",
  mapSubtitle:
    "Blue = must-do. Grey = if you still have time. Tap a marker for a short tip.",
  journeyTitle: "Seven nights · one chain of passes",
  journeySubtitle: "Geneva to Cannes. A valley each evening, not the col itself.",
  journeyOutro: "The motorway is plan B if a pass is closed – not the route for getting to know it.",
  journeyStops: [
    { nights: "1 night", place: "Megève / Grand-Bornand", note: "Aravis · arrive" },
    { nights: "1 night", place: "Val-d'Isère / Séez", note: "Roselend · before Iseran" },
    { nights: "1 night", place: "Briançon", note: "Iseran + Galibier" },
    { nights: "1 night", place: "Guillestre / Queyras", note: "Izoard · short stage" },
    { nights: "1 night", place: "Barcelonnette", note: "Vars · before Bonette" },
    { nights: "1 night", place: "Saint-Martin-Vésubie", note: "Bonette · last mountain night" },
    { nights: "1 night", place: "Cannes", note: "Turini · sea" },
  ],
  transferOptions: [
    {
      title: "Own car from Switzerland",
      body: "Geneva as the start – then the passes, not the A41 to Grenoble.",
      price: "Tolls only as motorway plan B",
      linkLabel: "Check the passes",
    },
    {
      title: "Fly Geneva + rental car",
      body: "GVA in the morning, keep day one short – Megève or Grand-Bornand.",
      price: "Rental car from about €50 / day",
      linkLabel: "Geneva airport",
    },
    {
      title: "Return from Nice",
      body: "Cannes as the finish, drop the car at NCE – or continue along the coast.",
      price: "Check one-way fees",
      linkLabel: "Nice airport",
      secondaryLinkLabel: "Côte d'Azur",
    },
  ],
  mustSees: [
    "Col des Aravis / Colombière",
    "Cormet de Roselend",
    "Col de l'Iseran",
    "Col du Galibier",
    "Briançon · Vauban",
    "Col d'Izoard · Casse Déserte",
    "Cime de la Bonette",
    "Col de Turini",
    "Cannes · Suquet",
  ],
  quarters:
    "Megève → Val-d'Isère → Briançon → Guillestre → Barcelonnette → Vésubie → Cannes.",
  transport: "Car · no motorway · check passes the evening before.",
  faqTitle: "Questions about the Route des Grandes Alpes",
  faqItems: [
    {
      question: "Why 7 nights instead of 5 days?",
      answer:
        "Five days rush Iseran or Bonette, or skip valley hotels. Seven nights: one place each evening, two hard pass days, one short Queyras stage in between.",
    },
    {
      question: "When are the passes open?",
      answer:
        "Often mid-June to mid-September, depending on snow. Check Iseran, Galibier, Izoard and Bonette the evening before on routedesgrandesalpes.com.",
      linkLabel: "Route des Grandes Alpes",
    },
    {
      question: "Start in Geneva or Thonon?",
      answer:
        "Geneva is practical (flight, rental car). The classic lakeside variant starts at Thonon/Évian – a few extra kilometres, the same first passes.",
    },
    {
      question: "Do you need a car?",
      answer:
        "Yes. This is a driving route over cols. Trains reach the valleys, not Iseran and Bonette in this order.",
    },
    {
      question: "Megève or Grand-Bornand?",
      answer:
        "Megève has more hotels. Grand-Bornand is closer to Aravis/Colombière and often quieter after a late Geneva arrival.",
    },
    {
      question: "Val-d'Isère or Séez?",
      answer:
        "Val-d'Isère saves height on the Iseran morning. Séez in the valley is cheaper – add 20–25 minutes.",
    },
    {
      question: "What comes after Cannes?",
      answer:
        "If you want more coast: our Côte d'Azur report with Nice, Mougins and the Saint-Tropez area – don’t bolt it onto the same day.",
      linkLabel: "Open Côte d'Azur",
    },
  ],
  hotelPicks: {
    megeve: {
      area: "Megève · 1 night",
      audience: "Night 1",
      note: "Village hotel with parking – Grand-Bornand as a quieter alternative.",
    },
    "grand-bornand": {
      area: "Le Grand-Bornand · 1 night",
      audience: "Alternative to Megève",
      note: "Closer to Aravis/Colombière – good after a late Geneva arrival.",
    },
    "val-disere": {
      area: "Val-d'Isère · 1 night",
      audience: "Before Iseran",
      note: "Saves height the next morning – quieter in summer than in ski season.",
    },
    seez: {
      area: "Séez · 1 night",
      audience: "Valley alternative",
      note: "Cheaper than Val-d'Isère, 20–25 minutes extra before Iseran.",
    },
    briancon: {
      area: "Briançon · 1 night",
      audience: "After Galibier",
      note: "Cité Vauban or just below – sort parking before the narrow old town.",
    },
    guillestre: {
      area: "Guillestre · 1 night",
      audience: "Queyras",
      note: "Practical (fuel, bread). Château-Queyras if you want the castle and quiet.",
    },
    barcelonnette: {
      area: "Barcelonnette · 1 night",
      audience: "Before Bonette",
      note: "Centre with parking – early start for the Cime.",
    },
    vesubie: {
      area: "Saint-Martin-Vésubie · 1 night",
      audience: "Last mountain night",
      note: "Small, book early in July. Isola as a fallback.",
    },
    cannes: {
      area: "Cannes · 1 night",
      audience: "Sea finish",
      note: "Suquet or west of the Croisette – skip festival week.",
    },
  },
  sections: {
    "genf-megeve": {
      kicker: "Chapter 1 · Savoie",
      title: "Leave Geneva – first pass night",
      paragraphs: [
        "Start in **Geneva**: bags, fuel, pass weather. If you flew in, do not add Iseran the same day – that comes later, fresh.",
        "Day one stays under **160 km**: **Col des Gets**, **Colombière**, **Aravis**. Photo stop, cheese, no rush. GPS wants the motorway to Albertville – decline.",
        "Night in **Megève** or **Grand-Bornand**. Walk the village, sleep early. Adding Roselend tonight makes tomorrow dull – the lake wants daylight.",
      ],
    },
    "roseland-valdisere": {
      kicker: "Chapter 2 · Beaufortain",
      title: "Roselend – and reach the valley in time",
      paragraphs: [
        "**Col des Saisies**, then **Cormet de Roselend**: reservoir, hairpins, bikes. Don’t just drive through – ten minutes at the dam, then **Bourg-Saint-Maurice**.",
        "Up to **Val-d'Isère** or stay in **Séez**. Séez is quieter and often cheaper; Val-d'Isère saves height before Iseran.",
        "Do **not** add Iseran today. Two big cols plus arrival is enough.",
      ],
    },
    "iseran-galibier": {
      kicker: "Chapter 3 · Haute Maurienne",
      title: "Iseran in the morning, Galibier after lunch",
      paragraphs: [
        "**Col de l'Iseran** (2770 m): highest paved Alpine pass. Go early. Windproof, not just a T-shirt. If closed: valley via Modane, still check Galibier.",
        "Down to **Bonneval-sur-Arc**, then **Télégraphe** and **Galibier**. Pause in **Valloire** – coffee, not only fuel.",
        "Finish in **Briançon**: Vauban old town on foot. No Izoard tonight.",
      ],
    },
    "izoard-guillestre": {
      kicker: "Chapter 4 · Queyras",
      title: "Short stage – Casse Déserte",
      paragraphs: [
        "After two hard days, keep it **short**: Briançon over **Col d'Izoard** to **Guillestre**. **Casse Déserte** is why – moonscape, set a timer.",
        "Night in **Guillestre** (practical) or **Château-Queyras** (castle, quieter).",
        "Afternoon in the village. Vars waits until tomorrow.",
      ],
    },
    "vars-barcelonnette": {
      kicker: "Chapter 5 · Ubaye",
      title: "Vars – and Barcelonnette without rush",
      paragraphs: [
        "**Col de Vars** links Queyras and the **Ubaye**. Short distance, full concentration.",
        "**Barcelonnette**: Mexican villas, a square to walk. Fifth night. Cayolle only if Bonette looks doubtful tomorrow.",
        "Eat early. Bonette is the second big day after Iseran/Galibier.",
      ],
    },
    "bonette-vesubie": {
      kicker: "Chapter 6 · Mercantour",
      title: "Bonette – and the last mountain night",
      paragraphs: [
        "**Cime de la Bonette** (2802 m) is Europe’s highest paved road if you ride the **short loop** on top, not only Restefond.",
        "South to **Saint-Étienne-de-Tinée**, then **Saint-Martin-Vésubie**. Sixth night – last in the mountains.",
        "Don’t continue to Nice the same day.",
      ],
    },
    "turini-cannes": {
      kicker: "Chapter 7 · Sea",
      title: "Turini, Nice – and Cannes as the finish",
      paragraphs: [
        "Last col: **Turini**, then down. **Nice** only if you still have legs – ten minutes on the promenade, no city programme. The target is **Cannes**.",
        "Seventh night by the water: **Le Suquet**. Skip festival week. Want more coast: our Riviera report.",
        "Park at the hotel. The sea is the contrast, not another stage.",
      ],
    },
    "passen-wetter": {
      kicker: "Practical",
      title: "Passes, closures, order",
      paragraphs: [
        "The **Route des Grandes Alpes** is seasonal: many cols from **mid-June**, first closures often **mid-September**. Check Iseran, Galibier, Izoard, Bonette the **evening before**.",
        "Motorways **A43/A51** are plan B in snow or storms – not the route for getting to know it.",
        "North→south keeps the rhythm: hard days (Iseran/Galibier, Bonette) with a short Queyras stage in between.",
      ],
    },
    essen: {
      kicker: "Table",
      title: "What we ate",
      paragraphs: [
        "Savoie: **Beaufort**, simple tart – not the three-course pass-road menu. In Briançon eat early.",
        "Ubaye and Vésubie: village inn. Water and chocolate in the car – often only vending machines on top.",
        "Cannes: **Suquet**, fish, not festival prices.",
      ],
    },
  },
  mapPois: {
    geneve: { tip: "Start · lake and airport, no overnight" },
    aravis: { tip: "First real col · photo, no rush" },
    megeve: { tip: "Night 1 · or Grand-Bornand" },
    roselend: { tip: "Lake and hairpins · slower than the map says" },
    "val-disere": { tip: "Night 2 · or Séez in the valley" },
    iseran: { tip: "Highest paved Alpine pass · morning" },
    galibier: { tip: "Tour de France col · wind, few trees" },
    briancon: { tip: "Night 3 · Vauban on foot" },
    izoard: { tip: "Casse Déserte · short stage, extra photo time" },
    guillestre: { tip: "Night 4 · or Château-Queyras" },
    vars: { tip: "Into the Ubaye · care in fog" },
    barcelonnette: { tip: "Night 5 · Mexican villas, early evening" },
    bonette: { tip: "Highest paved road in Europe · ride the loop" },
    "saint-martin-vesubie": { tip: "Night 6 · Mercantour, last mountain night" },
    turini: { tip: "Monte-Carlo hairpins · then down to the sea" },
    cannes: { tip: "Night 7 · Suquet, not Croisette rush" },
  },
};
