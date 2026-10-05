import { buildHotelsComLink } from "@/lib/affiliateLinks";
import { GRANDES_ALPES_OFFICIAL_LINKS } from "@/lib/travelReports/grandesAlpesOfficialLinks";
import {
  GRANDES_ALPES_POI_PHOTOS,
  grandesAlpesPhotoAlt,
  grandesAlpesPhotoUrl,
} from "@/lib/travelReports/grandesAlpesPhotos";
import { GRANDES_ALPES_META } from "@/lib/travelReports/grandesAlpesSeo";
import type { ReportSection } from "@/lib/travelReports/types";

export type { ReportSection };

export const GRANDES_ALPES_REPORT = {
  slug: "grandes-alpes",
  title: "Route des Grandes Alpes in 7 Tagen",
  subtitle: "Genf → Cannes · Pässe statt Autobahn",
  seoSubtitle: GRANDES_ALPES_META.seoSubtitle,
  metaDescription: GRANDES_ALPES_META.description,
  duration: "7 Nächte · Juli",
  visitedIn: "Juli · Passsaison",
  lead:
    "Sieben Nächte von **Genf** nach **Cannes**: **Megève**, **Val-d'Isère**, **Briançon**, **Guillestre**, **Barcelonnette**, **Saint-Martin-Vésubie**. Was bleibt: **Iseran** am Morgen, **Casse Déserte**, die **Bonette-Schleife** – und erst ganz am Schluss das Meer.",
  printLead:
    "**7 Nächte** Genf → Cannes. **Iseran**, **Galibier**, **Izoard**, **Bonette**. Hotels in den Tälern, nicht auf den Pässen.",
  affiliateDestination: "Megève, France",
} as const;

export const GRANDES_ALPES_SECTIONS: ReportSection[] = [
  {
    id: "genf-megeve",
    kicker: "Kapitel 1 · Savoyen",
    title: "Genf verlassen – erste Passnacht",
    photo: grandesAlpesPhotoUrl.megeve,
    photoAlt: grandesAlpesPhotoAlt.megeve,
    photoCaption: "Megève · erste Nacht",
    printParagraph:
      "**Genf** früh raus, **Aravis** oder **Colombière**, Check-in **Megève** oder **Grand-Bornand** – kein Iseran am Tag 1.",
    paragraphs: [
      "Start **Genf**: Gepäck, Tank, Wetterbericht für die Pässe. Wer vom Flughafen kommt, fährt nicht noch denselben Tag über den Iseran – der kommt später, frisch.",
      "Die erste Etappe bleibt bewusst unter **160 km**: **Col des Gets**, **Colombière**, **Aravis**. Fotostopp, Käse, nicht Hetzen. GPS will oft die Autobahn nach Albertville – ablehnen.",
      "Nacht in **Megève** oder **Grand-Bornand**. Abendspaziergang, früh schlafen. Wer hier schon «noch schnell Roselend» anhängt, ist am nächsten Morgen müde – und der See verdient Tageslicht.",
    ],
    story:
      "Einmal Genf um zehn verlassen und um sechs noch den Aravis «schnell» – Nebel, Gegenverkehr, schlechte Fotos. Seitdem: vor drei ankommen, Dorf, Bett. Der Pass wartet.",
    tips: [
      {
        title: "1 Nacht Megève / Grand-Bornand",
        body: "Suche nach Dorfhotel mit Parkplatz – nicht nur Wellness-Palace.",
        href: GRANDES_ALPES_OFFICIAL_LINKS.megeve,
        linkLabel: "Megève · Tourismus",
      },
      {
        title: "Wetter",
        body: "Vormittags oft klarer. Bei Gewitterwarnung Etappe kürzen, nicht den Pass erzwingen.",
      },
    ],
  },
  {
    id: "roseland-valdisere",
    kicker: "Kapitel 2 · Beaufortain",
    title: "Roselend – und rechtzeitig im Tal",
    photo: grandesAlpesPhotoUrl.roselend,
    photoAlt: grandesAlpesPhotoAlt.roselend,
    photoCaption: "Lac de Roselend",
    printParagraph:
      "**Saisies**, **Cormet de Roselend**, Check-in **Val-d'Isère** oder **Séez** – Iseran bleibt der nächste Morgen.",
    paragraphs: [
      "**Col des Saisies**, dann der **Cormet de Roselend**: Stausee, Kehren, Motorräder. Nicht nur durchfahren – zehn Minuten an der Staumauer, dann weiter nach **Bourg-Saint-Maurice**.",
      "Von dort hoch nach **Val-d'Isère** oder im Tal in **Séez** bleiben. Séez ist ruhiger und oft günstiger; Val-d'Isère spart am nächsten Morgen Höhenmeter vor dem Iseran.",
      "Iseran **nicht** an diesen Tag hängen. Zwei grosse Pässe plus Ankunft sind genug. Abend: früh essen, Jacke bereitlegen.",
    ],
    story:
      "Am Roselend stehen bleiben, obwohl die Karte «nur noch eine Stunde» sagt. Die Stunde wird zwei. Val-d'Isère bei Tageslicht ankommen war die bessere Entscheidung als noch den Iseran «mitzunehmen».",
    tips: [
      {
        title: "2. Nacht Val-d'Isère / Séez",
        body: "Séez im Isère-Tal, wenn Hotels oben voll oder teuer sind.",
        href: GRANDES_ALPES_OFFICIAL_LINKS.valDisere,
        linkLabel: "Val-d'Isère",
      },
      {
        title: "Geheimtipp Stopp",
        body: "Lac de Roselend ostseitig – weniger Motorrad-Parkplatz als an der Krone.",
      },
    ],
  },
  {
    id: "iseran-galibier",
    kicker: "Kapitel 3 · Haute Maurienne",
    title: "Iseran am Morgen, Galibier am Nachmittag",
    photo: grandesAlpesPhotoUrl.iseran,
    photoAlt: grandesAlpesPhotoAlt.iseran,
    photoCaption: "Col de l'Iseran",
    inlinePhoto: grandesAlpesPhotoUrl.galibier,
    inlinePhotoAlt: grandesAlpesPhotoAlt.galibier,
    inlinePhotoCaption: "Col du Galibier",
    printParagraph:
      "**Col de l'Iseran** früh, Pause **Valloire**, **Galibier**, Nacht **Briançon**.",
    paragraphs: [
      "**Col de l'Iseran** (2770 m): höchster asphaltierter Alpenpass. Morgens fahren – weniger Gegenverkehr, oft klarer. Windjacke, nicht nur T-Shirt. Bei Sperrung: Talstrecke über Modane, Galibier trotzdem prüfen.",
      "Abstieg **Bonneval-sur-Arc**, **Lanslebourg**, dann **Col du Télégraphe** und **Galibier**. Das ist der lange Tag: zwei Ikonen, wenig Schatten. Pause in **Valloire** – Kaffee, nicht nur Tanken.",
      "Ziel **Briançon**: Vauban-Altstadt zu Fuss, Auto am Hotel lassen. Dritte Nacht, Beine ausstrecken. Wer noch «schnell Izoard» will: nein.",
    ],
    story:
      "Oben am Iseran war die Luft dünn und der Parkplatz voller Aufkleber. Fünf Minuten Stille hinter der Kapelle – dann runter. Am Galibier später derselbe Wind, andere Farbe. Briançon am Abend: Stein, enge Gassen, endlich flach.",
    tips: [
      {
        title: "3. Nacht Briançon",
        body: "Altstadt oder Cité Vauban – Parken klären vor der engen Zufahrt.",
        href: GRANDES_ALPES_OFFICIAL_LINKS.briancon,
        linkLabel: "Briançon",
      },
      {
        title: "Sperrungen",
        body: "Iseran und Galibier können bis Juni Schnee haben – routedesgrandesalpes.com am Vorabend.",
        href: GRANDES_ALPES_OFFICIAL_LINKS.route,
        linkLabel: "Route des Grandes Alpes",
      },
    ],
  },
  {
    id: "izoard-guillestre",
    kicker: "Kapitel 4 · Queyras",
    title: "Kurze Etappe – Casse Déserte",
    photo: grandesAlpesPhotoUrl.izoard,
    photoAlt: grandesAlpesPhotoAlt.izoard,
    photoCaption: "Col d'Izoard",
    printParagraph:
      "**Col d'Izoard**, **Casse Déserte**, Nacht **Guillestre** oder **Château-Queyras**.",
    paragraphs: [
      "Nach zwei schweren Tagen bewusst **kurz**: Briançon über den **Col d'Izoard** nach **Guillestre**. Die **Casse Déserte** ist der Grund – Mondlandschaft, Steine, wenig Grün. Timer setzen.",
      "Abstieg ins **Queyras**. Nacht in **Guillestre** (praktisch, Einkauf) oder **Château-Queyras** (Burg, ruhiger). Vierzig Kilometer Luftlinie, drei Stunden mit Fotos – das ist der Punkt.",
      "Nachmittag: Dorf, Durance-Ufer, nicht noch Vars. Der Col de Vars wartet auf den nächsten Vormittag.",
    ],
    story:
      "Am Izoard wollten wir «nur durch». Dann die Casse Déserte: grau, still, ein Radfahrer ohne Begleitwagen. Zwanzig Minuten später wussten wir, warum Tag 4 kurz sein muss.",
    tips: [
      {
        title: "4. Nacht Guillestre / Queyras",
        body: "Château-Queyras wenn ihr Burg und Stille wollt, Guillestre für Tankstelle und Bäckerei.",
        href: GRANDES_ALPES_OFFICIAL_LINKS.queyras,
        linkLabel: "Queyras",
      },
    ],
  },
  {
    id: "vars-barcelonnette",
    kicker: "Kapitel 5 · Ubaye",
    title: "Vars – und Barcelonnette ohne Eile",
    photo: grandesAlpesPhotoUrl.vesubie,
    photoAlt: grandesAlpesPhotoAlt.vesubie,
    photoCaption: "Südalpen vor der Bonette",
    printParagraph:
      "**Col de Vars** nach **Barcelonnette** – mexikanische Villen, früher Abend, Bonette morgen.",
    paragraphs: [
      "**Col de Vars** verbindet Queyras und **Ubaye**. Bei Nebel langsam, bei Motorradsonntag Geduld. Die Distanz ist klein – die Konzentration nicht.",
      "**Barcelonnette**: breite Strasse, Villen aus der Mexiko-Emigration, Platz zum Gehen. Fünfte Nacht. Wer Kraft hat: kurzer Blick Richtung **Col de la Cayolle** – fahren nur, wenn die Bonette am nächsten Tag unsicher ist (Plan B).",
      "Sonst: früh essen, Schlafen. Die Bonette ist der zweite grosse Tag nach Iseran/Galibier.",
    ],
    story:
      "In Barcelonnette zuerst die Villen fotografiert, dann gemerkt: der Ort ist zum Ankommen da, nicht zum Abhaken. Ein Eis, ein Platz, Bett vor zehn.",
    tips: [
      {
        title: "5. Nacht Barcelonnette",
        body: "Zentrum oder leicht ausserhalb mit Parkplatz – Ubaye-Tal ist die Basis vor der Bonette.",
        href: GRANDES_ALPES_OFFICIAL_LINKS.ubaye,
        linkLabel: "Ubaye",
      },
      {
        title: "Plan B",
        body: "Bonette gesperrt → Cayolle oder Restefond-Tal prüfen, nicht blind GPS folgen.",
      },
    ],
  },
  {
    id: "bonette-vesubie",
    kicker: "Kapitel 6 · Mercantour",
    title: "Bonette – und die letzte Bergnacht",
    photo: grandesAlpesPhotoUrl.bonette,
    photoAlt: grandesAlpesPhotoAlt.bonette,
    photoCaption: "Cime de la Bonette",
    printParagraph:
      "**Cime de la Bonette** inkl. Kamm-Schleife, Nacht **Saint-Martin-Vésubie**.",
    paragraphs: [
      "Die **Cime de la Bonette** (2802 m) ist die höchste asphaltierte Strasse Europas – wenn ihr die **kurze Schleife** oben mitfahrt, nicht nur den Col de Restefond. Jacke, wenig Sauerstoff, kaum Schutz.",
      "Südabfahrt Richtung **Saint-Étienne-de-Tinée**, dann **Saint-Martin-Vésubie**. Mercantour: enger, grüner, schon Mittelmeerluft. Sechste Nacht – letzte im Gebirge.",
      "Nicht weiter nach Nizza am selben Tag. Wer die Bonette respektiert, kommt müde an. Dorf, Dusche, früh.",
    ],
    story:
      "Oben die Schleife: ein Schild, Wind, ein Paar mit Thermoskanne. Unten im Vésubie roch es nach Harz und warmem Stein. Da war klar: morgen Meer, heute noch Berg.",
    tips: [
      {
        title: "6. Nacht Saint-Martin-Vésubie",
        body: "Kleine Hotels, früh buchen im Juli. Alternative: Saint-Dalmas oder Isola.",
        href: GRANDES_ALPES_OFFICIAL_LINKS.vesubie,
        linkLabel: "Vésubie",
      },
    ],
  },
  {
    id: "turini-cannes",
    kicker: "Kapitel 7 · Meer",
    title: "Turini, Nizza – und Cannes als Ziel",
    photo: grandesAlpesPhotoUrl.cannes,
    photoAlt: grandesAlpesPhotoAlt.cannes,
    photoCaption: "Cannes · siebte Nacht",
    printParagraph:
      "**Col de Turini**, optional **Nizza** kurz, Check-in **Cannes** – Suquet, nicht Festival.",
    paragraphs: [
      "Letzter Berg: **Col de Turini** (Rallye-Kehren), dann runter. **Nizza** nur wenn ihr noch Beine habt – Promenade zehn Minuten, kein Stadtprogramm. Ziel ist **Cannes**.",
      "Siebte Nacht am Wasser: **Le Suquet**, Hafen am Abend, Croisette spät wenn überhaupt. Festivalwoche meiden. Wer die Côte länger will: unser Riviera-Bericht mit gestaffelten Nächten.",
      "Auto am Hotel parken. Das Meer ist der Kontrast, nicht noch eine Etappe.",
    ],
    story:
      "Vom Turini sahen wir das Meer zuerst als Streifen. In Cannes dann Salzwasser in der Luft – nach sechs Bergnächten wirkte die Croisette fast zu glatt. Suquet war richtig: steil, alt, nah am Wasser.",
    tips: [
      {
        title: "7. Nacht Cannes",
        body: "Suquet oder westlich der Croisette – Festivaltermine prüfen.",
        href: GRANDES_ALPES_OFFICIAL_LINKS.cannes,
        linkLabel: "Cannes",
      },
      {
        title: "Danach",
        body: "Côte d'Azur gestaffelt (Mougins, St-Tropez-Region) – eigener Bericht, nicht an Tag 8 quetschen.",
        href: "/reisebericht/cote-dazur",
        linkLabel: "Côte d'Azur",
      },
    ],
  },
  {
    id: "passen-wetter",
    kicker: "Praxis",
    title: "Pässe, Sperrungen, Reihenfolge",
    photo: grandesAlpesPhotoUrl.galibier,
    photoAlt: grandesAlpesPhotoAlt.galibier,
    photoCaption: "Hohe Pässe · Saisonfenster",
    printParagraph:
      "Saison **Mitte Juni–Mitte September**. Iseran, Galibier, Bonette am Vorabend prüfen – nicht GPS-Autobahn.",
    paragraphs: [
      "Die **Route des Grandes Alpes** ist ein Saisonprodukt: viele Pässe erst **ab Mitte Juni**, erste Sperrungen oft **Mitte September**. Iseran, Galibier, Izoard, Bonette am **Vorabend** auf der offiziellen Seite und in den lokalen Infos prüfen.",
      "Autobahn **A43/A51** ist Plan B bei Schnee oder Gewitter – nicht die Strecke zum Kennenlernen. GPS auf «keine Autobahn» stellen, sonst landet ihr in Grenoble.",
      "Reihenfolge Nord→Süd hält die Höhe im Rhythmus: grosse Tage (Iseran/Galibier, Bonette) mit einer kurzen Queyras-Etappe dazwischen.",
    ],
    tips: [
      {
        title: "Offizielle Route",
        body: "Pässe, Etappen, aktuelle Hinweise – vor jeder hohen Etappe.",
        href: GRANDES_ALPES_OFFICIAL_LINKS.route,
        linkLabel: "routedesgrandesalpes.com",
      },
    ],
  },
  {
    id: "essen",
    kicker: "Tisch",
    title: "Was wir gegessen haben",
    photo: grandesAlpesPhotoUrl.roselend,
    photoAlt: grandesAlpesPhotoAlt.roselend,
    photoCaption: "Beaufortain · nach dem See",
    printParagraph:
      "Beaufort, Raclette ohne Touristenmenü, in Cannes Fisch am Suquet – nicht Croisette-Preise.",
    paragraphs: [
      "Savoyen: **Beaufort**, einfache Tarte, nicht das dreigängige «Menu Savoyard» an der Passstrasse. In Briançon früh essen – Küche schliesst früher als an der Côte.",
      "Ubaye und Vésubie: Gasthaus im Dorf, nicht nur Snack am Col. Wasser und Schokolade im Auto – oben oft nur Automaten.",
      "Cannes: **Suquet**, Fisch, kein Festival-Preis. Nach sechs Bergnächten reicht ein Tisch mit Blick, ohne Show.",
    ],
  },
];

export const GRANDES_ALPES_MUST_SEE = [
  "Col des Aravis oder Colombière · erste Passluft",
  "Megève oder Grand-Bornand · 1. Nacht",
  "Cormet de Roselend · See und Kehren",
  "Val-d'Isère oder Séez · 2. Nacht",
  "Col de l'Iseran · morgens",
  "Col du Galibier · nach Valloire",
  "Briançon · Vauban zu Fuss · 3. Nacht",
  "Col d'Izoard · Casse Déserte",
  "Guillestre oder Château-Queyras · 4. Nacht",
  "Col de Vars · Übergang Ubaye",
  "Barcelonnette · 5. Nacht",
  "Cime de la Bonette · Schleife oben",
  "Saint-Martin-Vésubie · 6. Nacht",
  "Col de Turini · dann Meer",
  "Cannes · Suquet · 7. Nacht",
];

export const GRANDES_ALPES_HERO_PHOTO = grandesAlpesPhotoUrl.hero;
export const GRANDES_ALPES_HERO_PHOTO_ALT = grandesAlpesPhotoAlt.hero;

export const GRANDES_ALPES_HOTEL_TIPS = {
  intro:
    "Sieben Täler, sieben Nächte: je eine in Megève oder Grand-Bornand, Val-d'Isère oder Séez, Briançon, Guillestre im Queyras, Barcelonnette, Saint-Martin-Vésubie und Cannes. Dorfhotel mit Parkplatz vor Wellness-Palace – und nicht auf dem Pass selbst übernachten.",
} as const;

export type GrandesAlpesHotelPick = {
  id: string;
  name: string;
  stars: string;
  area: string;
  note: string;
  audience?: string;
  tier: "standard" | "luxury" | "budget";
  hotelsComPath?: string;
};

export const GRANDES_ALPES_HOTEL_PICKS: GrandesAlpesHotelPick[] = [
  {
    id: "megeve",
    name: "Hotels in Megève",
    stars: "3–4*",
    area: "Megève · 1 Nacht",
    tier: "luxury",
    audience: "1. Nacht",
    note: "Dorf mit Parkplatz – Alternative Grand-Bornand, oft ruhiger.",
  },
  {
    id: "grand-bornand",
    name: "Hotels in Grand-Bornand",
    stars: "3*",
    area: "Le Grand-Bornand · 1 Nacht",
    tier: "standard",
    audience: "Alternative zu Megève",
    note: "Näher an Aravis/Colombière – gut nach später Genf-Ankunft.",
  },
  {
    id: "val-disere",
    name: "Hotels in Val-d'Isère",
    stars: "3–4*",
    area: "Val-d'Isère · 1 Nacht",
    tier: "standard",
    audience: "Vor dem Iseran",
    note: "Spart am nächsten Morgen Höhenmeter – im Sommer ruhiger als im Winter.",
  },
  {
    id: "seez",
    name: "Hotels in Séez",
    stars: "2–3*",
    area: "Séez · 1 Nacht",
    tier: "budget",
    audience: "Tal-Alternative",
    note: "Günstiger als Val-d'Isère, 20–25 Min. extra vor dem Iseran.",
  },
  {
    id: "briancon",
    name: "Hotels in Briançon",
    stars: "3*",
    area: "Briançon · 1 Nacht",
    tier: "standard",
    audience: "Nach Galibier",
    note: "Cité Vauban oder etwas unterhalb – Parken vor der engen Altstadt klären.",
  },
  {
    id: "guillestre",
    name: "Hotels in Guillestre",
    stars: "2–3*",
    area: "Guillestre · 1 Nacht",
    tier: "standard",
    audience: "Queyras",
    note: "Praktisch (Tank, Brot). Château-Queyras wenn ihr Burg und Stille wollt.",
  },
  {
    id: "barcelonnette",
    name: "Hotels in Barcelonnette",
    stars: "3*",
    area: "Barcelonnette · 1 Nacht",
    tier: "standard",
    audience: "Vor der Bonette",
    note: "Zentrum mit Parkplatz – frühe Abfahrt zur Cime.",
  },
  {
    id: "vesubie",
    name: "Hotels in Saint-Martin-Vésubie",
    stars: "2–3*",
    area: "Saint-Martin-Vésubie · 1 Nacht",
    tier: "standard",
    audience: "Letzte Bergnacht",
    note: "Klein, im Juli früh buchen. Isola als Ausweichort.",
  },
  {
    id: "cannes",
    name: "Hotels in Cannes",
    stars: "3–4*",
    area: "Cannes · 1 Nacht",
    tier: "luxury",
    audience: "Ziel am Meer",
    note: "Suquet oder westlich – Festivalwoche meiden.",
  },
];

export { GRANDES_ALPES_POI_PHOTOS };

const HOTEL_NIGHTS = 7;
const HOTEL_TRAVELERS = 2;

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildGrandesAlpesHotelSearchWindow(): { checkIn: string; checkOut: string } {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  let year = now.getFullYear();
  if (now.getMonth() >= 8) year += 1;
  const checkIn = new Date(year, 6, 10);
  if (checkIn.getTime() < now.getTime() + 7 * 86400000) {
    checkIn.setFullYear(checkIn.getFullYear() + 1);
  }
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + HOTEL_NIGHTS);
  return { checkIn: toIsoDate(checkIn), checkOut: toIsoDate(checkOut) };
}

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.`;
}

export function formatGrandesAlpesHotelWindowLabel(): string {
  const { checkIn, checkOut } = buildGrandesAlpesHotelSearchWindow();
  return `${formatShortDate(checkIn)}–${formatShortDate(checkOut)} · ${HOTEL_NIGHTS} Nächte · ${HOTEL_TRAVELERS} Personen`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}

function nightOffsetForPick(pickId: string): number {
  switch (pickId) {
    case "megeve":
    case "grand-bornand":
      return 0;
    case "val-disere":
    case "seez":
      return 1;
    case "briancon":
      return 2;
    case "guillestre":
      return 3;
    case "barcelonnette":
      return 4;
    case "vesubie":
      return 5;
    case "cannes":
      return 6;
    default:
      return 0;
  }
}

function destinationForPick(pickId: string): string {
  switch (pickId) {
    case "grand-bornand":
      return "Le Grand-Bornand, France";
    case "val-disere":
      return "Val d'Isere, France";
    case "seez":
      return "Seez, France";
    case "briancon":
      return "Briancon, France";
    case "guillestre":
      return "Guillestre, France";
    case "barcelonnette":
      return "Barcelonnette, France";
    case "vesubie":
      return "Saint-Martin-Vesubie, France";
    case "cannes":
      return "Cannes, France";
    default:
      return "Megeve, France";
  }
}

export function buildGrandesAlpesHotelPickLink(pick: GrandesAlpesHotelPick): string {
  const { checkIn: tripStart } = buildGrandesAlpesHotelSearchWindow();
  const offset = nightOffsetForPick(pick.id);
  const checkIn = addDaysIso(tripStart, offset);
  const checkOut = addDaysIso(checkIn, 1);
  const base = {
    checkIn,
    checkOut,
    travelers: HOTEL_TRAVELERS,
    rooms: 1,
    clickRef: `grandes-alpes-hotel-${pick.id}`,
  };
  if (pick.hotelsComPath) {
    return buildHotelsComLink({ ...base, landingPage: pick.hotelsComPath });
  }
  return buildHotelsComLink({ ...base, destination: destinationForPick(pick.id) });
}
