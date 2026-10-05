/** SEO, FAQ, Verlinkung – Venedig-Reisebericht. */

export const VENICE_META = {
 title: "Venedig in 3 Tagen: Reisebericht mit Tipps für ruhige Gassen, Vaporetto & Lagune",
 description:
 "Venedig in 3 Tagen: Reisebericht mit Tipps zu Rialto, Cannaregio, Dorsoduro, Vaporetto und Murano/Burano. Hotels, Tickets, Essen und typische Fallen – abseits der grössten Touristenströme.",
 seoSubtitle:
 "Reisebericht · Frühling · Cannaregio, Rialto, Dorsoduro & Lagune",
 datePublished: "2026-01-15",
 dateModified: "2026-05-31",
} as const;

export const VENICE_CLOSING =
 "Schönster Moment: eine Bank in **Dorsoduro** vor Sonnenuntergang, als die Stadt still wurde. Genau dafür lohnt sich **Venedig**.";

export const VENICE_FAQ = [
 {
 question: "Gibt es eine Eintrittsgebühr für Venedig?",
 answer:
 "An ausgewählten Wochenenden April–Juli ca. 5–10 € für Tagesgäste. Mit Übernachtung entfällt die Gebühr – Anmeldung (QR) trotzdem. Portal: cda.veneziaunica.it.",
 },
 {
 question: "Wie viele Tage braucht man für Venedig?",
 answer:
 "Drei Tage sind ideal: San Marco/Rialto, Dorsoduro & Vaporetto, plus optional Murano/Burano. Mit vier Tagen mehr Pausen.",
 },
 {
 question: "Wo übernachtet man am besten in Venedig?",
 answer:
 "Cannaregio, Castello oder Dorsoduro – ruhiger als San Marco, gut erreichbar. San Marco ist zentral, aber laut und teuer.",
 },
 {
 question: "Lohnt sich Murano und Burano?",
 answer:
 "Ja, früh starten. Burano mittags voll; Murano mit Glasbläserei-Termin. Ein halber Tag reicht für beide.",
 },
 {
 question: "Was ist die beste günstige Alternative zur Gondel?",
 answer:
 "Traghetto über den Canal Grande (ca. 2–5 €) oder Vaporetto Linie 1 bei Dämmerung.",
 },
 {
 question: "Soll man in Mestre übernachten?",
 answer:
 "Spart Geld (10–15 Min. Zug). Mindestens zwei Nächte in der Lagune empfehlen wir trotzdem.",
 },
 {
 question: "Wann ist die beste Reisezeit für Venedig?",
 answer:
 "April–Juni und September–Oktober. Winter ruhig; Karneval voll. Juli/August heiss und voll.",
 },
 {
 question: "Wo parken wir am besten in Venedig?",
 answer:
 "Tronchetto + People Mover, oder teurer Piazzale Roma. Günstiger: Mestre Park & Ride + Zug.",
 },
 {
 question: "Kann man mit dem Auto nach Venedig fahren?",
 answer:
 "Ja – bis Piazzale Roma oder Tronchetto, nicht in die Altstadt. Weiter zu Fuss/Boot.",
 },
 {
 question: "Wie komme ich vom Flughafen Marco Polo ins Zentrum?",
 answer:
 "ATVO-Bus ca. 8–10 €, Alilaguna ca. 15 €, Wassertaxi ab ca. 100 € ans Hotel.",
 },
 {
 question: "Was machen wir in Venedig bei Regen?",
 answer:
 "Dogenpalast, San Rocco oder Accademia; optional Guggenheim, La Fenice oder Cicchetti-Tour.",
 },
 {
 question: "Welche Museen sind in Venedig ein Muss?",
 answer:
 "Accademia, Dogenpalast, San Rocco; Moderne: Peggy Guggenheim.",
 },
 {
 question: "Lohnt sich ein Venedig City Pass?",
 answer:
 "Bei Dogenpalast + Kirchen + 2–3 Tagen Vaporetto oft ja. Sonst ACTV + Einzeltickets flexibler.",
 },
 {
 question: "Wie lange wartet man am Campanile?",
 answer:
 "Kein Skip-the-Line. 30–60 Min. Wartezeit – oder 20–30 Min. vor Öffnung (9 Uhr).",
 },
] as const;

export const VENICE_RELATED_LINKS = [
 {
 href: "/planer",
 label: "Reise planen im SnifferTrek-Planer",
 description: "Route, Hotels und Etappen für Venedig selbst zusammenstellen.",
 type: "planer" as const,
 },
 {
 href: "/reisebericht/cinque-terre",
 label: "Reisebericht: Cinque Terre in 4 Tagen",
 description: "4 Nächte Porto Venere – Via dell'Amore, Wanderung und Golfo dei Poeti.",
 },
 {
 href: "/reisebericht/cote-dazur",
 label: "Reisebericht: Côte d'Azur in 5 Tagen",
 description: "5 Nächte Nizza – Antibes, Èze, Monaco und Cannes.",
 },
 {
 href: "/inspiration/amalfi",
 label: "Inspiration: Amalfiküste",
 description: "Süditalien – Positano, Pfad der Götter (andere Region).",
 type: "inspiration" as const,
 inspirationSlug: "amalfi",
 },
 {
 href: "/inspiration/hallstatt",
 label: "Alpen & Seen: Hallstatt",
 description: "Ruhiger Gegenpol nach vollen Städtetagen – Österreich ab Salzburg.",
 type: "inspiration" as const,
 inspirationSlug: "hallstatt",
 },
] as const;

/** @deprecated Import from veniceMapPois.ts – Kurzliste für Abwärtskompatibilität. */
export { VENICE_MAP_POIS } from "@/lib/travelReports/veniceMapPois";

import { getInspirationBySlug } from "@/lib/inspirationDestinations";

/** Nur veröffentlichte Inspiration-Seiten + Planer. */
export function getVeniceRelatedLinks() {
 return VENICE_RELATED_LINKS.filter((link) => {
 if ("inspirationSlug" in link && link.type === "inspiration") {
 return Boolean(getInspirationBySlug(link.inspirationSlug));
 }
 return true;
 }).map(({ href, label, description }) => ({ href, label, description }));
}
