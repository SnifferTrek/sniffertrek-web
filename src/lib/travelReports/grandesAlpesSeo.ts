/** SEO, FAQ – Route des Grandes Alpes Genf → Cannes. */

export const GRANDES_ALPES_META = {
  title: "Route des Grandes Alpes in 7 Tagen: Genf, Iseran, Bonette, Cannes",
  description:
    "7 Nächte von Genf nach Cannes: Megève, Val-d'Isère, Briançon, Guillestre, Barcelonnette, Saint-Martin-Vésubie. Iseran, Galibier, Izoard, Cime de la Bonette – Pässe statt Autobahn.",
  seoSubtitle: "Reisebericht · 7 Nächte · Genf → Cannes über die hohen Pässe",
  datePublished: "2026-09-16",
  dateModified: "2026-09-16",
} as const;

export const GRANDES_ALPES_CLOSING =
  "Was bleibt: **Roselend** am See, **Iseran** in der kühlen Luft, die **Casse Déserte**, die **Bonette-Schleife** – und **Cannes** erst, wenn die Beine die Berge hinter sich haben. Die Côte danach: eigener Bericht, nicht Tag 8.";

export const GRANDES_ALPES_FAQ = [
  {
    question: "Warum 7 Nächte statt 5 Tage?",
    answer:
      "Fünf Tage zwingen Iseran und Bonette in Hetze oder lassen Hotels in den Tälern aus. Sieben Nächte: ein Ort pro Abend, zwei schwere Passtage, eine kurze Queyras-Etappe dazwischen.",
  },
  {
    question: "Wann sind die Pässe offen?",
    answer:
      "Oft Mitte Juni bis Mitte September, je nach Schnee. Iseran, Galibier, Izoard und Bonette am Vorabend auf routedesgrandesalpes.com prüfen – nicht GPS-Autobahn als «offen» lesen.",
    href: "https://www.routedesgrandesalpes.com/",
    linkLabel: "Route des Grandes Alpes",
  },
  {
    question: "Start Genf oder Thonon?",
    answer:
      "Genf ist praktisch (Flug, Mietwagen). Die klassische Küsten-Variante startet am Genfersee bei Thonon/Évian – ein paar Kilometer extra, derselbe erste Passblock.",
  },
  {
    question: "Braucht man ein Auto?",
    answer:
      "Ja. Die Route ist eine Autofahrt über Pässe. Zug erreicht die Täler, nicht Iseran und Bonette in dieser Reihenfolge.",
  },
  {
    question: "Megève oder Grand-Bornand?",
    answer:
      "Megève hat mehr Hotels. Grand-Bornand liegt näher an Aravis/Colombière und ist oft ruhiger nach einer späten Genf-Ankunft.",
  },
  {
    question: "Val-d'Isère oder Séez?",
    answer:
      "Val-d'Isère spart am Iseran-Morgen Höhenmeter. Séez im Tal ist günstiger – 20–25 Minuten extra einplanen.",
  },
  {
    question: "Was kommt nach Cannes?",
    answer:
      "Wenn ihr die Küste länger wollt: unser Côte-d'Azur-Bericht mit Nizza, Mougins und der Region Saint-Tropez – nicht an denselben Tag hängen.",
    href: "/reisebericht/cote-dazur",
    linkLabel: "Côte d'Azur öffnen",
  },
] as const;

export const GRANDES_ALPES_RELATED_LINKS = [
  {
    href: "/planer",
    label: "Reise planen im SnifferTrek-Planer",
    description: "Sieben Hotelnächte und Pass-Stopps vorausfüllen.",
    type: "planer" as const,
  },
  {
    href: "/reisebericht/cote-dazur",
    label: "Côte d'Azur in 5 Nächten",
    description: "Nach Cannes: Nizza, Mougins, Corniche, Region Saint-Tropez.",
  },
  {
    href: "/reisebericht/provence",
    label: "Provence-Rundreise in 6 Tagen",
    description: "Alternative nach den Alpen: Avignon, Luberon, Verdon.",
  },
  {
    href: "/reisebericht/cinque-terre",
    label: "Cinque Terre in 4 Tagen",
    description: "Wenn die Anreise aus Ligurien kommt – vor Genf.",
  },
] as const;

export function getGrandesAlpesRelatedLinks() {
  return GRANDES_ALPES_RELATED_LINKS.map(({ href, label, description }) => ({
    href,
    label,
    description,
  }));
}
