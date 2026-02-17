"use client";

import { useState } from "react";
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
} from "lucide-react";

type TravelMode = "auto" | "zug" | "flug";

interface RouteStop {
  id: string;
  name: string;
  type: "start" | "stop" | "end";
}

export default function PlanerPage() {
  const [travelMode, setTravelMode] = useState<TravelMode>("auto");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [stops, setStops] = useState<RouteStop[]>([
    { id: "start", name: "", type: "start" },
    { id: "end", name: "", type: "end" },
  ]);
  const [activeTab, setActiveTab] = useState<
    "route" | "hotels" | "flights" | "car" | "poi"
  >("route");

  const addStop = () => {
    const newStop: RouteStop = {
      id: `stop-${Date.now()}`,
      name: "",
      type: "stop",
    };
    const endIdx = stops.findIndex((s) => s.type === "end");
    const newStops = [...stops];
    newStops.splice(endIdx, 0, newStop);
    setStops(newStops);
  };

  const removeStop = (id: string) => {
    setStops(stops.filter((s) => s.id !== id));
  };

  const updateStop = (id: string, name: string) => {
    setStops(stops.map((s) => (s.id === id ? { ...s, name } : s)));
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
    { id: "poi" as const, label: "Entdecken", icon: Compass },
  ];

  const sampleHotels = [
    {
      name: "Ibis Styles Barcelona Centre",
      stars: 3,
      rating: 8.1,
      price: 89,
      image: "bg-gradient-to-br from-blue-100 to-blue-200",
      provider: "Booking.com",
    },
    {
      name: "Catalonia Plaza Mayor",
      stars: 4,
      rating: 8.7,
      price: 142,
      image: "bg-gradient-to-br from-purple-100 to-purple-200",
      provider: "Expedia",
    },
    {
      name: "H10 Metropolitan",
      stars: 4,
      rating: 9.0,
      price: 198,
      image: "bg-gradient-to-br from-amber-100 to-amber-200",
      provider: "Hotels.com",
    },
  ];

  const samplePOIs = [
    {
      name: "Sagrada Família",
      category: "Sehenswürdigkeit",
      rating: 4.8,
      desc: "Gaudís berühmte Basilika",
    },
    {
      name: "Park Güell",
      category: "Park",
      rating: 4.6,
      desc: "Bunter Mosaikpark von Gaudí",
    },
    {
      name: "La Boqueria",
      category: "Markt",
      rating: 4.5,
      desc: "Berühmter Lebensmittelmarkt",
    },
    {
      name: "Casa Batlló",
      category: "Architektur",
      rating: 4.7,
      desc: "Meisterwerk des Modernisme",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Map className="w-7 h-7 text-white/80" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Reise planen
            </h1>
          </div>
          <p className="text-blue-100 text-sm sm:text-base">
            Plane deine Route, vergleiche Angebote und buche direkt.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[380px_1fr] gap-8">
          {/* Left Panel: Route & Settings */}
          <div className="space-y-6">
            {/* Travel Mode */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Verkehrsmittel
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {travelModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setTravelMode(mode.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-sm font-medium transition-all ${
                      travelMode === mode.id
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
                {/* Connecting line */}
                {stops.length > 1 && (
                  <div className="absolute left-[19px] top-[28px] bottom-[28px] w-0.5 bg-gradient-to-b from-blue-400 via-gray-200 to-red-400 z-0" />
                )}

                {stops.map((stop, i) => (
                  <div key={stop.id} className="relative flex items-center gap-3 z-10">
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
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={stop.name}
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
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
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
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
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
                    value={travelers}
                    onChange={(e) => setTravelers(Number(e.target.value))}
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

            {/* Search Button */}
            <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3.5 rounded-2xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Search className="w-5 h-5" />
              Angebote suchen
            </button>
          </div>

          {/* Right Panel: Results / Map */}
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

            {/* Tab Content */}
            {activeTab === "route" && (
              <div className="space-y-6">
                {/* Map Placeholder */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-br from-blue-50 via-green-50 to-cyan-50 h-[400px] flex items-center justify-center relative">
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-[20%] left-[30%] w-3 h-3 bg-blue-500 rounded-full" />
                      <div className="absolute top-[40%] left-[45%] w-3 h-3 bg-orange-500 rounded-full" />
                      <div className="absolute top-[60%] left-[65%] w-3 h-3 bg-red-500 rounded-full" />
                      <div className="absolute top-[20%] left-[30%] w-[200px] h-[1px] bg-blue-300 rotate-[30deg] origin-left" />
                      <div className="absolute top-[40%] left-[45%] w-[150px] h-[1px] bg-blue-300 rotate-[25deg] origin-left" />
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white/80 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Map className="w-8 h-8 text-blue-500" />
                      </div>
                      <p className="text-gray-500 font-medium">
                        Interaktive Karte
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Gib Start und Ziel ein, um die Route zu sehen
                      </p>
                    </div>
                  </div>
                </div>

                {/* Route Summary (empty state) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Navigation className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900">
                      Routendetails
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-gray-300">—</div>
                      <div className="text-xs text-gray-400 mt-1">Distanz</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-gray-300">—</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Fahrzeit
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-gray-300">—</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Zwischenstopps
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "hotels" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Beispiel-Vorschau
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        Gib eine Route und Reisedaten ein, um aktuelle
                        Hotel-Angebote der besten Anbieter zu vergleichen.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {sampleHotels.map((hotel) => (
                    <div
                      key={hotel.name}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row">
                        <div
                          className={`${hotel.image} w-full sm:w-48 h-36 sm:h-auto flex items-center justify-center`}
                        >
                          <Hotel className="w-10 h-10 text-gray-400/50" />
                        </div>
                        <div className="flex-1 p-5">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {hotel.name}
                              </h4>
                              <div className="flex items-center gap-1 mt-1">
                                {Array.from({ length: hotel.stars }).map(
                                  (_, i) => (
                                    <Star
                                      key={i}
                                      className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400"
                                    />
                                  )
                                )}
                                <span className="text-xs text-gray-400 ml-2">
                                  {hotel.rating}/10
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                via {hotel.provider}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">
                                CHF {hotel.price}
                              </div>
                              <div className="text-xs text-gray-400">
                                pro Nacht
                              </div>
                            </div>
                          </div>
                          <button className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                            Angebot ansehen
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "flights" && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Plane className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  Flüge vergleichen
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                  Gib Reisedaten und Zielort ein, um Flüge von hunderten
                  Airlines zu vergleichen. Wir durchsuchen Skyscanner, Kayak und
                  mehr.
                </p>
                <button className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
                  <Search className="w-4 h-4" />
                  Flüge suchen
                </button>
              </div>
            )}

            {activeTab === "car" && (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  Mietwagen finden
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                  Vergleiche Mietwagen von Europcar, Hertz, Sixt und mehr. Von
                  Kleinwagen bis Luxusklasse – zum besten Preis.
                </p>
                <button className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-100 transition-colors">
                  <Search className="w-4 h-4" />
                  Mietwagen suchen
                </button>
              </div>
            )}

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

                <div className="grid sm:grid-cols-2 gap-4">
                  {samplePOIs.map((poi) => (
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
                      <p className="text-sm text-gray-500">{poi.desc}</p>
                      <button className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium">
                        <Plus className="w-3.5 h-3.5" />
                        Zur Bucket List
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
