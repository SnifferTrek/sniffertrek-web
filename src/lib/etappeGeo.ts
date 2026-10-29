/** Geometrie-Helfer: POI einer Etappe zuordnen (Streckenabschnitt, nicht nur Ankerpunkte). */

export function haversineKm(
 aLat: number,
 aLng: number,
 bLat: number,
 bLng: number
): number {
 const R = 6371;
 const dLat = ((bLat - aLat) * Math.PI) / 180;
 const dLng = ((bLng - aLng) * Math.PI) / 180;
 const x =
 Math.sin(dLat / 2) * Math.sin(dLat / 2) +
 Math.cos((aLat * Math.PI) / 180) *
 Math.cos((bLat * Math.PI) / 180) *
 Math.sin(dLng / 2) *
 Math.sin(dLng / 2);
 return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** Abstand Punkt → Streckenabschnitt (km), inkl. wie mittig die Projektion liegt (0 Rand, 1 Mitte). */
export function distPointToSegmentKm(
 lat: number,
 lng: number,
 aLat: number,
 aLng: number,
 bLat: number,
 bLng: number
): { distanceKm: number; midness: number } {
 const ax = aLng;
 const ay = aLat;
 const bx = bLng;
 const by = bLat;
 const px = lng;
 const py = lat;
 const dx = bx - ax;
 const dy = by - ay;
 const len2 = dx * dx + dy * dy;
 let t = 0;
 if (len2 > 1e-12) {
 t = ((px - ax) * dx + (py - ay) * dy) / len2;
 t = Math.max(0, Math.min(1, t));
 }
 const cx = ax + t * dx;
 const cy = ay + t * dy;
 const distanceKm = haversineKm(lat, lng, cy, cx);
 const midness = 1 - Math.abs(2 * t - 1);
 return { distanceKm, midness };
}

export type EtappeGeoPoints = Array<{ lat: number; lng: number }>;

/**
 * Nächste Etappe nach Abstand zur Strecke (Segmente), nicht nur zu Endpunkten.
 * Bei ähnlichem Abstand gewinnt die Etappe mit mittigerer Projektion (weniger Hotel-Grenz-Ambiguität).
 */
export function nearestEtappeIndexByRoute(
 lat: number,
 lng: number,
 etappePoints: EtappeGeoPoints[]
): { index: number; distanceKm: number } | null {
 let bestIndex = -1;
 let bestDist = Infinity;
 let bestMidness = -1;

 for (let i = 0; i < etappePoints.length; i++) {
 const pts = etappePoints[i];
 if (!pts.length) continue;

 let localDist = Infinity;
 let localMid = 0;

 if (pts.length === 1) {
 localDist = haversineKm(lat, lng, pts[0].lat, pts[0].lng);
 localMid = 0;
 } else {
 for (let j = 0; j < pts.length - 1; j++) {
 const a = pts[j];
 const b = pts[j + 1];
 const { distanceKm, midness } = distPointToSegmentKm(
 lat,
 lng,
 a.lat,
 a.lng,
 b.lat,
 b.lng
 );
 if (
 distanceKm < localDist - 0.05 ||
 (Math.abs(distanceKm - localDist) <= 0.05 && midness > localMid)
 ) {
 localDist = distanceKm;
 localMid = midness;
 }
 }
 }

 if (
 localDist < bestDist - 0.8 ||
 (Math.abs(localDist - bestDist) <= 0.8 && localMid > bestMidness)
 ) {
 bestDist = localDist;
 bestMidness = localMid;
 bestIndex = i;
 }
 }

 if (bestIndex < 0) return null;
 return { index: bestIndex, distanceKm: bestDist };
}
