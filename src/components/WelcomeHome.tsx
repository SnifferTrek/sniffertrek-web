"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Trip } from "@/lib/types";
import {
  setActiveTripId,
  getAllTrips,
  getTripDisplayName,
  formatDate,
} from "@/lib/tripStorage";
import HeroSlideshow from "@/components/HeroSlideshow";
import InspirationTicker from "@/components/InspirationTicker";
import ExampleTrips from "@/components/ExampleTrips";
import { useAuth } from "@/components/AuthProvider";
import { useTravelAssistant } from "@/components/TravelAssistantContext";
import { MODULE_LABEL } from "@/lib/tripModuleCatalog";
import { COUPLE_PHOTOS, TRAVEL_COUPLE } from "@/lib/travelCouple";

export default function WelcomeHome() {
  const t = useTranslations("home");
  const router = useRouter();
  const { user } = useAuth();
  const { openAssistant } = useTravelAssistant();
  const [savedTrips, setSavedTrips] = useState<Trip[]>([]);

  const howSteps = [
    { step: "1", title: t("step1Title"), text: t("step1Text") },
    { step: "2", title: t("step2Title"), text: t("step2Text") },
    { step: "3", title: t("step3Title"), text: t("step3Text") },
  ] as const;

  useEffect(() => {
    if (user) {
      setSavedTrips(getAllTrips());
    } else {
      setSavedTrips([]);
    }
  }, [user]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting)
            e.target.classList.add("opacity-100", "translate-y-0");
        }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-section").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const loadExistingTrip = (trip: Trip) => {
    setActiveTripId(trip.id);
    router.push("/planer");
  };

  return (
    <div className="min-h-screen bg-[var(--st-bg)]">
      <HeroSlideshow />

      <section className="fade-section opacity-0 translate-y-8 transition-all duration-700 border-b border-[var(--st-border)] bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <h2
            className="text-center text-[clamp(1.35rem,3vw,1.75rem)] font-bold tracking-[-0.03em] text-[#1d1d1f] mb-8"
            style={{
              fontFamily:
                "var(--font-bcn), var(--font-display), system-ui, sans-serif",
            }}
          >
            {t("howTitle")}
          </h2>
          <ol className="grid sm:grid-cols-3 gap-8 sm:gap-6">
            {howSteps.map((item) => (
              <li key={item.step} className="text-center sm:text-left">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--st-muted)] mb-2">
                  {t("step", { n: item.step })}
                </p>
                <p className="text-base font-semibold text-[#1d1d1f] mb-1">
                  {item.title}
                </p>
                <p className="text-sm text-[var(--st-muted)] leading-snug">
                  {item.text}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => openAssistant()}
              className="text-sm font-medium text-[var(--st-primary)] hover:text-[var(--st-primary-hover)] inline-flex items-center gap-1"
            >
              {t("startAssistant")}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      <section className="fade-section opacity-0 translate-y-8 transition-all duration-700 border-b border-[var(--st-border)] bg-[var(--st-bg)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
            <div className="flex gap-4 sm:gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={COUPLE_PHOTOS.candid}
                alt=""
                className="w-24 h-28 sm:w-28 sm:h-32 object-cover rounded-sm flex-shrink-0"
              />
              <div className="min-w-0 pt-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--st-muted)] mb-2">
                  {TRAVEL_COUPLE.displayName}
                </p>
                <p
                  className="text-[clamp(1.15rem,2.5vw,1.4rem)] font-bold tracking-[-0.03em] text-[#1d1d1f] leading-snug mb-3"
                  style={{
                    fontFamily:
                      "var(--font-bcn), var(--font-display), system-ui, sans-serif",
                  }}
                >
                  {t("coupleVoice")}
                </p>
                <p className="text-sm text-[var(--st-muted)] leading-snug mb-4">
                  {t("coupleTried", { tagline: t("coupleTagline") })}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <Link
                    href="/reisebericht/cote-dazur"
                    className="font-medium text-[var(--st-primary)] hover:text-[var(--st-primary-hover)]"
                  >
                    Côte d’Azur
                  </Link>
                  <Link
                    href="/reisebericht/venedig"
                    className="font-medium text-[var(--st-primary)] hover:text-[var(--st-primary-hover)]"
                  >
                    Venedig
                  </Link>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--st-muted)] mb-3">
                {t("docsEyebrow")}
              </p>
              <p
                className="text-[clamp(1.15rem,2.5vw,1.4rem)] font-bold tracking-[-0.03em] text-[#1d1d1f] leading-snug mb-3"
                style={{
                  fontFamily:
                    "var(--font-bcn), var(--font-display), system-ui, sans-serif",
                }}
              >
                {t("pdfTitle")}
              </p>
              <div
                className="mb-4 rounded-sm border border-[var(--st-border)] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                aria-hidden
              >
                <div className="flex items-end justify-between gap-3 border-b border-[#e8e8ed] pb-3 mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--st-muted)]">
                      SnifferTrek
                    </p>
                    <p className="text-sm font-semibold text-[#1d1d1f]">
                      Côte d’Azur
                    </p>
                  </div>
                  <p className="text-[10px] text-[var(--st-muted)]">{t("pdfNights", { count: 5 })}</p>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-[85%] rounded-full bg-[#e8e8ed]" />
                  <div className="h-2 w-[60%] rounded-full bg-[#e8e8ed]" />
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="aspect-[4/3] rounded-sm bg-[#d2d2d7]" />
                    <div className="aspect-[4/3] rounded-sm bg-[#e8e8ed]" />
                    <div className="aspect-[4/3] rounded-sm bg-[#d2d2d7]" />
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="h-1.5 w-full rounded-full bg-[#f0f0f2]" />
                    <div className="h-1.5 w-[70%] rounded-full bg-[#f0f0f2]" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-[var(--st-muted)] leading-snug mb-3">
                {t("pdfBlurb")}
              </p>
              <Link
                href="/reisebericht/cote-dazur"
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--st-primary)] hover:text-[var(--st-primary-hover)]"
              >
                {t("openSample")}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <InspirationTicker />

      {savedTrips.length > 0 && (
        <section className="fade-section opacity-0 translate-y-8 transition-all duration-700 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-gray-200/80" />
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
              {t("continueExisting")}
            </h2>
            <div className="h-px flex-1 bg-gray-200/80" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {savedTrips.map((trip) => {
              const start = trip.stops.find((s) => s.type === "start")?.name;
              const end = trip.stops.find((s) => s.type === "end")?.name;
              const stopsCount = trip.stops.filter(
                (s) => s.type === "stop" && s.name.trim()
              ).length;
              const displayName = getTripDisplayName(trip);
              return (
                <button
                  key={trip.id}
                  type="button"
                  onClick={() => loadExistingTrip(trip)}
                  className="text-left st-card p-4 sm:p-5 hover:border-[var(--st-primary)]/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <h3 className="font-semibold text-gray-900 group-hover:text-[var(--st-primary-hover)] transition-colors text-sm sm:text-base">
                      {displayName}
                    </h3>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[var(--st-primary)] group-hover:translate-x-0.5 transition-all mt-0.5 flex-shrink-0" />
                  </div>
                  {start && end && (
                    <p className="text-xs text-gray-500 mb-1.5">
                      {start} → {end}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    {stopsCount > 0 && <span>{t("stops", { count: stopsCount })}</span>}
                    {trip.startDate && <span>{formatDate(trip.startDate)}</span>}
                    {trip.travelers > 0 && <span>{t("persons", { count: trip.travelers })}</span>}
                  </div>
                  {trip.modules && trip.modules.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {trip.modules.slice(0, 5).map((m) => (
                        <span
                          key={m}
                          className="text-[9px] font-medium text-[var(--st-primary)] bg-[rgba(0,113,227,0.1)] px-2 py-0.5 rounded-full"
                        >
                          {MODULE_LABEL[m] || m}
                        </span>
                      ))}
                      {trip.modules.length > 5 && (
                        <span className="text-[9px] text-gray-400">
                          +{trip.modules.length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="fade-section opacity-0 translate-y-8 transition-all duration-700">
        <ExampleTrips />
      </div>

      <div className="h-8" />
    </div>
  );
}
