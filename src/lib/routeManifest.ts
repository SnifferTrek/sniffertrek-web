import type { RouteLegInfo } from "@/lib/types";
import { pruneSniffertrekLocalStorage } from "@/lib/localStorageCleanup";

/**
 * Explizites „Routen-File“: eine konsistente JSON-Struktur pro Reise/Tab,
 * die komplette Etappen inkl. Google-Directions-Ergebnis speichert.
 * Wird vor einer Neuberechnung geladen und in den Segment-Cache gemerged,
 * damit keine Directions-Calls nötig sind, solange der Fingerprint gleich bleibt.
 */

export const ROUTE_MANIFEST_STORAGE_PREFIX = "sniffertrek_route_manifest_v1:";

export interface RouteManifestSegment {
 /** Gleicher Key wie in GoogleMap segmentKey() */
 key: string;
 distance: number;
 duration: number;
 legs: RouteLegInfo[];
 /** serialisierbares google.maps.DirectionsResult */
 result: unknown;
}

export interface RouteManifest {
 version: 1;
 /** z. B. `${tripId}:route` — gleich cacheNamespace in GoogleMap */
 namespace: string;
 /** buildRouteFingerprint(...) */
 fingerprint: string;
 savedAt: number;
 segments: RouteManifestSegment[];
}

export function routeManifestStorageKey(namespace: string): string {
 return `${ROUTE_MANIFEST_STORAGE_PREFIX}${namespace}`;
}

export function loadRouteManifest(namespace: string): RouteManifest | null {
 if (typeof window === "undefined") return null;
 try {
 const raw = window.localStorage.getItem(routeManifestStorageKey(namespace));
 if (!raw) return null;
 const parsed = JSON.parse(raw) as RouteManifest;
 if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.segments)) return null;
 return parsed;
 } catch {
 return null;
 }
}

export function saveRouteManifest(manifest: Omit<RouteManifest, "version" | "savedAt"> & { savedAt?: number }): boolean {
 if (typeof window === "undefined") return false;
 const full: RouteManifest = {
 version: 1,
 namespace: manifest.namespace,
 fingerprint: manifest.fingerprint,
 savedAt: manifest.savedAt ?? Date.now(),
 segments: manifest.segments,
 };
 try {
 window.localStorage.setItem(routeManifestStorageKey(manifest.namespace), JSON.stringify(full));
 return true;
 } catch (e) {
 console.warn("[RouteManifest] Speichern fehlgeschlagen (Quota?), räume Caches auf …", e);
 try {
 const activeTripId = window.localStorage.getItem("sniffertrek_active_trip");
 let knownTripIds: string[] = [];
 try {
 const raw = window.localStorage.getItem("sniffertrek_trips");
 knownTripIds = raw ? (JSON.parse(raw) as { id: string }[]).map((t) => t.id) : [];
 } catch {
 knownTripIds = [];
 }
 pruneSniffertrekLocalStorage({ activeTripId, knownTripIds, aggressive: false });
 window.localStorage.setItem(routeManifestStorageKey(manifest.namespace), JSON.stringify(full));
 return true;
 } catch (retryErr) {
 console.warn("[RouteManifest] Speichern nach Aufräumen fehlgeschlagen", retryErr);
 return false;
 }
 }
}

export function clearRouteManifest(namespace: string): void {
 if (typeof window === "undefined") return;
 try {
 window.localStorage.removeItem(routeManifestStorageKey(namespace));
 } catch {
 /* ignore */
 }
}

export function downloadRouteManifestFile(namespace: string, filename?: string): void {
 const m = loadRouteManifest(namespace);
 if (!m) return;
 const blob = new Blob([JSON.stringify(m, null, 2)], { type: "application/json;charset=utf-8" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = filename || `sniffertrek-route-${namespace.replace(/[^a-z0-9_-]+/gi, "_")}.json`;
 a.rel = "noopener";
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
}

export function importRouteManifestFromJsonString(json: string, namespace: string): boolean {
 try {
 const data = JSON.parse(json) as RouteManifest;
 if (data.version !== 1 || !Array.isArray(data.segments)) return false;
 data.namespace = namespace;
 return saveRouteManifest({
 namespace,
 fingerprint: data.fingerprint,
 segments: data.segments,
 savedAt: Date.now(),
 });
 } catch {
 return false;
 }
}

export function importRouteManifestFromFile(file: File, namespace: string): Promise<boolean> {
 return new Promise((resolve) => {
 const reader = new FileReader();
 reader.onload = () => {
 const ok = importRouteManifestFromJsonString(String(reader.result || ""), namespace);
 resolve(ok);
 };
 reader.onerror = () => resolve(false);
 reader.readAsText(file);
 });
}
