import { asAppLocale, type AppLocale } from "@/lib/localeCopy";
import type { TripModule } from "@/lib/types";

export type AssistantCopy = {
  languageInstruction: string;
  todayContext: string;
  destination: string;
  dates: string;
  startPlace: string;
  airport: string;
  localCar: string;
  transportFlightOnly: string;
  transportOne: string;
  transportTwo: string;
  transportMany: string;
  transportOwnCar: string;
  transportRental: string;
  transportFlight: string;
  transportTrain: string;
  metaHandoff: string;
  openPlanner: string;
  openPlannerStrip: RegExp;
  readyHasPlanner: RegExp;
  routeReady: string;
  dayTripNote: string;
  readySummary: string;
  fromDate: string;
  routeStops: string;
  startLabel: string;
  modules: Record<string, string>;
  demoWelcome: string;
  demoUser: string;
  demoReady: string;
};

const de: AssistantCopy = {
  languageInstruction: "",
  todayContext:
    "Heute ist {today} (Zeitzone Europe/Zurich). Relativdaten wie «heute»/«morgen» immer auf dieses Datum beziehen. Aktueller Draft:\n{draft}",
  destination: "Wohin soll die Reise gehen?",
  dates: "Wann und wie lange möchtest du reisen?",
  startPlace: "Von wo startest du die Reise (Stadt oder Land)?",
  airport: "Von welchem Flughafen oder welcher Stadt fliegst du genau ab?",
  localCar: "Brauchst du vor Ort einen Mietwagen – oder kommt ihr ohne Auto aus?",
  transportFlightOnly:
    "Von {origin} nach {destination} kommt für die Anreise praktisch nur der Flug in Frage. Fliegst du hin?",
  transportOne: "Wie reist du von {origin} nach {destination} an – mit {option}?",
  transportTwo:
    "Wie reist du von {origin} nach {destination} an – mit {a} oder {b}?",
  transportMany:
    "Wie reist du von {origin} nach {destination} an – mit {head} oder {last}?",
  transportOwnCar: "eigenem Auto",
  transportRental: "Mietwagen",
  transportFlight: "Flug",
  transportTrain: "Zug",
  metaHandoff: "Wohin soll’s gehen – und ungefähr wann?",
  openPlanner: "Tippe unten auf «Im Planer öffnen».",
  openPlannerStrip:
    /\s*Tippe unten auf «(?:Planer mit Angaben öffnen|Im Planer öffnen)»\.?/gi,
  readyHasPlanner: /planer mit angaben|im planer öffnen|planer öffnen/i,
  routeReady:
    "Autoroute mit {n} Stopps: {names}.{dayNote} Fahrzeiten und km berechnet der Planer. {open}",
  dayTripNote: " Tagesausflug ohne Übernachtung – Hotel-Modul entfällt.",
  readySummary:
    "Perfekt – {summary}. Ich habe Module und Grunddaten vorbereitet; Route und Hotels planst du im Planer. {open}",
  fromDate: "ab {date}",
  routeStops: "{n} Stopps Autoroute",
  startLabel: "Start {place}",
  modules: {
    route: "Auto",
    flights: "Flug",
    hotels: "Unterkunft",
    poi: "Entdecken",
    bucket: "Bucket List",
    car: "Mietwagen",
    train: "Zug",
    esim: "eSIM",
    insurance: "Versicherung",
    cruise: "Kreuzfahrt",
    lastminute: "Last Minute",
    apartment: "Ferienwohnung",
    camping: "Camping",
    activities: "Aktivitäten",
    droneMaps: "Drohnenkarten",
  },
  demoWelcome:
    "Hallo! Ich stelle Module und Grunddaten für den SnifferTrek-Planer ein – Route, Hotels und Buchungen planst du dort selbst. Wohin soll’s gehen – und ungefähr wann?",
  demoUser: "Beispiel: Côte d’Azur, 5 Nächte ab Zürich – Flug und Mietwagen vor Ort.",
  demoReady:
    "Demo geladen: Côte d’Azur · Zürich → Nizza mit Flug, Mietwagen vor Ort, Hotels und Entdecken. Tippe unten auf «Im Planer öffnen» – oder starte neu für deine eigene Reise.",
};

const en: AssistantCopy = {
  languageInstruction:
    "LANGUAGE: The user-facing `reply` must be in English (informal, short, clear, no emojis). Keep JSON field names exactly as specified. Do not answer in German.",
  todayContext:
    "Today is {today} (timezone Europe/Zurich). Relative dates like “today”/“tomorrow” always refer to this date. Current draft:\n{draft}",
  destination: "Where should the trip go?",
  dates: "When and for how long would you like to travel?",
  startPlace: "Where are you starting from (city or country)?",
  airport: "Which airport or city are you flying from, exactly?",
  localCar: "Do you need a rental car on site – or will you manage without a car?",
  transportFlightOnly:
    "From {origin} to {destination}, flying is practically the only option. Are you flying there?",
  transportOne: "How will you travel from {origin} to {destination} – by {option}?",
  transportTwo:
    "How will you travel from {origin} to {destination} – by {a} or {b}?",
  transportMany:
    "How will you travel from {origin} to {destination} – by {head} or {last}?",
  transportOwnCar: "your own car",
  transportRental: "rental car",
  transportFlight: "plane",
  transportTrain: "train",
  metaHandoff: "Where should it go – and roughly when?",
  openPlanner: "Tap “Open in planner” below.",
  openPlannerStrip: /\s*Tap (?:below )?on? ?[“"](?:Open in planner|Open planner with details)[”"]\.?/gi,
  readyHasPlanner: /open in planner|open planner/i,
  routeReady:
    "Driving route with {n} stops: {names}.{dayNote} Driving times and km are calculated in the planner. {open}",
  dayTripNote: " Day trip without overnight stay – hotel module not needed.",
  readySummary:
    "Perfect – {summary}. I’ve prepared modules and basics; you plan the route and hotels in the planner. {open}",
  fromDate: "from {date}",
  routeStops: "{n} driving-route stops",
  startLabel: "Start {place}",
  modules: {
    route: "Car",
    flights: "Flight",
    hotels: "Stay",
    poi: "Discover",
    bucket: "Bucket list",
    car: "Rental car",
    train: "Train",
    esim: "eSIM",
    insurance: "Insurance",
    cruise: "Cruise",
    lastminute: "Last minute",
    apartment: "Apartment",
    camping: "Camping",
    activities: "Activities",
    droneMaps: "Drone maps",
  },
  demoWelcome:
    "Hi! I set modules and basics for the SnifferTrek planner – you plan the route, hotels and bookings there. Where should it go – and roughly when?",
  demoUser: "Example: Côte d’Azur, 5 nights from Zurich – flight and rental car on site.",
  demoReady:
    "Demo loaded: Côte d’Azur · Zurich → Nice with flight, rental car on site, hotels and Discover. Tap “Open in planner” below – or start over for your own trip.",
};

const es: AssistantCopy = {
  languageInstruction:
    "IDIOMA: El campo `reply` visible para el usuario debe estar en español (tuteo, breve, claro, sin emojis). Los nombres de campos JSON se quedan exactamente como están definidos. No respondas en alemán.",
  todayContext:
    "Hoy es {today} (zona horaria Europe/Zurich). Fechas relativas como «hoy»/«mañana» se refieren siempre a esta fecha. Borrador actual:\n{draft}",
  destination: "¿Adónde debe ir el viaje?",
  dates: "¿Cuándo y durante cuánto tiempo quieres viajar?",
  startPlace: "¿Desde dónde sales (ciudad o país)?",
  airport: "¿Desde qué aeropuerto o ciudad sales exactamente?",
  localCar: "¿Necesitas un coche de alquiler in situ, o os apañáis sin coche?",
  transportFlightOnly:
    "De {origin} a {destination} prácticamente solo cabe el avión. ¿Vuelas hasta allí?",
  transportOne: "¿Cómo viajas de {origin} a {destination} – en {option}?",
  transportTwo: "¿Cómo viajas de {origin} a {destination} – en {a} o {b}?",
  transportMany: "¿Cómo viajas de {origin} a {destination} – en {head} o {last}?",
  transportOwnCar: "coche propio",
  transportRental: "coche de alquiler",
  transportFlight: "avión",
  transportTrain: "tren",
  metaHandoff: "¿Adónde va el viaje – y más o menos cuándo?",
  openPlanner: "Pulsa abajo en «Abrir en el planificador».",
  openPlannerStrip:
    /\s*Pulsa abajo en «(?:Abrir en el planificador|Abrir el planificador con los datos)»\.?/gi,
  readyHasPlanner: /abrir en el planificador|abrir el planificador/i,
  routeReady:
    "Ruta en coche con {n} paradas: {names}.{dayNote} Tiempos y km los calcula el planificador. {open}",
  dayTripNote: " Excursión de un día sin noche – el módulo de hotel no hace falta.",
  readySummary:
    "Perfecto – {summary}. He preparado módulos y datos básicos; la ruta y los hoteles los planificas en el planificador. {open}",
  fromDate: "desde {date}",
  routeStops: "{n} paradas en coche",
  startLabel: "Salida {place}",
  modules: {
    route: "Coche",
    flights: "Vuelo",
    hotels: "Alojamiento",
    poi: "Descubrir",
    bucket: "Bucket list",
    car: "Coche de alquiler",
    train: "Tren",
    esim: "eSIM",
    insurance: "Seguro",
    cruise: "Crucero",
    lastminute: "Last minute",
    apartment: "Apartamento",
    camping: "Camping",
    activities: "Actividades",
    droneMaps: "Mapas de dron",
  },
  demoWelcome:
    "¡Hola! Preparo módulos y datos básicos para el planificador de SnifferTrek; la ruta, hoteles y reservas los planificas allí. ¿Adónde va el viaje – y más o menos cuándo?",
  demoUser: "Ejemplo: Côte d’Azur, 5 noches desde Zúrich – vuelo y coche de alquiler in situ.",
  demoReady:
    "Demo cargada: Côte d’Azur · Zúrich → Niza con vuelo, coche de alquiler in situ, hoteles y Descubrir. Pulsa abajo en «Abrir en el planificador» – o empieza de nuevo con tu propio viaje.",
};

export function getAssistantCopy(locale: string): AssistantCopy {
  const loc = asAppLocale(locale);
  if (loc === "en") return en;
  if (loc === "es") return es;
  return de;
}

export function assistantFill(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

export function assistantModuleLabel(moduleId: TripModule | string, locale: string): string {
  return getAssistantCopy(locale).modules[moduleId] || moduleId;
}

export type { AppLocale };
