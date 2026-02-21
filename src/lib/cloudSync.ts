import { supabase, isSupabaseConfigured } from "./supabase";
import { Trip } from "./types";
import { getAllTrips, saveTrip } from "./tripStorage";

function buildTripPayload(trip: Trip, userId: string, includeRoutes: boolean) {
  const base: Record<string, unknown> = {
    id: trip.id,
    user_id: userId,
    name: trip.name,
    travel_mode: trip.travelMode,
    stops: trip.stops,
    start_date: trip.startDate || null,
    end_date: trip.endDate || null,
    travelers: trip.travelers,
    modules: trip.modules || [],
    interests: trip.interests || [],
    hotels: trip.hotels,
    bucket_list: trip.bucketList,
    notes: trip.notes,
    created_at: trip.createdAt,
    updated_at: trip.updatedAt,
  };
  if (includeRoutes) {
    base.routes = trip.routes || null;
  }
  return base;
}

let _hasRoutesColumn: boolean | null = null;

async function upsertTrip(payload: Record<string, unknown>): Promise<boolean> {
  const { error } = await supabase
    .from("trips")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    if (error.message?.includes("routes") || error.code === "PGRST204") {
      return false;
    }
    console.error("Upsert error:", error.message);
    return false;
  }
  return true;
}

export async function syncTripsToCloud(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const localTrips = getAllTrips();
  if (localTrips.length === 0) return;

  for (const trip of localTrips) {
    if (_hasRoutesColumn !== false) {
      const ok = await upsertTrip(buildTripPayload(trip, userId, true));
      if (ok) { _hasRoutesColumn = true; continue; }
      _hasRoutesColumn = false;
    }
    await upsertTrip(buildTripPayload(trip, userId, false));
  }
}

export async function loadTripsFromCloud(userId: string): Promise<Trip[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    if (row.routes) _hasRoutesColumn = true;
    return {
      id: row.id,
      name: row.name,
      travelMode: row.travel_mode,
      stops: row.stops || [],
      routes: row.routes || undefined,
      startDate: row.start_date || "",
      endDate: row.end_date || "",
      travelers: row.travelers,
      modules: row.modules || [],
      interests: row.interests || [],
      hotels: row.hotels || [],
      bucketList: row.bucket_list || [],
      notes: row.notes || "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

export async function saveTripToCloud(
  trip: Trip,
  userId: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const payload = buildTripPayload(
    { ...trip, updatedAt: new Date().toISOString() },
    userId,
    _hasRoutesColumn !== false
  );
  payload.updated_at = new Date().toISOString();

  const ok = await upsertTrip(payload);
  if (ok) { _hasRoutesColumn = true; return true; }

  if (_hasRoutesColumn === null) {
    _hasRoutesColumn = false;
    const fallback = buildTripPayload(
      { ...trip, updatedAt: new Date().toISOString() },
      userId,
      false
    );
    fallback.updated_at = new Date().toISOString();
    return await upsertTrip(fallback);
  }
  return false;
}

export async function deleteTripFromCloud(tripId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  return !error;
}

export async function verifySyncBeforeLogout(userId: string): Promise<{ syncSuccess: boolean }> {
  if (!isSupabaseConfigured()) return { syncSuccess: false };

  const localTrips = getAllTrips();
  if (localTrips.length === 0) return { syncSuccess: true };

  await syncTripsToCloud(userId);

  const cloudTrips = await loadTripsFromCloud(userId);
  const allSynced = localTrips.every((lt) => cloudTrips.some((ct) => ct.id === lt.id));
  return { syncSuccess: allSynced };
}

export async function mergeCloudAndLocal(userId: string): Promise<void> {
  const cloudTrips = await loadTripsFromCloud(userId);
  const localTrips = getAllTrips();

  const merged = new Map<string, Trip>();

  for (const trip of localTrips) {
    merged.set(trip.id, trip);
  }

  for (const trip of cloudTrips) {
    const existing = merged.get(trip.id);
    if (!existing || new Date(trip.updatedAt) > new Date(existing.updatedAt)) {
      merged.set(trip.id, trip);
    }
  }

  for (const trip of merged.values()) {
    saveTrip(trip);
  }

  await syncTripsToCloud(userId);
}
