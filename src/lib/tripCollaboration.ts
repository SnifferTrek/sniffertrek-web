import { supabase, isSupabaseConfigured } from "./supabase";
import type { Trip } from "./types";
import type { AuthUser } from "./auth";

export interface TripPresenceUser {
  userId: string;
  userLabel: string;
  lastSeenAt: string;
}

export interface TripActivityEntry {
  id: string;
  tripId: string;
  userId: string;
  userLabel: string;
  action: string;
  summary: string;
  createdAt: string;
}

const PRESENCE_STALE_MS = 45_000;

export function displayNameForUser(user: AuthUser): string {
  const name = (user.name || "").trim();
  if (name) return name;
  const email = (user.email || "").trim();
  if (email.includes("@")) return email.split("@")[0];
  return email || "Unbekannt";
}

export async function heartbeatTripPresence(
  tripId: string,
  user: AuthUser
): Promise<void> {
  if (!isSupabaseConfigured() || !tripId) return;
  await supabase.from("trip_presence").upsert(
    {
      trip_id: tripId,
      user_id: user.id,
      user_label: displayNameForUser(user),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "trip_id,user_id" }
  );
}

export async function clearTripPresence(tripId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !tripId || !userId) return;
  await supabase.from("trip_presence").delete().eq("trip_id", tripId).eq("user_id", userId);
}

export async function fetchActiveTripPresence(
  tripId: string,
  excludeUserId?: string
): Promise<TripPresenceUser[]> {
  if (!isSupabaseConfigured() || !tripId) return [];
  const cutoff = new Date(Date.now() - PRESENCE_STALE_MS).toISOString();
  let query = supabase
    .from("trip_presence")
    .select("user_id, user_label, last_seen_at")
    .eq("trip_id", tripId)
    .gte("last_seen_at", cutoff)
    .order("last_seen_at", { ascending: false });

  if (excludeUserId) {
    query = query.neq("user_id", excludeUserId);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((row) => ({
    userId: String(row.user_id),
    userLabel: String(row.user_label || "Jemand"),
    lastSeenAt: String(row.last_seen_at),
  }));
}

export async function logTripActivity(params: {
  tripId: string;
  user: AuthUser;
  action?: string;
  summary: string;
}): Promise<void> {
  if (!isSupabaseConfigured() || !params.tripId) return;
  const summary = params.summary.trim();
  if (!summary) return;
  await supabase.from("trip_activity").insert({
    trip_id: params.tripId,
    user_id: params.user.id,
    user_label: displayNameForUser(params.user),
    action: params.action || "update",
    summary,
  });
}

export async function fetchTripActivity(
  tripId: string,
  limit = 40
): Promise<TripActivityEntry[]> {
  if (!isSupabaseConfigured() || !tripId) return [];
  const { data, error } = await supabase
    .from("trip_activity")
    .select("id, trip_id, user_id, user_label, action, summary, created_at")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => ({
    id: String(row.id),
    tripId: String(row.trip_id),
    userId: String(row.user_id),
    userLabel: String(row.user_label || "Jemand"),
    action: String(row.action || "update"),
    summary: String(row.summary || ""),
    createdAt: String(row.created_at),
  }));
}

function stopKey(s: { type: string; name: string; id?: string }): string {
  return `${s.type}:${(s.name || "").trim().toLowerCase()}`;
}

/** Kurze Diff-Zusammenfassung für das Protokoll. */
export function summarizeTripChanges(before: Trip | null, after: Trip): string {
  if (!before) return "Reise gespeichert";

  const parts: string[] = [];

  if ((before.name || "").trim() !== (after.name || "").trim()) {
    parts.push(`Name → «${after.name || "Neue Reise"}»`);
  }

  if (before.startDate !== after.startDate || before.endDate !== after.endDate) {
    const range = [after.startDate, after.endDate].filter(Boolean).join(" – ") || "ohne Datum";
    parts.push(`Reisedaten: ${range}`);
  }

  if (before.travelers !== after.travelers) {
    parts.push(`${after.travelers} Personen`);
  }

  const beforeStops = new Set((before.stops || []).map(stopKey));
  const afterStops = new Set((after.stops || []).map(stopKey));
  const addedStops = [...afterStops].filter((k) => !beforeStops.has(k));
  const removedStops = [...beforeStops].filter((k) => !afterStops.has(k));
  if (addedStops.length || removedStops.length) {
    const addedNames = (after.stops || [])
      .filter((s) => addedStops.includes(stopKey(s)))
      .map((s) => s.name.trim())
      .filter(Boolean)
      .slice(0, 3);
    const removedNames = (before.stops || [])
      .filter((s) => removedStops.includes(stopKey(s)))
      .map((s) => s.name.trim())
      .filter(Boolean)
      .slice(0, 3);
    if (addedNames.length) parts.push(`Stopps +${addedNames.join(", ")}`);
    if (removedNames.length) parts.push(`Stopps −${removedNames.join(", ")}`);
 } else if ((before.stops || []).length !== (after.stops || []).length) {
 parts.push(`Route: ${(after.stops || []).length} Punkte`);
 } else {
 const beforeOrder = (before.stops || []).map((s) => s.name.trim()).join(">");
 const afterOrder = (after.stops || []).map((s) => s.name.trim()).join(">");
 if (beforeOrder !== afterOrder) {
 parts.push("Reihenfolge der Stopps geändert");
 }
 }

  const beforeBucket = before.bucketList?.length || 0;
  const afterBucket = after.bucketList?.length || 0;
  if (beforeBucket !== afterBucket) {
    parts.push(`Bucket List: ${afterBucket}`);
  }

  const beforeHotels = before.hotels?.length || 0;
  const afterHotels = after.hotels?.length || 0;
  if (beforeHotels !== afterHotels) {
    parts.push(`Hotels: ${afterHotels}`);
  }

  const beforeMods = (before.modules || []).join(",");
  const afterMods = (after.modules || []).join(",");
  if (beforeMods !== afterMods) {
    parts.push("Module angepasst");
  }

  const beforeNotes = (before.notes || "").trim();
  const afterNotes = (after.notes || "").trim();
  if (beforeNotes !== afterNotes) {
    parts.push("Notizen geändert");
  }

  if (
    before.poiSearchRegion !== after.poiSearchRegion ||
    before.poiSearchRadiusKm !== after.poiSearchRadiusKm
  ) {
    parts.push("Suchgebiet geändert");
  }

  if (parts.length === 0) return "Kleine Anpassung gespeichert";
  return parts.slice(0, 4).join(" · ");
}

export function formatActivityTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
