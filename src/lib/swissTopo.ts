/** SwissTopo WMTS (EPSG:3857) für Leaflet – Quellenangabe Pflicht. */
export const SWISSTOPO_TILE_URL =
  "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg";

export const SWISSTOPO_ATTRIBUTION =
  '&copy; <a href="https://www.swisstopo.admin.ch/" target="_blank" rel="noopener">swisstopo</a>';

/** Schweiz – sinnvoller Startausschnitt (Zentrum). */
export const SWISS_DEFAULT_CENTER = { lat: 46.8, lng: 8.23 };
export const SWISS_DEFAULT_ZOOM = 8;

/**
 * WGS84 → LV95 (Näherung swisstopo, ca. 1 m).
 * Rückgabe: [easting / Y, northing / X]
 */
export function wgs84ToLv95(lat: number, lng: number): [number, number] {
  const latAux = (lat * 3600 - 169028.66) / 10000;
  const lngAux = (lng * 3600 - 26782.5) / 10000;
  const easting =
    2600070.9 +
    211455.93 * lngAux -
    10938.51 * lngAux * latAux -
    0.36 * lngAux * latAux ** 2 -
    44.27 * lngAux ** 3;
  const northing =
    1200084.72 +
    308807.42 * latAux +
    3745.25 * lngAux ** 2 +
    76.63 * latAux ** 2 -
    194.56 * lngAux ** 2 * latAux +
    119.79 * latAux ** 3;
  return [easting, northing];
}
