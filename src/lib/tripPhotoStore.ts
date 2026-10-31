/**
 * Lokale Foto-Bibliothek: Thumbnail für UI, Full für PDF/Export.
 * Referenzen im Trip: `st:{assetId}` (nicht Base64).
 * Wahrheit in IndexedDB + Reisedatei (ZIP-Container).
 */

const IDB_NAME = "sniffertrek_photos_v1";
const IDB_STORE = "assets";
const IDB_VERSION = 1;

export const MEDIA_REF_PREFIX = "st:";

export type TripPhotoAsset = {
  id: string;
  tripId: string;
  mime: string;
  thumbBlob: Blob;
  fullBlob: Blob;
  createdAt: number;
  width?: number;
  height?: number;
};

const thumbObjectUrls = new Map<string, string>();
const fullObjectUrls = new Map<string, string>();

export function isMediaRef(value: string | undefined | null): boolean {
  return !!value && value.startsWith(MEDIA_REF_PREFIX);
}

export function mediaRefId(ref: string): string {
  return ref.slice(MEDIA_REF_PREFIX.length);
}

export function toMediaRef(id: string): string {
  return `${MEDIA_REF_PREFIX}${id}`;
}

export function isDisplayablePhotoUrl(value: string | undefined | null): boolean {
  if (!value) return false;
  return (
    isMediaRef(value) ||
    value.startsWith("data:image/") ||
    value.startsWith("blob:") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  );
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        const store = db.createObjectStore(IDB_STORE, { keyPath: "id" });
        store.createIndex("tripId", "tripId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(asset: TripPhotoAsset): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(IDB_STORE).put(asset);
  });
  db.close();
}

async function idbGet(id: string): Promise<TripPhotoAsset | null> {
  const db = await openDb();
  const asset = await new Promise<TripPhotoAsset | null>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(id);
    req.onsuccess = () => resolve((req.result as TripPhotoAsset) || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return asset;
}

async function idbGetAllForTrip(tripId: string): Promise<TripPhotoAsset[]> {
  const db = await openDb();
  const rows = await new Promise<TripPhotoAsset[]>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const idx = tx.objectStore(IDB_STORE).index("tripId");
    const req = idx.getAll(tripId);
    req.onsuccess = () => resolve((req.result as TripPhotoAsset[]) || []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return rows;
}

export async function deleteTripPhotoAssets(tripId: string): Promise<void> {
  const all = await idbGetAllForTrip(tripId);
  if (!all.length) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    const store = tx.objectStore(IDB_STORE);
    for (const a of all) store.delete(a.id);
  });
  db.close();
  for (const a of all) {
    revokeCached(toMediaRef(a.id));
  }
}

function revokeCached(ref: string): void {
  const t = thumbObjectUrls.get(ref);
  if (t) {
    URL.revokeObjectURL(t);
    thumbObjectUrls.delete(ref);
  }
  const f = fullObjectUrls.get(ref);
  if (f) {
    URL.revokeObjectURL(f);
    fullObjectUrls.delete(ref);
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

async function canvasToJpegBlob(
  img: HTMLImageElement,
  maxEdge: number,
  quality: number
): Promise<{ blob: Blob; width: number; height: number }> {
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(img, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      quality
    );
  });
  return { blob, width, height };
}

function newAssetId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Datei → Thumb (UI) + Full (PDF), speichert in IDB, gibt `st:`-Ref zurück. */
export async function ingestPhotoFile(tripId: string, file: File): Promise<string | null> {
  if (!tripId || !file.type.startsWith("image/")) return null;
  try {
    const img = await loadImageFromBlob(file);
    const full = await canvasToJpegBlob(img, 1600, 0.88);
    const thumb = await canvasToJpegBlob(img, 360, 0.72);
    const id = newAssetId();
    const asset: TripPhotoAsset = {
      id,
      tripId,
      mime: "image/jpeg",
      thumbBlob: thumb.blob,
      fullBlob: full.blob,
      createdAt: Date.now(),
      width: full.width,
      height: full.height,
    };
    await idbPut(asset);
    const ref = toMediaRef(id);
    thumbObjectUrls.set(ref, URL.createObjectURL(thumb.blob));
    return ref;
  } catch (err) {
    console.warn("[tripPhotoStore] ingestPhotoFile failed", err);
    return null;
  }
}

/** Legacy Data-URL → Asset + `st:`-Ref. */
export async function ingestDataUrl(tripId: string, dataUrl: string): Promise<string | null> {
  if (!tripId || !dataUrl.startsWith("data:image/")) return null;
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const img = await loadImageFromBlob(blob);
    const full = await canvasToJpegBlob(img, 1600, 0.88);
    const thumb = await canvasToJpegBlob(img, 360, 0.72);
    const id = newAssetId();
    const asset: TripPhotoAsset = {
      id,
      tripId,
      mime: "image/jpeg",
      thumbBlob: thumb.blob,
      fullBlob: full.blob,
      createdAt: Date.now(),
      width: full.width,
      height: full.height,
    };
    await idbPut(asset);
    const ref = toMediaRef(id);
    thumbObjectUrls.set(ref, URL.createObjectURL(thumb.blob));
    return ref;
  } catch (err) {
    console.warn("[tripPhotoStore] ingestDataUrl failed", err);
    return null;
  }
}

export async function putImportedAsset(asset: TripPhotoAsset): Promise<void> {
  await idbPut(asset);
  const ref = toMediaRef(asset.id);
  revokeCached(ref);
  thumbObjectUrls.set(ref, URL.createObjectURL(asset.thumbBlob));
}

/** UI: Thumbnail-Object-URL (cached). */
export async function ensureThumbUrl(refOrUrl: string): Promise<string> {
  if (!refOrUrl) return "";
  if (!isMediaRef(refOrUrl)) return refOrUrl;
  const cached = thumbObjectUrls.get(refOrUrl);
  if (cached) return cached;
  const asset = await idbGet(mediaRefId(refOrUrl));
  if (!asset) return "";
  const url = URL.createObjectURL(asset.thumbBlob);
  thumbObjectUrls.set(refOrUrl, url);
  return url;
}

/** Selten: Full-Object-URL für Lightbox/Zoom (nicht für Listen). */
export async function ensureFullObjectUrl(refOrUrl: string): Promise<string> {
  if (!refOrUrl) return "";
  if (!isMediaRef(refOrUrl)) return refOrUrl;
  const cached = fullObjectUrls.get(refOrUrl);
  if (cached) return cached;
  const asset = await idbGet(mediaRefId(refOrUrl));
  if (!asset) return "";
  const url = URL.createObjectURL(asset.fullBlob);
  fullObjectUrls.set(refOrUrl, url);
  return url;
}

export function getCachedThumbUrl(refOrUrl: string): string | undefined {
  if (!isMediaRef(refOrUrl)) return refOrUrl || undefined;
  return thumbObjectUrls.get(refOrUrl);
}

/** PDF/Export: Full als Data-URL. */
export async function resolveFullDataUrl(refOrUrl: string): Promise<string | undefined> {
  if (!refOrUrl) return undefined;
  if (refOrUrl.startsWith("data:image/")) return refOrUrl;
  if (refOrUrl.startsWith("http://") || refOrUrl.startsWith("https://") || refOrUrl.startsWith("blob:")) {
    return refOrUrl;
  }
  if (!isMediaRef(refOrUrl)) return undefined;
  const asset = await idbGet(mediaRefId(refOrUrl));
  if (!asset) return undefined;
  return blobToDataUrl(asset.fullBlob);
}

export async function listTripPhotoAssets(tripId: string): Promise<TripPhotoAsset[]> {
  return idbGetAllForTrip(tripId);
}

/** Prefetch Thumbs für eine Liste von Refs (UI-Warmup). */
export async function warmThumbCache(refs: string[]): Promise<void> {
  const unique = Array.from(new Set(refs.filter(isMediaRef)));
  await Promise.all(unique.map((r) => ensureThumbUrl(r)));
}

export function collectMediaRefsFromStrings(values: (string | undefined)[]): string[] {
  return values.filter((v): v is string => !!v && isMediaRef(v));
}
