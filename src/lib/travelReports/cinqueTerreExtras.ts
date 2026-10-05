/** Zusatz-Inhalte – Card, kostenlos, Touren, Saison, Regen. */

import { buildGetYourGuideLink } from "@/lib/affiliateLinks";
import { CINQUE_TERRE_MAP_POIS_DETAILED } from "@/lib/travelReports/cinqueTerreMapPois";
import { CINQUE_TERRE_OFFICIAL_LINKS } from "@/lib/travelReports/cinqueTerreOfficialLinks";

export const CINQUE_TERRE_ARTICLE_META = {
 dateModifiedLabel: "28. Mai 2026",
 priceStandLabel: "Preise Stand Mai 2026",
 experienceNote: "Reisebericht aus unserer Sicht · 4 Nächte Porto Venere · Mai",
} as const;

export const CINQUE_TERRE_AFFILIATE_DISCLOSURE =
 "Einige Links zu Booking.com, Hotels.com und Touren sind Affiliate-Links – bei einer Buchung erhalten wir ggf. eine Provision, für dich ohne Mehrkosten.";

export const CINQUE_TERRE_CARD_CALLOUT = {
 title: "Cinque Terre Card · Zug & Wanderwege",
 /** PDF-Slot: ~1–2 Sätze */
 body: "**Cinque Terre Card** für Nationalpark-Wege und Regionalzüge La Spezia–Dörfer. Ohne Karte: Wege gesperrt, Kontrollen üblich.",
 bullets: [
 "1 Tag Zug · 2 Tage bei Wanderung + zweitem Zugtag",
 "Online oder in La Spezia Centrale kaufen",
 "Ausweis mitführen – manchmal Personalisierung",
 ],
 officialLabel: "Cinque Terre Card · online kaufen",
 officialHref: CINQUE_TERRE_OFFICIAL_LINKS.cinqueTerreCardShop,
 faqLabel: "Nationalpark · offizielle Regeln",
 faqHref: CINQUE_TERRE_OFFICIAL_LINKS.nationalPark,
} as const;

export type CinqueTerreFreeActivity = {
 label: string;
 anchor: string;
 note?: string;
};

export const CINQUE_TERRE_FREE_ACTIVITIES: CinqueTerreFreeActivity[] = [
 { label: "Hafenpromenade Porto Venere", anchor: "ankunft" },
 { label: "Byron-Grotte & San Pietro", anchor: "ankunft", note: "Abendlicht" },
 { label: "Belvedere Manarola", anchor: "via-amore", note: "Ohne Eintritt" },
 { label: "Gassen Riomaggiore", anchor: "cinque-terre-zug" },
 { label: "Strand Monterosso", anchor: "wanderung", note: "Nach der Wanderung" },
 { label: "Aussicht vom Zug", anchor: "cinque-terre-zug", note: "La Spezia–Monterosso" },
];

export type CinqueTerreGuideCard = {
 id: string;
 title: string;
 verdict: string;
 price: string;
 timing: string;
 tip: string;
 href?: string;
 linkLabel?: string;
};

export const CINQUE_TERRE_GUIDE_CARDS: CinqueTerreGuideCard[] = [
 {
 id: "via-amore",
 title: "Via dell'Amore – lohnt sich?",
 verdict: "Ja – wenn offen: kurz, wenig Höhenmeter.",
 price: "Card oder Zusatzticket",
 timing: "Früh oder Slot · Status prüfen",
 tip: "Alternative: Zug · Belvedere Manarola.",
 href: CINQUE_TERRE_OFFICIAL_LINKS.viaAmoreFruizione,
 linkLabel: "Via dell'Amore · Reservierung",
 },
 {
 id: "wanderung",
 title: "Sentiero Azzurro – lohnt sich?",
 verdict: "Ja – mit Card, festen Schuhen, frühem Start.",
 price: "in Card · 2–3 h / Abschnitt",
 timing: "Nicht mittags im Hochsommer",
 tip: "Favorit: Vernazza–Monterosso · Zug zurück.",
 },
 {
 id: "boot-cinque",
 title: "Boot zwischen den Dörfern?",
 verdict: "Im Sommer schön – Wetterabhängig.",
 price: "ca. 25–35 € Tageskarte",
 timing: "Morgens ruhiger",
 tip: "Bei Seegang Zug nehmen.",
 },
];

export const CINQUE_TERRE_SEASON_ROWS = [
 { season: "Winter", months: "Dez–Feb", temp: "8–12 °C", crowd: "ruhig", note: "Weniger Fähren · manche Wege" },
 { season: "Frühling", months: "Mär–Mai", temp: "14–22 °C", crowd: "mittel", note: "Mai unser Favorit" },
 { season: "Sommer", months: "Jun–Aug", temp: "bis 32 °C", crowd: "sehr voll", note: "Früh wandern · Card online" },
 { season: "Herbst", months: "Sep–Nov", temp: "15–23 °C", crowd: "Sep noch voll", note: "Weinlese · leichter Regen" },
] as const;

export type CinqueTerreCuratedTour = {
 title: string;
 body: string;
 href: string;
 linkLabel: string;
};

export function getCinqueTerreCuratedTours(): CinqueTerreCuratedTour[] {
 return [
 {
 title: "Geführte Cinque Terre Tour",
 body: "Tagesausflug mit Guide – spart Orientierung an heissen Tagen.",
 href: buildGetYourGuideLink("Cinque Terre Tagesausflug"),
 linkLabel: "Touren auf GetYourGuide",
 },
 {
 title: "Boot & Küste",
 body: "Bootstour ab La Spezia oder Monterosso – Panorama ohne Trail.",
 href: buildGetYourGuideLink("Cinque Terre Boot"),
 linkLabel: "Bootstouren",
 },
 {
 title: "Pesto-Kurs & Food",
 body: "Ligurische Küche – Genova oder La Spezia, gut bei Regen.",
 href: buildGetYourGuideLink("Pesto Kurs Ligurien"),
 linkLabel: "Food-Erlebnisse",
 },
 ];
}

export function buildCinqueTerreGoogleMapsRouteUrl(): string {
 const pois = CINQUE_TERRE_MAP_POIS_DETAILED;
 if (pois.length < 2) return "https://www.google.com/maps/search/Porto+Venere+Italien";
 const origin = `${pois[0].lat},${pois[0].lng}`;
 const destination = `${pois[pois.length - 1].lat},${pois[pois.length - 1].lng}`;
 const waypoints = pois
 .slice(1, -1)
 .map((p) => `${p.lat},${p.lng}`)
 .join("|");
 const params = new URLSearchParams({
 api: "1",
 origin,
 destination,
 travelmode: "walking",
 });
 if (waypoints) params.set("waypoints", waypoints);
 return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export type CinqueTerreVenueTip = {
 name: string;
 subtitle?: string;
 description: string;
 price?: string;
 duration?: string;
 href?: string;
 linkLabel?: string;
};

export const CINQUE_TERRE_CAR_ARRIVAL = {
 title: "Anreise mit dem Auto · Parken",
 intro:
 "In den **Cinque-Terre-Dörfern** gibt es kaum Parkplätze – wir stellen das Auto in **La Spezia** oder fahren direkt nach **Porto Venere** (klein, eng, begrenzte Parkhäuser). Von dort: Bus, Zug oder Fähre.",
 warnings: [
 "SS163 ist spektakulär, aber **eng und langsam** – nicht als Zeitplan-Basis.",
 "GPS «Cinque Terre» führt oft in Sackgassen – Ziel konkret: **Porto Venere** oder **La Spezia Centrale**.",
 "Grosses Auto in der Altstadt: Stufen, enge Gassen – Koffer nur mit Mühe.",
 ],
 officialLabel: "Porto Venere · Tourismus",
 officialHref: CINQUE_TERRE_OFFICIAL_LINKS.portoVenereInfo,
 secondaryLinkLabel: "Trenitalia · Zugtickets",
 secondaryHref: CINQUE_TERRE_OFFICIAL_LINKS.trenitalia,
} as const;

export const CINQUE_TERRE_CAR_PARKING: CinqueTerreVenueTip[] = [
 {
 name: "Parken La Spezia",
 subtitle: "Unser Tipp mit Auto",
 description:
 "Parkhaus am Bahnhof · Zug in die Dörfer; Bus nach Porto Venere bei Übernachtung dort.",
 price: "ca. 10–18 € / Tag",
 duration: "Zug 10–20 Min.",
 href: CINQUE_TERRE_OFFICIAL_LINKS.trenitalia,
 linkLabel: "Zugfahrplan",
 },
 {
 name: "Parken Porto Venere",
 subtitle: "Direkt an der Basis",
 description:
 "Begrenzte Plätze oberhalb – früh ankommen; kein Auto in den Gassen.",
 price: "ca. 15–25 € / Tag",
 duration: "5–15 Min. zu Fuss",
 },
 {
 name: "Ohne Auto · Pisa/Genova",
 subtitle: "Entspannt",
 description:
 "Flughafen → Zug La Spezia → Bus Porto Venere – kein Parkstress.",
 price: "Zug ca. 10–15 €",
 duration: "ca. 1–1,5 h ab Pisa",
 },
];

export const CINQUE_TERRE_RAIN_ALTERNATIVES: CinqueTerreVenueTip[] = [
 {
 name: "Zug-Tour statt Trail",
 subtitle: "Trocken",
 description:
 "Alle fünf Dörfer von La Spezia aus anfahren, kurz pro Ort – ohne nassen Sentiero.",
 price: "Cinque Terre Card",
 duration: "ganzer Tag",
 href: CINQUE_TERRE_OFFICIAL_LINKS.cinqueTerreCardShop,
 linkLabel: "Card online kaufen",
 },
 {
 name: "Museo Navale · La Spezia",
 subtitle: "Indoor",
 description:
 "Maritime Geschichte – gut kombiniert mit Focaccia und Kaffee vor dem nächsten Versuch Wandern.",
 price: "ca. 5–8 €",
 duration: "ca. 1–2 Std.",
 },
 {
 name: "Trattoria & Pesto",
 subtitle: "Essen",
 description:
 "Lang Mittagessen in Porto Venere – Fischsuppe, trofie al pesto, dann erst wieder raus.",
 price: "ca. 25–35 €",
 duration: "2 Std.",
 },
 {
 name: "Galleria Civica · La Spezia",
 subtitle: "Kunst",
 description:
 "Überraschung unter Regen – kompakt, weniger bekannt als die Dörfer.",
 price: "ca. 6 €",
 duration: "ca. 1 Std.",
 },
];

export const CINQUE_TERRE_MUST_SEE_TRAILS: CinqueTerreVenueTip[] = [
 {
 name: "Via dell'Amore",
 subtitle: "Riomaggiore–Manarola",
 description:
 "Kürzester Klassiker – Status und Reservierung auf der Park-Website prüfen.",
 price: "je nach Phase",
 duration: "ca. 20 Min.",
 href: CINQUE_TERRE_OFFICIAL_LINKS.viaAmoreFruizione,
 linkLabel: "Via dell'Amore · Infos",
 },
 {
 name: "Vernazza → Monterosso",
 subtitle: "Sentiero Azzurro",
 description:
 "Unser Lieblingsabschnitt – Aussicht, dann Strand in Monterosso.",
 price: "in Card",
 duration: "ca. 2–2,5 Std.",
 href: CINQUE_TERRE_OFFICIAL_LINKS.trails,
 linkLabel: "Sentieri · Park",
 },
 {
 name: "Monterosso → Vernazza",
 subtitle: "Alternative Richtung",
 description:
 "Etwas steiler nach oben – weniger Menschen, wenn ihr früh startet.",
 price: "in Card",
 duration: "ca. 2 Std.",
 },
 {
 name: "Corniglia · Lardarina",
 subtitle: "382 Stufen",
 description:
 "Vom Bahnhof hoch ins Dorf – kein Trail, aber Workout. Danach Weinprobe.",
 price: "Zug in Card",
 duration: "ca. 15 Min. Stufen",
 },
];
