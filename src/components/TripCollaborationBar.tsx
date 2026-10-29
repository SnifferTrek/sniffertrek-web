"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { History, Loader2, Users, X } from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import {
  clearTripPresence,
  fetchActiveTripPresence,
  fetchTripActivity,
  formatActivityTime,
  heartbeatTripPresence,
  type TripActivityEntry,
  type TripPresenceUser,
} from "@/lib/tripCollaboration";

interface TripCollaborationBarProps {
  tripId: string;
  user: AuthUser | null;
}

export default function TripCollaborationBar({ tripId, user }: TripCollaborationBarProps) {
  const t = useTranslations("collab");
  const [others, setOthers] = useState<TripPresenceUser[]>([]);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activity, setActivity] = useState<TripActivityEntry[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");

  const refreshPresence = useCallback(async () => {
    if (!user || !tripId) {
      setOthers([]);
      return;
    }
    const list = await fetchActiveTripPresence(tripId, user.id);
    setOthers(list);
  }, [tripId, user]);

  useEffect(() => {
    if (!user || !tripId) return;

    let cancelled = false;
    const beat = async () => {
      await heartbeatTripPresence(tripId, user);
      if (!cancelled) await refreshPresence();
    };

    void beat();
    const heartbeatTimer = window.setInterval(() => void beat(), 12_000);
    const presenceTimer = window.setInterval(() => void refreshPresence(), 8_000);

    const onLeave = () => {
      void clearTripPresence(tripId, user.id);
    };
    window.addEventListener("pagehide", onLeave);

    return () => {
      cancelled = true;
      window.clearInterval(heartbeatTimer);
      window.clearInterval(presenceTimer);
      window.removeEventListener("pagehide", onLeave);
      void clearTripPresence(tripId, user.id);
    };
  }, [tripId, user, refreshPresence]);

  const openActivity = async () => {
    setActivityOpen(true);
    setActivityLoading(true);
 setActivityError("");
 try {
 const rows = await fetchTripActivity(tripId);
 setActivity(rows);
 } catch {
 setActivityError(t("loadFail"));
 setActivity([]);
 } finally {
 setActivityLoading(false);
 }
  };

  if (!user) return null;
  if (others.length === 0 && !activityOpen) return null;

  const labels = others.map((o) => o.userLabel);
  const presenceText =
    labels.length === 0
      ? null
      : labels.length === 1
        ? t("one", { name: labels[0] })
        : labels.length === 2
          ? t("two", { a: labels[0], b: labels[1] })
          : t("many", { name: labels[0], n: labels.length - 1 });

  return (
    <>
      <div className="border-b border-[var(--st-border)] bg-white/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1 sm:px-6 lg:px-8">
          <div className="min-w-0 flex-1">
            {presenceText ? (
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{presenceText}</span>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void openActivity()}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--st-border)] bg-[var(--st-bg)] px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-[var(--st-primary)] hover:text-[var(--st-primary)]"
          >
            <History className="h-3.5 w-3.5" />
            {t("changes")}
          </button>
        </div>
      </div>

      {activityOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="trip-activity-title"
            className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {t("log")}
                </p>
                <h2 id="trip-activity-title" className="mt-0.5 text-lg font-semibold text-zinc-900">
                  {t("who")}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActivityOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {activityLoading ? (
                <div className="flex items-center gap-2 py-8 text-sm text-zinc-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("loading")}
                </div>
              ) : activityError ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {activityError}
                </p>
              ) : activity.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">
                  {t("empty")}
                </p>
              ) : (
                <ul className="space-y-3">
                  {activity.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-900">{entry.userLabel}</p>
                        <p className="shrink-0 text-[11px] text-zinc-400">
                          {formatActivityTime(entry.createdAt)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm leading-snug text-zinc-600">{entry.summary}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
