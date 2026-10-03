"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { TripModule } from "@/lib/types";
import {
  createNewTrip,
  saveTrip,
  getAllTrips,
  setActiveTripId,
  setTripEndDestination,
} from "@/lib/tripStorage";
import { MODULE_CATALOG, sanitizeTripModules } from "@/lib/tripModuleCatalog";
import {
  consumePlanIntent,
  PLAN_DESTINATION_PARAM,
  readPlanIntent,
} from "@/lib/planIntent";
import { useAuth } from "@/components/AuthProvider";
import { Link, useRouter } from "@/i18n/navigation";

export default function ReisePlanenPage() {
  const t = useTranslations("planStart");
  const router = useRouter();
  const { user } = useAuth();
  const [selectedModules, setSelectedModules] = useState<string[]>(["hotels"]);
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [destination, setDestination] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URL(window.location.href).searchParams;
    const fromUrl = params.get(PLAN_DESTINATION_PARAM)?.trim() || "";
    const fromIntent = readPlanIntent() || "";
    const initial = fromUrl || fromIntent;
    if (initial) setDestination(initial);
  }, []);

  const toggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const startTrip = () => {
    if (selectedModules.length === 0) return;
    const dest = destination.trim();
    const localTrips = getAllTrips();
    if (!user && localTrips.length >= 1) {
      if (showLoginHint) {
        setActiveTripId(localTrips[0].id);
        router.push("/planer");
      } else {
        setShowLoginHint(true);
      }
      return;
    }
    let newTrip = createNewTrip(dest || undefined);
    if (dest) {
      newTrip = setTripEndDestination(newTrip, dest);
      consumePlanIntent();
    }
    const cleaned = sanitizeTripModules(selectedModules);
    newTrip.modules = (cleaned?.length ? cleaned : (selectedModules as TripModule[])) as TripModule[];
    saveTrip(newTrip);
    setActiveTripId(newTrip.id);
    router.push("/planer");
  };

  const selectionLabel =
    selectedModules.length === 0
      ? t("pickOne")
      : selectedModules.length === 1
        ? t("selectedOne")
        : t("selectedMany", { count: selectedModules.length });

  return (
    <div className="planer-apple min-h-screen bg-[var(--st-bg)] pt-20 pb-28 sm:pb-16">
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-[var(--st-muted)] transition-colors hover:text-[#1d1d1f]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backHome")}
        </Link>

        {showLoginHint ? (
          <div className="mb-8 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-6 sm:p-7">
            <p className="mb-2 text-lg font-semibold tracking-tight text-amber-950">
              {t("loginTitle")}
            </p>
            <p className="mb-5 max-w-xl text-sm leading-relaxed text-amber-900/80">
              {t("loginBody")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/login" className="st-btn-primary px-5 py-2.5">
                {t("signInNow")}
              </Link>
              <button
                type="button"
                onClick={() => {
                  const trips = getAllTrips();
                  if (trips.length > 0) {
                    setActiveTripId(trips[0].id);
                    router.push("/planer");
                  }
                }}
                className="text-sm font-medium text-amber-900 transition-colors hover:text-amber-950"
              >
                {t("planWithout")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <header className="mb-10 max-w-2xl">
              <p className="mb-3 text-sm font-medium text-[var(--st-primary)]">{t("eyebrow")}</p>
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <h1 className="planer-apple-title min-w-0 flex-1 text-2xl sm:text-[2.35rem]">
                  {t("title")}
                </h1>
                <button
                  type="button"
                  onClick={startTrip}
                  disabled={selectedModules.length === 0}
                  className="st-btn-primary shrink-0 px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-40 sm:px-6 sm:py-3 sm:text-sm"
                >
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="whitespace-nowrap">{t("start")}</span>
                </button>
              </div>
              <p className="mt-4 text-base leading-relaxed text-[var(--st-muted)]">
                {t("hint")}
              </p>

              <div className="mt-6 max-w-md">
                <label htmlFor="plan-destination" className="mb-2 block text-sm font-semibold text-[#1d1d1f]">
                  {t("destinationLabel")}
                </label>
                <input
                  id="plan-destination"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={t("destinationPlaceholder")}
                  className="w-full rounded-xl border border-[#d2d2d7] bg-white px-4 py-3 text-base text-[#1d1d1f] transition-colors placeholder:text-[var(--st-muted)] focus:border-[var(--st-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--st-primary)]/15"
                />
              </div>
            </header>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {MODULE_CATALOG.map((item) => {
                const isSelected = selectedModules.includes(item.id);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => item.active && toggleModule(item.id)}
                    disabled={!item.active}
                    className={`group relative flex flex-col overflow-hidden rounded-[12px] border-2 bg-white text-left transition-[border-color] duration-200 ${
                      !item.active
                        ? "cursor-not-allowed border-[#e8e8ed] opacity-[0.55]"
                        : isSelected
                          ? "border-[#0071e3]"
                          : "border-[#d2d2d7] hover:border-[#86868b]"
                    }`}
                  >
                    <div className="relative h-[4.75rem] overflow-hidden sm:h-[5.75rem]">
                      <div
                        className={`absolute inset-0 bg-cover bg-center transition-transform duration-500 ${
                          item.active ? "group-hover:scale-[1.03]" : "grayscale"
                        }`}
                        style={{ backgroundImage: `url('${item.img}')` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

                      <span
                        className={`absolute bottom-2.5 left-2.5 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md sm:h-9 sm:w-9 ${
                          isSelected
                            ? "bg-white text-[var(--st-primary)]"
                            : "bg-white/90 text-[#1d1d1f]"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>

                      {item.active && isSelected && (
                        <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--st-primary)] text-white shadow-sm">
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </span>
                      )}
                      {!item.active && (
                        <span className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--st-muted)] backdrop-blur-sm">
                          {t("soon")}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-3 sm:p-3.5">
                      <p className="text-sm font-semibold tracking-tight text-[#1d1d1f] leading-tight">
                        {t(`${item.id}_name` as Parameters<typeof t>[0])}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-[var(--st-muted)]">
                        {t(`${item.id}_desc` as Parameters<typeof t>[0])}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-10 hidden max-w-xl items-center justify-between gap-6 sm:flex">
              <p className="text-sm text-[var(--st-muted)]">{selectionLabel}</p>
              <button
                type="button"
                onClick={startTrip}
                disabled={selectedModules.length === 0}
                className="st-btn-primary px-6 py-3 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Sparkles className="h-4 w-4" />
                {t("start")}
              </button>
            </div>
          </>
        )}
      </div>

      {!showLoginHint && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--st-border)] bg-[rgba(245,245,247,0.88)] px-4 py-4 backdrop-blur-xl sm:hidden">
          <p className="mb-2 text-center text-xs text-[var(--st-muted)]">{selectionLabel}</p>
          <button
            type="button"
            onClick={startTrip}
            disabled={selectedModules.length === 0}
            className="st-btn-primary w-full px-6 py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="h-5 w-5" />
            {t("start")}
          </button>
        </div>
      )}
    </div>
  );
}
