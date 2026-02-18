"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RouteStop } from "@/lib/types";

// Public browser key, restricted via HTTP referrer in Google Cloud Console
const GOOGLE_MAPS_KEY = "AIzaSyDTcV42T-ZkriZOB8RtNZMtGR8gZq3Izi0";

interface RouteInfo {
  distance: string;
  duration: string;
  stops: number;
}

interface GoogleMapProps {
  stops: RouteStop[];
  travelMode: string;
  onRouteCalculated?: (info: RouteInfo) => void;
  onError?: (message: string) => void;
}

let loadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export default function GoogleMap({
  stops,
  travelMode,
  onRouteCalculated,
  onError,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const directionsRenderer =
    useRef<google.maps.DirectionsRenderer | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !mapRef.current) return;

    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current || mapInstance.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 47.3769, lng: 8.5417 },
          zoom: 6,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        mapInstance.current = map;

        const renderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: "#3b82f6",
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });

        directionsRenderer.current = renderer;
        setLoaded(true);
      })
      .catch((err) => {
        console.error("Google Maps load error:", err);
        setError("Karte konnte nicht geladen werden. Prüfe die Google Maps API-Konfiguration.");
      });
  }, []);

  const calculateRoute = useCallback(() => {
    if (!loaded || !mapInstance.current || !directionsRenderer.current) return;

    const filledStops = stops.filter((s) => s.name.trim() !== "");
    const start = filledStops.find((s) => s.type === "start");
    const end = filledStops.find((s) => s.type === "end");

    if (!start || !end) {
      directionsRenderer.current.setDirections({
        routes: [],
      } as unknown as google.maps.DirectionsResult);
      onRouteCalculated?.({ distance: "", duration: "", stops: 0 });
      return;
    }

    const waypoints = filledStops
      .filter((s) => s.type === "stop")
      .map((s) => ({
        location: s.name,
        stopover: true,
      }));

    const modeMap: Record<string, google.maps.TravelMode> = {
      auto: google.maps.TravelMode.DRIVING,
      zug: google.maps.TravelMode.TRANSIT,
      flug: google.maps.TravelMode.DRIVING,
    };

    setCalculating(true);
    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: start.name,
        destination: end.name,
        waypoints,
        optimizeWaypoints: false,
        travelMode: modeMap[travelMode] || google.maps.TravelMode.DRIVING,
      },
      (
        result: google.maps.DirectionsResult | null,
        status: google.maps.DirectionsStatus
      ) => {
        setCalculating(false);

        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.current?.setDirections(result);
          setError(null);

          let totalDistance = 0;
          let totalDuration = 0;
          const legs = result.routes[0]?.legs || [];

          for (const leg of legs) {
            totalDistance += leg.distance?.value || 0;
            totalDuration += leg.duration?.value || 0;
          }

          const distanceKm = Math.round(totalDistance / 1000);
          const hours = Math.floor(totalDuration / 3600);
          const minutes = Math.round((totalDuration % 3600) / 60);

          onRouteCalculated?.({
            distance: `${distanceKm.toLocaleString("de-CH")} km`,
            duration:
              hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`,
            stops: waypoints.length,
          });
        } else {
          const errorMessages: Record<string, string> = {
            NOT_FOUND: "Einer der Orte wurde nicht gefunden. Prüfe die Eingabe.",
            ZERO_RESULTS: "Keine Route zwischen diesen Orten gefunden.",
            OVER_QUERY_LIMIT: "Zu viele Anfragen. Bitte warte einen Moment.",
            REQUEST_DENIED: "Directions API nicht aktiviert. Bitte in Google Cloud Console aktivieren.",
            INVALID_REQUEST: "Ungültige Routenanfrage.",
          };
          const msg = errorMessages[status] || `Routenberechnung fehlgeschlagen (${status})`;
          onError?.(msg);
        }
      }
    );
  }, [loaded, stops, travelMode, onRouteCalculated, onError]);

  useEffect(() => {
    const timer = setTimeout(calculateRoute, 800);
    return () => clearTimeout(timer);
  }, [calculateRoute]);

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div className="bg-gradient-to-br from-blue-50 via-green-50 to-cyan-50 h-[400px] flex items-center justify-center rounded-2xl">
        <p className="text-gray-400 text-sm">
          Google Maps Key nicht konfiguriert
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 h-[400px] flex items-center justify-center rounded-2xl">
        <div className="text-center px-6">
          <p className="text-red-500 text-sm font-medium">{error}</p>
          <p className="text-red-400 text-xs mt-2">
            Stelle sicher, dass Maps JavaScript API, Places API und Directions API
            in der Google Cloud Console aktiviert sind.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="h-[400px] w-full rounded-2xl" />
      {calculating && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-600 font-medium">Route wird berechnet...</span>
        </div>
      )}
    </div>
  );
}

export function useGoogleAutocomplete() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) return;

    loadGoogleMapsScript()
      .then(() => setReady(true))
      .catch(() => {});
  }, []);

  const attachAutocomplete = useCallback(
    (inputElement: HTMLInputElement, onSelect: (place: string) => void) => {
      if (!ready || !inputElement) return;

      if (inputElement.dataset.autocompleteAttached) return;
      inputElement.dataset.autocompleteAttached = "true";

      const autocomplete = new google.maps.places.Autocomplete(inputElement, {
        types: ["(cities)"],
        fields: ["formatted_address", "name", "geometry"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place?.name) {
          onSelect(place.name);
        } else if (place?.formatted_address) {
          onSelect(place.formatted_address);
        }
      });

      return autocomplete;
    },
    [ready]
  );

  return { ready, attachAutocomplete };
}
