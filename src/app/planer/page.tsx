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
  CircleDot,
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
} from "lucide-react";
import Link from "next/link";
import {
  Trip,
  TravelMode,
  TravelInterest,
  AiPoiSuggestion,
  RouteStop,
  BucketListItem,
  RouteLegInfo,
  Etappe,
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
import {
  buildBookingHotelLink,
  buildExpediaHotelLink,
  buildHotelsComLink,
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [activeTab, setActiveTab] = useState<
    "route" | "hotels" | "flights" | "car" | "poi" | "bucket" | "esim" | "train" | "insurance" | "timeline"
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
  const [landmarksLoaded, setLandmarksLoaded] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  // Load active trip or create new one
  useEffect(() => {
    const activeId = getActiveTripId();
    if (activeId) {
      const existing = getTrip(activeId);
      if (existing) {
        setTrip(existing);
      }
    }
    setSavedTrips(getAllTrips());
  }, []);

  // Auto-save after 3 seconds of inactivity
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 3000);
    return () => clearTimeout(timer);
  }, [trip, hasUnsavedChanges]);

  const updateTrip = useCallback((updates: Partial<Trip>) => {
    setTrip((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
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

  const handleNewTrip = () => {
    if (hasUnsavedChanges) {
      handleSave();
    }
    const newTrip = createNewTrip();
    setTrip(newTrip);
    setActiveTripId(newTrip.id);
    setHasUnsavedChanges(false);
    setShowTripList(false);
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

  const addStop = () => {
    const newStop: RouteStop = {
      id: `stop-${Date.now()}`,
      name: "",
      type: "stop",
    };
    const endIdx = trip.stops.findIndex((s) => s.type === "end");
    const newStops = [...trip.stops];
    newStops.splice(endIdx, 0, newStop);
    updateTrip({ stops: newStops });
  };

  const addStopFromMap = (placeName: string, lat: number, lng: number, insertAtIndex?: number) => {
    const newStop: RouteStop = {
      id: `stop-${Date.now()}`,
      name: placeName,
      type: "stop",
      lat,
      lng,
    };
    const newStops = [...trip.stops];
    if (insertAtIndex != null && insertAtIndex >= 0 && insertAtIndex <= newStops.length) {
      newStops.splice(insertAtIndex, 0, newStop);
    } else {
      const endIdx = newStops.findIndex((s) => s.type === "end");
      newStops.splice(endIdx, 0, newStop);
    }
    updateTrip({ stops: newStops });
  };

  const addStopSmart = async (name: string, lat?: number, lng?: number) => {
    const newStop: RouteStop = { id: `stop-${Date.now()}`, name, type: "stop", lat, lng };
    const existingStops = trip.stops.filter((s) => s.name.trim());
    if (existingStops.length < 2 || lat == null || lng == null) {
      const newStops = [...trip.stops];
      const endIdx = newStops.findIndex((s) => s.type === "end");
      newStops.splice(endIdx >= 0 ? endIdx : newStops.length, 0, newStop);
      updateTrip({ stops: newStops });
      return;
    }
    const coords = await Promise.all(
      trip.stops.map(async (s) => {
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
    const finalStops: RouteStop[] = coords.map((s, i) => ({ ...trip.stops[i], lat: s.lat, lng: s.lng }));
    finalStops.splice(bestIdx, 0, newStop);
    updateTrip({ stops: finalStops });
  };

  const removeStop = (id: string) => {
    updateTrip({ stops: trip.stops.filter((s) => s.id !== id) });
  };

  const updateStop = (id: string, name: string) => {
    updateTrip({
      stops: trip.stops.map((s) => (s.id === id ? { ...s, name } : s)),
    });
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
    const stopIdx = trip.stops.findIndex((s) => s.id === id);
    if (stopIdx < 0) return;
    const stop = trip.stops[stopIdx];
    if (stop.type !== "stop") {
      updateTrip({ stops: trip.stops.map((s) => (s.id === id ? { ...s, name, lat, lng } : s)) });
      return;
    }

    const newStops = trip.stops.filter((s) => s.id !== id);
    const updatedStop: RouteStop = { ...stop, name, lat, lng };

    const filledStops = newStops.filter((s) => s.name.trim());
    if (filledStops.length < 2) {
      const endIdx = newStops.findIndex((s) => s.type === "end");
      newStops.splice(endIdx >= 0 ? endIdx : newStops.length, 0, updatedStop);
      updateTrip({ stops: newStops });
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
    updateTrip({ stops: finalStops });
  };

  const updateStopField = (id: string, fields: Partial<RouteStop>) => {
    updateTrip({
      stops: trip.stops.map((s) => (s.id === id ? { ...s, ...fields } : s)),
    });
  };

  const toggleHotel = (id: string) => {
    updateTrip({
      stops: trip.stops.map((s) =>
        s.id === id ? { ...s, isHotel: !s.isHotel } : s
      ),
    });
  };

  const etappen: Etappe[] = (() => {
    if (!routeInfo?.legs?.length) return [];

    const hotelStops = trip.stops.filter((s) => s.type === "stop" && s.isHotel && s.name.trim());
    const hotelStopNames = hotelStops.map((s) => s.name.toLowerCase());

    if (hotelStopNames.length === 0) {
      const totalKm = routeInfo.legs.reduce((sum, l) => sum + l.distanceMeters, 0);
      const totalSec = routeInfo.legs.reduce((sum, l) => sum + l.durationSeconds, 0);
      const startName = trip.stops.find((s) => s.type === "start")?.name || "Start";
      const endName = trip.stops.find((s) => s.type === "end")?.name || "Ziel";
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
    const startName = trip.stops.find((s) => s.type === "start")?.name || "Start";
    let etappeFrom = startName;

    for (const leg of routeInfo.legs) {
      currentLegs.push(leg);
      const toNorm = leg.to.toLowerCase();
      const matchIdx = hotelStopNames.findIndex((h) => toNorm.includes(h) || h.includes(toNorm.split(",")[0]));

      if (matchIdx >= 0) {
        const matchedStop = hotelStops[matchIdx];
        const km = currentLegs.reduce((s, l) => s + l.distanceMeters, 0);
        const sec = currentLegs.reduce((s, l) => s + l.durationSeconds, 0);
        result.push({
          index: etappeIdx,
          label: `Etappe ${etappeIdx + 1}`,
          from: etappeFrom,
          to: leg.to.split(",")[0],
          legs: [...currentLegs],
          distanceKm: Math.round(km / 1000),
          durationFormatted: formatDur(sec),
          hotelBooked: !!matchedStop.bookingConfirmation,
          hotelName: matchedStop.bookingHotelName,
          hotelAddress: matchedStop.bookingAddress,
        });
        etappeFrom = leg.to.split(",")[0];
        currentLegs = [];
        etappeIdx++;
      }
    }

    if (currentLegs.length > 0) {
      const km = currentLegs.reduce((s, l) => s + l.distanceMeters, 0);
      const sec = currentLegs.reduce((s, l) => s + l.durationSeconds, 0);
      const endName = trip.stops.find((s) => s.type === "end")?.name || "Ziel";
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
    const newStops = [...trip.stops];
    const idx = newStops.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newStops.length) return;
    if (newStops[targetIdx].type === "start") return;
    if (newStops[targetIdx].type === "end") return;
    [newStops[idx], newStops[targetIdx]] = [newStops[targetIdx], newStops[idx]];
    updateTrip({ stops: newStops });
  };

  const reverseRoute = () => {
    const start = trip.stops.find((s) => s.type === "start");
    const end = trip.stops.find((s) => s.type === "end");
    const waypoints = trip.stops.filter((s) => s.type === "stop");
    if (!start || !end) return;

    const newStart: RouteStop = { ...start, name: end.name };
    const newEnd: RouteStop = { ...end, name: start.name };
    const reversedWaypoints = [...waypoints].reverse();

    updateTrip({ stops: [newStart, ...reversedWaypoints, newEnd] });
  };

  const handleOptimizeRoute = () => {
    const waypointStops = trip.stops.filter((s) => s.type === "stop" && s.name.trim());
    if (waypointStops.length < 2) return;
    if (waypointStops.length > 23) {
      setRouteError("Optimierung ist nur bis 23 Zwischenstopps möglich. Reduziere die Anzahl oder optimiere manuell.");
      return;
    }
    setOptimizeRoute(true);
  };

  const handleStopsReordered = useCallback((orderedIds: string[]) => {
    const stopLookup: Record<string, RouteStop> = {};
    trip.stops.forEach((s) => { stopLookup[s.id] = s; });
    const reordered = orderedIds
      .map((id) => stopLookup[id])
      .filter((s): s is RouteStop => !!s);
    if (reordered.length === trip.stops.length) {
      updateTrip({ stops: reordered });
    }
    setOptimizeRoute(false);
  }, [trip.stops, updateTrip]);

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

  const tabs = [
    { id: "route" as const, label: "Route", icon: Navigation },
    { id: "hotels" as const, label: "Hotels", icon: Hotel },
    { id: "poi" as const, label: "Entdecken", icon: Compass },
    { id: "bucket" as const, label: "Bucket List", icon: BookmarkPlus },
    { id: "flights" as const, label: "Flüge", icon: Plane },
    { id: "car" as const, label: "Mietwagen", icon: Car },
    { id: "train" as const, label: "Züge", icon: Train },
    { id: "esim" as const, label: "eSIM", icon: Smartphone },
    { id: "insurance" as const, label: "Versicherung", icon: Shield },
    { id: "timeline" as const, label: "Timeline", icon: Calendar },
  ];

  const destination = trip.stops.find((s) => s.type === "end")?.name || "";
  const origin = trip.stops.find((s) => s.type === "start")?.name || "";

  const searchParams = {
    destination,
    origin,
    checkIn: trip.startDate,
    checkOut: trip.endDate,
    travelers: trip.travelers,
  };

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

  const loadAiPoisForEtappe = useCallback(async (eIdx: number) => {
    if (etappen.length === 0) return;
    setAiLoadingEtappe(eIdx);
    setAiPoisError(null);
    try {
      const results = await fetchAiPois({
        etappes: etappen,
        interests: trip.interests || [],
        travelMode: trip.travelMode,
        stops: trip.stops,
        etappeIndex: eIdx,
      });
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
  }, [etappen, trip.interests, trip.travelMode, trip.stops, aiPoiPhotos]);

  const loadAllAiPois = useCallback(async () => {
    if (etappen.length === 0) return;
    setAiPoisLoading(true);
    setAiPoisError(null);
    setAiPois([]);
    try {
      const results = await fetchAiPois({
        etappes: etappen,
        interests: trip.interests || [],
        travelMode: trip.travelMode,
        stops: trip.stops,
      });
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
  }, [etappen, trip.interests, trip.travelMode, trip.stops]);

  useEffect(() => {
    if (activeTab === "poi" && poiScope !== "ai") {
      loadPOIs(poiScope);
    }
  }, [activeTab, poiScope, loadPOIs]);

  const isInBucketList = (name: string) =>
    trip.bucketList.some((b) => b.name === name);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Map className="w-6 h-6 text-white/80" />
                <h1 className="text-2xl font-bold text-white">
                  {trip.name || "Neue Reise"}
                </h1>
              </div>
              <p className="text-blue-100 text-sm">
                {(() => {
                  const start = trip.stops.find((s) => s.type === "start")?.name;
                  const end = trip.stops.find((s) => s.type === "end")?.name;
                  const dateStr = trip.startDate && trip.endDate
                    ? `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`
                    : "";
                  const routeStr = start && end ? `${start} → ${end}` : "";
                  return [routeStr, dateStr].filter(Boolean).join(" · ") || "Plane deine Route, vergleiche Angebote und buche direkt.";
                })()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Auto-Save Status */}
              {saveStatus === "saved" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-green-100 bg-green-500/20 px-3 py-1.5 rounded-lg">
                  <Check className="w-3.5 h-3.5" />
                  Gespeichert
                </span>
              )}
              {hasUnsavedChanges && saveStatus === "idle" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-blue-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
                  Wird gespeichert…
                </span>
              )}

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
        <div className="grid lg:grid-cols-[380px_1fr] gap-8">
          {/* Left Panel */}
          <div className="space-y-6">
            {/* Trip Name */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Reisename
              </h3>
              <input
                type="text"
                value={trip.name}
                onChange={(e) => updateTrip({ name: e.target.value })}
                placeholder="z.B. Sommerurlaub Barcelona"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Route Stops */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Route
              </h3>
              <div className="space-y-3 relative">
                {trip.stops.length > 1 && (
                  <div className="absolute left-[19px] top-[28px] bottom-[28px] w-0.5 bg-gradient-to-b from-blue-400 via-gray-200 to-red-400 z-0" />
                )}
                {trip.stops.map((stop, stopIndex) => (
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
                            disabled={stopIndex >= trip.stops.length - 2}
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
                            : stop.type === "end"
                            ? "bg-red-500"
                            : stop.isHotel && stop.bookingConfirmation
                            ? "bg-green-500"
                            : stop.isHotel
                            ? "bg-purple-500"
                            : "bg-orange-400"
                        }`}
                      >
                        {stop.type === "start" ? (
                          <CircleDot className="w-5 h-5 text-white" />
                        ) : stop.type === "end" ? (
                          <Flag className="w-5 h-5 text-white" />
                        ) : stop.isHotel && stop.bookingConfirmation ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : stop.isHotel ? (
                          <BedDouble className="w-5 h-5 text-white" />
                        ) : (
                          <MapPin className="w-5 h-5 text-white" />
                        )}
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
                          defaultValue={stop.name}
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
                      {stop.type === "stop" && !(stop.isHotel && stop.bookingConfirmation) && (
                        <button
                          onClick={() => toggleHotel(stop.id)}
                          className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                            stop.isHotel
                              ? "text-purple-500 bg-purple-50 hover:bg-purple-100"
                              : "text-gray-300 hover:text-purple-500 hover:bg-purple-50"
                          }`}
                          title={stop.isHotel ? "Hotel entfernen" : "Als Hotel markieren"}
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
                ))}
              </div>
              <button
                onClick={addStop}
                className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Zwischenstopp hinzufügen
              </button>
            </div>

            {/* Date & Travelers */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Reisedaten
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Abreise
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={trip.startDate}
                      onChange={(e) =>
                        updateTrip({ startDate: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Rückkehr
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={trip.endDate}
                      onChange={(e) => updateTrip({ endDate: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
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

            {/* Notes */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Notizen
              </h3>
              <textarea
                value={trip.notes}
                onChange={(e) => updateTrip({ notes: e.target.value })}
                placeholder="Eigene Notizen zur Reise..."
                rows={3}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

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

          {/* Right Panel */}
          <div className="min-w-0">
            {/* Tabs */}
            <div className="relative mb-6">
              {canScrollLeft && (
                <button
                  onClick={() => {
                    tabsRef.current?.scrollBy({ left: -200, behavior: "smooth" });
                  }}
                  className="absolute -left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg hover:bg-gray-50 transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
              )}
              <div
                ref={tabsRef}
                onScroll={checkTabScroll}
                className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 overflow-x-auto"
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
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
              {canScrollRight && (
                <button
                  onClick={() => {
                    tabsRef.current?.scrollBy({ left: 200, behavior: "smooth" });
                  }}
                  className="absolute -right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg hover:bg-gray-50 transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>

            {/* Route Tab */}
            {activeTab === "route" && (
              <div className="space-y-6">
                {!origin && !destination && (
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
                    stops={trip.stops}
                    travelMode={trip.travelMode}
                    optimize={optimizeRoute}
                    onRouteCalculated={(info) => {
                      setRouteInfo(info);
                      setRouteError(null);
                      setOptimizeRoute(false);
                    }}
                    onStopsReordered={handleStopsReordered}
                    onError={(msg) => { setRouteError(msg); setOptimizeRoute(false); }}
                    onMapClick={addStopFromMap}
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

                  {origin && destination && !routeInfo?.distance && !routeError && (
                    <p className="text-xs text-gray-400 text-center mt-4">
                      Wähle Start und Ziel über die Autocomplete-Vorschläge aus, damit die Route berechnet wird.
                    </p>
                  )}

                  {(() => {
                    const waypointCount = trip.stops.filter((s) => s.type === "stop" && s.name.trim()).length;
                    const tooMany = waypointCount >= 20;
                    return (
                      <>
                        {origin && destination && !tooMany && (
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
                      {etappen.map((etappe) => (
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
                                : etappe.hotelBooked
                                ? "bg-green-500"
                                : "bg-purple-500"
                            }`}>
                              {etappe.hotelBooked ? <Check className="w-4 h-4" /> : etappe.index + 1}
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
                              etappe.hotelBooked ? (
                                <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-1.5">
                                    <BedDouble className="w-3.5 h-3.5 text-green-600" />
                                    <span className="text-xs font-semibold text-green-800">
                                      {etappe.hotelName || etappe.to}
                                    </span>
                                    <span className="text-[10px] text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full ml-auto">Gebucht</span>
                                  </div>
                                  {etappe.hotelAddress && (
                                    <p className="text-[11px] text-green-700 mt-1">{etappe.hotelAddress}</p>
                                  )}
                                </div>
                              ) : (
                                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                                  <BedDouble className="w-3 h-3" />
                                  Übernachtung in {etappe.to}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hotels Tab */}
            {activeTab === "hotels" && (
              <div className="space-y-6">
                {(() => {
                  const hotelStops = trip.stops.filter(
                    (s) => s.type === "stop" && s.isHotel && s.name.trim()
                  );
                  const allStopsWithHotelOption = trip.stops.filter(
                    (s) => s.type === "stop" && s.name.trim()
                  );

                  function addDaysLocal(dateStr: string, days: number): string {
                    const [y, m, d] = dateStr.split("-").map(Number);
                    const dt = new Date(y, m - 1, d + days);
                    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
                  }

                  function getHotelDates(stop: RouteStop, idx: number): { checkIn: string; checkOut: string; nights: number } {
                    const hasExplicitDates = !!(stop.hotelCheckIn && stop.hotelNights);
                    let checkIn = hasExplicitDates ? stop.hotelCheckIn! : "";
                    if (!checkIn) {
                      if (idx === 0) {
                        checkIn = trip.startDate || "";
                      } else {
                        const prev = getHotelDates(hotelStops[idx - 1], idx - 1);
                        checkIn = prev.checkOut;
                      }
                    }
                    const nights = stop.hotelNights || 2;
                    const checkOut = checkIn ? addDaysLocal(checkIn, nights) : "";
                    return { checkIn, checkOut, nights };
                  }

                  function handleDateSelect(stopId: string, newCheckIn: string, newNights: number) {
                    updateStopField(stopId, { hotelCheckIn: newCheckIn, hotelNights: newNights });
                  }

                  if (allStopsWithHotelOption.length === 0) {
                    return (
                      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6">
                        <div className="flex items-start gap-3">
                          <BedDouble className="w-6 h-6 text-purple-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-purple-800">Noch keine Hotelstopps</p>
                            <p className="text-sm text-purple-600 mt-1">
                              Füge im <strong>Route</strong>-Tab Zwischenstopps hinzu und markiere sie mit dem
                              <BedDouble className="w-3.5 h-3.5 inline mx-1 text-purple-500" />
                              Hotel-Symbol als Übernachtungsort.
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
                              Markiere Zwischenstopps im <strong>Route</strong>-Tab mit dem
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
                              const { checkIn, checkOut, nights } = getHotelDates(stop, idx);
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
                                  <MapPin className="w-4 h-4 text-gray-400 group-hover:text-purple-500" />
                                  <span className="text-sm text-gray-700 group-hover:text-purple-700 font-medium">
                                    {stop.name}
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
                                {lm.imageURL ? (
                                  <img
                                    src={lm.imageURL}
                                    alt={lm.name}
                                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                                    loading="lazy"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }}
                                  />
                                ) : null}
                                <div className={`w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 ${lm.imageURL ? "hidden" : ""}`}>
                                  <MapPin className="w-5 h-5 text-gray-300" />
                                </div>
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
            {activeTab === "flights" && (
              <div className="space-y-6">
                {(!origin || !destination) && (
                  <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-cyan-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-cyan-800">Tipp</p>
                        <p className="text-sm text-cyan-600 mt-1">
                          Gib Start- und Zielort ein, um Flug-Suchergebnisse
                          vorausgefüllt zu erhalten.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      name: "Google Flights",
                      desc: "Umfassender Preisvergleich",
                      color: "text-blue-700",
                      bg: "bg-blue-50",
                      link: buildGoogleFlightsLink(searchParams),
                    },
                    {
                      name: "Booking.com Flights",
                      desc: "Direktbuchung mit Bestpreis",
                      color: "text-indigo-700",
                      bg: "bg-indigo-50",
                      link: buildBookingFlightsLink(searchParams),
                    },
                    {
                      name: "Skyscanner",
                      desc: "Vergleicht hunderte Airlines",
                      color: "text-cyan-700",
                      bg: "bg-cyan-50",
                      link: buildSkyscannerLink(searchParams),
                    },
                    {
                      name: "Kayak",
                      desc: "Flexible Suche & Preisalarm",
                      color: "text-orange-700",
                      bg: "bg-orange-50",
                      link: buildKayakLink(searchParams),
                    },
                  ].map((provider) => (
                    <a
                      key={provider.name}
                      href={provider.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 ${provider.bg} rounded-xl flex items-center justify-center`}>
                          <Plane className={`w-6 h-6 ${provider.color}`} />
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
                        Flüge suchen
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Car Tab */}
            {activeTab === "car" && (
              <div className="space-y-6">
                {!destination && (
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">Tipp</p>
                        <p className="text-sm text-orange-600 mt-1">
                          Gib ein Reiseziel ein, um Mietwagen-Angebote vorausgefüllt zu vergleichen.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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

            {/* Train Tab */}
            {activeTab === "train" && (
              <div className="space-y-6">
                {(!origin || !destination) && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-indigo-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-indigo-800">Tipp</p>
                        <p className="text-sm text-indigo-600 mt-1">
                          Gib Start- und Zielort ein, um Zugverbindungen vorausgefüllt zu suchen.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                          return (
                            <div key={eIdx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-5 py-3 flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-white/70 font-medium">Etappe {eIdx + 1} · {etappe.distanceKm} km · {etappe.durationFormatted}</p>
                                  <p className="text-sm text-white font-semibold">{etappe.from} → {etappe.to}</p>
                                </div>
                                <button
                                  onClick={() => loadAiPoisForEtappe(eIdx)}
                                  disabled={isLoading || aiPoisLoading}
                                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                                >
                                  {isLoading ? (
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3 h-3" />
                                  )}
                                  {suggestions.length > 0 ? "Neu" : "Entdecken"}
                                </button>
                              </div>
                              {suggestions.length > 0 && (
                                <div className="divide-y divide-gray-50">
                                  {suggestions.map((poi, pIdx) => {
                                    const inBucket = isInBucketList(poi.name);
                                    const photoUrl = aiPoiPhotos[poi.name];
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
                                              onClick={() => addStopSmart(poi.name, poi.lat, poi.lng)}
                                              className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                            >
                                              <Plus className="w-3 h-3" />
                                              Als Stopp einfügen
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

                {trip.travelers > 1 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <p className="text-sm text-amber-700">
                      <strong>Tipp:</strong> Mit {trip.travelers} Reisenden lohnt sich oft ein Familientarif
                      oder eine Gruppenversicherung.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Deine Reise-Timeline
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        Übersicht deiner gesamten Reise – Route, Stopps und Bucket List auf einen Blick.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trip Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4">Reise-Zusammenfassung</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {trip.stops.filter((s) => s.name.trim()).length}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Orte</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {routeInfo?.distance || "—"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Distanz</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {trip.startDate && trip.endDate
                          ? Math.ceil(
                              (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          : "—"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Tage</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {trip.bucketList.length}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Bucket List</div>
                    </div>
                  </div>
                </div>

                {/* Timeline Steps */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-6">Route & Stopps</h3>
                  <div className="relative">
                    {trip.stops.filter((s) => s.name.trim()).length > 1 && (
                      <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-400 via-orange-300 to-red-400" />
                    )}
                    <div className="space-y-6">
                      {trip.stops
                        .filter((s) => s.name.trim())
                        .map((stop, idx, arr) => (
                          <div key={stop.id} className="relative flex items-start gap-4">
                            <div
                              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                stop.type === "start"
                                  ? "bg-blue-500"
                                  : stop.type === "end"
                                  ? "bg-red-500"
                                  : "bg-orange-400"
                              }`}
                            >
                              {stop.type === "start" ? (
                                <CircleDot className="w-5 h-5 text-white" />
                              ) : stop.type === "end" ? (
                                <Flag className="w-5 h-5 text-white" />
                              ) : (
                                <MapPin className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div className="flex-1 pt-1.5">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900">{stop.name}</h4>
                                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                                  {stop.type === "start"
                                    ? "Start"
                                    : stop.type === "end"
                                    ? "Ziel"
                                    : `Stopp ${idx}`}
                                </span>
                              </div>
                              {idx === 0 && trip.startDate && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Abreise: {formatDate(trip.startDate)}
                                </p>
                              )}
                              {idx === arr.length - 1 && trip.endDate && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Ankunft: {formatDate(trip.endDate)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>

                    {trip.stops.filter((s) => s.name.trim()).length === 0 && (
                      <div className="text-center py-6">
                        <Navigation className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Keine Route geplant. Füge Orte im Route-Tab hinzu.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bucket List in Timeline */}
                {trip.bucketList.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Bucket List ({trip.bucketList.length})
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {trip.bucketList.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 bg-green-50 rounded-xl px-4 py-3"
                        >
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>{item.category}</span>
                              <span className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                {item.rating}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {trip.notes && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-3">Notizen</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{trip.notes}</p>
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
