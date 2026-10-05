import { asAppLocale } from "@/lib/localeCopy";
import { TRAVEL_COUPLE } from "@/lib/travelCouple";

export type PrintAtlasCopy = {
  tag: string;
  overview: string;
  mustSees: string;
  quarters: string;
  transport: string;
  rhythm: string;
  freeAlmost: string;
  places: string;
  mapAlt: string;
  howManyDays: string;
  plan: string;
  onTheGo: string;
  practice: string;
  favorites: string;
  seasonOverview: string;
  season: string;
  months: string;
  temp: string;
  crowd: string;
  note: string;
  events: string;
  faq: string;
  appendix: string;
  stay: string;
  infoTitle: string;
  infoParagraphs: readonly string[];
};

const couple = TRAVEL_COUPLE.displayName;

const de: PrintAtlasCopy = {
  tag: "Reisebericht",
  overview: "Überblick",
  mustSees: "Must-sees",
  quarters: "Quartier",
  transport: "Transport",
  rhythm: "Rhythmus",
  freeAlmost: "Kostenlos & fast gratis",
  places: "Orte",
  mapAlt: "Karte mit Must-sees und Orten",
  howManyDays: "Wie viele Tage?",
  plan: "Plan",
  onTheGo: "Unterwegs",
  practice: "Praxis",
  favorites: "Lieblingsorte",
  seasonOverview: "Saisonüberblick",
  season: "Saison",
  months: "Monate",
  temp: "Temp.",
  crowd: "Andrang",
  note: "Notiz",
  events: "Events",
  faq: "FAQ",
  appendix: "Anhang",
  stay: "Unterkunft",
  infoTitle: "Info",
  infoParagraphs: [
    `Wir – ${couple} – sind viel unterwegs: rund 120 Tage im Jahr, oft mit Rucksack und ohne festes Programm.`,
    "Aus diesen Reisen sind Tipps wie dieser Bericht entstanden. Parallel bauen wir mit SnifferTrek eine Plattform, die anderen die Planung erleichtert: Route, Übernachtungen und Etappen an einem Ort – statt zehn offener Tabs. Zusatz: Reise ausdrucken oder als PDF mitnehmen – alles aus dem Planer.",
    "Manche Links auf dieser Seite sind Affiliate-Links. Wenn du darüber buchst, erhalten wir eine kleine Provision – für dich wird die Buchung dadurch nicht teurer. Dieses Zusatzeinkommen hilft uns, SnifferTrek weiterzuentwickeln und neue Reiseberichte zu schreiben.",
    "Wir sind auf eure Unterstützung angewiesen: ob durch eine Buchung, das Teilen eines Berichts oder einfach Feedback im Planer. Danke, dass ihr mit uns unterwegs seid.",
  ],
};

const en: PrintAtlasCopy = {
  tag: "Travel report",
  overview: "Overview",
  mustSees: "Must-sees",
  quarters: "Base",
  transport: "Transport",
  rhythm: "Pace",
  freeAlmost: "Free & almost free",
  places: "Places",
  mapAlt: "Map with must-sees and places",
  howManyDays: "How many days?",
  plan: "Plan",
  onTheGo: "On the road",
  practice: "Practical",
  favorites: "Favourite spots",
  seasonOverview: "Season overview",
  season: "Season",
  months: "Months",
  temp: "Temp.",
  crowd: "Crowds",
  note: "Note",
  events: "Events",
  faq: "FAQ",
  appendix: "Appendix",
  stay: "Stay",
  infoTitle: "Info",
  infoParagraphs: [
    `We – ${couple} – travel a lot: around 120 days a year, often with a backpack and no fixed programme.`,
    "Tips like this report grew out of those trips. In parallel we are building SnifferTrek, a platform that makes planning easier: route, stays and stages in one place – instead of ten open tabs. Extra: print the trip or take it as a PDF – all from the planner.",
    "Some links on this page are affiliate links. If you book through them, we receive a small commission – it does not make the booking more expensive for you. That extra income helps us develop SnifferTrek and write new travel reports.",
    "We rely on your support: a booking, sharing a report, or simply feedback in the planner. Thank you for travelling with us.",
  ],
};

const es: PrintAtlasCopy = {
  tag: "Crónica de viaje",
  overview: "Resumen",
  mustSees: "Imprescindibles",
  quarters: "Barrio",
  transport: "Transporte",
  rhythm: "Ritmo",
  freeAlmost: "Gratis y casi gratis",
  places: "Lugares",
  mapAlt: "Mapa con imprescindibles y lugares",
  howManyDays: "¿Cuántos días?",
  plan: "Plan",
  onTheGo: "En ruta",
  practice: "Práctica",
  favorites: "Sitios favoritos",
  seasonOverview: "Temporadas",
  season: "Temporada",
  months: "Meses",
  temp: "Temp.",
  crowd: "Afluencia",
  note: "Nota",
  events: "Eventos",
  faq: "FAQ",
  appendix: "Anexo",
  stay: "Alojamiento",
  infoTitle: "Info",
  infoParagraphs: [
    `Nosotros – ${couple} – viajamos mucho: unos 120 días al año, a menudo con mochila y sin programa fijo.`,
    "De esos viajes salen consejos como este reportaje. En paralelo construimos SnifferTrek, una plataforma que facilita planificar: ruta, noches y etapas en un solo sitio, en vez de diez pestañas. Extra: imprimir el viaje o llevarlo en PDF, todo desde el planificador.",
    "Algunos enlaces de esta página son de afiliados. Si reservas por ellos, recibimos una pequeña comisión; para ti la reserva no es más cara. Ese ingreso nos ayuda a desarrollar SnifferTrek y escribir nuevos reportajes.",
    "Contamos con vuestro apoyo: una reserva, compartir un reportaje o un comentario en el planificador. Gracias por viajar con nosotros.",
  ],
};

export function getPrintAtlasCopy(locale: string): PrintAtlasCopy {
  const loc = asAppLocale(locale);
  if (loc === "en") return en;
  if (loc === "es") return es;
  return de;
}
