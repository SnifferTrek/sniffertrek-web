"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Map as LeafletMap, Marker, Polyline, CircleMarker } from "leaflet";
import type LType from "leaflet";
import {
  Bike,
  Download,
  Loader2,
  LocateFixed,
  Maximize2,
  Minimize2,
  Mountain,
  Navigation,
  Route,
  Share2,
  Undo2,
  Trash2,
  Unlock,
} from "lucide-react";
import {
  SWISS_DEFAULT_CENTER,
  SWISS_DEFAULT_ZOOM,
  SWISSTOPO_ATTRIBUTION,
  SWISSTOPO_TILE_URL,
} from "@/lib/swissTopo";
import {
  buildGpx,
  buildVeloExportJson,
  computeElevationStats,
  appleMapsBikeUrl,
  downloadTextFile,
  estimateDurationMin,
  googleMapsBikeUrl,
  newWaypointId,
  shareOrDownloadGpx,
  type VeloRouteResult,
  type VeloWaypoint,
} from "@/lib/veloRoute";

type VeloSchweizPlannerProps = {
  userEmail: string;
};

const MARKER_COLOR = "#dc2626";

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

const mapChip =
  "pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur-sm transition-colors disabled:opacity-40";
const mapChipLight =
  "bg-white/95 text-zinc-800 ring-1 ring-black/10 hover:bg-white";
const mapChipDanger =
  "bg-white/95 text-red-700 ring-1 ring-red-200 hover:bg-red-50";

function FahrverboteButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("velo");
  return (
    <button
      type="button"
      aria-pressed={active}
      title={t("bypassTitle")}
      onClick={onClick}
      className={`${mapChip} ${
        active
          ? "bg-emerald-700 text-white ring-2 ring-white/80"
          : mapChipLight
      }`}
    >
      <Unlock className="h-3.5 w-3.5" />
      <span className={active ? undefined : "line-through decoration-zinc-500"}>
        {t("bypassLabel")}
      </span>
    </button>
  );
}

function markerIconHtml(selected: boolean): string {
  const size = selected ? 18 : 14;
  const border = selected ? 3 : 2;
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${MARKER_COLOR};border:${border}px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.4);cursor:grab"></div>`;
}

function normalizeRoles(wps: VeloWaypoint[]): VeloWaypoint[] {
  if (wps.length === 0) return wps;
  return wps.map((wp, i) => ({
    ...wp,
    role: i === 0 ? "start" : i === wps.length - 1 ? "end" : "via",
  }));
}

export default function VeloSchweizPlanner({ userEmail }: VeloSchweizPlannerProps) {
  const t = useTranslations("velo");
  const locale = useLocale();
  const dragHint = t("dragHint");
  const deletePoint = t("deletePoint");
  const startLabel = t("start");
  const destLabel = t("dest");
  const clickToEdit = t("clickToEdit");
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof LType | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const polylineRef = useRef<Polyline | null>(null);
  const locationMarkerRef = useRef<CircleMarker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const waypointsRef = useRef<VeloWaypoint[]>([]);
  const selectedIdRef = useRef<string | null>(null);
  const handleMapClickRef = useRef<(lat: number, lng: number) => void>(() => {});
  const removeWaypointRef = useRef<(id: string) => void>(() => {});
  const moveWaypointRef = useRef<(id: string, lat: number, lng: number) => void>(() => {});

  const [waypoints, setWaypoints] = useState<VeloWaypoint[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [route, setRoute] = useState<VeloRouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [allowRestricted, setAllowRestricted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showLocate, setShowLocate] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  waypointsRef.current = waypoints;
  selectedIdRef.current = selectedId;

  const updateWaypoints = useCallback((next: VeloWaypoint[]) => {
    setWaypoints(normalizeRoles(next));
  }, []);

  const removeWaypoint = useCallback(
    (id: string) => {
      updateWaypoints(waypointsRef.current.filter((w) => w.id !== id));
      setSelectedId(null);
    },
    [updateWaypoints]
  );

  const moveWaypoint = useCallback(
    (id: string, lat: number, lng: number) => {
      const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      updateWaypoints(
        waypointsRef.current.map((w) =>
          w.id === id ? { ...w, lat, lng, label } : w
        )
      );
    },
    [updateWaypoints]
  );

  removeWaypointRef.current = removeWaypoint;
  moveWaypointRef.current = moveWaypoint;

  const addPoint = useCallback(
    (lat: number, lng: number) => {
      const label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      const wp: VeloWaypoint = {
        id: newWaypointId(),
        lat,
        lng,
        label,
        role: "via",
      };
      updateWaypoints([...waypointsRef.current, wp]);
    },
    [updateWaypoints]
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      addPoint(lat, lng);
    },
    [addPoint]
  );

  handleMapClickRef.current = handleMapClick;

  const clearRoute = useCallback(() => {
    setWaypoints([]);
    setRouteCoords([]);
    setRoute(null);
    setError(null);
    setSelectedId(null);
  }, []);

  const removeLastWaypoint = useCallback(() => {
    const current = waypointsRef.current;
    if (current.length === 0) return;
    updateWaypoints(current.slice(0, -1));
    setSelectedId(null);
  }, [updateWaypoints]);

  const goToLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(t("locUnavailable"));
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const map = mapRef.current;
        const L = leafletRef.current;
        if (!map || !L) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const zoom = Math.max(map.getZoom(), 15);
        map.setView([lat, lng], zoom, { animate: true });
        if (locationMarkerRef.current) {
          locationMarkerRef.current.setLatLng([lat, lng]);
        } else {
          locationMarkerRef.current = L.circleMarker([lat, lng], {
            radius: 8,
            color: "#fff",
            weight: 3,
            fillColor: "#007aff",
            fillOpacity: 1,
          }).addTo(map);
        }
      },
      () => {
        setLocating(false);
        setLocationError(t("locDenied"));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 8000 }
    );
  }, [t]);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapContainerRef.current) return;

      const map = L.map(container, {
        scrollWheelZoom: true,
        attributionControl: true,
      }).setView(
        [SWISS_DEFAULT_CENTER.lat, SWISS_DEFAULT_CENTER.lng],
        SWISS_DEFAULT_ZOOM
      );

      L.tileLayer(SWISSTOPO_TILE_URL, {
        attribution: SWISSTOPO_ATTRIBUTION,
        maxZoom: 18,
      }).addTo(map);

      map.on("click", (e) => {
        handleMapClickRef.current(e.latlng.lat, e.latlng.lng);
      });

      map.createPane("veloRoute");
      const routePane = map.getPane("veloRoute");
      if (routePane) {
        routePane.style.zIndex = "450";
        routePane.style.pointerEvents = "none";
      }

      if (cancelled) {
        map.remove();
        return;
      }

      leafletRef.current = L;
      mapRef.current = map;
      setMapReady(true);
      window.setTimeout(() => map.invalidateSize(), 100);
    })();

    return () => {
      cancelled = true;
      markersRef.current.clear();
      polylineRef.current = null;
      locationMarkerRef.current = null;
      leafletRef.current = null;
      setMapReady(false);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setShowLocate(isIosDevice());
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);

  useEffect(() => {
    const map = mapRef.current;
    const el = mapContainerRef.current;
    if (!map || !el) return;

    const syncSize = () => {
      map.invalidateSize({ animate: false });
    };

    const ro = new ResizeObserver(() => syncSize());
    ro.observe(el);
    if (el.parentElement) ro.observe(el.parentElement);
    const raf = window.requestAnimationFrame(syncSize);
    const t = window.setTimeout(syncSize, 120);
    return () => {
      ro.disconnect();
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [fullscreen, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L) return;

    const existing = markersRef.current;
    const ids = new Set(waypoints.map((w) => w.id));

      existing.forEach((marker, id) => {
        if (!ids.has(id)) {
          marker.remove();
          existing.delete(id);
        }
      });

      for (const wp of waypoints) {
        const isSelected = selectedId === wp.id;
        let marker = existing.get(wp.id);

        const applyMarkerStyle = (m: Marker) => {
          m.setIcon(
            L.divIcon({
              className: "",
              html: markerIconHtml(isSelected),
              iconSize: [isSelected ? 18 : 14, isSelected ? 18 : 14],
              iconAnchor: [isSelected ? 9 : 7, isSelected ? 9 : 7],
            })
          );
        };

        if (!marker) {
          const m = L.marker([wp.lat, wp.lng], {
            draggable: true,
            autoPan: true,
          }).addTo(map);
          marker = m;

          m.on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            const current = selectedIdRef.current;
            setSelectedId(current === wp.id ? null : wp.id);
            m.openPopup();
          });

          m.on("dragstart", (e) => {
            L.DomEvent.stopPropagation(e);
          });

          m.on("dragend", (e) => {
            L.DomEvent.stopPropagation(e);
            const pos = m.getLatLng();
            moveWaypointRef.current(wp.id, pos.lat, pos.lng);
          });

          const popupHtml = `
            <div style="font-family:system-ui,sans-serif;font-size:13px;line-height:1.4">
              <p style="margin:0 0 8px;color:#52525b">${dragHint}</p>
              <button type="button" data-velo-delete="${wp.id}"
                style="width:100%;padding:6px 10px;border-radius:8px;border:1px solid #fecaca;background:#fef2f2;color:#b91c1c;font-weight:600;cursor:pointer">
                ${deletePoint}
              </button>
            </div>`;

          m.bindPopup(popupHtml, { closeButton: true, className: "velo-marker-popup" });

          m.on("popupopen", () => {
            setSelectedId(wp.id);
            const btn = document.querySelector(
              `[data-velo-delete="${wp.id}"]`
            ) as HTMLButtonElement | null;
            if (btn && !btn.dataset.bound) {
              btn.dataset.bound = "1";
              btn.addEventListener("click", (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                removeWaypointRef.current(wp.id);
              });
            }
          });

          m.on("popupclose", () => {
            if (selectedIdRef.current === wp.id) {
              setSelectedId(null);
            }
          });

          existing.set(wp.id, m);
        } else {
          marker.setLatLng([wp.lat, wp.lng]);
        }

        applyMarkerStyle(marker);

        const idx = waypoints.findIndex((w) => w.id === wp.id);
        const label =
          idx === 0
            ? startLabel
            : idx === waypoints.length - 1
              ? destLabel
              : t("pointN", { n: idx + 1 });
        marker.bindTooltip(`${label} · ${clickToEdit}`, {
          direction: "top",
          offset: [0, -10],
        });

        if (isSelected && !marker.isPopupOpen()) {
          marker.openPopup();
        } else if (!isSelected && marker.isPopupOpen()) {
          marker.closePopup();
        }
      }

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    if (routeCoords.length >= 2) {
      const latLngs = routeCoords.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );
      polylineRef.current = L.polyline(latLngs, {
        pane: "veloRoute",
        color: MARKER_COLOR,
        weight: 5,
        opacity: 0.95,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map);
    }
  }, [waypoints, routeCoords, selectedId, mapReady, locale, dragHint, deletePoint, startLabel, destLabel, clickToEdit, t]);

  useEffect(() => {
    if (waypoints.length < 2) {
      setRouteCoords([]);
      setRoute(null);
      return;
    }

    const ctrl = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setRouteCoords([]);
        setRoute(null);
        setError(null);
        try {
          const routeRes = await fetch("/api/velo-route", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: userEmail,
              points: waypoints.map((w) => ({ lat: w.lat, lng: w.lng })),
              allowRestricted,
            }),
            signal: ctrl.signal,
          });
          if (!routeRes.ok) {
            const err = (await routeRes.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(err.error || t("routeFail"));
          }
          const routeData = (await routeRes.json()) as {
            coordinates: [number, number][];
            distanceM: number;
            durationS: number;
            steps: VeloRouteResult["steps"];
          };

          let elevations: number[] = [];
          try {
            const elevRes = await fetch("/api/velo-elevation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: userEmail,
                coordinates: routeData.coordinates,
              }),
              signal: ctrl.signal,
            });
            if (elevRes.ok) {
              const elevData = (await elevRes.json()) as { elevations?: number[] };
              elevations = elevData.elevations || [];
            }
          } catch {
            /* optional */
          }

          const { ascentM, descentM } = computeElevationStats(elevations);
          const distanceKm = Math.round((routeData.distanceM / 1000) * 10) / 10;
          const durationMin =
            routeData.durationS > 0
              ? Math.round(routeData.durationS / 60)
              : estimateDurationMin(distanceKm, ascentM);

          setRouteCoords(routeData.coordinates);
          setRoute({
            coordinates: routeData.coordinates,
            stats: { distanceKm, ascentM, descentM, durationMin },
            steps: routeData.steps,
            elevations,
          });
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
          setError((e as Error).message || t("routingFail"));
          setRouteCoords([]);
          setRoute(null);
        } finally {
          setLoading(false);
        }
      })();
    }, 400);

    return () => {
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, [waypoints, userEmail, allowRestricted, t]);

  const exportGpx = () => {
    if (!route) return;
    downloadTextFile(
      buildGpx("Velo Schweiz", route.coordinates, route.elevations),
      "velo-schweiz.gpx",
      "application/gpx+xml"
    );
  };

  const shareGpx = () => {
    if (!route) return;
    void shareOrDownloadGpx(
      buildGpx("Velo Schweiz", route.coordinates, route.elevations)
    );
  };

  const openAppleMaps = () => {
    const url = appleMapsBikeUrl(waypoints);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const openGoogleMaps = () => {
    const url = googleMapsBikeUrl(waypoints);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const exportJson = () => {
    if (!route) return;
    downloadTextFile(
      buildVeloExportJson(waypoints, route),
      "velo-schweiz.json",
      "application/json"
    );
  };

  const clickHint =
    waypoints.length === 0
      ? t("hintStart")
      : waypoints.length === 1
        ? t("hintEnd")
        : t("hintMore");

  return (
    <div className="st-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <Bike className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <h3 className="font-semibold text-zinc-900">{t("title")}</h3>
            <p className="text-xs text-[var(--st-muted)]">{clickHint}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={removeLastWaypoint}
            disabled={waypoints.length === 0}
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--st-border)] text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          >
            <Undo2 className="w-3.5 h-3.5" />
            {t("undoLast")}
          </button>
          <button
            type="button"
            onClick={clearRoute}
            disabled={waypoints.length === 0}
            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t("clearAll")}
          </button>
        </div>
      </div>

      <div
        className={
          fullscreen
            ? "overflow-hidden bg-stone-100"
            : "relative z-[1] mb-4 h-[min(70vh,calc(100dvh-11rem))] overflow-hidden rounded-xl border border-[var(--st-border)] bg-stone-100"
        }
        style={
          fullscreen
            ? {
                position: "fixed",
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                width: "100vw",
                height: "100dvh",
                zIndex: 5000,
                margin: 0,
                borderRadius: 0,
              }
            : undefined
        }
      >
        <div
          ref={mapContainerRef}
          className="h-full w-full cursor-crosshair"
          role="img"
          aria-label={t("mapAria")}
        />

        <div
          className={`pointer-events-none absolute right-3 z-[1000] flex gap-2 ${
            fullscreen
              ? "top-[max(0.75rem,env(safe-area-inset-top))]"
              : "top-3"
          }`}
        >
          {showLocate && (
            <button
              type="button"
              title={t("locateTitle")}
              aria-label={t("locateAria")}
              onClick={goToLocation}
              disabled={locating}
              className={`${mapChip} ${mapChipLight} h-9 w-9 justify-center px-0`}
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4 text-[#007aff]" />
              )}
            </button>
          )}
          <button
            type="button"
            title={fullscreen ? t("fullscreenClose") : t("fullscreen")}
            aria-label={fullscreen ? t("fullscreenClose") : t("fullscreenOpenAria")}
            aria-pressed={fullscreen}
            onClick={() => setFullscreen((v) => !v)}
            className={`${mapChip} ${mapChipLight} h-9 w-9 justify-center px-0`}
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {!fullscreen && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center px-24">
            <FahrverboteButton
              active={allowRestricted}
              onClick={() => setAllowRestricted((v) => !v)}
            />
          </div>
        )}

        {fullscreen && (
          <div
            className="pointer-events-none absolute inset-x-0 z-[1000] flex flex-wrap justify-center gap-2 px-3"
            style={{
              bottom: "max(2.25rem, calc(env(safe-area-inset-bottom) + 1.75rem))",
            }}
          >
            <button
              type="button"
              onClick={removeLastWaypoint}
              disabled={waypoints.length === 0}
              className={`${mapChip} ${mapChipLight}`}
            >
              <Undo2 className="h-3.5 w-3.5" />
              {t("undoLast")}
            </button>
            <button
              type="button"
              onClick={clearRoute}
              disabled={waypoints.length === 0}
              className={`${mapChip} ${mapChipDanger}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("clearAll")}
            </button>
            <FahrverboteButton
              active={allowRestricted}
              onClick={() => setAllowRestricted((v) => !v)}
            />
          </div>
        )}

        {locationError && (
          <p className="pointer-events-none absolute left-3 right-16 top-14 z-[1000] rounded-lg bg-red-50/95 px-3 py-1.5 text-xs text-red-700 shadow">
            {locationError}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        {(route || loading) && (
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 font-medium text-zinc-800">
              <Route className="w-4 h-4 text-red-600" />
              {t("route")}
              {loading && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
            </div>
            {route && (
              <>
                <span>
                  <strong>{route.stats.distanceKm} km</strong>
                  <span className="text-zinc-500"> · ~{route.stats.durationMin} min</span>
                </span>
                <span className="text-zinc-600 flex items-center gap-1">
                  <Mountain className="w-3.5 h-3.5" />
                  +{route.stats.ascentM} m / −{route.stats.descentM} m
                </span>
              </>
            )}
          </div>
        )}

        {route && (
          <div className="ml-auto flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={openAppleMaps}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl bg-[#007aff] text-white hover:bg-[#0066d6]"
              >
                <Navigation className="w-4 h-4" />
                {t("appleMaps")}
              </button>
              <button
                type="button"
                onClick={openGoogleMaps}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl border border-[var(--st-border)] text-zinc-800 hover:bg-zinc-50"
              >
                <Navigation className="w-4 h-4" />
                {t("googleMaps")}
              </button>
              <button
                type="button"
                onClick={shareGpx}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Share2 className="w-4 h-4" />
                {t("share")}
              </button>
              <button
                type="button"
                onClick={exportGpx}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl border border-[var(--st-border)] text-zinc-700 hover:bg-zinc-50"
              >
                <Download className="w-4 h-4" />
                GPX
              </button>
              <button
                type="button"
                onClick={exportJson}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl border border-[var(--st-border)] text-zinc-700 hover:bg-zinc-50"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
            </div>
            <p className="text-[11px] text-[var(--st-muted)] sm:text-right max-w-xl">
              {t("navHint")}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <p className="text-[11px] text-[var(--st-muted)] mt-3">
        Karte © swisstopo ·{" "}
        {allowRestricted
          ? t("footerOpen")
          : t("footerClosed")}{" "}
        {t("footerHint")}
      </p>
    </div>
  );
}
