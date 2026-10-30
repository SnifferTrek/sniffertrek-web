"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Map,
  Plus,
  Trash2,
  Calendar,
  Users,
  MapPin,
  BookmarkPlus,
  Car,
  ArrowRight,
  FolderOpen,
  LogIn,
  FileDown,
  HardDrive,
} from "lucide-react";
import { Trip, TravelMode } from "@/lib/types";
import {
  getAllTrips,
  deleteTrip,
  setActiveTripId,
  getTripDisplayName,
  formatDate,
  createNewTrip,
  saveTrip,
  loadTripHydrated,
} from "@/lib/tripStorage";
import { useAuth } from "@/components/AuthProvider";
import { deleteTripFromCloud } from "@/lib/cloudSync";
import {
  getTripFileLinkMeta,
  isSafariBrowser,
  saveTripToChosenHandle,
  startSaveFilePickerInUserGesture,
  startShareTripFileInUserGesture,
  tripLocalFileSession,
} from "@/lib/tripLocalFileAccess";
import { downloadTripFile } from "@/lib/tripLocalFileDocument";

const modeIcons: Record<TravelMode, typeof Car> = {
  auto: Car,
};

const modeLabels: Record<TravelMode, string> = {
  auto: "Auto",
};

const GUEST_TRIP_LIMIT = 1;

export default function MeineReisenPage() {
  const t = useTranslations("myTripsPage");
  const { user, loading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fileBusyId, setFileBusyId] = useState<string | null>(null);

  const refreshTrips = useCallback(() => {
    setTrips(getAllTrips());
  }, []);

  useEffect(() => {
    if (loading) return;
    refreshTrips();
  }, [loading, user, refreshTrips]);

  const handleDelete = (id: string) => {
    deleteTrip(id);
    if (user) {
      deleteTripFromCloud(id);
    }
    refreshTrips();
  };

  const handleNewTrip = () => {
    if (!user && trips.length >= GUEST_TRIP_LIMIT) return;
    const newTrip = createNewTrip();
    saveTrip(newTrip);
    setActiveTripId(newTrip.id);
    window.location.href = "/planer";
  };

  const handleOpenTrip = (id: string) => {
    setActiveTripId(id);
  };

  const handleSaveToFile = (tripId: string) => {
    const trip = loadTripHydrated(tripId);
    if (!trip) return;

    if (isSafariBrowser()) {
      const share = startShareTripFileInUserGesture(trip, () => saveTrip(trip));
      if (share.kind === "unsupported") {
        saveTrip(trip);
        downloadTripFile(trip);
        refreshTrips();
        return;
      }
      setFileBusyId(tripId);
      void share.promise
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          saveTrip(trip);
          downloadTripFile(trip);
        })
        .finally(() => {
          setFileBusyId(null);
          refreshTrips();
        });
      return;
    }

    const started = startSaveFilePickerInUserGesture(trip);
    if (started.kind === "unsupported") {
      window.alert(t("saveFileFailed"));
      return;
    }

    setFileBusyId(tripId);
    void started.promise
      .then((handle) => saveTripToChosenHandle(trip, handle, tripLocalFileSession, () => saveTrip(trip)))
      .then((result) => {
        if (result.outcome === "failed") window.alert(t("saveFileFailed"));
        refreshTrips();
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        window.alert(t("saveFileFailed"));
      })
      .finally(() => setFileBusyId(null));
  };

  const subtitle =
    trips.length === 0
      ? t("subtitleEmpty")
      : trips.length === 1
        ? t("subtitleCountOne")
        : t("subtitleCountMany", { count: trips.length });

  const canAddTrip = user || trips.length < GUEST_TRIP_LIMIT;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="w-7 h-7 text-white/80" />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{t("title")}</h1>
            </div>
            <p className="text-blue-100 text-sm">{subtitle}</p>
            {!user && trips.length > 0 && (
              <p className="mt-1 text-blue-200/90 text-xs">{t("localBrowserNote")}</p>
            )}
          </div>
          {canAddTrip ? (
            <button
              type="button"
              onClick={handleNewTrip}
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              {trips.length === 0 ? t("firstTrip") : t("newTrip")}
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all shadow-lg"
            >
              <LogIn className="w-4 h-4" />
              {t("guestLoginCta")}
            </Link>
          )}
        </div>
      </div>

      {!user && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-950">{t("guestBannerTitle")}</p>
              <p className="text-sm text-amber-900/85 mt-1 max-w-2xl">{t("guestBannerBody")}</p>
            </div>
            <Link
              href="/login"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              <LogIn className="w-4 h-4" />
              {t("guestLoginCta")}
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {trips.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Map className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("emptyTitle")}</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">{t("emptyBody")}</p>
            <Link
              href="/reise-planen"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              <Plus className="w-5 h-5" />
              {t("firstTrip")}
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const ModeIcon = modeIcons[trip.travelMode];
              const stopsCount = trip.stops.filter((s) => s.type === "stop").length;
              const filledStops = trip.stops.filter((s) => s.name.trim() !== "");
              const fileMeta = getTripFileLinkMeta(trip.id);
              const saving = fileBusyId === trip.id;

              return (
                <article
                  key={trip.id}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
                >
                  <Link
                    href="/planer"
                    onClick={() => handleOpenTrip(trip.id)}
                    className="block hover:-translate-y-0.5 transition-transform"
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-400 p-5 relative overflow-hidden">
                      <div className="absolute top-2 right-2 opacity-10">
                        <ModeIcon className="w-20 h-20 text-white" />
                      </div>
                      <div className="relative">
                        <h3 className="font-bold text-white text-lg leading-tight">
                          {getTripDisplayName(trip)}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs text-white/80 bg-white/15 px-2 py-0.5 rounded-full">
                            <ModeIcon className="w-3 h-3" />
                            {modeLabels[trip.travelMode]}
                          </span>
                          {trip.bucketList.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-white/80 bg-white/15 px-2 py-0.5 rounded-full">
                              <BookmarkPlus className="w-3 h-3" />
                              {t("pois", { count: trip.bucketList.length })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      {trip.startDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(trip.startDate)}
                          {trip.endDate && ` – ${formatDate(trip.endDate)}`}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Users className="w-4 h-4 text-gray-400" />
                        {trip.travelers}{" "}
                        {trip.travelers === 1 ? t("personOne") : t("personMany")}
                      </div>

                      {stopsCount > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {stopsCount === 1
                            ? t("stopCount", { count: stopsCount })
                            : t("stopCountMany", { count: stopsCount })}
                        </div>
                      )}

                      {filledStops.length >= 2 && (
                        <div className="mt-3 pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                            <span className="text-gray-600 truncate">{filledStops[0].name}</span>
                            <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                            <span className="text-gray-600 truncate">
                              {filledStops[filledStops.length - 1].name}
                            </span>
                          </div>
                        </div>
                      )}

                      <p className="mt-4 text-xs text-gray-400">
                        {t("lastEdited", { date: formatDate(trip.updatedAt) })}
                      </p>
                    </div>
                  </Link>

                  <div className="px-5 pb-5 space-y-2 border-t border-gray-50 pt-3">
                    {fileMeta && (
                      <p
                        className="flex items-start gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1.5 break-all"
                        title={fileMeta.fileName}
                      >
                        <HardDrive className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {t("fileLinked", { name: fileMeta.fileName })}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={saving}
                        title={t("saveToFileHint")}
                        onClick={() => handleSaveToFile(trip.id)}
                        className="inline-flex flex-1 min-w-[10rem] items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-50"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        {t("saveToFile")}
                      </button>
                      <Link
                        href="/planer"
                        onClick={() => handleOpenTrip(trip.id)}
                        className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {t("openInPlanner")}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(trip.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title={t("deleteTrip")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {!user && trips.length >= GUEST_TRIP_LIMIT && (
                      <p className="text-xs text-amber-800">{t("guestAtLimit")}</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
