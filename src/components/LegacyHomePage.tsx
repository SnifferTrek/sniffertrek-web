"use client";

import { useState, useEffect, useRef } from "react";
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
  ArrowRight,
  Sparkles,
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
import HeroSlideshow from "@/components/HeroSlideshow";
import InspirationTicker from "@/components/InspirationTicker";
import ExampleTrips from "@/components/ExampleTrips";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

const MODULE_ITEMS: {
  id: TripModule;
  name: string;
  desc: string;
  icon: typeof Car;
  active: boolean;
  img: string;
}[] = [
  { id: "route", name: "Autoroute", desc: "Strassenroute mit Karte", icon: Car, active: true, img: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80" },
  { id: "flights", name: "Flug", desc: "Flugsuche & Vergleich", icon: Plane, active: true, img: "https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=600&q=80" },
  { id: "hotels", name: "Hotels", desc: "Hotels vergleichen", icon: Hotel, active: true, img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80" },
  { id: "poi", name: "Entdecken", desc: "KI-Empfehlungen & POIs", icon: Compass, active: true, img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80" },
  { id: "bucket", name: "Bucket List", desc: "1\u2019488 Sehenswürdigkeiten", icon: BookmarkPlus, active: true, img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80" },
  { id: "car", name: "Mietwagen", desc: "Mietwagen buchen", icon: Car, active: true, img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80" },
  { id: "train", name: "Zug", desc: "Zugverbindungen", icon: Train, active: true, img: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&q=80" },
  { id: "esim", name: "eSIM", desc: "Mobiles Internet", icon: Smartphone, active: true, img: "https://images.unsplash.com/photo-1526512340740-9217d0159da9?w=600&q=80" },
  { id: "insurance", name: "Versicherung", desc: "Reiseversicherung", icon: Shield, active: true, img: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80" },
  { id: "apartment", name: "Ferienwohnung", desc: "Airbnb & Co.", icon: BedDouble, active: false, img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80" },
  { id: "camping", name: "Camping", desc: "Campingplätze", icon: Navigation, active: false, img: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&q=80" },
  { id: "activities", name: "Aktivitäten", desc: "Touren & Erlebnisse", icon: Zap, active: false, img: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80" },
  { id: "cruise", name: "Kreuzfahrt", desc: "Schiffsreisen", icon: Globe, active: false, img: "https://images.unsplash.com/photo-1548574505-5e239809ee19?w=600&q=80" },
  { id: "lastminute", name: "Last Minute", desc: "Spontane Angebote", icon: Clock, active: false, img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80" },
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
  const [selectedModules, setSelectedModules] = useState<string[]>(["route"]);
  const [savedTrips, setSavedTrips] = useState<Trip[]>([]);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const modulesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      setSavedTrips(getAllTrips());
    } else {
      setSavedTrips([]);
    }
  }, [user]);

  // Scroll fade-in
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("opacity-100", "translate-y-0");
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-section").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const toggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const scrollToModules = () => {
    modulesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero with Ken Burns slideshow */}
      <HeroSlideshow
        tripName={tripName}
        onTripNameChange={setTripName}
        onStart={scrollToModules}
        moduleCount={selectedModules.length}
        disabled={false}
        buttonLabel="Neue Reise planen"
      />

      {/* Inspiration ticker */}
      <InspirationTicker />

      {/* Login Hint */}
      {showLoginHint && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-2 mb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
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
                  if (savedTrips.length > 0) {
                    setActiveTripId(savedTrips[0].id);
                    router.push("/planer");
                  }
                }}
                className="text-sm text-amber-600 hover:text-amber-800 font-medium transition-colors"
              >
                Ohne Anmeldung planen →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Module selection with photo cards */}
      <section
        ref={modulesRef}
        className="fade-section opacity-0 translate-y-8 transition-all duration-700 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 text-center mb-6">
          Wähle deine Module
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {MODULE_ITEMS.map((item) => {
            const isSelected = selectedModules.includes(item.id);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => item.active && toggleModule(item.id)}
                disabled={!item.active}
                className={`relative rounded-2xl overflow-hidden h-[130px] sm:h-[140px] text-left transition-all duration-300 group ${
                  !item.active
                    ? "opacity-40 cursor-not-allowed grayscale"
                    : isSelected
                    ? "ring-3 ring-blue-500 shadow-xl shadow-blue-500/25 scale-[1.03]"
                    : "opacity-60 grayscale-[40%] hover:opacity-90 hover:grayscale-0 hover:-translate-y-1 hover:shadow-lg"
                }`}
              >
                {/* Background photo */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url('${item.img}')` }}
                />
                {/* Overlay */}
                <div
                  className={`absolute inset-0 transition-all duration-300 ${
                    isSelected
                      ? "bg-gradient-to-t from-blue-700/75 via-blue-500/20 to-transparent"
                      : "bg-gradient-to-t from-black/75 via-black/40 to-black/15"
                  }`}
                />

                {/* "Coming soon" badge */}
                {!item.active && (
                  <span className="absolute top-2 right-2 z-10 text-[7px] font-bold text-white bg-black/40 px-2 py-0.5 rounded-full">
                    BALD
                  </span>
                )}

                {/* Selected checkmark */}
                {item.active && isSelected && (
                  <span className="absolute top-2 right-2 z-10 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </span>
                )}

                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                  <Icon className="w-4 h-4 text-white/80 mb-1" />
                  <p className="text-sm font-bold text-white leading-tight">{item.name}</p>
                  <p className="text-[10px] text-white/70 leading-tight">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Start trip button */}
        <div className="text-center mt-8">
          {tripName.trim() && (
            <p className="text-sm text-gray-500 mb-3">
              Reise: <span className="font-semibold text-gray-800">&ldquo;{tripName.trim()}&rdquo;</span>
            </p>
          )}
          <button
            onClick={startNewTrip}
            disabled={selectedModules.length === 0}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Sparkles className="w-5 h-5" />
            {tripName.trim() ? `"${tripName.trim()}" starten` : "Reise starten"}
          </button>
          <p className="text-[11px] text-gray-400 mt-2.5">
            {selectedModules.length} {selectedModules.length === 1 ? "Modul" : "Module"} ausgewählt
          </p>
        </div>
      </section>

      {/* Existing Trips */}
      {savedTrips.length > 0 && (
        <section className="fade-section opacity-0 translate-y-8 transition-all duration-700 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
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
                  className="text-left bg-white/90 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-gray-200/70 hover:border-blue-300 hover:shadow-md hover:bg-white transition-all group"
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
        </section>
      )}

      {/* Example Trips Showcase */}
      <div className="fade-section opacity-0 translate-y-8 transition-all duration-700">
        <ExampleTrips />
      </div>

      <div className="h-8" />
    </div>
  );
}
