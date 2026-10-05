import { inspirationPhoto } from "@/lib/inspirationDestinations";

/**
 * Unsplash-Fotos – je Motiv eine eigene ID (keine Wiederverwendung zwischen POIs).
 * Stand: Mai 2026 – alt_description auf unsplash.com (napi) geprüft; Ortsname im Text.
 */
export const CINQUE_TERRE_PHOTOS = {
 hero: {
 url: inspirationPhoto("1729710448593-7a361fe6323f", 2000),
 alt: "Manarola an der Cinque Terre – Panorama über das Ligurische Meer",
 },
 portoVenere: {
 url: inspirationPhoto("1631803887084-e2727d5f45a3", 1800),
 alt: "Porto Venere – bunte Häuser am Hafen am Golfo dei Poeti",
 },
 viaAmore: {
 url: inspirationPhoto("1694421659561-f1a84f339ed5", 1800),
 alt: "Via dell'Amore – Küstenweg mit Geländer, Cinque Terre",
 },
 vernazza: {
 url: inspirationPhoto("1729710442373-a4eebca181ef", 1800),
 alt: "Vernazza – bunte Häuser an der Hafenbucht der Cinque Terre",
 },
 riomaggiore: {
 url: inspirationPhoto("1527067903716-ffb864c35a02", 1400),
 alt: "Riomaggiore – ikonisches rotes Haus an der Steilküste",
 },
 manarola: {
 url: inspirationPhoto("1505202197309-26d03a44e08a", 1400),
 alt: "Manarola – klassischer Postkartenblick vom Belvedere",
 },
 ferry: {
 url: inspirationPhoto("1598990079118-5c4fa56fd512", 1600),
 alt: "Boot im Hafen – Ausflug vom Golfo dei Poeti",
 },
 trail: {
 url: inspirationPhoto("1711732438773-58a5aa048226", 1600),
 alt: "Wanderweg Sentiero Azzurro zwischen Monterosso und Vernazza",
 },
 pesto: {
 url: inspirationPhoto("1707448460889-e268eb742820", 1600),
 alt: "Ligurische Küche – frische Basilikum-Pesto-Pasta",
 },
 palmaria: {
 url: inspirationPhoto("1536686830189-5481fa27bc5a", 1400),
 alt: "Isola Palmaria – Felsküste vor Porto Venere",
 },
 laSpezia: {
 url: inspirationPhoto("1676637353622-d286f564db14", 1400),
 alt: "La Spezia – Regionalzug am Bahnhof",
 },
} as const;

export const cinqueTerrePhotoUrl = Object.fromEntries(
 Object.entries(CINQUE_TERRE_PHOTOS).map(([k, v]) => [k, v.url]),
) as { [K in keyof typeof CINQUE_TERRE_PHOTOS]: string };

export const cinqueTerrePhotoAlt = Object.fromEntries(
 Object.entries(CINQUE_TERRE_PHOTOS).map(([k, v]) => [k, v.alt]),
) as { [K in keyof typeof CINQUE_TERRE_PHOTOS]: string };

export type CinqueTerrePoiCard = {
 id: string;
 caption: string;
 photo: string;
 alt: string;
 tip: string;
};

export const CINQUE_TERRE_POI_PHOTOS: CinqueTerrePoiCard[] = [
 {
 id: "porto-venere",
 caption: "Porto Venere · UNESCO",
 photo: cinqueTerrePhotoUrl.portoVenere,
 alt: cinqueTerrePhotoAlt.portoVenere,
 tip: "4 Nächte Basis – abends leerer als die Cinque-Terre-Dörfer",
 },
 {
 id: "via-amore",
 caption: "Via dell'Amore",
 photo: cinqueTerrePhotoUrl.viaAmore,
 alt: cinqueTerrePhotoAlt.viaAmore,
 tip: "Teilstrecke Riomaggiore–Manarola – Status vor Abreise prüfen",
 },
 {
 id: "vernazza",
 caption: "Vernazza",
 photo: cinqueTerrePhotoUrl.vernazza,
 alt: cinqueTerrePhotoAlt.vernazza,
 tip: "Hafenbucht · morgens vor den Tagesgruppen",
 },
 {
 id: "manarola",
 caption: "Manarola · Viewpoint",
 photo: cinqueTerrePhotoUrl.manarola,
 alt: cinqueTerrePhotoAlt.manarola,
 tip: "Belvedere kurz nach Sonnenaufgang – ohne Schlange",
 },
 {
 id: "palmaria",
 caption: "Isola Palmaria",
 photo: cinqueTerrePhotoUrl.palmaria,
 alt: cinqueTerrePhotoAlt.palmaria,
 tip: "Fähre ab Porto Venere · halber Tag Wanderung oder Baden",
 },
 {
 id: "sentiero",
 caption: "Sentiero Azzurro",
 photo: cinqueTerrePhotoUrl.trail,
 alt: cinqueTerrePhotoAlt.trail,
 tip: "Nur mit Cinque Terre Card und festem Schuhwerk",
 },
];
