/** Shared with GoogleMap segment cache. */
export const SEGMENT_CACHE_STORAGE_KEY = "sniffertrek_route_segment_cache_v1";

const ROUTE_MANIFEST_STORAGE_PREFIX = "sniffertrek_route_manifest_v1:";
const ROUTE_SHADOW_PREFIX = "sniffertrek_route_shadow:";
const PDF_OVERVIEW_PREFIX = "sniffertrek_pdf_overview_map_";
const TRIP_COVER_PREFIX = "sniffertrek_trip_cover:";
const TRIP_COVERS_KEY = "sniffertrek_trip_covers";
const TRIP_PDF_MEDIA_PREFIX = "sniffertrek_trip_pdf_media:";
const TRIP_STOP_MEDIA_PREFIX = "sniffertrek_trip_stop_media:";

/** Tabs that use GoogleMap cacheNamespace `${tripId}:${tab}`. */
export const ROUTE_CACHE_TABS = ["route", "car", "train", "flights"] as const;

/** Start pruning before Safari/localStorage quota (~5–10 MB per origin). */
const SOFT_BUDGET_BYTES = 4 * 1024 * 1024;

export interface PruneLocalStorageOptions {
 activeTripId: string | null;
 knownTripIds: string[];
 /** Drops PDF preview maps, cover blobs, non-active shadows, segment cache. */
 aggressive?: boolean;
}

export interface PruneLocalStorageResult {
 removedKeys: string[];
 freedBytes: number;
 totalBytesAfter: number;
}

function keySize(key: string): number {
 try {
 const v = window.localStorage.getItem(key);
 return v ? new Blob([v]).size : 0;
 } catch {
 return 0;
 }
}

function removeKey(key: string, removed: string[], freed: { n: number }) {
 const b = keySize(key);
 try {
 window.localStorage.removeItem(key);
 removed.push(key);
 freed.n += b;
 } catch {
 /* ignore */
 }
}

function sniffertrekTotalBytes(): number {
 let total = 0;
 for (let i = 0; i < window.localStorage.length; i++) {
 const key = window.localStorage.key(i) || "";
 if (key.startsWith("sniffertrek_") || key.startsWith("sb-")) {
 total += keySize(key);
 }
 }
 return total;
}

function manifestNamespaceFromKey(key: string): string | null {
 if (!key.startsWith(ROUTE_MANIFEST_STORAGE_PREFIX)) return null;
 return key.slice(ROUTE_MANIFEST_STORAGE_PREFIX.length) || null;
}

function tripIdFromManifestNamespace(namespace: string): string | null {
 const idx = namespace.indexOf(":");
 if (idx <= 0) return null;
 return namespace.slice(0, idx);
}

function tripIdFromShadowKey(key: string): string | null {
 if (!key.startsWith(ROUTE_SHADOW_PREFIX)) return null;
 return key.slice(ROUTE_SHADOW_PREFIX.length) || null;
}

export function trimSegmentCache(maxItems = 80): void {
 if (typeof window === "undefined") return;
 try {
 const raw = window.localStorage.getItem(SEGMENT_CACHE_STORAGE_KEY);
 if (!raw) return;
 const parsed = JSON.parse(raw) as { savedAt?: number }[];
 if (!Array.isArray(parsed)) {
 window.localStorage.removeItem(SEGMENT_CACHE_STORAGE_KEY);
 return;
 }
 const trimmed = [...parsed]
 .sort((a, b) => Number(b.savedAt || 0) - Number(a.savedAt || 0))
 .slice(0, maxItems);
 window.localStorage.setItem(SEGMENT_CACHE_STORAGE_KEY, JSON.stringify(trimmed));
 } catch {
 try {
 window.localStorage.removeItem(SEGMENT_CACHE_STORAGE_KEY);
 } catch {
 /* ignore */
 }
 }
}

export function clearTripRouteCaches(tripId: string): void {
 if (typeof window === "undefined" || !tripId) return;
 try {
 window.localStorage.removeItem(`${ROUTE_SHADOW_PREFIX}${tripId}`);
 for (const tab of ROUTE_CACHE_TABS) {
 window.localStorage.removeItem(`${ROUTE_MANIFEST_STORAGE_PREFIX}${tripId}:${tab}`);
 }
 } catch {
 /* ignore */
 }
}

export function clearHeavyMediaCaches(): void {
 if (typeof window === "undefined") return;
 const keysToDelete: string[] = [];
 for (let i = 0; i < window.localStorage.length; i++) {
 const key = window.localStorage.key(i) || "";
 if (key.startsWith(PDF_OVERVIEW_PREFIX)) {
 keysToDelete.push(key);
 }
 }
 keysToDelete.forEach((key) => {
 try {
 window.localStorage.removeItem(key);
 } catch {
 /* ignore */
 }
 });
}

/**
 * Removes orphaned route manifests/shadows and, if needed, non-active trip manifests
 * to stay below the browser quota.
 */
export function pruneSniffertrekLocalStorage(opts: PruneLocalStorageOptions): PruneLocalStorageResult {
 const removed: string[] = [];
 const freed = { n: 0 };
 if (typeof window === "undefined") {
 return { removedKeys: removed, freedBytes: 0, totalBytesAfter: 0 };
 }

 const known = new Set(opts.knownTripIds.filter(Boolean));
 const active = opts.activeTripId?.trim() || null;
 const keepTripIds = new Set(known);
 if (active) keepTripIds.add(active);

 const manifestKeys: { key: string; namespace: string; tripId: string; savedAt: number; bytes: number }[] = [];
 const keysToRemove: string[] = [];

 for (let i = 0; i < window.localStorage.length; i++) {
 const key = window.localStorage.key(i) || "";

 const shadowTripId = tripIdFromShadowKey(key);
 if (shadowTripId && !keepTripIds.has(shadowTripId)) {
 keysToRemove.push(key);
 continue;
 }
 if (opts.aggressive && shadowTripId && active && shadowTripId !== active) {
 keysToRemove.push(key);
 continue;
 }

 const namespace = manifestNamespaceFromKey(key);
 if (!namespace) continue;
 const tripId = tripIdFromManifestNamespace(namespace);
 if (!tripId) continue;
 const bytes = keySize(key);
 if (!keepTripIds.has(tripId)) {
 keysToRemove.push(key);
 continue;
 }
 let savedAt = 0;
 try {
 const raw = window.localStorage.getItem(key);
 if (raw) {
 const parsed = JSON.parse(raw) as { savedAt?: number };
 savedAt = Number(parsed?.savedAt || 0);
 }
 } catch {
 savedAt = 0;
 }
 manifestKeys.push({ key, namespace, tripId, savedAt, bytes });
 }

 keysToRemove.forEach((key) => removeKey(key, removed, freed));

 let total = sniffertrekTotalBytes();
 const overBudget = () => total > SOFT_BUDGET_BYTES;

 if (overBudget() || opts.aggressive) {
 const sorted = [...manifestKeys].sort((a, b) => a.savedAt - b.savedAt);
 for (const row of sorted) {
 if (!overBudget() && !opts.aggressive) break;
 if (active && row.tripId === active) continue;
 if (removed.includes(row.key)) continue;
 removeKey(row.key, removed, freed);
 total = sniffertrekTotalBytes();
 }
 }

 trimSegmentCache(opts.aggressive ? 40 : 80);

 if (opts.aggressive) {
 clearHeavyMediaCaches();
 try {
 window.localStorage.removeItem(SEGMENT_CACHE_STORAGE_KEY);
 removed.push(SEGMENT_CACHE_STORAGE_KEY);
 } catch {
 /* ignore */
 }
 }

 return {
 removedKeys: removed,
 freedBytes: freed.n,
 totalBytesAfter: sniffertrekTotalBytes(),
 };
}

/** Notfall: Speicher für aktive Reise freimachen (PDF-Sidecars anderer Reisen, grosse Covers). */
export function emergencyFreeStorageForActiveTrip(
 activeTripId: string | null,
 knownTripIds: string[]
): PruneLocalStorageResult {
 const result = pruneSniffertrekLocalStorage({
 activeTripId,
 knownTripIds,
 aggressive: true,
 });
 if (typeof window === "undefined") return result;

 const active = activeTripId?.trim() || null;
 const keysToRemove: string[] = [];
 for (let i = 0; i < window.localStorage.length; i++) {
 const key = window.localStorage.key(i) || "";
 if (key.startsWith(TRIP_PDF_MEDIA_PREFIX) || key.startsWith(TRIP_STOP_MEDIA_PREFIX)) {
 const tripId = key
 .replace(TRIP_PDF_MEDIA_PREFIX, "")
 .replace(TRIP_STOP_MEDIA_PREFIX, "");
 if (active && tripId !== active) keysToRemove.push(key);
 }
 if (key.startsWith(TRIP_COVER_PREFIX) && active) {
 const tripId = key.slice(TRIP_COVER_PREFIX.length);
 if (tripId !== active) keysToRemove.push(key);
 }
 }
 const extraFreed = { n: 0 };
 keysToRemove.forEach((key) => removeKey(key, result.removedKeys, extraFreed));
 result.freedBytes += extraFreed.n;
 result.totalBytesAfter = sniffertrekTotalBytes();
 return result;
}
