import { buildHotelsComLink } from "@/lib/affiliateLinks";
import { COTE_DAZUR_OFFICIAL_LINKS } from "@/lib/travelReports/coteDazurOfficialLinks";
import {
  COTE_DAZUR_POI_PHOTOS,
  coteDazurPhotoAlt,
  coteDazurPhotoUrl,
} from "@/lib/travelReports/coteDazurPhotos";
import { COTE_DAZUR_META } from "@/lib/travelReports/coteDazurSeo";
import type { ReportSection, ReportTip } from "@/lib/travelReports/types";

export type { ReportSection, ReportTip };

export const COTE_DAZUR_REPORT = {
  slug: "cote-dazur",
  title: "Côte d'Azur in 5 Tagen",
  subtitle: "Drei Basen · Küste statt Autobahn",
  seoSubtitle: COTE_DAZUR_META.seoSubtitle,
  metaDescription: COTE_DAZUR_META.description,
  duration: "5 Nächte · Mai",
  visitedIn: "Mai · Frühling",
  lead:
    "Fünf Nächte entlang der Riviera: **Nizza**, dann **Mougins**, dann die **Region Saint-Tropez**. Was bleibt: **Cours Saleya** früh, **Plage Keller**, die **Corniche über Agay** – und Dörfer statt Autobahn.",
  /** PDF Seite 1 – max. ~48 Wörter */
  printLead:
    "**5 Nächte**: Nizza · Mougins · St-Tropez-Region. **Keller**, **Corniche** über **Agay**, **Grimaud** & **Ramatuelle**. Küste statt A8.",
  affiliateDestination: "Mougins, France",
} as const;

export const COTE_DAZUR_SECTIONS: ReportSection[] = [
  {
    id: "ankunft",
    kicker: "Kapitel 1 · Nizza",
    title: "Ankommen – und nichts erzwingen",
    photo: coteDazurPhotoUrl.nice,
    photoAlt: coteDazurPhotoAlt.nice,
    photoCaption: "Nizza · erste Nacht",
    printParagraph:
      "Anreise **Italien** oder **NCE + Mietwagen** – **1 Nacht nahe Nizza**, optional **Monaco/Èze** kurz.",
    paragraphs: [
      "Erste Nacht nahe **Nizza** oder **Èze**: Gepäck ab, Mietwagen checken, duschen. Wer aus Italien über die A8 kommt, hat denselben Rhythmus – Ankunftstag ist Ankommen, kein Marathon.",
      "Wenn noch Kraft da ist: **Cours Saleya** am späten Nachmittag – Marktstände abbauen, weniger Selfie-Stöcke als mittags. Oder die **Colline du Château** hoch: Blick über die Baie des Anges, ohne Casino-Druck.",
      "Abend in **Vieux Nice**: **Socca bei Chez Pipo** (oder einem Stand ohne englische Speisekarte), ein Glas, früh schlafen. **Monaco** und **Èze** nur mit festem Zeitfenster – sonst weglassen.",
    ],
    story:
      "Einmal «schnell Monaco» nach dem Flug – Parkhaus voll, schlechte Laune. Seitdem: Ankunftstag = Socca und Bett. Monaco nur mit Puffer. Chez Pipo um halb acht: knusprig, Schlange aus Locals – da wussten wir, dass Nizza stimmt.",
    tips: [
      {
        title: "1 Nacht Nizza / Èze",
        body: "Tipp: Hôtel Les Terrasses d'Èze – oder Hotel nahe Zentrum / Vieux Nice.",
        href: COTE_DAZUR_OFFICIAL_LINKS.niceTourism,
        linkLabel: "Nizza · Tourismus",
      },
      {
        title: "Geheimtipp Abend",
        body: "Cours Saleya spät + Socca bei Chez Pipo · Colline du Château statt Casino-Hetze.",
      },
      {
        title: "Mietwagen",
        body: "Am Flughafen abholen · früh reservieren.",
        href: COTE_DAZUR_OFFICIAL_LINKS.niceAirport,
        linkLabel: "Flughafen Nizza",
      },
    ],
  },
  {
    id: "keller-antibes",
    kicker: "Kapitel 2 · Cap d'Antibes",
    title: "Plage Keller – der Moment am Wasser",
    photo: coteDazurPhotoUrl.plageKeller,
    photoAlt: coteDazurPhotoAlt.plageKeller,
    photoCaption: "Plage Keller · Cap d'Antibes",
    inlinePhoto: coteDazurPhotoUrl.coast,
    inlinePhotoAlt: coteDazurPhotoAlt.coast,
    inlinePhotoCaption: "Küste Richtung Westen",
    printParagraph:
      "**Picasso Antibes**, Mittag **Plage Keller** – Check-in **Mougins/Cannes**.",
    paragraphs: [
      "Vormittag **Antibes**: **Musée Picasso** in der Festung Grimaldi, dann zehn Minuten durch die Altstadt – **Marché Provençal**, wenn noch offen. Kein Croisette-Programm.",
      "Danach das Highlight: **Mittagessen an der Plage Keller**. Sand, Fisch, Meer – Reservation lohnt. Wer danach noch laufen will: ein Stück **Sentier du Littoral** / Richtung **Garoupe** – Felsen, kein Liegestuhl-Zwang.",
      "Check-in: **Hotel de Mougins** (zwei Nächte) oder **Cannes**. Die grossen **roten Felsen** kommen später – auf der Corniche Richtung Westen, nicht hier zwischen Antibes und Cannes.",
    ],
    story:
      "An der Keller reserviert und trotzdem gewartet – egal. Nach dem Fisch noch zwanzig Minuten am Cap-Weg: plötzlich Stille, nur Wellen. Erster echter «wir sind angekommen»-Moment – nicht an der Croisette.",
    tips: [
      {
        title: "Plage Keller",
        body: "Cap d'Antibes · Reservation · Saison beachten.",
        href: COTE_DAZUR_OFFICIAL_LINKS.plageKeller,
        linkLabel: "Plage Keller",
      },
      {
        title: "Picasso Antibes",
        body: "Festung Grimaldi · vormittags vor dem Strandessen.",
        href: COTE_DAZUR_OFFICIAL_LINKS.picassoAntibes,
        linkLabel: "Musée Picasso",
      },
      {
        title: "Geheimtipp Cap",
        body: "Nach Keller: Sentier du Littoral / Garoupe – Felsen statt Selfie-Strand.",
      },
    ],
  },
  {
    id: "mougins-cannes",
    kicker: "Kapitel 3 · Mougins",
    title: "Ruhige Basis über der Küste",
    photo: coteDazurPhotoUrl.mougins,
    photoAlt: coteDazurPhotoAlt.mougins,
    photoCaption: "Mougins · Hügeldorf",
    inlinePhoto: coteDazurPhotoUrl.cannes,
    inlinePhotoAlt: coteDazurPhotoAlt.cannes,
    inlinePhotoCaption: "Cannes · Suquet",
    printParagraph:
      "**Mougins**-Dorf, **Vallauris**, abends **Cannes** – zweite Nacht an der Basis.",
    paragraphs: [
      "Morgens **Mougins Village**, bevor die Galerie-Busse kommen: Gassen, Blick zur Küste. Unser Gegenpol zur Croisette: die **Chapelle Notre-Dame-de-Vie** etwas ausserhalb – Picasso-Blick, wenig Souvenirlärm.",
      "Danach **Vallauris**: Chapelle Picasso **vor** den Boutiquen (Lernkurve). Nachmittag: Pool im Hotel – oder abends **Le Suquet** in Cannes, eine Gasse oberhalb der Croisette, kein Festival-Preis.",
      "Zweite Nacht oben am Hügel. **Saint-Paul-de-Vence** oder **Grasse** nur als *ein* Abstecher – nicht beides am selben Tag.",
    ],
    story:
      "Im Hotelgarten absichtlich nichts geplant. Abends im Suquet ein Tisch ohne Meerblick-Aufpreis – bessere Laune als an der Croisette. Notre-Dame-de-Vie am Morgen: drei Touristen, viel Wind – unser Mougins-Moment.",
    tips: [
      {
        title: "Hotel de Mougins",
        body: "2 Nächte · Alternative: Cannes.",
        href: COTE_DAZUR_OFFICIAL_LINKS.hotelDeMougins,
        linkLabel: "Hotel de Mougins",
      },
      {
        title: "Geheimtipp Mougins",
        body: "Notre-Dame-de-Vie morgens · Suquet abends statt Croisette.",
      },
      {
        title: "Vallauris",
        body: "Picasso-Keramik · nah an Mougins.",
        href: COTE_DAZUR_OFFICIAL_LINKS.picassoVallauris,
        linkLabel: "Picasso Vallauris",
      },
      {
        title: "Grasse & St-Paul",
        body: "Tagesabstecher: Parfumstadt oder Fondation Maeght – nicht beides hetzen.",
      },
      {
        title: "Golf",
        body: "14 Plätze von Nizza bis Gassin – Karte mit Intro, Handicap & Greenfee.",
        href: "#golf",
        linkLabel: "Golf-Karte öffnen",
      },
    ],
  },
  {
    id: "saint-tropez",
    kicker: "Kapitel 4 · Übergang",
    title: "Corniche d'Or – dann Port Grimaud",
    photo: coteDazurPhotoUrl.saintTropez,
    photoAlt: coteDazurPhotoAlt.saintTropez,
    photoCaption: "Saint-Tropez · Hafen früh",
    inlinePhoto: coteDazurPhotoUrl.marina,
    inlinePhotoAlt: coteDazurPhotoAlt.marina,
    inlinePhotoCaption: "Port Grimaud · Kanäle",
    printParagraph:
      "**Corniche d'Or** über **Agay** (rote Felsen) – **nicht A8**. St-Tropez früh, **Port Grimaud**.",
    paragraphs: [
      "Check-out – und die Strecke, die die Côte zeigt: **Cannes** dem Meer entlang über **Théoule**, Fotostopp an den **roten Felsen bei Agay** (Timer setzen), weiter Richtung Golf. Das ist die **Corniche d'Or**.",
      "Die **A8** ist schneller und langweilig. GPS oft auf Autobahn – Küstenroute fest einstellen.",
      "In der Region: **zwei Nächte**. **Saint-Tropez** nur früh: **Place des Lices** (Markttag = Glück), kurz **Citadelle**-Blick – Hafen maximal zwanzig Minuten. Dann **Port Grimaud** zu Fuss vom Parkplatz am Rand, nicht mit dem Auto in die Kanäle.",
    ],
    story:
      "Einmal A8 über Le Muy – kaum Meer. Beim zweiten Mal Agay mit Stopp: plötzlich wieder Urlaub. In St-Tropez Place des Lices statt Hafenzeile – und Port Grimaud am Nachmittag: wieder atmen.",
    tips: [
      {
        title: "Corniche d'Or",
        body: "Cannes → Théoule → Agay (Timer!) → St-Tropez · dem Meer entlang.",
      },
      {
        title: "Geheimtipp St-Tropez",
        body: "Place des Lices + Citadelle früh · Hafen nur kurz · Port Grimaud vom Rand.",
      },
      {
        title: "2 Nächte Region",
        body: "Tipp: Hôtel de Paris Saint-Tropez – oder ruhiger Richtung Grimaud.",
        href: COTE_DAZUR_OFFICIAL_LINKS.saintTropezTourism,
        linkLabel: "Saint-Tropez · Tourismus",
      },
    ],
  },
  {
    id: "grimaud-ramatuelle",
    kicker: "Kapitel 5 · Region",
    title: "Grimaud & Ramatuelle – und Schluss",
    photo: coteDazurPhotoUrl.village,
    photoAlt: coteDazurPhotoAlt.village,
    photoCaption: "Grimaud · Burgdorf",
    printParagraph:
      "**Grimaud**, **Ramatuelle** – zweite Nacht Region. Provence-Rückfahrt = eigener Bericht.",
    paragraphs: [
      "**Grimaud** oben: Burgblick, dann eine Gasse für **Eis** – Kontrast zu Port Grimaud unten. Optional der kurze Abstecher nach **Gassin**: Dorfplatz, Blick über die Halbinsel, null Hafenlärm.",
      "**Ramatuelle**: erst das Dorf, dann entscheiden, ob **Pampelonne** überhaupt noch dran ist. Oft reicht der Sand an den Füssen im Dorf – weniger Pose als der St-Tropez-Hafen.",
      "Die **Rückfahrt durch die Provence** (z. B. Route Napoléon) ist ein **eigenes Kapitel** – hier nur der Abschied: ein **Rosé** irgendwo ohne Hafenzeile.",
    ],
    story:
      "Eis in einer Grimaud-Gasse, zehn Minuten Gassin-Blick, in Ramatuelle Sand – und im Kopf schon die Provence. Pampelonne haben wir diesmal bewusst ausgelassen. Besser so.",
    tips: [
      {
        title: "Grimaud",
        body: "Dorf + Burgblick · Schuhe für Pflaster.",
        href: COTE_DAZUR_OFFICIAL_LINKS.grimaudTourism,
        linkLabel: "Grimaud · Tourismus",
      },
      {
        title: "Geheimtipp Region",
        body: "Gassin-Blick · Ramatuelle-Dorf vor Pampelonne · Rosé ohne Hafenzeile.",
      },
      {
        title: "Ramatuelle",
        body: "Dorf und Strand · Parken früh am Wochenende.",
        href: COTE_DAZUR_OFFICIAL_LINKS.ramatuelleTourism,
        linkLabel: "Ramatuelle · Tourismus",
      },
    ],
  },
  {
    id: "essen",
    kicker: "Nebenbei",
    title: "Essen – ein Highlight setzen",
    photo: coteDazurPhotoUrl.market,
    photoAlt: coteDazurPhotoAlt.market,
    photoCaption: "Markt · Côte d'Azur",
    paragraphs: [
      "**Plage Keller** war unser teuerstes und schönstes Mittagessen. In **Nizza**: **Chez Pipo** (Socca) und Markt am **Cours Saleya**. In **Mougins** gehobener oder abends im **Suquet** – bewusst nicht die teuerste Croisette-Zeile.",
      "In der **Region**: Place-des-Lices-Nähe oder Dorfküche in **Grimaud** / **Ramatuelle**. Ein starkes Strandessen schlägt drei mittelmässige «View»-Restaurants.",
    ],
    story:
      "Nach Keller «noch so etwas» in der St-Tropez-Hafenzeile erzwingen – verzettelt. Besser: ein Highlight setzen, sonst ehrlich essen. Chez Pipo und Keller reichen als Anker.",
  },
  {
    id: "fallen",
    kicker: "Lernen",
    title: "Drei Fallen – kurz",
    photo: coteDazurPhotoUrl.nice,
    photoAlt: coteDazurPhotoAlt.nice,
    photoCaption: "Riviera · Praxis",
    paragraphs: [
      "**A8 statt Küste** stiehlt die Riviera – Agay mit Timer schlägt Le Muy. **St-Tropez mittags** ohne Plan B nervt – Place des Lices früh oder Region. **Eine Basis** für fünf Tage reicht nicht bis Grimaud – deshalb **1+2+2**.",
    ],
    story:
      "Ohne die Corniche kamen wir in St-Tropez an – aber ohne das Gefühl, die Côte gesehen zu haben. Seitdem: Küste, benannte Stopps, ein Highlight pro Tag.",
  },
];

export const COTE_DAZUR_MUST_SEE = [
  "Nizza · Vieux Nice, Cours Saleya, Promenade des Anglais",
  "Èze · Dorf perchée (nahe erste Nacht)",
  "Monaco · Kurzstopp mit Timer (optional)",
  "Saint-Paul-de-Vence · Gassen & Fondation Maeght",
  "Grasse · Parfumfabriken & Altstadt",
  "Antibes · Musée Picasso & Altstadt",
  "Plage Keller · Cap d'Antibes",
  "Vallauris · Picasso-Keramik (nah an Mougins)",
  "Mougins Village · Galerien & Blick zur Küste",
  "Cannes · Suquet, Hafen, Croisette spät",
  "Corniche d'Or · Cannes–Agay (rote Felsen, nicht A8)",
  "Saint-Tropez · Hafen früh",
  "Port Grimaud · Kanäle",
  "Grimaud · Burgdorf",
  "Ramatuelle · Dorf & Strand Richtung Pampelonne",
  "Villefranche / Cap Ferrat · wenn Zeit im Osten",
];

export const COTE_DAZUR_HERO_PHOTO = coteDazurPhotoUrl.hero;
export const COTE_DAZUR_HERO_PHOTO_ALT = coteDazurPhotoAlt.hero;

export const COTE_DAZUR_HOTEL_TIPS = {
  intro:
    "Gestaffelt statt sieben Hotels: eine Nacht Nizza oder Èze, zwei Nächte Mougins oder Cannes, zwei Nächte in der Region Saint-Tropez. Koffer nur zweimal umpacken, Küste statt Autobahn.",
} as const;

export type CoteDazurHotelPick = {
  id: string;
  name: string;
  stars: string;
  area: string;
  note: string;
  audience?: string;
  tier: "standard" | "luxury" | "budget";
  hotelsComPath?: string;
};

export const COTE_DAZUR_HOTEL_PICKS: CoteDazurHotelPick[] = [
  {
    id: "eze-terrasses",
    name: "Hôtel Les Terrasses d'Èze",
    stars: "4*",
    area: "Èze · 1 Nacht (nahe Nizza)",
    tier: "luxury",
    audience: "Ankunft · Meerblick",
    note: "Zwischen Nizza und Monaco – Spa, Terrassen, starker Start statt Innenstadt-Nizza.",
    hotelsComPath: "/ho766874048/hotel-les-terrasses-d-eze-eze-france/",
  },
  {
    id: "nice",
    name: "Hotels nahe Nizza",
    stars: "3–4*",
    area: "Nizza · 1 Nacht",
    tier: "standard",
    audience: "Alternative Ankunft",
    note: "Erste Nacht nach Flug oder Italien-Anreise – Zentrum oder ruhig westlich.",
  },
  {
    id: "hotel-de-mougins",
    name: "Hôtel de Mougins",
    stars: "4*",
    area: "Mougins · 2 Nächte",
    tier: "luxury",
    audience: "Unser Favorit",
    note: "Ruhige Basis über der Küste – Pool, Garten, kurze Fahrten nach Cannes und Antibes.",
    hotelsComPath: "/ho486911/hotel-de-mougins-mougins-france/",
  },
  {
    id: "cannes",
    name: "Hotels in Cannes",
    stars: "3–5*",
    area: "Cannes · 2 Nächte",
    tier: "standard",
    audience: "Alternative zu Mougins",
    note: "Wenn ihr abends an der Croisette bleiben wollt – Festivalwoche meiden.",
  },
  {
    id: "hotel-paris-st-tropez",
    name: "Hôtel de Paris Saint-Tropez",
    stars: "5*",
    area: "Saint-Tropez · 2 Nächte",
    tier: "luxury",
    audience: "Region St-Tropez",
    note: "Im Ort – Spa, Pool, nah am Hafen. Grimaud, Port Grimaud und Ramatuelle als Tagesziele.",
    hotelsComPath: "/ho424220/hotel-de-paris-saint-tropez-saint-tropez-france/",
  },
  {
    id: "st-tropez-region",
    name: "Hotels Region Saint-Tropez",
    stars: "3–4*",
    area: "Grimaud / Ramatuelle · 2 Nächte",
    tier: "standard",
    audience: "Ruhigere Alternative",
    note: "Ausserhalb Hafen – Grimaud und Ramatuelle ohne Hin- und Rückhetze.",
  },
];

export { COTE_DAZUR_POI_PHOTOS };

/** Planer-Seed: 2 Nächte Mougins (Mittelsegment). Gesamt: 5 Nächte gestaffelt. */
const HOTEL_NIGHTS = 2;
const HOTEL_TRAVELERS = 2;
const HOTEL_DAYS_AHEAD = 14;

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildCoteDazurHotelSearchWindow(): { checkIn: string; checkOut: string } {
  const checkIn = new Date();
  checkIn.setHours(12, 0, 0, 0);
  checkIn.setDate(checkIn.getDate() + HOTEL_DAYS_AHEAD);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + HOTEL_NIGHTS);
  return { checkIn: toIsoDate(checkIn), checkOut: toIsoDate(checkOut) };
}

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.`;
}

export function formatCoteDazurHotelWindowLabel(): string {
  const { checkIn, checkOut } = buildCoteDazurHotelSearchWindow();
  return `${formatShortDate(checkIn)}–${formatShortDate(checkOut)} · ${HOTEL_NIGHTS} Nächte Mougins · ${HOTEL_TRAVELERS} Personen`;
}

function nightsForPick(pickId: string): number {
  if (pickId === "nice" || pickId === "eze-terrasses") return 1;
  return 2;
}

function destinationForPick(pickId: string): string {
  switch (pickId) {
    case "nice":
      return "Nice, France";
    case "eze-terrasses":
      return "Eze, France";
    case "cannes":
      return "Cannes, France";
    case "hotel-paris-st-tropez":
    case "st-tropez-region":
      return "Saint-Tropez, France";
    default:
      return "Mougins, France";
  }
}

export function buildCoteDazurHotelPickLink(pick: CoteDazurHotelPick): string {
  const { checkIn } = buildCoteDazurHotelSearchWindow();
  const nights = nightsForPick(pick.id);
  const checkInDate = new Date(checkIn + "T12:00:00");
  const checkOutDate = new Date(checkInDate);
  checkOutDate.setDate(checkOutDate.getDate() + nights);
  const checkOut = toIsoDate(checkOutDate);

  const base = {
    checkIn,
    checkOut,
    travelers: HOTEL_TRAVELERS,
    rooms: 1,
    clickRef: `cote-dazur-hotel-${pick.id}`,
  };
  if (pick.hotelsComPath) {
    return buildHotelsComLink({ ...base, landingPage: pick.hotelsComPath });
  }
  return buildHotelsComLink({ ...base, destination: destinationForPick(pick.id) });
}
