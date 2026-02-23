"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

const SLIDES = [
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1920&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80",
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1920&q=80",
];

interface HeroSlideshowProps {
  tripName: string;
  onTripNameChange: (name: string) => void;
  onStart: () => void;
  moduleCount: number;
  disabled: boolean;
  buttonLabel: string;
}

export default function HeroSlideshow({
  tripName,
  onTripNameChange,
  onStart,
  moduleCount,
  disabled,
  buttonLabel,
}: HeroSlideshowProps) {
  const [focused, setFocused] = useState(false);

  return (
    <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Ken Burns slides */}
      <div className="absolute inset-0">
        {SLIDES.map((url, i) => (
          <div
            key={i}
            className="hero-slide"
            style={{ backgroundImage: `url('${url}')` }}
          />
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/60 z-[1]" />

      {/* Content */}
      <div className="relative z-[2] text-center text-white px-4 max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-4 drop-shadow-lg">
          Plane deine
          <br />
          Traumreise.
        </h1>
        <p className="text-lg sm:text-xl text-white/85 mb-8 font-light drop-shadow-md">
          Route, Hotels, Flüge und Sehenswürdigkeiten — alles an einem Ort.
        </p>

        {/* Search bar */}
        <div
          className={`flex gap-1.5 max-w-xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl p-1.5 shadow-2xl transition-all ${
            focused ? "ring-2 ring-blue-400/50 shadow-blue-500/20" : ""
          }`}
        >
          <input
            type="text"
            value={tripName}
            onChange={(e) => onTripNameChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="z.B. Sommerurlaub Südfrankreich, Roadtrip Island..."
            className="flex-1 bg-transparent px-4 py-3 text-gray-900 placeholder-gray-400 outline-none text-sm sm:text-base min-w-0"
            onKeyDown={(e) => e.key === "Enter" && onStart()}
          />
          <button
            onClick={onStart}
            disabled={disabled}
            className="flex-shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-3 rounded-xl font-semibold text-sm sm:text-base hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">{buttonLabel}</span>
            <span className="sm:hidden">Los</span>
          </button>
        </div>

        {moduleCount > 0 && (
          <p className="text-white/60 text-xs mt-3">
            {moduleCount} {moduleCount === 1 ? "Modul" : "Module"} ausgewählt
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-8 sm:gap-12 justify-center mt-10">
          {[
            { value: "1'000+", label: "Sehenswürdigkeiten" },
            { value: "50+", label: "Länder" },
            { value: "100%", label: "Kostenlos" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-xl sm:text-2xl font-bold">{s.value}</div>
              <div className="text-[11px] text-white/60">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
