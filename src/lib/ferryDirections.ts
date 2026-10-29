import { haversineKm } from "@/lib/etappeGeo";
import {
  encodePolyline,
  ferryCrossingMetrics,
  interpolateGreatCircle,
  pickCarFerryAsync,
  type PickedCarFerry,
} from "@/lib/ferryCatalog";
import {
  extraFerryViaPoints,
  ferryRegionOf,
  ferryTerminalRetryEndpoints,
  isDedicatedSeaHop,
  pathFromGoogleRoute,
  pickSaneDirectionsRoute,
  toGeoPt,
  type FerryRegion,
  type GeoPt,
} from "@/lib/ferryRouting";

type AvoidOpts = { highways?: boolean; tolls?: boolean; ferries?: boolean };
type RouteLoc = string | google.maps.LatLng | google.maps.LatLngLiteral;

function geoFromLocation(loc: RouteLoc): GeoPt | null {
  if (typeof loc === "string") return null;
  return toGeoPt(loc);
}

function regionOfLoc(loc: RouteLoc): FerryRegion {
  if (typeof loc === "string") return ferryRegionOf(null, loc);
  return ferryRegionOf(geoFromLocation(loc));
}

function endpointsFromResult(result: google.maps.DirectionsResult): { origin: GeoPt | null; destination: GeoPt | null } {
  const legs = result.routes?.[0]?.legs || [];
  if (!legs.length) return { origin: null, destination: null };
  return {
    origin: toGeoPt(legs[0].start_location),
    destination: toGeoPt(legs[legs.length - 1].end_location),
  };
}

function preferSaneRoute(
  result: google.maps.DirectionsResult,
  origin: GeoPt | null,
  destination: GeoPt | null
): google.maps.DirectionsResult {
  const routes = result.routes || [];
  const picked = pickSaneDirectionsRoute(routes, (route) => pathFromGoogleRoute(route), origin, destination);
  if (!picked || picked === routes[0]) return result;
  return { ...result, routes: [picked, ...routes.filter((r) => r !== picked)] };
}

function isSaneResult(result: google.maps.DirectionsResult, origin: GeoPt | null, destination: GeoPt | null): boolean {
  const route = result.routes?.[0];
  if (!route) return false;
  const sane = pickSaneDirectionsRoute([route], (row) => pathFromGoogleRoute(row), origin, destination);
  return !!sane;
}

function waypointLoc(wp: google.maps.DirectionsWaypoint): RouteLoc | null {
  const loc = wp.location;
  if (!loc) return null;
  if (typeof loc === "string") return loc;
  return loc as google.maps.LatLng | google.maps.LatLngLiteral;
}

/** Festland↔Korsika nicht als eine Wegpunktkette — Google legt die dann über Elba. */
export function splitDirectionsChain(
  origin: RouteLoc,
  destination: RouteLoc,
  waypoints: google.maps.DirectionsWaypoint[]
): Array<{ origin: RouteLoc; destination: RouteLoc; waypoints: google.maps.DirectionsWaypoint[] }> {
  const nodes: Array<{ loc: RouteLoc; wp?: google.maps.DirectionsWaypoint }> = [
    { loc: origin },
    ...waypoints.map((wp) => {
      const loc = waypointLoc(wp);
      return loc ? { loc, wp } : null;
    }).filter((row): row is { loc: RouteLoc; wp: google.maps.DirectionsWaypoint } => !!row),
    { loc: destination },
  ];
  if (nodes.length < 2) return [{ origin, destination, waypoints }];

  const slicePart = (from: number, to: number) => ({
    origin: nodes[from].loc,
    destination: nodes[to].loc,
    waypoints: nodes.slice(from + 1, to).map((n) => n.wp).filter((wp): wp is google.maps.DirectionsWaypoint => !!wp),
  });

  const parts: Array<{ origin: RouteLoc; destination: RouteLoc; waypoints: google.maps.DirectionsWaypoint[] }> = [];
  let startIdx = 0;
  for (let i = 0; i < nodes.length - 1; i++) {
    if (!isDedicatedSeaHop(regionOfLoc(nodes[i].loc), regionOfLoc(nodes[i + 1].loc))) continue;
    if (i > startIdx) parts.push(slicePart(startIdx, i));
    parts.push(slicePart(i, i + 1));
    startIdx = i + 1;
  }
  if (startIdx < nodes.length - 1) parts.push(slicePart(startIdx, nodes.length - 1));
  return parts.length ? parts : [{ origin, destination, waypoints }];
}

function geoPtsFromPath(path: google.maps.LatLng[]): GeoPt[] {
  return path.map((p) => ({ lat: p.lat(), lng: p.lng() }));
}

function mergeDirectionsResults(results: google.maps.DirectionsResult[]): google.maps.DirectionsResult {
  if (results.length === 1) return results[0];
  const routes = results.map((r) => r.routes?.[0]).filter(Boolean) as google.maps.DirectionsRoute[];
  if (!routes.length) return results[0];
  const legs = routes.flatMap((r) => r.legs || []);
  const overview_path = routes.flatMap((r) => r.overview_path || []);
  let bounds = routes[0].bounds;
  if (typeof google !== "undefined" && google.maps?.LatLngBounds) {
    bounds = new google.maps.LatLngBounds();
    for (const p of overview_path) bounds.extend(p);
    for (const r of routes) {
      if (r.bounds) bounds.union(r.bounds);
    }
  }
  const polyPts = geoPtsFromPath(overview_path);
  return {
    ...results[0],
    routes: [
      {
        ...routes[0],
        legs,
        overview_path,
        bounds,
        overview_polyline: encodePolyline(polyPts) as google.maps.DirectionsRoute["overview_polyline"],
        waypoint_order: [],
      },
    ],
  };
}

function mergeIntoSingleLeg(results: google.maps.DirectionsResult[]): google.maps.DirectionsResult {
  const merged = mergeDirectionsResults(results);
  const route = merged.routes[0];
  const legs = route?.legs || [];
  if (!route || legs.length <= 1) return merged;
  const overview_path = route.overview_path || [];
  const dist = legs.reduce((s, l) => s + (l.distance?.value || 0), 0);
  const dur = legs.reduce((s, l) => s + (l.duration?.value || 0), 0);
  const first = legs[0];
  const last = legs[legs.length - 1];
  const oneLeg: google.maps.DirectionsLeg = {
    ...first,
    end_location: last.end_location,
    end_address: last.end_address || first.end_address,
    distance: { value: dist, text: `${Math.round(dist / 1000)} km` },
    duration: { value: dur, text: `${Math.round(dur / 60)} min` },
    steps: legs.flatMap((l) => l.steps || []),
  };
  return {
    ...merged,
    routes: [
      {
        ...route,
        legs: [oneLeg],
        overview_path,
        overview_polyline: encodePolyline(geoPtsFromPath(overview_path)) as google.maps.DirectionsRoute["overview_polyline"],
      },
    ],
  };
}

function syntheticSeaDirections(ferry: PickedCarFerry): google.maps.DirectionsResult {
  const pts = interpolateGreatCircle(ferry.from, ferry.to);
  const path = pts.map((p) => new google.maps.LatLng(p.lat, p.lng));
  const { meters, seconds } = ferryCrossingMetrics(ferry.from, ferry.to, ferry.durationHours);
  const bounds = new google.maps.LatLngBounds();
  path.forEach((p) => bounds.extend(p));
  const start = path[0];
  const end = path[path.length - 1];
  const dist = { value: meters, text: `${Math.round(meters / 1000)} km` };
  const dur = { value: seconds, text: `${Math.round(seconds / 60)} min` };
  const step = {
    path,
    lat_lngs: path,
    start_location: start,
    end_location: end,
    distance: dist,
    duration: dur,
    travel_mode: google.maps.TravelMode.DRIVING,
    encoded_lat_lngs: encodePolyline(pts),
    instructions: `Fähre ${ferry.from.name} – ${ferry.to.name}`,
    maneuver: "",
    polyline: { points: encodePolyline(pts) },
  } as google.maps.DirectionsStep;
  const leg = {
    start_location: start,
    end_location: end,
    start_address: ferry.from.name,
    end_address: ferry.to.name,
    distance: dist,
    duration: dur,
    steps: [step],
    traffic_speed_entry: [],
    via_waypoints: [],
  } as google.maps.DirectionsLeg;
  return {
    geocoded_waypoints: [],
    routes: [
      {
        bounds,
        copyrights: "",
        legs: [leg],
        overview_path: path,
        overview_polyline: encodePolyline(pts) as google.maps.DirectionsRoute["overview_polyline"],
        warnings: [],
        waypoint_order: [],
        summary: `${ferry.from.name} – ${ferry.to.name}`,
      } as google.maps.DirectionsRoute,
    ],
    request: {} as google.maps.DirectionsRequest,
  };
}

function locName(loc: RouteLoc): string | undefined {
  return typeof loc === "string" ? loc : undefined;
}

async function requestLandLeg(
  service: google.maps.DirectionsService,
  origin: RouteLoc,
  destination: RouteLoc,
  mode: google.maps.TravelMode
): Promise<google.maps.DirectionsResult | null> {
  try {
    return await requestRoute(service, origin, destination, [], mode, false, { ferries: true }, false);
  } catch {
    return null;
  }
}

async function stitchCatalogFerry(
  service: google.maps.DirectionsService,
  origin: RouteLoc,
  destination: RouteLoc,
  originPt: GeoPt,
  destPt: GeoPt,
  ferry: PickedCarFerry,
  mode: google.maps.TravelMode
): Promise<google.maps.DirectionsResult> {
  const fromPort = new google.maps.LatLng(ferry.from.lat, ferry.from.lng);
  const toPort = new google.maps.LatLng(ferry.to.lat, ferry.to.lng);
  const parts: google.maps.DirectionsResult[] = [];
  const originNear = haversineKm(originPt.lat, originPt.lng, ferry.from.lat, ferry.from.lng) < 2.5;
  const destNear = haversineKm(destPt.lat, destPt.lng, ferry.to.lat, ferry.to.lng) < 2.5;
  if (!originNear) {
    const land = await requestLandLeg(service, origin, fromPort, mode);
    if (land) parts.push(land);
  }
  parts.push(syntheticSeaDirections(ferry));
  if (!destNear) {
    const land = await requestLandLeg(service, toPort, destination, mode);
    if (land) parts.push(land);
  }
  return mergeIntoSingleLeg(parts);
}

async function requestRoute(
  service: google.maps.DirectionsService,
  origin: RouteLoc,
  destination: RouteLoc,
  waypoints: google.maps.DirectionsWaypoint[],
  mode: google.maps.TravelMode,
  optimizeWaypoints: boolean,
  avoid: AvoidOpts | undefined,
  alternatives: boolean
): Promise<google.maps.DirectionsResult> {
  return new Promise((resolve, reject) => {
    service.route(
      {
        origin,
        destination,
        waypoints,
        optimizeWaypoints,
        provideRouteAlternatives: alternatives,
        travelMode: mode,
        avoidHighways: !!avoid?.highways,
        avoidTolls: !!avoid?.tolls,
        avoidFerries: !!avoid?.ferries,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) resolve(result);
        else reject(status);
      }
    );
  });
}

async function routeOneDrivingWithFerryRetries(
  service: google.maps.DirectionsService,
  origin: RouteLoc,
  destination: RouteLoc,
  waypoints: google.maps.DirectionsWaypoint[],
  mode: google.maps.TravelMode,
  optimizeWaypoints: boolean,
  avoid?: AvoidOpts
): Promise<google.maps.DirectionsResult> {
  if (mode !== google.maps.TravelMode.DRIVING) {
    return requestRoute(service, origin, destination, waypoints, mode, optimizeWaypoints, avoid, false);
  }

  let originPt = geoFromLocation(origin);
  let destPt = geoFromLocation(destination);
  let probe: google.maps.DirectionsResult | null = null;
  if (!originPt || !destPt) {
    probe = await requestRoute(service, origin, destination, waypoints, mode, optimizeWaypoints, avoid, false);
    const ends = endpointsFromResult(probe);
    originPt = originPt || ends.origin;
    destPt = destPt || ends.destination;
  }

  const seaHop =
    !!originPt &&
    !!destPt &&
    isDedicatedSeaHop(
      ferryRegionOf(originPt, locName(origin)),
      ferryRegionOf(destPt, locName(destination))
    );

  // OSM/Fährkatalog nur bei echtem Wasser-Hop (z. B. Festland↔Korsika), nie bei Landstrecken.
  if (seaHop && originPt && destPt && waypoints.length === 0) {
    const ferry = await pickCarFerryAsync(originPt, destPt, locName(origin), locName(destination));
    if (ferry) {
      return stitchCatalogFerry(service, origin, destination, originPt, destPt, ferry, mode);
    }
  }

  const first =
    probe ||
    (await requestRoute(service, origin, destination, waypoints, mode, optimizeWaypoints, avoid, false));
  originPt = originPt || endpointsFromResult(first).origin;
  destPt = destPt || endpointsFromResult(first).destination;
  const preferred = preferSaneRoute(first, originPt, destPt);
  if (isSaneResult(preferred, originPt, destPt)) return preferred;

  const stillSeaHop =
    !!originPt &&
    !!destPt &&
    isDedicatedSeaHop(
      ferryRegionOf(originPt, locName(origin)),
      ferryRegionOf(destPt, locName(destination))
    );
  if (stillSeaHop && originPt && destPt && waypoints.length === 0) {
    const ferry = await pickCarFerryAsync(originPt, destPt, locName(origin), locName(destination));
    if (ferry) {
      return stitchCatalogFerry(service, origin, destination, originPt, destPt, ferry, mode);
    }
  }

  try {
    const alts = await requestRoute(service, origin, destination, waypoints, mode, optimizeWaypoints, avoid, true);
    originPt = geoFromLocation(origin) || endpointsFromResult(alts).origin;
    destPt = geoFromLocation(destination) || endpointsFromResult(alts).destination;
    const pickedAlts = preferSaneRoute(alts, originPt, destPt);
    if (isSaneResult(pickedAlts, originPt, destPt)) return pickedAlts;
  } catch {
    // weiter mit Via-Häfen
  }

  if (!originPt || !destPt) return preferred;
  if (!stillSeaHop) return preferred;
  const extraVias = extraFerryViaPoints(originPt, destPt);
  for (const via of extraVias) {
    const viaWp: google.maps.DirectionsWaypoint = {
      location: new google.maps.LatLng(via.lat, via.lng),
      stopover: false,
    };
    try {
      const retry = await requestRoute(
        service,
        origin,
        destination,
        [...waypoints, viaWp],
        mode,
        false,
        avoid,
        true
      );
      const o = geoFromLocation(origin) || endpointsFromResult(retry).origin;
      const d = geoFromLocation(destination) || endpointsFromResult(retry).destination;
      const picked = preferSaneRoute(retry, o, d);
      if (isSaneResult(picked, o, d)) return picked;
    } catch {
      // nächsten Hafen versuchen
    }
  }

  const terminals = ferryTerminalRetryEndpoints(originPt, destPt);
  if (terminals) {
    try {
      const retry = await requestRoute(
        service,
        new google.maps.LatLng(terminals.origin.lat, terminals.origin.lng),
        new google.maps.LatLng(terminals.destination.lat, terminals.destination.lng),
        [],
        mode,
        false,
        avoid,
        true
      );
      const o = endpointsFromResult(retry).origin;
      const d = endpointsFromResult(retry).destination;
      const picked = preferSaneRoute(retry, o, d);
      if (isSaneResult(picked, o, d)) return picked;
    } catch {
      // Fallback auf die Originalroute
    }
  }
  return preferred;
}

/**
 * Driving-Directions, aber ohne erfundene Elba-Umwege Italien↔Korsika.
 * Landstrecken unverändert, solange Google keinen Insel-Transfer erfindet.
 */
export async function routeDrivingWithFerrySanity(
  service: google.maps.DirectionsService,
  origin: RouteLoc,
  destination: RouteLoc,
  waypoints: google.maps.DirectionsWaypoint[],
  mode: google.maps.TravelMode,
  optimizeWaypoints: boolean,
  avoid?: AvoidOpts
): Promise<google.maps.DirectionsResult> {
  if (mode !== google.maps.TravelMode.DRIVING) {
    return requestRoute(service, origin, destination, waypoints, mode, optimizeWaypoints, avoid, false);
  }

  const parts = splitDirectionsChain(origin, destination, waypoints);
  const results: google.maps.DirectionsResult[] = [];
  for (const part of parts) {
    results.push(
      await routeOneDrivingWithFerryRetries(
        service,
        part.origin,
        part.destination,
        part.waypoints,
        mode,
        optimizeWaypoints && part.waypoints.length >= 2,
        avoid
      )
    );
  }
  return mergeDirectionsResults(results);
}
