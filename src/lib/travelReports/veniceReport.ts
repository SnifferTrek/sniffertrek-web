import { buildHotelsComLink } from "@/lib/affiliateLinks";
import { COUPLE_PHOTOS } from "@/lib/travelCouple";
import { VENICE_OFFICIAL_LINKS } from "@/lib/travelReports/veniceOfficialLinks";
import { VENICE_POI_PHOTOS, venicePhotoAlt, venicePhotoUrl } from "@/lib/travelReports/venicePhotos";
import { VENICE_META } from "@/lib/travelReports/veniceSeo";
import type { ReportSection, ReportTip } from "@/lib/travelReports/types";

export type { ReportSection, ReportTip };

export const VENICE_REPORT = {
  slug: "venedig",
  title: "Venedig in 3 Tagen",
  subtitle: "Ruhige Gassen · Vaporetto · Lagune",
  seoSubtitle: VENICE_META.seoSubtitle,
  metaDescription: VENICE_META.description,
  duration: "3 Tage · April",
  visitedIn: "April · Frühling",
  lead:
    "Drei Tage ohne Stress: früh **Rialto**, ruhig durch **Cannaregio** und **Dorsoduro**, **Vaporetto** über den Canal Grande – optional **Murano** und **Burano**.",
  /** PDF Seite 1 – max. ~48 Wörter */
  printLead:
    "**Venedig in 3 Tagen** ohne Stress: früh **Rialto**, ruhig durch **Cannaregio** & **Dorsoduro**, **Vaporetto** am Canal Grande – optional **Murano/Burano**. Tipps zu **Tickets**, **Essen** und typischen **Fallen**.",
  affiliateDestination: "Venedig, Italien",
} as const;

export const VENICE_SECTIONS: ReportSection[] = [
 {
 id: "ankunft",
 kicker: "Tag 1 · Ankommen",
 title: "San Marco ist der Einstieg – nicht das Ziel",
 photo: venicePhotoUrl.sanMarco,
 photoAlt: venicePhotoAlt.sanMarco,
 photoCaption: "Piazza San Marco · Markusdom",
  printParagraph:
 "**Markusdom** als Einstieg, dann weg – Quartier **Cannaregio**, erster Spaziergang ohne Karte.",
 paragraphs: [
 "Wer zum ersten Mal in Venedig landet, wird vom **Markusdom** eingefangen. Das ist in Ordnung – solange man am gleichen Tag noch woanders hinfindet.",
 "Wir haben uns in **Cannaregio** niedergelassen: weniger Souvenirstände, normale Lebensmittelläden, echte Trattorien. Vom Bahnhof Santa Lucia sind es zwanzig Minuten zu Fuss – oder ein kurzer **Vaporetto-Hopp**.",
 "Der erste Spaziergang **ohne Karte**: einfach dem Wasser folgen, bis man sich verlaufen fühlt. Dann sitzen. Venedig belohnt **Langsamkeit**.",
 ],
 story:
 "Am Ankunftstag haben wir uns mit dem Rollkoffer eine Brücke zu oft gesucht – seitdem nur noch Rucksack. Abends eine Ombra in einer Gasse ohne englische Karte: da wussten wir, dass Cannaregio stimmt.",
 tips: [
 {
 title: "Quartier",
 body: "Cannaregio, Castello oder Dorsoduro statt direkt am Markusplatz – ruhiger, oft günstiger.",
 image: "/images/venedig-sestieri.svg",
 imageAlt:
 "Karte der sechs Sestieri in Venedig: Cannaregio, Castello, Dorsoduro, San Marco, San Polo und Santa Croce",
 imageCaption: "Sestieri-Karte · grün = unsere Quartier-Tipps · Klick zum Vergrössern",
 },
 {
 title: "Transfer",
 body: "Flughafen: ATVO-Bus oder Alilaguna · Bahn: Santa Lucia · Auto: Parken Tronchetto oder Mestre – Details unter «Anreise & Parken».",
 },
 {
 title: "Gepäck",
 body: "Rucksack schlägt Koffer. Jede Brücke mit Rollkoffer ist eine Erinnerung, die man nicht braucht.",
 },
 ],
 },
 {
 id: "morgen",
 kicker: "Am nächsten Morgen",
 title: "Rialto, bevor die Tagesgruppen kommen",
 photo: venicePhotoUrl.rialtoBridge,
 photoAlt: venicePhotoAlt.rialtoBridge,
 photoCaption: "Rialtobrücke · Canal Grande",
 inlinePhoto: venicePhotoUrl.rialtoMarket,
 inlinePhotoAlt: venicePhotoAlt.rialtoMarket,
 inlinePhotoCaption: "Mercato di Rialto am Morgen",
  printParagraph:
 "**Rialtomarkt** vor neun: Alltag statt Kulisse. Danach Kaffee am Canal Grande Richtung Dorsoduro.",
 paragraphs: [
 "Um **sieben Uhr** gehört der Rialto noch den Marktfrauen. Fisch, Gemüse, kurze Gespräche auf Dialekt – das ist der Moment, in dem Venedig **keine Kulisse** ist.",
 "Der **Mercato di Rialto** ist kein Instagram-Spot, sondern Alltag. Wer nach neun Uhr kommt, sieht vor allem Selfie-Stöcke.",
 "Danach: einen **Kaffee** am Canal Grande **geniessen**, Accademia-Brücke langsam überqueren, in Dorsoduro abbiegen. **Kein Programm, nur Richtung.**",
 ],
 story:
 "Wir sind einmal erst um neun am Rialto gewesen – Fehler. Am zweiten Tag um sieben: gleicher Ort, andere Stadt. Danach Cicchetti bei **All'Arco** – zwei Plätze an der Theke, kein Menu in sechs Sprachen.",
 },
 {
 id: "dogenpalast",
 kicker: "Tag 2 · Vormittag",
 title: "Dogenpalast – Geschichte ohne Schulbuchton",
 photo: venicePhotoUrl.dogePalace,
 photoAlt: venicePhotoAlt.dogePalace,
 photoCaption: "Dogenpalast · Palazzo Ducale",
  printParagraph:
 "**Dogenpalast** nur mit Online-Ticket – Prunksäle, dann weiter, nicht den ganzen Tag San Marco.",
 paragraphs: [
 "Der **Palazzo Ducale** ist überfüllt, wenn man ohne Ticket kommt. **Online vorab buchen** spart eine Stunde Schlange – und die Nerven.",
 "Die **Seufzerbrücke** ist von innen ein kurzer Gang; von aussen meist ein Gedränge. Früher oder gegen Abend wirkt sie kleiner und stiller.",
 "**Tintoretto** in der Scuola Grande di San Rocco ist für uns der Gegenpol zum Massentourismus: weniger Trubel, mehr Bilder, die man sitzen lässt.",
 ],
 story:
 "Ohne Online-Ticket standen wir einmal fast 90 Minuten – seitdem buchen wir den Dogenpalast vor der Abreise. Die Seufzerbrücke von innen war kleiner als erwartet; der Moment in San Rocco dafür umso grösser.",
 tips: [
 {
 title: "Campanile",
 body: "Kein Skip-the-Line – 20–30 Min. vor Öffnung (9 Uhr) anstellen. 360°-Aussicht, ca. 10 €.",
 },
 {
 title: "Tickets",
 body: "Museumspass oder Einzelticket Dogenpalast online – Wochenende im Frühling: unbedingt reservieren.",
 href: VENICE_OFFICIAL_LINKS.dogePalaceTickets,
 linkLabel: "Tickets buchen (MUVE)",
 },
 {
 title: "Timing",
 body: "Erste Einlasswelle oder letzte Stunde vor Schliessung – mittags ist es am vollsten.",
 },
 ],
 },
 {
 id: "vaporetto",
 kicker: "Tag 2",
 title: "Linie 1 ist die günstigste Sightseeing-Tour",
 photo: venicePhotoUrl.vaporetto,
 photoAlt: venicePhotoAlt.vaporetto,
 photoCaption: "Vaporetto · Linie 1, Canal Grande",
  printParagraph:
 "**Linie 1** den Canal Grande hin und zurück: beste günstige «Gondel».",
 paragraphs: [
 "Eine **Tageskarte** lohnt sich fast immer. **Linie 1** fährt den Canal Grande entlang – Markusplatz, Rialto, Accademia, Salute. Hin und zurück, Fenster offen, kein Guide nötig.",
 "Wir sind mittags in **San Tomà** ausgestiegen und zu Fuss zurück: über Campo Santa Margherita, durch Gassen, wo Google Maps aufgibt. Das ist der Teil, den man **nicht buchen** kann.",
 "**Traghetto** über den Canal Grande (Gondola-Fähre, wenige Euro) ist ein Mini-Abenteuer – stehend, schnell, ohne Romantik-Preisschild.",
 ],
 story:
 "Die erste Fahrt Linie 1 haben wir wie eine Rundfahrt genossen – hin und zurück, ohne Ausstieg. Beim Traghetto standen wir neben Einheimischen mit Einkaufstüten: kein Foto, kein Trinkgeld-Drama, einfach rüber.",
 tips: [
 {
 title: "Traghetto",
 body: "Gondola-Fähre über den Canal Grande – ca. 2–5 €, stehend, ohne Romantik-Tarif.",
 },
 {
 title: "Tickets",
 body: "ACTV-Tageskarte oder Rolling Venice (unter 29) – online über Venezia Unica, die AVM-App oder an Landungsbrücken und in Tabacchi.",
 href: VENICE_OFFICIAL_LINKS.actvTickets,
 linkLabel: "Venezia Unica · ÖPNV-Tickets",
 },
 {
 title: "Stoßzeiten",
 body: "Vormittags voller als nach 16 Uhr; erste Fahrt kurz nach Sonnenaufgang ist am leersten.",
 },
 ],
 },
 {
 id: "zwischenstop",
 kicker: "Zwischen den Tagen",
 title: "Pause am Canalrand",
 photo: venicePhotoUrl.canalAlley,
 photoAlt: venicePhotoAlt.canalAlley,
 photoCaption: "Canal Grande · Dorsoduro",
 paragraphs: [
 "Venedig erschöpft nicht durch Laufen, sondern durch **Reize**. Eine Stunde ohne Karte, ohne Liste: **am Rand des Canals** sitzen – auf einer Bank oder direkt auf dem Steg – **von hinten** dem Wasser zugewandt, vorbeiziehen lassen.",
 "Die **Giardini della Biennale** sind im Frühling grün und ruhig – wenn gerade keine Kunstmesse tobt, fast leer. Ideal für einen **halben Tag ohne Programm**.",
 ],
 couplePhoto: COUPLE_PHOTOS.veniceCanalBack,
 couplePhotoAlt:
 "Wir sitzen von hinten am Canalrand in Dorsoduro und schauen über die Lagune Richtung San Marco",
 coupleCaption:
 "Wir am Zattere-Ufer · Canalrand in Dorsoduro, Blick Richtung San Marco – kurz vor Sonnenuntergang",
 },
 {
 id: "inseln",
 kicker: "Tag 3 · Optional",
 title: "Murano und Burano – wenn ihr noch Luft habt",
 photo: venicePhotoUrl.murano,
 photoAlt: venicePhotoAlt.murano,
 photoCaption: "Murano · Glasbläserei",
 inlinePhoto: venicePhotoUrl.burano,
 inlinePhotoAlt: venicePhotoAlt.burano,
 inlinePhotoCaption: "Burano · bunte Fischerhäuser",
  printParagraph:
 "Optional **Murano** & **Burano** – früh ab Fondamente Nove, vor dem Mittagsandrang.",
 paragraphs: [
 "**Murano** lohnt sich mit Termin in einer Glasfabrik – ohne Termin ist es schnell Souvenir-Labyrinth. Wer zusieht, wie Glas geblasen wird, versteht den Preis.",
 "**Burano** ist bunt und fotogen, aber mittags voll. **Früh hin**, Fisch essen, zurück bevor die Nachmittagswellen kommen.",
 "**Torcello** ist die stille Schwester: wenige Besucher, alte Kirche, Lagune weit. Wer nur zwei Inseln schafft: Murano + Burano reicht.",
 ],
 story:
 "Burano um elf Uhr: noch leer genug für Fotos ohne Schlange. Um halb zwei war der Hauptkanal voll – wir waren froh, schon gegessen zu haben. Murano ohne Termin fühlte sich nach Shop an; mit Demo war es einer der besten halben Tage.",
 },
 {
 id: "essen",
 kicker: "Überall",
 title: "Cicchetti statt Touristenmenü",
 photo: venicePhotoUrl.cicchetti,
 photoAlt: venicePhotoAlt.cicchetti,
 photoCaption: "Bacaro · Cicchetti",
 paragraphs: [
 "An der **Riva** oder direkt am Markusplatz zahlt man die Aussicht. **Zwei Gassen weiter** gibt es Ombra (Wein) und Cicchetti für den halben Preis.",
 "**All'Arco** nahe Rialto und **Cantina Do Mori** in San Polo sind unsere Fixpunkte – Theke, kein Touristenmenü. Trattoria **Alle Testiere** (Fisch, wenige Plätze) lohnt sich mit Reservierung.",
 "Spritz und Aperol am Canale: schön mit Blick, aber der gleiche Drink kostet in einer **Nebengasse die Hälfte**. Prost trotzdem.",
 ],
 story:
 "Ein Kellner hat uns an der Ecke zum «Touristenmenü» gelockt – wir sind weitergegangen und zehn Minuten später bei Do Mori gelandet. Halber Preis, doppeltes Gefühl, echter Abend.",
 },
 {
 id: "abend",
 kicker: "Abends",
 title: "Wenn die Tagesgruppen weg sind",
 photo: venicePhotoUrl.salute,
 photoAlt: venicePhotoAlt.salute,
 photoCaption: "Basilica Santa Maria della Salute · Abendlicht",
 paragraphs: [
 "Nach **19 Uhr** verändert sich die Stadt. Die grossen Plätze leeren sich, Laternen gehen an, Schritte hallen in engen Gassen.",
 "**Fondamente Nove** zum Sonnenuntergang: Blick über die Lagune, nach Murano und dem Festland. Kein Eintritt, nur Wind.",
 "Gondeln am Abend: teuer, aber stimmungsvoll. Wer sparen will: **Vaporetto bei Dämmerung** – fast so schön, Bruchteil des Preises.",
 ],
 story:
 "Unser Lieblingsmoment: die **Zattere** bei Dämmerung, Salute gegenüber, keine Musik aus Lautsprechern – nur Wasser. Kein Eintritt, keine Schlange, nur Bank und Wind.",
 },
 {
 id: "fallen",
 kicker: "Praxis",
 title: "Typische Fallen – und wie wir sie umgehen",
 photo: venicePhotoUrl.cannaregio,
 photoAlt: venicePhotoAlt.cannaregio,
 photoCaption: "Gasse in Cannaregio · abseits der Hauptströme",
 paragraphs: [
 "Festpreis-Gondeln ohne vorherige Absprache: **immer fragen**, was drin ist. **Traghetto** ist die ehrliche Alternative.",
 "Restaurant mit Fotokarte und Kellner, der Gäste an der Ecke anspricht: **weitergehen**. Gute Küche braucht das nicht.",
 "**Acqua alta** (Hochwasser): Stege und Gummistiefel in St. Mark's Shop-Season – oft übertrieben. MOSE hält vieles ab; bei leichtem Hochwasser ist es kurios, selten gefährlich.",
 "**Libreria Acqua Alta** ist Instagram-tauglich, aber klein und voll – bei nur 2 Tagen würden wir eher Cannaregio oder die Zattere wählen.",
 "**Mestre** als Base spart Geld – aber wer nur abends rüberfährt, verpasst die leeren Morgenstunden. Wir mischen: mindestens **zwei Nächte in der Lagune**.",
 ],
 story:
 "Wir haben einmal eine «Gondelfahrt 80 €» angenommen, ohne nach Minuten zu fragen – am Steg stand «ab 90 €». Seitdem: Traghetto oder Vaporetto, immer klären.",
 },
];

export const VENICE_MUST_SEE = [
 "Markusdom & Campanile – früh oder spät",
 "Dogenpalast – online Ticket",
 "Rialtomarkt am Morgen",
 "Basilica Santa Maria della Salute",
 "Scuola Grande di San Rocco",
 "Ghetto Nuovo",
 "Vaporetto Linie 1 – Canal Grande",
 "Murano & Burano – früh starten",
];

export const VENICE_HERO_PHOTO = venicePhotoUrl.hero;
export const VENICE_HERO_PHOTO_ALT = venicePhotoAlt.hero;

export type HotelTierTip = {
 tier: string;
 subtitle: string;
 tips: string[];
};

/** Nur intern für künftige Reiseberichte (Cursor) – nicht im UI anzeigen. */
export const VENICE_HOTEL_TIER_GUIDELINES = {
 intro:
 "Grundsätzlich reisen wir einfach: meist 3–4 Sterne, sauber, gute Lage, kein Luxuszwang. Für besondere Anlässe gönnen wir uns auch mal 5 Sterne – und wenn das Budget knapp ist, suchen wir bewusst günstige Alternativen.",
 tiers: [
 {
 tier: "3–4 Sterne · unser Standard",
 subtitle: "Komfort ohne Schnickschnack",
 tips: [
 "Cannaregio oder Castello: ruhiger, oft 3–4-Sterne-Häuser mit Frühstück und kurzem Weg zur Haltestelle.",
 "Filter: Bewertung ab 8,5, kostenlose Stornierung wenn möglich.",
 "Kein Muss: Canal-Grande-Blick – eine ruhige Gasse spart Geld und Nerven.",
 ],
 },
 {
 tier: "5 Sterne · für etwas Besonderes",
 subtitle: "Wenn ihr es euch gönnen wollt",
 tips: [
 "Giudecca oder Lido: grosszügigere Zimmer, oft mit Pool oder Lagune-Blick.",
 "San Marco und Riva: ikonisch, laut, teuer – eher für eine Nacht.",
 "Nebensaison (Nov–Feb ohne Biennale-Hype) – Preise für 5* fallen spürbar.",
 ],
 },
 {
 tier: "Günstig · schlau sparen",
 subtitle: "Ohne auf Venedig zu verzichten",
 tips: [
 "Mestre am Festland: Zug oder Bus in 10–15 Minuten in die Stadt.",
 "Hostels und Pensionen in Cannaregio: geteiltes Bad, dafür mitten in der Lagune.",
 "Zwei Nächte in der Stadt + Basis ausserhalb kann reichen.",
 ],
 },
 ] satisfies HotelTierTip[],
} as const;

export const VENICE_HOTEL_TIPS = {
 intro:
 "Lage zählt mehr als Sterne: eine Basis in Cannaregio, Castello oder Dorsoduro, nicht direkt am Markusplatz. Drei Nächte ohne Umziehen – morgens raus, abends ins selbe Bett.",
} as const;

export type VeniceHotelPick = {
 id: string;
 name: string;
 stars: string;
 area: string;
 note: string;
 audience?: string;
 tier: "standard" | "luxury" | "budget";
 hotelsComPath?: string;
};

export const VENICE_HOTEL_PICKS: VeniceHotelPick[] = [
 {
 id: "giorgione",
 name: "Hotel Giorgione",
 stars: "4*",
 area: "Cannaregio",
 tier: "standard",
 audience: "Für Erstbesucher",
 note: "Ruhig in Cannaregio, zentral – abends authentischer.",
 hotelsComPath: "/ho132001/hotel-giorgione-venice-italy/",
 },
 {
 id: "antiche-figure",
 name: "Hotel Antiche Figure",
 stars: "3*",
 area: "Santa Croce, nahe Bahnhof",
 tier: "standard",
 audience: "Für Zugreisende",
 note: "Nah Bahnhof Santa Lucia – kurzer Weg mit Gepäck.",
 hotelsComPath: "/ho216804/hotel-antiche-figure-venice-italy/",
 },
 {
 id: "gritti",
 name: "The Gritti Palace",
 stars: "5*",
 area: "San Marco",
 tier: "luxury",
 audience: "Für besondere Anlässe",
 note: "Canal Grande – ikonisch, teuer; eher eine Nacht.",
 hotelsComPath: "/ho141156/the-gritti-palace-a-luxury-collection-hotel-venice-venice-italy/",
 },
 {
 id: "molino-stucky",
 name: "Hilton Molino Stucky",
 stars: "5*",
 area: "Giudecca",
 tier: "luxury",
 audience: "Für Ruhe & Komfort",
 note: "Giudecca mit Pool & Shuttle – weniger Trubel.",
 hotelsComPath: "/ho236576/hilton-molino-stucky-venice-venice-italy/",
 },
 {
 id: "generator",
 name: "Generator Venice",
 stars: "Hostel",
 area: "Giudecca",
 tier: "budget",
 audience: "Für Budget",
 note: "Günstiger als die Altstadt – Vaporetto nach San Marco einkalkulieren.",
 hotelsComPath: "/ho404675/generator-venice-venice-italy/",
 },
 {
 id: "mestre",
 name: "Hotels in Mestre",
 stars: "2–4*",
 area: "Festland",
 tier: "budget",
 audience: "Für Budget",
 note: "Deutlich günstiger, aber mit mehr Transferzeit – mindestens zwei Nächte in der Lagune lohnen sich trotzdem.",
 },
];

export { VENICE_POI_PHOTOS };

const VENICE_HOTEL_NIGHTS = 4;
const VENICE_HOTEL_TRAVELERS = 2;
const VENICE_HOTEL_DAYS_AHEAD = 7;

function toIsoDate(d: Date): string {
 return d.toISOString().slice(0, 10);
}

/** Check-in heute + 7 Tage, 4 Nächte, 2 Personen – für Hotels.com-Deeplinks. */
export function buildVeniceHotelSearchWindow(): { checkIn: string; checkOut: string } {
 const checkIn = new Date();
 checkIn.setHours(12, 0, 0, 0);
 checkIn.setDate(checkIn.getDate() + VENICE_HOTEL_DAYS_AHEAD);
 const checkOut = new Date(checkIn);
 checkOut.setDate(checkOut.getDate() + VENICE_HOTEL_NIGHTS);
 return { checkIn: toIsoDate(checkIn), checkOut: toIsoDate(checkOut) };
}

function formatShortDate(iso: string): string {
 const [, m, d] = iso.split("-").map(Number);
 return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.`;
}

export function formatVeniceHotelWindowLabel(): string {
 const { checkIn, checkOut } = buildVeniceHotelSearchWindow();
 return `${formatShortDate(checkIn)}–${formatShortDate(checkOut)} · ${VENICE_HOTEL_NIGHTS} Nächte · ${VENICE_HOTEL_TRAVELERS} Personen`;
}

export function buildVeniceHotelPickLink(pick: VeniceHotelPick): string {
 const { checkIn, checkOut } = buildVeniceHotelSearchWindow();
 const base = {
 checkIn,
 checkOut,
 travelers: VENICE_HOTEL_TRAVELERS,
 rooms: 1,
 clickRef: `venice-hotel-${pick.id}`,
 };
 if (pick.hotelsComPath) {
 return buildHotelsComLink({ ...base, landingPage: pick.hotelsComPath });
 }
 const destination =
 pick.id === "mestre" ? "Mestre, Venedig, Italien" : `${pick.name}, Venedig, Italien`;
 return buildHotelsComLink({ ...base, destination });
}
