"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, Loader2, LogIn, Share2, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { acceptTripShare, getTripSharePreview, type TripSharePreview } from "@/lib/tripShare";
import { loadTripsFromCloud, mergeCloudAndLocal } from "@/lib/cloudSync";
import { saveTrip, setActiveTripId } from "@/lib/tripStorage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Link, useRouter } from "@/i18n/navigation";

export default function TeilenPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const token = typeof params.token === "string" ? params.token : "";

  const [preview, setPreview] = useState<TripSharePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      setError("Ungültiger Link.");
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured()) {
      setLoading(false);
      setError("Cloud ist nicht konfiguriert.");
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      const info = await getTripSharePreview(token);
      if (cancelled) return;
      setPreview(info);
      if (!info.ok) {
        setError(
          info.error === "invalid"
            ? "Dieser Einladungslink ist ungültig oder wurde widerrufen."
            : info.error === "missing"
              ? "Die Reise existiert nicht mehr."
              : "Einladung konnte nicht geladen werden."
        );
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [token, user, authLoading]);

  const handleAccept = async () => {
    if (!user || !token) return;
    setAccepting(true);
    setError("");
    const result = await acceptTripShare(token);
    if (!result.ok || !result.tripId) {
      setAccepting(false);
      setError(
        result.error === "invalid"
          ? "Dieser Einladungslink ist ungültig oder wurde widerrufen."
          : "Einladung konnte nicht angenommen werden."
      );
      return;
    }

    await mergeCloudAndLocal(user.id);
    const cloudTrips = await loadTripsFromCloud(user.id);
    const trip = cloudTrips.find((t) => t.id === result.tripId);
    if (trip) {
      saveTrip(trip);
      setActiveTripId(trip.id);
    } else {
      setActiveTripId(result.tripId);
    }

    setDone(true);
    setAccepting(false);
    setTimeout(() => router.push("/planer"), 800);
  };

  if (authLoading || loading) {
    return (
      <div className="st-apple-auth flex items-center justify-center">
        <div className="flex items-center gap-2 text-[var(--st-primary)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Einladung wird geladen…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(`/teilen/${token}`);
    return (
      <div className="st-apple-auth">
        <div className="mx-auto max-w-md px-4 py-12 text-center">
          <Share2 className="mx-auto mb-4 h-10 w-10 text-[var(--st-primary)]" />
          <h1 className="st-apple-hub__title" style={{ fontSize: "1.75rem", textAlign: "center" }}>
            Reise-Einladung
          </h1>
          <p className="st-apple-hub__sub" style={{ marginInline: "auto", textAlign: "center" }}>
            Melde dich an, um die geteilte Reise zu öffnen und parallel daran zu arbeiten.
          </p>
          <div className="mt-8 flex justify-center">
            <Link href={`/login?next=${next}`} className="bcn-apple-btn bcn-apple-btn--blue">
              <LogIn className="h-4 w-4" />
              Anmelden
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="st-apple-auth">
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="st-apple-auth__card text-center">
          <Share2 className="mx-auto mb-4 h-10 w-10 text-[var(--st-primary)]" />
          <h1 className="text-xl font-semibold text-zinc-900">Reise-Einladung</h1>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-left text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {preview?.ok && !error && (
            <>
              <p className="mt-3 text-sm text-zinc-600">
                Du wurdest eingeladen zur Reise
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {preview.tripName || "Unbenannte Reise"}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Rechte:{" "}
                {preview.role === "editor"
                  ? "Schreiben (Mitbearbeiten)"
                  : preview.isOwner || preview.alreadyOwner
                    ? "Besitzer"
                    : "Nur lesen"}
              </p>

              {done ? (
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
                  <Check className="h-4 w-4" />
                  Übernommen – öffne den Planer…
                </div>
              ) : preview.isOwner || preview.alreadyOwner ? (
                <button
                  type="button"
                  onClick={() => {
                    if (preview.tripId) setActiveTripId(preview.tripId);
                    router.push("/planer");
                  }}
                  className="bcn-apple-btn bcn-apple-btn--blue mt-6"
                >
                  Eigene Reise öffnen
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleAccept()}
                  disabled={accepting}
                  className="bcn-apple-btn bcn-apple-btn--blue mt-6 disabled:opacity-50"
                >
                  {accepting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {preview.alreadyJoined ? "Erneut öffnen" : "Einladung annehmen"}
                </button>
              )}
            </>
          )}

          <div className="mt-6">
            <Link href="/meine-reisen" className="text-sm text-zinc-500 hover:text-zinc-800">
              Zu meinen Reisen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
