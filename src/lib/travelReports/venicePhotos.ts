import { inspirationPhoto } from "@/lib/inspirationDestinations";

/**
 * Unsplash-Fotos – je Motiv eine eigene ID (keine Wiederverwendung zwischen POIs).
 * Stand: Mai 2026 – Beschreibung auf unsplash.com geprüft.
 */
export const VENICE_PHOTOS = {
 hero: {
 url: inspirationPhoto("1511135570219-bbad9a02f103", 2000),
 alt: "Canal Grande in Venedig mit historischen Palästen",
 },
 sanMarco: {
 url: inspirationPhoto("1551963811-3823b2eb18d8", 1800),
 alt: "Basilica di San Marco am Piazza San Marco in Venedig",
 },
 campanile: {
 url: inspirationPhoto("1658163723788-cce17aa59742", 1800),
 alt: "Campanile di San Marco am Markusplatz bei Sonnenuntergang",
 },
 rialtoBridge: {
 url: inspirationPhoto("1660801576025-c87d2e5ff9c4", 1800),
 alt: "Rialtobrücke über den Canal Grande in Venedig",
 },
 rialtoMarket: {
 url: inspirationPhoto("1574365609488-26baefc65b98", 1200),
 alt: "Mercato di Rialto – Fischmarkt in Venedig am Morgen",
 },
 dogePalace: {
 url: inspirationPhoto("1576877072885-7fa36fdf572d", 1800),
 alt: "Dogenpalast Palazzo Ducale am Markusplatz in Venedig",
 },
 vaporetto: {
 url: inspirationPhoto("1717411579462-8a31fb3da3c4", 1800),
 alt: "Vaporetto Linie 1 auf dem Canal Grande in Venedig",
 },
 canalAlley: {
 url: inspirationPhoto("1523906921802-b5d2d899e93b", 1400),
 alt: "Schmaler Canal zwischen historischen Palästen in Venedig",
 },
 salute: {
 url: inspirationPhoto("1741290895082-208715c35a01", 1800),
 alt: "Basilica di Santa Maria della Salute am Canal Grande",
 },
 accademia: {
 url: inspirationPhoto("1576760792616-d3fccdb68d29", 1800),
 alt: "Innenhof und Architektur nahe der Gallerie dell'Accademia in Dorsoduro",
 },
 murano: {
 url: inspirationPhoto("1727001496055-ba712f0c7f82", 1400),
 alt: "Glasbläserei auf der Insel Murano bei Venedig",
 },
 burano: {
 url: inspirationPhoto("1552751118-d3cde54807de", 1200),
 alt: "Bunte Fischerhäuser auf Burano in der Venezianischen Lagune",
 },
 cicchetti: {
 url: inspirationPhoto("1571521779686-87717ccf1f5d", 1600),
 alt: "Bacaro mit Cicchetti in einer Gasse in Venedig",
 },
 cannaregio: {
 url: inspirationPhoto("1605826039008-b0b2820c21e9", 1600),
 alt: "Ruhige Gasse in Cannaregio abseits der Touristenströme",
 },
 fenice: {
 url: inspirationPhoto("1607998803461-4e9aef3be418", 1800),
 alt: "Innenraum des Teatro La Fenice in Venedig mit roten Samtsesseln",
 },
 pauseCanal: {
 url: inspirationPhoto("1748367959778-12d026a20a99", 1400),
 alt: "Venedig bei Sonnenuntergang – Canal und Skyline vom Ufer aus",
 },
} as const;

export type VenicePoiCard = {
 id: string;
 caption: string;
 photo: string;
 alt: string;
 tip: string;
};

/** Sehenswürdigkeiten als Karten mit Kurz-Tipp. */
export const VENICE_POI_PHOTOS: VenicePoiCard[] = [
 {
 id: "san-marco",
 caption: "Basilica di San Marco",
 photo: VENICE_PHOTOS.sanMarco.url,
 alt: VENICE_PHOTOS.sanMarco.alt,
 tip: "Früh morgens oder spät abends – mittags ist der Platz am vollsten.",
 },
 {
 id: "rialto",
 caption: "Rialtobrücke · Canal Grande",
 photo: VENICE_PHOTOS.rialtoBridge.url,
 alt: VENICE_PHOTOS.rialtoBridge.alt,
 tip: "Früh morgens fast menschenleer und deutlich stimmungsvoller.",
 },
 {
 id: "dogenpalast",
 caption: "Dogenpalast · Palazzo Ducale",
 photo: VENICE_PHOTOS.dogePalace.url,
 alt: VENICE_PHOTOS.dogePalace.alt,
 tip: "Ticket online buchen – spart eine Stunde Schlange an Wochenenden.",
 },
 {
 id: "salute",
 caption: "Santa Maria della Salute",
 photo: VENICE_PHOTOS.salute.url,
 alt: VENICE_PHOTOS.salute.alt,
 tip: "Vom Zattere-Ufer aus der schönste Blick – besonders gegen Abend.",
 },
 {
 id: "vaporetto",
 caption: "Vaporetto · Linie 1",
 photo: VENICE_PHOTOS.vaporetto.url,
 alt: VENICE_PHOTOS.vaporetto.alt,
 tip: "Günstigste Sightseeing-Tour: ganzer Canal Grande hin und zurück.",
 },
 {
 id: "murano",
 caption: "Murano · Glasinsel",
 photo: VENICE_PHOTOS.murano.url,
 alt: VENICE_PHOTOS.murano.alt,
 tip: "Nur mit Glasbläserei-Besuch wirklich lohnend – Termin vorher vereinbaren.",
 },
 {
 id: "burano",
 caption: "Burano · bunte Häuser",
 photo: VENICE_PHOTOS.burano.url,
 alt: VENICE_PHOTOS.burano.alt,
 tip: "Fotogenste Insel der Lagune – möglichst vor Mittag besuchen.",
 },
 {
 id: "rialto-markt",
 caption: "Mercato di Rialto",
 photo: VENICE_PHOTOS.rialtoMarket.url,
 alt: VENICE_PHOTOS.rialtoMarket.alt,
 tip: "Ab sieben Uhr echtes Venedig – nach neun Uhr wird es schnell voll.",
 },
 {
 id: "campanile",
 caption: "Campanile · Markusplatz",
 photo: VENICE_PHOTOS.campanile.url,
 alt: VENICE_PHOTOS.campanile.alt,
 tip: "Kein Skip-the-Line – 20–30 Min. vor Öffnung (9 Uhr) anstellen. Aussicht ca. 10 €.",
 },
 {
 id: "accademia",
 caption: "Gallerie dell'Accademia",
 photo: VENICE_PHOTOS.accademia.url,
 alt: VENICE_PHOTOS.accademia.alt,
 tip: "Weniger voll als der Dogenpalast – Vitruv-Mann-Zeichnung und venezianische Meister.",
 },
 {
 id: "fenice",
 caption: "Teatro La Fenice",
 photo: VENICE_PHOTOS.fenice.url,
 alt: VENICE_PHOTOS.fenice.alt,
 tip: "Führung mit Audioguide oder Abendvorstellung – ideal bei Regen.",
 },
];

/** Kurz-URLs für Sektions-Fotos im Bericht. */
export const venicePhotoUrl = {
 hero: VENICE_PHOTOS.hero.url,
 sanMarco: VENICE_PHOTOS.sanMarco.url,
 campanile: VENICE_PHOTOS.campanile.url,
 rialtoBridge: VENICE_PHOTOS.rialtoBridge.url,
 rialtoMarket: VENICE_PHOTOS.rialtoMarket.url,
 dogePalace: VENICE_PHOTOS.dogePalace.url,
 vaporetto: VENICE_PHOTOS.vaporetto.url,
 canalAlley: VENICE_PHOTOS.canalAlley.url,
 salute: VENICE_PHOTOS.salute.url,
 accademia: VENICE_PHOTOS.accademia.url,
 murano: VENICE_PHOTOS.murano.url,
 burano: VENICE_PHOTOS.burano.url,
 cicchetti: VENICE_PHOTOS.cicchetti.url,
 cannaregio: VENICE_PHOTOS.cannaregio.url,
 fenice: VENICE_PHOTOS.fenice.url,
 pauseCanal: VENICE_PHOTOS.pauseCanal.url,
} as const;

export const venicePhotoAlt = {
 hero: VENICE_PHOTOS.hero.alt,
 sanMarco: VENICE_PHOTOS.sanMarco.alt,
 campanile: VENICE_PHOTOS.campanile.alt,
 rialtoBridge: VENICE_PHOTOS.rialtoBridge.alt,
 rialtoMarket: VENICE_PHOTOS.rialtoMarket.alt,
 dogePalace: VENICE_PHOTOS.dogePalace.alt,
 vaporetto: VENICE_PHOTOS.vaporetto.alt,
 canalAlley: VENICE_PHOTOS.canalAlley.alt,
 salute: VENICE_PHOTOS.salute.alt,
 accademia: VENICE_PHOTOS.accademia.alt,
 murano: VENICE_PHOTOS.murano.alt,
 burano: VENICE_PHOTOS.burano.alt,
 cicchetti: VENICE_PHOTOS.cicchetti.alt,
 cannaregio: VENICE_PHOTOS.cannaregio.alt,
 fenice: VENICE_PHOTOS.fenice.alt,
 pauseCanal: VENICE_PHOTOS.pauseCanal.alt,
} as const;
