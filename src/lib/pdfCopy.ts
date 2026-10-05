import { asAppLocale, type AppLocale } from "@/lib/localeCopy";

export type PdfCopy = {
  newTrip: string;
  noRouteDate: string;
  progressCover: string;
  progressToc: string;
  progressOverview: string;
  progressOverviewMap: string;
  progressHotels: string;
  progressFlights: string;
  progressDay: string;
  progressMaps: string;
  progressLogo: string;
  progressDone: string;
  cover: string;
  toc: string;
  overview: string;
  accommodations: string;
  flights: string;
  travelDate: string;
  totalDistance: string;
  totalDriveTime: string;
  stops: string;
  stages: string;
  hotels: string;
  hotelsBooked: string;
  routeOverview: string;
  dayN: string;
  kmHint: string;
  noHotels: string;
  guestsRooms: string;
  price: string;
  nr: string;
  night1: string;
  nightsN: string;
  outbound: string;
  returnFlight: string;
  flight: string;
  flightN: string;
  dep: string;
  arr: string;
  booking: string;
  waypoints: string;
  stopN: string;
  mapFail: string;
  etappeMapFail: string;
  extraText: string;
  entry: string;
  legs: string;
  discover: string;
  aiGenerated: string;
  sights: string;
  notes: string;
  printDate: string;
  page: string;
  legendRoute: string;
  legendHotel: string;
};

const de: PdfCopy = {
  newTrip: "Neue Reise",
  noRouteDate: "Reiseroute ohne Datum",
  progressCover: "Erstelle Deckblatt...",
  progressToc: "Erstelle Inhaltsverzeichnis…",
  progressOverview: "Erstelle Reiseübersicht...",
  progressOverviewMap: "Karte in Reiseübersicht…",
  progressHotels: "Erstelle Hotelliste...",
  progressFlights: "Erstelle Flugübersicht...",
  progressDay: "Tag {n} von {total}...",
  progressMaps: "Lade Karten...",
  progressLogo: "Lade Logo...",
  progressDone: "PDF erstellt!",
  cover: "Deckblatt",
  toc: "Inhaltsverzeichnis",
  overview: "Reiseübersicht",
  accommodations: "Unterkünfte",
  flights: "Flüge",
  travelDate: "Reisedatum",
  totalDistance: "Gesamtstrecke",
  totalDriveTime: "Gesamtfahrzeit",
  stops: "Stopps",
  stages: "Etappen",
  hotels: "Hotels",
  hotelsBooked: "Hotels gebucht",
  routeOverview: "Routenübersicht",
  dayN: "Tag {n}",
  kmHint: "Km-Angaben: Route im Planer unter Autoroute berechnen.",
  noHotels: "Keine Hotels geplant.",
  guestsRooms: "{guests} Pers., {rooms} Zi.",
  price: "Preis {value}",
  nr: "Nr {value}",
  night1: "1 Nacht",
  nightsN: "{n} Nächte",
  outbound: "Hinflug",
  returnFlight: "Rückflug",
  flight: "Flug",
  flightN: "Flug {n}",
  dep: "Ab {value}",
  arr: "An {value}",
  booking: "Buchung {value}",
  waypoints: "STOPPS",
  stopN: "Stopp {n}",
  mapFail: "Karte konnte nicht geladen werden.",
  etappeMapFail: "Karte für diese Etappe konnte nicht geladen werden.",
  extraText: "Zusatztext",
  entry: "Eintrag",
  legs: "Teilstrecken",
  discover: "Entdecken-Highlights",
  aiGenerated: "Text mit KI generiert",
  sights: "Wichtigste Sehenswürdigkeiten",
  notes: "Notizen",
  printDate: "Druckdatum {date}",
  page: "Seite {n} / {total}",
  legendRoute: "Route",
  legendHotel: "Hotel",
};

const en: PdfCopy = {
  newTrip: "New trip",
  noRouteDate: "Route without dates",
  progressCover: "Creating cover…",
  progressToc: "Creating table of contents…",
  progressOverview: "Creating trip overview…",
  progressOverviewMap: "Map in trip overview…",
  progressHotels: "Creating hotel list…",
  progressFlights: "Creating flight overview…",
  progressDay: "Day {n} of {total}…",
  progressMaps: "Loading maps…",
  progressLogo: "Loading logo…",
  progressDone: "PDF created!",
  cover: "Cover",
  toc: "Table of contents",
  overview: "Trip overview",
  accommodations: "Stays",
  flights: "Flights",
  travelDate: "Travel dates",
  totalDistance: "Total distance",
  totalDriveTime: "Total driving time",
  stops: "Stops",
  stages: "Stages",
  hotels: "Hotels",
  hotelsBooked: "Hotels booked",
  routeOverview: "Route overview",
  dayN: "Day {n}",
  kmHint: "Distances: calculate the route in the planner under Driving route.",
  noHotels: "No hotels planned.",
  guestsRooms: "{guests} guests, {rooms} rms",
  price: "Price {value}",
  nr: "No. {value}",
  night1: "1 night",
  nightsN: "{n} nights",
  outbound: "Outbound",
  returnFlight: "Return",
  flight: "Flight",
  flightN: "Flight {n}",
  dep: "Dep {value}",
  arr: "Arr {value}",
  booking: "Booking {value}",
  waypoints: "STOPS",
  stopN: "Stop {n}",
  mapFail: "Map could not be loaded.",
  etappeMapFail: "Map for this stage could not be loaded.",
  extraText: "Extra text",
  entry: "Entry",
  legs: "Legs",
  discover: "Discover highlights",
  aiGenerated: "Text generated with AI",
  sights: "Main sights",
  notes: "Notes",
  printDate: "Printed {date}",
  page: "Page {n} / {total}",
  legendRoute: "Route",
  legendHotel: "Hotel",
};

const es: PdfCopy = {
  newTrip: "Nuevo viaje",
  noRouteDate: "Ruta sin fechas",
  progressCover: "Creando portada…",
  progressToc: "Creando índice…",
  progressOverview: "Creando resumen del viaje…",
  progressOverviewMap: "Mapa en el resumen…",
  progressHotels: "Creando lista de hoteles…",
  progressFlights: "Creando resumen de vuelos…",
  progressDay: "Día {n} de {total}…",
  progressMaps: "Cargando mapas…",
  progressLogo: "Cargando logo…",
  progressDone: "¡PDF creado!",
  cover: "Portada",
  toc: "Índice",
  overview: "Resumen del viaje",
  accommodations: "Alojamientos",
  flights: "Vuelos",
  travelDate: "Fechas",
  totalDistance: "Distancia total",
  totalDriveTime: "Tiempo total de conducción",
  stops: "Paradas",
  stages: "Etapas",
  hotels: "Hoteles",
  hotelsBooked: "Hoteles reservados",
  routeOverview: "Resumen de la ruta",
  dayN: "Día {n}",
  kmHint: "Km: calcula la ruta en el planificador, pestaña Ruta en coche.",
  noHotels: "No hay hoteles previstos.",
  guestsRooms: "{guests} pers., {rooms} hab.",
  price: "Precio {value}",
  nr: "N.º {value}",
  night1: "1 noche",
  nightsN: "{n} noches",
  outbound: "Ida",
  returnFlight: "Vuelta",
  flight: "Vuelo",
  flightN: "Vuelo {n}",
  dep: "Sal {value}",
  arr: "Lleg {value}",
  booking: "Reserva {value}",
  waypoints: "PARADAS",
  stopN: "Parada {n}",
  mapFail: "No se pudo cargar el mapa.",
  etappeMapFail: "No se pudo cargar el mapa de esta etapa.",
  extraText: "Texto extra",
  entry: "Entrada",
  legs: "Tramos",
  discover: "Destacados de Descubrir",
  aiGenerated: "Texto generado con IA",
  sights: "Destacados",
  notes: "Notas",
  printDate: "Impreso {date}",
  page: "Página {n} / {total}",
  legendRoute: "Ruta",
  legendHotel: "Hotel",
};

export function getPdfCopy(locale: string): PdfCopy {
  const loc = asAppLocale(locale);
  if (loc === "en") return en;
  if (loc === "es") return es;
  return de;
}

export function pdfFill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

export function formatPdfDate(iso: string, locale: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const loc = asAppLocale(locale);
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  if (loc === "de") return `${dd}.${mm}.${y}`;
  return `${dd}/${mm}/${y}`;
}

export function formatPdfPrintDate(locale: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return asAppLocale(locale) === "de" ? `${d}.${m}.${y}` : `${d}/${m}/${y}`;
}

export type { AppLocale };
