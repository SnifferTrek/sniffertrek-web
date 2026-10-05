/** Zusatz-Inhalte: Eintrittsgebühr, kostenlos, Entscheidungshilfen, Touren, Saison. */

import { buildGetYourGuideLink } from "@/lib/affiliateLinks";
import { VENICE_MAP_POIS_DETAILED } from "@/lib/travelReports/veniceMapPois";
import { VENICE_OFFICIAL_LINKS } from "@/lib/travelReports/veniceOfficialLinks";

export const VENICE_ARTICLE_META = {
 dateModifiedLabel: "31. Mai 2026",
 priceStandLabel: "Preise Stand Mai 2026",
 experienceNote: "Reisebericht aus unserer Sicht · Venedig im April · 3 Tage in der Lagune",
} as const;

export const VENICE_AFFILIATE_DISCLOSURE =
 "Einige Links zu Booking.com, Hotels.com und Touren sind Affiliate-Links – bei einer Buchung erhalten wir ggf. eine Provision, für dich ohne Mehrkosten.";

export const VENICE_ENTRY_FEE = {
 title: "Touristen-Eintrittsgebühr & Anmeldung",
 /** PDF-Slot: ~1–2 Sätze */
 body: "An vielen Wochenenden April–Juli zahlen Tagesbesucher **5–10 €**. Mit Hotel in der Lagune: **keine Gebühr**, aber **Anmeldung** (QR) trotzdem Pflicht.",
 bullets: [
 "Vor Anreise auf dem Portal registrieren – QR aufs Handy",
 "Hotel in Venedig/Mestre: Gebühr weg, Befreiung trotzdem anmelden",
 "Nur festgelegte Tage · Kalender jährlich neu",
 ],
 officialLabel: "Zur offiziellen Anmeldung (cda.veneziaunica.it)",
 officialHref: VENICE_OFFICIAL_LINKS.entryFee,
 faqLabel: "FAQ & Kalender 2026",
 faqHref: VENICE_OFFICIAL_LINKS.entryFeeFaq,
} as const;

export type VeniceFreeActivity = {
 label: string;
 anchor: string;
 note?: string;
};

export const VENICE_FREE_ACTIVITIES: VeniceFreeActivity[] = [
 { label: "Gassen ohne Plan", anchor: "ankunft", note: "Verlaufen lassen" },
 { label: "Markusplatz & Riva", anchor: "ankunft" },
 { label: "Rialtobrücke", anchor: "morgen", note: "Früh am Markt" },
 { label: "Seufzerbrücke von aussen", anchor: "dogenpalast", note: "Ponte della Paglia" },
 { label: "Accademia-Brücke & Canal Grande", anchor: "morgen" },
 { label: "Zattere bei Sonnenuntergang", anchor: "inseln", note: "Salute gegenüber" },
 { label: "Salute-Basilika (Innenraum)", anchor: "tipps-aussicht", note: "Kuppel ca. 8 €" },
 { label: "Ghetto Nuovo", anchor: "inseln" },
];

export type VeniceGuideCard = {
 id: string;
 title: string;
 verdict: string;
 price: string;
 timing: string;
 tip: string;
 href?: string;
 linkLabel?: string;
};

export const VENICE_GUIDE_CARDS: VeniceGuideCard[] = [
 {
 id: "markusdom",
 title: "Markusdom – lohnt sich?",
 verdict: "Ja – Ticket online, nicht um Mittag.",
 price: "ca. 10 € · Terrasse extra",
 timing: "Mo–Sa 9:30–17:15 · So ab 14:00",
 tip: "Nachttour oder früher Einlass spart Gedränge.",
 href: VENICE_OFFICIAL_LINKS.sanMarcoTickets,
 linkLabel: "Offizielle Tickets",
 },
 {
 id: "gondel",
 title: "Gondel – lohnt sich?",
 verdict: "Selten privat – Traghetto oder Vaporetto reicht.",
 price: "privat ca. 90–110 € / 30 Min.",
 timing: "Traghetto 2–5 € · Linie 1 bei Dämmerung",
 tip: "Preis am Steg vorher klären.",
 },
 {
 id: "campanile-alt",
 title: "Aussicht ohne Campanile-Schlange",
 verdict: "San Giorgio oder Salute-Kuppel statt Campanile.",
 price: "Turm/Kuppel je ca. 8 €",
 timing: "Salute: stündlich, Mo/Di zu",
 tip: "Ticket für San Giorgio vorher kaufen.",
 href: VENICE_OFFICIAL_LINKS.sanGiorgioMaggiore,
 linkLabel: "San Giorgio Maggiore",
 },
];

export const VENICE_SEASON_ROWS = [
 { season: "Winter", months: "Dez–Feb", temp: "7–10 °C", crowd: "ruhig", note: "Karneval Feb. voll & teuer" },
 { season: "Frühling", months: "Mär–Jun", temp: "13–27 °C", crowd: "mittel", note: "April unser Favorit · Regen möglich" },
 { season: "Sommer", months: "Jul–Aug", temp: "bis 35 °C", crowd: "sehr voll", note: "AC im Hotel · Tickets vorab" },
 { season: "Herbst", months: "Sep–Nov", temp: "13–21 °C", crowd: "Okt noch voll", note: "Acqua alta Okt–Dez" },
] as const;

export type VeniceCuratedTour = {
 title: string;
 body: string;
 href: string;
 linkLabel: string;
};

export function getVeniceCuratedTours(): VeniceCuratedTour[] {
 return [
 {
 title: "Dogenpalast & Markusdom",
 body: "Skip-the-Line-Kombi – sinnvoll beim ersten Besuch.",
 href: buildGetYourGuideLink("Dogenpalast Venedig"),
 linkLabel: "Touren auf GetYourGuide",
 },
 {
 title: "Cicchetti & Street Food",
 body: "Geführter Rundgang mit Verkostung – Markt & Bacari.",
 href: buildGetYourGuideLink("Cicchetti Venedig"),
 linkLabel: "Food-Touren",
 },
 {
 title: "Murano & Burano",
 body: "Halbtagesausflug mit Guide – spart Orientierung auf den Inseln.",
 href: buildGetYourGuideLink("Murano Burano"),
 linkLabel: "Insel-Touren",
 },
 ];
}

/** Google Maps Route über unsere POIs (Fussweg-Hinweis). */
export function buildVeniceGoogleMapsRouteUrl(): string {
 const pois = VENICE_MAP_POIS_DETAILED;
 if (pois.length < 2) return "https://www.google.com/maps/search/Venedig+Italien";
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

export function buildVenicePoiListText(): string {
  return VENICE_MAP_POIS_DETAILED.map(
    (p) =>
      `${p.kind === "must" ? "Must" : "Nice"}: ${p.name} (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`,
  ).join("\n");
}

export type VeniceVenueTip = {
 name: string;
 subtitle?: string;
 description: string;
 price?: string;
 duration?: string;
 href?: string;
 linkLabel?: string;
};

export const VENICE_CAR_ARRIVAL = {
 title: "Anreise mit dem Auto · Parken",
 intro:
 "In der **historischen Altstadt** gibt es **keine Autos** – nur zu Fuss und mit dem Boot. Wir fahren deshalb bis **Piazzale Roma** (Bahnhof Santa Lucia) oder **Tronchetto** und gehen von dort mit Rollkoffer, People Mover oder Vaporetto weiter.",
 warnings: [
 "GPS auf «Venedig Zentrum» oder Hoteladresse in der Lagune führt oft in Sackgassen – Ziel: **Tronchetto** oder **Piazzale Roma**.",
 "ZTL & Bußgelder: ohne Ausweis/ Hotel-Genehmigung nicht in die roten Zonen der Altstadt fahren.",
 "Rollkoffer: vom Parkhaus bis zum Hotel kommen **viele Brücken** – Rucksack oder Hotel nahe Piazzale Roma / Bahnhof lohnt sich.",
 ],
 officialLabel: "Offizielle Parkinfos (AVM)",
 officialHref: VENICE_OFFICIAL_LINKS.parkingOverview,
 secondaryLinkLabel: "Autorimessa Piazzale Roma reservieren (PreParCo)",
 secondaryHref: VENICE_OFFICIAL_LINKS.parkingPreparco,
} as const;

/** Parken & letzte Meile – PDF: max. 3 Slots. */
export const VENICE_CAR_PARKING: VeniceVenueTip[] = [
 {
 name: "Tronchetto · Parkhaus",
 subtitle: "Unser Standard mit Auto",
 description:
 "Parkhaus am Festlandsteg · People Mover (ca. 3 Min.) nach Piazzale Roma, dann Vaporetto oder zu Fuss.",
 price: "ca. 23–29 € / 24 h",
 duration: "People Mover ca. 3 Min.",
 href: VENICE_OFFICIAL_LINKS.tronchettoParking,
 linkLabel: "Tronchetto Parking (offiziell)",
 },
 {
 name: "Piazzale Roma · Autorimessa",
 subtitle: "Am nächsten an Santa Lucia",
 description:
 "Stadtgarage vor der Lagune – teurer, praktisch bei abendlicher Ankunft ohne Mover.",
 price: "ca. 30–40 € / 24 h",
 duration: "0 Min. bis Santa Lucia",
 href: VENICE_OFFICIAL_LINKS.autorimessaPiazzaleRoma,
 linkLabel: "Autorimessa Comunale (AVM)",
 },
 {
 name: "Mestre · Park & Ride",
 subtitle: "Günstiger",
 description:
 "Auto am Festland · Zug in 10–15 Min. nach Santa Lucia – gut bei mehrtägigem Aufenthalt.",
 price: "Parken ab ca. 10 € + Zug",
 duration: "Zug 10–15 Min.",
 },
];

/** Plan B bei Regen – überwiegend indoor, wir-Form. */
export const VENICE_RAIN_ALTERNATIVES: VeniceVenueTip[] = [
 {
 name: "Dogenpalast & Museo Correr",
 subtitle: "San Marco",
 description:
 "Unser erster Regen-Plan: Palazzo Ducale und angrenzendes Museum – trocken, stundenfüllend, Ticket online buchen.",
 price: "ca. 30 € · Dogenpalast",
 duration: "ca. 2–3 Std.",
 href: VENICE_OFFICIAL_LINKS.muveTickets,
 linkLabel: "Tickets MUVE",
 },
 {
 name: "Scuola Grande di San Rocco",
 subtitle: "San Polo · Tintoretto",
 description:
 "Weniger Trubel als am Markusplatz – ganze Säle voller Tintoretto. Perfekt, wenn es draussen nass ist.",
 price: "ca. 10 €",
 duration: "ca. 45–60 Min.",
 href: VENICE_OFFICIAL_LINKS.scuolaSanRocco,
 linkLabel: "Offizielle Seite",
 },
 {
 name: "Gallerie dell'Accademia",
 subtitle: "Dorsoduro",
 description:
 "Venezianische Meister unter einem Dach – Zeitfenster für den Vitruvian-Mann oft separat reservieren.",
 price: "ca. 15 €",
 duration: "ca. 1–2 Std.",
 href: VENICE_OFFICIAL_LINKS.accademia,
 linkLabel: "Tickets Accademia",
 },
 {
 name: "Peggy Guggenheim Collection",
 subtitle: "Dorsoduro · Moderne",
 description:
 "Picasso, Dalí, Klee am Canal Grande – kompakt, übersehbar, Terrasse wenn der Regen nachlässt.",
 price: "ca. 18 €",
 duration: "ca. 1–1,5 Std.",
 href: VENICE_OFFICIAL_LINKS.guggenheim,
 linkLabel: "Museum buchen",
 },
 {
 name: "Teatro La Fenice",
 subtitle: "Führung mit Audioguide",
 description:
 "Opernhaus von innen – auch ohne Vorstellung ein starker Indoor-Moment.",
 price: "ca. 14–16 €",
 duration: "ca. 45 Min.",
 href: VENICE_OFFICIAL_LINKS.laFenice,
 linkLabel: "La Fenice",
 },
 {
 name: "Cicchetti & Markt indoor",
 subtitle: "Essen statt Schlechtwetter-Frust",
 description:
 "Wir ziehen von Bacaro zu Bacaro – All'Arco, Do Mori – oder buchen eine kleine Food-Tour.",
 price: "ca. 8–15 € pro Person",
 duration: "halber Tag",
 href: buildGetYourGuideLink("Cicchetti Venedig"),
 linkLabel: "Food-Touren",
 },
 {
 name: "Murano · Glasbläserei",
 subtitle: "Insel · Werkstatt",
 description:
 "Vaporetto rüber, in der Werkstatt zuschauen – trocken und authentischer als viele Souvenir-Läden in der Stadt.",
 price: "Fahrt + oft kostenlose Demo",
 duration: "halber Tag",
 },
];

/** Must-see Museen – PDF max. 4 Slots. */
export const VENICE_MUST_SEE_MUSEUMS: VeniceVenueTip[] = [
 {
 name: "Gallerie dell'Accademia",
 subtitle: "Must-see #1",
 description: "Bellini, Titian – oft der Vitruvian-Mann. Wichtigstes Kunstmuseum.",
 price: "ca. 15 €",
 duration: "1–2 Std.",
 href: VENICE_OFFICIAL_LINKS.accademia,
 linkLabel: "Tickets",
 },
 {
 name: "Dogenpalast (Palazzo Ducale)",
 subtitle: "Must-see #2",
 description: "Prunksäle & Seufzerbrücke – online buchen, sonst Schlange.",
 price: "ca. 30 €",
 duration: "2–3 Std.",
 href: VENICE_OFFICIAL_LINKS.muveTickets,
 linkLabel: "MUVE-Tickets",
 },
 {
 name: "Scuola Grande di San Rocco",
 subtitle: "Must-see #3",
 description: "Tintoretto in voller Länge – weniger voll als San Marco.",
 price: "ca. 10 €",
 duration: "45–60 Min.",
 href: VENICE_OFFICIAL_LINKS.scuolaSanRocco,
 linkLabel: "Infos",
 },
 {
 name: "Peggy Guggenheim Collection",
 subtitle: "Moderne · Dorsoduro",
 description: "Kompakt am Wasser – gut mit Zattere kombinieren.",
 price: "ca. 18 €",
 duration: "ca. 1 Std.",
 href: VENICE_OFFICIAL_LINKS.guggenheim,
 linkLabel: "Tickets",
 },
];
