import { supabase, isSupabaseConfigured } from "./supabase";
import { Trip } from "./types";
import { getAllTrips, saveTrip } from "./tripStorage";

export async function syncTripsToCloud(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const localTrips = getAllTrips();
  if (localTrips.length === 0) return;

  for (const trip of localTrips) {
    const { error } = await supabase.from("trips").upsert(
      {
        id: trip.id,
        user_id: userId,
        name: trip.name,
        travel_mode: trip.travelMode,
        stops: trip.stops,
        start_date: trip.startDate || null,
        end_date: trip.endDate || null,
        travelers: trip.travelers,
        hotels: trip.hotels,
        bucket_list: trip.bucketList,
        notes: trip.notes,
        created_at: trip.createdAt,
        updated_at: trip.updatedAt,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Sync error for trip", trip.id, error.message);
    }
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

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    travelMode: row.travel_mode,
    stops: row.stops || [],
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    travelers: row.travelers,
    hotels: row.hotels || [],
    bucketList: row.bucket_list || [],
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function saveTripToCloud(
  trip: Trip,
  userId: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { error } = await supabase.from("trips").upsert(
    {
      id: trip.id,
      user_id: userId,
      name: trip.name,
      travel_mode: trip.travelMode,
      stops: trip.stops,
      start_date: trip.startDate || null,
      end_date: trip.endDate || null,
      travelers: trip.travelers,
      hotels: trip.hotels,
      bucket_list: trip.bucketList,
      notes: trip.notes,
      created_at: trip.createdAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  return !error;
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
