"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LastminutePackageStamp from "@/components/LastminutePackageStamp";
import VeloSchweizHomeStamp from "@/components/VeloSchweizHomeStamp";
import { useTravelAssistant } from "@/components/TravelAssistantContext";

const SLIDES = [
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1920&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80",
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=1920&q=80",
];

export default function HeroSlideshow() {
  const t = useTranslations("home");
  const { openAssistant } = useTravelAssistant();

  return (
    <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        {SLIDES.map((url, i) => (
          <div
            key={i}
            className="hero-slide"
            style={{ backgroundImage: `url('${url}')` }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/65 z-[1]" />

      <div className="absolute top-20 right-3 z-[3] sm:top-24 sm:right-6 md:top-28 md:right-10 pointer-events-auto flex flex-col items-end gap-3">
        <LastminutePackageStamp />
        <VeloSchweizHomeStamp />
      </div>

      <div className="relative z-[2] text-center text-white px-4 max-w-3xl mx-auto">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 mb-4">
          SnifferTrek
        </p>
        <h1
          className="text-[clamp(2.5rem,8vw,4.75rem)] font-bold leading-[1.02] tracking-[-0.04em] mb-5"
          style={{
            fontFamily:
              "var(--font-bcn), var(--font-display), system-ui, sans-serif",
          }}
        >
          {t("heroTitle1")}
          <br />
          {t("heroTitle2")}
        </h1>
        <p className="text-lg sm:text-xl text-white/88 mb-8 font-medium max-w-xl mx-auto leading-snug">
          {t("heroSubtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => openAssistant()}
            className="bcn-apple-btn bcn-apple-btn--blue"
          >
            {t("startAssistant")}
          </button>
          <Link
            href="/reise-planen"
            className="bcn-apple-btn bcn-apple-btn--ghost"
          >
            {t("planManually")}
          </Link>
        </div>
        <p className="mt-4 text-xs text-white/65 max-w-md mx-auto">
          {t("heroNote")}{" "}
          <button
            type="button"
            onClick={() => openAssistant({ demo: "cote-dazur" })}
            className="underline decoration-white/35 underline-offset-2 hover:text-white"
          >
            {t("exampleCote")}
          </button>
          {" · "}
          <Link
            href="/reisebericht/cote-dazur"
            className="underline decoration-white/35 underline-offset-2 hover:text-white"
          >
            {t("readReport")}
          </Link>
        </p>
      </div>
    </section>
  );
}
