"use client";

import { useState, useEffect, useCallback } from "react";
import { Link, useRouter } from "@/i18n/navigation";
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
  FileUp,
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
  tripLocalFileSession,
} from "@/lib/tripLocalFileAccess";
import { downloadTripFile } from "@/lib/tripLocalFileDocument";

const modeIcons: Record<TravelMode, typeof Car> = {
  auto: Car,
};

const modeLabels: Record<TravelMode, string> = {
  auto: "Auto",
};

export default function MeineReisenPage() {
  const t = useTranslations("myTripsPage");
  const router = useRouter();
  const { user, loading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fileBusyId, setFileBusyId] = useState<string | null>(null);
  const [openingFile, setOpeningFile] = useState(false);

  const refreshTrips = useCallback(() => {
    setTrips(getAllTrips());
  }, []);

  useEffect(() => {
    if (loading) return;
    // Liste nur wenn angemeldet (Cloud/Browser-Metadaten)
    if (user) refreshTrips();
    else setTrips([]);
  }, [loading, user, refreshTrips]);

  const handleDelete = (id: string) => {
    deleteTrip(id);
    if (user) {
      deleteTripFromCloud(id);
    }
    refreshTrips();
  };

  const handleNewTrip = () => {
    if (!user) return;
    const newTrip = createNewTrip();
    saveTrip(newTrip);
    setActiveTripId(newTrip.id);
    window.location.href = "/planer";
  };

  /** Datei wählen → volle Reise laden → Planer. Optional erwartete Trip-ID. */
  const handleOpenFromFile = async (expectedTripId?: string) => {
    setOpeningFile(true);
    try {
      const imported = await tripLocalFileSession.openFileAsNewTrip();
      if (!imported) return;
      if (expectedTripId && imported.id !== expectedTripId) {
        const ok = window.confirm(t("fileTripIdMismatch"));
        if (!ok) return;
      }
      saveTrip(imported);
      setActiveTripId(imported.id);
      refreshTrips();
      router.push("/planer");
    } catch {
      window.alert(t("openFileFailed"));
    } finally {
      setOpeningFile(false);
      setFileBusyId(null);
    }
  };

  const handleSaveToFile = (tripId: string) => {
    const trip = loadTripHydrated(tripId);
    if (!trip) return;

    if (isSafariBrowser()) {
      saveTrip(trip);
      downloadTripFile(trip);
      refreshTrips();
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

  const subtitle = !user
    ? t("subtitleGuest")
    : trips.length === 0
      ? t("subtitleEmpty")
      : trips.length === 1
        ? t("subtitleCountOne")
        : t("subtitleCountMany", { count: trips.length });

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
            {user ? <p className="text-blue-100 text-sm">{subtitle}</p> : null}
          </div>
          {user ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={openingFile}
                onClick={() => void handleOpenFromFile()}
                className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/25 transition-all disabled:opacity-50"
              >
                <FileUp className="w-4 h-4" />
                {openingFile ? t("openingFile") : t("openFromFile")}
              </button>
              <button
                type="button"
                onClick={handleNewTrip}
                className="inline-flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                {trips.length === 0 ? t("firstTrip") : t("newTrip")}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!user ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FileUp className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("guestEmptyTitle")}</h2>
            <p className="text-amber-800/90 text-sm font-medium max-w-md mx-auto mb-2">
              {t("guestNotSignedIn")}
            </p>
            <p className="text-gray-500 max-w-md mx-auto mb-8">{t("guestEmptyBody")}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                disabled={openingFile}
                onClick={() => void handleOpenFromFile()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
              >
                <FileUp className="w-5 h-5" />
                {openingFile ? t("openingFile") : t("openFromFile")}
              </button>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-800 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
              >
                <LogIn className="w-5 h-5" />
                {t("guestLoginCta")}
              </Link>
            </div>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Map className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">{t("emptyTitle")}</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">{t("emptyBody")}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                disabled={openingFile}
                onClick={() => void handleOpenFromFile()}
                className="inline-flex items-center gap-2 border border-blue-200 bg-blue-50 text-blue-800 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-100 disabled:opacity-50"
              >
                <FileUp className="w-5 h-5" />
                {t("openFromFile")}
              </button>
              <button
                type="button"
                onClick={handleNewTrip}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
              >
                <Plus className="w-5 h-5" />
                {t("firstTrip")}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const ModeIcon = modeIcons[trip.travelMode] || Car;
              const stopsCount = trip.stops.filter((s) => s.type === "stop").length;
              const filledStops = trip.stops.filter((s) => s.name.trim() !== "");
              const fileMeta = getTripFileLinkMeta(trip.id);
              const saving = fileBusyId === trip.id;
              const edited = formatDate(trip.updatedAt);

              return (
                <article
                  key={trip.id}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
                >
                  <button
                    type="button"
                    disabled={openingFile}
                    title={t("openFromFileHint")}
                    onClick={() => {
                      setFileBusyId(trip.id);
                      void handleOpenFromFile(trip.id);
                    }}
                    className="w-full text-left block hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                  >
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-400 p-5 relative overflow-hidden">
                      <div className="absolute top-2 right-2 opacity-10">
                        <ModeIcon className="w-20 h-20 text-white" />
                      </div>
                      <div className="relative">
                        <p className="text-[10px] uppercase tracking-wide text-white/70 mb-1 flex items-center gap-1">
                          <FileUp className="w-3 h-3" />
                          {t("tapHeaderOpenFile")}
                        </p>
                        <h3 className="font-bold text-white text-lg leading-tight">
                          {getTripDisplayName(trip)}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs text-white/80 bg-white/15 px-2 py-0.5 rounded-full">
                            <ModeIcon className="w-3 h-3" />
                            {modeLabels[trip.travelMode] || trip.travelMode}
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

                      {edited ? (
                        <p className="mt-4 text-xs text-gray-400">
                          {t("lastEdited", { date: edited })}
                        </p>
                      ) : null}
                    </div>
                  </button>

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
                        disabled={saving || openingFile}
                        title={t("openFromFileHint")}
                        onClick={() => {
                          setFileBusyId(trip.id);
                          void handleOpenFromFile(trip.id);
                        }}
                        className="inline-flex flex-1 min-w-[10rem] items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-50"
                      >
                        <FileUp className="w-3.5 h-3.5" />
                        {t("openFromFile")}
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        title={t("saveToFileHint")}
                        onClick={() => handleSaveToFile(trip.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        {t("saveToFile")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(trip.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title={t("deleteTrip")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
