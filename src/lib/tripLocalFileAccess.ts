import {
  buildTripFileBlobAsync,
  downloadTripFile,
  parseTripFileBlob,
  suggestTripFileName,
  TRIP_FILE_EXTENSION,
  TRIP_FILE_EXTENSION_LEGACY,
  TRIP_FILE_EXTENSION_PLAIN,
  TRIP_FILE_MIME,
} from "./tripLocalFileDocument";
import type { Trip } from "./types";

const LINK_META_KEY = "sniffertrek_trip_file_links";
const IDB_NAME = "sniffertrek_trip_file_handles";
const IDB_STORE = "handles";

type FileLinkMeta = {
  fileName: string;
  linkedAt: string;
};

type StoredHandleRow = {
  tripId: string;
  handle: FileSystemFileHandle;
  fileName: string;
};

export type TripFileLinkState =
  | { status: "none" }
  | { status: "linked"; fileName: string }
  | { status: "needs_reconnect"; fileName: string }
  | { status: "write_failed"; fileName: string; message?: string }
  | { status: "picker_failed" };

declare global {
  interface Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: { description: string; accept: Record<string, string[]> }[];
    }) => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: (options?: {
      multiple?: boolean;
      types?: { description: string; accept: Record<string, string[]> }[];
    }) => Promise<FileSystemFileHandle[]>;
  }
}

const PICKER_TYPES_TRIP = [
  {
    description: "SnifferTrek Reise",
    accept: {
      "application/zip": [TRIP_FILE_EXTENSION, TRIP_FILE_EXTENSION_PLAIN, ".zip"],
      "application/json": [TRIP_FILE_EXTENSION_LEGACY, ".json"],
    },
  },
];

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && typeof window.showSaveFilePicker === "function";
}

function canOpenFilePicker(): boolean {
  return typeof window !== "undefined" && typeof window.showOpenFilePicker === "function";
}

async function pickTripFileViaInput(): Promise<{ blob: Blob; fileName: string }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    // Kein accept-Filter: macOS graut .sniffertrek sonst aus (unbekannte Extension)
    input.style.display = "none";
    input.onchange = () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      resolve({ blob: file, fileName: file.name });
    };
    document.body.appendChild(input);
    input.click();
  });
}

/** Safari (und iOS) meldet teils API-Support, der Speichern-Dialog scheitert trotzdem oft. */
export function isSafariBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrom|Edg|CriOS|FxiOS|OPR/i.test(ua);
}

export function isLinkedFileAutoSaveReliable(): boolean {
  return isFileSystemAccessSupported() && !isSafariBrowser();
}

const SAFARI_HINT_LAST_KEY = "sniffertrek_safari_save_hint_last";
const SAFARI_HINT_OFF_KEY = "sniffertrek_safari_save_hint_off";
export const SAFARI_SAVE_HINT_INTERVAL_MS = 5 * 60 * 1000;

export function isSafariSaveHintDisabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SAFARI_HINT_OFF_KEY) === "1";
}

export function disableSafariSaveHintForever(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAFARI_HINT_OFF_KEY, "1");
}

export function shouldShowSafariSaveHint(): boolean {
  if (typeof window === "undefined" || !isSafariBrowser() || isSafariSaveHintDisabled()) return false;
  const last = Number(localStorage.getItem(SAFARI_HINT_LAST_KEY) || 0);
  return Date.now() - last >= SAFARI_SAVE_HINT_INTERVAL_MS;
}

export function markSafariSaveHintShown(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAFARI_HINT_LAST_KEY, String(Date.now()));
}

export type SaveTripToFileResult = {
  linkState: TripFileLinkState;
  outcome: "linked" | "download" | "cancelled" | "failed";
  fileName?: string;
};

export type PickSaveFileResult = { handle: FileSystemFileHandle | null; cancelled: boolean };

/** Im Klick-Handler synchron aufrufen – nur ein showSaveFilePicker (Retries verlieren die User-Gesture). */
export function startSaveFilePickerInUserGesture(trip: Trip):
  | { kind: "unsupported" }
  | { kind: "started"; promise: Promise<FileSystemFileHandle> } {
  if (typeof window === "undefined" || typeof window.showSaveFilePicker !== "function") {
    return { kind: "unsupported" };
  }
  if (!window.isSecureContext) {
    return { kind: "unsupported" };
  }
  const suggestedName = suggestTripFileName(trip);
  const promise = window.showSaveFilePicker({
    suggestedName,
    types: PICKER_TYPES_TRIP,
  });
  return { kind: "started", promise };
}

/** Safari-Fallback: Teilen-Sheet – asynchron ZIP bauen, dann share. */
export function startShareTripFileInUserGesture(
  trip: Trip,
  beforeWrite?: () => void
): { kind: "unsupported" } | { kind: "started"; promise: Promise<void>; fileName: string } {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return { kind: "unsupported" };
  }
  beforeWrite?.();
  const fileName = suggestTripFileName(trip);
  const promise = (async () => {
    const blob = await buildTripFileBlobAsync(trip);
    const file = new File([blob], fileName, { type: TRIP_FILE_MIME });
    if (typeof navigator.canShare === "function" && !navigator.canShare({ files: [file] })) {
      throw new Error("share_unsupported");
    }
    await navigator.share({
      files: [file],
      title: trip.name && trip.name !== "Neue Reise" ? trip.name : "SnifferTrek-Reise",
    });
  })();
  return { kind: "started", promise, fileName };
}

/** @deprecated Prefer startSaveFilePickerInUserGesture from click handler. */
export function pickSaveFileForTrip(trip: Trip): Promise<PickSaveFileResult> {
  return pickSaveFileHandle(suggestTripFileName(trip));
}

export async function saveTripToChosenHandle(
  trip: Trip,
  handle: FileSystemFileHandle,
  session: TripLocalFileSession = tripLocalFileSession,
  beforeWrite?: () => void
): Promise<SaveTripToFileResult> {
  const state = await session.linkToSaveHandle(trip, handle, beforeWrite);
  if (state.status === "linked") {
    return { linkState: state, outcome: "linked", fileName: state.fileName };
  }
  return { linkState: state, outcome: "failed" };
}

/** Ein Einstieg «Datei speichern»: Systemdialog wenn möglich, Download nur ohne API (nicht Safari). */
export async function saveTripToFile(
  trip: Trip,
  session: TripLocalFileSession = tripLocalFileSession,
  beforeWrite?: () => void
): Promise<SaveTripToFileResult> {
  const suggested = suggestTripFileName(trip);
  const pick = await pickSaveFileHandle(suggested);
  if (pick.cancelled) {
    return { linkState: { status: "none" }, outcome: "cancelled" };
  }
  if (pick.handle) {
    return saveTripToChosenHandle(trip, pick.handle, session, beforeWrite);
  }
  if (isSafariBrowser() || isFileSystemAccessSupported()) {
    return { linkState: { status: "picker_failed" }, outcome: "failed" };
  }
  downloadTripFile(trip, suggested);
  return { linkState: { status: "none" }, outcome: "download", fileName: suggested };
}

/** Safari bricht oft bei strikten custom types ab – zuerst ohne, dann mit .json. */
async function pickSaveFileHandle(suggestedName: string): Promise<PickSaveFileResult> {
  if (!isFileSystemAccessSupported()) return { handle: null, cancelled: false };
  const attempts: (() => Promise<FileSystemFileHandle>)[] = [
    () => window.showSaveFilePicker!({ suggestedName }),
    () => window.showSaveFilePicker!({ suggestedName, types: PICKER_TYPES_TRIP }),
  ];
  for (const attempt of attempts) {
    try {
      return { handle: await attempt(), cancelled: false };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { handle: null, cancelled: true };
      }
      console.warn("[TripLocalFileSession] showSaveFilePicker attempt failed", err);
    }
  }
  return { handle: null, cancelled: false };
}

function readLinkMetaMap(): Record<string, FileLinkMeta> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LINK_META_KEY);
    return raw ? (JSON.parse(raw) as Record<string, FileLinkMeta>) : {};
  } catch {
    return {};
  }
}

function writeLinkMetaMap(map: Record<string, FileLinkMeta>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LINK_META_KEY, JSON.stringify(map));
}

export function getTripFileLinkMeta(tripId: string): FileLinkMeta | null {
  return readLinkMetaMap()[tripId] ?? null;
}

function setTripFileLinkMeta(tripId: string, meta: FileLinkMeta): void {
  const map = readLinkMetaMap();
  map[tripId] = meta;
  writeLinkMetaMap(map);
}

export function clearTripFileLinkMeta(tripId: string): void {
  const map = readLinkMetaMap();
  delete map[tripId];
  writeLinkMetaMap(map);
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE, { keyPath: "tripId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPutHandle(tripId: string, handle: FileSystemFileHandle, fileName: string): Promise<void> {
  const db = await openIdb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(IDB_STORE).put({ tripId, handle, fileName } satisfies StoredHandleRow);
  });
  db.close();
}

async function idbGetHandle(tripId: string): Promise<StoredHandleRow | null> {
  const db = await openIdb();
  const row = await new Promise<StoredHandleRow | undefined>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    tx.onerror = () => reject(tx.error);
    const req = tx.objectStore(IDB_STORE).get(tripId);
    req.onsuccess = () => resolve(req.result as StoredHandleRow | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return row ?? null;
}

async function idbDeleteHandle(tripId: string): Promise<void> {
  const db = await openIdb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(IDB_STORE).delete(tripId);
  });
  db.close();
}

type WritableFileHandle = FileSystemFileHandle & {
  queryPermission?(descriptor: { mode: "read" | "readwrite" }): Promise<PermissionState>;
  requestPermission?(descriptor: { mode: "read" | "readwrite" }): Promise<PermissionState>;
  createWritable(): Promise<FileSystemWritableFileStream>;
};

async function ensureWritePermission(handle: FileSystemFileHandle): Promise<boolean> {
  const h = handle as WritableFileHandle;
  const opts = { mode: "readwrite" as const };
  if (h.queryPermission && (await h.queryPermission(opts)) === "granted") return true;
  if (h.requestPermission) {
    return (await h.requestPermission(opts)) === "granted";
  }
  return true;
}

async function writeToHandle(handle: FileSystemFileHandle, trip: Trip): Promise<void> {
  const blob = await buildTripFileBlobAsync(trip);
  const h = handle as WritableFileHandle;
  const writable = await h.createWritable();
  await writable.write(blob);
  await writable.close();
}

export class TripLocalFileSession {
  private handle: FileSystemFileHandle | null = null;
  private fileName = "";
  private tripId = "";
  private writeQueue: Promise<void> = Promise.resolve();

  get linkedFileName(): string {
    return this.fileName;
  }

  get hasActiveHandle(): boolean {
    return !!this.handle;
  }

  async resolveLinkState(tripId: string): Promise<TripFileLinkState> {
    this.tripId = tripId;
    const meta = getTripFileLinkMeta(tripId);
    if (!meta) return { status: "none" };

    this.fileName = meta.fileName;
    const stored = await idbGetHandle(tripId);
    if (!stored?.handle) {
      return { status: "needs_reconnect", fileName: meta.fileName };
    }

    this.handle = stored.handle;
    const ok = await ensureWritePermission(stored.handle);
    if (!ok) {
      this.handle = null;
      return { status: "needs_reconnect", fileName: meta.fileName };
    }
    return { status: "linked", fileName: meta.fileName };
  }

  async linkSaveAs(trip: Trip, beforeWrite?: () => void): Promise<TripFileLinkState> {
    this.tripId = trip.id;
    const suggested = suggestTripFileName(trip);

    const { handle, cancelled } = await pickSaveFileHandle(suggested);
    if (!handle) {
      if (cancelled) return this.resolveLinkState(trip.id);
      if (!isFileSystemAccessSupported()) return { status: "picker_failed" };
      return { status: "picker_failed" };
    }
    return this.linkToSaveHandle(trip, handle, beforeWrite);
  }

  async linkToSaveHandle(
    trip: Trip,
    handle: FileSystemFileHandle,
    beforeWrite?: () => void
  ): Promise<TripFileLinkState> {
    this.tripId = trip.id;
    const suggested = suggestTripFileName(trip);

    try {
      const ok = await ensureWritePermission(handle);
      if (!ok) return { status: "picker_failed" };
      beforeWrite?.();
      await writeToHandle(handle, trip);
      this.handle = handle;
      this.fileName = handle.name || suggested;
      setTripFileLinkMeta(trip.id, { fileName: this.fileName, linkedAt: new Date().toISOString() });
      await idbPutHandle(trip.id, handle, this.fileName);
      return { status: "linked", fileName: this.fileName };
    } catch (err) {
      console.warn("[TripLocalFileSession] save to handle failed", err);
      return { status: "picker_failed" };
    }
  }

  async reconnectOpen(tripId: string): Promise<TripFileLinkState | null> {
    const restored = await this.tryRestoreLinkedFile(tripId);
    if (restored) return restored;

    if (!isFileSystemAccessSupported()) return null;
    try {
      let handle: FileSystemFileHandle | undefined;
      try {
        const handles = await window.showOpenFilePicker!({ multiple: false });
        handle = handles[0];
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return null;
        return null;
      }
      if (!handle) return null;

      const file = await handle.getFile();
      const trip = await parseTripFileBlob(file);
      if (trip.id !== tripId) {
        throw new Error("trip_id_mismatch");
      }
      const ok = await ensureWritePermission(handle);
      if (!ok) throw new Error("permission_denied");

      const fileName = handle.name || file.name;
      this.tripId = tripId;
      this.handle = handle;
      this.fileName = fileName;
      setTripFileLinkMeta(tripId, { fileName, linkedAt: new Date().toISOString() });
      await idbPutHandle(tripId, handle, fileName);
      await writeToHandle(handle, trip);
      return { status: "linked", fileName };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return null;
      console.warn("[TripLocalFileSession] reconnect failed", err);
      return null;
    }
  }

  /** Nach Tab-Neustart: oft reicht Berechtigung ohne Datei-Dialog (Chrome/Edge). */
  async tryRestoreLinkedFile(tripId: string): Promise<TripFileLinkState | null> {
    const meta = getTripFileLinkMeta(tripId);
    if (!meta) return null;
    const stored = await idbGetHandle(tripId);
    if (!stored?.handle) return null;
    const ok = await ensureWritePermission(stored.handle);
    if (!ok) return null;
    this.tripId = tripId;
    this.handle = stored.handle;
    this.fileName = meta.fileName;
    return { status: "linked", fileName: meta.fileName };
  }

  async openFileAsNewTrip(): Promise<Trip | null> {
    try {
      let fileBlob: Blob;
      let fileName = "";
      let handle: FileSystemFileHandle | null = null;

      if (canOpenFilePicker()) {
        try {
          // Ohne types: .sniffertrek ist auf macOS sonst oft ausgegraut
          const handles = await window.showOpenFilePicker!({ multiple: false });
          handle = handles[0];
          const file = await handle.getFile();
          fileBlob = file;
          fileName = handle.name || file.name;
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return null;
          const picked = await pickTripFileViaInput();
          fileBlob = picked.blob;
          fileName = picked.fileName;
        }
      } else {
        const picked = await pickTripFileViaInput();
        fileBlob = picked.blob;
        fileName = picked.fileName;
      }

      const trip = await parseTripFileBlob(fileBlob);
      if (handle) {
        try {
          const ok = await ensureWritePermission(handle);
          if (ok) {
            this.handle = handle;
            this.tripId = trip.id;
            this.fileName = fileName;
            setTripFileLinkMeta(trip.id, { fileName, linkedAt: new Date().toISOString() });
            await idbPutHandle(trip.id, handle, fileName);
          }
        } catch (linkErr) {
          console.warn("[TripLocalFileSession] link after open failed", linkErr);
        }
      }
      return trip;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return null;
      throw err;
    }
  }

  /** Debounced writes serialized through writeQueue. */
  scheduleWrite(trip: Trip): void {
    if (!this.handle || trip.id !== this.tripId) return;
    // .catch: frühere Fehler dürfen die Queue nicht dauerhaft blockieren
    this.writeQueue = this.writeQueue.catch(() => undefined).then(async () => {
      if (!this.handle) return;
      try {
        const ok = await ensureWritePermission(this.handle);
        if (!ok) throw new Error("permission_denied");
        await writeToHandle(this.handle, trip);
      } catch (err) {
        console.warn("[TripLocalFileSession] auto-write failed", err);
      }
    });
  }

  async flushWrite(trip: Trip): Promise<TripFileLinkState> {
    if (!this.handle || trip.id !== this.tripId) {
      return this.resolveLinkState(trip.id);
    }
    try {
      await this.writeQueue.catch(() => undefined);
      const ok = await ensureWritePermission(this.handle);
      if (!ok) {
        this.handle = null;
        return { status: "needs_reconnect", fileName: this.fileName };
      }
      await writeToHandle(this.handle, trip);
      return { status: "linked", fileName: this.fileName };
    } catch (err) {
      console.warn("[TripLocalFileSession] flush failed", err);
      return { status: "write_failed", fileName: this.fileName, message: String(err) };
    }
  }

  async unlink(tripId: string): Promise<void> {
    if (this.tripId === tripId) {
      this.handle = null;
      this.fileName = "";
    }
    clearTripFileLinkMeta(tripId);
    await idbDeleteHandle(tripId);
  }
}

export const tripLocalFileSession = new TripLocalFileSession();
