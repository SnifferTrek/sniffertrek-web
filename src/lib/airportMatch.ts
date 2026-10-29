export type AirportRecord = {
  code: string;
  city: string;
  country: string;
  name: string;
};

/** Deutsche Stadtnamen / Orte ohne eigenen Flughafen → Listen-Stadt in airports.json */
const CITY_ALIASES: Record<string, string> = {
  genf: "geneva",
  mailand: "milan",
  rom: "rome",
  florenz: "florence",
  venedig: "venice",
  nizza: "nice",
  muenchen: "munich",
  munchen: "munich",
  koln: "cologne",
  koeln: "cologne",
  wien: "vienna",
  kopenhagen: "copenhagen",
  prag: "prague",
  warschau: "warsaw",
  bruessel: "brussels",
  brussel: "brussels",
  denhaag: "thehague",
  richterswil: "zurich",
  waedenswil: "zurich",
  wadenswil: "zurich",
  horgen: "zurich",
  thalwil: "zurich",
  rueschlikon: "zurich",
  ruschlikon: "zurich",
  rapperswil: "zurich",
  pfaffikon: "zurich",
  wollerau: "zurich",
  freienbach: "zurich",
  staefa: "zurich",
  stafa: "zurich",
  meilen: "zurich",
  kuesnacht: "zurich",
  kusnacht: "zurich",
  zollikon: "zurich",
  kilchberg: "zurich",
};

const CITY_DISPLAY: Record<string, string> = {
  zurich: "Zürich",
  geneva: "Genf",
  cologne: "Köln",
  munich: "München",
  vienna: "Wien",
  rome: "Rom",
  milan: "Mailand",
  florence: "Florenz",
  venice: "Venedig",
  nice: "Nizza",
  copenhagen: "Kopenhagen",
  prague: "Prag",
  warsaw: "Warschau",
  brussels: "Brüssel",
};

let catalog: AirportRecord[] | null = null;
let loadPromise: Promise<void> | null = null;

export function setAirportCatalog(airports: AirportRecord[]): void {
  catalog = Array.isArray(airports) ? airports : null;
}

export async function loadAirportCatalog(
  loader: () => Promise<AirportRecord[]>
): Promise<void> {
  if (catalog?.length) return;
  if (!loadPromise) {
    loadPromise = loader()
      .then((list) => {
        setAirportCatalog(list);
      })
      .catch(() => {
        loadPromise = null;
      });
  }
  await loadPromise;
}

export function getAirportCatalog(): AirportRecord[] | null {
  return catalog;
}

export function foldAirportKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ae/g, "a")
    .replace(/oe/g, "o")
    .replace(/ue/g, "u")
    .replace(/[^a-z0-9]+/g, "");
}

function titleCaseDe(value: string): string {
  return value
    .split(/(\s+|[-/])/)
    .map((part) => {
      if (!part || /^[\s\-/]$/.test(part) || /^\s+$/.test(part)) return part;
      return part.charAt(0).toLocaleUpperCase("de-CH") + part.slice(1);
    })
    .join("");
}

export function matchAirportFromQuery(query: string): AirportRecord | null {
  if (!catalog?.length) return null;
  const raw = query.trim().replace(/\s*\(([a-z]{3})\)\s*$/i, "").trim();
  if (raw.length < 2) return null;

  const nq = foldAirportKey(raw);
  if (nq.length < 2) return null;
  const alias = CITY_ALIASES[nq] || nq;

  const iataHit = catalog.find(
    (a) => a.code.toLowerCase() === raw.toLowerCase() || a.code.toLowerCase() === nq
  );
  if (iataHit) return iataHit;

  type Scored = { a: AirportRecord; score: number };
  const scored: Scored[] = [];
  for (const a of catalog) {
    const city = foldAirportKey(a.city);
    const name = foldAirportKey(a.name);
    if (a.code.toLowerCase() === nq) return a;
    if (city === alias || city === nq) scored.push({ a, score: 4 });
    else if (name === alias || name === nq) scored.push({ a, score: 3 });
    else if (nq.length >= 3 && (city.startsWith(nq) || city.startsWith(alias))) {
      scored.push({ a, score: 2 });
    } else if (
      nq.length >= 4 &&
      (name.includes(nq) || name.includes(alias))
    ) {
      scored.push({ a, score: 1 });
    }
  }
  if (scored.length === 0) return null;
  scored.sort((x, y) => y.score - x.score);
  const best = scored[0].score;
  const top = scored.filter((s) => s.score === best);
  if (top.length === 1) return top[0].a;

  const cities = new Set(top.map((t) => foldAirportKey(t.a.city)));
  if (cities.size === 1) {
    const intl = top.find((t) => /international/i.test(t.a.name));
    if (intl) return intl.a;
    return top[0].a;
  }
  return null;
}

export function formatAirportField(
  query: string,
  airport: AirportRecord
): string {
  const raw = query.trim().replace(/\s*\(([a-z]{3})\)\s*$/i, "").trim();
  const qKey = foldAirportKey(raw);
  const cityKey = foldAirportKey(airport.city);
  const nameKey = foldAirportKey(airport.name);
  const useTypedCity =
    qKey.length >= 3 &&
    (qKey === cityKey ||
      nameKey.includes(qKey) ||
      /[äöüÄÖÜ]/.test(raw));
  const city = useTypedCity
    ? titleCaseDe(raw)
    : CITY_DISPLAY[cityKey] || airport.city;
  return `${city} (${airport.code})`;
}

/** «zürich» → «Zürich (ZRH)» wenn in der Flughafenliste eindeutig. */
export function canonicalizeStartPlace(place: string): string {
  const t = place.trim();
  if (!t) return t;
  const hit = matchAirportFromQuery(t);
  if (hit) return formatAirportField(t, hit);
  const already = t.match(/^(.*)\(([A-Za-z]{3})\)\s*$/);
  if (already) {
    return `${titleCaseDe(already[1].trim())} (${already[2].toUpperCase()})`;
  }
  return titleCaseDe(t);
}
