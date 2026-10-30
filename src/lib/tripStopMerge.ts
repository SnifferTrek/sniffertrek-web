import type { RouteStop, Trip } from "./types";

/** Discovery- / Ortsinfo-Felder beim Cloud-Merge nicht verlieren. */
export function mergeRouteStopDiscovery(primary: RouteStop, secondary: RouteStop): RouteStop {
  const pick = <T>(a: T | undefined, b: T | undefined): T | undefined =>
    a !== undefined && a !== null && a !== "" && a !== false ? a : b;

  return {
    ...secondary,
    ...primary,
    discoveryIncludeInReport:
      primary.discoveryIncludeInReport === true || secondary.discoveryIncludeInReport === true,
    discoveryDescription: pick(primary.discoveryDescription, secondary.discoveryDescription),
    discoveryPhotoUrl: pick(primary.discoveryPhotoUrl, secondary.discoveryPhotoUrl),
    discoveryPhotoDataUrl: pick(primary.discoveryPhotoDataUrl, secondary.discoveryPhotoDataUrl),
    discoveryPhotoVariantIndex: pick(
      primary.discoveryPhotoVariantIndex,
      secondary.discoveryPhotoVariantIndex,
    ),
    discoveryWikipediaTitle: pick(primary.discoveryWikipediaTitle, secondary.discoveryWikipediaTitle),
    discoveryCategory: pick(primary.discoveryCategory, secondary.discoveryCategory),
    discoveryEtappeIndex: pick(primary.discoveryEtappeIndex, secondary.discoveryEtappeIndex),
    discoverySource: pick(primary.discoverySource, secondary.discoverySource),
    discoveryLanguage: pick(primary.discoveryLanguage, secondary.discoveryLanguage),
    discoveryBriefSource: pick(primary.discoveryBriefSource, secondary.discoveryBriefSource),
    discoveryBriefQualityHint: pick(primary.discoveryBriefQualityHint, secondary.discoveryBriefQualityHint),
    discoveryHighlights:
      primary.discoveryHighlights?.length ? primary.discoveryHighlights : secondary.discoveryHighlights,
    discoveryAddedAt: pick(primary.discoveryAddedAt, secondary.discoveryAddedAt),
    discoveryInRoute:
      primary.discoveryInRoute !== undefined ? primary.discoveryInRoute : secondary.discoveryInRoute,
  };
}

/**
 * Harte Garantie: Ein vorhandenes Stopp-Foto (data-URL) darf durch ein Update
 * nie verloren gehen. Nur wenn der neue Stand selbst ein Foto mitbringt
 * (bewusster Ersatz) oder die ID in `allowClearIds` steht („Ortsinfo entfernen"),
 * darf es wegfallen.
 */
export function preserveStopPhotos(prev: Trip, next: Trip, allowClearIds?: Set<string>): Trip {
  const prevById: Record<string, RouteStop> = {};
  for (const s of prev.stops || []) prevById[s.id] = s;
  for (const key of Object.keys(prev.routes || {}) as (keyof NonNullable<Trip["routes"]>)[]) {
    const route = prev.routes?.[key];
    if (route && "stops" in route && route.stops) {
      for (const s of route.stops) if (!prevById[s.id]) prevById[s.id] = s;
    }
  }

  // WICHTIG: Referenz-stabil bleiben. Wenn kein Foto zu retten ist, muss
  // `next` unveraendert (gleiche Referenz) zurueckkommen – sonst loest jede
  // Routen-Neuberechnung einen neuen State und damit eine Endlosschleife aus
  // (Karte blinkt, Zoom springt zurueck).
  const fixStops = (stops: RouteStop[]): RouteStop[] => {
    let changed = false;
    const fixed = stops.map((s) => {
      const p = prevById[s.id];
      if (!p) return s;
      const prevPhoto = p.discoveryPhotoDataUrl?.trim() || (p.discoveryPhotoUrl?.startsWith("data:") ? p.discoveryPhotoUrl : undefined);
      if (!prevPhoto) return s;
      if (s.discoveryPhotoDataUrl?.trim()) {
        allowClearIds?.delete(s.id);
        return s;
      }
      if (allowClearIds?.has(s.id)) return s;
      changed = true;
      return { ...s, discoveryPhotoDataUrl: prevPhoto };
    });
    return changed ? fixed : stops;
  };

  const fixedStops = fixStops(next.stops || []);
  let out: Trip = fixedStops === next.stops ? next : { ...next, stops: fixedStops };
  if (next.routes) {
    let routesChanged = false;
    const routes = { ...next.routes };
    for (const key of Object.keys(routes) as (keyof typeof routes)[]) {
      if (key === "routingOptions" || key === "bookedFlights") continue;
      const route = routes[key];
      if (route && "stops" in route && route.stops) {
        const fixedRouteStops = fixStops(route.stops);
        if (fixedRouteStops !== route.stops) {
          routes[key] = { ...route, stops: fixedRouteStops };
          routesChanged = true;
        }
      }
    }
    if (routesChanged) out = { ...out, routes };
  }
  return out;
}

export function mergeStopsById(primary: RouteStop[], secondary: RouteStop[]): RouteStop[] {
  const secById = new Map(secondary.map((s) => [s.id, s]));
  const merged = primary.map((p) => {
    const s = secById.get(p.id);
    return s ? mergeRouteStopDiscovery(p, s) : p;
  });
  const primaryIds = new Set(primary.map((s) => s.id));
  const onlySecondary = secondary.filter((s) => !primaryIds.has(s.id));
  if (!onlySecondary.length) return merged;

  // Nur in der anderen Version vorhandene Stopps NICHT ans Ende hängen:
  // Dort sitzt das Ziel – ein angehängter POI würde bei assignStopRoles
  // selbst zum Ziel und wäre als Zwischenstopp „verschwunden".
  const extraStarts = onlySecondary.filter((s) => s.type === "start");
  const extraEnds = onlySecondary.filter((s) => s.type === "end");
  const extraStops = onlySecondary.filter((s) => s.type !== "start" && s.type !== "end");

  const result = [...extraStarts, ...merged];
  const endIdx = result.findIndex((s) => s.type === "end");
  if (endIdx >= 0) result.splice(endIdx, 0, ...extraStops);
  else result.push(...extraStops);
  result.push(...extraEnds);
  return result;
}

function mergeStringRecord(
  a?: Record<string, string>,
  b?: Record<string, string>,
): Record<string, string> | undefined {
  if (!a && !b) return undefined;
  return { ...(b || {}), ...(a || {}) };
}

function mergeNestedCaptions(
  a?: Record<string, Record<string, string>>,
  b?: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> | undefined {
  if (!a && !b) return undefined;
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  const out: Record<string, Record<string, string>> = {};
  for (const k of keys) {
    out[k] = { ...(b?.[k] || {}), ...(a?.[k] || {}) };
  }
  return out;
}

/** Heuristik: unvollständige Cloud-Kopien sollen reichere lokale Stände nicht überschreiben. */
export function tripContentScore(t: Trip): number {
  const namedStops = (t.stops || []).filter((s) => s.name.trim()).length;
  const routeNamed =
    t.routes?.route?.stops?.filter((s) => s.name.trim()).length || 0;
  const briefs = (t.stops || []).filter((s) => !!s.discoveryDescription?.trim()).length;
  const hotels = (t.hotels || []).length;
  const pdfPhotos = Object.values(t.pdfPhotosByEtappe || {}).reduce(
    (n, arr) => n + (arr?.length || 0),
    0,
  );
  return namedStops * 10 + routeNamed * 5 + briefs * 3 + hotels * 2 + pdfPhotos;
}

/** Zwei Trip-Versionen zusammenführen (lokal ↔ Cloud), ohne Ortsinfo/PDF-Metadaten zu verlieren. */
export function mergeTripRecords(local: Trip, remote: Trip): Trip {
  const localTime = new Date(local.updatedAt || 0).getTime();
  const remoteTime = new Date(remote.updatedAt || 0).getTime();
  const localScore = tripContentScore(local);
  const remoteScore = tripContentScore(remote);
  // Zeitstempel allein reicht nicht: Cloud-Upserts setzen oft ein frisches updated_at
  // auf einen inhaltlich älteren Stand (fehlende routes / schlanker Payload).
  let remoteNewer = remoteTime > localTime;
  if (remoteNewer && localScore > remoteScore + 5) {
    remoteNewer = false;
  } else if (remoteTime === localTime && localScore >= remoteScore) {
    remoteNewer = false;
  }
  const base: Trip = remoteNewer ? { ...remote } : { ...local };
  const other: Trip = remoteNewer ? local : remote;

  base.stops = mergeStopsById(base.stops, other.stops);

  if (other.routes || base.routes) {
    const routes = { ...(base.routes || {}), ...(other.routes || {}) };
    const route = routes.route;
    const otherRoute = other.routes?.route;
    if (route?.stops || otherRoute?.stops) {
      routes.route = {
        ...route,
        ...otherRoute,
        stops: mergeStopsById(route?.stops || base.stops, otherRoute?.stops || other.stops),
        viaPoints: route?.viaPoints?.length ? route.viaPoints : otherRoute?.viaPoints,
      };
    }
    for (const key of ["car", "train", "flights"] as const) {
      const r = routes[key];
      const o = other.routes?.[key];
      if (r?.stops || o?.stops) {
        routes[key] = {
          ...r,
          ...o,
          stops: mergeStopsById(r?.stops || [], o?.stops || []),
        };
      }
    }
    base.routes = routes;
  }

  base.pdfPhotoCaptionsByEtappe = mergeNestedCaptions(
    base.pdfPhotoCaptionsByEtappe,
    other.pdfPhotoCaptionsByEtappe,
  );
  base.pdfPhotosByEtappe = {
    ...(other.pdfPhotosByEtappe || {}),
    ...(base.pdfPhotosByEtappe || {}),
  };
  base.pdfPhotoLibraryByEtappe = {
    ...(other.pdfPhotoLibraryByEtappe || {}),
    ...(base.pdfPhotoLibraryByEtappe || {}),
  };
  base.pdfPhotoPlacementByEtappe = {
    ...(other.pdfPhotoPlacementByEtappe || {}),
    ...(base.pdfPhotoPlacementByEtappe || {}),
  };
  base.pdfPhotoLayoutByEtappe = {
    ...(other.pdfPhotoLayoutByEtappe || {}),
    ...(base.pdfPhotoLayoutByEtappe || {}),
  };
  base.pdfPhotoPagesByEtappe = {
    ...(other.pdfPhotoPagesByEtappe || {}),
    ...(base.pdfPhotoPagesByEtappe || {}),
  };
  base.pdfEtappeCustomTextByEtappe = mergeStringRecord(
    base.pdfEtappeCustomTextByEtappe,
    other.pdfEtappeCustomTextByEtappe,
  );

  if (!base.pdfCoverPhotoDataUrl && other.pdfCoverPhotoDataUrl) {
    base.pdfCoverPhotoDataUrl = other.pdfCoverPhotoDataUrl;
  }

  base.updatedAt =
    new Date(base.updatedAt || 0).getTime() >= new Date(other.updatedAt || 0).getTime()
      ? base.updatedAt
      : other.updatedAt;

  return syncTripRouteStops(base);
}

/**
 * Reihenfolge heilen: Start zuerst, Ziel zuletzt, Zwischenstopps dazwischen.
 * Ältere Merges konnten Stopps hinter das Ziel hängen – dort „verschwinden" sie.
 */
export function normalizeRouteStopOrder(stops: RouteStop[]): RouteStop[] {
  if (stops.length < 2) return stops;
  const starts = stops.filter((s) => s.type === "start");
  const ends = stops.filter((s) => s.type === "end");
  const mids = stops.filter((s) => s.type !== "start" && s.type !== "end");
  if (!starts.length && !ends.length) return stops;
  const firstStart = starts[0];
  const firstEnd = ends[0];
  // Doppelte Start-/Ziel-Einträge als normale Zwischenstopps in der Mitte führen.
  const extra = [
    ...starts.slice(1).map((s) => ({ ...s, type: "stop" as const })),
    ...ends.slice(1).map((s) => ({ ...s, type: "stop" as const })),
  ];
  return [
    ...(firstStart ? [firstStart] : []),
    ...mids,
    ...extra,
    ...(firstEnd ? [firstEnd] : []),
  ];
}

/** `trip.stops` ist Source of Truth; Route-Kopie synchron halten. */
export function syncTripRouteStops(trip: Trip): Trip {
  const stops = normalizeRouteStopOrder(trip.stops);
  if (!trip.routes?.route) {
    return { ...trip, stops };
  }
  return {
    ...trip,
    stops,
    routes: {
      ...trip.routes,
      route: {
        ...trip.routes.route,
        stops,
        viaPoints: trip.routes.route.viaPoints || [],
      },
    },
  };
}
