import { asAppLocale } from "@/lib/localeCopy";
import {
  type WikiMediaProject,
  wikiIntroExtractUrls,
  wikiMediaHost,
  wikiOpenSearchUrls,
  wikiSummaryUrls,
  wikipediaLangsForLocale,
} from "@/lib/wikipediaLocale";

export type StopBriefResult = {
  description: string;
  photoUrl?: string;
  wikipediaTitle?: string;
  source: "wikivoyage" | "wikipedia" | "ai" | "none";
  briefSource?:
    | "wikivoyage-refined"
    | "wikivoyage"
    | "wikipedia-refined"
    | "wikipedia"
    | "ai";
  qualityHint?: string;
};

type WikiPageHit = {
  title: string;
  text?: string;
  photo?: string;
  lat?: number;
  lng?: number;
};

type ResolvedWikiBrief = {
  wikiRaw: string;
  photoUrl?: string;
  pageTitle: string;
  project: WikiMediaProject;
};

function normalizeDiscoveryText(text: string): string {
  return (text || "")
    .normalize("NFC")
    .replace(/\s*\[[^\]]{2,}\]\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanWikipediaText(text: string): string {
  return normalizeDiscoveryText(
    (text || "")
      .replace(/Vorlage:[^\n.?!]*/gi, " ")
      .replace(/\bWikidata\b/gi, " ")
      .replace(/\s*\/Wartung\/[^\n.?!]*/gi, " "),
  );
}

function isWeakWikipediaText(text?: string): boolean {
  const t = cleanWikipediaText(text || "").toLowerCase();
  if (!t) return true;
  if (t.includes("vorlage:") || t.includes("wikidata")) return true;
  if (t.includes("begriffsklärung") || t.includes("begriffsklarung")) return true;
  if (t.includes("disambiguation")) return true;
  return t.length < 80;
}

export function clampToApproxWords(text: string, maxWords = 100): string {
  const normalized = normalizeDiscoveryText(text);
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return normalized;
  const clipped = words.slice(0, maxWords).join(" ");
  const lastDot = clipped.lastIndexOf(".");
  if (lastDot > clipped.length * 0.5) return clipped.slice(0, lastDot + 1).trim();
  return `${clipped}…`;
}

function briefNameCandidates(name: string): string[] {
  const base = name.trim();
  if (!base) return [];
  const out = [base];
  const stripped = base
    .replace(
      /,?\s*(schweiz|switzerland|suisse|svizzera|deutschland|germany|österreich|austria|italien|italy|frankreich|france)\s*$/i,
      "",
    )
    .trim();
  if (stripped && stripped !== base) out.push(stripped);
  const firstPart = base.split(",")[0]?.trim();
  if (firstPart && firstPart !== base && !out.includes(firstPart)) out.push(firstPart);
  return out;
}

async function resolvePhotoForTitle(
  title: string,
  locale: string,
  wikiFallback: boolean,
  project: WikiMediaProject,
): Promise<string | undefined> {
  const page = await fetchSummaryByTitle(title, locale, wikiFallback, project);
  if (page?.photo) return page.photo;
  const thumbs = await fetchWikiMediaThumbs(title, locale, wikiFallback, project);
  return thumbs[0];
}

function normalizeWikiKey(value: string): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pickBestWikipediaTitle(query: string, titles: string[]): string | undefined {
  if (!titles.length) return undefined;
  const nq = normalizeWikiKey(query);
  if (!nq) return titles[0];
  const qTokens = nq.split(" ").filter(Boolean);
  let bestTitle: string | undefined;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const title of titles) {
    const nt = normalizeWikiKey(title);
    if (!nt) continue;
    const tTokens = nt.split(" ").filter(Boolean);
    const shared = tTokens.filter((t) => qTokens.includes(t)).length;
    const tokenRatio = qTokens.length ? shared / qTokens.length : 0;
    const contains = nt.includes(nq) ? 1 : 0;
    const score = (nt === nq ? 200 : 0) + contains * 80 + tokenRatio * 70;
    if (score > bestScore) {
      bestScore = score;
      bestTitle = title;
    }
  }
  if (bestScore < 20) return undefined;
  return bestTitle ?? titles[0];
}

function wikipediaAllowLangFallback(locale: string): boolean {
  const loc = asAppLocale(locale);
  return loc === "en";
}

/** Commons/Wikipedia-URL → Dateiname (für Dedup, unabhängig von Thumb-Größe). */
export function wikiImageDedupeKey(url: string): string {
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    const thumbMatch = path.match(/\/thumb\/(?:[^/]+\/){2}([^/]+)\//i);
    if (thumbMatch) return thumbMatch[1].toLowerCase();
    const fileMatch = path.match(/\/([^/]+\.(?:jpe?g|png|webp|gif))$/i);
    return (fileMatch?.[1] || path).toLowerCase();
  } catch {
    return (url || "").toLowerCase();
  }
}

function isLowValueWikiImage(url: string, title?: string): boolean {
  const hay = `${url} ${title || ""}`.toLowerCase();
  if (hay.includes(".svg")) return true;
  if (/flag|wappen|coat of arms|icon|logo|locator|banner|karte|map of|maps?\.|symbol/i.test(hay)) {
    return true;
  }
  return false;
}

function bestUrlFromMediaItem(item: {
  thumb?: { source?: string };
  srcset?: Array<{ src?: string }>;
  src?: string;
  title?: string;
}): string | undefined {
  const srcset = item?.srcset;
  if (Array.isArray(srcset) && srcset.length > 0) {
    for (let i = srcset.length - 1; i >= 0; i--) {
      const src = srcset[i]?.src;
      if (typeof src === "string" && src.startsWith("http")) return src;
    }
  }
  if (typeof item?.thumb?.source === "string" && item.thumb.source.startsWith("http")) {
    return item.thumb.source;
  }
  if (typeof item?.src === "string" && item.src.startsWith("http")) return item.src;
  return undefined;
}

function addUniquePhotoUrl(pool: string[], url: string | undefined, title?: string): void {
  if (!url || !url.startsWith("http") || isLowValueWikiImage(url, title)) return;
  const key = wikiImageDedupeKey(url);
  if (pool.some((u) => wikiImageDedupeKey(u) === key)) return;
  pool.push(url);
}

async function fetchWikiMediaThumbs(
  title: string,
  locale: string,
  allowLangFallback: boolean,
  project: WikiMediaProject,
): Promise<string[]> {
  const q = title.trim();
  if (!q) return [];
  const urls: string[] = [];
  for (const lang of wikipediaLangsForLocale(locale, allowLangFallback)) {
    try {
      const resp = await fetch(
        `https://${wikiMediaHost(project, lang)}/api/rest_v1/page/media-list/${encodeURIComponent(q)}`,
      );
      if (!resp.ok) continue;
      const data = await resp.json();
      const items = Array.isArray(data?.items) ? data.items : [];
      for (const item of items) {
        if (item?.type && item.type !== "image") continue;
        const itemTitle = typeof item?.title === "string" ? item.title : undefined;
        addUniquePhotoUrl(urls, bestUrlFromMediaItem(item), itemTitle);
      }
      if (urls.length > 0) break;
    } catch {
      /* next lang */
    }
  }
  return urls;
}

async function fetchCommonsImageUrls(search: string, limit = 12): Promise<string[]> {
  const term = search.trim();
  if (!term) return [];
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: term,
    gsrlimit: String(limit),
    prop: "imageinfo",
    iiprop: "url",
    iiurlwidth: "1200",
  });
  try {
    const resp = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
    if (!resp.ok) return [];
    const data = await resp.json();
    const pages = data?.query?.pages;
    if (!pages || typeof pages !== "object") return [];
    const out: string[] = [];
    for (const page of Object.values(pages) as Array<{
      title?: string;
      imageinfo?: Array<{ thumburl?: string; url?: string }>;
    }>) {
      const info = page?.imageinfo?.[0];
      addUniquePhotoUrl(out, info?.thumburl || info?.url, page?.title);
    }
    return out;
  } catch {
    return [];
  }
}

async function buildStopPhotoPool(
  pageTitle: string,
  locale: string,
  wikiFallback: boolean,
): Promise<string[]> {
  const pool: string[] = [];
  for (const project of ["wikivoyage", "wikipedia"] as WikiMediaProject[]) {
    const summary = await fetchSummaryByTitle(pageTitle, locale, wikiFallback, project);
    const thumbs = await fetchWikiMediaThumbs(pageTitle, locale, wikiFallback, project);
    addUniquePhotoUrl(pool, summary?.photo);
    for (const t of thumbs) addUniquePhotoUrl(pool, t);
  }
  return pool;
}

function pickPhotoFromPool(
  pool: string[],
  mode: "reload" | "alternate",
  currentPhotoUrl?: string,
  variantIndex?: number,
): { photoUrl?: string; variantIndex: number } {
  if (pool.length === 0) return { variantIndex: variantIndex ?? 0 };

  const currentKey = currentPhotoUrl ? wikiImageDedupeKey(currentPhotoUrl) : "";

  if (mode === "reload") {
    return { photoUrl: pool[0], variantIndex: 0 };
  }

  let startIdx = 0;
  if (currentKey) {
    const curIdx = pool.findIndex((u) => wikiImageDedupeKey(u) === currentKey);
    startIdx = curIdx >= 0 ? curIdx + 1 : (variantIndex ?? 0) + 1;
  } else {
    startIdx = (variantIndex ?? 0) + 1;
  }

  for (let step = 0; step < pool.length; step++) {
    const idx = (startIdx + step) % pool.length;
    const candidate = pool[idx];
    if (currentKey && wikiImageDedupeKey(candidate) === currentKey) continue;
    return { photoUrl: candidate, variantIndex: idx };
  }

  return { variantIndex: variantIndex ?? 0 };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function coordPromptLine(lat?: number, lng?: number): string {
  if (typeof lat !== "number" || typeof lng !== "number") return "";
  return `\nPosition des Routenstopps (WGS84, nur zur Einordnung / richtiger Artikel, keine neuen Fakten daraus): ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

async function fetchSummaryByTitle(
  title: string,
  locale: string,
  allowLangFallback: boolean,
  project: WikiMediaProject,
): Promise<WikiPageHit | null> {
  const q = title.trim();
  if (!q) return null;
  for (const url of wikiSummaryUrls(q, locale, allowLangFallback, project)) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();
      const resolvedTitle = (data?.title || q).toString().trim() || q;
      if (resolvedTitle.includes(":")) continue;
      const text =
        typeof data?.extract === "string" ? cleanWikipediaText(data.extract) : undefined;
      const photo =
        typeof data?.thumbnail?.source === "string" ? data.thumbnail.source : undefined;
      const lat = typeof data?.coordinates?.lat === "number" ? data.coordinates.lat : undefined;
      const lng = typeof data?.coordinates?.lon === "number" ? data.coordinates.lon : undefined;
      if ((text && !isWeakWikipediaText(text)) || photo) {
        return { title: resolvedTitle, text, photo, lat, lng };
      }
    } catch {
      /* next */
    }
  }
  return null;
}

async function fetchIntroByTitle(
  title: string,
  locale: string,
  allowLangFallback: boolean,
  project: WikiMediaProject,
): Promise<string | undefined> {
  const q = title.trim();
  if (!q) return undefined;
  for (const url of wikiIntroExtractUrls(q, locale, allowLangFallback, project)) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();
      const pages = data?.query?.pages;
      if (!pages || typeof pages !== "object") continue;
      const entries = Object.values(pages) as Array<{ extract?: unknown }>;
      const extract = cleanWikipediaText(
        (entries.find((e) => typeof e?.extract === "string")?.extract || "").toString(),
      );
      if (extract && !isWeakWikipediaText(extract)) return extract;
    } catch {
      /* next */
    }
  }
  return undefined;
}

async function openSearchTitles(
  query: string,
  locale: string,
  allowLangFallback: boolean,
  project: WikiMediaProject,
): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];
  const out: string[] = [];
  for (const url of wikiOpenSearchUrls(q, locale, allowLangFallback, project)) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();
      const titles = Array.isArray(data?.[1])
        ? data[1].map((t: unknown) => String(t || "").trim())
        : [];
      for (const title of titles) {
        if (title && !out.includes(title)) out.push(title);
      }
    } catch {
      /* next */
    }
  }
  return out;
}

function wikiTitleMatchesStopName(stopName: string, wikiTitle: string): boolean {
  const nq = normalizeWikiKey(stopName);
  const nt = normalizeWikiKey(wikiTitle);
  if (!nq || !nt) return false;
  if (nt === nq || nt.includes(nq) || nq.includes(nt)) return true;
  const qTokens = nq.split(" ").filter((t) => t.length >= 3);
  if (!qTokens.length) return false;
  const shared = qTokens.filter((t) => nt.includes(t)).length;
  return shared >= Math.min(2, qTokens.length) || (qTokens.length === 1 && shared === 1);
}

function isGenericStopLabel(name: string): boolean {
  const n = normalizeWikiKey(name);
  return !n || n === "poi" || n.endsWith(" poi") || n.includes("zwischenstopp");
}

async function geosearchHits(
  lat: number,
  lng: number,
  locale: string,
  allowLangFallback: boolean,
  project: WikiMediaProject,
  radiusM = 12_000,
  limit = 12,
): Promise<Array<{ title: string; distM: number }>> {
  const langs = wikipediaLangsForLocale(locale, allowLangFallback);
  const out: Array<{ title: string; distM: number }> = [];
  for (const lang of langs) {
    try {
      const url = `https://${wikiMediaHost(project, lang)}/w/api.php?action=query&list=geosearch&gscoord=${lat}%7C${lng}&gsradius=${radiusM}&gslimit=${limit}&format=json&origin=*`;
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();
      const hits = data?.query?.geosearch as Array<{ title?: string; dist?: number }> | undefined;
      if (!hits?.length) continue;
      for (const h of hits) {
        const title = (h.title || "").toString().trim();
        if (!title || out.some((x) => x.title === title)) continue;
        out.push({ title, distM: typeof h.dist === "number" ? h.dist : 99999 });
      }
      if (out.length) break;
    } catch {
      /* next lang */
    }
  }
  return out.sort((a, b) => a.distM - b.distM);
}

function pickGeosearchTitle(
  stopName: string,
  hits: Array<{ title: string; distM: number }>,
): string | undefined {
  if (!hits.length) return undefined;
  let best: { title: string; score: number } | undefined;
  for (const h of hits) {
    const nameMatch = wikiTitleMatchesStopName(stopName, h.title) ? 1 : 0;
    const distKm = h.distM / 1000;
    const score = nameMatch * 120 - distKm;
    if (!best || score > best.score) best = { title: h.title, score };
  }
  if (!best) return undefined;
  if (wikiTitleMatchesStopName(stopName, best.title)) return best.title;
  const nearest = hits[0];
  if (nearest && nearest.distM <= 1500) return nearest.title;
  return undefined;
}

async function titleByCoords(
  lat: number,
  lng: number,
  locale: string,
  allowLangFallback: boolean,
  project: WikiMediaProject,
  stopName = "",
): Promise<string | undefined> {
  const hits = await geosearchHits(lat, lng, locale, allowLangFallback, project);
  return pickGeosearchTitle(stopName, hits) ?? hits[0]?.title;
}

function travelBriefPrompts(
  lang: ReturnType<typeof asAppLocale>,
  placeName: string,
  raw?: string,
  coords?: { lat: number; lng: number },
) {
  const rules =
    lang === "de"
      ? [
          "Aufgabe: Aus dem Quellen-Rohstoff (Wikivoyage oder Wikipedia) einen knappen Ortstext für jemanden schreiben, der dort auf der Reise ankommt.",
          "Inhalt: Wenn im Rohstoff vorhanden, mindestens ein harter Fakt (Einwohnerzahl, Fläche, Lage oder vergleichbare Grösse) und ein prägendes historisches Detail oder Ereignis einbauen – nur wenn explizit im Rohstoff.",
          "Stil: klar, konkret, leicht essayistisch; danach Kurzporträt des Ortes (Stadtbild, Kultur, Besonderheit).",
          "Verboten: erfundene Zahlen oder Daten; Reisebüro-Klischees («beliebtes Reiseziel», «mediterranes Flair», «ideal für einen Zwischenstopp»); lange Absätze nur über Kanton, Land oder Region ohne Bezug zum Ort selbst.",
          "Länge: 95–110 Wörter, Fliesstext, keine Aufzählungen, keine Emojis, kein Werbeton.",
          "Faktenregel (streng): Nur Informationen aus dem Rohstoff. Keine neuen Personen, Daten oder Anekdoten erfinden. Unsicheres weglassen.",
          "Sprache: ausschließlich Deutsch.",
        ].join("\n")
      : lang === "es"
        ? "Reescribe material de Wikivoyage/Wikipedia: 95–105 palabras, solo hechos del texto fuente, sin inventar."
        : "Rewrite Wikivoyage/Wikipedia source: 95–105 words, facts only from source, no invention.";

  if (lang === "de") {
    if (raw) {
      return {
        system:
          "Du bist sachlicher Redakteur bei SnifferTrek. Du formulierst Wikivoyage-/Wikipedia-Inhalte um – ohne Halluzinationen. Wenn ein Fakt nicht im Rohstoff steht, darf er nicht im Text stehen.",
        user: `${rules}\n\nOrt: «${placeName}»${coordPromptLine(coords?.lat, coords?.lng)}\n\nQuellen-Rohstoff:\n${raw}`,
      };
    }
    return {
      system: "SnifferTrek Redaktion.",
      user: `${rules}\n\nOrt: «${placeName}»`,
    };
  }
  if (lang === "es" && raw) {
    return {
      system: "Editor SnifferTrek. Solo hechos del material fuente.",
      user: `${rules}\n\nLugar: «${placeName}»\n\nMaterial:\n${raw}`,
    };
  }
  if (raw) {
    return {
      system: "SnifferTrek editor. Facts only from source material.",
      user: `${rules}\n\nPlace: «${placeName}»\n\nSource material:\n${raw}`,
    };
  }
  return {
    system: "SnifferTrek travel editor.",
    user: `${rules}\n\nPlace: «${placeName}»`,
  };
}

async function pickOpenSearchTitleNearCoords(
  query: string,
  titles: string[],
  lat: number,
  lng: number,
  locale: string,
  allowLangFallback: boolean,
  project: WikiMediaProject,
  maxKm = 45,
): Promise<string | undefined> {
  const scored: Array<{ title: string; dist: number }> = [];
  for (const title of titles.slice(0, 8)) {
    const page = await fetchSummaryByTitle(title, locale, allowLangFallback, project);
    if (!page?.lat || !page?.lng) continue;
    const dist = haversineKm(lat, lng, page.lat, page.lng);
    if (dist <= maxKm) scored.push({ title: page.title, dist });
  }
  if (!scored.length) return undefined;
  scored.sort((a, b) => a.dist - b.dist);
  return scored[0]?.title;
}

async function callTravelBriefModel(
  placeName: string,
  language: string,
  raw: string,
  coords?: { lat: number; lng: number },
): Promise<string | undefined> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !raw.trim()) return undefined;
  const lang = asAppLocale(language);
  const prompts = travelBriefPrompts(lang, placeName, raw, coords);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_STOP_BRIEF_MODEL || "gpt-4o",
        messages: [
          { role: "system", content: prompts.system },
          { role: "user", content: prompts.user },
        ],
        temperature: 0.15,
        max_tokens: 450,
      }),
    });
    if (!response.ok) return undefined;
    const data = await response.json();
    const summary = (data?.choices?.[0]?.message?.content || "").toString().trim();
    return summary ? clampToApproxWords(summary, 110) : undefined;
  } catch {
    return undefined;
  }
}

async function refineWikipediaBrief(
  raw: string,
  placeName: string,
  language: string,
  coords?: { lat: number; lng: number },
): Promise<string | undefined> {
  const cleaned = clampToApproxWords(cleanWikipediaText(raw), 420);
  const refined = await callTravelBriefModel(placeName, language, cleaned, coords);
  if (refined) return refined;
  return clampToApproxWords(cleaned, 100);
}

async function resolveBriefFromProject(input: {
  name: string;
  locale: string;
  wikiFallback: boolean;
  coords?: { lat: number; lng: number };
  project: WikiMediaProject;
}): Promise<ResolvedWikiBrief | null> {
  const { name, locale, wikiFallback, coords, project } = input;
  let wikiRaw = "";
  let photoUrl: string | undefined;
  let pageTitle: string | undefined;

  const adoptWikiPage = async (title: string, maxDistKm?: number): Promise<boolean> => {
    const page = await fetchSummaryByTitle(title, locale, wikiFallback, project);
    if (!page) return false;
    if (
      maxDistKm != null &&
      coords &&
      typeof page.lat === "number" &&
      typeof page.lng === "number" &&
      haversineKm(coords.lat, coords.lng, page.lat, page.lng) > maxDistKm
    ) {
      return false;
    }
    const intro = await fetchIntroByTitle(page.title, locale, wikiFallback, project);
    const picked = cleanWikipediaText(intro || page.text || "");
    if (isWeakWikipediaText(picked)) return false;
    wikiRaw = picked;
    photoUrl = page.photo;
    pageTitle = page.title;
    return true;
  };

  const maxDist = coords ? 40 : undefined;
  if (!isGenericStopLabel(name)) {
    for (const candidate of briefNameCandidates(name)) {
      if (await adoptWikiPage(candidate, maxDist)) break;
    }
  }

  if (!wikiRaw) {
    for (const candidate of briefNameCandidates(name)) {
      const titles = await openSearchTitles(candidate, locale, wikiFallback, project);
      let best = pickBestWikipediaTitle(candidate, titles);
      if (coords && titles.length > 0) {
        const near = await pickOpenSearchTitleNearCoords(
          candidate,
          titles,
          coords.lat,
          coords.lng,
          locale,
          wikiFallback,
          project,
        );
        if (near) best = near;
      }
      if (best && (await adoptWikiPage(best, maxDist))) break;
    }
  }

  if (!wikiRaw && coords) {
    const hits = await geosearchHits(coords.lat, coords.lng, locale, wikiFallback, project);
    const ordered: string[] = [];
    const picked = pickGeosearchTitle(name, hits);
    if (picked) ordered.push(picked);
    for (const h of hits) {
      if (!ordered.includes(h.title)) ordered.push(h.title);
    }
    for (const title of ordered) {
      if (!wikiTitleMatchesStopName(name, title) && !isGenericStopLabel(name)) continue;
      const distCap = wikiTitleMatchesStopName(name, title) ? maxDist : 12;
      if (await adoptWikiPage(title, distCap)) break;
    }
  }

  if (!wikiRaw || !pageTitle) return null;

  if (!photoUrl) {
    photoUrl = await resolvePhotoForTitle(pageTitle, locale, wikiFallback, project);
  }
  if (!photoUrl && coords) {
    const nearby = await titleByCoords(coords.lat, coords.lng, locale, wikiFallback, project, name);
    if (nearby) {
      photoUrl = await resolvePhotoForTitle(nearby, locale, wikiFallback, project);
    }
  }
  // Foto-Fallback aus dem anderen Projekt (Titel oft gleich).
  if (!photoUrl) {
    const other: WikiMediaProject = project === "wikivoyage" ? "wikipedia" : "wikivoyage";
    photoUrl = await resolvePhotoForTitle(pageTitle, locale, wikiFallback, other);
  }

  return { wikiRaw, photoUrl, pageTitle, project };
}

export async function fetchStopBrief(input: {
  name: string;
  lat?: number;
  lng?: number;
  language?: string;
}): Promise<StopBriefResult> {
  const name = input.name.trim();
  if (!name) {
    return { description: "", source: "none" };
  }
  const locale = asAppLocale(input.language || "de");
  const wikiFallback = wikipediaAllowLangFallback(locale);
  const hasCoords = typeof input.lat === "number" && typeof input.lng === "number";
  const coords = hasCoords ? { lat: input.lat!, lng: input.lng! } : undefined;

  // Wikivoyage zuerst (Reiseinhalt), sonst Wikipedia.
  let resolved =
    (await resolveBriefFromProject({
      name,
      locale,
      wikiFallback,
      coords,
      project: "wikivoyage",
    })) ||
    (await resolveBriefFromProject({
      name,
      locale,
      wikiFallback,
      coords,
      project: "wikipedia",
    }));

  if (!resolved) {
    return {
      description: "",
      source: "none",
    };
  }

  const refined = await refineWikipediaBrief(resolved.wikiRaw, name, locale, coords);
  const finalText = refined || clampToApproxWords(resolved.wikiRaw, 100);
  const wasRefined = !!refined;
  const isVoyage = resolved.project === "wikivoyage";

  return {
    description: finalText,
    photoUrl: resolved.photoUrl,
    wikipediaTitle: resolved.pageTitle,
    source: isVoyage ? "wikivoyage" : "wikipedia",
    briefSource: wasRefined
      ? isVoyage
        ? "wikivoyage-refined"
        : "wikipedia-refined"
      : isVoyage
        ? "wikivoyage"
        : "wikipedia",
  };
}

/** Nur Foto(s) von Wikivoyage/Wikipedia – Text unverändert lassen. */
export async function fetchStopBriefPhoto(input: {
  name: string;
  wikipediaTitle?: string;
  lat?: number;
  lng?: number;
  language?: string;
  variantIndex?: number;
  currentPhotoUrl?: string;
  mode: "reload" | "alternate";
}): Promise<{ photoUrl?: string; wikipediaTitle?: string; variantIndex: number }> {
  const name = input.name.trim();
  const locale = asAppLocale(input.language || "de");
  const wikiFallback = wikipediaAllowLangFallback(locale);
  let pageTitle = (input.wikipediaTitle || name).trim();
  if (!pageTitle) return { variantIndex: 0 };

  if (!input.wikipediaTitle) {
    for (const candidate of briefNameCandidates(name)) {
      const exact =
        (await fetchSummaryByTitle(candidate, locale, wikiFallback, "wikivoyage")) ||
        (await fetchSummaryByTitle(candidate, locale, wikiFallback, "wikipedia"));
      if (exact?.title) {
        pageTitle = exact.title;
        break;
      }
    }
  }
  if (
    !input.wikipediaTitle &&
    pageTitle === name &&
    typeof input.lat === "number" &&
    typeof input.lng === "number"
  ) {
    const nearby =
      (await titleByCoords(input.lat, input.lng, locale, wikiFallback, "wikivoyage")) ||
      (await titleByCoords(input.lat, input.lng, locale, wikiFallback, "wikipedia"));
    if (nearby) pageTitle = nearby;
  }

  const pool = await buildStopPhotoPool(pageTitle, locale, wikiFallback);
  let picked = pickPhotoFromPool(
    pool,
    input.mode,
    input.currentPhotoUrl,
    input.variantIndex,
  );

  if (input.mode === "alternate" && !picked.photoUrl && input.currentPhotoUrl) {
    const searchTerm = pageTitle.split(/[,(]/)[0]?.trim() || name;
    const commons = await fetchCommonsImageUrls(searchTerm, 15);
    const currentKey = wikiImageDedupeKey(input.currentPhotoUrl);
    for (const url of commons) {
      if (wikiImageDedupeKey(url) === currentKey) continue;
      const idx = pool.length;
      return {
        photoUrl: url,
        wikipediaTitle: pageTitle,
        variantIndex: idx,
      };
    }
  }

  if (!picked.photoUrl && pool.length > 0) {
    picked = { photoUrl: pool[0], variantIndex: 0 };
  }

  return {
    photoUrl: picked.photoUrl,
    wikipediaTitle: pageTitle,
    variantIndex: picked.variantIndex,
  };
}
