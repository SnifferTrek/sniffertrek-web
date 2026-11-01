import JSZip from "jszip";
import type { Trip } from "./types";
import { hydrateTripMedia } from "./tripMediaSidecar";
import { mergeStopsById, syncTripRouteStops } from "./tripStopMerge";
import { getTrip } from "./tripStorage";
import {
  ingestDataUrl,
  isMediaRef,
  listTripPhotoAssets,
  MEDIA_REF_PREFIX,
  putImportedAsset,
  toMediaRef,
  type TripPhotoAsset,
  warmThumbCache,
} from "./tripPhotoStore";

export const TRIP_FILE_FORMAT = "sniffertrek-trip" as const;
/** v1 = JSON mit inline Data-URLs; v2 = ZIP mit trip.json + media/ */
export const TRIP_FILE_VERSION = 2;
/** ZIP-Container; .zip-Suffix, damit macOS/Chrome die Datei nicht ausgrauen. */
export const TRIP_FILE_EXTENSION = ".sniffertrek.zip";
export const TRIP_FILE_EXTENSION_LEGACY = ".sniffertrek.json";
export const TRIP_FILE_EXTENSION_PLAIN = ".sniffertrek";
export const TRIP_FILE_MIME = "application/zip";
export const TRIP_FILE_MIME_JSON = "application/json";

export type TripFileEnvelope = {
  format: typeof TRIP_FILE_FORMAT;
  version: 1 | 2;
  exportedAt: string;
  trip: Trip;
};

export function suggestTripFileName(trip: Trip): string {
  const base =
    (trip.name && trip.name !== "Neue Reise" ? trip.name : "SnifferTrek-Reise")
      .replace(/[/\\?%*:|"<>]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80) || "SnifferTrek-Reise";
  return `${base}${TRIP_FILE_EXTENSION}`;
}

function collectStringPhotoFields(trip: Trip): string[] {
  const out: string[] = [];
  for (const arr of Object.values(trip.pdfPhotosByEtappe || {})) out.push(...(arr || []));
  for (const arr of Object.values(trip.pdfPhotoLibraryByEtappe || {})) out.push(...(arr || []));
  if (trip.pdfCoverPhotoDataUrl) out.push(trip.pdfCoverPhotoDataUrl);
  for (const stop of trip.stops || []) {
    if (stop.discoveryPhotoDataUrl) out.push(stop.discoveryPhotoDataUrl);
    if (stop.discoveryPhotoUrl) out.push(stop.discoveryPhotoUrl);
  }
  for (const entries of Object.values(trip.pdfExtraTextByEtappe || {})) {
    for (const e of entries || []) {
      if (e.photoDataUrl) out.push(e.photoDataUrl);
    }
  }
  return out;
}

/** Data-URLs im Trip → `st:`-Assets (einmalig bei Laden/Speichern). */
export async function migrateInlineDataUrlsToAssets(trip: Trip): Promise<Trip> {
  const replace = async (url: string | undefined): Promise<string | undefined> => {
    if (!url) return url;
    if (isMediaRef(url)) return url;
    if (!url.startsWith("data:image/")) return url;
    const ref = await ingestDataUrl(trip.id, url);
    return ref || url;
  };

  const mapRecord = async (rec?: Record<string, string[]>): Promise<Record<string, string[]> | undefined> => {
    if (!rec) return rec;
    const out: Record<string, string[]> = {};
    for (const [k, arr] of Object.entries(rec)) {
      out[k] = [];
      for (const u of arr || []) {
        out[k].push((await replace(u)) || u);
      }
    }
    return out;
  };

  const next: Trip = {
    ...trip,
    pdfPhotosByEtappe: await mapRecord(trip.pdfPhotosByEtappe),
    pdfPhotoLibraryByEtappe: await mapRecord(trip.pdfPhotoLibraryByEtappe),
    pdfCoverPhotoDataUrl: await replace(trip.pdfCoverPhotoDataUrl),
    stops: await Promise.all(
      (trip.stops || []).map(async (s) => ({
        ...s,
        discoveryPhotoDataUrl: await replace(s.discoveryPhotoDataUrl),
        discoveryPhotoUrl: s.discoveryPhotoUrl?.startsWith("data:")
          ? (await replace(s.discoveryPhotoUrl)) || s.discoveryPhotoUrl
          : s.discoveryPhotoUrl,
      }))
    ),
  };

  if (trip.pdfExtraTextByEtappe) {
    const extra: NonNullable<Trip["pdfExtraTextByEtappe"]> = {};
    for (const [k, entries] of Object.entries(trip.pdfExtraTextByEtappe)) {
      extra[k] = await Promise.all(
        (entries || []).map(async (e) => ({
          ...e,
          photoDataUrl: e.photoDataUrl ? (await replace(e.photoDataUrl)) || e.photoDataUrl : e.photoDataUrl,
        }))
      );
    }
    next.pdfExtraTextByEtappe = extra;
  }

  return next;
}

/**
 * Trip für Datei: UI-Stand + localStorage-Union (kein Stopp-Verlust durch Stale-Snapshot).
 * Kein hydrate aus Sidecar – das überschreibt sonst frische Edits mit altem Cache.
 */
export async function prepareTripForFile(trip: Trip): Promise<Trip> {
  let merged: Trip = trip;
  try {
    const stored = getTrip(trip.id);
    if (stored?.stops?.length) {
      const stops =
        (trip.stops?.length || 0) >= (stored.stops?.length || 0)
          ? mergeStopsById(trip.stops || [], stored.stops || [])
          : mergeStopsById(stored.stops || [], trip.stops || []);
      merged = { ...trip, stops };
      if (trip.routes?.route || stored.routes?.route) {
        const routeStops =
          (trip.routes?.route?.stops?.length || 0) >= (stored.routes?.route?.stops?.length || 0)
            ? mergeStopsById(trip.routes?.route?.stops || stops, stored.routes?.route?.stops || [])
            : mergeStopsById(stored.routes?.route?.stops || stops, trip.routes?.route?.stops || []);
        merged = {
          ...merged,
          routes: {
            ...stored.routes,
            ...trip.routes,
            route: {
              ...stored.routes?.route,
              ...trip.routes?.route,
              stops: routeStops,
              viaPoints: trip.routes?.route?.viaPoints || stored.routes?.route?.viaPoints || [],
            },
          },
        };
      }
    }
  } catch (err) {
    console.warn("[prepareTripForFile] storage union skipped", err);
  }

  const stamped = syncTripRouteStops({
    ...merged,
    updatedAt: new Date().toISOString(),
  });
  try {
    // migrate aktualisiert nur trip.stops – Route-Kopie wieder angleichen
    return syncTripRouteStops(await migrateInlineDataUrlsToAssets(stamped));
  } catch (err) {
    console.warn("[prepareTripForFile] migrate skipped", err);
    return stamped;
  }
}

/** @deprecated sync JSON – nur noch Fallback; bevorzugt buildTripFileBlobAsync */
export function buildTripFileContents(trip: Trip): string {
  const hydrated = hydrateTripMedia(syncTripRouteStops({ ...trip, updatedAt: new Date().toISOString() }));
  const envelope: TripFileEnvelope = {
    format: TRIP_FILE_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    trip: hydrated,
  };
  return JSON.stringify(envelope);
}

export async function buildTripFileBlobAsync(trip: Trip): Promise<Blob> {
  const prepared = await prepareTripForFile(trip);
  const zip = new JSZip();
  const envelope: TripFileEnvelope = {
    format: TRIP_FILE_FORMAT,
    version: 2,
    exportedAt: new Date().toISOString(),
    trip: prepared,
  };
  zip.file("trip.json", JSON.stringify(envelope));

  const assets = await listTripPhotoAssets(prepared.id);
  const mediaFolder = zip.folder("media");
  if (mediaFolder) {
    for (const asset of assets) {
      mediaFolder.file(`${asset.id}.thumb.jpg`, asset.thumbBlob);
      mediaFolder.file(`${asset.id}.full.jpg`, asset.fullBlob);
    }
  }

  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
    mimeType: TRIP_FILE_MIME,
  });
}

export async function buildTripFileContentsAsync(trip: Trip): Promise<string | ArrayBuffer> {
  const blob = await buildTripFileBlobAsync(trip);
  return blob.arrayBuffer();
}

async function importMediaFromZip(zip: JSZip, tripId: string): Promise<void> {
  const media = zip.folder("media");
  if (!media) return;
  const files = Object.keys(zip.files).filter((p) => p.startsWith("media/") && !zip.files[p].dir);
  const byId = new Map<string, { thumb?: Blob; full?: Blob }>();

  for (const path of files) {
    const name = path.slice("media/".length);
    const m = name.match(/^(.+)\.(thumb|full)\.jpe?g$/i);
    if (!m) continue;
    const id = m[1];
    const kind = m[2].toLowerCase() as "thumb" | "full";
    const blob = await zip.files[path].async("blob");
    const row = byId.get(id) || {};
    if (kind === "thumb") row.thumb = blob;
    else row.full = blob;
    byId.set(id, row);
  }

  for (const [id, parts] of byId) {
    const thumbBlob = parts.thumb || parts.full;
    const fullBlob = parts.full || parts.thumb;
    if (!thumbBlob || !fullBlob) continue;
    const asset: TripPhotoAsset = {
      id,
      tripId,
      mime: "image/jpeg",
      thumbBlob,
      fullBlob,
      createdAt: Date.now(),
    };
    await putImportedAsset(asset);
  }
}

async function blobLooksLikeZip(blob: Blob): Promise<boolean> {
  try {
    const u = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    // ZIP local file header "PK\x03\x04" or empty zip "PK\x05\x06"
    return u[0] === 0x50 && u[1] === 0x4b;
  } catch {
    return false;
  }
}

async function finalizeImportedTrip(trip: Trip): Promise<Trip> {
  // Migration darf Öffnen nie blockieren (Quota/IDB-Fehler bei vielen Fotos)
  try {
    const migrated = await migrateInlineDataUrlsToAssets(trip);
    try {
      await warmThumbCache(collectStringPhotoFields(migrated).filter(isMediaRef));
    } catch {
      /* ignore */
    }
    return migrated;
  } catch (err) {
    console.warn("[tripLocalFile] media migrate skipped", err);
    return trip;
  }
}

export async function parseTripFileBlob(blob: Blob): Promise<Trip> {
  if (!blob || blob.size === 0) {
    throw new Error("Leere Datei");
  }

  const isZip = await blobLooksLikeZip(blob);

  if (isZip) {
    const zip = await JSZip.loadAsync(blob);
    // trip.json oben oder irgendwo im Archiv
    let tripEntry = zip.file("trip.json");
    if (!tripEntry) {
      const alt = Object.keys(zip.files).find((p) => /(^|\/)trip\.json$/i.test(p) && !zip.files[p].dir);
      if (alt) tripEntry = zip.file(alt);
    }
    if (!tripEntry) {
      throw new Error("ZIP ohne trip.json – ist das eine SnifferTrek-Datei?");
    }
    const text = await tripEntry.async("string");
    const trip = parseTripFileContents(text);
    try {
      await importMediaFromZip(zip, trip.id);
    } catch (err) {
      console.warn("[parseTripFileBlob] media import skipped", err);
    }
    return finalizeImportedTrip(trip);
  }

  // JSON (auch .sniffertrek / .sniffertrek.json ohne ZIP)
  const text = (await blob.text()).replace(/^\uFEFF/, "").trim();
  if (!text.startsWith("{") && !text.startsWith("[")) {
    throw new Error("Kein SnifferTrek-Format (weder ZIP noch JSON)");
  }
  return parseTripFileContentsAsync(text);
}

export function parseTripFileContents(text: string): Trip {
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("JSON ungültig");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Ungültige Reisedatei");
  }

  const obj = parsed as TripFileEnvelope | Trip & { trip?: Trip };
  if ("format" in obj && (obj as TripFileEnvelope).format === TRIP_FILE_FORMAT) {
    const env = obj as TripFileEnvelope;
    const ver = Number(env.version);
    if (ver && ver !== 1 && ver !== 2) {
      throw new Error(`Unsupported trip file version: ${env.version}`);
    }
    if (!env.trip?.id) throw new Error("Invalid trip file: missing trip");
    return {
      ...env.trip,
      stops: Array.isArray(env.trip.stops) ? env.trip.stops : [],
    };
  }

  // Envelope ohne format, aber mit trip
  if ("trip" in obj && (obj as { trip?: Trip }).trip?.id) {
    const inner = (obj as { trip: Trip }).trip;
    return { ...inner, stops: Array.isArray(inner.stops) ? inner.stops : [] };
  }

  if ("id" in obj && (obj as Trip).id) {
    const trip = obj as Trip;
    return { ...trip, stops: Array.isArray(trip.stops) ? trip.stops : [] };
  }

  throw new Error("Keine gültige SnifferTrek-Reise in der Datei");
}

/** Legacy JSON-Text: migriert Data-URLs nach IDB. */
export async function parseTripFileContentsAsync(text: string): Promise<Trip> {
  const trip = parseTripFileContents(text);
  return finalizeImportedTrip(trip);
}

export function downloadTripFile(trip: Trip, fileName?: string): void {
  void downloadTripFileAsync(trip, fileName);
}

export async function downloadTripFileAsync(trip: Trip, fileName?: string): Promise<void> {
  if (typeof window === "undefined") return;
  const name = fileName || suggestTripFileName(trip);
  // Snapshot sofort – Stopps dürfen während des (langen) ZIP-Baus nicht «verloren» gehen
  let frozen: Trip;
  try {
    frozen = JSON.parse(JSON.stringify(trip)) as Trip;
  } catch {
    frozen = trip;
  }
  const expected = frozen.stops?.length || 0;
  const blob = await buildTripFileBlobAsync(frozen);
  // Harte Kontrolle: ZIP muss die Stopps enthalten, bevor der Download startet
  const parsed = await parseTripFileBlob(blob);
  const got = parsed.stops?.length || 0;
  if (expected > 0 && got < expected) {
    throw new Error(`stop_count_mismatch: expected ${expected} stops in ZIP, got ${got}`);
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
}

export { MEDIA_REF_PREFIX, toMediaRef };
