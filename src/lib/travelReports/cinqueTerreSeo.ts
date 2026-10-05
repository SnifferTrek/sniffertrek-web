/** SEO, FAQ, Verlinkung – Porto Venere & Cinque Terre. */

export const CINQUE_TERRE_META = {
 title: "Cinque Terre in 4 Tagen: Reisebericht mit Via dell'Amore, Porto Venere & Wanderung",
 description:
 "4 Nächte Porto Venere als Basis: Cinque Terre per Zug, Via dell'Amore, Sentiero Azzurro, Fähre nach Palmaria und Tipps zu Cinque Terre Card, Hotels und typischen Fallen.",
 seoSubtitle:
 "Reisebericht · 4 Nächte · Porto Venere, Via dell'Amore, Wanderwege & Golfo dei Poeti",
 datePublished: "2026-05-28",
 dateModified: "2026-05-28",
} as const;

export const CINQUE_TERRE_CLOSING =
 "Schönster Moment: **abends in Porto Venere**, als die Tagesbusse weg waren. Dafür lohnen sich **vier Nächte an einem Ort**.";

export const CINQUE_TERRE_FAQ = [
 {
 question: "Wie viele Tage braucht man für die Cinque Terre?",
 answer:
 "Mindestens zwei volle Tage. Mit Porto Venere reichen vier Nächte: Zug-Tag, Wander-Tag, Boot/Palmaria, plus Ankunft.",
 },
 {
 question: "Lohnt sich Porto Venere als Übernachtungsbasis?",
 answer:
 "Ja – ruhiger abends als die fünf Dörfer, Fähren nach Palmaria. Mindestens drei Nächte einplanen.",
 },
 {
 question: "Was ist die Cinque Terre Card?",
 answer:
 "Tages-/Mehrtageskarte: Zug La Spezia–Dörfer und Wanderwege. Ohne Karte viele Wege gesperrt.",
 },
 {
 question: "Ist die Via dell'Amore offen?",
 answer:
 "Status vor Reise auf der Park-Website prüfen – oft nur mit Reservierung.",
 },
 {
 question: "Welche Wanderung ist machbar ohne Profi-Ausrüstung?",
 answer:
 "Monterosso–Vernazza oder Vernazza–Corniglia, 2–3 h. Feste Schuhe, Wasser, früh starten.",
 },
 {
 question: "Pisa oder Genua – welcher Flughafen?",
 answer:
 "Pisa oft praktischer (ca. 1–1,5 h nach La Spezia). Genua ebenfalls gut.",
 },
 {
 question: "Kann man die Cinque Terre mit dem Auto besuchen?",
 answer:
 "Dörfer ungeeignet zum Parken. Auto in La Spezia/Hotel, weiter per Zug/Boot.",
 },
 {
 question: "Lohnt sich die Fähre zwischen den Dörfern?",
 answer:
 "Im Sommer ja – anderer Blick. Wetter prüfen; Winter weniger Linien.",
 },
] as const;

export const CINQUE_TERRE_RELATED_LINKS = [
 {
 href: "/planer",
 label: "Reise planen im SnifferTrek-Planer",
 description: "Route, Hotels und Etappen für Ligurien selbst zusammenstellen.",
 type: "planer" as const,
 },
 {
 href: "/reisebericht/venedig",
 label: "Reisebericht: Venedig in 3 Tagen",
 description: "Norditalien-Kombi – Lagune vor oder nach Ligurien.",
 },
 {
 href: "/reisebericht/cote-dazur",
 label: "Reisebericht: Côte d'Azur in 5 Tagen",
 description: "5 Nächte Nizza – Antibes, Èze, Monaco und Cannes.",
 },
 {
 href: "/inspiration/amalfi",
 label: "Weiterreise: Amalfiküste",
 description: "Süditalien – Pfad der Götter und Positano (eigene Region).",
 type: "inspiration" as const,
 inspirationSlug: "amalfi",
 },
] as const;

import { getInspirationBySlug } from "@/lib/inspirationDestinations";

export function getCinqueTerreRelatedLinks() {
 return CINQUE_TERRE_RELATED_LINKS.filter((link) => {
 if ("inspirationSlug" in link && link.type === "inspiration") {
 return Boolean(getInspirationBySlug(link.inspirationSlug));
 }
 return true;
 }).map(({ href, label, description }) => ({ href, label, description }));
}
