"use client";

import { useState, useEffect, useCallback } from "react";
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
  Save,
  FolderOpen,
  Trash2,
  Check,
  BookmarkPlus,
  LogIn,
  Smartphone,
  Shield,
  Globe,
} from "lucide-react";
import Link from "next/link";
import {
  Trip,
  TravelMode,
  RouteStop,
  BucketListItem,
} from "@/lib/types";
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
import {
  buildBookingHotelLink,
  buildExpediaHotelLink,
  buildHotelsComLink,
  buildAgodaHotelLink,
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
} from "@/lib/affiliateLinks";

export default function PlanerPage() {
  const { user } = useAuth();
  const { ready: autocompleteReady, attachAutocomplete } = useGoogleAutocomplete();
  const [trip, setTrip] = useState<Trip>(createNewTrip());
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    stops: number;
  } | null>(null);
  const [savedTrips, setSavedTrips] = useState<Trip[]>([]);
  const [showTripList, setShowTripList] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [activeTab, setActiveTab] = useState<
    "route" | "hotels" | "flights" | "car" | "poi" | "esim" | "train"
  >("route");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  const removeStop = (id: string) => {
    updateTrip({ stops: trip.stops.filter((s) => s.id !== id) });
  };

  const updateStop = (id: string, name: string) => {
    updateTrip({
      stops: trip.stops.map((s) => (s.id === id ? { ...s, name } : s)),
    });
  };

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
    { id: "zug" as TravelMode, label: "Zug", icon: Train },
    { id: "flug" as TravelMode, label: "Flug", icon: Plane },
  ];

  const tabs = [
    { id: "route" as const, label: "Route", icon: Navigation },
    { id: "hotels" as const, label: "Hotels", icon: Hotel },
    { id: "flights" as const, label: "Flüge", icon: Plane },
    { id: "car" as const, label: "Mietwagen", icon: Car },
    { id: "train" as const, label: "Züge", icon: Train },
    { id: "esim" as const, label: "eSIM", icon: Smartphone },
    { id: "poi" as const, label: "Entdecken", icon: Compass },
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

  const samplePOIs = [
    {
      name: "Sagrada Família",
      category: "Sehenswürdigkeit",
      rating: 4.8,
      description: "Gaudís berühmte Basilika",
    },
    {
      name: "Park Güell",
      category: "Park",
      rating: 4.6,
      description: "Bunter Mosaikpark von Gaudí",
    },
    {
      name: "La Boqueria",
      category: "Markt",
      rating: 4.5,
      description: "Berühmter Lebensmittelmarkt",
    },
    {
      name: "Casa Batlló",
      category: "Architektur",
      rating: 4.7,
      description: "Meisterwerk des Modernisme",
    },
  ];

  const isInBucketList = (name: string) =>
    trip.bucketList.some((b) => b.name === name);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Map className="w-6 h-6 text-white/80" />
                <h1 className="text-2xl font-bold text-white">
                  {getTripDisplayName(trip)}
                </h1>
              </div>
              <p className="text-blue-100 text-sm">
                {trip.startDate && trip.endDate
                  ? `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)} · ${trip.travelers} ${trip.travelers === 1 ? "Person" : "Personen"}`
                  : "Plane deine Route, vergleiche Angebote und buche direkt."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Save Status */}
              {saveStatus === "saved" && (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-100 bg-green-500/20 px-3 py-1.5 rounded-lg">
                  <Check className="w-4 h-4" />
                  Gespeichert
                </span>
              )}
              {hasUnsavedChanges && saveStatus === "idle" && (
                <span className="text-xs text-blue-200">Ungespeichert</span>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all border border-white/20"
              >
                <Save className="w-4 h-4" />
                Speichern
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

          {/* Trip List Dropdown */}
          {showTripList && (
            <div className="mt-4 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-80 overflow-y-auto">
              {savedTrips.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  Noch keine gespeicherten Reisen.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {savedTrips.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleLoadTrip(t.id)}
                      className={`w-full flex items-center justify-between px-5 py-3.5 hover:bg-blue-50 transition-colors text-left ${
                        t.id === trip.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {getTripDisplayName(t)}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {t.startDate
                            ? `${formatDate(t.startDate)} – ${formatDate(t.endDate)}`
                            : `Erstellt ${formatDate(t.createdAt)}`}
                          {" · "}
                          {t.stops.filter((s) => s.type === "stop").length}{" "}
                          Zwischenstopps
                          {t.bucketList.length > 0 &&
                            ` · ${t.bucketList.length} POIs`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.id === trip.id && (
                          <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-0.5 rounded-full">
                            Aktiv
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDeleteTrip(t.id, e)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </button>
                  ))}
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
                Reisen auf allen Geräten zu synchronisieren.
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

            {/* Travel Mode */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Verkehrsmittel
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {travelModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => updateTrip({ travelMode: mode.id })}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-sm font-medium transition-all ${
                      trip.travelMode === mode.id
                        ? "bg-blue-50 text-blue-700 border-2 border-blue-500 shadow-sm"
                        : "bg-gray-50 text-gray-500 border-2 border-transparent hover:bg-gray-100"
                    }`}
                  >
                    <mode.icon className="w-5 h-5" />
                    {mode.label}
                  </button>
                ))}
              </div>
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
                {trip.stops.map((stop) => (
                  <div
                    key={stop.id}
                    className="relative flex items-center gap-3 z-10"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                    <div className="flex-1">
                      <input
                        type="text"
                        defaultValue={stop.name}
                        ref={(el) => {
                          if (el && autocompleteReady) {
                            attachAutocomplete(el, (place) => {
                              updateStop(stop.id, place);
                            });
                          }
                        }}
                        onChange={(e) => updateStop(stop.id, e.target.value)}
                        placeholder={
                          stop.type === "start"
                            ? "Startort eingeben..."
                            : stop.type === "end"
                            ? "Zielort eingeben..."
                            : "Zwischenstopp..."
                        }
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    {stop.type === "stop" && (
                      <button
                        onClick={() => removeStop(stop.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
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

            {/* Search Button */}
            <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3.5 rounded-2xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Search className="w-5 h-5" />
              Angebote suchen
            </button>

            {/* Bucket List Summary */}
            {trip.bucketList.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Bucket List ({trip.bucketList.length})
                </h3>
                <div className="space-y-2">
                  {trip.bucketList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-2.5"
                    >
                      <div>
                        <span className="text-sm font-medium text-gray-800">
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {item.category}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFromBucketList(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div>
            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-6 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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

            {/* Route Tab */}
            {activeTab === "route" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <GoogleMap
                    stops={trip.stops}
                    travelMode={trip.travelMode}
                    onRouteCalculated={setRouteInfo}
                  />
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Navigation className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900">
                      Routendetails
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className={`text-2xl font-bold ${routeInfo ? "text-blue-600" : "text-gray-300"}`}>
                        {routeInfo?.distance || "—"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Distanz</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className={`text-2xl font-bold ${routeInfo ? "text-blue-600" : "text-gray-300"}`}>
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
                </div>
              </div>
            )}

            {/* Hotels Tab */}
            {activeTab === "hotels" && (
              <div className="space-y-6">
                {!destination && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Tipp</p>
                        <p className="text-sm text-blue-600 mt-1">
                          Gib zuerst ein Reiseziel und Reisedaten ein, damit die
                          Suchergebnisse bei den Anbietern vorausgefüllt werden.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Booking.com",
                      commission: "bis 25%",
                      color: "from-blue-600 to-blue-700",
                      bg: "bg-blue-50",
                      textColor: "text-blue-700",
                      link: buildBookingHotelLink(searchParams),
                      desc: "Weltweit grösste Hotel-Plattform",
                    },
                    {
                      name: "Expedia",
                      commission: "4–6%",
                      color: "from-yellow-500 to-yellow-600",
                      bg: "bg-yellow-50",
                      textColor: "text-yellow-700",
                      link: buildExpediaHotelLink(searchParams),
                      desc: "Hotels, Pakete & mehr",
                    },
                    {
                      name: "Hotels.com",
                      commission: "3–6%",
                      color: "from-red-500 to-red-600",
                      bg: "bg-red-50",
                      textColor: "text-red-700",
                      link: buildHotelsComLink(searchParams),
                      desc: "Sammle 10 Nächte, 1 gratis",
                    },
                    {
                      name: "Agoda",
                      commission: "4–7%",
                      color: "from-purple-500 to-purple-600",
                      bg: "bg-purple-50",
                      textColor: "text-purple-700",
                      link: buildAgodaHotelLink(searchParams),
                      desc: "Spezialist für Asien & weltweit",
                    },
                    {
                      name: "Hostelworld",
                      commission: "20%",
                      color: "from-orange-500 to-orange-600",
                      bg: "bg-orange-50",
                      textColor: "text-orange-700",
                      link: buildHostelworldLink(searchParams),
                      desc: "Budget-Unterkünfte & Hostels",
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
                          <Hotel className={`w-6 h-6 ${provider.textColor}`} />
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{provider.name}</h4>
                      <p className="text-xs text-gray-400 mb-3">{provider.desc}</p>
                      {destination && (
                        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 mb-3">
                          <span className="font-medium">{destination}</span>
                          {trip.startDate && ` · ${formatDate(trip.startDate)}`}
                          {trip.endDate && ` – ${formatDate(trip.endDate)}`}
                        </div>
                      )}
                      <div className={`inline-flex items-center gap-1 text-xs font-medium ${provider.textColor} ${provider.bg} px-2.5 py-1 rounded-full`}>
                        <Search className="w-3 h-3" />
                        Hotels suchen
                      </div>
                    </a>
                  ))}
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
                <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Compass className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Sehenswürdigkeiten entdecken
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        Entdecke die besten Sehenswürdigkeiten entlang deiner
                        Route und füge sie zu deiner Bucket List hinzu.
                      </p>
                    </div>
                  </div>
                </div>

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
                        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 mb-3">
                          Aktivitäten in <span className="font-medium">{destination}</span>
                        </div>
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
                        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 mb-3">
                          Erlebnisse in <span className="font-medium">{destination}</span>
                        </div>
                        <div className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                          <Search className="w-3 h-3" />
                          Touren entdecken
                        </div>
                      </a>
                    </div>
                  </div>
                )}

                {/* Bucket List POIs */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Sehenswürdigkeiten
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {samplePOIs.map((poi) => {
                      const added = isInBucketList(poi.name);
                      return (
                        <div
                          key={poi.name}
                          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {poi.name}
                              </h4>
                              <span className="text-xs text-gray-400">
                                {poi.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                              <span className="text-xs font-medium text-yellow-700">
                                {poi.rating}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">
                            {poi.description}
                          </p>
                          <button
                            onClick={() =>
                              added
                                ? removeFromBucketList(
                                    trip.bucketList.find(
                                      (b) => b.name === poi.name
                                    )!.id
                                  )
                                : addToBucketList(poi)
                            }
                            className={`mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors ${
                              added
                                ? "text-green-600"
                                : "text-blue-600 hover:text-blue-700"
                            }`}
                          >
                            {added ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                In Bucket List
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                Zur Bucket List
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
