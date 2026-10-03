"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  MapPin,
  Hotel,
  Plane,
  Car,
  Train,
  Navigation,
  Plus,
  X,
  Calendar,
  Users,
  Search,
  ArrowRight,
  Flag,
  ChevronDown,
  Star,
  ExternalLink,
  Compass,
  Map,
  Sparkles,
  FolderOpen,
  Trash2,
  Check,
  BookmarkPlus,
  LogIn,
  Smartphone,
  Shield,
  Globe,
  Zap,
  BedDouble,
  Clock,
  Route,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  ArrowDownUp,
  FileDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Loader2,
  Settings,
  Pencil,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
;
import {
  Trip,
  TravelMode,
  TravelInterest,
  AiPoiSuggestion,
  RouteStop,
  BucketListItem,
  RouteLegInfo,
  Etappe,
  TripModule,
  TransportModule,
  ViaPoint,
  PdfPhotoPlacement,
  PdfPhotoLayout,
} from "@/lib/types";
import { fetchAiPois } from "@/lib/aiPoiService";
import {
  createNewTrip,
  saveTrip,
  getAllTrips,
  getTrip,
  deleteTrip,
  getActiveTripId,
  setActiveTripId,
  getTripDisplayName,
  formatDate,
} from "@/lib/tripStorage";
import { saveTripToCloud, deleteTripFromCloud } from "@/lib/cloudSync";
import { useAuth } from "@/components/AuthProvider";
import GoogleMap, { useGoogleAutocomplete } from "@/components/GoogleMap";
import HotelDatePicker from "@/components/HotelDatePicker";
import { POI, searchPOIs, searchPOIsAlongRoute } from "@/lib/poiService";
import { Landmark, loadLandmarks, filterLandmarks, CATEGORIES, CONTINENTS } from "@/lib/landmarkService";
import WikiThumb from "@/components/WikiThumb";
import DateRangePicker from "@/components/DateRangePicker";
import AirportSelect from "@/components/AirportSelect";
import { generateTripPDF } from "@/lib/pdfService";
import {
  buildBookingHotelLink,
  buildExpediaHotelLink,
  buildHotelsComLink,
  buildHotelsComDeeplink,
  buildAgodaHotelLink,
  buildTrivagoLink,
  buildHostelworldLink,
  buildGoogleFlightsLink,
  buildBookingFlightsLink,
  buildSkyscannerLink,
  buildKayakLink,
  buildBookingCarsLink,
  buildRentalcarsLink,
  buildBilligerMietwagenLink,
  buildAiraloLink,
  buildHolaflyLink,
  buildNomadEsimLink,
  buildGetYourGuideLink,
  buildViatorLink,
  buildTrainlineLink,
  buildOmioLink,
  buildAllianzTravelLink,
  buildWorldNomadsLink,
} from "@/lib/affiliateLinks";
import { trackAffiliateClick } from "@/lib/affiliateTracking";

function normalizePlaceKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

type CustomDiscoveryResult = {
  name: string;
  category: string;
  description: string;
  photoUrl?: string;
  lat?: number;
  lng?: number;
};

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string) || "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function imageUrlToPrintableDataUrl(url: string): Promise<string | undefined> {
  if (!url) return undefined;
  if (url.startsWith("data:image/")) return url;
  try {
    const proxied = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`);
    if (!proxied.ok) return undefined;
    const blob = await proxied.blob();
    const rawDataUrl = await blobToDataUrl(blob);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = reject;
      node.src = rawDataUrl;
    });
    const maxW = 640;
    const scale = img.width > maxW ? maxW / img.width : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return rawDataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.86);
  } catch {
    return undefined;
  }
}

async function fileToPrintableDataUrl(file: File): Promise<string | undefined> {
  try {
    const rawDataUrl = await blobToDataUrl(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = reject;
      node.src = rawDataUrl;
    });
    const maxW = 1400;
    const scale = img.width > maxW ? maxW / img.width : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return rawDataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.88);
  } catch {
    return undefined;
  }
}

export default function PlanerPage() {
  const { user } = useAuth();
  const { ready: autocompleteReady, attachAutocomplete } = useGoogleAutocomplete();
  const [trip, setTrip] = useState<Trip>(createNewTrip());
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    stops: number;
    legs: RouteLegInfo[];
  } | null>(null);
  const [savedTrips, setSavedTrips] = useState<Trip[]>([]);
  const [showTripList, setShowTripList] = useState(false);
  const planerRouter = useRouter();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [activeTab, setActiveTab] = useState<
    "route" | "hotels" | "flights" | "car" | "poi" | "report" | "bucket" | "esim" | "droneMaps" | "train" | "insurance"
  >("route");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [optimizeRoute, setOptimizeRoute] = useState(false);
  const [pois, setPois] = useState<POI[]>([]);
  const [poisLoading, setPoisLoading] = useState(false);
  const [poisSearchedFor, setPoisSearchedFor] = useState("");
  const [aiPois, setAiPois] = useState<AiPoiSuggestion[]>([]);
  const [aiPoisLoading, setAiPoisLoading] = useState(false);
  const [aiPoisError, setAiPoisError] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [landmarkQuery, setLandmarkQuery] = useState("");
  const [landmarkCategory, setLandmarkCategory] = useState("");
  const [landmarkContinent, setLandmarkContinent] = useState("");
  const [landmarkUnescoOnly, setLandmarkUnescoOnly] = useState(false);
  const [flightFrom, setFlightFrom] = useState("");
  const [flightTo, setFlightTo] = useState("");
  const [flightDepart, setFlightDepart] = useState("");
  const [flightReturn, setFlightReturn] = useState("");
  const [flightPassengers, setFlightPassengers] = useState(1);
  const [hotelOnlyDestination, setHotelOnlyDestination] = useState("");
  const [hotelOnlyCheckIn, setHotelOnlyCheckIn] = useState("");
  const [hotelOnlyCheckOut, setHotelOnlyCheckOut] = useState("");
  const [hotelOnlyTravelers, setHotelOnlyTravelers] = useState(2);
  const [hotelOnlyRooms, setHotelOnlyRooms] = useState(1);
  const hotelOnlyDestinationRef = useRef<HTMLInputElement>(null);
  const tripNameInputRef = useRef<HTMLInputElement>(null);
  const [landmarksLoaded, setLandmarksLoaded] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfProgressMsg, setPdfProgressMsg] = useState("");
  const [showModuleSettings, setShowModuleSettings] = useState(false);
  const [showTips, setShowTips] = useState(true);
  const [isEditingTripName, setIsEditingTripName] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const hotelStateBootstrappedRef = useRef(false);
  const [addingAiStops, setAddingAiStops] = useState<Record<string, boolean>>({});
  const [addedAiStops, setAddedAiStops] = useState<Record<string, boolean>>({});
  const [addingCustomStops, setAddingCustomStops] = useState<Record<string, boolean>>({});
  const [openEtappeMapIndex, setOpenEtappeMapIndex] = useState<number | null>(null);
  const etappeMapRef = useRef<HTMLDivElement>(null);
  const [showCoverPreviewModal, setShowCoverPreviewModal] = useState(false);
  const [showCoverVariantModal, setShowCoverVariantModal] = useState<"background" | "belowTitle" | null>(null);
  const [coverAspectRatio, setCoverAspectRatio] = useState<number | null>(null);
  const etappeMapMarkersRef = useRef<google.maps.Marker[]>([]);
  const etappeMapLineRef = useRef<google.maps.Polyline | null>(null);
  const etappeMapRouteRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [openCustomStopEtappe, setOpenCustomStopEtappe] = useState<number | null>(null);
  const [customStopQuery, setCustomStopQuery] = useState<Record<number, string>>({});
  const [customStopLoading, setCustomStopLoading] = useState<Record<number, boolean>>({});
  const [customStopResult, setCustomStopResult] = useState<Record<number, CustomDiscoveryResult | null>>({});
  const [openPhotoPickerEtappe, setOpenPhotoPickerEtappe] = useState<number | null>(null);
  const [photoTargetPagesByEtappe, setPhotoTargetPagesByEtappe] = useState<Record<number, number>>({});
  const [draggingPhotoSlotByEtappe, setDraggingPhotoSlotByEtappe] = useState<Record<number, number | null>>({});
  const [photoAspectByUrl, setPhotoAspectByUrl] = useState<Record<string, number>>({});
  const [quickStopDrafts, setQuickStopDrafts] = useState<Array<{ id: string; name: string; lat?: number; lng?: number }>>([]);

  const checkTabScroll = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkTabScroll();
    const delayed = setTimeout(checkTabScroll, 300);
    window.addEventListener("resize", checkTabScroll);
    return () => {
      clearTimeout(delayed);
      window.removeEventListener("resize", checkTabScroll);
    };
  }, [checkTabScroll]);

  useEffect(() => {
    if (activeTab === "bucket" && !landmarksLoaded) {
      loadLandmarks().then((data) => {
        setLandmarks(data);
        setLandmarksLoaded(true);
      });
    }
  }, [activeTab, landmarksLoaded]);

  useEffect(() => {
    if (activeTab === "flights") {
      if (!flightFrom && origin) setFlightFrom(origin);
      if (!flightTo && destination) setFlightTo(destination);
      if (!flightDepart && trip.startDate) setFlightDepart(trip.startDate);
      if (!flightReturn && trip.endDate) setFlightReturn(trip.endDate);
      if (flightPassengers === 1 && trip.travelers > 1) setFlightPassengers(trip.travelers);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "hotels" || !autocompleteReady || !hotelOnlyDestinationRef.current) return;
    attachAutocomplete(hotelOnlyDestinationRef.current, (place) => {
      setHotelOnlyDestination(place);
    });
  }, [activeTab, autocompleteReady, attachAutocomplete]);

  useEffect(() => {
    if (hotelStateBootstrappedRef.current) return;
    hotelStateBootstrappedRef.current = true;
    if (typeof window === "undefined") return;
    const urlParams = new URL(window.location.href).searchParams;
    const qDestination = urlParams.get("hdest") || "";
    const qCheckIn = urlParams.get("hci") || "";
    const qCheckOut = urlParams.get("hco") || "";
    const qAdults = Number(urlParams.get("hadults") || "");
    const qRooms = Number(urlParams.get("hrooms") || "");
    if (qDestination) setHotelOnlyDestination(qDestination);
    if (qCheckIn) setHotelOnlyCheckIn(qCheckIn);
    if (qCheckOut) setHotelOnlyCheckOut(qCheckOut);
    if (Number.isFinite(qAdults) && qAdults > 0) setHotelOnlyTravelers(qAdults);
    if (Number.isFinite(qRooms) && qRooms > 0) setHotelOnlyRooms(qRooms);
  }, []);

  useEffect(() => {
    // Keep hotel-only search clean when switching trips.
    setHotelOnlyDestination("");
    setHotelOnlyCheckIn("");
    setHotelOnlyCheckOut("");
    setHotelOnlyTravelers(Math.max(1, trip.travelers || 2));
    setHotelOnlyRooms(1);
  }, [trip.id, trip.travelers]);

  useEffect(() => {
    const shouldEditInHeader = trip.name === "Neue Reise" || isEditingTripName;
    if (!shouldEditInHeader) return;
    const timer = setTimeout(() => {
      tripNameInputRef.current?.focus();
      tripNameInputRef.current?.select();
    }, 250);
    return () => clearTimeout(timer);
  }, [trip.id, trip.name, isEditingTripName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const setOrDelete = (key: string, value?: string) => {
      const v = (value || "").trim();
      if (v) url.searchParams.set(key, v);
      else url.searchParams.delete(key);
    };
    setOrDelete("hdest", hotelOnlyDestination);
    setOrDelete("hci", hotelOnlyCheckIn);
    setOrDelete("hco", hotelOnlyCheckOut);
    setOrDelete("hadults", String(Math.max(1, hotelOnlyTravelers || 1)));
    setOrDelete("hrooms", String(Math.max(1, hotelOnlyRooms || 1)));
    window.history.replaceState({}, "", url.toString());
  }, [hotelOnlyDestination, hotelOnlyCheckIn, hotelOnlyCheckOut, hotelOnlyTravelers, hotelOnlyRooms]);

  // Load active trip or redirect to welcome
  useEffect(() => {
    const activeId = getActiveTripId();
    if (activeId) {
      const existing = getTrip(activeId);
      if (existing) {
        setTrip(existing);
      } else {
        planerRouter.replace("/");
      }
    } else {
      planerRouter.replace("/");
    }
    setSavedTrips(getAllTrips());
  }, [planerRouter]);

  const updateTrip = useCallback((updates: Partial<Trip> | ((prev: Trip) => Trip)) => {
    setTrip((prev) =>
      typeof updates === "function" ? updates(prev) : { ...prev, ...updates }
    );
    setHasUnsavedChanges(true);
  }, []);

  const updateTripSilent = useCallback((updates: Partial<Trip> | ((prev: Trip) => Trip)) => {
    setTrip((prev) =>
      typeof updates === "function" ? updates(prev) : { ...prev, ...updates }
    );
  }, []);

  const handleSave = useCallback(() => {
    saveTrip(trip);
    setActiveTripId(trip.id);
    setSavedTrips(getAllTrips());
    setHasUnsavedChanges(false);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
    if (user) {
      saveTripToCloud(trip, user.id);
    }
  }, [trip, user]);

  // Auto-save after 3 seconds of inactivity
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 3000);
    return () => clearTimeout(timer);
  }, [trip, hasUnsavedChanges, handleSave]);

  // Safety net: persist pending edits when tab/app is closed or backgrounded.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const flushPendingTrip = () => {
      if (!hasUnsavedChanges) return;
      saveTrip({ ...trip, updatedAt: new Date().toISOString() });
      setActiveTripId(trip.id);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushPendingTrip();
      }
    };

    window.addEventListener("pagehide", flushPendingTrip);
    window.addEventListener("beforeunload", flushPendingTrip);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pagehide", flushPendingTrip);
      window.removeEventListener("beforeunload", flushPendingTrip);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [trip, hasUnsavedChanges]);

  const handleNewTrip = () => {
    if (hasUnsavedChanges) {
      handleSave();
    }
    planerRouter.push("/");
  };

  const handleLoadTrip = (id: string) => {
    const loaded = getTrip(id);
    if (loaded) {
      setTrip(loaded);
      setActiveTripId(id);
      setHasUnsavedChanges(false);
      setShowTripList(false);
    }
  };

  const handleDeleteTrip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTrip(id);
    if (user) {
      deleteTripFromCloud(id);
    }
    setSavedTrips(getAllTrips());
    if (trip.id === id) {
      const newTrip = createNewTrip();
      setTrip(newTrip);
      setActiveTripId(newTrip.id);
    }
  };

  const TRANSPORT_TABS: string[] = ["route", "car", "train", "flights"];
  const isTransportTab = TRANSPORT_TABS.includes(activeTab);

  const defaultStopsForRoute = (): RouteStop[] => [
    { id: "start", name: "", type: "start" },
    { id: "end", name: "", type: "end" },
  ];

  const currentRouteStops: RouteStop[] = (() => {
    if (activeTab === "route") return trip.stops;
    const key = activeTab as TransportModule;
    if (TRANSPORT_TABS.includes(key)) return trip.routes?.[key]?.stops || defaultStopsForRoute();
    return trip.stops;
  })();

  const currentRouteViaPoints: ViaPoint[] = (() => {
    if (activeTab === "route") return trip.routes?.route?.viaPoints || [];
    const key = activeTab as TransportModule;
    if (TRANSPORT_TABS.includes(key)) return trip.routes?.[key]?.viaPoints || [];
    return trip.routes?.route?.viaPoints || [];
  })();

  const updateCurrentStops = useCallback((newStops: RouteStop[]) => {
    if (activeTab === "route") {
      updateTrip({ stops: newStops });
    } else {
      const key = activeTab as TransportModule;
      if (TRANSPORT_TABS.includes(key)) {
        updateTrip((prev) => ({
          ...prev,
          routes: { ...prev.routes, [key]: { stops: newStops } },
        }));
      } else {
        // Non-transport tabs (e.g. POI/Hotels/Bucket) still edit the main route stops.
        updateTrip({ stops: newStops });
      }
    }
  }, [activeTab, updateTrip]);

  const updateCurrentViaPoints = useCallback((newViaPoints: ViaPoint[]) => {
    const toKey = (vp: ViaPoint) => `${vp.afterStopId || ""}:${vp.lat.toFixed(5)}:${vp.lng.toFixed(5)}`;
    const normalize = (arr: ViaPoint[]) =>
      arr
        .filter((vp) => Number.isFinite(vp.lat) && Number.isFinite(vp.lng))
        .map((vp, idx) => ({
          id: vp.id || `via-${Date.now()}-${idx}`,
          lat: vp.lat,
          lng: vp.lng,
          afterStopId: vp.afterStopId,
        }))
        .sort((a, b) => toKey(a).localeCompare(toKey(b)));

    const normalized = normalize(newViaPoints);
    const current = normalize(currentRouteViaPoints);
    const same =
      normalized.length === current.length &&
      normalized.every((vp, i) => toKey(vp) === toKey(current[i]));
    if (same) return;

    if (activeTab === "route") {
      updateTrip((prev) => ({
        ...prev,
        routes: {
          ...(prev.routes || {}),
          route: {
            stops: prev.routes?.route?.stops || prev.stops,
            viaPoints: normalized,
          },
        },
      }));
      return;
    }

    const key = activeTab as TransportModule;
    if (!TRANSPORT_TABS.includes(key)) return;
    updateTrip((prev) => ({
      ...prev,
      routes: {
        ...(prev.routes || {}),
        [key]: {
          stops: prev.routes?.[key]?.stops || defaultStopsForRoute(),
          viaPoints: normalized,
        },
      },
    }));
  }, [activeTab, currentRouteViaPoints, updateTrip]);

  const addStop = () => {
    const newStop: RouteStop = {
      id: `stop-${Date.now()}`,
      name: "",
      type: "stop",
    };
    const endIdx = currentRouteStops.findIndex((s) => s.type === "end");
    const newStops = [...currentRouteStops];
    newStops.splice(endIdx, 0, newStop);
    updateCurrentStops(newStops);
  };

  const addQuickStopDraft = () => {
    setQuickStopDrafts((prev) => [...prev, { id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: "" }]);
  };

  const commitQuickStopDraft = async (draftId: string, payload?: { name: string; lat?: number; lng?: number }) => {
    const draft = payload || quickStopDrafts.find((d) => d.id === draftId);
    if (!draft?.name.trim()) return;
    const inserted = await addStopSmart(draft.name.trim(), draft.lat, draft.lng);
    if (inserted) {
      setQuickStopDrafts((prev) => prev.filter((d) => d.id !== draftId));
    }
  };

  const addStopFromMap = (placeName: string, lat: number, lng: number, insertAtIndex?: number) => {
    const baseName = (placeName || "Ort").trim();
    const baseKey = normalizePlaceKey(baseName);
    const hasSameName = currentRouteStops.some((s) => normalizePlaceKey(s.name) === baseKey);
    const finalName = hasSameName ? `${baseName} (POI)` : baseName;
    const effectiveInsertIdx =
      insertAtIndex != null && Number.isFinite(insertAtIndex)
        ? Math.max(0, Math.min(currentRouteStops.length, insertAtIndex))
        : (() => {
            const endIdx = currentRouteStops.findIndex((s) => s.type === "end");
            return endIdx >= 0 ? endIdx : currentRouteStops.length;
          })();
    const discoveryEtappeIndex = Math.max(
      0,
      currentRouteStops
        .slice(0, effectiveInsertIdx)
        .filter((s) => s.type === "stop" && !!s.isHotel).length
    );
    const newStop: RouteStop = {
      id: `stop-${Date.now()}`,
      name: finalName,
      type: "stop",
      lat,
      lng,
      discoverySource: "custom",
      discoveryCategory: "Karten-POI",
      discoveryEtappeIndex,
      discoveryAddedAt: new Date().toISOString(),
    };
    const newStops = [...currentRouteStops];
    if (insertAtIndex != null && insertAtIndex >= 0 && insertAtIndex <= newStops.length) {
      newStops.splice(insertAtIndex, 0, newStop);
    } else {
      const endIdx = newStops.findIndex((s) => s.type === "end");
      newStops.splice(endIdx >= 0 ? endIdx : newStops.length, 0, newStop);
    }
    updateCurrentStops(newStops);
  };

  const addStopSmart = async (
    name: string,
    lat?: number,
    lng?: number,
    extraFields?: Partial<RouteStop>
  ): Promise<boolean> => {
    const wantedKey = normalizePlaceKey(name);
    if (currentRouteStops.some((s) => normalizePlaceKey(s.name) === wantedKey)) {
      return false;
    }
    const newStop: RouteStop = { id: `stop-${Date.now()}`, name, type: "stop", lat, lng, ...extraFields };
    const stops = currentRouteStops;
    const existingStops = stops.filter((s) => s.name.trim());
    if (existingStops.length < 2 || lat == null || lng == null) {
      const newStops = [...stops];
      const endIdx = newStops.findIndex((s) => s.type === "end");
      newStops.splice(endIdx >= 0 ? endIdx : newStops.length, 0, newStop);
      updateCurrentStops(newStops);
      return true;
    }
    const coords = await Promise.all(
      stops.map(async (s) => {
        const c = await geocodeStop(s);
        return c ? { ...s, lat: c.lat, lng: c.lng } : s;
      })
    );
    let bestIdx = coords.findIndex((s) => s.type === "end");
    let minDetour = Infinity;
    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i], b = coords[i + 1];
      if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) continue;
      const ab = haversine(a.lat, a.lng, b.lat, b.lng);
      const ac = haversine(a.lat, a.lng, lat, lng);
      const cb = haversine(lat, lng, b.lat, b.lng);
      const detour = ac + cb - ab;
      if (detour < minDetour) { minDetour = detour; bestIdx = i + 1; }
    }
    const finalStops: RouteStop[] = coords.map((s, i) => ({ ...stops[i], lat: s.lat, lng: s.lng }));
    finalStops.splice(bestIdx, 0, newStop);
    updateCurrentStops(finalStops);
    return true;
  };

  const removeStop = (id: string) => {
    updateCurrentStops(currentRouteStops.filter((s) => s.id !== id));
  };

  const updateStop = (id: string, name: string) => {
    if (activeTab === "route") {
      updateTrip((prev) => ({
        ...prev,
        stops: prev.stops.map((s) => (s.id === id ? { ...s, name } : s)),
      }));
      return;
    }

    const key = activeTab as TransportModule;
    if (TRANSPORT_TABS.includes(key)) {
      updateTrip((prev) => {
        const currentStops = prev.routes?.[key]?.stops || defaultStopsForRoute();
        return {
          ...prev,
          routes: {
            ...prev.routes,
            [key]: {
              stops: currentStops.map((s) => (s.id === id ? { ...s, name } : s)),
            },
          },
        };
      });
    }
  };

  const geocodeStop = async (s: RouteStop): Promise<{ lat: number; lng: number } | null> => {
    if (s.lat != null && s.lng != null) return { lat: s.lat, lng: s.lng };
    if (!s.name.trim() || !window.google?.maps) return null;
    try {
      const geocoder = new google.maps.Geocoder();
      const res = await geocoder.geocode({ address: s.bookingAddress || s.name });
      const loc = res.results?.[0]?.geometry?.location;
      if (loc) return { lat: loc.lat(), lng: loc.lng() };
    } catch { /* ignore */ }
    return null;
  };

  const updateStopWithCoords = async (id: string, name: string, lat: number, lng: number) => {
    const stops = currentRouteStops;
    const stopIdx = stops.findIndex((s) => s.id === id);
    if (stopIdx < 0) return;
    const stop = stops[stopIdx];
    if (stop.type !== "stop") {
      updateCurrentStops(stops.map((s) => (s.id === id ? { ...s, name, lat, lng } : s)));
      return;
    }

    const newStops = stops.filter((s) => s.id !== id);
    const updatedStop: RouteStop = { ...stop, name, lat, lng };

    const filledStops = newStops.filter((s) => s.name.trim());
    if (filledStops.length < 2) {
      const endIdx = newStops.findIndex((s) => s.type === "end");
      newStops.splice(endIdx >= 0 ? endIdx : newStops.length, 0, updatedStop);
      updateCurrentStops(newStops);
      return;
    }

    const coords = await Promise.all(
      newStops.map(async (s) => {
        const c = await geocodeStop(s);
        if (c) s = { ...s, lat: c.lat, lng: c.lng };
        return s;
      })
    );

    let bestIdx = coords.findIndex((s) => s.type === "end");
    let minDetour = Infinity;

    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i];
      const b = coords[i + 1];
      if (!a.name.trim() || !b.name.trim()) continue;
      const aLat = a.lat, aLng = a.lng;
      const bLat = b.lat, bLng = b.lng;
      if (aLat == null || aLng == null || bLat == null || bLng == null) continue;

      const ab = haversine(aLat, aLng, bLat, bLng);
      const ac = haversine(aLat, aLng, lat, lng);
      const cb = haversine(lat, lng, bLat, bLng);
      const detour = ac + cb - ab;

      if (detour < minDetour) {
        minDetour = detour;
        bestIdx = i + 1;
      }
    }

    const finalStops: RouteStop[] = coords.map((s, i) => ({ ...newStops[i], lat: s.lat, lng: s.lng }));
    finalStops.splice(bestIdx, 0, updatedStop);
    updateCurrentStops(finalStops);
  };

  const updateStopField = (id: string, fields: Partial<RouteStop>) => {
    if (activeTab === "route") {
      updateTrip((prev) => ({
        ...prev,
        stops: prev.stops.map((s) => (s.id === id ? { ...s, ...fields } : s)),
      }));
      return;
    }

    const key = activeTab as TransportModule;
    if (TRANSPORT_TABS.includes(key)) {
      updateTrip((prev) => {
        const currentStops = prev.routes?.[key]?.stops || defaultStopsForRoute();
        return {
          ...prev,
          routes: {
            ...prev.routes,
            [key]: {
              stops: currentStops.map((s) => (s.id === id ? { ...s, ...fields } : s)),
            },
          },
        };
      });
      return;
    }

    updateTrip((prev) => ({
      ...prev,
      stops: prev.stops.map((s) => (s.id === id ? { ...s, ...fields } : s)),
    }));
  };

  const toggleHotel = (id: string) => {
    const inCurrent = currentRouteStops.some((s) => s.id === id);
    if (inCurrent && isTransportTab) {
      updateCurrentStops(
        currentRouteStops.map((s) =>
          s.id === id ? { ...s, isHotel: !s.isHotel } : s
        )
      );
    } else {
      updateTrip({
        stops: trip.stops.map((s) =>
          s.id === id ? { ...s, isHotel: !s.isHotel } : s
        ),
      });
    }
  };

  const extractCityFromAddress = (addr: string): string => {
    const line = (addr || "").split("\n")[0];
    const plzMatch = line.match(/\b\d{4,5}\s+([^,\n]+)/);
    if (plzMatch) return plzMatch[1].trim();
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length >= 3) {
      if (/^\d/.test(parts[0]) || /\b(strasse|straße|weg|gasse|rue|route|via|avenue|road|str\.|chemin|place|boulevard|blvd)\b/i.test(parts[0])) {
        return parts[1].replace(/^\d{4,5}\s*/, "").trim();
      }
    }
    return parts[0].trim();
  };

  const etappen: Etappe[] = (() => {
    if (!routeInfo?.legs?.length) return [];
    const stops = currentRouteStops;

    const namedStops = stops.filter((s) => s.name.trim());
    const hotelStops = namedStops.filter((s) => s.type === "stop" && !!s.isHotel);

    if (hotelStops.length === 0) {
      const totalKm = routeInfo.legs.reduce((sum, l) => sum + l.distanceMeters, 0);
      const totalSec = routeInfo.legs.reduce((sum, l) => sum + l.durationSeconds, 0);
      const startName = stops.find((s) => s.type === "start")?.name || "Start";
      const endName = stops.find((s) => s.type === "end")?.name || "Ziel";
      return [{
        index: 0,
        label: "Etappe 1",
        from: startName,
        to: endName,
        legs: routeInfo.legs,
        distanceKm: Math.round(totalKm / 1000),
        durationFormatted: formatDur(totalSec),
      }];
    }

    const result: Etappe[] = [];
    let currentLegs: RouteLegInfo[] = [];
    let etappeIdx = 0;
    const startName2 = stops.find((s) => s.type === "start")?.name || "Start";
    let etappeFrom = startName2;

    for (let legIdx = 0; legIdx < routeInfo.legs.length; legIdx++) {
      const leg = routeInfo.legs[legIdx];
      currentLegs.push(leg);
      const toStop = namedStops[legIdx + 1];
      const isHotelSplitPoint = !!toStop && toStop.type === "stop" && !!toStop.isHotel;

      if (isHotelSplitPoint) {
        const km = currentLegs.reduce((s, l) => s + l.distanceMeters, 0);
        const sec = currentLegs.reduce((s, l) => s + l.durationSeconds, 0);
        result.push({
          index: etappeIdx,
          label: `Etappe ${etappeIdx + 1}`,
          from: etappeFrom,
          to: extractCityFromAddress(leg.to),
          legs: [...currentLegs],
          distanceKm: Math.round(km / 1000),
          durationFormatted: formatDur(sec),
          hotelBooked: !!toStop.bookingConfirmation,
          hotelName: toStop.bookingHotelName,
          hotelAddress: toStop.bookingAddress,
          hotelNights: toStop.hotelNights,
        });
        etappeFrom = extractCityFromAddress(leg.to);
        currentLegs = [];
        etappeIdx++;
      }
    }

    if (currentLegs.length > 0) {
      const km = currentLegs.reduce((s, l) => s + l.distanceMeters, 0);
      const sec = currentLegs.reduce((s, l) => s + l.durationSeconds, 0);
      const endName = stops.find((s) => s.type === "end")?.name || "Ziel";
      result.push({
        index: etappeIdx,
        label: `Etappe ${etappeIdx + 1}`,
        from: etappeFrom,
        to: endName,
        legs: [...currentLegs],
        distanceKm: Math.round(km / 1000),
        durationFormatted: formatDur(sec),
      });
    }

    return result;
  })();

  const moveStop = (id: string, direction: "up" | "down") => {
    const newStops = [...currentRouteStops];
    const idx = newStops.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newStops.length) return;
    if (newStops[targetIdx].type === "start") return;
    if (newStops[targetIdx].type === "end") return;
    [newStops[idx], newStops[targetIdx]] = [newStops[targetIdx], newStops[idx]];
    updateCurrentStops(newStops);
  };

  const reverseRoute = () => {
    const stops = currentRouteStops;
    const start = stops.find((s) => s.type === "start");
    const end = stops.find((s) => s.type === "end");
    const waypoints = stops.filter((s) => s.type === "stop");
    if (!start || !end) return;

    const newStart: RouteStop = { ...start, name: end.name };
    const newEnd: RouteStop = { ...end, name: start.name };
    const reversedWaypoints = [...waypoints].reverse();

    updateCurrentStops([newStart, ...reversedWaypoints, newEnd]);
  };

  const handleOptimizeRoute = () => {
    const waypointStops = currentRouteStops.filter((s) => s.type === "stop" && s.name.trim());
    if (waypointStops.length < 2) return;
    if (waypointStops.length > 23) {
      setRouteError("Optimierung ist nur bis 23 Zwischenstopps möglich. Reduziere die Anzahl oder optimiere manuell.");
      return;
    }
    setOptimizeRoute(true);
  };

  const handleStopsReordered = useCallback((orderedIds: string[]) => {
    const stops = activeTab === "route" ? trip.stops : (trip.routes?.[activeTab as TransportModule]?.stops || []);
    const stopLookup: Record<string, RouteStop> = {};
    stops.forEach((s) => { stopLookup[s.id] = s; });
    const reordered = orderedIds
      .map((id) => stopLookup[id])
      .filter((s): s is RouteStop => !!s);
    if (reordered.length === stops.length) {
      if (activeTab === "route") {
        updateTrip({ stops: reordered });
      } else {
        const routes = { ...trip.routes, [activeTab as TransportModule]: { stops: reordered } };
        updateTrip({ routes });
      }
    }
    setOptimizeRoute(false);
  }, [activeTab, trip.stops, trip.routes, updateTrip]);

  const addToBucketList = (item: Omit<BucketListItem, "id" | "added">) => {
    const newItem: BucketListItem = {
      ...item,
      id: `bl_${Date.now()}`,
      added: new Date().toISOString(),
    };
    updateTrip({ bucketList: [...trip.bucketList, newItem] });
  };

  const removeFromBucketList = (id: string) => {
    updateTrip({ bucketList: trip.bucketList.filter((b) => b.id !== id) });
  };

  const travelModes = [
    { id: "auto" as TravelMode, label: "Auto", icon: Car },
  ];

  const defaultModules: string[] = ["route", "hotels", "poi", "report", "bucket"];
  const activeModules = trip.modules?.length ? trip.modules : defaultModules;

  const allTabs = [
    { id: "route" as const, label: "Autoroute", icon: Car, module: "route" },
    { id: "hotels" as const, label: "Hotels", icon: Hotel, module: "hotels" },
    { id: "poi" as const, label: "Entdecken", icon: Compass, module: "poi" },
    { id: "report" as const, label: "Reisebericht", icon: FileDown, module: "report" },
    { id: "bucket" as const, label: "Bucket List", icon: BookmarkPlus, module: "bucket" },
    { id: "flights" as const, label: "Flüge", icon: Plane, module: "flights" },
    { id: "car" as const, label: "Mietwagen", icon: Car, module: "car" },
    { id: "train" as const, label: "Züge", icon: Train, module: "train" },
    { id: "esim" as const, label: "eSIM", icon: Smartphone, module: "esim" },
    { id: "droneMaps" as const, label: "Drohnenkarten", icon: Map, module: "droneMaps" },
    { id: "insurance" as const, label: "Versicherung", icon: Shield, module: "insurance" },
  ];

  const tabs = allTabs.filter((t) => activeModules.includes(t.module));
  const isHotelOnlyMode = tabs.length === 1 && tabs[0].id === "hotels";

  useEffect(() => {
    if (tabs.length === 1 && activeTab !== tabs[0].id) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const toggleModule = (mod: string) => {
    const current = trip.modules?.length ? [...trip.modules] : ["route", "hotels", "poi", "report", "bucket"];
    const updated = current.includes(mod)
      ? current.filter((m) => m !== mod)
      : [...current, mod];
    if (updated.length === 0) return;
    updateTrip({ modules: updated as Trip["modules"] });
  };

  const destination = trip.stops.find((s) => s.type === "end")?.name || "";
  const origin = trip.stops.find((s) => s.type === "start")?.name || "";
  const currentOrigin = currentRouteStops.find((s) => s.type === "start")?.name || "";
  const currentDestination = currentRouteStops.find((s) => s.type === "end")?.name || "";

  const searchParams = {
    destination,
    origin,
    checkIn: trip.startDate,
    checkOut: trip.endDate,
    travelers: trip.travelers,
  };

  const hotelOnlySearchParams = {
    destination: hotelOnlyDestination,
    checkIn: hotelOnlyCheckIn,
    checkOut: hotelOnlyCheckOut,
    travelers: hotelOnlyTravelers || trip.travelers,
    rooms: hotelOnlyRooms || 1,
  };

  const hotelOnlyNights = (() => {
    const ci = hotelOnlyCheckIn;
    const co = hotelOnlyCheckOut;
    if (!ci || !co) return 2;
    const [cy, cm, cd] = ci.split("-").map(Number);
    const [oy, om, od] = co.split("-").map(Number);
    const cDate = new Date(cy, cm - 1, cd);
    const oDate = new Date(oy, om - 1, od);
    const diff = Math.round((oDate.getTime() - cDate.getTime()) / 86400000);
    return Math.max(1, diff || 1);
  })();
  const isNamingNewTrip = !trip.name?.trim() || trip.name === "Neue Reise";
  const showTripNameEditor = isNamingNewTrip || isEditingTripName;
  const coverTitleColor = trip.pdfCoverTitleColor || "#007aff";
  const coverDateColor = trip.pdfCoverDateColor || "#007aff";
  const coverTitleSize = Math.max(18, Math.min(64, Number(trip.pdfCoverTitleSize) || 32));
  const coverDateSize = Math.max(10, Math.min(36, Number(trip.pdfCoverDateSize) || 14));
  const coverTitleFont = trip.pdfCoverTitleFont || "helvetica";
  const coverDateFont = trip.pdfCoverDateFont || "helvetica";
  const coverTitleAlign = trip.pdfCoverTitleAlign === "left" || trip.pdfCoverTitleAlign === "right" ? trip.pdfCoverTitleAlign : "center";
  const coverDateAlign = trip.pdfCoverDateAlign === "left" || trip.pdfCoverDateAlign === "right" ? trip.pdfCoverDateAlign : "center";
  const coverMiniTitleSize = Math.min(14, Math.max(8, coverTitleSize * 0.34));
  const coverMiniDateSize = Math.min(11, Math.max(7, coverDateSize * 0.5));
  const coverIsPortrait = typeof coverAspectRatio === "number" ? coverAspectRatio < 1 : false;
  const previewModeFor = (style: "background" | "belowTitle"): "background" | "belowTitle" =>
    style === "background" && coverIsPortrait ? "background" : "belowTitle";
  const coverFontFamily = (font: string): string => {
    if (font === "times") return "Times New Roman, Times, serif";
    if (font === "courier") return "Courier New, Courier, monospace";
    return "Helvetica, Arial, sans-serif";
  };

  useEffect(() => {
    if (!trip.pdfCoverPhotoDataUrl) {
      setCoverAspectRatio(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.width > 0 && img.height > 0) {
        setCoverAspectRatio(img.width / img.height);
      }
    };
    img.onerror = () => setCoverAspectRatio(null);
    img.src = trip.pdfCoverPhotoDataUrl;
  }, [trip.pdfCoverPhotoDataUrl]);

  const logAffiliateClick = useCallback(
    (module: string, provider: string, targetUrl: string, context?: Record<string, unknown>) => {
      void trackAffiliateClick({
        module,
        provider,
        targetUrl,
        tripId: trip.id,
        userId: user?.id,
        destination: destination || undefined,
        origin: origin || undefined,
        context,
      });
    },
    [trip.id, user?.id, destination, origin]
  );

  const createAffiliateClickRef = useCallback(() => {
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 8);
    return `snf-${ts}-${rnd}`;
  }, []);

  const openExpediaAffiliateLink = useCallback(
    (params: Parameters<typeof buildExpediaHotelLink>[0], context?: Record<string, unknown>) => {
      const targetUrl = buildExpediaHotelLink({
        ...params,
        clickRef: createAffiliateClickRef(),
      });
      logAffiliateClick("hotels", "Expedia", targetUrl, context);
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    },
    [createAffiliateClickRef, logAffiliateClick]
  );

  const openHotelsComAffiliateLink = useCallback(
    (params: Parameters<typeof buildHotelsComDeeplink>[0], context?: Record<string, unknown>) => {
      const targetUrl = buildHotelsComDeeplink({
        ...params,
        clickRef: createAffiliateClickRef(),
      });
      logAffiliateClick("hotels", "Hotels.com", targetUrl, context);
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    },
    [createAffiliateClickRef, logAffiliateClick]
  );

  const displayPOIs: { name: string; category: string; rating: number; description: string; photoUrl?: string }[] =
    pois.length > 0
      ? pois.map((p) => ({ name: p.name, category: p.category, rating: p.rating, description: p.address, photoUrl: p.photoUrl }))
      : destination
      ? []
      : [
          { name: "Sagrada Família", category: "Sehenswürdigkeit", rating: 4.8, description: "Gaudís berühmte Basilika" },
          { name: "Park Güell", category: "Park", rating: 4.6, description: "Bunter Mosaikpark von Gaudí" },
          { name: "La Boqueria", category: "Markt", rating: 4.5, description: "Berühmter Lebensmittelmarkt" },
          { name: "Casa Batlló", category: "Architektur", rating: 4.7, description: "Meisterwerk des Modernisme" },
        ];

  const [poiScope, setPoiScope] = useState<"route" | "destination" | "ai">("ai");

  const interestOptions: { id: TravelInterest; label: string; emoji: string }[] = [
    { id: "kultur", label: "Kultur & Geschichte", emoji: "🏰" },
    { id: "natur", label: "Natur & Landschaft", emoji: "🌿" },
    { id: "kulinarik", label: "Kulinarik & Wein", emoji: "🍷" },
    { id: "straende", label: "Strände & Küste", emoji: "🏖" },
    { id: "fotospots", label: "Fotospots", emoji: "📸" },
    { id: "familien", label: "Familien", emoji: "🎢" },
    { id: "abenteuer", label: "Abenteuer & Sport", emoji: "🥾" },
    { id: "shopping", label: "Shopping & Märkte", emoji: "🛍" },
  ];

  const toggleInterest = (interest: TravelInterest) => {
    const current = trip.interests || [];
    const updated = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest];
    updateTrip({ interests: updated });
  };

  const loadPOIs = useCallback(async (scope: "route" | "destination") => {
    const routeStopNames = trip.stops.filter((s) => s.name.trim()).map((s) => s.name);
    const key = scope === "route" ? `route:${routeStopNames.join(",")}` : `dest:${destination}`;
    if (key === poisSearchedFor) return;
    setPoisLoading(true);
    setPoisSearchedFor(key);
    try {
      if (scope === "route" && routeStopNames.length >= 2) {
        const results = await searchPOIsAlongRoute(routeStopNames);
        setPois(results);
      } else if (destination) {
        const results = await searchPOIs(destination);
        setPois(results);
      } else {
        setPois([]);
      }
    } catch {
      setPois([]);
    } finally {
      setPoisLoading(false);
    }
  }, [poisSearchedFor, trip.stops, destination]);

  const [aiLoadingEtappe, setAiLoadingEtappe] = useState<number | null>(null);
  const [aiPoiPhotos, setAiPoiPhotos] = useState<Record<string, string>>({});

  const cleanWikipediaText = useCallback((value: string): string => {
    return (value || "")
      .replace(/Vorlage:[^\n.?!]*/gi, " ")
      .replace(/\bWikidata\b/gi, " ")
      .replace(/\s*\[[^\]]+\]\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const isWeakWikipediaText = useCallback((value: string): boolean => {
    const v = (value || "").toLowerCase();
    if (!v) return true;
    if (v.includes("vorlage:") || v.includes("wikidata")) return true;
    if (v.includes("begriffsklärung")) return true;
    return cleanWikipediaText(value).length < 120;
  }, [cleanWikipediaText]);

  const fetchWikipediaPageByTitle = useCallback(async (
    title: string
  ): Promise<{ title: string; extract: string; thumbnail?: string; lat?: number; lng?: number } | undefined> => {
    const query = (title || "").trim();
    if (!query) return undefined;
    const endpoints = [
      `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
    ];
    for (const url of endpoints) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const data = await resp.json();
        const resolvedTitle = (data?.title || query).toString().trim() || query;
        // Skip wiki namespace/meta pages like "Vorlage:*", "Kategorie:*", etc.
        if (resolvedTitle.includes(":")) continue;
        const extract = cleanWikipediaText((data?.extract || "").toString().trim());
        if (extract) {
          const rawLat = data?.coordinates?.lat;
          const rawLng = data?.coordinates?.lon;
          const lat = typeof rawLat === "number" ? rawLat : undefined;
          const lng = typeof rawLng === "number" ? rawLng : undefined;
          return {
            title: resolvedTitle,
            extract,
            thumbnail: (data?.thumbnail?.source || "").toString().trim() || undefined,
            lat,
            lng,
          };
        }
      } catch {
        // try next endpoint
      }
    }
    return undefined;
  }, [cleanWikipediaText]);

  const fetchWikipediaIntroExtract = useCallback(async (title: string): Promise<string | undefined> => {
    const query = (title || "").trim();
    if (!query) return undefined;
    const endpoints = [
      `https://de.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exintro=1&redirects=1&titles=${encodeURIComponent(query)}&format=json&origin=*`,
      `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exintro=1&redirects=1&titles=${encodeURIComponent(query)}&format=json&origin=*`,
    ];
    for (const url of endpoints) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const data = await resp.json();
        const pages = data?.query?.pages;
        if (!pages || typeof pages !== "object") continue;
        const pageEntries = Object.values(pages) as Array<{ extract?: unknown }>;
        const extract = cleanWikipediaText((pageEntries.find((p) => typeof p?.extract === "string")?.extract || "")
          .toString()
          .replace(/\s+/g, " ")
          .trim());
        if (extract) return extract;
      } catch {
        // try next endpoint
      }
    }
    return undefined;
  }, [cleanWikipediaText]);

  const clampWikiText = useCallback((value: string, maxLength = 900): string => {
    const normalized = (value || "").replace(/\s+/g, " ").trim();
    if (normalized.length <= maxLength) return normalized;
    const clipped = normalized.slice(0, maxLength);
    const lastDot = clipped.lastIndexOf(".");
    if (lastDot > Math.floor(maxLength * 0.55)) return clipped.slice(0, lastDot + 1).trim();
    return `${clipped.trim()}...`;
  }, []);

  const fetchWikipediaSummaryByTitle = useCallback(async (title: string): Promise<string | undefined> => {
    const page = await fetchWikipediaPageByTitle(title);
    if (!page?.extract) return undefined;
    const intro = await fetchWikipediaIntroExtract(page.title || title);
    const bestText = (intro && intro.length > page.extract.length) ? intro : page.extract;
    const cleaned = cleanWikipediaText(bestText);
    if (!cleaned || isWeakWikipediaText(cleaned)) return undefined;
    return clampWikiText(cleaned, 900);
  }, [fetchWikipediaPageByTitle, fetchWikipediaIntroExtract, clampWikiText, cleanWikipediaText, isWeakWikipediaText]);

  const normalizeWikiKey = useCallback((value: string): string => {
    return (value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }, []);

  const fetchWikipediaOpenSearchTitles = useCallback(async (query: string): Promise<string[]> => {
    const q = (query || "").trim();
    if (!q) return [];
    const endpoints = [
      `https://de.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=8&namespace=0&format=json&origin=*`,
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=8&namespace=0&format=json&origin=*`,
    ];
    const allTitles: string[] = [];
    for (const url of endpoints) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const data = await resp.json();
        const titles = Array.isArray(data?.[1]) ? data[1].map((t: unknown) => String(t || "").trim()) : [];
        for (const title of titles) {
          if (title && !allTitles.includes(title)) allTitles.push(title);
        }
      } catch {
        // try next endpoint
      }
    }
    return allTitles;
  }, []);

  const pickBestWikipediaTitle = useCallback((query: string, titles: string[]): string | undefined => {
    if (!titles.length) return undefined;
    const nq = normalizeWikiKey(query);
    if (!nq) return titles[0];

    const qTokens = nq.split(" ").filter(Boolean);
    let bestTitle: string | undefined;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const title of titles) {
      const nt = normalizeWikiKey(title);
      if (!nt) continue;
      const tTokens = nt.split(" ").filter(Boolean);
      const shared = tTokens.filter((t) => qTokens.includes(t)).length;
      const tokenRatio = qTokens.length ? shared / qTokens.length : 0;
      const starts = nt.startsWith(nq) ? 1 : 0;
      const contains = nt.includes(nq) ? 1 : 0;
      const reverseContains = nq.includes(nt) ? 1 : 0;
      const lenPenalty = Math.abs(nt.length - nq.length);
      const score =
        (nt === nq ? 200 : 0) +
        contains * 80 +
        reverseContains * 40 +
        starts * 20 +
        tokenRatio * 70 -
        lenPenalty;
      if (score > bestScore) {
        bestScore = score;
        bestTitle = title;
      }
    }
    return bestTitle ?? titles[0];
  }, [normalizeWikiKey]);

  const fetchWikipediaTitleByCoords = useCallback(async (lat?: number, lng?: number): Promise<string | undefined> => {
    if (typeof lat !== "number" || typeof lng !== "number") return undefined;
    const endpoints = [
      `https://de.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}%7C${lng}&gsradius=10000&gslimit=1&format=json&origin=*`,
      `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}%7C${lng}&gsradius=10000&gslimit=1&format=json&origin=*`,
    ];
    for (const url of endpoints) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const data = await resp.json();
        const title = (data?.query?.geosearch?.[0]?.title || "").toString().trim();
        if (title) return title;
      } catch {
        // try next endpoint
      }
    }
    return undefined;
  }, []);

  const fetchWikipediaSummaryForPoi = useCallback(
    async (name: string, lat?: number, lng?: number): Promise<string | undefined> => {
      const byName = await fetchWikipediaSummaryByTitle(name);
      if (byName) return byName;
      const openSearchTitles = await fetchWikipediaOpenSearchTitles(name);
      const bestOpenSearchTitle = pickBestWikipediaTitle(name, openSearchTitles);
      if (bestOpenSearchTitle) {
        const byOpenSearchTitle = await fetchWikipediaSummaryByTitle(bestOpenSearchTitle);
        if (byOpenSearchTitle) return byOpenSearchTitle;
      }
      const nearbyTitle = await fetchWikipediaTitleByCoords(lat, lng);
      if (!nearbyTitle) return undefined;
      return await fetchWikipediaSummaryByTitle(nearbyTitle);
    },
    [fetchWikipediaSummaryByTitle, fetchWikipediaOpenSearchTitles, pickBestWikipediaTitle, fetchWikipediaTitleByCoords]
  );

  const enrichAiPoisWithWikipedia = useCallback(async (items: AiPoiSuggestion[]): Promise<AiPoiSuggestion[]> => {
    return await Promise.all(
      items.map(async (poi) => {
        const wikiText = await fetchWikipediaSummaryForPoi(poi.name, poi.lat, poi.lng);
        return wikiText ? { ...poi, description: wikiText } : poi;
      })
    );
  }, [fetchWikipediaSummaryForPoi]);

  const loadAiPoisForEtappe = useCallback(async (eIdx: number) => {
    if (etappen.length === 0) return;
    setAiLoadingEtappe(eIdx);
    setAiPoisError(null);
    try {
      const rawResults = await fetchAiPois({
        etappes: etappen,
        interests: trip.interests || [],
        travelMode: trip.travelMode,
        stops: trip.stops,
        etappeIndex: eIdx,
      });
      const results = await enrichAiPoisWithWikipedia(rawResults);
      setAiPois((prev) => [...prev.filter((p) => p.etappeIndex !== eIdx), ...results]);

      if (window.google?.maps?.places) {
        const { fetchPlacePhoto } = await import("@/lib/poiService");
        for (const poi of results) {
          if (!aiPoiPhotos[poi.name]) {
            fetchPlacePhoto(poi.name).then((url) => {
              if (url) setAiPoiPhotos((prev) => ({ ...prev, [poi.name]: url }));
            });
          }
        }
      }
    } catch (err) {
      setAiPoisError(err instanceof Error ? err.message : "KI-Empfehlungen konnten nicht geladen werden");
    } finally {
      setAiLoadingEtappe(null);
    }
  }, [etappen, trip.interests, trip.travelMode, trip.stops, aiPoiPhotos, enrichAiPoisWithWikipedia]);

  const loadAllAiPois = useCallback(async () => {
    if (etappen.length === 0) return;
    setAiPoisLoading(true);
    setAiPoisError(null);
    setAiPois([]);
    try {
      const rawResults = await fetchAiPois({
        etappes: etappen,
        interests: trip.interests || [],
        travelMode: trip.travelMode,
        stops: trip.stops,
      });
      const results = await enrichAiPoisWithWikipedia(rawResults);
      setAiPois(results);

      if (window.google?.maps?.places) {
        const { fetchPlacePhoto } = await import("@/lib/poiService");
        for (const poi of results) {
          fetchPlacePhoto(poi.name).then((url) => {
            if (url) setAiPoiPhotos((prev) => ({ ...prev, [poi.name]: url }));
          });
        }
      }
    } catch (err) {
      setAiPoisError(err instanceof Error ? err.message : "KI-Empfehlungen konnten nicht geladen werden");
      setAiPois([]);
    } finally {
      setAiPoisLoading(false);
    }
  }, [etappen, trip.interests, trip.travelMode, trip.stops, enrichAiPoisWithWikipedia]);

  useEffect(() => {
    if (activeTab === "poi" && poiScope !== "ai") {
      loadPOIs(poiScope);
    }
  }, [activeTab, poiScope, loadPOIs]);

  useEffect(() => {
    if (activeTab !== "report" && openPhotoPickerEtappe != null) {
      setOpenPhotoPickerEtappe(null);
    }
  }, [activeTab, openPhotoPickerEtappe]);

  const isInBucketList = (name: string) =>
    trip.bucketList.some((b) => b.name === name);

  const isInCurrentRoute = useCallback(
    (name: string) => {
      const key = normalizePlaceKey(name);
      return currentRouteStops.some((s) => normalizePlaceKey(s.name) === key);
    },
    [currentRouteStops]
  );

  const aiStopActionKey = useCallback((etappeIndex: number, poiName: string) => {
    return `${etappeIndex}:${normalizePlaceKey(poiName)}`;
  }, []);
  const customStopActionKey = useCallback((etappeIndex: number, poiName: string) => {
    return `${etappeIndex}:${normalizePlaceKey(poiName)}`;
  }, []);

  const isDiscoveryLinkedInCurrentRoute = useCallback(
    (etappeIndex: number, poiName: string) => {
      const key = normalizePlaceKey(poiName);
      return currentRouteStops.some(
        (s) =>
          s.type === "stop" &&
          normalizePlaceKey(s.name) === key &&
          !!s.discoverySource &&
          s.discoveryEtappeIndex === etappeIndex
      );
    },
    [currentRouteStops]
  );

  const addAiPoiToRoute = useCallback(
    async (poi: AiPoiSuggestion, etappeIndex: number) => {
      const actionKey = aiStopActionKey(etappeIndex, poi.name);
      if (addingAiStops[actionKey] || isInCurrentRoute(poi.name)) return;
      setAddingAiStops((prev) => ({ ...prev, [actionKey]: true }));
      try {
        let photoUrl: string | undefined = aiPoiPhotos[poi.name];
        let photoDataUrl: string | undefined;
        if (!photoUrl && window.google?.maps?.places) {
          try {
            const { fetchPlacePhoto } = await import("@/lib/poiService");
            photoUrl = await fetchPlacePhoto(poi.name) || undefined;
            if (photoUrl) {
              setAiPoiPhotos((prev) => ({ ...prev, [poi.name]: photoUrl as string }));
            }
          } catch {
            // keep going without photo
          }
        }
        if (photoUrl) {
          photoDataUrl = await imageUrlToPrintableDataUrl(photoUrl);
        }
        const inserted = await addStopSmart(poi.name, poi.lat, poi.lng, {
          discoverySource: "ai",
          discoveryEtappeIndex: etappeIndex,
          discoveryCategory: poi.category,
          discoveryDescription: poi.description,
          discoveryPhotoUrl: photoUrl,
          discoveryPhotoDataUrl: photoDataUrl,
          discoveryAddedAt: new Date().toISOString(),
        });
        if (inserted) {
          setAddedAiStops((prev) => ({ ...prev, [actionKey]: true }));
        }
      } finally {
        setAddingAiStops((prev) => {
          const next = { ...prev };
          delete next[actionKey];
          return next;
        });
      }
    },
    [aiPoiPhotos, aiStopActionKey, addStopSmart, addingAiStops, isInCurrentRoute]
  );

  const addAiPoiToBucket = useCallback(
    (poi: AiPoiSuggestion) => {
      if (isInBucketList(poi.name)) return;
      addToBucketList({
        name: poi.name,
        category: poi.category,
        rating: 0,
        description: poi.description,
      });
    },
    [addToBucketList, isInBucketList]
  );

  const searchCustomDiscovery = useCallback(async (etappeIndex: number) => {
    const query = (customStopQuery[etappeIndex] || "").trim();
    if (!query) return;
    setCustomStopLoading((prev) => ({ ...prev, [etappeIndex]: true }));
    try {
      let pageTitle = query;
      let description = "";
      let photoUrl: string | undefined;
      let lat: number | undefined;
      let lng: number | undefined;

      const exactPage = await fetchWikipediaPageByTitle(query);
      if (exactPage) {
        pageTitle = exactPage.title || query;
        description = (await fetchWikipediaSummaryByTitle(pageTitle)) || exactPage.extract || "";
        photoUrl = exactPage.thumbnail;
        lat = exactPage.lat;
        lng = exactPage.lng;
      }

      if (!description || isWeakWikipediaText(description)) {
        const titles = await fetchWikipediaOpenSearchTitles(query);
        const bestTitle = pickBestWikipediaTitle(query, titles);
        if (bestTitle) {
          const bestPage = await fetchWikipediaPageByTitle(bestTitle);
          if (bestPage) {
            pageTitle = bestPage.title || bestTitle;
            description = (await fetchWikipediaSummaryByTitle(pageTitle)) || bestPage.extract || "";
            photoUrl = bestPage.thumbnail;
            lat = bestPage.lat;
            lng = bestPage.lng;
          } else {
            pageTitle = bestTitle;
          }
        }
      }

      if (!photoUrl && window.google?.maps?.places) {
        try {
          const { fetchPlacePhoto } = await import("@/lib/poiService");
          photoUrl = (await fetchPlacePhoto(pageTitle || query)) || undefined;
        } catch {
          // keep fallback without photo
        }
      }

      if (!description || isWeakWikipediaText(description)) {
        try {
          const aiResp = await fetch("/api/place-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: pageTitle || query }),
          });
          if (aiResp.ok) {
            const aiData = await aiResp.json();
            description = cleanWikipediaText((aiData?.summary || "").toString().trim());
          }
        } catch {
          // keep static fallback below
        }
      }

      setCustomStopResult((prev) => ({
        ...prev,
        [etappeIndex]: {
          name: pageTitle || query,
          category: "Eigener Stopp",
          description: description || `${query} ist ein interessanter Ort entlang deiner Reiseetappe.`,
          photoUrl,
          lat,
          lng,
        },
      }));
    } catch {
      setCustomStopResult((prev) => ({
        ...prev,
        [etappeIndex]: {
          name: query,
          category: "Eigener Stopp",
          description: `${query} ist ein interessanter Ort entlang deiner Reiseetappe.`,
        },
      }));
    } finally {
      setCustomStopLoading((prev) => ({ ...prev, [etappeIndex]: false }));
    }
  }, [customStopQuery, fetchWikipediaPageByTitle, fetchWikipediaOpenSearchTitles, pickBestWikipediaTitle, fetchWikipediaSummaryByTitle, isWeakWikipediaText, cleanWikipediaText]);

  const addCustomDiscoveryToRoute = useCallback(async (etappeIndex: number) => {
    const result = customStopResult[etappeIndex];
    if (!result) return;
    const actionKey = customStopActionKey(etappeIndex, result.name);
    if (addingCustomStops[actionKey]) return;
    if (isDiscoveryLinkedInCurrentRoute(etappeIndex, result.name)) return;
    setAddingCustomStops((prev) => ({ ...prev, [actionKey]: true }));
    let lat = result.lat;
    let lng = result.lng;
    try {
      if (lat == null || lng == null) {
        const geo = await geocodeStop({ id: "tmp-custom-stop", name: result.name, type: "stop" });
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
        }
      }
      const wantedKey = normalizePlaceKey(result.name);
      const existingIdx = currentRouteStops.findIndex(
        (s) => s.type === "stop" && normalizePlaceKey(s.name) === wantedKey
      );
      const photoDataUrl = result.photoUrl ? await imageUrlToPrintableDataUrl(result.photoUrl) : undefined;
      if (existingIdx >= 0) {
        const updatedStops = currentRouteStops.map((s, idx) =>
          idx !== existingIdx
            ? s
            : {
                ...s,
                discoverySource: "custom" as const,
                discoveryEtappeIndex: etappeIndex,
                discoveryCategory: result.category,
                discoveryDescription: result.description,
                discoveryPhotoUrl: result.photoUrl,
                discoveryPhotoDataUrl: photoDataUrl,
                discoveryAddedAt: new Date().toISOString(),
              }
        );
        updateCurrentStops(updatedStops);
        return;
      }
      const inserted = await addStopSmart(result.name, lat, lng, {
        discoverySource: "custom",
        discoveryEtappeIndex: etappeIndex,
        discoveryCategory: result.category,
        discoveryDescription: result.description,
        discoveryPhotoUrl: result.photoUrl,
        discoveryPhotoDataUrl: photoDataUrl,
        discoveryAddedAt: new Date().toISOString(),
      });
      if (!inserted && !isInCurrentRoute(result.name)) return;
    } finally {
      setAddingCustomStops((prev) => {
        const next = { ...prev };
        delete next[actionKey];
        return next;
      });
    }
  }, [
    addStopSmart,
    customStopActionKey,
    customStopResult,
    geocodeStop,
    addingCustomStops,
    isDiscoveryLinkedInCurrentRoute,
    currentRouteStops,
    updateCurrentStops,
  ]);

  const getSelectedPdfPhotosForEtappe = useCallback(
    (etappeIndex: number): string[] => {
      return trip.pdfPhotosByEtappe?.[String(etappeIndex)] || [];
    },
    [trip.pdfPhotosByEtappe]
  );

  const getPdfPhotoLibraryForEtappe = useCallback(
    (etappeIndex: number): string[] => {
      const key = String(etappeIndex);
      const lib = trip.pdfPhotoLibraryByEtappe?.[key] || [];
      const selected = trip.pdfPhotosByEtappe?.[key] || [];
      return Array.from(new Set([...lib, ...selected]));
    },
    [trip.pdfPhotoLibraryByEtappe, trip.pdfPhotosByEtappe]
  );

  useEffect(() => {
    const allUrls = Array.from(
      new Set([
        ...Object.values(trip.pdfPhotosByEtappe || {}).flat(),
        ...Object.values(trip.pdfPhotoLibraryByEtappe || {}).flat(),
      ])
    ).filter(Boolean);
    const missing = allUrls.filter((url) => !photoAspectByUrl[url]);
    if (missing.length === 0) return;
    let cancelled = false;
    missing.forEach((url) => {
      const img = new Image();
      img.onload = () => {
        if (cancelled || !img.naturalWidth || !img.naturalHeight) return;
        const aspect = img.naturalWidth / img.naturalHeight;
        setPhotoAspectByUrl((prev) => (prev[url] ? prev : { ...prev, [url]: aspect }));
      };
      img.onerror = () => {};
      img.src = url;
    });
    return () => {
      cancelled = true;
    };
  }, [photoAspectByUrl, trip.pdfPhotoLibraryByEtappe, trip.pdfPhotosByEtappe]);

  const togglePdfPhotoForEtappe = useCallback(
    (etappeIndex: number, photoUrl: string) => {
      updateTrip((prev) => {
        const key = String(etappeIndex);
        const existing = prev.pdfPhotosByEtappe?.[key] || [];
        const nextList = existing.includes(photoUrl)
          ? existing.filter((u) => u !== photoUrl)
          : [...existing, photoUrl];
        return {
          ...prev,
          pdfPhotosByEtappe: {
            ...(prev.pdfPhotosByEtappe || {}),
            [key]: nextList,
          },
        };
      });
    },
    [updateTrip]
  );

  const setPdfPhotoAtSlot = useCallback(
    (etappeIndex: number, slotIndex: number, photoUrl: string) => {
      updateTrip((prev) => {
        const key = String(etappeIndex);
        const existing = [...(prev.pdfPhotosByEtappe?.[key] || [])];
        const without = existing.filter((u) => u !== photoUrl);
        const insertAt = Math.max(0, Math.min(slotIndex, without.length));
        without.splice(insertAt, 0, photoUrl);
        const nextLibrary = Array.from(new Set([...(prev.pdfPhotoLibraryByEtappe?.[key] || []), photoUrl]));
        return {
          ...prev,
          pdfPhotosByEtappe: {
            ...(prev.pdfPhotosByEtappe || {}),
            [key]: without,
          },
          pdfPhotoLibraryByEtappe: {
            ...(prev.pdfPhotoLibraryByEtappe || {}),
            [key]: nextLibrary,
          },
        };
      });
    },
    [updateTrip]
  );

  const movePdfPhotoSlot = useCallback(
    (etappeIndex: number, fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      updateTrip((prev) => {
        const key = String(etappeIndex);
        const arr = [...(prev.pdfPhotosByEtappe?.[key] || [])];
        if (fromIndex < 0 || fromIndex >= arr.length) return prev;
        const [item] = arr.splice(fromIndex, 1);
        const boundedTarget = Math.max(0, Math.min(toIndex, arr.length));
        arr.splice(boundedTarget, 0, item);
        return {
          ...prev,
          pdfPhotosByEtappe: {
            ...(prev.pdfPhotosByEtappe || {}),
            [key]: arr,
          },
        };
      });
    },
    [updateTrip]
  );

  const setPdfPhotoPlacementForEtappe = useCallback(
    (etappeIndex: number, placement: PdfPhotoPlacement) => {
      updateTrip((prev) => ({
        ...prev,
        pdfPhotoPlacementByEtappe: {
          ...(prev.pdfPhotoPlacementByEtappe || {}),
          [String(etappeIndex)]: placement,
        },
      }));
    },
    [updateTrip]
  );

  const setPdfPhotoLayoutForEtappe = useCallback(
    (etappeIndex: number, layout: PdfPhotoLayout) => {
      updateTrip((prev) => ({
        ...prev,
        pdfPhotoLayoutByEtappe: {
          ...(prev.pdfPhotoLayoutByEtappe || {}),
          [String(etappeIndex)]: layout,
        },
      }));
    },
    [updateTrip]
  );

  const setPdfPhotoPagesForEtappe = useCallback(
    (etappeIndex: number, pageCount: number) => {
      const safe = Math.max(1, Math.min(12, pageCount || 1));
      updateTrip((prev) => ({
        ...prev,
        pdfPhotoPagesByEtappe: {
          ...(prev.pdfPhotoPagesByEtappe || {}),
          [String(etappeIndex)]: safe,
        },
      }));
    },
    [updateTrip]
  );

  const addPickedPdfPhotosToEtappe = useCallback(
    async (etappeIndex: number, files: FileList | null) => {
      if (!files || files.length === 0) return;
      const picked = Array.from(files).slice(0, 20);
      const encoded = (
        await Promise.all(
          picked.map(async (file) => {
            if (!file.type.startsWith("image/")) return undefined;
            return await fileToPrintableDataUrl(file);
          })
        )
      ).filter((u): u is string => !!u);
      if (encoded.length === 0) return;
      updateTrip((prev) => {
        const key = String(etappeIndex);
        const existing = prev.pdfPhotosByEtappe?.[key] || [];
        const library = prev.pdfPhotoLibraryByEtappe?.[key] || [];
        const mergedLibrary = Array.from(new Set([...library, ...encoded]));
        return {
          ...prev,
          pdfPhotosByEtappe: {
            ...(prev.pdfPhotosByEtappe || {}),
            [key]: Array.from(new Set([...existing, ...encoded])),
          },
          pdfPhotoLibraryByEtappe: {
            ...(prev.pdfPhotoLibraryByEtappe || {}),
            [key]: mergedLibrary,
          },
        };
      });
    },
    [updateTrip]
  );

  const setPdfCoverStyle = useCallback(
    (style: "background" | "belowTitle") => {
      updateTrip((prev) => ({ ...prev, pdfCoverPhotoStyle: style }));
    },
    [updateTrip]
  );

  const setPdfCoverPhoto = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const first = Array.from(files)[0];
      if (!first?.type?.startsWith("image/")) return;
      const encoded = await fileToPrintableDataUrl(first);
      if (!encoded) return;
      updateTrip((prev) => ({ ...prev, pdfCoverPhotoDataUrl: encoded }));
    },
    [updateTrip]
  );

  const clearPdfCoverPhoto = useCallback(() => {
    updateTrip((prev) => ({ ...prev, pdfCoverPhotoDataUrl: undefined }));
  }, [updateTrip]);

  const getFirstPageSlotCount = useCallback((layout: PdfPhotoLayout): number => {
    if (layout === "onePerPageMax") return 1;
    if (layout === "onePortraitTopHalf" || layout === "onePortraitBottomHalf") return 1;
    if (layout === "twoPortraitSideBySide") return 2;
    if (layout === "twoPortraitStacked" || layout === "twoMixedStacked") return 2;
    if (layout === "threePortraitOneLandscape") return 4;
    return 6;
  }, []);

  const getRecommendedPdfLayouts = useCallback(
    (photoUrls: string[]): PdfPhotoLayout[] => {
      const count = photoUrls.length;
      if (count === 0) return ["auto", "smartPages", "grid"];
      const portraitCount = photoUrls.reduce((sum, url) => {
        const aspect = photoAspectByUrl[url];
        return sum + (aspect ? (aspect < 1 ? 1 : 0) : 1);
      }, 0);
      const landscapeCount = Math.max(0, count - portraitCount);

      if (count === 1) {
        return ["onePerPageMax", "onePortraitTopHalf", "onePortraitBottomHalf", "smartPages"];
      }
      if (count === 2 && landscapeCount === 0) {
        return ["twoPortraitSideBySide", "twoPortraitStacked", "onePerPageMax", "smartPages"];
      }
      if (count === 2 && landscapeCount > 0) {
        return ["twoMixedStacked", "twoPortraitStacked", "onePerPageMax", "smartPages"];
      }
      if (count >= 6 && landscapeCount === 0) {
        return ["sixPortraitGrid", "grid", "smartPages", "onePerPageMax"];
      }
      if (count >= 4 && portraitCount >= 3 && landscapeCount >= 1) {
        return ["threePortraitOneLandscape", "grid", "smartPages", "onePerPageMax"];
      }
      return ["grid", "smartPages", "twoPortraitSideBySide", "onePerPageMax"];
    },
    [photoAspectByUrl]
  );

  const assignPhotoToEtappeSlot = useCallback(
    (etappeIndex: number, photoUrl: string, preferredSlot?: number) => {
      const selected = getSelectedPdfPhotosForEtappe(etappeIndex);
      const layoutPref = trip.pdfPhotoLayoutByEtappe?.[String(etappeIndex)] || "auto";
      const effectiveLayout = layoutPref === "auto" ? (getRecommendedPdfLayouts(selected)[0] || "grid") : layoutPref;
      const slotCount = getFirstPageSlotCount(effectiveLayout);
      const firstEmpty = selected.length < slotCount ? selected.length : -1;
      const target = typeof preferredSlot === "number"
        ? preferredSlot
        : firstEmpty >= 0
          ? firstEmpty
          : selected.length;
      setPdfPhotoAtSlot(etappeIndex, target, photoUrl);
    },
    [getFirstPageSlotCount, getRecommendedPdfLayouts, getSelectedPdfPhotosForEtappe, setPdfPhotoAtSlot, trip.pdfPhotoLayoutByEtappe]
  );

  const getStopCoordsByName = useCallback(
    (name: string): { lat: number; lng: number } | null => {
      const key = normalizePlaceKey(name);
      const stop = trip.stops.find((s) => {
        const stopKey = normalizePlaceKey(s.name);
        return stopKey === key || stopKey.includes(key) || key.includes(stopKey);
      });
      if (stop?.lat != null && stop.lng != null) return { lat: stop.lat, lng: stop.lng };
      return null;
    },
    [trip.stops]
  );

  useEffect(() => {
    if (openEtappeMapIndex == null || !autocompleteReady || !window.google?.maps || !etappeMapRef.current) return;

    const etappe = etappen[openEtappeMapIndex];
    if (!etappe) return;

    const map = new google.maps.Map(etappeMapRef.current, {
      center: { lat: 47.3769, lng: 8.5417 },
      zoom: 7,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const infoWindow = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();
    const pointsForLine: google.maps.LatLngLiteral[] = [];
    const etappePois = aiPois.filter((p) => p.etappeIndex === openEtappeMapIndex && p.lat != null && p.lng != null);

    const clearMapElements = () => {
      etappeMapMarkersRef.current.forEach((m) => m.setMap(null));
      etappeMapMarkersRef.current = [];
      if (etappeMapLineRef.current) {
        etappeMapLineRef.current.setMap(null);
        etappeMapLineRef.current = null;
      }
      if (etappeMapRouteRendererRef.current) {
        etappeMapRouteRendererRef.current.setMap(null);
        etappeMapRouteRendererRef.current = null;
      }
    };

    clearMapElements();

    const fromCoords = getStopCoordsByName(etappe.from);
    const toCoords = getStopCoordsByName(etappe.to);
    if (fromCoords) {
      pointsForLine.push(fromCoords);
      bounds.extend(fromCoords);
      const marker = new google.maps.Marker({
        map,
        position: fromCoords,
        label: { text: "A", color: "white", fontWeight: "700" },
        title: `Start: ${etappe.from}`,
      });
      etappeMapMarkersRef.current.push(marker);
    }
    if (toCoords) {
      pointsForLine.push(toCoords);
      bounds.extend(toCoords);
      const marker = new google.maps.Marker({
        map,
        position: toCoords,
        label: { text: "B", color: "white", fontWeight: "700" },
        title: `Ziel: ${etappe.to}`,
      });
      etappeMapMarkersRef.current.push(marker);
    }

    etappePois.forEach((poi, idx) => {
      if (poi.lat == null || poi.lng == null) return;
      const poiInRoute = isInCurrentRoute(poi.name);
      const pos = { lat: poi.lat, lng: poi.lng };
      bounds.extend(pos);
      const marker = new google.maps.Marker({
        map,
        position: pos,
        label: { text: String(idx + 1), color: "white", fontWeight: "700" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 11,
          fillColor: poiInRoute ? "#16a34a" : "#8b5cf6",
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
        },
        title: poi.name,
      });
      marker.addListener("click", () => {
        const safeName = poi.name.replace(/[^\w-]/g, "_");
        const addBtnId = `etappe-map-add-${openEtappeMapIndex}-${safeName}`;
        const bucketBtnId = `etappe-map-bucket-${openEtappeMapIndex}-${safeName}`;
        infoWindow.setContent(
          `<div style="font-family:system-ui;max-width:260px;padding:4px 2px">
            <div style="font-size:13px;font-weight:700;color:#111827">${poi.name}</div>
            <div style="font-size:11px;color:#6b7280;margin-top:3px">${poi.category}</div>
            <div style="font-size:12px;color:#374151;margin-top:7px;line-height:1.45">${poi.description}</div>
            <div style="display:flex;gap:8px;margin-top:10px">
              <button id="${addBtnId}" ${poiInRoute ? "disabled" : ""} style="border:none;background:${poiInRoute ? "#10b981" : "#2563eb"};color:white;padding:6px 10px;border-radius:8px;font-size:11px;cursor:${poiInRoute ? "default" : "pointer"}">${poiInRoute ? "In Route" : "Zur Route"}</button>
              <button id="${bucketBtnId}" style="border:1px solid #d1d5db;background:white;color:#374151;padding:6px 10px;border-radius:8px;font-size:11px;cursor:pointer">Bucket List</button>
            </div>
          </div>`
        );
        infoWindow.open(map, marker);
        google.maps.event.addListenerOnce(infoWindow, "domready", () => {
          const addBtn = document.getElementById(addBtnId);
          if (!poiInRoute) {
            addBtn?.addEventListener("click", () => {
              void addAiPoiToRoute(poi, openEtappeMapIndex);
              infoWindow.close();
            });
          }
          const bucketBtn = document.getElementById(bucketBtnId);
          bucketBtn?.addEventListener("click", () => {
            addAiPoiToBucket(poi);
            infoWindow.close();
          });
        });
      });
      etappeMapMarkersRef.current.push(marker);
    });

    const fitMapToBounds = () => {
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 64);
      }
    };

    const drawFallbackLine = () => {
      if (pointsForLine.length < 2) return;
      etappeMapLineRef.current = new google.maps.Polyline({
        map,
        path: pointsForLine,
        geodesic: true,
        strokeColor: "#6366f1",
        strokeOpacity: 0.9,
        strokeWeight: 4,
      });
    };

    const drawEtappeRoute = async () => {
      if (!fromCoords || !toCoords) {
        drawFallbackLine();
        fitMapToBounds();
        return;
      }
      try {
        const service = new google.maps.DirectionsService();
        const viaNames = etappe.legs.slice(0, -1).map((l) => l.to);
        const waypoints = viaNames
          .map((name) => getStopCoordsByName(name))
          .filter((p): p is { lat: number; lng: number } => !!p)
          .map((p) => ({ location: p, stopover: true }));

        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          service.route(
            {
              origin: fromCoords,
              destination: toCoords,
              waypoints,
              travelMode: google.maps.TravelMode.DRIVING,
              optimizeWaypoints: false,
            },
            (res, status) => {
              if (status === google.maps.DirectionsStatus.OK && res) resolve(res);
              else reject(status);
            }
          );
        });

        etappeMapRouteRendererRef.current = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: {
            strokeColor: "#6366f1",
            strokeOpacity: 0.9,
            strokeWeight: 4,
          },
        });
        etappeMapRouteRendererRef.current.setDirections(result);
        const routePath = result.routes[0]?.overview_path || [];
        routePath.forEach((pt) => bounds.extend(pt));
      } catch {
        drawFallbackLine();
      } finally {
        fitMapToBounds();
      }
    };

    void drawEtappeRoute();

    return () => {
      clearMapElements();
      infoWindow.close();
    };
  }, [
    aiPois,
    addAiPoiToBucket,
    addAiPoiToRoute,
    autocompleteReady,
    etappen,
    getStopCoordsByName,
    isInCurrentRoute,
    openEtappeMapIndex,
  ]);

  const getAiDiscoveriesForEtappe = useCallback(
    (etappeIndex: number) => {
      const seen = new Set<string>();
      return trip.stops.filter((s) => {
        if (s.type !== "stop" || !s.discoverySource || s.discoveryEtappeIndex !== etappeIndex) return false;
        const key = normalizePlaceKey(s.name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
    [trip.stops]
  );

  const handleDownloadPDF = async () => {
    // Open window immediately (in click context) to avoid popup blocker
    const pdfWindow = window.open("", "_blank");
    if (pdfWindow) {
      pdfWindow.document.write("<html><head><title>PDF wird erstellt…</title></head><body style='display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#555'><p>PDF wird erstellt…</p></body></html>");
    }
    setPdfGenerating(true);
    setPdfProgress(0);
    setPdfProgressMsg("Starte…");
    try {
      const blob = await generateTripPDF({
        trip,
        etappen,
        routeInfo: routeInfo ? { distance: routeInfo.distance, duration: routeInfo.duration, stops: routeInfo.stops } : undefined,
        googleApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "AIzaSyDTcV42T-ZkriZOB8RtNZMtGR8gZq3Izi0",
        onProgress: (pct, msg) => {
          setPdfProgress(pct);
          setPdfProgressMsg(msg);
        },
      });
      const url = URL.createObjectURL(blob);
      if (pdfWindow) {
        pdfWindow.location.href = url;
      } else {
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      pdfWindow?.close();
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* PDF Generation Overlay */}
      {pdfGenerating && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF wird erstellt…</h3>
            <p className="text-sm text-gray-500 mb-4">{pdfProgressMsg}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${pdfProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">{pdfProgress}%</p>
          </div>
        </div>
      )}

      {openEtappeMapIndex != null && etappen[openEtappeMapIndex] && (
        <div className="fixed inset-0 z-[95] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/80 font-medium">
                  Etappe {openEtappeMapIndex + 1} Kartenansicht
                </p>
                <p className="text-sm font-semibold">
                  {etappen[openEtappeMapIndex].from} → {etappen[openEtappeMapIndex].to}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenEtappeMapIndex(null)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
                title="Karte schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-gray-50 border-b border-gray-200 text-xs text-gray-600">
              Klicke auf ein Highlight für Details und Aktionen (Zur Route / Bucket List).
            </div>
            <div ref={etappeMapRef} className="h-[560px] w-full" />
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="sticky top-0 z-50 relative bg-gradient-to-r from-blue-600 to-cyan-500 pt-5 pb-0">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 top-full h-5 bg-gray-50 shadow-[0_10px_14px_-10px_rgba(15,23,42,0.5)]"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {showTripNameEditor ? (
                  <input
                    ref={tripNameInputRef}
                    type="text"
                    value={trip.name === "Neue Reise" ? "" : trip.name}
                    onChange={(e) => updateTrip({ name: e.target.value })}
                    onBlur={() => {
                      if (!trip.name?.trim()) updateTrip({ name: "Neue Reise" });
                      setIsEditingTripName(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.currentTarget as HTMLInputElement).blur();
                      }
                    }}
                    placeholder="Neue Reise"
                    className="w-[320px] max-w-[70vw] bg-white/10 border border-white/35 rounded-xl px-4 py-2 text-2xl font-bold text-white placeholder:text-white/65 focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">
                      {trip.name}
                    </h1>
                    <button
                      type="button"
                      onClick={() => setIsEditingTripName(true)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/25 text-white transition-colors"
                      title="Reisename bearbeiten"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {(() => {
                const start = trip.stops.find((s) => s.type === "start")?.name;
                const end = trip.stops.find((s) => s.type === "end")?.name;
                const dateStr = trip.startDate && trip.endDate
                  ? `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`
                  : "";
                const routeStr = start && end ? `${start} → ${end}` : "";
                const line = [routeStr, dateStr].filter(Boolean).join(" · ");
                return line ? <p className="text-blue-100 text-sm">{line}</p> : null;
              })()}
            </div>

            <div className="flex items-center gap-2">
              {/* Auto-Save Status */}
              {saveStatus === "saved" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-green-100 bg-green-500/20 px-3 py-1.5 rounded-lg">
                  <Check className="w-3.5 h-3.5" />
                  Gespeichert
                </span>
              )}

              <button
                onClick={() => setShowTips((v) => !v)}
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all border border-white/20"
                title="Tipps ein-/ausblenden"
              >
                <Sparkles className="w-4 h-4" />
                {showTips ? "Tipps ausblenden" : "Tipps einblenden"}
              </button>
              {hasUnsavedChanges && saveStatus === "idle" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-blue-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
                  Wird gespeichert…
                </span>
              )}

              {/* PDF Download */}
              <button
                onClick={handleDownloadPDF}
                disabled={pdfGenerating}
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all border border-white/20 disabled:opacity-50"
                title="Reise als PDF herunterladen"
              >
                {pdfGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                <span className="hidden sm:inline">PDF</span>
              </button>

              {/* Trip List Toggle */}
              <button
                onClick={() => setShowTripList(!showTripList)}
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all border border-white/20"
              >
                <FolderOpen className="w-4 h-4" />
                Meine Reisen
              </button>

              {/* New Trip */}
              <button
                onClick={handleNewTrip}
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all"
              >
                <Plus className="w-4 h-4" />
                Neue Reise
              </button>
            </div>
          </div>

          {/* Tabs + Module settings in header */}
          <div className="relative mt-3">
            {canScrollLeft && (
              <button
                onClick={() => {
                  tabsRef.current?.scrollBy({ left: -200, behavior: "smooth" });
                }}
                className="absolute -left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-white/85 border border-white/60 rounded-full shadow-md hover:shadow-lg hover:bg-white transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-blue-700" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div
                ref={tabsRef}
                onScroll={checkTabScroll}
                className="relative flex-1 flex gap-1.5 rounded-t-2xl overflow-x-auto pt-1.5 px-1.5"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      const el = tabsRef.current;
                      const btn = el?.querySelector(`[data-tab="${tab.id}"]`) as HTMLElement | null;
                      if (el && btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
                    }}
                    data-tab={tab.id}
                    className={`relative flex items-center gap-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? "z-20 bg-gray-50 text-blue-700 border border-blue-200 border-b-gray-50 px-5 py-3 rounded-tl-xl rounded-tr-xl rounded-bl-none rounded-br-none shadow-none translate-y-1"
                        : "z-10 px-4 py-2.5 bg-blue-600/55 text-white border border-blue-300/45 rounded-t-xl rounded-b-md shadow-[0_2px_5px_rgba(15,23,42,0.18)] hover:bg-blue-600/65 hover:-translate-y-0.5"
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-blue-500" : ""}`} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowModuleSettings(!showModuleSettings)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${
                    showModuleSettings
                      ? "bg-white text-blue-600 border-blue-200"
                      : "bg-blue-400/25 border-blue-300/50 text-white hover:bg-white/20"
                  }`}
                  title="Module verwalten"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {showModuleSettings && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowModuleSettings(false)} />
                    <div className="absolute right-0 top-12 z-40 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-64">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                        Module ein/aus
                      </h3>
                      <div className="space-y-1.5">
                        {allTabs.map((tab) => {
                          const isActive = activeModules.includes(tab.module);
                          return (
                            <button
                              key={tab.id}
                              onClick={() => toggleModule(tab.module)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                                isActive
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              <tab.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-blue-500" : "text-gray-400"}`} />
                              <span className="flex-1 text-left">{tab.label}</span>
                              {isActive && <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            {canScrollRight && (
              <button
                onClick={() => {
                  tabsRef.current?.scrollBy({ left: 200, behavior: "smooth" });
                }}
                className="absolute -right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-white/85 border border-white/60 rounded-full shadow-md hover:shadow-lg hover:bg-white transition-all"
              >
                <ChevronRight className="w-4 h-4 text-blue-700" />
              </button>
            )}
          </div>
          {/* Trip List */}
          {showTripList && (
            <div className="mt-4">
              {savedTrips.length === 0 ? (
                <div className="bg-white/10 rounded-2xl p-6 text-center text-white/60 text-sm">
                  Noch keine gespeicherten Reisen.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {savedTrips.map((t) => {
                    const isActive = t.id === trip.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleLoadTrip(t.id)}
                        className={`relative group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          isActive
                            ? "bg-white text-gray-900 shadow-lg ring-2 ring-blue-400"
                            : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
                        }`}
                      >
                        <span className="truncate max-w-[180px]">{getTripDisplayName(t)}</span>
                        {isActive && (
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            Aktiv
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDeleteTrip(t.id, e)}
                          className="p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account Hint Banner – only show when not logged in */}
      {!user && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookmarkPlus className="w-5 h-5 text-amber-500" />
              <p className="text-sm text-amber-800">
                <strong>Tipp:</strong> Erstelle ein kostenloses Konto, um deine
                Reisen dauerhaft zu speichern und auf allen Geräten zu synchronisieren.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              Anmelden
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={activeTab === "report" ? "block" : "grid lg:grid-cols-[380px_1fr] gap-8"}>
          {/* Left Panel */}
          {activeTab !== "report" && (
          <div className="space-y-6">
            {/* Route Stops - only for transport tabs */}
            {isTransportTab && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                {activeTab === "route" ? "Autoroute" : activeTab === "flights" ? "Flugroute" : activeTab === "car" ? "Mietwagen-Route" : activeTab === "train" ? "Zugroute" : "Route"}
              </h3>
              <div className="mb-4 space-y-2">
                <p className="text-xs font-medium text-gray-500">Zwischenziel hinzufügen</p>
                <button
                  onClick={addQuickStopDraft}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Zwischenziel hinzufügen
                </button>
                {quickStopDrafts.map((draft) => (
                  <div key={draft.id}>
                    <input
                      type="text"
                      value={draft.name}
                      ref={(el) => {
                        if (el && autocompleteReady) {
                          attachAutocomplete(el, (place, lat, lng) => {
                            void commitQuickStopDraft(draft.id, { name: place, lat: lat ?? undefined, lng: lng ?? undefined });
                          });
                        }
                      }}
                      onChange={(e) =>
                        setQuickStopDrafts((prev) =>
                          prev.map((d) => (d.id === draft.id ? { ...d, name: e.target.value, lat: undefined, lng: undefined } : d))
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void commitQuickStopDraft(draft.id);
                        }
                      }}
                      placeholder="Zwischenziel eingeben..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-3 relative">
                {currentRouteStops.length > 1 && (
                  <div className="absolute left-[19px] top-[28px] bottom-[28px] w-0.5 bg-gradient-to-b from-blue-400 via-gray-200 to-red-400 z-0" />
                )}
                {currentRouteStops.map((stop, stopIndex) => (
                    (() => {
                      const stopBadgeLabel =
                        stop.type === "start"
                          ? "A"
                          : stop.type === "end"
                            ? "B"
                            : String(stopIndex);
                      return (
                    <div
                      key={`${trip.id}-${stop.id}`}
                      className="relative flex items-center gap-2 z-10 rounded-xl py-1 transition-all"
                    >
                      {stop.type === "stop" ? (
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                          <button
                            onClick={() => moveStop(stop.id, "up")}
                            disabled={stopIndex <= 1}
                            className="p-0.5 text-gray-300 hover:text-blue-500 disabled:opacity-20 disabled:hover:text-gray-300 transition-colors"
                            title="Nach oben"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveStop(stop.id, "down")}
                            disabled={stopIndex >= currentRouteStops.length - 2}
                            className="p-0.5 text-gray-300 hover:text-blue-500 disabled:opacity-20 disabled:hover:text-gray-300 transition-colors"
                            title="Nach unten"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-5 flex-shrink-0" />
                      )}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          stop.type === "start"
                            ? "bg-blue-500"
                            : stop.type === "end" && stop.isHotel
                            ? "bg-gradient-to-br from-red-500 to-purple-500"
                            : stop.type === "end"
                            ? "bg-red-500"
                            : stop.isHotel && stop.bookingConfirmation
                            ? "bg-green-500"
                            : stop.isHotel
                            ? "bg-purple-500"
                            : "bg-orange-400"
                        }`}
                      >
                        <span className="text-white text-sm font-bold leading-none">{stopBadgeLabel}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {stop.isHotel && stop.bookingConfirmation ? (
                          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                            <p className="text-sm font-medium text-green-900 truncate">
                              {stop.bookingHotelName || stop.name}
                            </p>
                            {stop.bookingAddress && (
                              <p className="text-[11px] text-green-700 truncate">{stop.bookingAddress}</p>
                            )}
                            <p className="text-[10px] text-green-500 mt-0.5">
                              {stop.name}{stop.bookingPrice ? ` · ${stop.bookingPrice}` : ""}
                            </p>
                          </div>
                        ) : (
                        <input
                          type="text"
                          value={stop.name}
                          ref={(el) => {
                            if (el && autocompleteReady) {
                              attachAutocomplete(el, (place, lat, lng) => {
                                if (lat != null && lng != null && stop.type === "stop") {
                                  updateStopWithCoords(stop.id, place, lat, lng);
                                } else if (lat != null && lng != null) {
                                  updateStopField(stop.id, { name: place, lat, lng });
                                } else {
                                  updateStop(stop.id, place);
                                }
                              });
                            }
                          }}
                          onChange={(e) => updateStop(stop.id, e.target.value)}
                          placeholder={
                            stop.type === "start"
                              ? "Startort eingeben..."
                              : stop.type === "end"
                              ? "Zielort eingeben..."
                              : stop.isHotel
                              ? "Hotelort eingeben..."
                              : "Zwischenstopp..."
                          }
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        )}
                      </div>
                      {(stop.type === "stop" || stop.type === "end") && !(stop.isHotel && stop.bookingConfirmation) && (
                        <button
                          onClick={() => toggleHotel(stop.id)}
                          className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                            stop.isHotel
                              ? "text-purple-500 bg-purple-50 hover:bg-purple-100"
                              : "text-gray-300 hover:text-purple-500 hover:bg-purple-50"
                          }`}
                          title={stop.isHotel ? "Hotel entfernen" : stop.type === "end" ? "Ziel als Hotel markieren" : "Als Hotel markieren"}
                        >
                          <BedDouble className="w-4 h-4" />
                        </button>
                      )}
                      {stop.type === "stop" && !(stop.isHotel && stop.bookingConfirmation) && (
                        <button
                          onClick={() => removeStop(stop.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                          title="Zwischenstopp entfernen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                      );
                    })()
                ))}
              </div>
            </div>
            )}

            {/* Date & Travelers */}
            {!isHotelOnlyMode && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Reisedaten
                </h3>
                <DateRangePicker
                  startDate={trip.startDate}
                  endDate={trip.endDate}
                  onSelect={(s, e) => updateTrip({ startDate: s, endDate: e })}
                  startLabel="Abreise"
                  endLabel="Rückkehr"
                />
                <div className="mt-3">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Reisende
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={trip.travelers}
                      onChange={(e) =>
                        updateTrip({ travelers: Number(e.target.value) })
                      }
                      className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "Person" : "Personen"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            

            {/* Bucket List Shortcut */}
            {trip.bucketList.length > 0 && (
              <button
                onClick={() => setActiveTab("bucket")}
                className="w-full flex items-center justify-between bg-green-50 border border-green-100 rounded-2xl px-5 py-3 hover:bg-green-100 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-green-700">
                  <BookmarkPlus className="w-4 h-4" />
                  Bucket List ({trip.bucketList.length})
                </span>
                <ChevronDown className="w-4 h-4 text-green-400 -rotate-90" />
              </button>
            )}
          </div>
          )}

          {/* Right Panel */}
          <div className="min-w-0">
            {/* Route Tab (shared for auto, car, train) */}
            {(activeTab === "route" || activeTab === "car" || activeTab === "train") && (
              <div className="space-y-6">
                {showTips && !currentOrigin && !currentDestination && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Tipp</p>
                        <p className="text-sm text-blue-600 mt-1">
                          Gib links einen Start- und Zielort ein. Die Autocomplete-Suche hilft dir, 
                          Städte schnell zu finden. Die Route wird automatisch auf der Karte berechnet.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <GoogleMap
                    key={activeTab}
                    stops={currentRouteStops}
                    viaPoints={currentRouteViaPoints}
                    travelMode={trip.travelMode}
                    optimize={optimizeRoute}
                    onRouteCalculated={(info) => {
                      setRouteInfo(info);
                      const routeKey = (activeTab === "route" || activeTab === "car" || activeTab === "train" || activeTab === "flights")
                        ? (activeTab as "route" | "car" | "train" | "flights")
                        : "route";
                      if (info.overviewPolyline && !hasUnsavedChanges) {
                        updateTripSilent((prev) => {
                          const prevPolyline = prev.routes?.[routeKey]?.overviewPolyline || "";
                          if (prevPolyline === info.overviewPolyline) return prev;
                          return {
                            ...prev,
                            routes: {
                              ...(prev.routes || {}),
                              [routeKey]: {
                                stops: prev.routes?.[routeKey]?.stops || (routeKey === "route" ? prev.stops : []),
                                viaPoints: prev.routes?.[routeKey]?.viaPoints || [],
                                overviewPolyline: info.overviewPolyline,
                              },
                            },
                          };
                        });
                      }
                      setRouteError(null);
                      setOptimizeRoute(false);
                    }}
                    onStopsReordered={handleStopsReordered}
                    onError={(msg) => { setRouteError(msg); setOptimizeRoute(false); }}
                    onMapClick={addStopFromMap}
                    onViaPointsChange={updateCurrentViaPoints}
                    onRemoveStop={removeStop}
                  />
                </div>

                {routeError && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Routenberechnung</p>
                        <p className="text-sm text-amber-600 mt-1">{routeError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Navigation className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900">
                      Routendetails
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className={`text-2xl font-bold ${routeInfo?.distance ? "text-blue-600" : "text-gray-300"}`}>
                        {routeInfo?.distance || "—"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Distanz</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className={`text-2xl font-bold ${routeInfo?.duration ? "text-blue-600" : "text-gray-300"}`}>
                        {routeInfo?.duration || "—"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Fahrzeit
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className={`text-2xl font-bold ${routeInfo ? "text-blue-600" : "text-gray-300"}`}>
                        {routeInfo?.stops ?? "—"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Zwischenstopps
                      </div>
                    </div>
                  </div>

                  {currentOrigin && currentDestination && !routeInfo?.distance && !routeError && (
                    <p className="text-xs text-gray-400 text-center mt-4">
                      Wähle Start und Ziel über die Autocomplete-Vorschläge aus, damit die Route berechnet wird.
                    </p>
                  )}

                  {(() => {
                    const waypointCount = currentRouteStops.filter((s) => s.type === "stop" && s.name.trim()).length;
                    const tooMany = waypointCount >= 20;
                    return (
                      <>
                        {currentOrigin && currentDestination && !tooMany && (
                          <button
                            onClick={reverseRoute}
                            className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <ArrowDownUp className="w-4 h-4" />
                            Route umkehren
                          </button>
                        )}

                        {waypointCount >= 2 && !tooMany && (
                          <button
                            onClick={handleOptimizeRoute}
                            disabled={optimizeRoute}
                            className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                          >
                            {optimizeRoute ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Wird optimiert...
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4" />
                                Kürzeste Route berechnen
                              </>
                            )}
                          </button>
                        )}

                        {tooMany && (
                          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <p className="text-xs text-amber-700">
                              <strong>{waypointCount} Zwischenstopps</strong> — Route umkehren und optimieren sind bei 20+ Stopps deaktiviert.
                              Verwende die Pfeile oder «+ Stopp auf Karte», um die Route anzupassen.
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Etappen Breakdown */}
                {etappen.length > 1 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                      <Route className="w-5 h-5 text-purple-500" />
                      <h3 className="font-semibold text-gray-900">
                        Tagesetappen ({etappen.length})
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {(() => {
                        let carryHotelName = "";
                        let carryHotelAddress = "";
                        let carryHotelPlace = "";
                        let carryHotelNightsRemaining = 0;

                        const etappenWithCarry = etappen.map((etappe) => {
                          const hasDirectBooking = !!etappe.hotelBooked;
                          const bookingNights = hasDirectBooking ? Math.max(1, Number(etappe.hotelNights) || 2) : 0;
                          const inheritedBooking = !hasDirectBooking && carryHotelNightsRemaining > 0;

                          const hotelBookedForDisplay = hasDirectBooking || inheritedBooking;
                          const hotelNameForDisplay = hasDirectBooking
                            ? (etappe.hotelName || etappe.to)
                            : (carryHotelName || carryHotelPlace || etappe.to);
                          const hotelAddressForDisplay = hasDirectBooking
                            ? (etappe.hotelAddress || "")
                            : carryHotelAddress;
                          const hotelPlaceForDisplay = hasDirectBooking ? etappe.to : (carryHotelPlace || etappe.to);

                          if (hasDirectBooking) {
                            carryHotelName = etappe.hotelName || etappe.to;
                            carryHotelAddress = etappe.hotelAddress || "";
                            carryHotelPlace = etappe.to;
                            carryHotelNightsRemaining = Math.max(0, bookingNights - 1);
                          } else if (inheritedBooking) {
                            carryHotelNightsRemaining = Math.max(0, carryHotelNightsRemaining - 1);
                          } else {
                            carryHotelName = "";
                            carryHotelAddress = "";
                            carryHotelPlace = "";
                            carryHotelNightsRemaining = 0;
                          }

                          return {
                            ...etappe,
                            hotelBookedForDisplay,
                            hotelNameForDisplay,
                            hotelAddressForDisplay,
                            hotelPlaceForDisplay,
                          };
                        });

                        return etappenWithCarry.map((etappe) => (
                        <div
                          key={etappe.index}
                          className="relative flex items-stretch gap-3"
                        >
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                              etappe.index === 0
                                ? "bg-blue-500"
                                : etappe.index === etappen.length - 1
                                ? "bg-red-500"
                                : etappe.hotelBookedForDisplay
                                ? "bg-green-500"
                                : "bg-purple-500"
                            }`}>
                              {etappe.hotelBookedForDisplay ? <Check className="w-4 h-4" /> : etappe.index + 1}
                            </div>
                            {etappe.index < etappen.length - 1 && (
                              <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {etappe.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {etappe.from} → {etappe.to}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                <Navigation className="w-3 h-3" />
                                {etappe.distanceKm.toLocaleString("de-CH")} km
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" />
                                {etappe.durationFormatted}
                              </span>
                            </div>
                            {etappe.index < etappen.length - 1 && (
                              etappe.hotelBookedForDisplay ? (
                                <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-1.5">
                                    <BedDouble className="w-3.5 h-3.5 text-green-600" />
                                    <span className="text-xs font-semibold text-green-800">
                                      {etappe.hotelNameForDisplay}
                                    </span>
                                    <span className="text-[10px] text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full ml-auto">Gebucht</span>
                                  </div>
                                  {etappe.hotelAddressForDisplay && (
                                    <p className="text-[11px] text-green-700 mt-1">{etappe.hotelAddressForDisplay}</p>
                                  )}
                                </div>
                              ) : (
                                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                                  <BedDouble className="w-3 h-3" />
                                  Übernachtung in {etappe.hotelPlaceForDisplay}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hotels Tab */}
            {activeTab === "hotels" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Hotel className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900">Hotel direkt suchen (ohne Autoroute)</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <input
                      ref={hotelOnlyDestinationRef}
                      type="text"
                      value={hotelOnlyDestination}
                      onChange={(e) => setHotelOnlyDestination(e.target.value)}
                      placeholder="Hotel-Ort eingeben..."
                      className="lg:col-span-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="sm:col-span-2 lg:col-span-2">
                      <HotelDatePicker
                        checkIn={hotelOnlyCheckIn}
                        checkOut={hotelOnlyCheckOut}
                        nights={hotelOnlyNights}
                        onSelect={(ci, n) => {
                          const [y, m, d] = ci.split("-").map(Number);
                          const dt = new Date(y, m - 1, d + n);
                          const co = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
                          setHotelOnlyCheckIn(ci);
                          setHotelOnlyCheckOut(co);
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={hotelOnlyTravelers}
                        onChange={(e) => setHotelOnlyTravelers(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Gäste"
                      />
                      <input
                        type="number"
                        min={1}
                        value={hotelOnlyRooms}
                        onChange={(e) => setHotelOnlyRooms(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Zimmer"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <a
                      href={buildHotelsComLink(hotelOnlySearchParams)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        openHotelsComAffiliateLink(hotelOnlySearchParams, { mode: "hotel-only" });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      Hotels.com
                    </a>
                    <a
                      href={buildExpediaHotelLink(hotelOnlySearchParams)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        openExpediaAffiliateLink(hotelOnlySearchParams, { mode: "hotel-only" });
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors"
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      Expedia
                    </a>
                    <a
                      href={buildBookingHotelLink(hotelOnlySearchParams)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logAffiliateClick("hotels", "Booking.com", buildBookingHotelLink(hotelOnlySearchParams), { mode: "hotel-only" })}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <Hotel className="w-3.5 h-3.5" />
                      Booking.com
                    </a>
                  </div>
                </div>

                {(() => {
                  const allRouteStops = [
                    ...trip.stops,
                    ...(trip.routes?.flights?.stops || []),
                    ...(trip.routes?.car?.stops || []),
                    ...(trip.routes?.train?.stops || []),
                  ];
                  const seen = new Set<string>();
                  const deduped = allRouteStops.filter((s) => {
                    if ((s.type !== "stop" && s.type !== "end") || !s.name.trim()) return false;
                    const key = `${s.id}:${s.type}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
                  const hotelStops = deduped.filter((s) => s.isHotel);
                  const allStopsWithHotelOption = deduped;

                  function addDaysLocal(dateStr: string, days: number): string {
                    const [y, m, d] = dateStr.split("-").map(Number);
                    const dt = new Date(y, m - 1, d + days);
                    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
                  }

                  const computedHotelDates = (() => {
                    const out = new globalThis.Map<string, { checkIn: string; checkOut: string; nights: number }>();
                    let cursor = trip.startDate || "";
                    for (const stop of hotelStops) {
                      const nights = Math.max(1, Number(stop.hotelNights) || 2);
                      const isBookedAnchor = !!stop.bookingConfirmation && !!stop.hotelCheckIn;
                      const checkIn = isBookedAnchor
                        ? (stop.hotelCheckIn || "")
                        : (cursor || stop.hotelCheckIn || "");
                      const checkOut = checkIn ? addDaysLocal(checkIn, nights) : "";
                      out.set(stop.id, { checkIn, checkOut, nights });
                      cursor = checkOut || cursor;
                    }
                    return out;
                  })();

                  function getHotelDates(stop: RouteStop): { checkIn: string; checkOut: string; nights: number } {
                    return computedHotelDates.get(stop.id) || {
                      checkIn: stop.hotelCheckIn || "",
                      checkOut: stop.hotelCheckIn ? addDaysLocal(stop.hotelCheckIn, Math.max(1, Number(stop.hotelNights) || 2)) : "",
                      nights: Math.max(1, Number(stop.hotelNights) || 2),
                    };
                  }

                  function handleDateSelect(stopId: string, newCheckIn: string, newNights: number) {
                    const selected = hotelStops.find((s) => s.id === stopId);
                    if (selected?.bookingConfirmation) {
                      updateStopField(stopId, { hotelCheckIn: newCheckIn, hotelNights: newNights });
                    } else {
                      updateStopField(stopId, { hotelCheckIn: "", hotelNights: newNights });
                    }
                  }

                  if (allStopsWithHotelOption.length === 0) {
                    return (
                      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6">
                        <div className="flex items-start gap-3">
                          <BedDouble className="w-6 h-6 text-purple-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-purple-800">Noch keine Hotel-Orte</p>
                            <p className="text-sm text-purple-600 mt-1">
                              Nutze oben die direkte Hotelsuche oder markiere im <strong>Autoroute</strong>-Tab Zwischenstopps/Ziel mit dem
                              <BedDouble className="w-3.5 h-3.5 inline mx-1 text-purple-500" />
                              Symbol als Hotel-Ort.
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <>
                      {hotelStops.length === 0 && (
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
                          <div className="flex items-start gap-3">
                            <BedDouble className="w-5 h-5 text-amber-500 mt-0.5" />
                            <p className="text-sm text-amber-700">
                              Markiere Zwischenstopps oder das Ziel im <strong>Autoroute</strong>-Tab mit dem
                              <BedDouble className="w-3.5 h-3.5 inline mx-1 text-purple-500" />
                              Symbol als Hotelstopps, damit sie hier erscheinen.
                            </p>
                          </div>
                        </div>
                      )}

                      {hotelStops.length > 0 && !trip.startDate && (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                            <p className="text-sm text-blue-700">
                              Setze ein <strong>Reise-Startdatum</strong> oben, damit die Hotel-Daten automatisch berechnet werden.
                            </p>
                          </div>
                        </div>
                      )}

                      {hotelStops.length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                          <div className="flex items-center gap-3 mb-5">
                            <BedDouble className="w-5 h-5 text-purple-500" />
                            <h3 className="font-semibold text-gray-900">
                              Übernachtungen ({hotelStops.length})
                            </h3>
                          </div>
                          <div className="space-y-5">
                            {hotelStops.map((stop, idx) => {
                              const { checkIn, checkOut, nights } = getHotelDates(stop);
                              const guests = stop.hotelGuests || trip.travelers || 2;
                              const rooms = stop.hotelRooms || 1;
                              const stopSearchParams = {
                                destination: stop.name,
                                checkIn,
                                checkOut,
                                travelers: guests,
                                rooms,
                              };
                              return (
                                <div
                                  key={stop.id}
                                  className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100"
                                >
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-8 h-8 ${stop.bookingConfirmation ? "bg-green-500" : "bg-purple-500"} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                                      {stop.bookingConfirmation ? <Check className="w-4 h-4" /> : idx + 1}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900">{stop.name}</h4>
                                      <p className="text-xs text-gray-500">
                                        {nights} {nights === 1 ? "Nacht" : "Nächte"} · {guests} {guests === 1 ? "Gast" : "Gäste"} · {rooms} {rooms === 1 ? "Zimmer" : "Zimmer"}
                                      </p>
                                    </div>
                                    {stop.bookingConfirmation && (
                                      <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Gebucht</span>
                                    )}
                                  </div>

                                  {/* Date + Guests/Rooms on one row */}
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                      <HotelDatePicker
                                        checkIn={checkIn}
                                        checkOut={checkOut}
                                        nights={nights}
                                        onSelect={(ci, n) => handleDateSelect(stop.id, ci, n)}
                                      />
                                    </div>
                                    <div className="flex items-center gap-2.5 text-xs text-gray-600 shrink-0">
                                      <label className="flex items-center gap-1">
                                        <Users className="w-3 h-3 text-gray-400" />
                                        <input
                                          type="number"
                                          min={1}
                                          value={guests}
                                          onChange={(e) => updateStopField(stop.id, { hotelGuests: parseInt(e.target.value) || 1 })}
                                          className="w-8 px-0.5 py-0.5 text-xs text-center bg-white border border-gray-200 rounded focus:ring-1 focus:ring-purple-300 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                      </label>
                                      <label className="flex items-center gap-1">
                                        <BedDouble className="w-3 h-3 text-gray-400" />
                                        <input
                                          type="number"
                                          min={1}
                                          value={rooms}
                                          onChange={(e) => updateStopField(stop.id, { hotelRooms: parseInt(e.target.value) || 1 })}
                                          className="w-8 px-0.5 py-0.5 text-xs text-center bg-white border border-gray-200 rounded focus:ring-1 focus:ring-purple-300 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                      </label>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <a
                                      href={buildHotelsComLink(stopSearchParams)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        openHotelsComAffiliateLink(stopSearchParams, {
                                          stopId: stop.id,
                                          stopName: stop.name,
                                        });
                                      }}
                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-white px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                                    >
                                      <Hotel className="w-3.5 h-3.5" />
                                      Hotels.com
                                      <ExternalLink className="w-3 h-3 text-red-400" />
                                    </a>
                                    <a
                                      href={buildBookingHotelLink(stopSearchParams)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() =>
                                        logAffiliateClick("hotels", "Booking.com", buildBookingHotelLink(stopSearchParams), {
                                          stopId: stop.id,
                                          stopName: stop.name,
                                        })
                                      }
                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-white px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                                    >
                                      <Hotel className="w-3.5 h-3.5" />
                                      Booking.com
                                      <ExternalLink className="w-3 h-3 text-blue-400" />
                                    </a>
                                    <a
                                      href={buildExpediaHotelLink(stopSearchParams)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        openExpediaAffiliateLink(stopSearchParams, {
                                          stopId: stop.id,
                                          stopName: stop.name,
                                        });
                                      }}
                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-white px-3 py-2 rounded-lg border border-yellow-200 hover:bg-yellow-50 transition-colors"
                                    >
                                      <Hotel className="w-3.5 h-3.5" />
                                      Expedia
                                      <ExternalLink className="w-3 h-3 text-yellow-400" />
                                    </a>
                                    <a
                                      href={buildAgodaHotelLink(stopSearchParams)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() =>
                                        logAffiliateClick("hotels", "Agoda", buildAgodaHotelLink(stopSearchParams), {
                                          stopId: stop.id,
                                          stopName: stop.name,
                                        })
                                      }
                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-white px-3 py-2 rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors"
                                    >
                                      <Hotel className="w-3.5 h-3.5" />
                                      Agoda
                                      <ExternalLink className="w-3 h-3 text-purple-400" />
                                    </a>
                                    <a
                                      href={buildTrivagoLink(stopSearchParams)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() =>
                                        logAffiliateClick("hotels", "trivago", buildTrivagoLink(stopSearchParams), {
                                          stopId: stop.id,
                                          stopName: stop.name,
                                        })
                                      }
                                      className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 bg-white px-3 py-2 rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors"
                                    >
                                      <Search className="w-3.5 h-3.5" />
                                      trivago
                                      <ExternalLink className="w-3 h-3 text-teal-400" />
                                    </a>
                                  </div>

                                  {/* Booking details section */}
                                  <details className="mt-3 group">
                                    <summary className={`text-[11px] cursor-pointer transition-colors list-none flex items-center gap-1.5 ${stop.bookingConfirmation ? "text-green-600 font-semibold" : "text-gray-400 hover:text-green-600"}`}>
                                      <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                                      {stop.bookingConfirmation ? (
                                        <>
                                          Buchung: {stop.bookingHotelName || stop.bookingConfirmation}
                                          {stop.bookingPrice && <span className="ml-1 text-gray-500 font-normal">· {stop.bookingPrice}</span>}
                                          {stop.bookingLink && (
                                            <a href={stop.bookingLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="ml-auto text-blue-500 hover:text-blue-700">
                                              <ExternalLink className="w-3 h-3" />
                                            </a>
                                          )}
                                        </>
                                      ) : (
                                        <>Buchung eintragen</>
                                      )}
                                    </summary>
                                    <div className="mt-2 bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                                      <input
                                        type="text"
                                        placeholder="Hotelname"
                                        value={stop.bookingHotelName || ""}
                                        onChange={(e) => updateStopField(stop.id, { bookingHotelName: e.target.value })}
                                        className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-300 focus:border-transparent"
                                      />
                                      <input
                                        type="text"
                                        placeholder="Adresse"
                                        value={stop.bookingAddress || ""}
                                        onChange={(e) => updateStopField(stop.id, { bookingAddress: e.target.value })}
                                        className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-300 focus:border-transparent"
                                      />
                                      <div className="grid grid-cols-2 gap-2">
                                        <input
                                          type="text"
                                          placeholder="Buchungsnr."
                                          value={stop.bookingConfirmation || ""}
                                          onChange={(e) => updateStopField(stop.id, { bookingConfirmation: e.target.value })}
                                          className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-300 focus:border-transparent"
                                        />
                                        <input
                                          type="text"
                                          placeholder="Preis (z.B. CHF 120)"
                                          value={stop.bookingPrice || ""}
                                          onChange={(e) => updateStopField(stop.id, { bookingPrice: e.target.value })}
                                          className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-300 focus:border-transparent"
                                        />
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <input
                                          type="text"
                                          placeholder="Buchungs-Link (URL)"
                                          value={stop.bookingLink || ""}
                                          onChange={(e) => updateStopField(stop.id, { bookingLink: e.target.value })}
                                          className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-300 focus:border-transparent"
                                        />
                                        <select
                                          value={stop.bookingProvider || ""}
                                          onChange={(e) => updateStopField(stop.id, { bookingProvider: e.target.value })}
                                          className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-300 focus:border-transparent"
                                        >
                                          <option value="">Anbieter</option>
                                          <option value="Hotels.com">Hotels.com</option>
                                          <option value="Booking.com">Booking.com</option>
                                          <option value="Expedia">Expedia</option>
                                          <option value="Agoda">Agoda</option>
                                          <option value="trivago">trivago</option>
                                          <option value="Andere">Andere</option>
                                        </select>
                                      </div>
                                      {stop.bookingConfirmation && (
                                        <button
                                          type="button"
                                          onClick={() => updateStopField(stop.id, { bookingHotelName: "", bookingAddress: "", bookingConfirmation: "", bookingPrice: "", bookingLink: "", bookingProvider: "" })}
                                          className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                          Buchung löschen
                                        </button>
                                      )}
                                    </div>
                                  </details>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Quick-add hotel stops */}
                      {allStopsWithHotelOption.filter((s) => !s.isHotel).length > 0 && (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Weitere Stopps als Hotel markieren
                          </h4>
                          <div className="space-y-2">
                            {allStopsWithHotelOption
                              .filter((s) => !s.isHotel)
                              .map((stop) => (
                                <button
                                  key={stop.id}
                                  onClick={() => toggleHotel(stop.id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-purple-50 rounded-xl transition-colors text-left group"
                                >
                                  {stop.type === "end" ? (
                                    <Flag className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                                  ) : (
                                    <MapPin className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                                  )}
                                  <span className="text-sm text-gray-700 group-hover:text-purple-700 font-medium">
                                    {stop.name} {stop.type === "end" ? "(Ziel)" : ""}
                                  </span>
                                  <BedDouble className="w-4 h-4 text-gray-300 group-hover:text-purple-500 ml-auto" />
                                </button>
                              ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Reisebericht Tab */}
            {activeTab === "report" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900">Reisebericht</h3>
                  <div className="mt-4 flex flex-wrap items-start gap-4">
                    <div className="flex h-[236px] flex-col items-start justify-between">
                      {trip.pdfCoverPhotoDataUrl ? (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowCoverPreviewModal(true)}
                            className="relative w-[132px] aspect-[1/1.414] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 hover:ring-2 hover:ring-indigo-300 transition-all cursor-zoom-in"
                            title="Vorschau vergrössern"
                          >
                            <img src={trip.pdfCoverPhotoDataUrl} alt="Titelbild Vorschau" className="w-full h-full object-cover" />
                          </button>
                          <button
                            type="button"
                            onClick={clearPdfCoverPhoto}
                            className="absolute -top-2 -right-2 z-20 w-6 h-6 rounded-full bg-white border border-gray-300 shadow-sm text-gray-600 hover:text-red-600 hover:border-red-300 flex items-center justify-center"
                            title="Titelbild entfernen"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-[132px] aspect-[1/1.414] rounded-lg border border-dashed border-gray-300 bg-gray-50" />
                      )}
                      <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer">
                        <FolderOpen className="w-4 h-4" />
                        Titelbild laden
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(ev) => {
                            void setPdfCoverPhoto(ev.target.files);
                            ev.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap items-start gap-3">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setPdfCoverStyle("background")}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault();
                            setPdfCoverStyle("background");
                          }
                        }}
                        className={`relative h-[236px] rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                          (trip.pdfCoverPhotoStyle || "belowTitle") === "background"
                            ? "border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50"
                            : "border-gray-200 bg-white hover:border-indigo-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setShowCoverVariantModal("background");
                          }}
                          className="absolute right-2 top-2 z-20 w-6 h-6 rounded-full bg-white/95 border border-gray-300 text-gray-600 hover:text-indigo-700 flex items-center justify-center"
                          title="Variante vergrössern"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <div className="relative mx-auto w-[112px] aspect-[1/1.414] overflow-hidden rounded-lg bg-slate-200 border border-gray-200">
                          {previewModeFor("background") === "background" ? (
                            <>
                              {trip.pdfCoverPhotoDataUrl ? (
                                <img src={trip.pdfCoverPhotoDataUrl} alt="Vorschau Hintergrund" className="absolute inset-0 w-full h-full object-fill" />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-700/70 to-emerald-700/50" />
                              )}
                              <div className="absolute inset-0 bg-black/20" />
                            </>
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-white" />
                              {trip.pdfCoverPhotoDataUrl ? (
                                <div className="absolute inset-x-0 bottom-0 h-[68%] bg-white">
                                  <img src={trip.pdfCoverPhotoDataUrl} alt="Vorschau unter Titel" className="w-full h-full object-contain" />
                                </div>
                              ) : (
                                <div className="absolute inset-x-0 bottom-0 h-[68%] bg-slate-300" />
                              )}
                            </>
                          )}
                          <div className="absolute inset-x-2 top-2">
                            <div
                              className="truncate font-semibold"
                              style={{
                                color: coverTitleColor,
                                fontFamily: coverFontFamily(coverTitleFont),
                                fontSize: `${coverMiniTitleSize}px`,
                                lineHeight: 1.1,
                                textAlign: coverTitleAlign,
                                textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                              }}
                            >
                              {trip.name || "Titel auf Bild"}
                            </div>
                            {(trip.startDate && trip.endDate) && (
                              <div
                                className="mt-1 truncate"
                                style={{
                                  color: coverDateColor,
                                  fontFamily: coverFontFamily(coverDateFont),
                                  fontSize: `${coverMiniDateSize}px`,
                                  lineHeight: 1.1,
                                  textAlign: coverDateAlign,
                                  textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                                }}
                              >
                                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="mt-1.5 text-[11px] font-semibold text-gray-800">Titelbild als Hintergrund</p>
                        {trip.pdfCoverPhotoDataUrl && !coverIsPortrait && (
                          <p className="text-[10px] text-amber-600">Querformat wird im PDF unter dem Titel platziert</p>
                        )}
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setPdfCoverStyle("belowTitle")}
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter" || ev.key === " ") {
                            ev.preventDefault();
                            setPdfCoverStyle("belowTitle");
                          }
                        }}
                        className={`relative h-[236px] rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                          (trip.pdfCoverPhotoStyle || "belowTitle") === "belowTitle"
                            ? "border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50"
                            : "border-gray-200 bg-white hover:border-indigo-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setShowCoverVariantModal("belowTitle");
                          }}
                          className="absolute right-2 top-2 z-20 w-6 h-6 rounded-full bg-white/95 border border-gray-300 text-gray-600 hover:text-indigo-700 flex items-center justify-center"
                          title="Variante vergrössern"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <div className="relative mx-auto w-[112px] aspect-[1/1.414] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          <div className="absolute inset-x-2 top-2 z-10">
                            <div className="truncate font-semibold" style={{ color: coverTitleColor, fontFamily: coverFontFamily(coverTitleFont), fontSize: `${coverMiniTitleSize}px`, lineHeight: 1.1, textAlign: coverTitleAlign }}>
                              {trip.name || "Titel"}
                            </div>
                            {(trip.startDate && trip.endDate) && (
                              <div className="mt-1 truncate" style={{ color: coverDateColor, fontFamily: coverFontFamily(coverDateFont), fontSize: `${coverMiniDateSize}px`, lineHeight: 1.1, textAlign: coverDateAlign }}>
                                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                              </div>
                            )}
                          </div>
                          {trip.pdfCoverPhotoDataUrl ? (
                            <div className="absolute inset-x-0 bottom-0 h-[68%] bg-white">
                              <img src={trip.pdfCoverPhotoDataUrl} alt="Vorschau unter Titel" className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div className="absolute inset-x-0 bottom-0 h-[68%] bg-slate-300" />
                          )}
                        </div>
                        <p className="mt-1.5 text-[11px] font-semibold text-gray-800">Titelbild unter Titel</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-3 min-w-[240px]">
                      <p className="text-[11px] font-semibold text-gray-700 mb-2">Titel</p>
                      <div className="flex items-center gap-2 mb-2">
                        <select
                          value={coverTitleFont}
                          onChange={(ev) => updateTrip({ pdfCoverTitleFont: ev.target.value as "helvetica" | "times" | "courier" })}
                          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
                        >
                          <option value="helvetica">Helvetica</option>
                          <option value="times">Times</option>
                          <option value="courier">Courier</option>
                        </select>
                        <select
                          value={coverTitleSize}
                          onChange={(ev) => updateTrip({ pdfCoverTitleSize: Number(ev.target.value) || 32 })}
                          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
                        >
                          {[22, 26, 30, 32, 36, 40, 44, 48].map((n) => (
                            <option key={`title-size-${n}`} value={n}>{n}px</option>
                          ))}
                        </select>
                        <input
                          type="color"
                          value={coverTitleColor}
                          onChange={(ev) => updateTrip({ pdfCoverTitleColor: ev.target.value })}
                          className="w-10 h-9 rounded border border-gray-200 bg-white cursor-pointer"
                          title="Titelfarbe"
                        />
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[
                          { id: "left", icon: AlignLeft, title: "Titel linksbündig" },
                          { id: "center", icon: AlignCenter, title: "Titel zentriert" },
                          { id: "right", icon: AlignRight, title: "Titel rechtsbündig" },
                        ].map((opt) => {
                          const Icon = opt.icon;
                          const isActive = coverTitleAlign === opt.id;
                          return (
                            <button
                              key={`title-align-${opt.id}`}
                              type="button"
                              onClick={() => updateTrip({ pdfCoverTitleAlign: opt.id as "left" | "center" | "right" })}
                              className={`w-9 h-9 rounded-md border flex items-center justify-center transition-colors ${
                                isActive
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                  : "border-gray-200 bg-white text-gray-600 hover:text-indigo-700 hover:border-indigo-300"
                              }`}
                              title={opt.title}
                              aria-label={opt.title}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] font-semibold text-gray-700 mb-2 mt-2">Datum</p>
                      <div className="flex items-center gap-2">
                        <select
                          value={coverDateFont}
                          onChange={(ev) => updateTrip({ pdfCoverDateFont: ev.target.value as "helvetica" | "times" | "courier" })}
                          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
                        >
                          <option value="helvetica">Helvetica</option>
                          <option value="times">Times</option>
                          <option value="courier">Courier</option>
                        </select>
                        <select
                          value={coverDateSize}
                          onChange={(ev) => updateTrip({ pdfCoverDateSize: Number(ev.target.value) || 14 })}
                          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
                        >
                          {[10, 12, 14, 16, 18, 20, 22, 24].map((n) => (
                            <option key={`date-size-${n}`} value={n}>{n}px</option>
                          ))}
                        </select>
                        <input
                          type="color"
                          value={coverDateColor}
                          onChange={(ev) => updateTrip({ pdfCoverDateColor: ev.target.value })}
                          className="w-10 h-9 rounded border border-gray-200 bg-white cursor-pointer"
                          title="Datumsfarbe"
                        />
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        {[
                          { id: "left", icon: AlignLeft, title: "Datum linksbündig" },
                          { id: "center", icon: AlignCenter, title: "Datum zentriert" },
                          { id: "right", icon: AlignRight, title: "Datum rechtsbündig" },
                        ].map((opt) => {
                          const Icon = opt.icon;
                          const isActive = coverDateAlign === opt.id;
                          return (
                            <button
                              key={`date-align-${opt.id}`}
                              type="button"
                              onClick={() => updateTrip({ pdfCoverDateAlign: opt.id as "left" | "center" | "right" })}
                              className={`w-9 h-9 rounded-md border flex items-center justify-center transition-colors ${
                                isActive
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                  : "border-gray-200 bg-white text-gray-600 hover:text-indigo-700 hover:border-indigo-300"
                              }`}
                              title={opt.title}
                              aria-label={opt.title}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>
                {showCoverPreviewModal && trip.pdfCoverPhotoDataUrl && (
                  <div
                    className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowCoverPreviewModal(false)}
                  >
                    <div
                      className="relative w-full max-w-md"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setShowCoverPreviewModal(false)}
                        className="absolute -top-3 -right-3 z-30 w-8 h-8 rounded-full bg-white text-gray-700 shadow-lg flex items-center justify-center"
                        title="Schließen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="relative z-10 rounded-xl overflow-hidden bg-gray-900 shadow-2xl">
                        <img
                          src={trip.pdfCoverPhotoDataUrl}
                          alt="Titelbild Großansicht"
                          className="w-full h-[72vh] object-contain bg-black"
                        />
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute inset-x-6 top-10">
                          <p className="font-bold" style={{ color: coverTitleColor, fontFamily: coverFontFamily(coverTitleFont), fontSize: `${coverTitleSize}px`, textAlign: coverTitleAlign }}>
                            {trip.name || "Neue Reise"}
                          </p>
                          {(trip.startDate && trip.endDate) && (
                            <p className="mt-4" style={{ color: coverDateColor, fontFamily: coverFontFamily(coverDateFont), fontSize: `${coverDateSize}px`, textAlign: coverDateAlign }}>
                              {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {showCoverVariantModal && (
                  <div
                    className="fixed inset-0 z-[121] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setShowCoverVariantModal(null)}
                  >
                    <div
                      className="relative w-full max-w-lg"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setShowCoverVariantModal(null)}
                        className="absolute -top-3 -right-3 z-30 w-8 h-8 rounded-full bg-white text-gray-700 shadow-lg flex items-center justify-center"
                        title="Schließen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="relative z-10 rounded-xl overflow-hidden bg-gray-900 shadow-2xl p-4">
                        <div className="relative mx-auto w-full max-w-[380px] aspect-[1/1.414] rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                          {showCoverVariantModal === "background" ? (
                            <>
                              {previewModeFor("background") === "background" ? (
                                <>
                                  {trip.pdfCoverPhotoDataUrl ? (
                                    <img src={trip.pdfCoverPhotoDataUrl} alt="Variante Hintergrund" className="absolute inset-0 w-full h-full object-fill" />
                                  ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-slate-700/70 to-emerald-700/50" />
                                  )}
                                  <div className="absolute inset-0 bg-black/20" />
                                </>
                              ) : (
                                <>
                                  <div className="absolute inset-0 bg-white" />
                                  {trip.pdfCoverPhotoDataUrl ? (
                                    <div className="absolute inset-x-0 bottom-0 h-[68%] bg-white">
                                      <img src={trip.pdfCoverPhotoDataUrl} alt="Variante unter Titel" className="w-full h-full object-contain" />
                                    </div>
                                  ) : (
                                    <div className="absolute inset-x-0 bottom-0 h-[68%] bg-slate-300" />
                                  )}
                                </>
                              )}
                              <div
                                className="absolute inset-x-4 top-4 truncate font-semibold"
                                style={{
                                  color: coverTitleColor,
                                  fontFamily: coverFontFamily(coverTitleFont),
                                  fontSize: `${Math.max(12, coverTitleSize * 0.45)}px`,
                                  textAlign: coverTitleAlign,
                                  textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                                }}
                              >
                                {trip.name || "Titel auf Bild"}
                              </div>
                              {(trip.startDate && trip.endDate) && (
                                <div
                                  className="absolute inset-x-4 top-12"
                                  style={{
                                    color: coverDateColor,
                                    fontFamily: coverFontFamily(coverDateFont),
                                    fontSize: `${Math.max(10, coverDateSize * 0.6)}px`,
                                    textAlign: coverDateAlign,
                                    textShadow: "0 1px 2px rgba(0,0,0,0.45)",
                                  }}
                                >
                                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="absolute inset-x-4 top-4 z-10 truncate font-semibold" style={{ color: coverTitleColor, fontFamily: coverFontFamily(coverTitleFont), fontSize: `${Math.max(12, coverTitleSize * 0.45)}px`, textAlign: coverTitleAlign }}>
                                {trip.name || "Titel"}
                              </div>
                              {(trip.startDate && trip.endDate) && (
                                <div className="absolute inset-x-4 top-12 z-10" style={{ color: coverDateColor, fontFamily: coverFontFamily(coverDateFont), fontSize: `${Math.max(10, coverDateSize * 0.6)}px`, textAlign: coverDateAlign }}>
                                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                                </div>
                              )}
                              {trip.pdfCoverPhotoDataUrl ? (
                                <div className="absolute inset-x-0 bottom-0 h-[68%] bg-white">
                                  <img src={trip.pdfCoverPhotoDataUrl} alt="Variante unter Titel" className="w-full h-full object-contain" />
                                </div>
                              ) : (
                                <div className="absolute inset-x-0 bottom-0 h-[68%] bg-slate-300" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {etappen.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-sm text-gray-500">
                    Sobald Etappen vorhanden sind, kannst du hier pro Etappe Fotos auswählen und das Layout für den PDF-Export festlegen.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {etappen.map((etappe, eIdx) => {
                      const selectedPdfPhotos = getSelectedPdfPhotosForEtappe(eIdx);
                      const pdfPhotoLibrary = getPdfPhotoLibraryForEtappe(eIdx);
                      const pdfPhotoPlacement = trip.pdfPhotoPlacementByEtappe?.[String(eIdx)] || "afterEntdecken";
                      const pdfPhotoLayout = trip.pdfPhotoLayoutByEtappe?.[String(eIdx)] || "auto";
                      const pdfPhotoPages = trip.pdfPhotoPagesByEtappe?.[String(eIdx)] || 1;
                      return (
                        <div key={`report-${eIdx}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                Etappe {eIdx + 1}: {etappe.from} → {etappe.to}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {etappe.distanceKm.toLocaleString("de-CH")} km · {etappe.durationFormatted}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                              {selectedPdfPhotos.length} ausgewählt
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <select
                              value={pdfPhotoPlacement}
                              onChange={(ev) => setPdfPhotoPlacementForEtappe(eIdx, ev.target.value as PdfPhotoPlacement)}
                              className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
                            >
                              <option value="afterHotel">Nach Hotel</option>
                              <option value="afterTeilstrecken">Nach Teilstrecken</option>
                              <option value="afterEntdecken">Nach Entdecken</option>
                            </select>
                            <select
                              value={pdfPhotoLayout}
                              onChange={(ev) => setPdfPhotoLayoutForEtappe(eIdx, ev.target.value as PdfPhotoLayout)}
                              className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
                            >
                              <option value="auto">Auto Layout</option>
                              <option value="onePerPageMax">1 Bild ganzseitig</option>
                              <option value="onePortraitTopHalf">1 Bild halbseitig oben</option>
                              <option value="onePortraitBottomHalf">1 Bild halbseitig unten</option>
                              <option value="twoPortraitSideBySide">2 Hochformat nebeneinander</option>
                              <option value="twoPortraitStacked">2 Hochformat oben/unten</option>
                              <option value="twoMixedStacked">1 Hoch + 1 Quer oben/unten</option>
                              <option value="sixPortraitGrid">6 Hochformat Grid</option>
                              <option value="threePortraitOneLandscape">3 Hoch + 1 Quer</option>
                              <option value="grid">Raster</option>
                              <option value="smartPages">Smart Pages</option>
                            </select>
                            <input
                              type="number"
                              min={1}
                              max={12}
                              value={pdfPhotoPages}
                              onChange={(ev) => setPdfPhotoPagesForEtappe(eIdx, Math.max(1, Math.min(12, Number(ev.target.value) || 1)))}
                              className="w-20 text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700"
                            />
                            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer">
                              <FolderOpen className="w-3.5 h-3.5" />
                              Fotos auswählen
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(ev) => {
                                  void addPickedPdfPhotosToEtappe(eIdx, ev.target.files);
                                  ev.currentTarget.value = "";
                                }}
                              />
                            </label>
                          </div>

                          {(selectedPdfPhotos.length > 0 || pdfPhotoLibrary.length > 0) && (
                            <div className="mt-3">
                              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Mediathek (klicken zum Aus-/Abwählen)
                              </p>
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {pdfPhotoLibrary.map((url, idx) => {
                                  const selected = selectedPdfPhotos.includes(url);
                                  return (
                                    <button
                                      key={`report-lib-${eIdx}-${idx}`}
                                      type="button"
                                      onClick={() => togglePdfPhotoForEtappe(eIdx, url)}
                                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                                        selected ? "border-indigo-500 ring-2 ring-indigo-200" : "border-gray-200 hover:border-indigo-300"
                                      }`}
                                    >
                                      <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-20 object-cover" />
                                      {selected && (
                                        <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white">
                                          <Check className="w-3 h-3" />
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Bucket List Tab */}
            {activeTab === "bucket" && (
              <div className="space-y-6">
                {/* My Bucket List */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Meine Bucket List ({trip.bucketList.length})
                  </h3>
                  {trip.bucketList.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">
                      Noch keine Orte. Stöbere unten in 1&apos;488 Sehenswürdigkeiten.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {trip.bucketList.map((item) => {
                        const isStop = trip.stops.some((s) => s.name === item.name);
                        return (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 bg-green-50 rounded-xl px-4 py-3"
                          >
                            <a
                              href={`https://www.google.com/maps/search/${encodeURIComponent(item.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-green-400 transition-all mt-0.5"
                              title="In Google Maps öffnen"
                            >
                              <MapPin className="w-4 h-4 text-green-600" />
                            </a>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">{item.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-gray-400">{item.category}</span>
                                {item.rating > 0 && (
                                  <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    {item.rating}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1.5">
                                {!isStop ? (
                                  <button
                                    onClick={() => addStopSmart(item.name)}
                                    className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Als Stopp
                                  </button>
                                ) : (
                                  <span className="flex items-center gap-1 text-[11px] font-medium text-green-600">
                                    <Check className="w-3 h-3" />
                                    In Route
                                  </span>
                                )}
                                <button
                                  onClick={() => removeFromBucketList(item.id)}
                                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                  Entfernen
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Landmark Explorer */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Sehenswürdigkeiten entdecken
                  </h3>

                  {/* Search */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Suche nach Ort, Land, Stadt..."
                      value={landmarkQuery}
                      onChange={(e) => setLandmarkQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => setLandmarkUnescoOnly(!landmarkUnescoOnly)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        landmarkUnescoOnly
                          ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      UNESCO
                    </button>
                    <select
                      value={landmarkContinent}
                      onChange={(e) => setLandmarkContinent(e.target.value)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border-0 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Alle Kontinente</option>
                      {CONTINENTS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select
                      value={landmarkCategory}
                      onChange={(e) => setLandmarkCategory(e.target.value)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border-0 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Alle Kategorien</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Results */}
                  {(() => {
                    const filtered = filterLandmarks(landmarks, {
                      query: landmarkQuery,
                      category: landmarkCategory,
                      continent: landmarkContinent,
                      unescoOnly: landmarkUnescoOnly,
                    });
                    const shown = filtered.slice(0, 30);
                    const inBucketNames = new Set(trip.bucketList.map((b) => b.name));

                    return (
                      <>
                        <p className="text-[11px] text-gray-400 mb-3">
                          {filtered.length} Ergebnis{filtered.length !== 1 ? "se" : ""}
                          {filtered.length > 30 && " (erste 30 angezeigt)"}
                        </p>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                          {shown.map((lm) => {
                            const inBucket = inBucketNames.has(lm.name);
                            const isStop = trip.stops.some((s) => s.name === lm.name);
                            return (
                              <div
                                key={lm.id}
                                className="flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-gray-50 transition-colors border border-gray-50"
                              >
                                <WikiThumb wikiTitle={lm.wikipediaTitleDe} alt={lm.name} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium text-gray-800 truncate">{lm.name}</p>
                                    {lm.unesco?.isWorldHeritage && (
                                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold rounded-full">
                                        UNESCO
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-400 mt-0.5">
                                    {lm.category} · {lm.city}, {lm.country}
                                  </p>
                                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{lm.description}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    {!inBucket ? (
                                      <button
                                        onClick={() =>
                                          addToBucketList({
                                            name: lm.name,
                                            category: lm.category,
                                            rating: 0,
                                            description: lm.description,
                                          })
                                        }
                                        className="flex items-center gap-1 text-[11px] font-medium text-green-600 hover:text-green-700"
                                      >
                                        <BookmarkPlus className="w-3 h-3" />
                                        Bucket List
                                      </button>
                                    ) : (
                                      <span className="flex items-center gap-1 text-[11px] font-medium text-green-600">
                                        <Check className="w-3 h-3" />
                                        Auf Liste
                                      </span>
                                    )}
                                    {!isStop && (
                                      <button
                                        onClick={() => addStopSmart(lm.name, lm.latitude, lm.longitude)}
                                        className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                                      >
                                        <Plus className="w-3 h-3" />
                                        Als Stopp
                                      </button>
                                    )}
                                    {isStop && (
                                      <span className="flex items-center gap-1 text-[11px] font-medium text-green-600">
                                        <Check className="w-3 h-3" />
                                        In Route
                                      </span>
                                    )}
                                    {lm.wikipediaTitleDe && (
                                      <a
                                        href={`https://de.wikipedia.org/wiki/${lm.wikipediaTitleDe}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] text-gray-400 hover:text-blue-500 transition-colors"
                                      >
                                        Wikipedia
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {!landmarksLoaded && (
                            <div className="text-center py-8">
                              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                              <p className="text-xs text-gray-400">Lade Sehenswürdigkeiten...</p>
                            </div>
                          )}
                          {landmarksLoaded && filtered.length === 0 && (
                            <div className="text-center py-8">
                              <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                              <p className="text-sm text-gray-400">Keine Ergebnisse gefunden.</p>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Flights Tab */}
            {activeTab === "flights" && (() => {
              const flightSearchParams = {
                origin: flightFrom,
                destination: flightTo,
                checkIn: flightDepart,
                checkOut: flightReturn,
                travelers: flightPassengers,
              };
              return (
              <div className="space-y-6">
                {/* Flight Search Form */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Flugsuche
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <AirportSelect
                        value={flightFrom}
                        onChange={setFlightFrom}
                        placeholder="z.B. Zürich"
                        label="Von"
                      />
                      <AirportSelect
                        value={flightTo}
                        onChange={setFlightTo}
                        placeholder="z.B. Barcelona"
                        label="Nach"
                      />
                    </div>

                    <DateRangePicker
                      startDate={flightDepart}
                      endDate={flightReturn}
                      onSelect={(s, e) => { setFlightDepart(s); setFlightReturn(e); }}
                      startLabel="Hinflug"
                      endLabel="Rückflug"
                    />

                    <div>
                      <label className="block text-[11px] font-medium text-gray-400 mb-1">Passagiere</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setFlightPassengers(Math.max(1, flightPassengers - 1))}
                          className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-sm font-medium text-gray-800 w-8 text-center">{flightPassengers}</span>
                        <button
                          onClick={() => setFlightPassengers(Math.min(9, flightPassengers + 1))}
                          className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Providers */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Google Flights",
                      desc: "Umfassender Preisvergleich",
                      color: "text-blue-700",
                      bg: "bg-blue-50",
                      link: buildGoogleFlightsLink(flightSearchParams),
                    },
                    {
                      name: "Booking.com Flights",
                      desc: "Direktbuchung mit Bestpreis",
                      color: "text-indigo-700",
                      bg: "bg-indigo-50",
                      link: buildBookingFlightsLink(flightSearchParams),
                    },
                    {
                      name: "Skyscanner",
                      desc: "Vergleicht hunderte Airlines",
                      color: "text-cyan-700",
                      bg: "bg-cyan-50",
                      link: buildSkyscannerLink(flightSearchParams),
                    },
                    {
                      name: "Kayak",
                      desc: "Flexible Suche & Preisalarm",
                      color: "text-orange-700",
                      bg: "bg-orange-50",
                      link: buildKayakLink(flightSearchParams),
                    },
                  ].map((provider) => (
                    <a
                      key={provider.name}
                      href={provider.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logAffiliateClick("flights", provider.name, provider.link)}
                      className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 ${provider.bg} rounded-xl flex items-center justify-center`}>
                          <Plane className={`w-6 h-6 ${provider.color}`} />
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{provider.name}</h4>
                      <p className="text-xs text-gray-400">{provider.desc}</p>
                      <div className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${provider.color} ${provider.bg} px-2.5 py-1 rounded-full`}>
                        <Search className="w-3 h-3" />
                        Flüge suchen
                      </div>
                    </a>
                  ))}
                </div>
              </div>
              );
            })()}

            {/* Car Tab - Affiliate Links */}
            {activeTab === "car" && (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Booking.com Cars",
                      desc: "Mietwagen weltweit vergleichen",
                      color: "text-blue-700",
                      bg: "bg-blue-50",
                      link: buildBookingCarsLink(searchParams),
                    },
                    {
                      name: "Rentalcars.com",
                      desc: "Über 900 Anbieter vergleichen",
                      color: "text-green-700",
                      bg: "bg-green-50",
                      link: buildRentalcarsLink(searchParams),
                    },
                    {
                      name: "billiger-mietwagen.de",
                      desc: "Deutscher Preisvergleich",
                      color: "text-orange-700",
                      bg: "bg-orange-50",
                      link: buildBilligerMietwagenLink(searchParams),
                    },
                  ].map((provider) => (
                    <a
                      key={provider.name}
                      href={provider.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logAffiliateClick("car", provider.name, provider.link)}
                      className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 ${provider.bg} rounded-xl flex items-center justify-center`}>
                          <Car className={`w-6 h-6 ${provider.color}`} />
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{provider.name}</h4>
                      <p className="text-xs text-gray-400 mb-3">{provider.desc}</p>
                      {destination && (
                        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 mb-3">
                          <span className="font-medium">{destination}</span>
                          {trip.startDate && ` · ab ${formatDate(trip.startDate)}`}
                        </div>
                      )}
                      <div className={`inline-flex items-center gap-1 text-xs font-medium ${provider.color} ${provider.bg} px-2.5 py-1 rounded-full`}>
                        <Search className="w-3 h-3" />
                        Mietwagen suchen
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Train Tab - Affiliate Links */}
            {activeTab === "train" && (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Trainline",
                      desc: "Europaweit Züge & Busse buchen",
                      color: "text-teal-700",
                      bg: "bg-teal-50",
                      link: buildTrainlineLink(searchParams),
                    },
                    {
                      name: "Omio",
                      desc: "Zug, Bus & Flug vergleichen",
                      color: "text-indigo-700",
                      bg: "bg-indigo-50",
                      link: buildOmioLink(searchParams),
                    },
                  ].map((provider) => (
                    <a
                      key={provider.name}
                      href={provider.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logAffiliateClick("train", provider.name, provider.link)}
                      className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 ${provider.bg} rounded-xl flex items-center justify-center`}>
                          <Train className={`w-6 h-6 ${provider.color}`} />
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{provider.name}</h4>
                      <p className="text-xs text-gray-400 mb-3">{provider.desc}</p>
                      {origin && destination && (
                        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 mb-3">
                          <span className="font-medium">{origin}</span>
                          <ArrowRight className="w-3 h-3 inline mx-1.5" />
                          <span className="font-medium">{destination}</span>
                          {trip.startDate && ` · ${formatDate(trip.startDate)}`}
                        </div>
                      )}
                      <div className={`inline-flex items-center gap-1 text-xs font-medium ${provider.color} ${provider.bg} px-2.5 py-1 rounded-full`}>
                        <Search className="w-3 h-3" />
                        Züge suchen
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* eSIM Tab */}
            {activeTab === "esim" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-pink-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-pink-800">
                        eSIM – Internet im Ausland
                      </p>
                      <p className="text-sm text-pink-600 mt-1">
                        Bleibe weltweit verbunden ohne teure Roaming-Kosten.
                        Kaufe eine eSIM vor der Abreise und aktiviere sie am Zielort.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Airalo",
                      desc: "200+ Länder & Regionen abgedeckt",
                      commission: "10–20%",
                      color: "text-blue-700",
                      bg: "bg-blue-50",
                      link: buildAiraloLink(destination),
                    },
                    {
                      name: "Holafly",
                      desc: "Unbegrenzte Daten in 100+ Ländern",
                      commission: "10–15%",
                      color: "text-green-700",
                      bg: "bg-green-50",
                      link: buildHolaflyLink(destination),
                    },
                    {
                      name: "Nomad eSIM",
                      desc: "Günstige Datentarife weltweit",
                      commission: "10–20%",
                      color: "text-purple-700",
                      bg: "bg-purple-50",
                      link: buildNomadEsimLink(destination),
                    },
                  ].map((provider) => (
                    <a
                      key={provider.name}
                      href={provider.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logAffiliateClick("esim", provider.name, provider.link)}
                      className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 ${provider.bg} rounded-xl flex items-center justify-center`}>
                          <Smartphone className={`w-6 h-6 ${provider.color}`} />
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{provider.name}</h4>
                      <p className="text-xs text-gray-400 mb-3">{provider.desc}</p>
                      {destination && (
                        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 mb-3">
                          Ziel: <span className="font-medium">{destination}</span>
                        </div>
                      )}
                      <div className={`inline-flex items-center gap-1 text-xs font-medium ${provider.color} ${provider.bg} px-2.5 py-1 rounded-full`}>
                        <Search className="w-3 h-3" />
                        eSIM finden
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Drone Maps Tab */}
            {activeTab === "droneMaps" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Map className="w-5 h-5 text-cyan-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-cyan-900">
                        Drohnenkarten Europa
                      </p>
                      <p className="text-sm text-cyan-700 mt-1">
                        Öffne die offiziellen Kartenportale für Flugzonen, Sperrgebiete und lokale Regeln.
                        Prüfe vor jedem Flug zusätzlich die aktuelle Gesetzeslage vor Ort.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      country: "Spanien",
                      name: "ENAIRE Drones",
                      desc: "Offizielle UAS-Karte für Spanien",
                      link: "https://drones.enaire.es/",
                      color: "text-orange-700",
                      bg: "bg-orange-50",
                    },
                    {
                      country: "Portugal",
                      name: "ANAC Zonenkarte",
                      desc: "Geografische UAS-Zonen (Portugal)",
                      link: "https://www.anac.pt/vPT/Generico/drones/zona_proibidas_condicionadas/Paginas/Zonasproibidasoucondicionadas.aspx",
                      color: "text-emerald-700",
                      bg: "bg-emerald-50",
                    },
                    {
                      country: "Frankreich",
                      name: "Geoportail Drones",
                      desc: "Karte mit Drohnen-Einschränkungen",
                      link: "https://www.geoportail.gouv.fr/donnees/restrictions-pour-drones-de-loisir",
                      color: "text-indigo-700",
                      bg: "bg-indigo-50",
                    },
                    {
                      country: "Schweiz",
                      name: "FOCA Drone Map",
                      desc: "BAZL-Karte für Drohnenzonen",
                      link: "https://map.geo.admin.ch/#/map?lang=de&topic=aviation&layers=ch.bazl.einschraenkungen-drohnen",
                      color: "text-rose-700",
                      bg: "bg-rose-50",
                    },
                  ].map((item) => (
                    <a
                      key={item.country}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logAffiliateClick("droneMaps", item.name, item.link)}
                      className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center`}>
                          <Map className={`w-6 h-6 ${item.color}`} />
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{item.country}</p>
                      <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                      <p className="text-xs text-gray-500 mb-3">{item.desc}</p>
                      <div className={`inline-flex items-center gap-1 text-xs font-medium ${item.color} ${item.bg} px-2.5 py-1 rounded-full`}>
                        <Map className="w-3 h-3" />
                        Karte öffnen
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* POI Tab */}
            {activeTab === "poi" && (
              <div className="space-y-6">
                {/* Mode Switcher */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setPoiScope("ai")}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all ${
                      poiScope === "ai"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-purple-50"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    KI-Empfehlungen
                  </button>
                  <button
                    onClick={() => { setPoiScope("route"); setPoisSearchedFor(""); }}
                    className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all ${
                      poiScope === "route"
                        ? "bg-green-600 text-white shadow-sm"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-green-50"
                    }`}
                  >
                    <Route className="w-3.5 h-3.5" />
                    Google Places
                  </button>
                  {destination && (
                    <button
                      onClick={() => { setPoiScope("destination"); setPoisSearchedFor(""); }}
                      className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-all ${
                        poiScope === "destination"
                          ? "bg-green-600 text-white shadow-sm"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-green-50"
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Nur {destination}
                    </button>
                  )}
                </div>

                {/* AI Recommendations Mode */}
                {poiScope === "ai" && (
                  <div className="space-y-5">
                    {/* Interest Selection */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-5">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-800">
                            Was interessiert dich?
                          </p>
                          <p className="text-xs text-purple-600 mt-1 mb-3">
                            Wähle deine Interessen -- die KI empfiehlt passende Orte entlang jeder Etappe.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {interestOptions.map((opt) => {
                              const active = (trip.interests || []).includes(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => toggleInterest(opt.id)}
                                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                                    active
                                      ? "bg-purple-600 text-white shadow-sm"
                                      : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                                  }`}
                                >
                                  <span>{opt.emoji}</span>
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Error */}
                    {aiPoisError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                        {aiPoisError}
                      </div>
                    )}

                    {/* Etappen with per-etappe AI buttons */}
                    {etappen.length > 0 ? (
                      <div className="space-y-4">
                        {/* All-in-one button */}
                        {etappen.length > 1 && (
                          <button
                            onClick={loadAllAiPois}
                            disabled={aiPoisLoading}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {aiPoisLoading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                KI analysiert alle Etappen...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Alle Etappen auf einmal
                              </>
                            )}
                          </button>
                        )}

                        {etappen.map((etappe, eIdx) => {
                          const suggestions = aiPois.filter((p) => p.etappeIndex === eIdx);
                          const isLoading = aiLoadingEtappe === eIdx;
                          const selectedDiscoveries = getAiDiscoveriesForEtappe(eIdx);
                          const selectedPdfPhotos = getSelectedPdfPhotosForEtappe(eIdx);
                          const pdfPhotoLibrary = getPdfPhotoLibraryForEtappe(eIdx);
                          const pdfPhotoPlacement = trip.pdfPhotoPlacementByEtappe?.[String(eIdx)] || "afterEntdecken";
                          const pdfPhotoLayout = trip.pdfPhotoLayoutByEtappe?.[String(eIdx)] || "auto";
                          const pdfPhotoPages = trip.pdfPhotoPagesByEtappe?.[String(eIdx)] || 1;
                          const targetPagesInput = photoTargetPagesByEtappe[eIdx] || pdfPhotoPages || 1;
                          const layoutSourcePhotos = selectedPdfPhotos.length > 0 ? selectedPdfPhotos : pdfPhotoLibrary;
                          const recommendedLayouts = getRecommendedPdfLayouts(layoutSourcePhotos);
                          const effectivePreviewLayout = pdfPhotoLayout === "auto" ? (recommendedLayouts[0] || "grid") : pdfPhotoLayout;
                          const layoutChoices = Array.from(new Set([pdfPhotoLayout, ...recommendedLayouts]));
                          const isLayoutActive = (layout: PdfPhotoLayout) =>
                            pdfPhotoLayout === layout || (pdfPhotoLayout === "auto" && effectivePreviewLayout === layout);
                          const isCustomTabActive = openCustomStopEtappe === eIdx;
                          const isPhotoTabActive = openPhotoPickerEtappe === eIdx;
                          const isDiscoverTabActive = !isCustomTabActive && !isPhotoTabActive;
                          const activeTabSurfaceClass = isCustomTabActive
                            ? "border-purple-200 border-b-purple-50 bg-purple-50"
                            : isPhotoTabActive
                            ? "border-indigo-200 border-b-indigo-50 bg-indigo-50"
                            : "border-purple-200 border-b-white bg-white";
                          const etappeActionTabClass = (isActive: boolean) =>
                            isActive
                              ? `relative z-10 flex items-center gap-1.5 px-3 pt-2 pb-4 -mb-4 rounded-t-lg rounded-b-none text-xs font-medium transition-all ${activeTabSurfaceClass} text-indigo-700 border`
                              : "flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg rounded-bl-lg rounded-br-none text-xs font-medium transition-all border border-white/20 bg-white/15 hover:bg-white/25 text-white";
                          const renderLayoutSlot = (layout: PdfPhotoLayout, slotIdx: number, className = "") => {
                            const url = selectedPdfPhotos[slotIdx];
                            const canDragDrop = isLayoutActive(layout);
                            return (
                              <div
                                className={`border rounded ${url ? "border-gray-300" : "border-dashed border-gray-200"} ${className}`}
                                onDragOver={(ev) => {
                                  if (!canDragDrop) return;
                                  ev.preventDefault();
                                }}
                                onDrop={(ev) => {
                                  if (!canDragDrop) return;
                                  ev.preventDefault();
                                  const fromRaw = ev.dataTransfer.getData("text/plain");
                                  const fromIndex = Number(fromRaw);
                                  if (Number.isFinite(fromIndex)) {
                                    movePdfPhotoSlot(eIdx, fromIndex, slotIdx);
                                  }
                                  setDraggingPhotoSlotByEtappe((prev) => ({ ...prev, [eIdx]: null }));
                                }}
                                title={canDragDrop ? "Foto hierhin ziehen" : undefined}
                              >
                                {url ? (
                                  <img
                                    src={url}
                                    alt={`Layout ${slotIdx + 1}`}
                                    className={`w-full h-full object-contain ${draggingPhotoSlotByEtappe[eIdx] === slotIdx ? "opacity-40" : ""}`}
                                    draggable={canDragDrop}
                                    onDragStart={(ev) => {
                                      if (!canDragDrop) return;
                                      ev.dataTransfer.setData("text/plain", String(slotIdx));
                                      setDraggingPhotoSlotByEtappe((prev) => ({ ...prev, [eIdx]: slotIdx }));
                                    }}
                                    onDragEnd={() => setDraggingPhotoSlotByEtappe((prev) => ({ ...prev, [eIdx]: null }))}
                                  />
                                ) : null}
                              </div>
                            );
                          };
                          return (
                            <div key={eIdx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-5 py-3 flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-white/70 font-medium">Etappe {eIdx + 1} · {etappe.distanceKm} km · {etappe.durationFormatted}</p>
                                  <p className="text-sm text-white font-semibold">{etappe.from} → {etappe.to}</p>
                                </div>
                                <div className="flex items-end gap-2">
                                  <button
                                    onClick={() => {
                                      setOpenCustomStopEtappe((prev) => (prev === eIdx ? null : prev));
                                      void loadAiPoisForEtappe(eIdx);
                                    }}
                                    disabled={isLoading || aiPoisLoading}
                                    className={`${etappeActionTabClass(isDiscoverTabActive)} disabled:opacity-50`}
                                  >
                                    {isLoading ? (
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Sparkles className="w-3 h-3" />
                                    )}
                                    {suggestions.length > 0 ? "Neu" : "Entdecken"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setOpenCustomStopEtappe((prev) => (prev === eIdx ? null : eIdx));
                                    }}
                                    className={etappeActionTabClass(isCustomTabActive)}
                                  >
                                    <Plus className="w-3 h-3" />
                                    Eigener Stopp
                                  </button>
                                  <button
                                    onClick={() => setOpenEtappeMapIndex(eIdx)}
                                    disabled={suggestions.length === 0}
                                    className={`${etappeActionTabClass(false)} disabled:opacity-40 disabled:cursor-not-allowed`}
                                    title={suggestions.length > 0 ? "Etappenkarte öffnen" : "Zuerst Highlights laden"}
                                  >
                                    <Map className="w-3 h-3" />
                                    Karte
                                  </button>
                                </div>
                              </div>
                              {openPhotoPickerEtappe === eIdx && (
                                <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                                  <div className="flex items-center justify-between gap-3 mb-3">
                                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                                      PDF Fotos für Etappe {eIdx + 1}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={pdfPhotoPlacement}
                                        onChange={(ev) => setPdfPhotoPlacementForEtappe(eIdx, ev.target.value as PdfPhotoPlacement)}
                                        className="text-xs px-2 py-1 rounded-lg border border-indigo-200 bg-white text-gray-700"
                                      >
                                        <option value="afterHotel">Nach Hotel</option>
                                        <option value="afterTeilstrecken">Nach Teilstrecken</option>
                                        <option value="afterEntdecken">Nach Entdecken</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div className="text-xs text-indigo-700 mb-3">
                                    Wähle Fotos direkt vom Gerät: auf Mac aus Fotos/Dateien, auf Windows aus Explorer/Bildern.
                                  </div>
                                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer">
                                    <FolderOpen className="w-3.5 h-3.5" />
                                    Fotos auswählen
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      onChange={(ev) => {
                                        void addPickedPdfPhotosToEtappe(eIdx, ev.target.files);
                                        ev.currentTarget.value = "";
                                      }}
                                    />
                                  </label>
                                  <div className="mt-3 flex items-center gap-2">
                                    <input
                                      type="number"
                                      min={1}
                                      max={12}
                                      value={targetPagesInput}
                                      onChange={(ev) =>
                                        setPhotoTargetPagesByEtappe((prev) => ({
                                          ...prev,
                                          [eIdx]: Math.max(1, Math.min(12, Number(ev.target.value) || 1)),
                                        }))
                                      }
                                      className="w-20 text-xs px-2 py-1.5 rounded-lg border border-indigo-200 bg-white text-gray-700"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPdfPhotoLayoutForEtappe(eIdx, "smartPages");
                                        setPdfPhotoPagesForEtappe(eIdx, targetPagesInput);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-indigo-300 text-indigo-700 text-xs font-semibold hover:bg-indigo-100"
                                    >
                                      Auf Anz. Seiten verteilen
                                    </button>
                                  </div>
                                  {(selectedPdfPhotos.length > 0 || pdfPhotoLibrary.length > 0) && (
                                    <>
                                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {layoutChoices.filter((layout) => layout !== "auto").map((layout) => (
                                          <button
                                            key={`${eIdx}-${layout}`}
                                            type="button"
                                            onClick={() => setPdfPhotoLayoutForEtappe(eIdx, layout)}
                                            className={`rounded-xl border p-3 text-left transition-all ${
                                              pdfPhotoLayout === layout || (pdfPhotoLayout === "auto" && effectivePreviewLayout === layout)
                                                ? "border-indigo-500 ring-2 ring-indigo-200 bg-white"
                                                : "border-indigo-200 bg-white hover:border-indigo-300"
                                            }`}
                                          >
                                            <div className="w-full aspect-[1/1.414] border border-gray-300 rounded bg-white p-2">
                                              {layout === "onePerPageMax" && renderLayoutSlot(layout, 0, "w-full h-full border-2")}
                                              {layout === "onePortraitTopHalf" && (
                                                <div className="w-full h-full grid grid-rows-2 gap-1">
                                                  {renderLayoutSlot(layout, 0, "border-2")}
                                                  <div className="border border-dashed border-gray-200 rounded" />
                                                </div>
                                              )}
                                              {layout === "onePortraitBottomHalf" && (
                                                <div className="w-full h-full grid grid-rows-2 gap-1">
                                                  <div className="border border-dashed border-gray-200 rounded" />
                                                  {renderLayoutSlot(layout, 0, "border-2")}
                                                </div>
                                              )}
                                              {layout === "twoPortraitSideBySide" && (
                                                <div className="w-full h-full grid grid-cols-2 gap-1">
                                                  {renderLayoutSlot(layout, 0, "h-full")}
                                                  {renderLayoutSlot(layout, 1, "h-full")}
                                                </div>
                                              )}
                                              {layout === "twoPortraitStacked" && (
                                                <div className="w-full h-full grid grid-rows-2 gap-1">
                                                  {renderLayoutSlot(layout, 0)}
                                                  {renderLayoutSlot(layout, 1)}
                                                </div>
                                              )}
                                              {layout === "twoMixedStacked" && (
                                                <div className="w-full h-full grid grid-rows-2 gap-1">
                                                  {renderLayoutSlot(layout, 0, "mx-6")}
                                                  {renderLayoutSlot(layout, 1)}
                                                </div>
                                              )}
                                              {layout === "sixPortraitGrid" && (
                                                <div className="w-full h-full grid grid-cols-3 gap-1">
                                                  {Array.from({ length: 6 }).map((_, i) => (
                                                    <div key={i}>{renderLayoutSlot(layout, i)}</div>
                                                  ))}
                                                </div>
                                              )}
                                              {layout === "threePortraitOneLandscape" && (
                                                <div className="w-full h-full grid grid-cols-3 gap-1">
                                                  {renderLayoutSlot(layout, 0, "h-full")}
                                                  {renderLayoutSlot(layout, 1, "h-full")}
                                                  {renderLayoutSlot(layout, 2, "h-full")}
                                                  <div className="col-span-3 h-10 mt-1">{renderLayoutSlot(layout, 3, "h-full")}</div>
                                                </div>
                                              )}
                                              {layout === "grid" && (
                                                <div className="w-full h-full grid grid-cols-3 gap-1">
                                                  {Array.from({ length: 6 }).map((_, i) => (
                                                    <div key={i}>{renderLayoutSlot(layout, i)}</div>
                                                  ))}
                                                </div>
                                              )}
                                              {layout === "smartPages" && (
                                                <div className="w-full h-full grid grid-cols-2 gap-1">
                                                  <div className="h-12">{renderLayoutSlot(layout, 0, "h-full")}</div>
                                                  <div className="h-12">{renderLayoutSlot(layout, 1, "h-full")}</div>
                                                  <div className="col-span-2 h-16">{renderLayoutSlot(layout, 2, "h-full")}</div>
                                                </div>
                                              )}
                                            </div>
                                            <p className="mt-2 text-xs font-semibold text-indigo-800">
                                              {layout === "onePerPageMax" && "1 Bild ganzseitig"}
                                              {layout === "onePortraitTopHalf" && "1 Bild halbseitig oben"}
                                              {layout === "onePortraitBottomHalf" && "1 Bild halbseitig unten"}
                                              {layout === "twoPortraitSideBySide" && "2 Hochformat nebeneinander"}
                                              {layout === "twoPortraitStacked" && "2 Hochformat oben/unten"}
                                              {layout === "twoMixedStacked" && "1 Hoch + 1 Quer oben/unten"}
                                              {layout === "sixPortraitGrid" && "6 Hochformat (3 oben / 3 unten)"}
                                              {layout === "threePortraitOneLandscape" && "3 Hochformat + 1 Quer (unten)"}
                                              {layout === "grid" && "Raster (variabel)"}
                                              {layout === "smartPages" && "Automatisch auf Seiten verteilen"}
                                            </p>
                                          </button>
                                        ))}
                                      </div>

                                      <div className="mt-3">
                                        <p className="text-[11px] font-semibold text-indigo-700 mb-2 uppercase tracking-wide">
                                          Mediathek (erneut verwendbar)
                                        </p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                          {pdfPhotoLibrary.map((url, idx) => (
                                            <button
                                              key={`lib-${idx}`}
                                              type="button"
                                              onClick={() => assignPhotoToEtappeSlot(eIdx, url)}
                                              className="relative rounded-lg overflow-hidden border-2 border-indigo-200 bg-white hover:border-indigo-400 transition-all"
                                              title="In nächster freier Position einsetzen"
                                            >
                                              <div className="w-full h-20 p-1">
                                                <img src={url} alt={`Mediathek ${idx + 1}`} className="w-full h-full object-contain" />
                                              </div>
                                              {selectedPdfPhotos.includes(url) && (
                                                <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full p-1">
                                                  <Check className="w-3 h-3" />
                                                </div>
                                              )}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                    </>
                                  )}
                                </div>
                              )}
                              {openCustomStopEtappe === eIdx && (
                                <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={customStopQuery[eIdx] || ""}
                                      onChange={(e) => setCustomStopQuery((prev) => ({ ...prev, [eIdx]: e.target.value }))}
                                      placeholder="Ort/POI suchen (Wikipedia)"
                                      className="flex-1 px-3 py-2 rounded-lg border border-purple-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          void searchCustomDiscovery(eIdx);
                                        }
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => void searchCustomDiscovery(eIdx)}
                                      disabled={!!customStopLoading[eIdx]}
                                      className="px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50"
                                    >
                                      {customStopLoading[eIdx] ? "Suche..." : "Suchen"}
                                    </button>
                                  </div>
                                  {customStopResult[eIdx] && (
                                    <div className="mt-3 rounded-xl bg-white border border-purple-100 p-3">
                                      {(() => {
                                        const actionKey = customStopActionKey(eIdx, customStopResult[eIdx]!.name);
                                        const customIsAdding = !!addingCustomStops[actionKey];
                                        const customAddedState = isDiscoveryLinkedInCurrentRoute(eIdx, customStopResult[eIdx]!.name);
                                        return (
                                      <div className="flex items-start gap-3">
                                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-purple-100 flex-shrink-0">
                                          {customStopResult[eIdx]?.photoUrl ? (
                                            <img
                                              src={customStopResult[eIdx]!.photoUrl}
                                              alt={customStopResult[eIdx]!.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                              <Compass className="w-5 h-5 text-purple-500" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold text-gray-900">{customStopResult[eIdx]!.name}</p>
                                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-5">{customStopResult[eIdx]!.description}</p>
                                          <div className="flex items-center gap-3 mt-2">
                                            <button
                                              type="button"
                                              onClick={() => void addCustomDiscoveryToRoute(eIdx)}
                                              disabled={customIsAdding || customAddedState}
                                              className={`text-[11px] font-semibold transition-colors ${
                                                customAddedState
                                                  ? "text-emerald-700 cursor-default"
                                                  : customIsAdding
                                                  ? "text-blue-500"
                                                  : "text-blue-600 hover:text-blue-700"
                                              }`}
                                            >
                                              {customAddedState ? "Als Stopp eingefügt" : customIsAdding ? "Wird als Stopp eingefügt..." : "+ Als Stopp einfügen"}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                addToBucketList({
                                                  name: customStopResult[eIdx]!.name,
                                                  category: "Eigener Stopp",
                                                  rating: 0,
                                                  description: customStopResult[eIdx]!.description,
                                                })
                                              }
                                              className="text-[11px] font-medium text-gray-500 hover:text-green-600"
                                            >
                                              Zur Bucket List
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              )}
                              {selectedDiscoveries.length > 0 && (
                                <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                                    <Check className="w-3.5 h-3.5" />
                                    Aus Entdecken übernommen ({selectedDiscoveries.length})
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedDiscoveries.map((stop) => (
                                      <span
                                        key={stop.id}
                                        className="inline-flex items-center gap-1 rounded-full bg-white border border-emerald-200 px-2.5 py-1 text-[11px] text-emerald-700"
                                        title={stop.discoveryDescription || stop.name}
                                      >
                                        <Check className="w-3 h-3" />
                                        {stop.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {suggestions.length > 0 && (
                                <div className="divide-y divide-gray-50">
                                  {suggestions.map((poi, pIdx) => {
                                    const inBucket = isInBucketList(poi.name);
                                    const photoUrl = aiPoiPhotos[poi.name];
                                    const actionKey = aiStopActionKey(eIdx, poi.name);
                                    const isAddingStop = !!addingAiStops[actionKey];
                                    const inRoute = isInCurrentRoute(poi.name);
                                    const justAdded = !!addedAiStops[actionKey];
                                    return (
                                      <div key={pIdx} className="p-4 hover:bg-purple-50/30 transition-colors">
                                        <div className="flex items-start gap-3">
                                          <a
                                            href={`https://www.google.com/maps/search/${encodeURIComponent(poi.name)}${poi.lat != null && poi.lng != null ? `/@${poi.lat},${poi.lng},14z` : ""}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-shrink-0"
                                            title="In Google Maps öffnen"
                                          >
                                            {photoUrl ? (
                                              <div className="w-16 h-16 rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-400 transition-all">
                                                <img src={photoUrl} alt={poi.name} className="w-full h-full object-cover" />
                                              </div>
                                            ) : (
                                              <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center hover:ring-2 hover:ring-purple-400 transition-all">
                                                <Compass className="w-6 h-6 text-purple-400" />
                                              </div>
                                            )}
                                          </a>
                                          <div className="flex-1 min-w-0">
                                          <h4 className="text-sm font-semibold text-gray-900">{poi.name}</h4>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-medium text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">{poi.category}</span>
                                            {poi.detourMinutes != null && (
                                              <span className="text-[10px] text-gray-400">
                                                <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                                                ~{poi.detourMinutes} Min. Abstecher
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{poi.description}</p>
                                          <div className="flex items-center gap-3 mt-2.5">
                                            <button
                                              onClick={() => void addAiPoiToRoute(poi, eIdx)}
                                              disabled={isAddingStop || inRoute}
                                              className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                                                inRoute || justAdded
                                                  ? "text-emerald-600"
                                                  : "text-blue-600 hover:text-blue-700"
                                              } disabled:opacity-80 disabled:cursor-not-allowed`}
                                            >
                                              {isAddingStop ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                              ) : inRoute || justAdded ? (
                                                <Check className="w-3 h-3" />
                                              ) : (
                                                <Plus className="w-3 h-3" />
                                              )}
                                              {isAddingStop
                                                ? "Wird hinzugefügt..."
                                                : inRoute
                                                ? "Bereits in Route"
                                                : justAdded
                                                ? "Hinzugefügt"
                                                : "Als Stopp einfügen"}
                                            </button>
                                            <button
                                              onClick={() =>
                                                inBucket
                                                  ? removeFromBucketList(trip.bucketList.find((b) => b.name === poi.name)!.id)
                                                  : addToBucketList({ name: poi.name, category: poi.category, rating: 0, description: poi.description })
                                              }
                                              className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                                                inBucket ? "text-green-600" : "text-gray-400 hover:text-green-600"
                                              }`}
                                            >
                                              {inBucket ? <Check className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                                              {inBucket ? "In Bucket List" : "Zur Bucket List"}
                                            </button>
                                          </div>
                                        </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {suggestions.length === 0 && !isLoading && (
                                <div className="px-5 py-4 text-xs text-gray-400 text-center">
                                  Klicke «Entdecken» für KI-Empfehlungen auf dieser Etappe
                                </div>
                              )}
                              {isLoading && (
                                <div className="px-5 py-6 flex items-center justify-center gap-2 text-purple-500">
                                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs">KI sucht Empfehlungen...</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Route className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">Erstelle zuerst eine Route mit Hotelstopps, um KI-Empfehlungen pro Etappe zu erhalten.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Google Places Mode */}
                {(poiScope === "route" || poiScope === "destination") && (
                  <div className="space-y-5">
                    {/* Aktivitäten-Anbieter */}
                    {destination && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          Touren & Aktivitäten buchen
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-4 mb-6">
                          <a
                            href={buildGetYourGuideLink(destination)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                              logAffiliateClick("activities", "GetYourGuide", buildGetYourGuideLink(destination))
                            }
                            className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-orange-600" />
                              </div>
                              <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1">GetYourGuide</h4>
                            <p className="text-xs text-gray-400 mb-3">Touren, Tickets & Aktivitäten</p>
                            <div className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full">
                              <Search className="w-3 h-3" />
                              Aktivitäten entdecken
                            </div>
                          </a>
                          <a
                            href={buildViatorLink(destination)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                              logAffiliateClick("activities", "Viator", buildViatorLink(destination))
                            }
                            className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                <Compass className="w-6 h-6 text-green-600" />
                              </div>
                              <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1">Viator</h4>
                            <p className="text-xs text-gray-400 mb-3">Erlebnisse & Touren von TripAdvisor</p>
                            <div className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                              <Search className="w-3 h-3" />
                              Touren entdecken
                            </div>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Dynamic POIs */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                          {poiScope === "route" ? "Entlang der Route" : destination ? `In ${destination}` : "Sehenswürdigkeiten"}
                          {pois.length > 0 && ` (${pois.length})`}
                        </h3>
                        {!poisLoading && pois.length > 0 && (
                          <button
                            onClick={() => { setPoisSearchedFor(""); loadPOIs(poiScope as "route" | "destination"); }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Aktualisieren
                          </button>
                        )}
                      </div>

                      {poisLoading && (
                        <div className="flex items-center justify-center py-12">
                          <div className="flex items-center gap-3 text-gray-400">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Sehenswürdigkeiten werden geladen...</span>
                          </div>
                        </div>
                      )}

                      {!poisLoading && !destination && (
                        <div className="text-center py-8">
                          <MapPin className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-sm text-gray-400">Gib ein Reiseziel ein, um Sehenswürdigkeiten zu entdecken.</p>
                        </div>
                      )}

                      {!poisLoading && destination && displayPOIs.length === 0 && (
                        <div className="text-center py-8">
                          <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-sm text-gray-400">Keine Sehenswürdigkeiten gefunden.</p>
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-4">
                        {displayPOIs.map((poi) => {
                          const added = isInBucketList(poi.name);
                          return (
                            <div
                              key={poi.name}
                              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group overflow-hidden"
                            >
                              {poi.photoUrl && (
                                <div className="h-36 w-full overflow-hidden">
                                  <img
                                    src={poi.photoUrl}
                                    alt={poi.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              )}
                              <div className="p-5">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                      {poi.name}
                                    </h4>
                                    <span className="text-xs text-gray-400">{poi.category}</span>
                                  </div>
                                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                    <span className="text-xs font-medium text-yellow-700">{poi.rating.toFixed(1)}</span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2">{poi.description}</p>
                                <button
                                  onClick={() =>
                                    added
                                      ? removeFromBucketList(trip.bucketList.find((b) => b.name === poi.name)!.id)
                                      : addToBucketList(poi)
                                  }
                                  className={`mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                                    added ? "text-green-600" : "text-blue-600 hover:text-blue-700"
                                  }`}
                                >
                                  {added ? (
                                    <><Check className="w-3.5 h-3.5" /> In Bucket List</>
                                  ) : (
                                    <><Plus className="w-3.5 h-3.5" /> Zur Bucket List</>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Insurance Tab */}
            {activeTab === "insurance" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Reiseversicherung
                      </p>
                      <p className="text-sm text-red-600 mt-1">
                        Schütze deine Reise mit einer passenden Versicherung.
                        Reiserücktritt, Krankenversicherung und Gepäckschutz – alles in einem.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Allianz Travel",
                      desc: "Umfassender Reiseschutz vom Marktführer",
                      features: ["Reiserücktritt", "Krankenversicherung", "Gepäckschutz"],
                      color: "text-blue-700",
                      bg: "bg-blue-50",
                      link: buildAllianzTravelLink(),
                    },
                    {
                      name: "World Nomads",
                      desc: "Flexibel für Abenteurer & Backpacker",
                      features: ["Outdoor-Aktivitäten", "Flexible Laufzeit", "Weltweit"],
                      color: "text-green-700",
                      bg: "bg-green-50",
                      link: buildWorldNomadsLink(),
                    },
                    {
                      name: "ERGO Reiseversicherung",
                      desc: "Deutsche Qualität, faire Preise",
                      features: ["Familientarife", "Jahresschutz", "Storno-Schutz"],
                      color: "text-red-700",
                      bg: "bg-red-50",
                      link: "https://www.ergo.de/reiseversicherung",
                    },
                  ].map((provider) => (
                    <a
                      key={provider.name}
                      href={provider.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => logAffiliateClick("insurance", provider.name, provider.link)}
                      className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 ${provider.bg} rounded-xl flex items-center justify-center`}>
                          <Shield className={`w-6 h-6 ${provider.color}`} />
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{provider.name}</h4>
                      <p className="text-xs text-gray-400 mb-3">{provider.desc}</p>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {provider.features.map((f) => (
                          <span key={f} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md">
                            {f}
                          </span>
                        ))}
                      </div>
                      <div className={`inline-flex items-center gap-1 text-xs font-medium ${provider.color} ${provider.bg} px-2.5 py-1 rounded-full`}>
                        <Search className="w-3 h-3" />
                        Angebote ansehen
                      </div>
                    </a>
                  ))}
                </div>

                {showTips && trip.travelers > 1 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <p className="text-sm text-amber-700">
                      <strong>Tipp:</strong> Mit {trip.travelers} Reisenden lohnt sich oft ein Familientarif
                      oder eine Gruppenversicherung.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDur(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}
