"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  Plus,
  Trash2,
  Calendar,
  Users,
  MapPin,
  BookmarkPlus,
  Car,
  ArrowRight,
  LogIn,
  Share2,
  UserMinus,
  Mail,
  LayoutGrid,
  List,
} from "lucide-react";
import { Trip, TravelMode } from "@/lib/types";
import {
  getAllTrips,
  deleteTrip,
  setActiveTripId,
  getTripDisplayName,
  formatDate,
} from "@/lib/tripStorage";
import { useAuth } from "@/components/AuthProvider";
import { deleteTripFromCloud } from "@/lib/cloudSync";
import TripShareModal from "@/components/TripShareModal";
import {
  isSharedTripCollaborator,
  leaveSharedTrip,
  listTripEmailInvitesByTripIds,
  type TripEmailInviteRow,
} from "@/lib/tripShare";

const modeIcons: Record<TravelMode, typeof Car> = {
  auto: Car,
};

const VIEW_KEY = "sniffertrek_trips_view";
type TripsView = "list" | "cards";

function readStoredView(tripCount: number): TripsView {
  if (typeof window === "undefined") return tripCount >= 8 ? "list" : "cards";
  const stored = window.localStorage.getItem(VIEW_KEY);
  if (stored === "list" || stored === "cards") return stored;
  return tripCount >= 8 ? "list" : "cards";
}

export default function MeineReisenPage() {
  const t = useTranslations("trips");
  const tChrome = useTranslations("chrome");
  const router = useRouter();
  const { user, loading } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [shareTrip, setShareTrip] = useState<Trip | null>(null);
  const [invitesByTrip, setInvitesByTrip] = useState<Record<string, TripEmailInviteRow[]>>({});
  const [view, setView] = useState<TripsView>("list");

  useEffect(() => {
    if (!user) return;
    const all = getAllTrips();
    setTrips(all);
    setView(readStoredView(all.length));
    const ownedIds = all.filter((t) => !isSharedTripCollaborator(t)).map((t) => t.id);
    void listTripEmailInvitesByTripIds(ownedIds).then(setInvitesByTrip);
  }, [user, shareTrip]);

  const setViewPersist = (next: TripsView) => {
    setView(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(VIEW_KEY, next);
    }
  };

  const handleDelete = async (trip: Trip) => {
    if (!user) return;
    if (isSharedTripCollaborator(trip)) {
      await leaveSharedTrip(trip.id, user.id);
      deleteTrip(trip.id);
    } else {
      deleteTrip(trip.id);
      void deleteTripFromCloud(trip.id);
    }
    setTrips(getAllTrips());
  };

  const handleNewTrip = () => {
    router.push("/reise-planen");
  };

  const handleOpenTrip = (id: string) => {
    setActiveTripId(id);
  };

  if (loading) {
    return (
      <div className="st-apple-auth flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--bcn-blue)] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="st-apple-auth">
        <div className="mx-auto max-w-md px-4 py-12 text-center">
          <p className="st-apple-hub__eyebrow" style={{ textAlign: "center" }}>
            {tChrome("myTrips")}
          </p>
          <h1
            className="st-apple-hub__title"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", textAlign: "center" }}
          >
            {t("loginRequiredTitle")}
          </h1>
          <p className="st-apple-hub__sub" style={{ marginInline: "auto", textAlign: "center" }}>
            {t("loginRequiredBody")}
          </p>
          <div className="mt-8 flex justify-center">
            <Link href="/login" className="bcn-apple-btn bcn-apple-btn--blue">
              <LogIn className="h-4 w-4" />
              {t("signInNow")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renderTripMeta = (trip: Trip) => {
    const shared = isSharedTripCollaborator(trip);
    const isEditor = shared && trip.shareRole === "editor";
    const isViewer = shared && trip.shareRole === "viewer";
    const shareEmails = !shared ? invitesByTrip[trip.id] || [] : [];
    const filledStops = trip.stops.filter((s) => s.name.trim() !== "");
    return { shared, isEditor, isViewer, shareEmails, filledStops };
  };

  return (
    <div className="st-apple-hub">
      <div className="st-apple-hub__inner">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="st-apple-hub__eyebrow">{tChrome("account")}</p>
            <h1 className="st-apple-hub__title">{t("title")}</h1>
            <p className="st-apple-hub__sub">
              {trips.length === 0
                ? t("emptyCount")
                : trips.length === 1
                  ? t("savedOne")
                  : t("savedMany", { count: trips.length })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {trips.length > 0 && (
              <div className="st-apple-trips-view-toggle" role="group" aria-label={t("viewAria")}>
                <button
                  type="button"
                  onClick={() => setViewPersist("list")}
                  className={view === "list" ? "is-active" : ""}
                  title={t("list")}
                  aria-pressed={view === "list"}
                >
                  <List className="h-4 w-4" />
                  {t("list")}
                </button>
                <button
                  type="button"
                  onClick={() => setViewPersist("cards")}
                  className={view === "cards" ? "is-active" : ""}
                  title={t("cards")}
                  aria-pressed={view === "cards"}
                >
                  <LayoutGrid className="h-4 w-4" />
                  {t("cards")}
                </button>
              </div>
            )}
            <button type="button" onClick={handleNewTrip} className="bcn-apple-btn bcn-apple-btn--blue">
              <Plus className="h-4 w-4" />
              {t("planNow")}
            </button>
          </div>
        </div>

        {trips.length === 0 ? (
          <div className="st-apple-auth__card mt-10 text-center">
            <h2 className="text-xl font-semibold text-[var(--bcn-black)]">{t("emptyTitle")}</h2>
            <p className="mx-auto mt-3 max-w-md text-[var(--bcn-muted)]">
              {t("emptyBody")}
            </p>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={handleNewTrip}
                className="bcn-apple-btn bcn-apple-btn--blue"
              >
                <Plus className="h-4 w-4" />
                {t("planNow")}
              </button>
            </div>
          </div>
        ) : view === "list" ? (
          <div className="st-apple-trips-list mt-8">
            {trips.map((trip) => {
              const ModeIcon = modeIcons[trip.travelMode];
              const { shared, isEditor, isViewer, shareEmails, filledStops } = renderTripMeta(trip);
              const stopsCount = trip.stops.filter((s) => s.type === "stop").length;

              return (
                <div
                  key={trip.id}
                  className={`st-apple-trip-row${
                    isEditor ? " st-apple-trip-row--shared" : ""
                  }${isViewer ? " st-apple-trip-row--readonly" : ""}${
                    shareEmails.length > 0 ? " st-apple-trip-row--shared-out" : ""
                  }`}
                >
                  <Link
                    href="/planer"
                    onClick={() => handleOpenTrip(trip.id)}
                    className="st-apple-trip-row__main"
                  >
                    <span className="st-apple-trip-row__accent" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-[15px] font-semibold text-[#1d1d1f]">
                          {getTripDisplayName(trip)}
                        </h3>
                        {isEditor && (
                          <span className="st-apple-trip-row__pill st-apple-trip-row__pill--collab">
                            {t("collaborate")}
                          </span>
                        )}
                        {isViewer && (
                          <span className="st-apple-trip-row__pill st-apple-trip-row__pill--readonly">
                            {t("readOnly")}
                          </span>
                        )}
                        {shareEmails.length > 0 && (
                          <span className="st-apple-trip-row__pill st-apple-trip-row__pill--shared-out">
                            {t("shared")}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#86868b]">
                        <span className="inline-flex items-center gap-1">
                          <ModeIcon className="h-3 w-3" />
                          {t("car")}
                        </span>
                        {trip.startDate && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(trip.startDate)}
                            {trip.endDate && ` – ${formatDate(trip.endDate)}`}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {trip.travelers}
                        </span>
                        {stopsCount > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {t("stops", { count: stopsCount })}
                          </span>
                        )}
                        {filledStops.length >= 2 && (
                          <span className="inline-flex max-w-[14rem] items-center gap-1 truncate">
                            {filledStops[0].name}
                            <ArrowRight className="h-3 w-3 shrink-0" />
                            {filledStops[filledStops.length - 1].name}
                          </span>
                        )}
                      </div>
                      {shareEmails.length > 0 && (
                        <p className="st-apple-trip-row__shared-emails">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span>
                            {t("sharedPrefix", { emails: shareEmails.map((i) => i.email).join(", ") })}
                          </span>
                        </p>
                      )}
                    </div>
                    <span className="hidden shrink-0 text-[11px] text-[#aeaeb2] sm:block">
                      {formatDate(trip.updatedAt)}
                    </span>
                  </Link>
                  <div className="st-apple-trip-row__actions">
                    {!shared && (
                      <button
                        type="button"
                        onClick={() => setShareTrip(trip)}
                        className="rounded-lg p-1.5 text-[#aeaeb2] hover:bg-blue-50 hover:text-[var(--bcn-blue)]"
                        aria-label={t("shareAria")}
                        title={t("share")}
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDelete(trip)}
                      className="rounded-lg p-1.5 text-[#aeaeb2] hover:bg-red-50 hover:text-red-500"
                      aria-label={shared ? t("leave") : t("deleteAria")}
                      title={shared ? t("leave") : t("delete")}
                    >
                      {shared ? <UserMinus className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="st-apple-trips-grid mt-10">
            {trips.map((trip) => {
              const ModeIcon = modeIcons[trip.travelMode];
              const stopsCount = trip.stops.filter((s) => s.type === "stop").length;
              const { shared, isEditor, isViewer, shareEmails, filledStops } = renderTripMeta(trip);

              return (
                <Link
                  key={trip.id}
                  href="/planer"
                  onClick={() => handleOpenTrip(trip.id)}
                  className={`st-apple-trip-card${
                    isEditor ? " st-apple-trip-card--shared" : ""
                  }${isViewer ? " st-apple-trip-card--shared-readonly" : ""}${
                    shareEmails.length > 0 ? " st-apple-trip-card--shared-out" : ""
                  }`}
                >
                  <div className="st-apple-trip-card__head relative overflow-hidden">
                    <div className="absolute right-2 top-2 opacity-15">
                      <ModeIcon className="h-20 w-20 text-white" />
                    </div>
                    <div className="relative">
                      <h3 className="text-lg font-bold leading-tight text-white">
                        {getTripDisplayName(trip)}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="st-apple-trip-card__badge">
                          <ModeIcon className="h-3 w-3" />
                          {t("car")}
                        </span>
                        {shareEmails.length > 0 && (
                          <span className="st-apple-trip-card__badge st-apple-trip-card__badge--shared-out">
                            <Share2 className="h-3 w-3" />
                            {t("shared")}
                          </span>
                        )}
                        {isEditor && (
                          <span className="st-apple-trip-card__badge st-apple-trip-card__badge--collab">
                            <Share2 className="h-3 w-3" />
                            {t("collaborate")}
                          </span>
                        )}
                        {isViewer && (
                          <span className="st-apple-trip-card__badge st-apple-trip-card__badge--readonly">
                            <Share2 className="h-3 w-3" />
                            {t("readOnly")}
                          </span>
                        )}
                        {trip.bucketList.length > 0 && (
                          <span className="st-apple-trip-card__badge">
                            <BookmarkPlus className="h-3 w-3" />
                            {t("pois", { count: trip.bucketList.length })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    {trip.startDate && (
                      <div className="mb-3 flex items-center gap-2 text-sm text-[var(--bcn-muted)]">
                        <Calendar className="h-4 w-4" />
                        {formatDate(trip.startDate)}
                        {trip.endDate && ` – ${formatDate(trip.endDate)}`}
                      </div>
                    )}

                    <div className="mb-3 flex items-center gap-2 text-sm text-[var(--bcn-muted)]">
                      <Users className="h-4 w-4" />
                      {trip.travelers === 1
                        ? t("person")
                        : t("persons", { count: trip.travelers })}
                    </div>

                    {stopsCount > 0 && (
                      <div className="mb-3 flex items-center gap-2 text-sm text-[var(--bcn-muted)]">
                        <MapPin className="h-4 w-4" />
                        {stopsCount === 1
                          ? t("stopovers", { count: stopsCount })
                          : t("stopoversMany", { count: stopsCount })}
                      </div>
                    )}

                    {filledStops.length >= 2 && (
                      <div className="mt-auto border-t border-black/5 pt-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--bcn-blue)]" />
                          <span className="truncate text-[var(--bcn-muted)]">
                            {filledStops[0].name}
                          </span>
                          <ArrowRight className="h-3 w-3 flex-shrink-0 text-black/25" />
                          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#ff3b30]" />
                          <span className="truncate text-[var(--bcn-muted)]">
                            {filledStops[filledStops.length - 1].name}
                          </span>
                        </div>
                      </div>
                    )}

                    {shareEmails.length > 0 && (
                      <div className="st-apple-trip-card__share-emails">
                        <p className="st-apple-trip-card__share-emails-label">{t("sharedWith")}</p>
                        {shareEmails.slice(0, 4).map((inv) => (
                          <span key={inv.id} className="st-apple-trip-card__share-email">
                            <Mail className="mr-1 inline h-3 w-3 shrink-0" />
                            {inv.email}
                            <span className="st-apple-trip-card__share-email-meta">
                              {" "}
                              · {inv.role === "editor" ? t("roleWrite") : t("roleRead")}
                              {!inv.accepted_at ? ` · ${t("pending")}` : ""}
                            </span>
                          </span>
                        ))}
                        {shareEmails.length > 4 && (
                          <span className="st-apple-trip-card__share-email st-apple-trip-card__share-email-more">
                            {t("more", { count: shareEmails.length - 4 })}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
                      <span className="text-xs text-[var(--bcn-muted)]">
                        {t("lastEdited", { date: formatDate(trip.updatedAt) })}
                      </span>
                      <div className="flex items-center gap-1">
                        {!shared && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShareTrip(trip);
                            }}
                            className="rounded-lg p-1.5 text-black/25 transition-all hover:bg-blue-50 hover:text-[var(--bcn-blue)]"
                            aria-label={t("shareAria")}
                            title={t("share")}
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void handleDelete(trip);
                          }}
                          className="rounded-lg p-1.5 text-black/25 transition-all hover:bg-red-50 hover:text-red-500"
                          aria-label={shared ? t("leave") : t("deleteAria")}
                          title={shared ? t("leave") : t("delete")}
                        >
                          {shared ? <UserMinus className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {shareTrip && (
        <TripShareModal
          tripId={shareTrip.id}
          tripName={getTripDisplayName(shareTrip)}
          userId={user.id}
          open={!!shareTrip}
          onClose={() => setShareTrip(null)}
          onEnsureCloudSaved={async () => {
            const { ensureTripInCloudForShare } = await import("@/lib/cloudSync");
            const { saveTrip, setActiveTripId } = await import("@/lib/tripStorage");
            saveTrip(shareTrip);
            setActiveTripId(shareTrip.id);
            return ensureTripInCloudForShare(shareTrip, user.id);
          }}
        />
      )}
    </div>
  );
}
