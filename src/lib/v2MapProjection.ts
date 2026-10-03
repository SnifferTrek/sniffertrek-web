export type GeoRoutePoint = {
  name: string;
  lat: number;
  lng: number;
  kind: "origin" | "stop";
};

export type ProjectedPoint = GeoRoutePoint & { x: number; y: number };

export type ProjectionOptions = {
  padding?: number;
  viewbox?: { width: number; height: number };
  boundsExpand?: { lat?: number; lng?: number };
};

const VIEWBOX = { width: 320, height: 360 };

function resolveBounds(
  points: GeoRoutePoint[],
  options: ProjectionOptions = {},
) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);

  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;
  const latPad = latSpan * (options.boundsExpand?.lat ?? 0.14);
  const lngPad = lngSpan * (options.boundsExpand?.lng ?? 0.14);
  minLat -= latPad;
  maxLat += latPad;
  minLng -= lngPad;
  maxLng += lngPad;

  return { minLat, maxLat, minLng, maxLng };
}

/** Equirectangular projection – erhält geografische Relationen. */
export function projectGeoPoints(
  points: GeoRoutePoint[],
  options: ProjectionOptions | number = {},
): ProjectedPoint[] {
  const opts: ProjectionOptions =
    typeof options === "number" ? { padding: options } : options;
  const padding = opts.padding ?? 32;
  const viewbox = opts.viewbox ?? VIEWBOX;
  const { minLat, maxLat, minLng, maxLng } = resolveBounds(points, opts);
  const innerW = viewbox.width - padding * 2;
  const innerH = viewbox.height - padding * 2;

  return points.map((p) => ({
    ...p,
    x: padding + ((p.lng - minLng) / (maxLng - minLng)) * innerW,
    y: padding + ((maxLat - p.lat) / (maxLat - minLat)) * innerH,
  }));
}

/** Projiziert beliebige Lat/Lng mit denselben Bounds wie die Route. */
export function projectLatLng(
  lat: number,
  lng: number,
  routePoints: GeoRoutePoint[],
  options: ProjectionOptions = {},
): { x: number; y: number } {
  const padding = options.padding ?? 32;
  const viewbox = options.viewbox ?? VIEWBOX;
  const { minLat, maxLat, minLng, maxLng } = resolveBounds(routePoints, options);
  const innerW = viewbox.width - padding * 2;
  const innerH = viewbox.height - padding * 2;
  return {
    x: padding + ((lng - minLng) / (maxLng - minLng)) * innerW,
    y: padding + ((maxLat - lat) / (maxLat - minLat)) * innerH,
  };
}

export function latLngPolyline(
  coords: { lat: number; lng: number }[],
  routePoints: GeoRoutePoint[],
  options: ProjectionOptions = {},
): string {
  if (coords.length === 0) return "";
  const pts = coords.map((c) => projectLatLng(c.lat, c.lng, routePoints, options));
  return `M ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")} Z`;
}

/** Geschwungenere Verbindungslinie – Reiseverlauf, keine Navigationsroute. */
export function buildTravelPath(points: ProjectedPoint[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const midX = (prev.x + curr.x) / 2;
    const midY = (prev.y + curr.y) / 2;
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const ctrlX = midX - dy * 0.12;
    const ctrlY = midY + dx * 0.12;
    d += ` Q ${ctrlX} ${ctrlY} ${curr.x} ${curr.y}`;
  }
  return d;
}

export const V2_MAP_VIEWBOX = VIEWBOX;
