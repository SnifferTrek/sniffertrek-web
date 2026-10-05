/** SEO, FAQ – Côte d'Azur gestaffelte Nächte. */

export const COTE_DAZUR_META = {
  title:
    "Côte d'Azur in 5 Tagen: Nizza, Mougins, Plage Keller, Corniche d'Or, St-Tropez",
  description:
    "5 Nächte gestaffelt: Nizza, Mougins/Cannes, Region Saint-Tropez. Plage Keller, Corniche d'Or über Agay (rote Felsen, keine Autobahn), Port Grimaud, Grimaud, Ramatuelle – Rückfahrt Provence z. B. Route Napoléon.",
  seoSubtitle:
    "Reisebericht · 5 Nächte · Corniche d'Or, Agay, Keller, St-Tropez-Region",
  datePublished: "2026-07-22",
  dateModified: "2026-07-26",
} as const;

export const COTE_DAZUR_CLOSING =
  "Was bleibt: **Keller**, **Agay**, Ruhe in **Mougins**, **Grimaud** ohne Hafenlärm. Wer die Côte kennenlernen will, bleibt am Wasser. Die Provence – eigener Bericht.";

export const COTE_DAZUR_FAQ = [
  {
    question: "Wie sind die Übernachtungen aufgeteilt?",
    answer:
      "1 Nacht nahe Nizza, 2 Nächte Mougins oder Cannes, 2 Nächte Region Saint-Tropez.",
  },
  {
    question: "Was ist die Plage Keller?",
    answer:
      "Privater Strand mit Restaurant am Cap d'Antibes. Unser Highlight – Reservation, mittags nach Picasso Antibes.",
  },
  {
    question: "Warum nicht alles von Cannes aus?",
    answer:
      "Weil Grimaud und Ramatuelle als Tagesausflug Hetze sind. Zwei Nächte vor Ort fühlen sich wie Urlaub an.",
  },
  {
    question: "Anreise Auto oder Flug?",
    answer:
      "Beides: A8 aus Italien oder Flug Nizza plus Mietwagen. Vor Ort Küste statt Autobahn.",
  },
  {
    question: "Hotel de Mougins oder Cannes?",
    answer:
      "Mougins für Ruhe und Pool. Cannes, wenn ihr abends an der Croisette bleiben wollt.",
  },
  {
    question: "Was kommt nach der Riviera?",
    answer:
      "Unsere Provence-Route verbindet Avignon, Luberon, Aix und Verdon in sechs Tagen.",
    href: "/reisebericht/provence",
    linkLabel: "Provence-Route öffnen",
  },
] as const;

export const COTE_DAZUR_RELATED_LINKS = [
  {
    href: "/planer",
    label: "Reise planen im SnifferTrek-Planer",
    description: "Gestaffelte Nächte und Auto-Route selbst zusammenstellen.",
    type: "planer" as const,
  },
  {
    href: "/reisebericht/grandes-alpes",
    label: "Route des Grandes Alpes in 7 Tagen",
    description: "Von Genf über Iseran und Bonette nach Cannes – Pässe statt Autobahn.",
  },
  {
    href: "/reisebericht/provence",
    label: "Provence-Rundreise in 6 Tagen",
    description: "Nach der Riviera: Avignon, Luberon, Aix und Verdon.",
  },
  {
    href: "/reisebericht/cinque-terre",
    label: "Reisebericht: Cinque Terre in 4 Tagen",
    description: "Vor der Riviera – wenn ihr aus Italien weiterfahrt.",
  },
  {
    href: "/reisebericht/venedig",
    label: "Reisebericht: Venedig in 3 Tagen",
    description: "Norditalien vor dem Autoteilstück Richtung Frankreich.",
  },
] as const;

export function getCoteDazurRelatedLinks() {
  return COTE_DAZUR_RELATED_LINKS.map(({ href, label, description }) => ({
    href,
    label,
    description,
  }));
}
