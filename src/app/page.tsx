"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Plane,
  Train,
  Hotel,
  Compass,
  BookmarkPlus,
  Smartphone,
  Shield,
  Globe,
  BedDouble,
  Navigation,
  Zap,
  Clock,
  Check,
  Sparkles,
  ArrowRight,
  PenLine,
} from "lucide-react";
import { TripModule, Trip } from "@/lib/types";
import {
  createNewTrip,
  saveTrip,
  getAllTrips,
  setActiveTripId,
  getTripDisplayName,
  formatDate,
} from "@/lib/tripStorage";
import SnifferDog from "@/components/SnifferDog";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

const MODULE_GROUPS = [
  {
    label: "Transport",
    items: [
      { id: "route" as TripModule, name: "Autoroute", desc: "Strassenroute mit Karte", icon: Car, active: true },
      { id: "flights" as TripModule, name: "Flug", desc: "Flugsuche & Vergleich", icon: Plane, active: true },
      { id: "car" as TripModule, name: "Mietwagen", desc: "Mietwagen buchen", icon: Car, active: true },
      { id: "train" as TripModule, name: "Zug", desc: "Zugverbindungen", icon: Train, active: true },
    ],
  },
  {
    label: "Unterkunft",
    items: [
      { id: "hotels" as TripModule, name: "Hotels", desc: "Hotels vergleichen", icon: Hotel, active: true },
      { id: "apartment" as TripModule, name: "Ferienwohnung", desc: "Airbnb & Co.", icon: BedDouble, active: false },
      { id: "camping" as TripModule, name: "Camping", desc: "Campingplätze", icon: Navigation, active: false },
    ],
  },
  {
    label: "Vor Ort",
    items: [
      { id: "poi" as TripModule, name: "Entdecken", desc: "KI-Empfehlungen & POIs", icon: Compass, active: true },
      { id: "bucket" as TripModule, name: "Bucket List", desc: "1\u2019488 Sehenswürdigkeiten", icon: BookmarkPlus, active: true },
      { id: "activities" as TripModule, name: "Aktivitäten", desc: "Touren & Erlebnisse", icon: Zap, active: false },
    ],
  },
  {
    label: "Spezial",
    items: [
      { id: "cruise" as TripModule, name: "Kreuzfahrt", desc: "Schiffsreisen", icon: Globe, active: false },
      { id: "lastminute" as TripModule, name: "Last Minute", desc: "Spontane Angebote", icon: Clock, active: false },
    ],
  },
  {
    label: "Services",
    items: [
      { id: "esim" as TripModule, name: "eSIM", desc: "Mobiles Internet", icon: Smartphone, active: true },
      { id: "insurance" as TripModule, name: "Versicherung", desc: "Reiseversicherung", icon: Shield, active: true },
    ],
  },
];

const MODULE_LABEL: Record<string, string> = {
  route: "Auto", flights: "Flug", hotels: "Hotels", poi: "Entdecken",
  bucket: "Bucket List", car: "Mietwagen", train: "Zug", esim: "eSIM",
  insurance: "Versicherung", cruise: "Kreuzfahrt", lastminute: "Last Minute",
  apartment: "Ferienwohnung", camping: "Camping", activities: "Aktivitäten",
};

export default function WelcomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tripName, setTripName] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>(["route", "hotels", "poi", "bucket"]);
  const [savedTrips, setSavedTrips] = useState<Trip[]>([]);
  const [showLoginHint, setShowLoginHint] = useState(false);

  useEffect(() => {
    if (user) {
      setSavedTrips(getAllTrips());
    } else {
      setSavedTrips([]);
    }
  }, [user]);

  const toggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const startNewTrip = () => {
    if (!user && savedTrips.length >= 1) {
      if (showLoginHint) {
        setActiveTripId(savedTrips[0].id);
        router.push("/planer");
      } else {
        setShowLoginHint(true);
      }
      return;
    }
    const name = tripName.trim() || undefined;
    const newTrip = createNewTrip(name);
    newTrip.modules = selectedModules as TripModule[];
    saveTrip(newTrip);
    setActiveTripId(newTrip.id);
    router.push("/planer");
  };

  const loadExistingTrip = (t: Trip) => {
    setActiveTripId(t.id);
    router.push("/planer");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/80 to-cyan-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Hero with Video */}
        <div className="text-center mb-10">
          <div className="mb-5">
            <SnifferDog />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Willkommen bei{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              SnifferTrek
            </span>
          </h1>
          <p className="text-gray-500 text-base sm:text-lg max-w-lg mx-auto">
            Plane deine perfekte Reise. Wähle aus, was du brauchst — wir kümmern uns um den Rest.
          </p>
        </div>

        {/* New Trip Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200/60 shadow-sm p-6 sm:p-8 mb-10">
          {/* Trip Name */}
          <div id="neue-reise" className="mb-8">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <PenLine className="w-4 h-4 text-blue-500" />
              Neue Reise planen
            </label>
            <input
              type="text"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              placeholder="z.B. Sommerurlaub Südfrankreich, Roadtrip Island..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-sm sm:text-base"
            />
          </div>

          {/* Module Selection */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">
              Das brauchst du
            </h2>
            <div className="space-y-5">
              {MODULE_GROUPS.map((group) => (
                <div key={group.label}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 pl-0.5">
                    {group.label}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {group.items.map((item) => {
                      const isSelected = selectedModules.includes(item.id);
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => item.active && toggleModule(item.id)}
                          disabled={!item.active}
                          className={`relative text-left p-3.5 rounded-xl border-2 transition-all ${
                            !item.active
                              ? "border-gray-100 bg-gray-50/60 opacity-45 cursor-not-allowed"
                              : isSelected
                              ? "border-blue-500 bg-blue-50/80 shadow-sm shadow-blue-500/10"
                              : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                          }`}
                        >
                          {!item.active && (
                            <span className="absolute top-1.5 right-1.5 text-[7px] font-bold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-full">
                              BALD
                            </span>
                          )}
                          {item.active && isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </span>
                          )}
                          <Icon className={`w-5 h-5 mb-1.5 ${
                            !item.active ? "text-gray-300" : isSelected ? "text-blue-600" : "text-gray-400"
                          }`} />
                          <p className={`text-sm font-semibold leading-tight ${
                            !item.active ? "text-gray-400" : isSelected ? "text-blue-900" : "text-gray-700"
                          }`}>
                            {item.name}
                          </p>
                          <p className={`text-[10px] sm:text-[11px] mt-0.5 leading-tight ${
                            !item.active ? "text-gray-300" : "text-gray-400"
                          }`}>
                            {item.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Login Hint */}
          {showLoginHint && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-sm font-medium text-amber-800 mb-2">
                Kostenlos anmelden für weitere Reisen
              </p>
              <p className="text-sm text-amber-600 mb-4">
                Ohne Konto kannst du nur eine Reise bearbeiten. Melde dich an, um beliebig viele Reisen zu planen und sie auf allen Geräten zu synchronisieren.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                >
                  Jetzt anmelden
                </Link>
                <button
                  onClick={() => {
                    setActiveTripId(savedTrips[0].id);
                    router.push("/planer");
                  }}
                  className="text-sm text-amber-600 hover:text-amber-800 font-medium transition-colors"
                >
                  Ohne Anmeldung planen →
                </button>
              </div>
            </div>
          )}

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={startNewTrip}
              disabled={selectedModules.length === 0}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Sparkles className="w-5 h-5" />
              {showLoginHint ? "Ohne Anmeldung planen" : tripName.trim() ? `"${tripName.trim()}" starten` : "Neue Reise planen"}
            </button>
            {selectedModules.length > 0 && !showLoginHint && (
              <p className="text-[11px] text-gray-400 mt-2.5">
                {selectedModules.length} {selectedModules.length === 1 ? "Modul" : "Module"} ausgewählt
              </p>
            )}
          </div>
        </div>

        {/* Existing Trips */}
        {savedTrips.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-gray-200/80" />
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Oder bestehende Reise weiterplanen
              </h2>
              <div className="h-px flex-1 bg-gray-200/80" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {savedTrips.map((t) => {
                const start = t.stops.find((s) => s.type === "start")?.name;
                const end = t.stops.find((s) => s.type === "end")?.name;
                const stopsCount = t.stops.filter((s) => s.type === "stop" && s.name.trim()).length;
                const displayName = getTripDisplayName(t);
                return (
                  <button
                    key={t.id}
                    onClick={() => loadExistingTrip(t)}
                    className="text-left bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-200/70 hover:border-blue-300 hover:shadow-md hover:bg-white transition-all group"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm sm:text-base">
                        {displayName}
                      </h3>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all mt-0.5 flex-shrink-0" />
                    </div>
                    {start && end && (
                      <p className="text-xs text-gray-500 mb-1.5">
                        {start} → {end}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      {stopsCount > 0 && <span>{stopsCount} Stopps</span>}
                      {t.startDate && <span>{formatDate(t.startDate)}</span>}
                      {t.travelers > 0 && <span>{t.travelers} Pers.</span>}
                    </div>
                    {t.modules && t.modules.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {t.modules.slice(0, 5).map((m) => (
                          <span key={m} className="text-[9px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {MODULE_LABEL[m] || m}
                          </span>
                        ))}
                        {t.modules.length > 5 && (
                          <span className="text-[9px] text-gray-400">+{t.modules.length - 5}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
