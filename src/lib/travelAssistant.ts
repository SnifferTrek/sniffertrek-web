import type { Trip, TripModule } from "@/lib/types";
import { canonicalizeStartPlace } from "@/lib/airportMatch";
import { MODULE_CATALOG, MODULE_LABEL, sanitizeTripModules } from "@/lib/tripModuleCatalog";
import {
  assistantFill,
  assistantModuleLabel,
  getAssistantCopy,
} from "@/lib/assistantCopy";
import { createBarcelonaTrip } from "@/lib/travelReports/barcelonaPlaner";
import { createCinqueTerreTrip } from "@/lib/travelReports/cinqueTerrePlaner";
import { createCoteDazurTrip } from "@/lib/travelReports/coteDazurPlaner";
import { createGrandesAlpesTrip } from "@/lib/travelReports/grandesAlpesPlaner";
import { createProvenceTrip } from "@/lib/travelReports/provencePlaner";
import { createVeniceTrip } from "@/lib/travelReports/venicePlaner";

export type TravelAssistantRouteStop = {
  name: string;
  note?: string;
};

export type TravelAssistantDraft = {
  destination?: string | null;
  startPlace?: string | null;
  endPlace?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  /** Geordnete Stopps aus Freitext-Route (Start, Zwischen, Ziel). */
  routeStops?: TravelAssistantRouteStop[] | null;
  /** Nutzer hat bestätigt, dass kein Hotel nötig ist (Tagesausflug). */
  noHotelConfirmed?: boolean | null;
  modules?: TripModule[] | null;
  tripName?: string | null;
  relatedReport?: string | null;
  notes?: string | null;
  /** Mietwagen vor Ort nach Flug/Zug: true/false, null = noch nicht geklärt */
  localCar?: boolean | null;
};

export type TravelAssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

export type TravelAssistantApiResponse = {
  reply: string;
  draft: TravelAssistantDraft;
  ready: boolean;
  tips?: string[];
  error?: string;
};

const ACTIVE_MODULES = MODULE_CATALOG.filter((m) => m.active).map((m) => m.id);

export const TRAVEL_ASSISTANT_WELCOME =
  "Hallo! Ich stelle Module und Grunddaten für den SnifferTrek-Planer ein – Route, Hotels und Buchungen planst du dort selbst. Wohin soll’s gehen – und ungefähr wann?";

export const TRAVEL_ASSISTANT_SUBTITLE =
  "Module vorbereiten · keine eigene Reiseplanung";

export const TRAVEL_ASSISTANT_READY_HINT =
  "Module und Grunddaten sind vorbereitet. Route, Unterkünfte und Details planst du im Planer – dort auch die Reisedoku als PDF.";

export const TRAVEL_ASSISTANT_SYSTEM = `Du bist der SnifferTrek Reise-Assistent auf Deutsch (duzen, kurz, klar, keine Emojis).

Ziel: Den Nutzer mit wenigen gezielten Fragen so weit bringen, dass eine Reise im Planer vorbereitet werden kann.

WICHTIG – was du NICHT tust (ehrlich kommunizieren, wenn gefragt oder bei ready):
- Du planst keine komplette Reise, keine Hotelvorschläge und keine Buchungen.
- Du stellst Module ein (hotels, route, flights, car, train, poi, …) und Grunddaten (Ziel, Zeitraum, Startort, Anreise).
- Die eigentliche Planung passiert im SnifferTrek-Planer nach «Im Planer öffnen».
- Ausnahme: Bei bekannten Reiseberichten (Provence, Venedig, …) kann der Planer eine redaktionelle Routen-Vorlage laden – auch das ist keine individuelle KI-Planung.

ROUTE AUS FREITEXT – Wenn der Nutzer eine komplette Route / Autoreise / Tagesausflug mit Stopps beschreibt (z. B. «Autoreise von Siebnen – Siebnen via Landquart, Davos, Flüelapass, Pontresina, St. Moritz, Lenzerheide und zurück»):
- Setze draft.routeStops als geordnete Liste: [{name: "Siebnen"}, {name: "Landquart"}, {name: "Davos"}, …, {name: "Siebnen"}]
- Setze modules = ["route", "hotels", "poi"] (Autoroute – NICHT flights)
- Bei Rundreise (Start = Ende) ist startPlace === endPlace OK – NICHT nach Startort fragen
- destination = Region/Hauptziel (z. B. Engadin, St. Moritz), NICHT nur den Startort
- startPlace = erster Stopp, endPlace = letzter Stopp
- ready = true mit Zusammenfassung: «Autoroute mit X Stopps. Fahrzeiten und km berechnet der Planer.»
- Keine Rückfragen (Wohin?/Von wo?/Anreise?) wenn Start, Stopps und Rückkehr klar sind
- Keine km- oder Fahrzeitangaben machen – das macht Google im Planer
- Parenthesen-Notizen wie «(Mittagessen 12:00)» weglassen oder als note speichern

Was der Planer kann (bei Fragen wie «was kann ich damit machen?» kurz nennen, ready=false):
- Module: Unterkunft, Flug, Mietwagen, Autoroute/Zug, Entdecken (Sehenswürdigkeiten)
- Buchungen vergleichen und Buchungsinfos erfassen (z. B. gebuchte Flüge)
- Route und Etappen planen
- Ausdruck einer Reisedokumentation: Tab «Reisebericht» / PDF-Export mit Übersicht, Unterkünften, Flügen, Etappen, Karten und Fotos

SnifferTrek-Module (nur aktive IDs verwenden): ${ACTIVE_MODULES.join(", ")}
Bezeichnungen: ${ACTIVE_MODULES.map((id) => `${id}=${MODULE_LABEL[id] || id}`).join("; ")}

WICHTIG – Anreise → Module (nicht verwechseln!):
- Eigenes Auto / mit dem Auto fahren / Autoroute / PKW → modules MUSS "route" enthalten (Tab «Autoroute»). NICHT "car".
- Mietwagen / Auto mieten / rental → "car"
- Flug / fliegen → "flights"
- Zug / Bahn → "train"
- Unterkunft → "hotels" (meist dabei)
- Sehenswürdigkeiten / Tipps vor Ort → "poi"
- Mehrere Anreisen möglich: z.B. Flug + Mietwagen = ["flights","car","hotels","poi"]; nur eigenes Auto = ["route","hotels","poi",…]

Saint-Tropez, Nice, Cannes, Antibes, Monaco, Côte d'Azur → relatedReport "cote-dazur" und oft route oder car + hotels + poi.
Provence, Avignon, Gordes, Roussillon, Aix, Valensole, Verdon → relatedReport "provence" und bei eigenem Auto route + hotels + poi.
Grandes Alpes, Route des Grandes Alpes, Iseran, Galibier, Bonette, Megève, Briançon, Barcelonnette, Genf nach Cannes über Pässe → relatedReport "grandes-alpes" und route + hotels + poi (eigenes Auto oder Mietwagen).

Veröffentlichte Reiseberichte (Links vorschlagen wenn passend):
- venedig → /reisebericht/venedig
- cinque-terre → /reisebericht/cinque-terre
- barcelona → /reisebericht/barcelona
- cote-dazur → /reisebericht/cote-dazur
- provence → /reisebericht/provence
- grandes-alpes → /reisebericht/grandes-alpes

Ablauf (strikt nacheinander, maximal EINE Frage pro Antwort, ready=false bis alles klar):
1. Ziel/Region → draft.destination und draft.endPlace
2. Zeitraum (Daten oder Dauer). Relativdaten korrekt auflösen (heute/morgen = aktuelles Jahr!). «3 Wochen» = Enddatum berechnen.
3. Zuerst Startort fragen («Von wo startest du?») → draft.startPlace. NICHT destination kopieren. Vor der Anreise-Frage! Stadt gegen Flughafenliste abgleichen (z. B. zürich → Zürich (ZRH)).
4. Dann Anreise – NUR sinnvolle Optionen für Start→Ziel anbieten. Beispiel: Schweiz/Europa → Costa Rica/Übersee/Island = nur Flug (kein Zug, kein eigenes Auto für die Hinreise). Kleine CH-Orte (z. B. Richterswil) → Abflug Zürich (ZRH). Europa→Europa = Auto, Mietwagen, Flug, Zug je nach Distanz. Module NICHT erfinden. Nie dieselbe Frage zweimal in einer Antwort.
5. Bei flights und unklarem Flughafen (nur Land als startPlace): optional nach konkretem Abflughafen fragen.
6. Bei flights/train (ohne route): Nur nach Mietwagen vor Ort fragen, wenn der Nutzer Mietwagen/Mietauto NICHT schon genannt hat. Hat er «mietwagen» geschrieben → localCar=true, Modul car, KEINE Nachfrage.
7. ready=true NUR wenn: Ziel + Zeitraum + startPlace + Anreise klar + (flights/train: localCar gesetzt). Kurze Zusammenfassung. Nutzer auf «Im Planer öffnen» hinweisen. NIEMALS «Das sieht dann so aus:».

Regeln:
- Maximal eine klare Frage pro Antwort, ausser Zusammenfassung am Ende
- ready=false solange eine Pflichtfrage offen ist – auch wenn Ziel und Daten schon klar sind
- Meta-Fragen (Funktionen, Hilfe, «was kann der Planer»): kurz informativ antworten inkl. PDF-Reisedokumentation, ready=false, KEIN «Planer öffnen». Am Ende immer zurück zur Planung: die nächste offene Pflichtfrage stellen (z. B. «Wohin soll’s gehen?»)
- Transport-Module nur setzen wenn der Nutzer sie genannt hat – und nur wenn sie für Start→Ziel sinnvoll sind
- Nie Zug oder eigenes Auto als Hinreise vorschlagen, wenn Start und Ziel auf verschiedenen Kontinenten liegen, Übersee oder Inseln ohne Landverbindung (Island)
- Hinreise «Flug» bedeutet NICHT automatisch «kein Mietwagen» – vor Ort separat klären
- startPlace = Abfahrt/Wohnort, endPlace/destination = Reiseziel
- Wenn Ziel nicht zu euren Berichten passt: ehrlich sagen und Planer + Module als Alternative
- Tipps zu Formularen/Planer nur wenn gefragt oder kurz am Ende
- Keine verbindlichen Preise, keine Buchungszusicherung – SnifferTrek ist Vermittler
- Datumsformat im Draft: YYYY-MM-DD, immer aktuelles/künftiges Jahr sofern nicht anders gesagt
- modules nur aus der aktiven Liste; hotels und poi (Entdecken) standardmässig dabei
- Antworte NUR als JSON-Objekt mit keys: reply (string), draft (object), ready (boolean), tips (string[] optional). draft.localCar nur true/false/null. draft.routeStops nur bei erkannter Freitext-Route: [{name:"Ort"}, …].`;

export function travelAssistantSystemPrompt(locale = "de"): string {
  const extra = getAssistantCopy(locale).languageInstruction;
  return extra ? `${extra}\n\n${TRAVEL_ASSISTANT_SYSTEM}` : TRAVEL_ASSISTANT_SYSTEM;
}

export function travelAssistantTodayMessage(
  today: string,
  draft: unknown,
  locale = "de"
): string {
  return assistantFill(getAssistantCopy(locale).todayContext, {
    today,
    draft: JSON.stringify(draft),
  });
}

export function todayIsoDate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return todayIsoDate(dt);
}

/** «heute» / «morgen» / Dauer aus dem Chat in YYYY-MM-DD auflösen. */
export function resolveDraftDatesFromConversation(
  draft: TravelAssistantDraft,
  conversationText: string,
  now = new Date()
): TravelAssistantDraft {
  const t = conversationText.toLowerCase();
  const today = todayIsoDate(now);
  let startDate = draft.startDate || null;
  let endDate = draft.endDate || null;

  if (/(\bheute\b|\btoday\b|\bhoy\b|\bab\s+sofort\b)/.test(t)) {
    startDate = today;
  } else if (/\b(morgen|tomorrow|mañana)\b/.test(t)) {
    startDate = addDaysIso(today, 1);
  } else if (!startDate) {
    const range = t.match(
      /\b(\d{1,2})\.\s*-\s*(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?\b/
    );
    const dm = t.match(
      /\b(?:vom|ab|am|tag)\s+(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?\b/
    );
    const bare = t.match(/\b(\d{1,2})\.(\d{1,2})\.?(?:\s|$)/);
    if (range) {
      const day = Number(range[1]);
      const endDay = Number(range[2]);
      const month = Number(range[3]);
      let year = range[4] ? Number(range[4]) : now.getFullYear();
      if (year < 100) year += 2000;
      if (year < now.getFullYear()) year = now.getFullYear();
      startDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      endDate = `${year}-${String(month).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
    } else if (dm) {
      const day = Number(dm[1]);
      const month = Number(dm[2]);
      let year = dm[3] ? Number(dm[3]) : now.getFullYear();
      if (year < 100) year += 2000;
      if (year < now.getFullYear()) year = now.getFullYear();
      const candidate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
        startDate = candidate;
      }
    } else if (bare) {
      const day = Number(bare[1]);
      const month = Number(bare[2]);
      let year = now.getFullYear();
      const candidate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
        startDate = candidate;
      }
    }
  }

  // Offensichtlich falsches Jahr in der Vergangenheit (z.B. KI setzt 2023)
  if (startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    const year = Number(startDate.slice(0, 4));
    if (year < now.getFullYear() - 0) {
      startDate = `${now.getFullYear()}${startDate.slice(4)}`;
    }
  }
  if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    const year = Number(endDate.slice(0, 4));
    if (year < now.getFullYear()) {
      endDate = `${now.getFullYear()}${endDate.slice(4)}`;
    }
  }

  // Dauer → Enddatum, wenn Start bekannt
  if (startDate && !endDate) {
    const weeks = t.match(/\b(\d{1,2})\s*(?:wochen?|weeks?|semanas?)\b/);
    const days = t.match(
      /\b(\d{1,3})\s*(?:tage?n?|tägig(?:e(?:r|en|es)?)?|days?|d[ií]as?)\b/
    );
    if (weeks) {
      endDate = addDaysIso(startDate, Number(weeks[1]) * 7);
    } else if (/\beine\s+woche\b|\ba\s+week\b|\buna\s+semana\b/.test(t)) {
      endDate = addDaysIso(startDate, 7);
    } else if (
      /\btagesausflug\b|\bday[\s-]?trip\b|\b1\s*tag\b|\b1\s*day\b|\b1\s*d[ií]a\b/.test(
        t
      )
    ) {
      endDate = startDate;
    } else if (days) {
      const n = Number(days[1]);
      endDate = n <= 1 ? startDate : addDaysIso(startDate, n - 1);
    }
  }

  return { ...draft, startDate, endDate };
}

const TRANSPORT_MODULES: TripModule[] = ["route", "car", "flights", "train"];

type TravelRegion = "europe" | "overseas" | "unknown";

/** Grobe Region für sinnvolle Anreise-Optionen. */
export function classifyTravelRegion(place: string): TravelRegion {
  const t = place
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!t.trim()) return "unknown";

  if (
    /costa\s*rica|panama|nicaragua|guatemala|honduras|belize|mexiko|mexico|usa\b|vereinigte\s+staaten|amerika|kanada|canada|brasilien|brazil|argentinien|chile|peru|kolumbien|ecuador|bolivien|venezuela|karibik|kuba|jamaika|dominikan|bahamas|thailand|vietnam|kambodscha|laos|myanmar|malaysia|indonesien|bali|singapur|philippines|philippinen|japan|china|korea|taiwan|hong\s*kong|indien|india|sri\s*lanka|nepal|maldive|dubai|abu\s*dhabi|qatar|oman|saudi|australien|australia|neuseeland|new\s*zealand|sudafrica|suedafrika|south\s*africa|kenia|kenya|tansania|tanzania|namibia|marokko|morocco|aegypten|egypt|tunesien|kapver|mauritius|seychellen|hawaii|florida|kalifornien|california|new\s*york|toronto|vancouver|miami|los\s*angeles|san\s*francisco|bangkok|phuket|tokyo|osaka|sydney|melbourne|island\b|iceland|reykjavik|keflavik|gronland|groenland|greenland/.test(
      t
    )
  ) {
    return "overseas";
  }

  if (
    /schweiz|zurich|zuerich|basel|genf|geneva|bern|luzern|winterthur|st\.?\s*gallen|richterswil|waedenswil|wadenswil|horgen|thalwil|osterreich|oesterreich|wien|salzburg|innsbruck|deutschland|berlin|muenchen|munich|hamburg|frankfurt|koln|koeln|stuttgart|frankreich|paris|lyon|marseille|italien|italy|rom|roma|mailand|milan|florenz|venedig|venice|venezia|cinque|amalfi|spanien|spain|barcelona|madrid|portugal|lisabon|lisbon|niederlande|amsterdam|belgien|bruessel|brussel|luxemburg|kroatien|griechenland|athen|norwegen|norway|oslo|tromso|tromsoe|nordkapp|schweden|stockholm|finnland|helsinki|danemark|daenemark|kopenhagen|polen|warschau|tschech|prag|ungarn|budapest|slowenien|slowakei|rumaenien|bulgarien|irland|dublin|london|england|schottland|wales|grossbritannien|vereinigtes\s+koenigreich|europa|europe|cote\s*d|azur|nizza|nice|cannes|antibes|monaco|menton|mallorca|ibiza|sardinien|sizilien|toskana|provence/.test(
      t
    )
  ) {
    return "europe";
  }

  return "unknown";
}

/** Inseln ohne praktikable Auto-/Zug-Hinreise aus Mitteleuropa. */
function isFlightOnlyDestination(place: string): boolean {
  const t = place
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return /island\b|iceland|reykjavik|keflavik|gronland|groenland|greenland/.test(
    t
  );
}

/** Sinnvolle Hinreise-Module für Start → Ziel (ohne lokalen Mietwagen). */
export function getFeasibleOutboundTransport(
  origin: string,
  destination: string
): TripModule[] {
  const destFlightOnly = isFlightOnlyDestination(destination);
  const originFlightOnly = isFlightOnlyDestination(origin);
  if (destFlightOnly !== originFlightOnly) {
    return ["flights"];
  }

  const o = classifyTravelRegion(origin);
  const d = classifyTravelRegion(destination);

  if (
    (o === "europe" && d === "overseas") ||
    (o === "overseas" && d === "europe") ||
    (o === "unknown" && d === "overseas") ||
    (o === "overseas" && d === "unknown")
  ) {
    return ["flights"];
  }

  if (o === "overseas" && d === "overseas") {
    return ["route", "car", "flights"];
  }

  return ["route", "car", "flights", "train"];
}

export function buildTransportQuestion(
  origin: string,
  destination: string,
  locale = "de"
): string {
  const copy = getAssistantCopy(locale);
  const opts = getFeasibleOutboundTransport(origin, destination);
  const labels: string[] = [];
  if (opts.includes("route")) labels.push(copy.transportOwnCar);
  if (opts.includes("car")) labels.push(copy.transportRental);
  if (opts.includes("flights")) labels.push(copy.transportFlight);
  if (opts.includes("train")) labels.push(copy.transportTrain);

  if (labels.length === 1 && labels[0] === copy.transportFlight) {
    return assistantFill(copy.transportFlightOnly, { origin, destination });
  }
  if (labels.length === 1) {
    return assistantFill(copy.transportOne, { origin, destination, option: labels[0] });
  }
  if (labels.length === 2) {
    return assistantFill(copy.transportTwo, {
      origin,
      destination,
      a: labels[0],
      b: labels[1],
    });
  }
  const last = labels[labels.length - 1];
  const head = labels.slice(0, -1).join(", ");
  return assistantFill(copy.transportMany, { origin, destination, head, last });
}

function hasUserConfirmedTransport(conversationText: string): boolean {
  return inferTransportModulesFromText(conversationText).length > 0;
}

function isLikelyCountryOnlyStart(place: string): boolean {
  return /^(schweiz|switzerland|deutschland|germany|oesterreich|österreich|austria|frankreich|france|italien|italy|spanien|spain|portugal|norwegen|norway|schweden|sweden|costa\s*rica|usa|amerika|europa|europe)$/i.test(
    place.trim()
  );
}

/** Meta-/Hilfe-Frage – nicht mit Pflichtfragen überschreiben. */
export function isMetaAssistantQuestion(conversationText: string): boolean {
  const last =
    conversationText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .pop() || "";
  const t = last.toLowerCase();
  if (!t || t.length > 160) return false;
  const aboutApp =
    /\b(app|planer|planificador|planner|sniffertrek|reiseplaner|das hier|ihr|euch|this)\b/.test(
      t
    );
  const asksHelpDe =
    /\b(was macht|was kann|was ist|für was|wozu|wie funktioniert|wie geht|erkläre|erklare|hilfe)\b/.test(
      t
    );
  const asksHelpEn =
    /\b(what (can|does|is)|how (does|do|can)|explain|help)\b/.test(t);
  const asksHelpEs =
    /\b(qu[eé] (puedo|puede|hace|es)|c[oó]mo funciona|ayuda|explica)\b/.test(t);
  return (
    ((asksHelpDe || asksHelpEn || asksHelpEs) && aboutApp) ||
    /^(hilfe|help|ayuda|was geht|was nun)\??$/.test(t)
  );
}

const DATE_HINT_RE =
  /\b(heute|morgen|today|tomorrow|hoy|mañana|\d+\s*tage?n?|\d+\s*days?|\d+\s*d[ií]as?|\d+\s*wochen?|\d+\s*weeks?|\d+\s*semanas?|eine\s+woche|a\s+week|una\s+semana|tagesausflug|day[\s-]?trip|januar|january|enero|februar|february|febrero|märz|maerz|march|marzo|april|abril|mai|may|mayo|juni|june|junio|juli|july|julio|august|agosto|september|septiembre|oktober|october|octubre|november|noviembre|dezember|december|diciembre|\d{1,2}\.\s*-\s*\d{1,2}\.\d{1,2}|tag\s+\d{1,2}\.\d{1,2}|\d{1,2}\.\d{1,2}\.?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/i;

export type ForcedQuestionId =
  | "destination"
  | "dates"
  | "startPlace"
  | "transport"
  | "airport"
  | "localCar";

/** Nächste Pflichtfrage – oder null wenn Planer bereit. */
export function getForcedNextQuestionId(
  draft: TravelAssistantDraft,
  conversationText: string,
  lastAssistantReply = ""
): ForcedQuestionId | null {
  const routeStops = draft.routeStops?.filter((s) => (s.name || "").trim()) || [];
  const isFreeTextRoute = routeStops.length >= 2;

  const destination = (draft.destination || draft.endPlace || "").trim();
  if (!destination && !isFreeTextRoute) {
    return "destination";
  }

  if (!draft.startDate && !/\b\d{4}-\d{2}-\d{2}\b/.test(conversationText)) {
    if (!DATE_HINT_RE.test(conversationText)) {
      return "dates";
    }
  }

  // Freitext-Autoroute: Start/Ziel/Anreise sind aus den Stopps klar
  if (isFreeTextRoute) {
    return null;
  }

  // Startort VOR Anreise
  const startPlace = (
    draft.startPlace ||
    inferStartPlaceFromConversation(conversationText, destination) ||
    ""
  ).trim();
  if (
    !startPlace ||
    normalizePlaceKey(startPlace) === normalizePlaceKey(destination)
  ) {
    return "startPlace";
  }

  const feasible = getFeasibleOutboundTransport(startPlace, destination);
  const modules = sanitizeTripModules(draft.modules) || [];
  const userTransport = inferTransportModulesFromText(
    conversationText,
    lastAssistantReply
  ).filter((m) => feasible.includes(m));

  const confirmedOk =
    userTransport.length > 0 && modules.some((m) => feasible.includes(m));

  if (!confirmedOk) {
    return "transport";
  }

  if (modules.includes("flights") && isLikelyCountryOnlyStart(startPlace)) {
    return "airport";
  }

  if (needsLocalCarDecision(modules)) {
    const local = resolveLocalCarPreference(
      draft,
      conversationText,
      lastAssistantReply
    );
    if (local === null) {
      return "localCar";
    }
  }

  return null;
}

export function formatForcedQuestion(
  id: ForcedQuestionId,
  draft: TravelAssistantDraft,
  conversationText: string,
  locale = "de"
): string {
  const copy = getAssistantCopy(locale);
  if (id === "transport") {
    const destination = (draft.destination || draft.endPlace || "").trim();
    const startPlace = (
      draft.startPlace ||
      inferStartPlaceFromConversation(conversationText, destination) ||
      ""
    ).trim();
    return buildTransportQuestion(startPlace, destination, locale);
  }
  if (id === "destination") return copy.destination;
  if (id === "dates") return copy.dates;
  if (id === "startPlace") return copy.startPlace;
  if (id === "airport") return copy.airport;
  return copy.localCar;
}

export function getForcedNextQuestion(
  draft: TravelAssistantDraft,
  conversationText: string,
  lastAssistantReply = "",
  locale = "de"
): string | null {
  const id = getForcedNextQuestionId(
    draft,
    conversationText,
    lastAssistantReply
  );
  if (!id) return null;
  return formatForcedQuestion(id, draft, conversationText, locale);
}

function isForcedQuestionId(value: string): value is ForcedQuestionId {
  return (
    value === "destination" ||
    value === "dates" ||
    value === "startPlace" ||
    value === "transport" ||
    value === "airport" ||
    value === "localCar"
  );
}

function forcedQuestionIdFromText(forced: string): ForcedQuestionId | null {
  if (isForcedQuestionId(forced)) return forced;
  for (const loc of ["de", "en", "es"] as const) {
    const c = getAssistantCopy(loc);
    if (forced === c.destination) return "destination";
    if (forced === c.dates) return "dates";
    if (forced === c.startPlace) return "startPlace";
    if (forced === c.airport) return "airport";
    if (forced === c.localCar) return "localCar";
    if (
      /how will you travel|wie reist du|c[oó]mo viajas|are you flying|fliegst du hin|vuelas hasta|praktisch nur der flug|solo cabe el avi[oó]n/i.test(
        forced
      )
    ) {
      return "transport";
    }
  }
  return null;
}

/** Ob die KI-Antwort die Pflichtfrage schon stellt (sonst ersetzen). */
export function replyAddressesForcedQuestion(
  reply: string,
  forced: string | ForcedQuestionId | null
): boolean {
  if (!forced) return false;
  const id = forcedQuestionIdFromText(String(forced));
  if (!id) return false;
  switch (id) {
    case "localCar":
      return /vor\s+ort.*mietwagen|mietwagen.*vor\s+ort|brauchst du.*mietwagen|ohne auto aus|rental car on site|need a (rental )?car|without a car|coche de alquiler|sin coche/i.test(
        reply
      );
    case "airport":
      return /flug|abflug|flughafen|von wo|stadt|airport|flying from|aeropuerto|vuelo/i.test(
        reply
      );
    case "transport":
      return /anreis|auto|flug|zug|mietwagen|wie reist|fliegst|how will you travel|travel from|c[oó]mo viajas|coche|avi[oó]n|tren|fly|flight|train/i.test(
        reply
      );
    case "startPlace":
      return /(?:von\s+wo|wo)\s+startest\s+du|where (?:are you|do you) start|desde d[oó]nde/i.test(
        reply
      );
    case "dates":
      return /wann|wie lange|datum|zeitraum|when|how long|dates|cu[aá]ndo|cu[aá]nto tiempo/i.test(
        reply
      );
    case "destination":
      return /wohin\s+(soll|geht)|welches ziel|reiseziel|where should|where (?:are you|do you) (?:go|want)|ad[oó]nde|destino/i.test(
        reply
      );
    default:
      return false;
  }
}

/** Draft ist genug für den Planer-Button. */
export function isDraftReadyForPlaner(
  draft: TravelAssistantDraft,
  _reply = "",
  conversationText = "",
  lastAssistantReply = ""
): boolean {
  return (
    getForcedNextQuestionId(draft, conversationText, lastAssistantReply) ===
    null
  );
}

export function needsLocalCarDecision(modules: TripModule[]): boolean {
  return (
    (modules.includes("flights") || modules.includes("train")) &&
    !modules.includes("route")
  );
}

/** Mietwagen vor Ort aus Draft + Chat ableiten. */
export function resolveLocalCarPreference(
  draft: TravelAssistantDraft,
  conversationText: string,
  lastAssistantReply = ""
): boolean | null {
  if (draft.localCar === true || draft.localCar === false) return draft.localCar;

  const t = conversationText.toLowerCase();
  if (
    /kein(en)?\s*mietwagen|ohne\s+mietwagen|ohne\s+auto\s+vor\s+ort|vor\s+ort\s+ohne|nicht\s+nötig|brauchen\s+(wir|ich)\s+(keinen|kein|nicht)|mietwagen\s*:\s*nein|\bnein\b[,.]?\s*(kein\s+)?mietwagen|kein\s+auto\s+vor\s+ort|no rental|without a (rental )?car|no car on site|sin (coche|alquiler)|no hace falta/.test(
      t
    )
  ) {
    return false;
  }

  // Nutzer hat Mietwagen/Mietauto im Text genannt (auch in Listen wie «Flug, mietwagen, Unterkunft»)
  if (
    /\bmiet(?:wagen|auto)\b|auto\s*mieten|autovermiet|rental\s*car|hire[\s-]?car|leihwagen|coche de alquiler|alquilar (un )?coche/.test(
      t
    )
  ) {
    return true;
  }

  // Kurze Ja/Nein-Antwort nur, wenn die letzte Assistenten-Frage Mietwagen meint
  const userLines = conversationText
    .split("\n")
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean);
  const last = userLines[userLines.length - 1] || "";
  const askedLocalCar =
    /mietwagen|rental car|hire car|coche de alquiler|without a car|sin coche|on site/i.test(
      lastAssistantReply
    );
  if (askedLocalCar && /^(ja|yes|s[ií]|klar|gerne|ok|okay|sure|vale)$/.test(last)) {
    return true;
  }
  if (askedLocalCar && /^(nein|no|nö|nee|ohne|sin)$/.test(last)) {
    return false;
  }
  if (
    /^mietwagen\.?$/.test(last) ||
    /^mit mietwagen\.?$/.test(last) ||
    /^rental car\.?$/.test(last) ||
    /^coche de alquiler\.?$/.test(last)
  ) {
    return true;
  }

  // car bereits in modules nach Anreise «nur Mietwagen» (ohne Flug) → kein separates localCar nötig
  const mods = sanitizeTripModules(draft.modules) || [];
  if (mods.includes("car") && !mods.includes("flights") && !mods.includes("train")) {
    return true;
  }

  return null;
}

function normalizePlaceKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/** Ende eines Ortsnamens nach «von/ab …» (Folgewort gehört nicht zum Namen). */
const START_PLACE_BOUNDARY =
  `(?=,|;|\\s+(?:nach|bis|vom|von|am|im|in|mit|für|fuer|und|ab|oder|aus|to|until|towards|hacia|hasta|para|\\d)|\\s*[–—-]|[.!?]|$)`;

/** «von Zürich», «ab Basel», «from Zurich», «desde Madrid» etc. als Start ableiten. */
export function inferStartPlaceFromConversation(
  text: string,
  destination?: string | null
): string | null {
  const vonAbRe = new RegExp(
    `\\b(?:von|ab|from|desde)\\s+([A-Za-zÄÖÜäöüß .'-]{2,40}?)${START_PLACE_BOUNDARY}`,
    "gi"
  );
  const candidates: string[] = [];
  for (const m of text.matchAll(vonAbRe)) {
    const place = m[1].trim().replace(/[,;!?]+$/, "");
    if (place.length < 2) continue;
    if (
      destination &&
      normalizePlaceKey(place) === normalizePlaceKey(destination)
    ) {
      continue;
    }
    if (/heute|morgen|today|tomorrow|hoy|mañana|auto|flug|zug|mietwagen|mietauto|hotel|flight|train|rental/i.test(place)) {
      continue;
    }
    candidates.push(place);
  }
  if (candidates.length > 0) {
    return candidates[candidates.length - 1];
  }

  const patterns = [
    /\bstart(?:ort|en)?\s*(?:ist|:)?\s*([A-Za-zÄÖÜäöüß .'-]{2,40})/i,
    /\b(?:wohne|wohne in|wohnen in|komme aus)\s+([A-Za-zÄÖÜäöüß .'-]{2,40})/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    const place = m[1].trim().replace(/[.!?]+$/, "");
    if (place.length < 2) continue;
    if (
      destination &&
      normalizePlaceKey(place) === normalizePlaceKey(destination)
    ) {
      continue;
    }
    if (/heute|morgen|today|tomorrow|hoy|mañana|auto|flug|zug|mietwagen|hotel|flight|train|rental/i.test(place)) continue;
    return place;
  }
  return null;
}

const ROUTE_STOP_NOISE =
  /^(und|dann|weiter|weiterfahrt|via|über|ueber|nach|bis|zurück|zurueck|hotel|mittagessen|abendessen|tag|tagesausflug|km|min|stunden?|h)$/i;

function cleanRouteStopName(raw: string): string | null {
  let s = raw
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b(?:mittagessen|abendessen|lunch|dinner)\b[^,]*/gi, " ")
    .replace(/\b\d{1,2}:\d{2}\b/g, " ")
    .replace(/\b\d+\s*(?:km|min|h|stunden?)\b/gi, " ")
    .replace(/\b(?:tag(?:esausflug)?|tagesausflug)\b.*$/i, " ")
    .replace(/[.]+\s*$/g, "")
    .replace(/^[\s,;:./–—→\-]+|[\s,;:./–—→\-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length < 2 || s.length > 48) return null;
  if (ROUTE_STOP_NOISE.test(s)) return null;
  if (/^\d+$/.test(s)) return null;
  // Häufige Tippfehler auf der Flüela-Route → geocodierbarer Ort
  if (/^hotel\s+in\s*lane$/i.test(s) || /^hotel\s+inland$/i.test(s)) {
    return "Hotel In Lain";
  }
  return s;
}

function splitRoutePlaceList(chunk: string): string[] {
  return chunk
    .split(/\s*(?:,|;|→|->|–|—|\bund\b|\bdann\b|\bweiter(?:fahrt)?(?:\s+nach)?\b|\bnach\b)\s*/i)
    .map((p) => cleanRouteStopName(p))
    .filter((p): p is string => Boolean(p));
}

/**
 * Freitext-Autoroute → geordnete Stopps (ohne KI).
 * Beispiele: «Siebnen → Landquart → Davos», «von Siebnen via A, B und zurück».
 */
export function parseRouteStopsFromConversation(
  text: string
): TravelAssistantRouteStop[] | null {
  const t = text.trim();
  if (!t || t.length < 12) return null;

  const looksLikeRoute =
    /autoreise|autoroute|auto[\s-]?reise|tagesausflug|via\b|über\b|ueber\b|→|->|zwischenziel|rundfahrt|rundreise/i.test(
      t
    ) ||
    (/\bvon\b.+\b(?:nach|bis)\b/i.test(t) &&
      /,/.test(t) &&
      /zurück|zurueck|wieder\s+zurück/i.test(t));

  if (!looksLikeRoute) return null;

  const stops: string[] = [];
  const pushUnique = (name: string, force = false) => {
    const key = normalizePlaceKey(name);
    const last = stops[stops.length - 1];
    if (!force && last && normalizePlaceKey(last) === key) return;
    stops.push(name);
  };

  // Pfeil-/Strich-Ketten: A → B → C
  const arrowParts = t.split(/\s*(?:→|->)\s*/);
  if (arrowParts.length >= 3) {
    for (const part of arrowParts) {
      const cleaned = cleanRouteStopName(part.split(/[,.]/)[0] || part);
      if (cleaned) pushUnique(cleaned);
    }
  }

  // «von X – Y» / «von X nach Y» als Start/Ende
  const round = t.match(
    /\bvon\s+([A-Za-zÄÖÜäöüß .'-]{2,40}?)\s*[–—-]\s*\1\b/i
  );
  const vonNach = t.match(
    /\bvon\s+([A-Za-zÄÖÜäöüß .'-]{2,40}?)\s+(?:nach|bis)\s+([A-Za-zÄÖÜäöüß .'-]{2,40}?)\b/i
  );
  let startName: string | null = null;
  let endName: string | null = null;
  if (round?.[1]) {
    startName = cleanRouteStopName(round[1]);
    endName = startName;
  } else if (vonNach) {
    startName = cleanRouteStopName(vonNach[1]);
    endName = cleanRouteStopName(vonNach[2]);
  } else {
    const vonOnly = t.match(
      new RegExp(
        `\\bvon\\s+([A-Za-zÄÖÜäöüß .'-]{2,40}?)${START_PLACE_BOUNDARY}`,
        "i"
      )
    );
    if (vonOnly?.[1]) startName = cleanRouteStopName(vonOnly[1]);
  }

  // Via-/über-Liste
  const viaMatch = t.match(
    /\b(?:via|über|ueber)\s+([\s\S]+?)(?=\s*(?:tag\s+\d|am\s+\d|\d{1,2}\.\d{1,2}|tagesausflug|$))/i
  );
  if (viaMatch?.[1]) {
    let viaChunk = viaMatch[1]
      .replace(/\bund\s+zurück(?:\s+nach\s+[A-Za-zÄÖÜäöüß .'-]+)?/gi, "")
      .replace(/\bzurück(?:\s+nach\s+[A-Za-zÄÖÜäöüß .'-]+)?/gi, "");
    // «Weiterfahrt nach X» schon in split
    for (const name of splitRoutePlaceList(viaChunk)) {
      pushUnique(name);
    }
  }

  // Explizites «zurück nach X»
  const back = t.match(
    /\bzurück(?:\s+nach)?\s+([A-Za-zÄÖÜäöüß'-]{2,40})(?:\s*[.,;]|$)(?:\s|$)/i
  );
  if (back?.[1]) {
    const b = cleanRouteStopName(back[1]);
    if (b) endName = b;
  } else if (/zurück|zurueck/i.test(t) && startName) {
    endName = startName;
  }

  if (stops.length === 0 && !startName) return null;

  const ordered: string[] = [];
  if (startName) ordered.push(startName);
  for (const s of stops) {
    if (
      ordered.length &&
      normalizePlaceKey(ordered[ordered.length - 1]) === normalizePlaceKey(s)
    ) {
      continue;
    }
    // Start nicht nochmal als ersten Via-Punkt
    if (
      ordered.length === 1 &&
      startName &&
      normalizePlaceKey(s) === normalizePlaceKey(startName)
    ) {
      continue;
    }
    ordered.push(s);
  }
  if (endName) {
    const last = ordered[ordered.length - 1];
    if (!last || normalizePlaceKey(last) !== normalizePlaceKey(endName)) {
      ordered.push(endName);
    }
  }

  if (ordered.length < 2) return null;
  return ordered.map((name) => ({ name }));
}

/** Destination-Label für Rundreisen / Mehrtagesrouten. */
export function inferDestinationFromRouteStops(
  stops: TravelAssistantRouteStop[]
): string {
  if (stops.length === 0) return "";
  const names = stops.map((s) => s.name);
  const startKey = normalizePlaceKey(names[0]);
  const mid = names.slice(1, -1).length
    ? names.slice(1, -1)
    : names.slice(1);
  // Bekannte Regionen bevorzugen
  for (const n of mid) {
    if (/engadin|st\.?\s*moritz|davos|lenzerheide|flüela|fluela/i.test(n)) {
      if (/engadin|st\.?\s*moritz/i.test(n)) return /st\.?\s*moritz/i.test(n) ? "Engadin" : n;
      if (/davos/i.test(n)) return "Davos / Engadin";
    }
  }
  if (mid.length >= 2) {
    const a = mid[Math.floor((mid.length - 1) / 2)];
    const b = mid[mid.length - 1];
    if (normalizePlaceKey(a) !== normalizePlaceKey(b)) return `${a} – ${b}`;
    return a;
  }
  if (mid.length === 1) return mid[0];
  const end = names[names.length - 1];
  if (normalizePlaceKey(end) === startKey) return `Rundfahrt ${names[0]}`;
  return end;
}

/** 1-Tages-Reise (Tagesausflug / gleicher Start- und End-Tag). */
export function isSingleDayTrip(draft: TravelAssistantDraft): boolean {
  if (draft.startDate && draft.endDate && draft.startDate === draft.endDate) return true;
  return false;
}

/**
 * Draft um lokal erkannte Freitext-Route ergänzen (routeStops, Start/Ziel, Autoroute).
 */
export function withParsedRouteStops(
  draft: TravelAssistantDraft,
  conversationText: string
): TravelAssistantDraft {
  const draftParsed =
    draft.routeStops?.length && draft.routeStops.length >= 2
      ? draft.routeStops
          .map((s) => ({
            name: cleanRouteStopName(s.name || "") || (s.name || "").trim(),
            note: s.note,
          }))
          .filter((s) => s.name.length >= 2)
      : null;
  const localParsed = parseRouteStopsFromConversation(conversationText);
  const parsed =
    localParsed && (!draftParsed || localParsed.length >= draftParsed.length)
      ? localParsed
      : draftParsed;

  if (!parsed || parsed.length < 2) return draft;

  const startPlace = parsed[0].name;
  const endPlace = parsed[parsed.length - 1].name;
  const destination =
    (draft.destination &&
      normalizePlaceKey(draft.destination) !== normalizePlaceKey(startPlace) &&
      draft.destination) ||
    inferDestinationFromRouteStops(parsed);

  const isDayTrip = isSingleDayTrip(draft);
  const modules = uniqueModules([
    "route",
    ...((sanitizeTripModules(draft.modules) || []).filter(
      (m) => m !== "flights" && m !== "train" && (isDayTrip ? m !== "hotels" : true)
    ) as TripModule[]),
    ...(isDayTrip ? [] : ["hotels" as TripModule]),
    "poi",
  ]);

  return {
    ...draft,
    routeStops: parsed,
    startPlace,
    endPlace,
    destination,
    modules,
  };
}

function dedupeRepeatedSentences(text: string): string {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const part of parts) {
    const key = part
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[.!?]+$/g, "");
    const prev = out[out.length - 1]
      ?.toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[.!?]+$/g, "");
    if (prev === key) continue;
    out.push(part);
  }
  return out.join(" ");
}

export function finalizeAssistantReply(
  reply: string,
  ready: boolean,
  locale = "de"
): string {
  const copy = getAssistantCopy(locale);
  let text = dedupeRepeatedSentences(reply.trim());
  // Abgeschnittene «Vorschau»-Formulierungen bereinigen
  text = text.replace(/\s*das sieht dann so aus\s*:?\s*$/i, "").trim();
  if (!ready) {
    text = text.replace(copy.openPlannerStrip, "").trim();
  } else if (!copy.readyHasPlanner.test(text)) {
    text = `${text}${text.endsWith(".") ? "" : "."} ${copy.openPlanner}`;
  }
  return text;
}

/**
 * KI-Antwort mit Draft abgleichen: redundante Fragen entfernen,
 * fehlende Pflichtfrage ergänzen (ChatGPT-ähnlicher Kontext statt starrer KI).
 */
export function reconcileAssistantReply(
  reply: string,
  draft: TravelAssistantDraft,
  conversationText: string,
  lastAssistantReply = "",
  ready: boolean,
  locale = "de"
): string {
  const copy = getAssistantCopy(locale);
  const destination = (draft.destination || draft.endPlace || "").trim();
  const startPlace = (
    draft.startPlace ||
    inferStartPlaceFromConversation(conversationText, destination) ||
    ""
  ).trim();

  let text = dedupeRepeatedSentences(reply.trim());

  if (
    startPlace &&
    /(?:von\s+wo|wo)\s+startest\s+du|where (?:are you|do you) start|desde d[oó]nde/i.test(
      text
    )
  ) {
    text = text
      .replace(/\s*(?:Von wo|Wo)\s+startest du[^.!?]*[.!?]?/gi, "")
      .replace(/\s*Where are you starting from[^.!?]*[.!?]?/gi, "")
      .replace(/\s*[¿]?Desde d[oó]nde sales[^.!?]*[.!?]?/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (text && !/[.!?]$/.test(text)) text = `${text}.`;
  }

  const localCarKnown =
    resolveLocalCarPreference(draft, conversationText, lastAssistantReply) !==
    null;
  if (localCarKnown) {
    text = text
      .replace(
        /\s*(?:Möchtest du|Brauchst du)(?: vor Ort)?(?: einen)? Mietwagen[^.!?]*[.!?]?/gi,
        ""
      )
      .replace(
        /\s*Do you need a rental car[^.!?]*[.!?]?/gi,
        ""
      )
      .replace(
        /\s*[¿]?Necesitas un coche de alquiler[^.!?]*[.!?]?/gi,
        ""
      )
      .replace(/\s{2,}/g, " ")
      .trim();
    if (text && !/[.!?]$/.test(text)) text = `${text}.`;
  }

  if (ready) {
    const summary = draftSummaryLine(draft, locale);
    if (draft.routeStops && draft.routeStops.length >= 2) {
      const names = draft.routeStops.map((s) => s.name).join(" → ");
      const dayNote = isSingleDayTrip(draft) ? copy.dayTripNote : "";
      return assistantFill(copy.routeReady, {
        n: draft.routeStops.length,
        names,
        dayNote,
        open: copy.openPlanner,
      });
    }
    if (
      summary &&
      /(?:von\s+wo|wo)\s+startest\s+du|where (?:are you|do you) start|desde d[oó]nde/i.test(
        reply
      ) &&
      !copy.readyHasPlanner.test(text)
    ) {
      return assistantFill(copy.readySummary, { summary, open: copy.openPlanner });
    }
    return text;
  }

  const forced = getForcedNextQuestion(
    draft,
    conversationText,
    lastAssistantReply,
    locale
  );
  if (forced && !replyAddressesForcedQuestion(text, forced)) {
    const base = text.replace(/[.!?]+$/, "").trim();
    text = base ? `${base}. ${forced}` : forced;
  }

  return text;
}

/**
 * Nach Meta-/Hilfe-Antwort zurück in die Planung leiten
 * (Pflichtfrage anhängen, nicht die FAQ überschreiben).
 */
export function withMetaPlanningHandoff(
  reply: string,
  conversationText: string,
  forced: string | null,
  locale = "de"
): string {
  if (!isMetaAssistantQuestion(conversationText)) return reply;

  const handoff = forced || getAssistantCopy(locale).metaHandoff;
  if (replyAddressesForcedQuestion(reply, handoff)) return reply;
  if (
    /wohin\s+soll|welches\s+ziel|und\s+wohin|von\s+wo\s+start|wann\s+und\s+wie\s+lange|where should|roughly when|ad[oó]nde|m[aá]s o menos cu[aá]ndo/i.test(
      reply
    )
  ) {
    return reply;
  }

  const base = reply.trim();
  const sep = /[.!?]$/.test(base) ? " " : ". ";
  return `${base}${sep}${handoff}`;
}

/** Demo-Draft Côte d’Azur – Assistent zeigt fertigen Plan ohne Tippen. */
export function getCoteDazurAssistantDemo(
  now = new Date(),
  locale = "de"
): {
  draft: TravelAssistantDraft;
  messages: TravelAssistantMessage[];
} {
  const copy = getAssistantCopy(locale);
  const startDate = addDaysIso(todayIsoDate(now), 14);
  const endDate = addDaysIso(startDate, 5);
  const draft: TravelAssistantDraft = {
    destination: "Côte d'Azur",
    endPlace: "Côte d'Azur",
    startPlace: "Zürich",
    startDate,
    endDate,
    modules: ["flights", "car", "hotels", "poi"],
    tripName: "Côte d'Azur",
    relatedReport: "cote-dazur",
    localCar: true,
    notes: "Demo-Beispiel: Flug ab Zürich, Mietwagen vor Ort.",
  };
  return {
    draft,
    messages: [
      {
        role: "assistant",
        content: copy.demoWelcome,
      },
      {
        role: "user",
        content: copy.demoUser,
      },
      {
        role: "assistant",
        content: copy.demoReady,
      },
    ],
  };
}

/** Aus Nutzertext Transport-Module ableiten (eigenes Auto ≠ Mietwagen). */
export function inferTransportModulesFromText(
  text: string,
  lastAssistantReply = ""
): TripModule[] {
  const t = text.toLowerCase();
  const out: TripModule[] = [];
  const wantsRental =
    /mietwagen|mietauto|auto\s*mieten|autovermiet|rental\s*car|hire[\s-]?car|leihwagen|coche de alquiler|alquilar (un )?coche/.test(
      t
    );
  const wantsOwnCar =
    /eigenes?\s+auto|mit\s+dem\s+auto|mit\s+unserem\s+auto|mit\s+auto\b|autoroute|autoreise|auto[\s-]?reise|autofahrt|selbst\s+gefahren|eigenwagen|\bpkw\b|auto\s+fahren|mit\s+dem\s+pkw|privatauto|eigenem\s+wagen|eigenem\s+auto|tagesausflug|own car|by car|driving|coche propio|en coche|con el coche/.test(
      t
    ) ||
    (/\bauto\b/.test(t) &&
      !wantsRental &&
      !/autobus|automat|autogramm/.test(t));

  if (wantsOwnCar) out.push("route");
  if (wantsRental) out.push("car");
  // Nicht «Tagesausflug» / «Ausflug» als Flug werten
  const flightProbe = t
    .replace(/\b(?:tages)?ausfl(?:ug|üge)e?n?\b/gi, " ")
    .replace(/\bday[\s-]?trip\b/gi, " ");
  if (
    /flug|fliegen|flughafen|airline|hinflug|flugzeug|fly|flight|plane|airplane|vuelo|avi[oó]n|volar/.test(
      flightProbe
    )
  ) {
    out.push("flights");
  }
  if (/\bzug\b|\bbahn\b|train\b|rail|\btren\b/.test(t)) out.push("train");

  // Kurzes «ja» auf «Fliegst du hin?» / nur-Flug-Frage
  const userLines = text
    .split("\n")
    .map((l) => l.trim().toLowerCase())
    .filter(Boolean);
  const last = userLines[userLines.length - 1] || "";
  if (
    /fliegst du hin|praktisch nur der flug|nur der flug|are you flying|only option|solo cabe el avi[oó]n|vuelas hasta/i.test(
      lastAssistantReply
    ) &&
    /^(ja|yes|s[ií]|klar|gerne|ok|okay|passt|genau|sure|vale)$/.test(last) &&
    !out.includes("flights")
  ) {
    out.push("flights");
  }

  return out;
}

function uniqueModules(list: TripModule[]): TripModule[] {
  const seen = new Set<string>();
  const out: TripModule[] = [];
  for (const m of list) {
    if (seen.has(m)) continue;
    seen.add(m);
    out.push(m);
  }
  return out;
}

/**
 * KI-Module mit Chat-Signalen korrigieren:
 * - Transport nur aus Nutzertext (KI darf flights/route/… nicht erfinden)
 * - Ungültige Hinreise (z. B. Zug nach Übersee) entfernen
 * - «eigenes Auto» → route (Autoroute), car entfernen wenn kein Mietwagen
 * - localCar true nach Flug/Zug → car ergänzen
 */
export function enrichModulesFromConversation(
  modules: TripModule[] | null | undefined,
  conversationText: string,
  draftHint?: Pick<
    TravelAssistantDraft,
    "localCar" | "startPlace" | "destination" | "endPlace"
  >,
  lastAssistantReply = ""
): TripModule[] {
  const base = sanitizeTripModules(modules) || [];
  const inferred = inferTransportModulesFromText(
    conversationText,
    lastAssistantReply
  );
  const t = conversationText.toLowerCase();
  const wantsRental =
    /mietwagen|mietauto|auto\s*mieten|autovermiet|rental\s*car|hire[\s-]?car|leihwagen|coche de alquiler|alquilar (un )?coche/.test(
      t
    );
  const wantsOwnCar = inferred.includes("route");

  const origin = (draftHint?.startPlace || "").trim();
  const destination = (
    draftHint?.destination ||
    draftHint?.endPlace ||
    ""
  ).trim();
  const feasible =
    origin && destination
      ? getFeasibleOutboundTransport(origin, destination)
      : TRANSPORT_MODULES;

  const nonTransport = base.filter((m) => !TRANSPORT_MODULES.includes(m));
  const inferredFeasible = inferred.filter((m) => feasible.includes(m));
  let next = uniqueModules([...nonTransport, ...inferredFeasible]);

  if (wantsOwnCar && !wantsRental && feasible.includes("route")) {
    next = next.filter((m) => m !== "car");
    if (!next.includes("route")) next = ["route", ...next];
  }

  next = next.filter(
    (m) => !TRANSPORT_MODULES.includes(m) || feasible.includes(m)
  );

  const local = resolveLocalCarPreference(
    { modules: next, localCar: draftHint?.localCar ?? null },
    conversationText,
    lastAssistantReply
  );
  if (local === true && !next.includes("car")) {
    next = [...next, "car"];
  }
  if (local === false && needsLocalCarDecision(next)) {
    next = next.filter((m) => m !== "car");
  }

  if (!next.includes("hotels") && (base.length > 0 || inferred.length > 0)) {
    next = [...next, "hotels"];
  }
  if (!next.includes("poi") && (base.length > 0 || inferred.length > 0)) {
    next = [...next, "poi"];
  }

  if (next.length === 0) return ["hotels", "poi"];
  return sanitizeTripModules(next) || next;
}

export function inferRelatedReport(text: string): string | null {
  const t = text.toLowerCase();
  if (
    /grandes?\s*alpes|route des grandes|iseran|galibier|bonette|izoard|megève|megeve|barcelonnette|guillestre|queyras|vésubie|vesubie|col de turini/.test(
      t
    )
  ) {
    return "grandes-alpes";
  }
  if (
    /provence|avignon|gordes|roussillon|aix[\s-]?en[\s-]?provence|valensole|moustiers|verdon|luberon/.test(
      t
    )
  ) {
    return "provence";
  }
  if (
    /saint[\s-]?tropez|st\.?\s*tropez|côte\s*d['’]?azur|cote\s*d['’]?azur|nizza|nice\b|cannes|antibes|monaco|menton|hyères|frejus/.test(
      t
    )
  ) {
    return "cote-dazur";
  }
  if (/venedig|venice|venezia/.test(t)) return "venedig";
  if (/cinque\s*terre|porto\s*venere|riomaggiore|manarola/.test(t)) {
    return "cinque-terre";
  }
  if (/barcelona/.test(t)) return "barcelona";
  return null;
}

export function mergeAssistantDraft(
  prev: TravelAssistantDraft,
  next: TravelAssistantDraft | null | undefined,
  conversationText = "",
  lastAssistantReply = ""
): TravelAssistantDraft {
  let merged: TravelAssistantDraft;
  if (!next) {
    if (!conversationText) return prev;
    const localCar = resolveLocalCarPreference(
      prev,
      conversationText,
      lastAssistantReply
    );
    const modules = enrichModulesFromConversation(
      prev.modules,
      conversationText,
      {
        localCar,
        startPlace: prev.startPlace,
        destination: prev.destination,
        endPlace: prev.endPlace,
      },
      lastAssistantReply
    );
    const related =
      prev.relatedReport || inferRelatedReport(conversationText) || null;
    merged = {
      ...prev,
      modules,
      relatedReport: related,
      localCar: localCar ?? prev.localCar ?? null,
    };
  } else {
    const localCar = resolveLocalCarPreference(
      {
        ...prev,
        ...next,
        localCar:
          prev.localCar === true || prev.localCar === false
            ? prev.localCar
            : null,
      },
      conversationText,
      lastAssistantReply
    );
    const modules = enrichModulesFromConversation(
      next.modules ?? prev.modules,
      conversationText,
      {
        localCar,
        startPlace: next.startPlace ?? prev.startPlace,
        destination: next.destination ?? prev.destination,
        endPlace: next.endPlace ?? prev.endPlace,
      },
      lastAssistantReply
    );
    const relatedReport =
      next.relatedReport ||
      prev.relatedReport ||
      inferRelatedReport(conversationText) ||
      null;

    merged = {
      destination: next.destination ?? prev.destination ?? null,
      // KI-Startort ignorieren – nur Chat + zuvor bestätigter Wert
      // (Freitext-Route setzt Start in withParsedRouteStops / finalizeMergedDraft)
      startPlace: prev.startPlace ?? null,
      endPlace: next.endPlace ?? prev.endPlace ?? null,
      startDate: next.startDate ?? prev.startDate ?? null,
      endDate: next.endDate ?? prev.endDate ?? null,
      routeStops:
        next.routeStops?.length && next.routeStops.length >= 2
          ? next.routeStops
          : prev.routeStops?.length && prev.routeStops.length >= 2
            ? prev.routeStops
            : null,
      modules,
      tripName: next.tripName ?? prev.tripName ?? null,
      relatedReport,
      notes: next.notes ?? prev.notes ?? null,
      localCar: localCar ?? prev.localCar ?? null,
    };
  }

  return finalizeMergedDraft(merged, conversationText, lastAssistantReply);
}

function finalizeMergedDraft(
  draft: TravelAssistantDraft,
  conversationText: string,
  lastAssistantReply: string
): TravelAssistantDraft {
  const placed = withInferredPlaces(
    resolveDraftDatesFromConversation(draft, conversationText),
    conversationText,
    lastAssistantReply
  );
  const localCar =
    resolveLocalCarPreference(placed, conversationText, lastAssistantReply) ??
    placed.localCar ??
    null;
  return {
    ...placed,
    localCar,
    modules: enrichModulesFromConversation(
      placed.modules,
      conversationText,
      {
        localCar,
        startPlace: placed.startPlace,
        destination: placed.destination,
        endPlace: placed.endPlace,
      },
      lastAssistantReply
    ),
  };
}

/** Startort (Abflug/Abfahrt/Autoroute) aus Chat + letzter Assistentenfrage. */
export function resolveStartPlacePreference(
  draft: TravelAssistantDraft,
  conversationText: string,
  lastAssistantReply = ""
): string | null {
  const destination = (draft.destination || draft.endPlace || "").trim();
  const inferred = inferStartPlaceFromConversation(conversationText, destination);
  if (inferred) return inferred;

  const askedStart =
    /von wo|abflug|flughafen|startort|startest du|fährst du.*\bab\b|welcher stadt|welchem flughafen|welche stadt|wo fliegst|wo fährst|stadt oder land|where are you starting|which airport|desde d[oó]nde|qu[eé] aeropuerto/i.test(
      lastAssistantReply
    );
  if (askedStart) {
    const userLines = conversationText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const last = userLines[userLines.length - 1] || "";
    const cleaned = last.replace(/[.!?]+$/, "").trim();
    if (
      cleaned.length >= 2 &&
      cleaned.length <= 48 &&
      !/,/.test(cleaned) &&
      !/^(ja|nein|yes|no|s[ií]|ok|okay|klar|gerne|flug|fliegen|zug|bahn|auto|mietwagen|mietauto|eigenes?\s+auto|flight|train|rental car|coche|avi[oó]n|tren)$/i.test(
        cleaned
      ) &&
      !/\b(flug|fliegen|mietwagen|mietauto|zug|bahn|unterkunft|hotel|autoroute|flight|rental|train|tren)\b/i.test(
        cleaned
      )
    ) {
      if (
        !destination ||
        normalizePlaceKey(cleaned) !== normalizePlaceKey(destination)
      ) {
        return cleaned;
      }
    }
  }

  const prev = (draft.startPlace || "").trim();
  if (
    prev &&
    (!destination || normalizePlaceKey(prev) !== normalizePlaceKey(destination))
  ) {
    return prev;
  }
  return null;
}

export function withInferredPlaces(
  draft: TravelAssistantDraft,
  conversationText: string,
  lastAssistantReply = ""
): TravelAssistantDraft {
  const withRoute = withParsedRouteStops(draft, conversationText);
  const destination = withRoute.destination || withRoute.endPlace || null;
  const startPlace =
    withRoute.routeStops?.[0]?.name ||
    resolveStartPlacePreference(
      withRoute,
      conversationText,
      lastAssistantReply
    );
  const endPlace =
    withRoute.routeStops?.[withRoute.routeStops.length - 1]?.name ||
    withRoute.endPlace ||
    withRoute.destination ||
    null;

  return {
    ...withRoute,
    destination,
    endPlace,
    startPlace: startPlace ? canonicalizeStartPlace(startPlace) : startPlace,
  };
}

export function applyDraftToTrip(
  trip: Trip,
  draft: TravelAssistantDraft,
  conversationText = ""
): Trip {
  const resolved = withInferredPlaces(
    resolveDraftDatesFromConversation(
      {
        ...draft,
        modules: enrichModulesFromConversation(
          draft.modules,
          conversationText,
          {
            localCar: draft.localCar,
            startPlace: draft.startPlace,
            destination: draft.destination,
            endPlace: draft.endPlace,
          }
        ),
      },
      conversationText
    ),
    conversationText
  );

  let modules =
    sanitizeTripModules(
      enrichModulesFromConversation(resolved.modules, conversationText, {
        localCar: draft.localCar,
        startPlace: resolved.startPlace,
        destination: resolved.destination,
        endPlace: resolved.endPlace,
      })
    ) ||
    enrichModulesFromConversation(draft.modules, conversationText, {
      localCar: draft.localCar,
      startPlace: resolved.startPlace,
      destination: resolved.destination,
      endPlace: resolved.endPlace,
    });

  if (resolved.routeStops?.length && !modules.includes("route")) {
    modules = ["route", ...modules];
  }

  if (isSingleDayTrip(resolved)) {
    modules = modules.filter((m) => m !== "hotels");
  }

  // Autoroute: Start nur setzen wenn bekannt – sonst leer lassen (Nutzer füllt A aus)
  const startName = (resolved.startPlace || "").trim();
  const endName = (resolved.endPlace || resolved.destination || "").trim();

  let stops: typeof trip.stops;
  let routeStops: typeof trip.stops;

  if (resolved.routeStops?.length) {
    const rs = resolved.routeStops;
    stops = rs.map((r, i) => ({
      id: `rs-${i}`,
      name: r.name,
      type: (i === 0 ? "start" : i === rs.length - 1 ? "end" : "stop") as "start" | "stop" | "end",
    }));
    routeStops = stops;
  } else {
    stops = trip.stops.map((s) => {
      if (s.type === "start") return { ...s, name: startName };
      if (s.type === "end" && endName) return { ...s, name: endName };
      return s;
    });

    routeStops = (trip.routes?.route?.stops || stops).map((s) => {
      if (s.type === "start") return { ...s, name: startName };
      if (s.type === "end" && endName) return { ...s, name: endName };
      return s;
    });
  }

  const relatedReport =
    resolved.relatedReport || inferRelatedReport(conversationText) || null;

  const noteParts = [
    resolved.notes?.trim(),
    relatedReport ? `Tipp Reisebericht: /reisebericht/${relatedReport}` : "",
  ].filter(Boolean);

  /** Bekannte Reiseberichte → volle Planer-Vorlage (Hotels/Route), nicht nur leere Felder. */
  const fromReportTemplate =
    relatedReport === "cote-dazur"
      ? createCoteDazurTrip()
      : relatedReport === "venedig"
        ? createVeniceTrip()
        : relatedReport === "cinque-terre"
          ? createCinqueTerreTrip()
          : relatedReport === "barcelona"
            ? createBarcelonaTrip()
            : relatedReport === "provence"
              ? createProvenceTrip()
              : relatedReport === "grandes-alpes"
                ? createGrandesAlpesTrip()
                : null;

  if (fromReportTemplate) {
    return {
      ...fromReportTemplate,
      startDate: resolved.startDate || fromReportTemplate.startDate || "",
      endDate: resolved.endDate || fromReportTemplate.endDate || "",
      notes: noteParts.length
        ? [fromReportTemplate.notes, ...noteParts].filter(Boolean).join("\n\n")
        : fromReportTemplate.notes,
    };
  }

  const tripName =
    (resolved.tripName || "").trim() ||
    (resolved.destination ? `Reise ${resolved.destination}` : trip.name);

  return {
    ...trip,
    name: tripName,
    startDate: resolved.startDate || trip.startDate || "",
    endDate: resolved.endDate || trip.endDate || "",
    modules,
    stops,
    routes: {
      ...(trip.routes || {}),
      route: {
        stops: routeStops,
        viaPoints: trip.routes?.route?.viaPoints || [],
        overviewPolyline: trip.routes?.route?.overviewPolyline,
      },
    },
    notes: noteParts.length
      ? [trip.notes, ...noteParts].filter(Boolean).join("\n\n")
      : trip.notes,
  };
}

export function draftSummaryLine(
  draft: TravelAssistantDraft,
  locale = "de"
): string {
  const copy = getAssistantCopy(locale);
  const parts: string[] = [];
  if (draft.destination) parts.push(draft.destination);
  if (draft.startDate && draft.endDate) {
    parts.push(
      draft.startDate === draft.endDate
        ? draft.startDate
        : `${draft.startDate} – ${draft.endDate}`
    );
  } else if (draft.startDate) {
    parts.push(assistantFill(copy.fromDate, { date: draft.startDate }));
  }
  if (draft.routeStops && draft.routeStops.length >= 2) {
    parts.push(assistantFill(copy.routeStops, { n: draft.routeStops.length }));
  } else if (draft.startPlace) {
    parts.push(assistantFill(copy.startLabel, { place: draft.startPlace }));
  }
  const mods = sanitizeTripModules(draft.modules);
  if (mods?.length) {
    parts.push(mods.map((m) => assistantModuleLabel(m, locale)).join(", "));
  }
  return parts.join(" · ");
}
