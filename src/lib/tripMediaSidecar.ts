import type { PdfExtraTextEntry, RouteStop, Trip } from "./types";

export const TRIP_PDF_MEDIA_PREFIX = "sniffertrek_trip_pdf_media:";
export const TRIP_STOP_MEDIA_PREFIX = "sniffertrek_trip_stop_media:";
/** Eigenes localStorage-Feld pro Reise (Titelbild bleibt auch wenn der Trip-JSON schlank ist). */
export const TRIP_COVER_PHOTO_PREFIX = "sniffertrek_trip_cover:";

function coverIdbKey(tripId: string): string {
 return `${tripId}::pdf_cover`;
}

function clearLocalStorageKey(key: string): void {
 if (typeof window === "undefined") return;
 try {
 localStorage.removeItem(key);
 } catch {
 /* ignore */
 }
}

/** Titelbild: Memory + IndexedDB (kein localStorage – Quota). */
export function readTripCoverPhoto(tripId: string): string | undefined {
 if (!tripId || typeof window === "undefined") return undefined;
 const side = readPdfMediaSidecar(tripId);
 const fromSide = side?.pdfCoverPhotoDataUrl?.trim();
 if (fromSide) return fromSide;
 // Legacy-Migration: einmal aus localStorage lesen und nach IDB schieben
 try {
 const raw = localStorage.getItem(`${TRIP_COVER_PHOTO_PREFIX}${tripId}`);
 if (raw?.trim()) {
 clearLocalStorageKey(`${TRIP_COVER_PHOTO_PREFIX}${tripId}`);
 writeTripCoverPhoto(tripId, raw.trim());
 return raw.trim();
 }
 } catch {
 /* ignore */
 }
 return undefined;
}

export function writeTripCoverPhoto(tripId: string, dataUrl: string): void {
 const url = dataUrl.trim();
 if (!tripId || !url) return;
 clearLocalStorageKey(`${TRIP_COVER_PHOTO_PREFIX}${tripId}`);
 const existing = readPdfMediaSidecar(tripId) || {};
 writePdfMediaSidecar(tripId, { ...existing, pdfCoverPhotoDataUrl: url });
 enqueueIdbPut(coverIdbKey(tripId), { pdfCoverPhotoDataUrl: url, savedAt: Date.now() });
}

export function removeTripCoverPhoto(tripId: string): void {
 if (!tripId || typeof window === "undefined") return;
 clearLocalStorageKey(`${TRIP_COVER_PHOTO_PREFIX}${tripId}`);
 const existing = readPdfMediaSidecar(tripId);
 if (existing) {
 const next = { ...existing };
 delete next.pdfCoverPhotoDataUrl;
 if (sidecarHasPdfMedia(next)) writePdfMediaSidecar(tripId, next);
 else {
 clearLocalStorageKey(`${TRIP_PDF_MEDIA_PREFIX}${tripId}`);
 void idbDeletePdfMedia(tripId);
 }
 }
 void idbDeletePdfMedia(coverIdbKey(tripId));
}

type TripPdfMediaSidecar = {
 savedAt?: number;
 pdfPhotosByEtappe?: Record<string, string[]>;
 pdfPhotoLibraryByEtappe?: Record<string, string[]>;
 pdfPhotoCaptionsByEtappe?: Record<string, Record<string, string>>;
 pdfExtraTextByEtappe?: Record<string, PdfExtraTextEntry[]>;
 pdfCoverPhotoDataUrl?: string;
};

type TripStopMediaSidecar = Record<string, string>;

function collectStopMedia(stops: RouteStop[]): { lean: RouteStop[]; media: TripStopMediaSidecar } {
 const media: TripStopMediaSidecar = {};
 const lean = stops.map((stop) => {
  // Eigenes Bild (data-URL) gehoert NICHT zusaetzlich ins Trip-JSON –
  // das verdoppelt den Speicherbedarf und sprengt die localStorage-Quota.
  const photoData = stop.discoveryPhotoDataUrl?.trim()
   ? stop.discoveryPhotoDataUrl
   : stop.discoveryPhotoUrl?.startsWith("data:")
     ? stop.discoveryPhotoUrl
     : undefined;
  if (!photoData) return stop;
  media[stop.id] = photoData;
  const { discoveryPhotoDataUrl: _drop, ...rest } = stop;
  return rest.discoveryPhotoUrl?.startsWith("data:")
   ? { ...rest, discoveryPhotoUrl: undefined }
   : rest;
 });
 return { lean, media };
}

function applyStopMedia(stops: RouteStop[], media: TripStopMediaSidecar): RouteStop[] {
 if (!Object.keys(media).length) return stops;
 return stops.map((stop) =>
 media[stop.id] ? { ...stop, discoveryPhotoDataUrl: media[stop.id] } : stop
 );
}

const IDB_NAME = "sniffertrek_media";
const IDB_STORE = "pdf";
const IDB_VERSION = 1;

const pdfMediaMemory = new Map<string, TripPdfMediaSidecar>();
const stopMediaMemory = new Map<string, TripStopMediaSidecar>();
const idbWriteChain = new Map<string, Promise<void>>();

function photoMapCount(map?: Record<string, string[]>): number {
 return Object.values(map || {}).reduce((n, arr) => n + (arr?.length || 0), 0);
}

function sidecarMediaCount(side: TripPdfMediaSidecar | null | undefined): number {
 if (!side) return 0;
 return (
  photoMapCount(side.pdfPhotosByEtappe) +
  photoMapCount(side.pdfPhotoLibraryByEtappe) +
  Object.values(side.pdfExtraTextByEtappe || {}).reduce(
   (n, entries) => n + (entries?.filter((e) => !!e.photoDataUrl).length || 0),
   0
  ) +
  (side.pdfCoverPhotoDataUrl?.trim() ? 1 : 0)
 );
}

function mergeUrlLists(a: string[] = [], b: string[] = []): string[] {
 if (b.length > a.length) return Array.from(new Set([...b, ...a]));
 return Array.from(new Set([...a, ...b]));
}

function mergePhotoMaps(
 preferred?: Record<string, string[]>,
 other?: Record<string, string[]>
): Record<string, string[]> | undefined {
 if (!preferred && !other) return preferred;
 const keys = new Set([...Object.keys(preferred || {}), ...Object.keys(other || {})]);
 const out: Record<string, string[]> = {};
 for (const k of keys) {
  out[k] = mergeUrlLists(preferred?.[k], other?.[k]);
 }
 return out;
}

function pickRicherPdfMedia(
 a: TripPdfMediaSidecar | null | undefined,
 b: TripPdfMediaSidecar | null | undefined
): TripPdfMediaSidecar | null {
 const aN = sidecarMediaCount(a);
 const bN = sidecarMediaCount(b);
 if (bN <= 0 && aN <= 0) return a || b || null;
 if (bN > aN) return b || null;
 if (aN > bN) return a || null;
 const aAt = a?.savedAt || 0;
 const bAt = b?.savedAt || 0;
 return bAt > aAt ? b || null : a || b || null;
}

function sidecarHasPdfMedia(side: TripPdfMediaSidecar | null | undefined): boolean {
 if (!side) return false;
 return (
 Object.values(side.pdfPhotosByEtappe || {}).some((a) => a?.length) ||
 Object.values(side.pdfPhotoLibraryByEtappe || {}).some((a) => a?.length) ||
 Object.values(side.pdfExtraTextByEtappe || {}).some((entries) =>
 entries?.some((e) => !!e.photoDataUrl)
 ) ||
 !!side.pdfCoverPhotoDataUrl?.trim()
 );
}

function rememberPdfMedia(tripId: string, data: TripPdfMediaSidecar): void {
 if (!tripId) return;
 pdfMediaMemory.set(tripId, data);
}

function openMediaDb(): Promise<IDBDatabase> | null {
 if (typeof window === "undefined" || !window.indexedDB) return null;
 return new Promise((resolve, reject) => {
 const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
 req.onupgradeneeded = () => {
 const db = req.result;
 if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
 };
 req.onsuccess = () => resolve(req.result);
 req.onerror = () => reject(req.error);
 });
}

async function idbPutPdfMedia(tripId: string, data: TripPdfMediaSidecar): Promise<boolean> {
 const open = openMediaDb();
 if (!open) return false;
 try {
 const db = await open;
 await new Promise<void>((resolve, reject) => {
 const tx = db.transaction(IDB_STORE, "readwrite");
 tx.oncomplete = () => resolve();
 tx.onerror = () => reject(tx.error);
 tx.objectStore(IDB_STORE).put(data, tripId);
 });
 db.close();
 return true;
 } catch (err) {
 console.warn("[tripMediaSidecar] IndexedDB Speichern fehlgeschlagen", err);
 return false;
 }
}

async function idbGetPdfMedia(tripId: string): Promise<TripPdfMediaSidecar | null> {
 const open = openMediaDb();
 if (!open) return null;
 try {
 const db = await open;
 const data = await new Promise<TripPdfMediaSidecar | null>((resolve, reject) => {
 const tx = db.transaction(IDB_STORE, "readonly");
 const req = tx.objectStore(IDB_STORE).get(tripId);
 req.onsuccess = () => resolve((req.result as TripPdfMediaSidecar) || null);
 req.onerror = () => reject(req.error);
 });
 db.close();
 return data;
 } catch {
 return null;
 }
}

async function idbDeletePdfMedia(tripId: string): Promise<void> {
 const open = openMediaDb();
 if (!open) return;
 try {
 const db = await open;
 await new Promise<void>((resolve, reject) => {
 const tx = db.transaction(IDB_STORE, "readwrite");
 tx.oncomplete = () => resolve();
 tx.onerror = () => reject(tx.error);
 tx.objectStore(IDB_STORE).delete(tripId);
 });
 db.close();
 } catch {
 /* ignore */
 }
}

function readPdfMediaSidecar(tripId: string): TripPdfMediaSidecar | null {
 if (typeof window === "undefined") return null;
 const mem = pdfMediaMemory.get(tripId);
 if (sidecarHasPdfMedia(mem)) return mem || null;
 // Legacy: einmal aus localStorage migrieren → IndexedDB, LS löschen
 try {
 const raw = localStorage.getItem(`${TRIP_PDF_MEDIA_PREFIX}${tripId}`);
 const parsed = raw ? (JSON.parse(raw) as TripPdfMediaSidecar) : null;
 if (parsed && sidecarHasPdfMedia(parsed)) {
 rememberPdfMedia(tripId, parsed);
 enqueueIdbPut(tripId, { ...parsed, savedAt: Date.now() });
 clearLocalStorageKey(`${TRIP_PDF_MEDIA_PREFIX}${tripId}`);
 return parsed;
 }
 if (raw) clearLocalStorageKey(`${TRIP_PDF_MEDIA_PREFIX}${tripId}`);
 return parsed;
 } catch {
 return mem || null;
 }
}

function enqueueIdbPut(tripId: string, data: TripPdfMediaSidecar): void {
 const prev = idbWriteChain.get(tripId) || Promise.resolve();
 const next = prev
  .then(() => idbPutPdfMedia(tripId, data))
  .then(() => undefined)
  .catch(() => undefined);
 idbWriteChain.set(tripId, next);
}

function writePdfMediaSidecar(tripId: string, data: TripPdfMediaSidecar): boolean {
 if (typeof window === "undefined") return false;
 const stamped: TripPdfMediaSidecar = { ...data, savedAt: Date.now() };
 rememberPdfMedia(tripId, stamped);
 // Nie in localStorage – nur Memory + IndexedDB (Datei ist Wahrheitsquelle)
 clearLocalStorageKey(`${TRIP_PDF_MEDIA_PREFIX}${tripId}`);
 const hasContent = sidecarHasPdfMedia(stamped);
 if (!hasContent) {
 void idbDeletePdfMedia(tripId);
 return true;
 }
 enqueueIdbPut(tripId, stamped);
 return true;
}

/** Lädt Etappen-Fotos aus IndexedDB in den Memory-Cache (fuer Reload). */
export async function loadDurablePdfMedia(tripId: string): Promise<TripPdfMediaSidecar | null> {
 if (!tripId) return null;
 const local = readPdfMediaSidecar(tripId);
 const fromIdb = await idbGetPdfMedia(tripId);
 const coverFromIdb = await idbGetPdfMedia(coverIdbKey(tripId));
 const picked = pickRicherPdfMedia(local, fromIdb);
 const cover =
 readTripCoverPhoto(tripId) ||
 picked?.pdfCoverPhotoDataUrl?.trim() ||
 coverFromIdb?.pdfCoverPhotoDataUrl?.trim();
 const merged: TripPdfMediaSidecar | null =
 picked || local || cover
 ? { ...(picked || local || {}), ...(cover ? { pdfCoverPhotoDataUrl: cover } : {}) }
 : null;
 clearLocalStorageKey(`${TRIP_PDF_MEDIA_PREFIX}${tripId}`);
 clearLocalStorageKey(`${TRIP_COVER_PHOTO_PREFIX}${tripId}`);
 if (merged && sidecarHasPdfMedia(merged)) {
 rememberPdfMedia(tripId, merged);
 enqueueIdbPut(tripId, { ...merged, savedAt: Date.now() });
 return merged;
 }
 return merged;
}

export function readStopPhotoFromSidecar(tripId: string, stopId: string): string | undefined {
 if (!tripId || !stopId) return undefined;
 const media = readStopMediaSidecar(tripId);
 const url = media[stopId];
 return url?.trim() || undefined;
}

/** Ortsfoto sofort in Sidecar legen (unabhängig vom Autosave-Timer). */
export function writeStopPhotoToSidecar(tripId: string, stopId: string, dataUrl: string): void {
 if (!tripId || !stopId || !dataUrl.trim()) return;
 const existing = readStopMediaSidecar(tripId);
 writeStopMediaSidecar(tripId, { ...existing, [stopId]: dataUrl });
}

export function removeStopPhotoFromSidecar(tripId: string, stopId: string): void {
 if (!tripId || !stopId) return;
 const existing = readStopMediaSidecar(tripId);
 if (!existing[stopId]) return;
 const next = { ...existing };
 delete next[stopId];
 writeStopMediaSidecar(tripId, next);
}

function readStopMediaSidecar(tripId: string): TripStopMediaSidecar {
 if (typeof window === "undefined") return {};
 const mem = stopMediaMemory.get(tripId);
 if (mem && Object.keys(mem).length) return mem;
 try {
 const raw = localStorage.getItem(`${TRIP_STOP_MEDIA_PREFIX}${tripId}`);
 if (!raw) return mem || {};
 const parsed = JSON.parse(raw) as TripStopMediaSidecar;
 stopMediaMemory.set(tripId, parsed);
 backupStopMediaToIdb(tripId, parsed);
 clearLocalStorageKey(`${TRIP_STOP_MEDIA_PREFIX}${tripId}`);
 return parsed;
 } catch {
 return mem || {};
 }
}

function stopMediaIdbKey(tripId: string): string {
 return `${tripId}::stop_media`;
}

type StopMediaIdbRecord = { stopMedia?: TripStopMediaSidecar; savedAt?: number };

/** Ortsfotos zusaetzlich in IndexedDB sichern – localStorage hat eine harte Quota. */
function backupStopMediaToIdb(tripId: string, media: TripStopMediaSidecar): void {
 if (!tripId) return;
 if (!Object.keys(media).length) {
 void idbDeletePdfMedia(stopMediaIdbKey(tripId));
 return;
 }
 const record: StopMediaIdbRecord = { stopMedia: media, savedAt: Date.now() };
 enqueueIdbPut(stopMediaIdbKey(tripId), record as unknown as TripPdfMediaSidecar);
}

/** Ortsfotos aus Memory + IndexedDB (fuer Reload). */
export async function loadDurableStopMedia(tripId: string): Promise<TripStopMediaSidecar> {
 if (!tripId) return {};
 const local = readStopMediaSidecar(tripId);
 const record = (await idbGetPdfMedia(
 stopMediaIdbKey(tripId)
 )) as unknown as StopMediaIdbRecord | null;
 const fromIdb = record?.stopMedia || {};
 const merged: TripStopMediaSidecar = { ...fromIdb, ...local };
 stopMediaMemory.set(tripId, merged);
 clearLocalStorageKey(`${TRIP_STOP_MEDIA_PREFIX}${tripId}`);
 if (Object.keys(merged).length) backupStopMediaToIdb(tripId, merged);
 return merged;
}

function writeStopMediaSidecar(tripId: string, media: TripStopMediaSidecar): boolean {
 if (typeof window === "undefined") return false;
 stopMediaMemory.set(tripId, media);
 backupStopMediaToIdb(tripId, media);
 clearLocalStorageKey(`${TRIP_STOP_MEDIA_PREFIX}${tripId}`);
 return true;
}

function hasInlinePdfMedia(trip: Trip): boolean {
 const photos = Object.values(trip.pdfPhotosByEtappe || {}).some((a) => a?.length);
 const library = Object.values(trip.pdfPhotoLibraryByEtappe || {}).some((a) => a?.length);
 const extra = Object.values(trip.pdfExtraTextByEtappe || {}).some((entries) =>
 entries?.some((e) => !!e.photoDataUrl)
 );
 const cover = !!trip.pdfCoverPhotoDataUrl?.trim();
 return photos || library || extra || cover;
}

function stripStopDataUrls(stops: RouteStop[]): RouteStop[] {
 return stops.map((stop) => {
  const next = { ...stop };
  if (next.discoveryPhotoDataUrl?.startsWith("data:")) delete next.discoveryPhotoDataUrl;
  if (next.discoveryPhotoUrl?.startsWith("data:")) next.discoveryPhotoUrl = undefined;
  return next;
 });
}

/**
 * Cloud-Payload: Metadaten + Layout/Captions, keine Data-URL-Fotos.
 * Schreibt keine Sidecars – nur eine schlanke Kopie für den Upsert
 * (leere Foto-Maps überschreiben alte fette Cloud-Zeilen).
 */
export function leanTripForCloud(trip: Trip): Trip {
 const { lean: leanStops } = collectStopMedia(trip.stops);

 let leanRoutes = trip.routes;
 if (trip.routes) {
  leanRoutes = { ...trip.routes };
  for (const key of Object.keys(leanRoutes) as (keyof typeof leanRoutes)[]) {
   if (key === "routingOptions" || key === "bookedFlights") continue;
   const route = leanRoutes[key];
   if (!route || !("stops" in route) || !route.stops) continue;
   const { lean } = collectStopMedia(route.stops);
   leanRoutes[key] = { ...route, stops: stripStopDataUrls(lean) };
  }
 }

 return {
  ...trip,
  stops: stripStopDataUrls(leanStops),
  routes: leanRoutes,
  pdfPhotosByEtappe: {},
  pdfPhotoLibraryByEtappe: {},
  pdfCoverPhotoDataUrl: "",
  pdfPhotoCaptionsByEtappe: trip.pdfPhotoCaptionsByEtappe,
  pdfPhotoPlacementByEtappe: trip.pdfPhotoPlacementByEtappe,
  pdfPhotoLayoutByEtappe: trip.pdfPhotoLayoutByEtappe,
  pdfPhotoPagesByEtappe: trip.pdfPhotoPagesByEtappe,
  pdfExtraTextByEtappe: stripExtraTextPhotos(trip.pdfExtraTextByEtappe),
 };
}

/** Schreibt Fotos in IndexedDB/Memory; Haupt-Trip bleibt schlank (Route, Hotels, Text). */
export function leanTripForStorage(trip: Trip): { trip: Trip; mediaOk: boolean } {
 const existingPdf = readPdfMediaSidecar(trip.id);
 const inlinePdf = hasInlinePdfMedia(trip);
 const coverUrl = trip.pdfCoverPhotoDataUrl?.trim() || "";
 const pdfSidecar: TripPdfMediaSidecar = {
 ...(existingPdf || {}),
 ...(inlinePdf
 ? {
 pdfPhotosByEtappe: trip.pdfPhotosByEtappe,
 pdfPhotoLibraryByEtappe: trip.pdfPhotoLibraryByEtappe,
 pdfPhotoCaptionsByEtappe: trip.pdfPhotoCaptionsByEtappe,
 pdfExtraTextByEtappe: trip.pdfExtraTextByEtappe,
 }
 : {}),
 };
 if (coverUrl) {
 pdfSidecar.pdfCoverPhotoDataUrl = coverUrl;
 writeTripCoverPhoto(trip.id, coverUrl);
 } else {
 const preserved = readTripCoverPhoto(trip.id);
 if (preserved) pdfSidecar.pdfCoverPhotoDataUrl = preserved;
 else delete pdfSidecar.pdfCoverPhotoDataUrl;
 }
 const pdfOk =
 inlinePdf || coverUrl || sidecarHasPdfMedia(existingPdf)
 ? writePdfMediaSidecar(trip.id, pdfSidecar)
 : true;

 const { lean: leanStops, media: stopMedia } = collectStopMedia(trip.stops);

 let leanRoutes = trip.routes;
 if (trip.routes) {
 leanRoutes = { ...trip.routes };
 for (const key of Object.keys(leanRoutes) as (keyof typeof leanRoutes)[]) {
 if (key === "routingOptions" || key === "bookedFlights") continue;
 const route = leanRoutes[key];
 if (!route || !("stops" in route) || !route.stops) continue;
 const { lean, media: routeMedia } = collectStopMedia(route.stops);
 leanRoutes[key] = { ...route, stops: lean };
 for (const [id, url] of Object.entries(routeMedia)) stopMedia[id] = url;
 }
 }
 const existingStop = readStopMediaSidecar(trip.id);
 const mergedStopMedia = { ...existingStop, ...stopMedia };
 const stopOk = writeStopMediaSidecar(trip.id, mergedStopMedia);

 // st:/http-Refs bleiben im Trip (klein); nur Data-URLs liegen im Sidecar/IDB
 const leanPhotoMaps = splitLeanPhotoMaps(trip.pdfPhotosByEtappe, trip.pdfPhotoLibraryByEtappe);
 const coverRef = trip.pdfCoverPhotoDataUrl?.trim() || "";
 const coverIsLight = !!coverRef && !coverRef.startsWith("data:");

 const leanTrip: Trip = {
 ...trip,
 stops: leanStops,
 routes: leanRoutes,
 pdfPhotosByEtappe: leanPhotoMaps.photos,
 pdfPhotoLibraryByEtappe: leanPhotoMaps.library,
 pdfPhotoCaptionsByEtappe: trip.pdfPhotoCaptionsByEtappe,
 pdfExtraTextByEtappe: stripExtraTextPhotos(trip.pdfExtraTextByEtappe),
 pdfCoverPhotoDataUrl: coverIsLight ? coverRef : "",
 };

 return { trip: leanTrip, mediaOk: pdfOk && stopOk };
}

/** Leichte Foto-Refs (st:, http) für localStorage; Data-URLs bleiben im schweren Sidecar. */
function splitLeanPhotoMaps(
 photos?: Record<string, string[]>,
 library?: Record<string, string[]>
): { photos: Record<string, string[]>; library: Record<string, string[]> } {
 const pickLight = (map?: Record<string, string[]>) => {
  const out: Record<string, string[]> = {};
  for (const [k, arr] of Object.entries(map || {})) {
   const light = (arr || []).filter((u) => u && !u.startsWith("data:"));
   if (light.length) out[k] = light;
  }
  return out;
 };
 return { photos: pickLight(photos), library: pickLight(library) };
}

function stripExtraTextPhotos(
 map?: Record<string, PdfExtraTextEntry[]>
): Record<string, PdfExtraTextEntry[]> | undefined {
 if (!map) return map;
 const out: Record<string, PdfExtraTextEntry[]> = {};
 for (const [k, entries] of Object.entries(map)) {
 out[k] = entries.map(({ photoDataUrl: _p, ...rest }) => rest);
 }
 return out;
}

export function applyPdfMediaToTrip(trip: Trip, side: TripPdfMediaSidecar | null | undefined): Trip {
 if (!sidecarHasPdfMedia(side)) return trip;
 const cover = side!.pdfCoverPhotoDataUrl?.trim();
 return {
 ...trip,
 pdfPhotosByEtappe: mergePhotoMaps(trip.pdfPhotosByEtappe, side!.pdfPhotosByEtappe) || trip.pdfPhotosByEtappe,
 pdfPhotoLibraryByEtappe:
 mergePhotoMaps(trip.pdfPhotoLibraryByEtappe, side!.pdfPhotoLibraryByEtappe) || trip.pdfPhotoLibraryByEtappe,
 pdfPhotoCaptionsByEtappe: side!.pdfPhotoCaptionsByEtappe || trip.pdfPhotoCaptionsByEtappe,
 pdfExtraTextByEtappe: side!.pdfExtraTextByEtappe || trip.pdfExtraTextByEtappe,
 pdfCoverPhotoDataUrl: cover || trip.pdfCoverPhotoDataUrl,
 };
}

/** Lädt ausgelagerte Medien wieder in den Trip (für Planer-Anzeige). */
export function hydrateTripMedia(trip: Trip): Trip {
 const pdfSide = readPdfMediaSidecar(trip.id);
 const stopMedia = readStopMediaSidecar(trip.id);
 let hydrated: Trip = {
 ...applyPdfMediaToTrip(trip, pdfSide),
 stops: applyStopMedia(trip.stops, stopMedia),
 };

 if (trip.routes) {
 const routes = { ...trip.routes };
 for (const key of Object.keys(routes) as (keyof typeof routes)[]) {
 if (key === "routingOptions" || key === "bookedFlights") continue;
 const route = routes[key];
 if (route && "stops" in route && route.stops) {
 routes[key] = { ...route, stops: applyStopMedia(route.stops, stopMedia) };
 }
 }
 hydrated.routes = routes;
 }

 const cover = readTripCoverPhoto(trip.id);
 if (cover && !hydrated.pdfCoverPhotoDataUrl?.trim()) {
 hydrated = { ...hydrated, pdfCoverPhotoDataUrl: cover };
 }

 return hydrated;
}

export function clearTripMediaSidecars(tripId: string): void {
 if (typeof window === "undefined" || !tripId) return;
 pdfMediaMemory.delete(tripId);
 stopMediaMemory.delete(tripId);
 removeTripCoverPhoto(tripId);
 clearLocalStorageKey(`${TRIP_PDF_MEDIA_PREFIX}${tripId}`);
 clearLocalStorageKey(`${TRIP_STOP_MEDIA_PREFIX}${tripId}`);
 clearLocalStorageKey(`${TRIP_COVER_PHOTO_PREFIX}${tripId}`);
 void idbDeletePdfMedia(tripId);
 void idbDeletePdfMedia(stopMediaIdbKey(tripId));
 void idbDeletePdfMedia(coverIdbKey(tripId));
}

export function pruneInactiveTripMediaSidecars(keepTripIds: Set<string>): void {
 if (typeof window === "undefined") return;
 const keysToRemove: string[] = [];
 for (let i = 0; i < localStorage.length; i++) {
 const key = localStorage.key(i) || "";
 if (!key.startsWith(TRIP_PDF_MEDIA_PREFIX) && !key.startsWith(TRIP_STOP_MEDIA_PREFIX)) continue;
 const tripId = key
 .replace(TRIP_PDF_MEDIA_PREFIX, "")
 .replace(TRIP_STOP_MEDIA_PREFIX, "");
 if (!keepTripIds.has(tripId)) keysToRemove.push(key);
 }
 keysToRemove.forEach((key) => {
 try {
 localStorage.removeItem(key);
 } catch {
 /* ignore */
 }
 });
}
