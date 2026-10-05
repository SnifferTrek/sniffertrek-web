/** SEO, FAQ, Verlinkung – Barcelona-Reisebericht. */

import { BARCELONA_OFFICIAL_LINKS } from "@/lib/travelReports/barcelonaOfficialLinks";

export const BARCELONA_META = {
  title: "Barcelona in 4 Tagen: Reisebericht mit Flug, Metro & Gaudí-Tipps",
  description:
    "Barcelona in 4 Tagen ohne Mietauto: Reisebericht mit Sagrada Família, Park Güell, Barri Gòtic, El Born und Barceloneta. Anreise mit Flug, Metro-Tipps, Hotels und typische Fallen.",
  seoSubtitle: "Reisebericht · 4 Tage · Flug · Metro · Gaudí & Mittelmeer",
  datePublished: "2026-07-28",
  dateModified: "2026-07-28",
} as const;

export const BARCELONA_CLOSING =
  "Schönster Moment: **Plaça del Sol** in Gràcia nach dem Regen – keine Rambla, kein Auto, nur Cava und die Stadt unter uns. Genau dafür lohnt sich **Barcelona** zu Fuss.";

export const BARCELONA_FAQ = [
  {
    question: "Braucht man in Barcelona ein Mietauto?",
    answer:
      "Für einen 4-Tage-City-Trip nein. Metro, Bus und zu Fuss reichen. Parken ist teuer, das Zentrum ist für Autos unpraktisch.",
  },
  {
    question: "Wie komme ich vom Flughafen El Prat ins Zentrum?",
    answer:
      "Metro L9 Sud (günstig, mit Umsteigen) oder Aerobús nach Plaça Catalunya (ca. 7–8 €). Taxi Fixpreis ca. 35–45 € – Alternative: Uber oder Cabify (Preis in der App vorab).",
    href: BARCELONA_OFFICIAL_LINKS.aerobus,
    linkLabel: "Aerobús buchen / Infos",
  },
  {
    question: "Wie viele Tage braucht man für Barcelona?",
    answer:
      "Vier Tage sind ideal: Gòtic/Born, Sagrada & Eixample, Park Güell/Gràcia, Picasso & Strand. Mit drei Tagen fehlt meist ein Block.",
  },
  {
    question: "Wo übernachtet man am besten?",
    answer:
      "El Born, Eixample nahe Diagonal oder Gràcia – ruhiger als direkt an der Rambla. Eine Basis für alle vier Tage. Unten findest du unsere Hotel-Empfehlungen mit Booking.com-Suche.",
  },
  {
    question: "Muss man Sagrada Família vorab buchen?",
    answer:
      "Ja – ohne Online-Zeitfenster kein Einlass. Früh auf der offiziellen Seite buchen.",
    href: BARCELONA_OFFICIAL_LINKS.sagradaTickets,
    linkLabel: "Sagrada Família · Tickets buchen",
  },
  {
    question: "Lohnt sich Park Güell?",
    answer:
      "Ja, morgens im ersten Slot. Tickets für die besuchte Zone online – der freie Bereich drumherum reicht für einen ersten Eindruck.",
    href: BARCELONA_OFFICIAL_LINKS.parkGuellTickets,
    linkLabel: "Park Güell · Tickets buchen",
  },
  {
    question: "Welche Metro-Tickets lohnen sich?",
    answer:
      "T-Casual (10 Fahrten) für die meisten Trips. Hola BCN bei vielen Fahrten pro Tag. Flughafen-Zuschlag beachten.",
    href: BARCELONA_OFFICIAL_LINKS.tmbTickets,
    linkLabel: "TMB · Tickets & Fahrplan",
  },
  {
    question: "Ist Barceloneta touristisch?",
    answer:
      "Ja – Strand und Promenade sind voll. Essen eine Gasse landeinwärts, Liege am Strand optional.",
  },
  {
    question: "Wann ist die beste Reisezeit?",
    answer:
      "April–Juni und September–Oktober. Sommer heiss und voll; Winter mild und ruhiger.",
  },
  {
    question: "Was machen bei Regen?",
    answer:
      "Picasso-Museum, Palau de la Música, Casa Batlló oder Miró auf Montjuïc – Tickets online vorab.",
    href: BARCELONA_OFFICIAL_LINKS.picassoTickets,
    linkLabel: "Museu Picasso · Tickets",
  },
] as const;

export const BARCELONA_RELATED_LINKS = [
  {
    href: "/planer",
    label: "Im Planer anlegen",
    description: "Route als SnifferTrek-Reise speichern und weiterplanen.",
  },
  {
    href: "/reisebericht/venedig",
    label: "Venedig in 3 Tagen",
    description: "Lagune ohne Auto – ähnlich kompakt.",
  },
  {
    href: "/reisebericht/cinque-terre",
    label: "Cinque Terre",
    description: "Küste zu Fuss und mit Zug.",
  },
  {
    href: "/inspiration/paris",
    label: "Paris Inspiration",
    description: "Weitere Städte für den nächsten Trip.",
  },
];

export function getBarcelonaRelatedLinks() {
  return BARCELONA_RELATED_LINKS.map(({ href, label, description }) => ({
    href,
    label,
    description,
  }));
}
