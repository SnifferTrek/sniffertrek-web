import { buildHotelsComLink } from "@/lib/affiliateLinks";
import { CINQUE_TERRE_OFFICIAL_LINKS } from "@/lib/travelReports/cinqueTerreOfficialLinks";
import {
  CINQUE_TERRE_POI_PHOTOS,
  cinqueTerrePhotoAlt,
  cinqueTerrePhotoUrl,
} from "@/lib/travelReports/cinqueTerrePhotos";
import { CINQUE_TERRE_META } from "@/lib/travelReports/cinqueTerreSeo";
import type { ReportSection, ReportTip } from "@/lib/travelReports/types";

export type { ReportSection, ReportTip };

export const CINQUE_TERRE_REPORT = {
  slug: "cinque-terre",
  title: "Cinque Terre in 4 Tagen",
  subtitle: "Basis Porto Venere · Zug, Trail & Boot",
  seoSubtitle: CINQUE_TERRE_META.seoSubtitle,
  metaDescription: CINQUE_TERRE_META.description,
  duration: "4 Nächte · Mai",
  visitedIn: "Mai · Frühling",
  lead:
    "**Vier Nächte Porto Venere**, dann Cinque Terre per **Zug**, **Via dell'Amore**, **Sentiero Azzurro** und **Fähre nach Palmaria** – ohne Hotel-Hopping.",
  /** PDF Seite 1 – max. ~48 Wörter */
  printLead:
    "**Vier Nächte Porto Venere**, dann Cinque Terre per **Zug**, **Via dell'Amore**, **Sentiero Azzurro** und **Fähre nach Palmaria**. Tipps zu **Card**, Anreise und typischen **Fallen**.",
  affiliateDestination: "Porto Venere, Italien",
} as const;

export const CINQUE_TERRE_SECTIONS: ReportSection[] = [
 {
 id: "ankunft",
 kicker: "Tag 1 · Ankommen",
 title: "Porto Venere ist die Basis – nicht nur ein Tagesausflug",
 photo: cinqueTerrePhotoUrl.portoVenere,
 photoAlt: cinqueTerrePhotoAlt.portoVenere,
 photoCaption: "Porto Venere · Hafen & UNESCO-Altstadt",
  printParagraph:
 "**Porto Venere** als Basis: Hafen, San Pietro, Byron-Grotte – abends ruhig, wenn die Busse weg sind.",
 paragraphs: [
 "Wer **Cinque Terre** nur als Tagesbus von La Spezia kennt, verpasst **Porto Venere**: bunte Häuser, Festungsmauern, die **Byron-Grotte** und abends Stille, wenn die Tagesgruppen weg sind.",
 "Wir haben **vier Nächte** im selben Quartier gebucht – kein Packen, kein Stress mit Parkplätzen in jedem Dorf. Vom Fenster hörten wir die Wellen gegen den Hafen.",
 "Der erste Abend: **ohne Plan** die Promenade, San Pietro auf der Landzunge, ein Glas Weißwein. Ligurien belohnt **Langsamkeit** – weniger Hetze als in den fünf Dörfern am nächsten Tag.",
 ],
 story:
 "Beim Check-in haben wir das Auto zu weit weg geparkt – mit Koffern die Stufen zur Altstadt war einmal genug. Seitdem: alles Wichtige im Rucksack, Auto nur für An- und Abreise.",
 tips: [
 {
 title: "Quartier",
 body: "Altstadt nahe Hafen oder etwas höher mit Meerblick – Lerici ist ruhiger, aber weiter von der Bahn.",
 },
 {
 title: "Gepäck",
 body: "Rucksack schlägt Koffer. Enge Gassen und Treppen in allen fünf Dörfern.",
 },
 {
 title: "Abend",
 body: "Restaurant reservieren – ab 20 Uhr voll, auch unter der Woche im Mai.",
 },
 ],
 },
 {
 id: "cinque-terre-zug",
 kicker: "Tag 2 · Zug",
 title: "La Spezia → Riomaggiore → Vernazza – der Zug ist die Achse",
 photo: cinqueTerrePhotoUrl.riomaggiore,
 photoAlt: cinqueTerrePhotoAlt.riomaggiore,
 photoCaption: "Riomaggiore · Einstieg Cinque Terre",
 inlinePhoto: cinqueTerrePhotoUrl.vernazza,
 inlinePhotoAlt: cinqueTerrePhotoAlt.vernazza,
 inlinePhotoCaption: "Vernazza · Hafenbucht",
  printParagraph:
 "Früh **La Spezia**, Card lösen, max. drei Dörfer – Zug ist schon Sightseeing.",
 paragraphs: [
 "Morgens Bus oder Auto nach **La Spezia Centrale**, dort die **Cinque Terre Card** lösen. Der Regionalzug fährt alle paar Minuten – **Riomaggiore** zuerst, wenn die Via dell'Amore offen ist.",
 "Wir haben maximal **drei Dörfer** an einem Zugtag gemacht – lieber sitzen bleiben als alles abhaken. **Manarola** für den Viewpoint, **Vernazza** für Mittag am Hafen.",
 "Der Zug entlang der Klippen ist schon **Sightseeing** – Fenster auf die Seeseite, Kamera bereit.",
 ],
 story:
 "Um zehn Uhr war der Zug nach Vernazza voll wie ein Berufspendlerzug – am nächsten Tag sind wir um sieben von La Spezia los: andere Welt, leere Gassen, heisser Kaffee am Gleis.",
 tips: [
 {
 title: "Card",
 body: "1 Tag für reinen Zugtag · 2 Tage wenn zusätzlich gewandert wird.",
 href: CINQUE_TERRE_OFFICIAL_LINKS.cinqueTerreCardInfo,
 linkLabel: "Cinque Terre Card · Infos",
 },
 {
 title: "Timing",
 body: "Erster Zug Richtung Monterosso – vor 9 Uhr in Riomaggiore sein.",
 },
 {
 title: "Corniglia",
 body: "382 Stufen Lardarina vom Bahnhof – nur wenn Knie mitmachen.",
 },
 ],
 },
 {
 id: "via-amore",
 kicker: "Via dell'Amore",
 title: "Der kurze Klassiker zwischen Riomaggiore und Manarola",
 photo: cinqueTerrePhotoUrl.viaAmore,
 photoAlt: cinqueTerrePhotoAlt.viaAmore,
 photoCaption: "Küstenweg · Via dell'Amore",
  printParagraph:
 "**Via dell'Amore** nur wenn offen (Status prüfen) – sonst Belvedere Manarola.",
 paragraphs: [
 "Die **Via dell'Amore** ist nur etwa einen Kilometer lang – aber der bekannteste Abschnitt der Cinque Terre. Jahre lang saniert, oft nur mit **Reservierung** und Schutzausrüstung.",
 "Wir haben den Status **vor der Buchung** auf der Park-Website geprüft und einen Slot gebucht – ohne geht gar nichts.",
 "Wenn gesperrt: **Zug eine Station** oder Belvedere oberhalb Manarola – der Blick ist fast genauso schön, ohne Schlange.",
 ],
 story:
 "Mit Helm und Zeitfenster wirkte der Weg fast nüchtern – trotzdem der Moment, als Manarola unter uns auftauchte. Ohne offene Via hätten wir einen halben Tag verloren – Plan B war schon im Kopf.",
 tips: [
 {
 title: "Status",
 body: "parconazionale5terre.it – Sanierung in Etappen, Regeln ändern sich.",
 href: CINQUE_TERRE_OFFICIAL_LINKS.viaAmoreFruizione,
 linkLabel: "Via dell'Amore · Reservierung",
 },
 {
 title: "Alternative",
 body: "Belvedere Manarola · kostenlos, morgens oder gegen Abend.",
 },
 ],
 },
 {
 id: "wanderung",
 kicker: "Tag 3 · Wanderung",
 title: "Sentiero Azzurro – Vernazza nach Monterosso",
 photo: cinqueTerrePhotoUrl.trail,
 photoAlt: cinqueTerrePhotoAlt.trail,
 photoCaption: "Sentiero Azzurro · Mittelabschnitt",
  printParagraph:
 "**Sentiero** Vernazza–Monterosso mit Card, festen Schuhen, frühem Start.",
 paragraphs: [
 "Der **blaue Weg** zwischen **Vernazza und Monterosso** ist unser Favorit: zwei bis drei Stunden, Aussicht aufs Meer, dann **Sandstrand** als Belohnung.",
 "**Feste Schuhe**, mindestens einen Liter Wasser, Sonnencreme – der Weg ist mittelschwer, nicht Spaziergang.",
 "Kontrolle der **Cinque Terre Card** am Eingang – ohne gültige Karte umkehren. Bei Gewitter oder Sturm schliessen die Ranger die Pfade.",
 ],
 story:
 "Ich bin einmal in Sandalen los – nach zwanzig Minuten Rückkehr zum Hotel. Am nächsten Tag mit Trekkingschuhen: gleicher Weg, andere Erfahrung, Meerwasser in Monterosso danach.",
 tips: [
 {
 title: "Richtung",
 body: "Vernazza → Monterosso: Strand am Ende. Umgekehrt steiler nach oben.",
 },
 {
 title: "Regeln",
 body: "Auf dem Weg bleiben · kein Baden in abgesperrten Buchten.",
 href: CINQUE_TERRE_OFFICIAL_LINKS.trails,
 linkLabel: "Sentieri · Park",
 },
 ],
 },
 {
 id: "boot",
 kicker: "Tag 4 · Schiffahrt",
 title: "Fähre nach Palmaria – Golfo dei Poeti",
 photo: cinqueTerrePhotoUrl.ferry,
 photoAlt: cinqueTerrePhotoAlt.ferry,
 photoCaption: "Fähre · Golfo dei Poeti",
 inlinePhoto: cinqueTerrePhotoUrl.palmaria,
 inlinePhotoAlt: cinqueTerrePhotoAlt.palmaria,
 inlinePhotoCaption: "Isola Palmaria",
  printParagraph:
 "Fähre nach **Palmaria** oder Boot entlang der Küste – Wetter prüfen.",
 paragraphs: [
 "Von **Porto Venere** fahren Boote zur **Isola Palmaria** – zehn Minuten, andere Welt: leichte Wanderwege, Badebuchten, Blick zurück auf die Festung.",
 "Optional weiter nach **Lerici** – Castello, Promenade, weniger Instagram als die Cinque Terre.",
 "Im Sommer gibt es auch **Boote zwischen den fünf Dörfern** – wir kombinieren lieber: Zug hin, Boot zurück, wenn der Seegang mitspielt.",
 ],
 story:
 "Auf Palmaria haben wir uns verlaufen – in dem guten Sinn. Kein Eintritt, kein Ticketautomat, nur Ziegenwege und das Festungsprofil von Porto Venere über dem Wasser.",
 tips: [
 {
 title: "Fähre Porto Venere",
 body: "Fahrplan am Hafen · Hin- und Rückfahrt morgens kaufen.",
 href: CINQUE_TERRE_OFFICIAL_LINKS.golfoPoetiFerry,
 linkLabel: "Navigazione Golfo dei Poeti",
 },
 {
 title: "Cinque Terre Boot",
 body: "Sommer-Tageskarte · bei Wind lieber Zug.",
 },
 ],
 },
 {
 id: "essen",
 kicker: "Überall",
 title: "Pesto, Focaccia und Fisch – ligurisch essen",
 photo: cinqueTerrePhotoUrl.pesto,
 photoAlt: cinqueTerrePhotoAlt.pesto,
 photoCaption: "Ligurische Küche · Pesto & Meer",
 paragraphs: [
 "**Trofie al pesto** und **muscoli ripieni** (gefüllte Muscheln) sind unsere Fixpunkte – in Porto Venere abends, in Vernazza mittags an der Terrasse.",
 "Die **Focaccia** in La Spezia vor dem Zug mitnehmen – günstig, authentisch, kein Touristenmenü.",
 "Wein: **Vermentino** oder leichter Weiss aus den Terrassen hinter Manarola – nicht teuer, wenn man nach Ortswein fragt.",
 ],
 story:
 "In einem Restaurant mit englischer Plastikkarte und «Tourist Menu 25 €» sind wir gegangen – zehn Minuten später Pesto in einer Gasse ohne Foto an der Tür: halber Preis, doppeltes Glück.",
 },
 {
 id: "fallen",
 kicker: "Praxis",
 title: "Typische Fallen – und wie wir sie umgehen",
 photo: cinqueTerrePhotoUrl.laSpezia,
 photoAlt: cinqueTerrePhotoAlt.laSpezia,
 photoCaption: "La Spezia · Zug-Hub",
 paragraphs: [
 "**Ohne Cinque Terre Card** auf den Trail – Kontrolle, Strafe, Frust. Card vor dem ersten Weg lösen.",
 "**Auto in die Dörfer** – Parkplätze voll, Strassen gesperrt. Auto abstellen, Zug nehmen.",
 "**Mittags im Juli** wandern – Hitze und volle Wege. Früh starten oder September.",
 "**Via dell'Amore ohne Reservierung** anreisen – wenn offen, trotzdem Slot nötig.",
 "**Nur einen Tag** für alles fünf Dörfer – Hetze statt Erlebnis. Wir haben lieber **vier Nächte eine Basis**.",
 ],
 story:
 "Einmal ohne Card auf den Weg – Ranger hat freundlich, aber bestimmt umgedreht. Seitdem liegt die Card wie der Schlüssel neben dem Handy.",
 },
];

export const CINQUE_TERRE_MUST_SEE = [
 "Porto Venere · Byron-Grotte & San Pietro",
 "Via dell'Amore · Riomaggiore–Manarola",
 "Riomaggiore · bunte Gassen",
 "Manarola · Belvedere",
 "Vernazza · Hafen & Turm",
 "Sentiero Azzurro · Vernazza–Monterosso",
 "Monterosso · Strand",
 "Isola Palmaria · Fähre",
];

export const CINQUE_TERRE_HERO_PHOTO = cinqueTerrePhotoUrl.hero;
export const CINQUE_TERRE_HERO_PHOTO_ALT = cinqueTerrePhotoAlt.hero;

export const CINQUE_TERRE_HOTEL_TIPS = {
 intro:
      "Eine Basis in Porto Venere: Hafenlage oder Meerblick, vier Nächte ohne Umziehen. Morgens mit Zug oder Boot in die Cinque Terre, abends zurück – nicht in Manarola oder Vernazza umziehen.",
} as const;

export type CinqueTerreHotelPick = {
 id: string;
 name: string;
 stars: string;
 area: string;
 note: string;
 audience?: string;
 tier: "standard" | "luxury" | "budget";
 hotelsComPath?: string;
};

export const CINQUE_TERRE_HOTEL_PICKS: CinqueTerreHotelPick[] = [
 {
 id: "palmaria",
 name: "Hotels am Hafen Porto Venere",
 stars: "4*",
 area: "Porto Venere · Hafen",
 tier: "luxury",
 audience: "Für besondere Anlässe",
 note: "Direkt am Wasser – früh buchen, Mai/Juni schnell ausgebucht.",
 },
 {
 id: "standard-porto",
 name: "Hotels in Porto Venere Altstadt",
 stars: "3–4*",
 area: "Porto Venere",
 tier: "standard",
 audience: "Unser Standard",
 note: "Kleine Häuser mit Frühstück – früh buchen für Mai/Juni.",
 },
 {
 id: "la-spezia",
 name: "Hotels in La Spezia",
 stars: "3*",
 area: "La Spezia",
 tier: "budget",
 audience: "Für Budget",
 note: "Günstiger, Zug zur Cinque Terre vor der Tür – weniger Charme als Porto Venere.",
 },
 {
 id: "lerici",
 name: "Hotels in Lerici",
 stars: "3–4*",
 area: "Lerici",
 tier: "standard",
 audience: "Für Ruhe",
 note: "Sandstrand, Castello – Bus/Boot nach Porto Venere einplanen.",
 },
];

export { CINQUE_TERRE_POI_PHOTOS };

const HOTEL_NIGHTS = 4;
const HOTEL_TRAVELERS = 2;
const HOTEL_DAYS_AHEAD = 14;

function toIsoDate(d: Date): string {
 return d.toISOString().slice(0, 10);
}

export function buildCinqueTerreHotelSearchWindow(): { checkIn: string; checkOut: string } {
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

export function formatCinqueTerreHotelWindowLabel(): string {
 const { checkIn, checkOut } = buildCinqueTerreHotelSearchWindow();
 return `${formatShortDate(checkIn)}–${formatShortDate(checkOut)} · ${HOTEL_NIGHTS} Nächte · ${HOTEL_TRAVELERS} Personen`;
}

export function buildCinqueTerreHotelPickLink(pick: CinqueTerreHotelPick): string {
 const { checkIn, checkOut } = buildCinqueTerreHotelSearchWindow();
 const base = {
 checkIn,
 checkOut,
 travelers: HOTEL_TRAVELERS,
 rooms: 1,
 clickRef: `cinque-terre-hotel-${pick.id}`,
 };
 if (pick.hotelsComPath) {
 return buildHotelsComLink({ ...base, landingPage: pick.hotelsComPath });
 }
 const destination =
 pick.id === "la-spezia"
 ? "La Spezia, Italien"
 : pick.id === "lerici"
 ? "Lerici, Italien"
 : "Porto Venere, Italien";
 return buildHotelsComLink({ ...base, destination });
}
