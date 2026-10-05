import { buildBookingHotelLink } from "@/lib/affiliateLinks";
import { BARCELONA_OFFICIAL_LINKS } from "@/lib/travelReports/barcelonaOfficialLinks";
import {
  BARCELONA_POI_PHOTOS,
  barcelonaPhotoAlt,
  barcelonaPhotoUrl,
} from "@/lib/travelReports/barcelonaPhotos";
import { BARCELONA_META } from "@/lib/travelReports/barcelonaSeo";
import type { ReportSection } from "@/lib/travelReports/types";

export const BARCELONA_REPORT = {
  slug: "barcelona",
  title: "Barcelona in 4 Tagen",
  subtitle: "Flug · Metro · Gaudí & Meer",
  seoSubtitle: BARCELONA_META.seoSubtitle,
  duration: "4 Tage · 3 Nächte",
  lead:
    "Vier Tage **ohne Mietauto**: mit dem **Flug** nach BCN, **Metro** ins **El Born**, **Sagrada Família** mit Zeitfenster, **Park Güell** früh, **Barceloneta** zum Abschluss – eine Basis, alles zu Fuss und mit T-Casual.",
  printLead:
    "**Barcelona in 4 Tagen** ohne Auto: **Flug** BCN, **Metro**, **Sagrada** & **Park Güell** mit Ticket, **Gòtic**, **Born** und **Barceloneta**. Tipps zu **ÖPNV**, **Essen** und **Fallen**.",
  affiliateDestination: "Barcelona, Spain",
} as const;

export const BARCELONA_SECTIONS: ReportSection[] = [
  {
    id: "ankunft",
    kicker: "Tag 1 · Ankommen",
    title: "Flughafen rein, Rambla meiden",
    photo: barcelonaPhotoUrl.gothic,
    photoAlt: barcelonaPhotoAlt.gothic,
    photoCaption: "Barri Gòtic · Pont del Bisbe",
    inlinePhoto: barcelonaPhotoUrl.cathedral,
    inlinePhotoAlt: barcelonaPhotoAlt.cathedral,
    inlinePhotoCaption: "Kathedrale · Pla de la Seu",
    printParagraph:
      "**Metro L9** vom Flughafen, Check-in **El Born** – **Gòtic** früh, nicht die **Rambla** als Quartier.",
    paragraphs: [
      "Wir landen auf **BCN El Prat**, nehmen die **Metro L9 Sud** Richtung Zentrum und checken im **El Born** ein – zwanzig Minuten zu Fuss vom **Barri Gòtic**, ohne Autolärm.",
      "Die **Rambla** ist zum Durchqueren okay, nicht zum Wohnen: laut, teuer, Taschendiebe. Besser: **Born**, **Eixample** oder **Gràcia** als feste Basis für vier Tage.",
      "Am ersten Nachmittag: **Kathedrale** und **Plaça del Rei** – noch ohne Ticket-Stress. Wer Hunger hat: **Santa Caterina** statt **Boquería** – gleicher Markt-Charme, weniger Gedränge.",
    ],
    story:
      "Beim ersten Mal haben wir an der Rambla übernachtet – falsch. Beim zweiten Mal Born: abends **El Xampanyet**, Cava an der Theke, kein Menü in acht Sprachen. Da wussten wir: Barcelona funktioniert ohne Auto.",
    tips: [
      {
        title: "Transfer",
        body: "Metro L9 oder Aerobús · mit Gepäck auch Taxi, Uber oder Cabify.",
      },
      {
        title: "Quartier",
        body: "El Born, Eixample (nahe Diagonal) oder Gràcia – eine Basis, kein Hotelwechsel.",
      },
      {
        title: "Gepäck",
        body: "Rollkoffer in engen Gassen nervt – Rucksack oder Hotel nahe Metro L4 Jaume I.",
      },
    ],
  },
  {
    id: "sagrada",
    kicker: "Tag 2 · Vormittag",
    title: "Sagrada Família – nur mit Slot",
    photo: barcelonaPhotoUrl.sagradaSunset,
    photoAlt: barcelonaPhotoAlt.sagradaSunset,
    photoCaption: "Sagrada Família · Abendlicht",
    printParagraph:
      "**Sagrada Família** nur mit Online-Ticket – erster oder letzter Slot, Turm optional.",
    paragraphs: [
      "**Gaudís Basilika** ohne Vorab-Buchung ist 2026 praktisch unmöglich. Wir buchen Wochen vorher den **ersten Slot** – Licht durch die Fenster, weniger Menschenmassen.",
      "Innen wirkt die Säulenwald-Architektur anders als jede Fotos – mindestens **90 Minuten** einplanen. Turm optional; für den ersten Besuch reicht das Schiff.",
      "Danach zu Fuss oder Metro zwei Stationen zum **Passeig de Gràcia** – Mittag in **Eixample**, nicht zurück ins Hotel.",
    ],
    story:
      "Ohne Ticket standen wir einmal vor verschlossener Tür – seitdem buchen wir vor der Flugbuchung. Der Moment, als das Licht durch die bunten Scheiben fiel, war der Grund für die ganze Reise.",
    tips: [
      {
        title: "Tickets",
        body: "Nur offizielle Seite – Wochen vorher buchen.",
        href: BARCELONA_OFFICIAL_LINKS.sagradaTickets,
        linkLabel: "Sagrada Família · Tickets buchen",
      },
      {
        title: "Timing",
        body: "Erste oder letzte Tageszeit – mittags ist es am vollsten.",
      },
    ],
  },
  {
    id: "modernisme",
    kicker: "Tag 2 · Nachmittag",
    title: "Passeig de Gràcia – Fassaden statt Warteschlange",
    photo: barcelonaPhotoUrl.batllo,
    photoAlt: barcelonaPhotoAlt.batllo,
    photoCaption: "Casa Batlló · Passeig de Gràcia",
    inlinePhoto: barcelonaPhotoUrl.pedrera,
    inlinePhotoAlt: barcelonaPhotoAlt.pedrera,
    inlinePhotoCaption: "La Pedrera · Casa Milà",
    printParagraph:
      "**Casa Batlló** & **La Pedrera** am **Passeig de Gràcia** – aussen oft genug, innen nur mit Zeitfenster.",
    paragraphs: [
      "Der **Passeig de Gràcia** ist Gaudís Laufsteg: **Casa Batlló** mit der Knochenfassade, **La Pedrera** mit dem Wellendach. Wir haben oft nur **aussen** gestanden – für Fotos und ersten Eindruck reicht das.",
      "Innen lohnt sich **eines** der Häuser – nicht beide am gleichen Nachmittag. Ticket online, sonst Schlange.",
      "Wer noch Kraft hat: **Casa Milà** bei Dämmerung, wenn die Fassade beleuchtet wird – ohne Eintritt vom gegenüberliegenden Bürgersteig.",
    ],
    story:
      "La Pedrera innen war schön – aber zwei Häuser am selben Tag war zu viel Modernisme. Beim nächsten Mal: ein Haus innen, eines nur von aussen, danach Bier in Gràcia.",
    tips: [
      {
        title: "Casa Batlló",
        href: BARCELONA_OFFICIAL_LINKS.casaBatlloTickets,
        linkLabel: "Tickets Casa Batlló",
        body: "Zeitfenster online – aussen oft schon beeindruckend genug.",
      },
      {
        title: "La Pedrera",
        href: BARCELONA_OFFICIAL_LINKS.laPedreraTickets,
        linkLabel: "Tickets La Pedrera",
        body: "Dachterrasse ikonisch – nur eines der beiden Häuser am gleichen Tag.",
      },
    ],
  },
  {
    id: "park-guell",
    kicker: "Tag 3 · Morgen",
    title: "Park Güell – Mosaikbank vor den Bussen",
    photo: barcelonaPhotoUrl.parkGuell,
    photoAlt: barcelonaPhotoAlt.parkGuell,
    photoCaption: "Park Güell · Eingangspavillons",
    inlinePhoto: barcelonaPhotoUrl.parkGuellBench,
    inlinePhotoAlt: barcelonaPhotoAlt.parkGuellBench,
    inlinePhotoCaption: "Mosaikbank · Blick über die Stadt",
    printParagraph:
      "**Park Güell** im ersten Slot – **Mosaikbank** & Drachen, danach **Gràcia** zum Mittag.",
    paragraphs: [
      "Der **Park Güell** ist morgens noch erträglich – ab elf kommen die Reisebusse. **Erster Slot**, Kamera bereit, dann **runter nach Gràcia**.",
      "Die **Mosaikbank** mit Blick über die Stadt ist kleiner als auf Fotos – trotzdem Pflicht. Drumherum: freier Park zum Spazieren.",
      "Mittag auf dem **Plaça del Sol** oder in einer Nebengasse – **kein** Zurück ins Zentrum mittags.",
    ],
    story:
      "Um zehn war die Bank schon voll – um acht hatten wir sie fast für uns. Danach Churros in einer Gràcia-Granja: Barcelona fühlt sich plötzlich nach Urlaub an, nicht nach Pflichtprogramm.",
    tips: [
      {
        title: "Tickets",
        href: BARCELONA_OFFICIAL_LINKS.parkGuellTickets,
        linkLabel: "Park Güell · Tickets buchen",
        body: "Besuchte Zone ticketpflichtig – ersten Slot online sichern.",
      },
    ],
  },
  {
    id: "montjuic",
    kicker: "Tag 3 · Optional",
    title: "Montjuïc – wenn die Beine noch wollen",
    photo: barcelonaPhotoUrl.montjuic,
    photoAlt: barcelonaPhotoAlt.montjuic,
    photoCaption: "Montjuïc · Blick über Barcelona",
    printParagraph:
      "Optional **Montjuïc**: **Miró**, Seilbahn, **Magic Fountain** abends – Regen-Plan B.",
    paragraphs: [
      "**Montjuïc** ist der Regen- und Aussichts-Block: **Fundació Joan Miró**, **Olympiastadion**, **Castell** oben. Seilbahn hoch, Bus runter – kein Auto nötig.",
      "Abends im Sommer: **Magic Fountain** (Zeiten prüfen) – kostenlos, voll, aber stimmungsvoll.",
      "Wer müde ist: Tag 3 nur Park Güell + Gràcia reicht. Montjuïc nicht erzwingen.",
    ],
    story:
      "Bei Regen sind wir direkt ins Miró – trocken, kurzweilig, und als es aufklarte, von oben die ganze Stadt gesehen. Ohne Montjuïc wäre uns der Überblick gefehlt.",
  },
  {
    id: "strand",
    kicker: "Tag 4 · Abschluss",
    title: "Picasso morgens, Barceloneta nachmittags",
    photo: barcelonaPhotoUrl.barceloneta,
    photoAlt: barcelonaPhotoAlt.barceloneta,
    photoCaption: "Barceloneta · Mittelmeer",
    inlinePhoto: barcelonaPhotoUrl.born,
    inlinePhotoAlt: barcelonaPhotoAlt.born,
    inlinePhotoCaption: "El Born · Santa Maria del Mar",
    printParagraph:
      "**Museu Picasso** früh, **Barceloneta** zum Abschied – Gepäck-Puffer vor Abflug.",
    paragraphs: [
      "Letzter Tag: **Museu Picasso** im **El Born** – online Ticket, **90 Minuten** reichen für die Highlights.",
      "Snacks auf dem Weg: **Boquería** nur wenn früh – sonst **Granja Dulcinea** für Churros.",
      "**Barceloneta**: Handtuch, Meer, Hafenpromenade. Essen **eine Gasse landeinwärts** – **Cal Pep** mit Reservierung oder spontan an der Theke, wenn Platz ist.",
    ],
    story:
      "Am Abflugtag haben wir einmal zu lang am Strand gelegen – seitdem Picasso morgens, Strand mittags, Flughafen mit zwei Stunden Puffer. Besser entspannt als Sprint mit Koffer.",
    tips: [
      {
        title: "Picasso",
        href: BARCELONA_OFFICIAL_LINKS.picassoTickets,
        linkLabel: "Tickets Museu Picasso",
        body: "Online vorab – sonst Ausverkauf, besonders Wochenende.",
      },
    ],
  },
  {
    id: "essen",
    kicker: "Überall",
    title: "Tapas, Markt, kein Rambla-Menü",
    photo: barcelonaPhotoUrl.tapas,
    photoAlt: barcelonaPhotoAlt.tapas,
    photoCaption: "Tapas · Pan con Tomate",
    inlinePhoto: barcelonaPhotoUrl.boqueria,
    inlinePhotoAlt: barcelonaPhotoAlt.boqueria,
    inlinePhotoCaption: "Markt-Stimmung · Süsses & Stände",
    printParagraph:
      "**El Xampanyet**, **Cal Pep**, **Santa Caterina** – Tapas abseits der Rambla-Preise.",
    paragraphs: [
      "An der **Rambla** zahlt man die Aussicht. Zwei Gassen weiter in **Born** oder **Gràcia**: **El Xampanyet** (Cava & Tapas), **Cal Pep** (Fisch an der Theke).",
      "**Mercat de Santa Caterina** ist unsere Boquería-Alternative – buntes Dach, Locals, weniger Selfie-Stöcke.",
      "**Granja Dulcinea** für Churros nach Park Güell – süßer Gegenpol zum Salzen.",
    ],
    story:
      "Ein Kellner an der Rambla wollte uns Paella um halb vier verkaufen – wir sind nach Born gelaufen und hatten an der Theke die beste Gambas der Woche.",
  },
  {
    id: "fallen",
    kicker: "Praxis",
    title: "Typische Fallen – und wie wir sie umgehen",
    photo: barcelonaPhotoUrl.cityView,
    photoAlt: barcelonaPhotoAlt.cityView,
    photoCaption: "Barcelona · Blick zum Meer",
    paragraphs: [
      "**Mietauto** in der Stadt: Parken teuer, Einbahnstraßen, Zonen – für vier Tage **Metro** schlägt jedes Auto.",
      "**Taschendiebe** in Metro L3 und an Boquería: Rucksack vorne, kein Handy in der hinteren Tasche.",
      "**Sagrada ohne Ticket** anreisen: verschwendeter Morgen. **Park Güell** ohne Slot: gleiches Spiel.",
      "**Restaurant mit Fotomenü** an der Rambla: weitergehen. Gute Küche braucht das nicht.",
      "**Liege am Strand** mieten: teuer – Handtuch reicht, Schatten unter der Promenade.",
    ],
    story:
      "Metro-Tasche auf – einmal haben wir es knapp überstanden. Seitdem: nichts Wertvolles in der hinteren Hosentasche, besonders zwischen Catalunya und Barceloneta.",
  },
];

export const BARCELONA_MUST_SEE = [
  "Sagrada Família – Online-Zeitfenster",
  "Park Güell – erster Slot morgens",
  "Barri Gòtic & Kathedrale",
  "Passeig de Gràcia · Casa Batlló & La Pedrera",
  "Museu Picasso · El Born",
  "Barceloneta & Hafenpromenade",
  "Mercat de la Boquería oder Santa Caterina",
  "Gràcia · Plaça del Sol abends",
];

export const BARCELONA_HERO_PHOTO = barcelonaPhotoUrl.hero;
export const BARCELONA_HERO_PHOTO_ALT = barcelonaPhotoAlt.hero;

export const BARCELONA_HOTEL_TIPS = {
  intro:
    "Eine Basis in El Born, Eixample oder Gràcia – vier Tage ohne Umzug. Nicht direkt an der Rambla: zu Fuss und mit Metro reicht, der Koffer bleibt liegen.",
} as const;

export type BarcelonaHotelPick = {
  id: string;
  name: string;
  stars: string;
  area: string;
  note: string;
  audience?: string;
  tier: "standard" | "luxury" | "budget";
  hotelsComPath?: string;
};

export const BARCELONA_HOTEL_PICKS: BarcelonaHotelPick[] = [
  {
    id: "born-area",
    name: "Hotels im El Born",
    stars: "3–4*",
    area: "El Born",
    tier: "standard",
    audience: "Unser Favorit",
    note: "Ruhig, zentral, zu Fuss zum Gòtic und Picasso – Metro L4.",
  },
  {
    id: "eixample",
    name: "Hotels Eixample",
    stars: "3–4*",
    area: "Eixample",
    tier: "standard",
    audience: "Für Modernisme",
    note: "Nahe Sagrada & Passeig de Gràcia – gerade Gassen, gute Metro.",
  },
  {
    id: "gracia",
    name: "Hotels Gràcia",
    stars: "3*",
    area: "Gràcia",
    tier: "standard",
    audience: "Für ruhige Abende",
    note: "Dorfflair in der Grossstadt – etwas weiter, aber authentisch.",
  },
  {
    id: "luxury-eixample",
    name: "Majestic Hotel & Spa",
    stars: "5*",
    area: "Passeig de Gràcia",
    tier: "luxury",
    audience: "Besonderer Anlass",
    note: "Klassiker am Passeig – teuer, ikonische Lage.",
    hotelsComPath: "/ho153792/majestic-hotel-spa-barcelona-spain/",
  },
  {
    id: "budget-ramblas-area",
    name: "Hostels & Pensionen",
    stars: "1–2*",
    area: "Raval / nahe Metro",
    tier: "budget",
    audience: "Budget",
    note: "Nicht direkt Rambla – aber Metro-Nähe prüfen.",
  },
];

export { BARCELONA_POI_PHOTOS };

const BARCELONA_HOTEL_NIGHTS = 3;
const BARCELONA_HOTEL_TRAVELERS = 2;
const BARCELONA_HOTEL_DAYS_AHEAD = 14;

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildBarcelonaHotelSearchWindow(): { checkIn: string; checkOut: string } {
  const checkIn = new Date();
  checkIn.setHours(12, 0, 0, 0);
  checkIn.setDate(checkIn.getDate() + BARCELONA_HOTEL_DAYS_AHEAD);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + BARCELONA_HOTEL_NIGHTS);
  return { checkIn: toIsoDate(checkIn), checkOut: toIsoDate(checkOut) };
}

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.`;
}

export function formatBarcelonaHotelWindowLabel(): string {
  const { checkIn, checkOut } = buildBarcelonaHotelSearchWindow();
  return `${formatShortDate(checkIn)}–${formatShortDate(checkOut)} · ${BARCELONA_HOTEL_NIGHTS} Nächte · ${BARCELONA_HOTEL_TRAVELERS} Personen`;
}

export function buildBarcelonaHotelPickLink(pick: BarcelonaHotelPick): string {
  const { checkIn, checkOut } = buildBarcelonaHotelSearchWindow();
  const destination =
    pick.id === "born-area"
      ? "El Born, Barcelona, Spain"
      : pick.id === "gracia"
        ? "Gracia, Barcelona, Spain"
        : pick.id === "eixample"
          ? "Eixample, Barcelona, Spain"
          : pick.id === "budget-ramblas-area"
            ? "El Raval, Barcelona, Spain"
            : pick.id === "luxury-eixample"
              ? "Majestic Hotel Spa Barcelona"
              : `${pick.name}, Barcelona, Spain`;
  return buildBookingHotelLink({
    checkIn,
    checkOut,
    travelers: BARCELONA_HOTEL_TRAVELERS,
    rooms: 1,
    clickRef: `barcelona-hotel-${pick.id}`,
    destination,
  });
}
