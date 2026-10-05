import { buildBookingHotelLink } from "@/lib/affiliateLinks";
import { inspirationPhoto } from "@/lib/inspirationDestinations";
import type { TravelReportAppleMapPoi } from "@/components/TravelReportApplePoiLeafletMap";
import type {
  LightboxSlide,
  ReportSection,
  TravelReportConfig,
} from "@/lib/travelReports/types";
import {
  buildProvencePlanerUrl,
  getProvencePlanerHotelSeed,
  PROVENCE_PLANER_HINT,
} from "@/lib/travelReports/provencePlaner";
import { applyAppleCopy } from "@/lib/travelReports/appleCopy";
import { PROVENCE_APPLE_EN } from "@/lib/travelReports/provenceApple.en";
import { PROVENCE_APPLE_ES } from "@/lib/travelReports/provenceApple.es";
import { pickLocaleCopy } from "@/lib/localeCopy";

const OFFICIAL = {
  region: "https://provence-alpes-cotedazur.com/",
  avignon: "https://avignon-tourisme.com/",
  luberon: "https://www.destinationluberon.com/",
  aix: "https://www.aixenprovencetourism.com/",
  verdon: "https://www.parcduverdon.fr/",
} as const;

const PHOTO = {
  hero: inspirationPhoto("1499002238440-d264edd596ec", 2000),
  avignon: inspirationPhoto("1654298900117-57d82e6471a0", 1600),
  gordes: inspirationPhoto("1673423050661-134515109330", 1600),
  roussillon: inspirationPhoto("1600762849691-4b51bc94009c", 1600),
  aix: inspirationPhoto("1604200657090-ae45994b2451", 1600),
  verdon: inspirationPhoto("1726216831313-766f021650c0", 1600),
} as const;

export const PROVENCE_MAP_POIS: readonly TravelReportAppleMapPoi[] = [
  {
    id: "avignon",
    name: "Avignon",
    lat: 43.9493,
    lng: 4.8055,
    kind: "must",
    day: 1,
    tip: "Papstpalast und Altstadt früh oder am späten Nachmittag.",
  },
  {
    id: "gordes",
    name: "Gordes",
    lat: 43.911,
    lng: 5.2009,
    kind: "must",
    day: 2,
    tip: "Aussicht vor dem Ort, dann zu Fuss durch die Gassen.",
  },
  {
    id: "roussillon",
    name: "Roussillon",
    lat: 43.902,
    lng: 5.2931,
    kind: "must",
    day: 3,
    tip: "Ockerweg mit festen Schuhen; Kleidung kann staubig werden.",
  },
  {
    id: "lourmarin",
    name: "Lourmarin",
    lat: 43.7637,
    lng: 5.3626,
    kind: "nice",
    day: 3,
    tip: "Ruhiger Dorfstopp südlich des Luberon.",
  },
  {
    id: "goult",
    name: "Goult",
    lat: 43.8639,
    lng: 5.2437,
    kind: "nice",
    day: 2,
    tip: "Kleinerer Luberon-Stopp zwischen Gordes und Roussillon.",
  },
  {
    id: "saignon",
    name: "Saignon",
    lat: 43.8631,
    lng: 5.4281,
    kind: "nice",
    day: 3,
    tip: "Dorf und Aussichtsfelsen nahe Apt; nur bei Zeit ergänzen.",
  },
  {
    id: "aix",
    name: "Aix-en-Provence",
    lat: 43.5297,
    lng: 5.4474,
    kind: "must",
    day: 4,
    tip: "Altstadt zu Fuss; Auto ausserhalb des Zentrums lassen.",
  },
  {
    id: "valensole",
    name: "Valensole",
    lat: 43.8375,
    lng: 5.9833,
    kind: "nice",
    day: 5,
    tip: "Lavendel nur saisonal; Felder nicht betreten.",
  },
  {
    id: "moustiers",
    name: "Moustiers-Sainte-Marie",
    lat: 43.8463,
    lng: 6.2219,
    kind: "must",
    day: 5,
    tip: "Letzte Basis vor der Verdonschlucht.",
  },
  {
    id: "verdon",
    name: "Pont du Galetas",
    lat: 43.8036,
    lng: 6.2497,
    kind: "must",
    day: 6,
    tip: "Wasserstand, Wind und lokale Hinweise vor Aktivitäten prüfen.",
  },
] as const;

const GALLERY: readonly LightboxSlide[] = [
  { src: PHOTO.avignon, alt: "Papstpalast in Avignon", caption: "Avignon · Papstpalast" },
  { src: PHOTO.gordes, alt: "Bergdorf Gordes im Luberon", caption: "Gordes · Luberon" },
  { src: PHOTO.roussillon, alt: "Ockerfarbene Häuser in Roussillon", caption: "Roussillon" },
  { src: PHOTO.aix, alt: "Markt in Aix-en-Provence", caption: "Aix-en-Provence · Markt" },
  { src: PHOTO.verdon, alt: "Verdonschlucht mit türkisfarbenem Fluss", caption: "Gorges du Verdon" },
] as const;

const SECTIONS: readonly ReportSection[] = [
  {
    id: "avignon",
    kicker: "Tag 1 · Avignon",
    title: "Ankommen hinter der Stadtmauer",
    photo: PHOTO.avignon,
    photoAlt: "Papstpalast in Avignon",
    photoCaption: "Avignon · Papstpalast",
    printParagraph:
      "**Avignon** ist der kompakte Auftakt: Papstpalast, Altstadt und eine erste Nacht ohne lange Weiterfahrt.",
    paragraphs: [
      "**Avignon** bündelt Geschichte und kurze Wege. Das Auto bleibt möglichst beim Hotel oder in einem Parkhaus ausserhalb der engsten Altstadt; Papstpalast, Plätze und Rhône-Ufer lassen sich zu Fuss verbinden.",
      "Für einen einzigen Tag gilt: nicht jede Ausstellung mitnehmen. Ein Hauptbesuch, ein langsamer Rundgang und ein Abendplatz reichen als Auftakt.",
    ],
    story:
      "Diese Route ist von uns kuratiert, nicht als persönliche Vor-Ort-Erfahrung ausgegeben. Öffnungszeiten und Zufahrten prüfen wir deshalb immer nochmals direkt bei den offiziellen Stellen.",
    tips: [
      {
        title: "Offizielle Informationen",
        body: "Zeiten, Tickets und aktuelle Hinweise.",
        href: OFFICIAL.avignon,
        linkLabel: "Avignon Tourisme",
      },
    ],
  },
  {
    id: "luberon",
    kicker: "Tag 2 · Luberon",
    title: "Gordes als Basis, nicht als Fotostopp",
    photo: PHOTO.gordes,
    photoAlt: "Bergdorf Gordes im Luberon",
    photoCaption: "Gordes · zwei Nächte als ruhige Basis",
    printParagraph:
      "**Gordes** dient zwei Nächte als Basis. Abends wird es ruhiger; tagsüber liegen Kloster, Märkte und Dörfer nah.",
    paragraphs: [
      "Der Luberon funktioniert besser mit einer festen Basis als mit täglichem Kofferwechsel. **Gordes** ist prominent und entsprechend besucht; wer früh startet und am Abend bleibt, erlebt den Ort ruhiger.",
      "Für die zweite Tageshälfte nur einen Zusatz wählen: Abbaye de Sénanque, Bonnieux oder Lacoste. Zu viele Dörfer machen aus der Landschaft eine Checkliste.",
    ],
  },
  {
    id: "ocker",
    kicker: "Tag 3 · Roussillon & Lourmarin",
    title: "Ocker am Morgen, Dorfplatz am Abend",
    photo: PHOTO.roussillon,
    photoAlt: "Ockerfarbene Häuser in Roussillon",
    photoCaption: "Roussillon · Ocker im Dorf",
    printParagraph:
      "**Roussillon** früh, danach höchstens ein weiteres Dorf. Ockerstaub, Hitze und Parkplatzsuche kosten mehr Zeit als die Karte zeigt.",
    paragraphs: [
      "In **Roussillon** steht die Farbe im Vordergrund: Fassaden, Erde und der kurze Ockerweg. Feste Schuhe helfen; helle Kleidung ist wegen des Staubs unpraktisch.",
      "Danach passt **Lourmarin** als Kontrast südlich des Luberon. Die Fahrt soll Teil des Tages sein – nicht bloss die Verbindung zwischen zwei Fotopunkten.",
    ],
  },
  {
    id: "aix",
    kicker: "Tag 4 · Aix-en-Provence",
    title: "Ein Stadttag zwischen Märkten und Schatten",
    photo: PHOTO.aix,
    photoAlt: "Markt in Aix-en-Provence",
    photoCaption: "Aix · Markt und Stadtpause",
    printParagraph:
      "**Aix-en-Provence** ist die urbane Pause: Markt, Altstadt und ein Abend ohne weitere Landstrasse.",
    paragraphs: [
      "In **Aix-en-Provence** bleibt das Auto stehen. Altstadt, Märkte und Plätze liegen nah genug für einen ganzen Tag zu Fuss; im Sommer entscheidet der Schatten über das Tempo.",
      "Cézanne-Orte sind eine mögliche Vertiefung, aber kein Pflichtprogramm. Wer lieber durch Gassen zieht, verliert nichts.",
    ],
    tips: [
      {
        title: "Stadtbesuch planen",
        body: "Aktuelle Märkte, Museen und Mobilität.",
        href: OFFICIAL.aix,
        linkLabel: "Aix Tourismus",
      },
    ],
  },
  {
    id: "ruhige-doerfer",
    kicker: "Geheimtipps · Luberon",
    title: "Goult und Saignon statt noch einer Warteschlange",
    printParagraph:
      "**Goult** und **Saignon** sind ruhige Ergänzungen nahe der Route – jeweils nur einen Ort wählen.",
    paragraphs: [
      "**Goult** liegt zwischen Gordes und Roussillon und wird vom Tourismusbüro als „village caché“ beschrieben. Der kleine Ortskern, der Mühlenweg und der Donnerstagsmarkt sind eine Alternative, wenn die bekannteren Aussichtsdörfer voll werden.",
      "**Saignon** passt eher zur Fahrt Richtung Aix: kurze Gassen, ein Aussichtsfelsen und weniger Pflichtprogramm. Beide Orte sind keine zusätzliche Tagesetappe – einen auswählen, nicht beide abhaken.",
    ],
    tips: [
      {
        title: "Goult offiziell",
        body: "Ort, Markt und aktuelle Hinweise beim Tourismusbüro Pays d’Apt Luberon.",
        href: "https://www.luberon-apt.fr/village-goult",
        linkLabel: "Goult entdecken",
      },
    ],
  },
  {
    id: "markt-genuss",
    kicker: "Geheimtipps · Markt & Essen",
    title: "Den Markttag in die Route einbauen",
    printParagraph:
      "Ein lokaler **Markt** ersetzt einen weiteren Fotostopp. Termine vor der Reise offiziell bestätigen.",
    paragraphs: [
      "Der beste Genuss-Tipp ist kein einzelnes Restaurant, sondern ein passender **Markttag**. In Goult findet der Markt saisonal am Donnerstagvormittag statt; in Aix gibt es mehrere Märkte mit unterschiedlichen Tagen und Schwerpunkten.",
      "Kauft nur, was am selben Tag gegessen werden kann: Brot, Käse, Obst und etwas für das Picknick. Marktzeiten ändern sich saisonal – deshalb kurz vor der Reise bei der Gemeinde oder beim Tourismusbüro prüfen.",
    ],
    tips: [
      {
        title: "Nicht als Geheimtipp verkaufen",
        body: "Lourmarin und Gordes sind bekannt. Ruhiger wird es durch Uhrzeit, Wochentag und einen kleineren Ort – nicht durch ein geheimes Instagram-Motiv.",
      },
    ],
  },
  {
    id: "verdon",
    kicker: "Tag 5–6 · Valensole & Verdon",
    title: "Lavendel ist Saison. Die Schlucht bleibt.",
    photo: PHOTO.verdon,
    photoAlt: "Verdonschlucht mit türkisfarbenem Fluss",
    photoCaption: "Gorges du Verdon · Abschluss mit Wetterreserve",
    printParagraph:
      "**Valensole** ist saisonal; **Moustiers** und der Verdon tragen den Abschluss auch ohne Lavendelblüte.",
    paragraphs: [
      "Das Plateau de **Valensole** ist kein ganzjähriges violettes Versprechen. Ausserhalb der Blüte bleibt es ein Landschaftsstopp; Felder sind Arbeitsflächen und werden nicht für Fotos betreten.",
      "**Moustiers-Sainte-Marie** ist die letzte Basis. Für den Verdon braucht es Wetterreserve: Wind, Hitze, Wasserstand und Strassensituation können den Plan verändern.",
    ],
    tips: [
      {
        title: "Naturpark Verdon",
        body: "Schutz, Zugang und aktuelle Hinweise.",
        href: OFFICIAL.verdon,
        linkLabel: "Parc du Verdon",
      },
    ],
  },
] as const;

function formatWindow(checkIn: string, checkOut: string): string {
  return `${new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit" }).format(new Date(`${checkIn}T12:00:00`))}–${new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${checkOut}T12:00:00`))}`;
}

export function getProvenceTravelReportConfig(locale = "de"): TravelReportConfig {
  const hotel = getProvencePlanerHotelSeed();
  const hotelHref = (destination: string) =>
    buildBookingHotelLink({
      destination,
      checkIn: hotel.checkIn,
      checkOut: hotel.checkOut,
      travelers: 2,
      rooms: 1,
    });

  const config: TravelReportConfig = {
    slug: "provence",
    path: "/reisebericht/provence",
    breadcrumbLabel: "Provence Route",
    layoutVariant: "coastal",
    journeyAxis: {
      title: "Die Route",
      subtitle: "5 Nächte. Vier Basen. Weniger Koffer als Fotostopps.",
      stops: [
        { nights: "1 Nacht", place: "Avignon", note: "Geschichte & Ankommen" },
        { nights: "2 Nächte", place: "Gordes / Luberon", note: "Dörfer & Ocker" },
        { nights: "1 Nacht", place: "Aix-en-Provence", note: "Markt & Altstadt" },
        { nights: "1 Nacht", place: "Moustiers", note: "Valensole & Verdon" },
      ],
      outro: "Die Route ist rund 300 Kilometer lang – die langsamen Tage sind wichtiger als die Distanz.",
    },
    meta: {
      title: "Provence Rundreise: 6 Tage Route, Orte & Hotels",
      description:
        "Provence-Rundreise für 6 Tage: Avignon, Gordes, Roussillon, Aix-en-Provence, Valensole und Verdon. Mit Karte, Hotelbasen, FAQ und Planer-Vorlage.",
      datePublished: "2026-08-08",
      dateModified: "2026-08-08",
    },
    hero: {
      photo: PHOTO.hero,
      photoAlt: "Provence-Landschaft mit Lavendel",
      title: "Provence in 6 Tagen",
      subtitle: "Avignon · Luberon · Aix · Verdon",
      duration: "5 Nächte · Rundreise",
      seoSubtitle: "Route, Karte, Hotelbasen und ehrliche Saisonhinweise",
      experienceNote: "Von SnifferTrek kuratiert · Planungsstand August 2026",
      dateModifiedLabel: "Aktualisiert: August 2026",
    },
    lead:
      "Eine **Provence-Rundreise in 6 Tagen** braucht keine zwölf Dörfer. Unsere Route verbindet **Avignon**, zwei Nächte im **Luberon**, **Aix-en-Provence** und den **Verdon** – mit Hotelbasen statt täglichem Kofferwechsel.",
    printLead:
      "**5 Nächte**: Avignon · Luberon · Aix · Moustiers. Ocker, Märkte und Verdon – mit vier Basen statt täglichem Hotelwechsel.",
    affiliateDisclosure:
      "Hotel-Links können Affiliate-Links sein. Für dich bleibt der Preis gleich; SnifferTrek kann eine Provision erhalten.",
    specialCallout: {
      id: "lavendel-saison",
      title: "Lavendel ist kein Ganzjahresmotiv",
      body:
        "Die Blüte variiert je nach Lage und Wetter. Valensole deshalb als saisonalen Zusatz planen – nicht als Fundament der ganzen Reise.",
      bullets: [
        "Blüte und Ernte kurzfristig prüfen",
        "Felder nicht betreten",
        "Ohne Lavendel direkt mehr Zeit für Moustiers und Verdon lassen",
      ],
      href: OFFICIAL.region,
      linkLabel: "Region Provence",
      variant: "info",
    },
    atAGlance: {
      mustSees: ["Avignon", "Gordes", "Roussillon", "Aix", "Moustiers"],
      quarters: "4 Basen: Avignon · Gordes · Aix · Moustiers",
      transport: "Eigenes Auto oder Mietwagen; Altstädte zu Fuss",
      planHint: "5 Nächte, rund 300 km, Wetterreserve für den Verdon.",
      planerHref: buildProvencePlanerUrl(),
      planAnchorId: "plan-6-tage",
      planAnchorLabel: "6-Tage-Route ansehen",
    },
    freeActivities: [
      { label: "Altstadt Avignon", anchor: "avignon" },
      { label: "Gordes Aussicht", anchor: "luberon" },
      { label: "Aix zu Fuss", anchor: "aix" },
      { label: "Moustiers", anchor: "verdon" },
    ],
    printMap: {
      center: { lat: 43.78, lng: 5.45 },
      zoom: 8,
      mustSees: PROVENCE_MAP_POIS.filter((p) => p.kind === "must")
        .slice(0, 5)
        .map((p, i) => ({ id: `ms-${i + 1}`, label: p.name, lat: p.lat, lng: p.lng })),
      orte: PROVENCE_MAP_POIS.map((p, i) => ({
        id: `o-${String.fromCharCode(97 + i)}`,
        label: p.name,
        lat: p.lat,
        lng: p.lng,
        note: p.day ? `Tag ${p.day}` : undefined,
      })),
    },
    arrival: {
      callout: {
        title: "Anreise ohne unnötige Schleife",
        body:
          "Avignon ist ein guter Start per TGV oder Auto. Bei Flug nach Marseille den Mietwagen erst für die Rundreise übernehmen.",
        bullets: [
          "TGV bis Avignon prüfen",
          "Flug Marseille + Mietwagen ist die Alternative",
          "In Altstädten Parkplatz des Hotels vorab klären",
        ],
        href: OFFICIAL.region,
        linkLabel: "Anreise planen",
        variant: "info",
      },
      parking: {
        id: "parken",
        title: "Parken & Zufahrt",
        intro: "Historische Ortskerne sind kein guter Platz für spontane Parkplatzsuche.",
        items: [
          {
            name: "Avignon",
            description: "Hotelparkplatz oder Parkhaus ausserhalb des engsten Zentrums wählen.",
          },
          {
            name: "Gordes & Roussillon",
            description: "Früh ankommen; ausgeschilderte Parkplätze nutzen.",
          },
          {
            name: "Aix-en-Provence",
            description: "Auto abstellen und den Stadttag zu Fuss planen.",
          },
        ],
        collapsible: true,
      },
      transferTitle: "Auto, TGV oder Flug Marseille",
      transferOptions: [
        {
          title: "Eigenes Auto",
          body: "Flexibel für Luberon und Verdon; lange Anfahrt separat rechnen.",
          price: "Maut + Treibstoff",
        },
        {
          title: "TGV bis Avignon",
          body: "Guter Start ohne Stadtverkehr; Mietwagen ab Avignon möglich.",
          price: "Preis nach Termin",
        },
        {
          title: "Flug Marseille + Mietwagen",
          body: "Praktisch für Aix und Rückreise; Einweggebühren prüfen.",
          price: "Preis nach Termin",
        },
      ],
    },
    toc: [
      { id: "plan-6-tage", label: "6-Tage-Plan" },
      { id: "avignon", label: "Avignon" },
      { id: "luberon", label: "Luberon" },
      { id: "aix", label: "Aix" },
      { id: "verdon", label: "Verdon" },
      { id: "faq", label: "FAQ" },
    ],
    guideCards: {
      title: "Lohnt sich? · vier Entscheidungen",
      cards: [
        {
          id: "papstpalast",
          title: "Papstpalast Avignon",
          verdict: "Ja, wenn Geschichte ein Schwerpunkt ist.",
          price: "Aktuell offiziell prüfen",
          timing: "Erster Zeitslot",
          tip: "Ein Hauptbesuch reicht für Tag 1.",
          href: OFFICIAL.avignon,
          linkLabel: "Offizielle Infos",
        },
        {
          id: "ockerweg",
          title: "Ockerweg Roussillon",
          verdict: "Ja – kurz, farbig und gut kombinierbar.",
          price: "Aktuell vor Ort prüfen",
          timing: "Morgens",
          tip: "Feste Schuhe und unempfindliche Kleidung.",
        },
        {
          id: "valensole",
          title: "Valensole",
          verdict: "Nur saisonal als Pflichtstopp.",
          price: "Landschaft frei zugänglich",
          timing: "Je nach Blüte",
          tip: "Ohne Blüte Zeit nach Moustiers verschieben.",
        },
        {
          id: "goult",
          title: "Goult statt drittem grossen Aussichtsdorf",
          verdict: "Ja, wenn Gordes oder Roussillon zu voll wirken.",
          price: "Ortsrundgang kostenlos",
          timing: "Später Nachmittag oder Donnerstagvormittag",
          tip: "Als Ersatz einplanen, nicht als zusätzlichen Pflichtstopp.",
          href: "https://www.luberon-apt.fr/village-goult",
          linkLabel: "Offizielle Ortsinfo",
        },
      ],
    },
    rainAlternatives: {
      id: "regen",
      title: "Bei Regen",
      intro: "Die Route nicht gegen das Wetter erzwingen.",
      items: [
        {
          name: "Avignon verlängern",
          description: "Museum oder Papstpalast statt Dorf-Hopping.",
        },
        {
          name: "Aix als Puffertag",
          description: "Märkte, Cafés und Museen sind wetterfester.",
        },
        {
          name: "Verdon verschieben",
          description: "Aussicht und Aktivitäten nur bei sicheren Bedingungen.",
        },
      ],
    },
    specialVenueList: {
      id: "landschaft",
      title: "Landschaften & kurze Wege",
      intro: "Wenige, klare Naturstopps statt langer Wunschliste.",
      items: [
        {
          name: "Ockerweg Roussillon",
          description: "Kurzer Landschaftsweg; Hitze und Staub beachten.",
          duration: "ca. 1–2 Std.",
        },
        {
          name: "Valensole",
          description: "Saisonale Felderlandschaft, kein ganzjähriges Lavendelziel.",
          duration: "variabel",
        },
        {
          name: "Verdon",
          description: "Aussicht oder Wasseraktivität nach Wetter und lokalen Regeln.",
          duration: "½–1 Tag",
          href: OFFICIAL.verdon,
          linkLabel: "Naturpark",
        },
      ],
      collapsible: true,
    },
    durationCompare: [
      { days: "4 Tage", summary: "Avignon + Luberon; Verdon weglassen." },
      { days: "6 Tage", summary: "Die ausgewogene Route mit vier Basen." },
      { days: "8 Tage", summary: "Mehr Ruhe im Luberon und ein Verdon-Puffertag." },
    ],
    itinerary: {
      id: "plan-6-tage",
      title: "6 Tage · zum Abhaken",
      subtitle: "5 Nächte, vier Basen",
      days: [
        { day: 1, title: "Avignon", items: ["Anreise", "Altstadt", "1 Nacht"] },
        { day: 2, title: "Gordes", items: ["Luberon", "Aussicht", "Goult optional"] },
        { day: 3, title: "Roussillon", items: ["Ockerweg", "Saignon oder Lourmarin", "2. Nacht"] },
        { day: 4, title: "Aix", items: ["Altstadt", "Markt prüfen", "1 Nacht"] },
        { day: 5, title: "Moustiers", items: ["Valensole saisonal", "Dorf", "1 Nacht"] },
        { day: 6, title: "Verdon", items: ["Wetter prüfen", "Aussicht oder Wasser", "Abreise"] },
      ],
    },
    sections: SECTIONS,
    printStoryIds: ["avignon", "luberon", "ocker", "aix", "verdon"],
    favoriteSpots: [
      { id: "gordes", name: "Gordes am Abend", type: "Dorf", note: "Nach den Tagesgästen" },
      { id: "roussillon", name: "Roussillon", type: "Landschaft", note: "Ocker am Morgen" },
      { id: "goult", name: "Goult", type: "Ruhiger Stopp", note: "Markt am Donnerstag" },
      { id: "saignon", name: "Saignon", type: "Aussicht", note: "Nur bei Zeit" },
      { id: "moustiers", name: "Moustiers", type: "Basis", note: "Vor dem Verdon" },
    ],
    lightboxGallery: GALLERY,
    galleryIndexForSrc: (src) => Math.max(0, GALLERY.findIndex((slide) => slide.src === src)),
    poiCards: {
      title: "Highlights · die fünf Kerntage",
      subtitle: "Avignon, Luberon, Roussillon, Aix und Verdon.",
      pois: GALLERY.map((slide, i) => ({
        id: `provence-${i + 1}`,
        caption: slide.caption || slide.alt,
        photo: slide.src,
        alt: slide.alt,
        tip: [
          "Ein Hauptbesuch, danach Altstadt.",
          "Zwei Nächte als Basis einplanen.",
          "Früh starten und Ockerstaub einkalkulieren.",
          "Auto stehen lassen.",
          "Wetterreserve behalten.",
        ][i],
      })),
    },
    mustSees: {
      heading: "Must-sees · Provence in 6 Tagen",
      items: ["Avignon", "Gordes", "Roussillon", "Aix-en-Provence", "Moustiers & Verdon"],
      itemListName: "Must-sees Provence",
    },
    seasonRows: [
      { season: "Frühling", months: "Apr–Mai", temp: "mild", crowd: "mittel", note: "Gute Rundreisezeit; Lavendel meist noch nicht in Blüte." },
      { season: "Frühsommer", months: "Jun–Jul", temp: "warm–heiss", crowd: "hoch", note: "Lavendel möglich; Blüte und Ernte variieren." },
      { season: "Spätsommer", months: "Aug", temp: "heiss", crowd: "hoch", note: "Hitze- und Waldbrandhinweise beachten." },
      { season: "Herbst", months: "Sep–Okt", temp: "mild", crowd: "tiefer", note: "Ruhiger, aber kürzere Tage und wechselnderes Wetter." },
    ],
    tours: { title: "Geführte Angebote", items: [] },
    budget: {
      title: "Budget · 5 Nächte",
      priceStandLabel: "Preise variieren nach Saison · Stand August 2026",
      lines: [
        { label: "Hotels", price: "stark saisonabhängig", note: "4 Basen" },
        { label: "Auto", price: "Miete/Maut/Treibstoff", note: "nach Anreise" },
        { label: "Eintritte", price: "nach Auswahl", note: "offiziell prüfen" },
        { label: "Essen", price: "individuell", note: "Märkte + Restaurants" },
      ],
    },
    events: [
      { name: "Festival d’Avignon", when: "meist Juli", note: "Stadt sehr belebt; Daten und Hotels früh prüfen." },
      { name: "Lavendelblüte", when: "witterungsabhängig", note: "Kein fixes Event und keine garantierten Wochen." },
    ],
    faq: {
      title: "Häufige Fragen zur Provence-Rundreise",
      items: [
        {
          question: "Wie viele Tage braucht man für die Provence?",
          answer: "Für Avignon, Luberon, Aix und Verdon sind sechs Tage ein guter Einstieg. Mit vier Tagen sollte der Verdon entfallen; mit acht Tagen wird die Route deutlich ruhiger.",
        },
        {
          question: "Braucht man in der Provence ein Auto?",
          answer: "Für diese Rundreise ja. Avignon und Aix sind per Bahn erreichbar, Dörfer im Luberon und der Verdon lassen sich mit dem Auto aber wesentlich sinnvoller verbinden.",
        },
        {
          question: "Wann blüht der Lavendel?",
          answer: "Das hängt von Höhenlage, Wetter und Ernte ab. Statt fixer Versprechen kurz vor der Reise regionale Hinweise prüfen und Valensole nur als saisonalen Zusatz behandeln.",
          href: OFFICIAL.region,
          linkLabel: "Regionale Hinweise",
        },
        {
          question: "Wo sollte man übernachten?",
          answer: "Auf dieser Route je eine Nacht in Avignon und Aix, zwei Nächte im Luberon rund um Gordes sowie eine Nacht in Moustiers-Sainte-Marie.",
        },
        {
          question: "Ist die Route mit Kindern geeignet?",
          answer: "Grundsätzlich ja, wenn Tagesdistanzen kurz bleiben. Bei Ockerwegen, Hitze und Aktivitäten im Verdon Alter, Wetter und lokale Sicherheitsregeln berücksichtigen.",
        },
      ],
    },
    relatedLinks: [
      {
        href: "/reisebericht/cote-dazur",
        label: "Côte d’Azur",
        description: "Die passende Küstenroute vor der Provence.",
      },
      {
        href: "/reisebericht/grandes-alpes",
        label: "Route des Grandes Alpes",
        description: "Von Genf über die Pässe nach Cannes – wenn die Anreise aus den Alpen kommt.",
      },
      {
        href: "/inspiration/provence",
        label: "Provence Inspiration",
        description: "Orte und Bilder für die erste Auswahl.",
      },
      {
        href: buildProvencePlanerUrl(),
        label: "Provence im Planer",
        description: "Route und Hotelstopps direkt vorausfüllen.",
      },
    ],
    hotels: {
      destinationLabel: "Provence",
      intro: "Vier Basen reduzieren Rückfahrten und tägliches Kofferpacken.",
      searchLabel: `Hotels suchen · ${formatWindow(hotel.checkIn, hotel.checkOut)}`,
      clickRef: "provence-report",
      affiliateDestination: "Provence, France",
      checkIn: hotel.checkIn,
      checkOut: hotel.checkOut,
      picks: [
        {
          id: "avignon",
          name: "Avignon Altstadt",
          stars: "Basis 1",
          area: "Avignon",
          note: "Für den kompakten Auftakt.",
          audience: "Geschichte & TGV-Anreise",
          tier: "standard",
          href: hotelHref("Avignon, France"),
        },
        {
          id: "luberon",
          name: "Gordes / Luberon",
          stars: "Basis 2",
          area: "Gordes",
          note: "Zwei Nächte für Dörfer und Ocker.",
          audience: "Rundreise mit Auto",
          tier: "luxury",
          href: hotelHref("Gordes, France"),
        },
        {
          id: "aix",
          name: "Aix-en-Provence",
          stars: "Basis 3",
          area: "Aix",
          note: "Ein Stadtabend ohne Weiterfahrt.",
          audience: "Markt & Altstadt",
          tier: "standard",
          href: hotelHref("Aix-en-Provence, France"),
        },
        {
          id: "moustiers",
          name: "Moustiers-Sainte-Marie",
          stars: "Basis 4",
          area: "Verdon",
          note: "Für einen frühen Start am Verdon.",
          audience: "Natur & Wetterreserve",
          tier: "budget",
          href: hotelHref("Moustiers-Sainte-Marie, France"),
        },
      ],
    },
    generalInfo: {
      title: "Praktische Informationen",
      sections: [
        {
          heading: "Distanzen",
          body: "Die gesamte Route ist überschaubar, aber Dorfzufahrten und Parkplatzsuche verlängern Fahrzeiten. Nicht mehr als zwei Hauptstopps pro Tag planen.",
        },
        {
          heading: "Sommer",
          body: "Hitze, Waldbrandgefahr und lokale Sperrungen ernst nehmen. Offizielle Hinweise am Reisetag prüfen.",
        },
        {
          heading: "Märkte",
          body: "Markttage ändern den Rhythmus und die Parkplatzsituation. Termine kurz vor der Reise über die lokalen Tourismusstellen bestätigen.",
        },
      ],
    },
    closing:
      "Die Provence gewinnt nicht durch möglichst viele Dörfer. Mit vier Basen bleibt Zeit für Ockerstaub, einen langen Markt und einen Verdon-Tag, der bei schlechtem Wetter auch ausfallen darf.",
    planer: {
      href: buildProvencePlanerUrl(),
      ctaLabel: "Provence-Route im Planer anlegen",
      hint: PROVENCE_PLANER_HINT,
    },
    jsonLdAbout: {
      "@type": "Place",
      name: "Provence",
      containedInPlace: { "@type": "Country", name: "France" },
    },
  };
  const copy = pickLocaleCopy(locale, { en: PROVENCE_APPLE_EN, es: PROVENCE_APPLE_ES });
  return copy ? applyAppleCopy(config, copy) : config;
}
