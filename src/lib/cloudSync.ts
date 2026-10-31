import { supabase, isSupabaseConfigured } from "./supabase";
import { Trip } from "./types";
import { getAllTrips, notifyTripsMerged, saveTrip } from "./tripStorage";
import { mergeTripRecords } from "./tripStopMerge";
import { leanTripForCloud } from "./tripMediaSidecar";

/** Max. JSON-Zeichen für Cloud-Upsert (Metadaten ohne Foto-Blobs). */
export const CLOUD_TRIP_PAYLOAD_MAX_CHARS = 400_000;

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
    // Foto-Blobs bewusst leer – Wahrheit ist die lokale Datei / IndexedDB
    pdf_photos_by_etappe: {},
    pdf_photo_library_by_etappe: {},
    pdf_photo_captions_by_etappe: trip.pdfPhotoCaptionsByEtappe || null,
    pdf_photo_placement_by_etappe: trip.pdfPhotoPlacementByEtappe || null,
    pdf_photo_layout_by_etappe: trip.pdfPhotoLayoutByEtappe || null,
    pdf_photo_pages_by_etappe: trip.pdfPhotoPagesByEtappe || null,
    pdf_cover_photo_style: trip.pdfCoverPhotoStyle || null,
    pdf_cover_title_color: trip.pdfCoverTitleColor || null,
    pdf_cover_title_size: trip.pdfCoverTitleSize ?? null,
    pdf_cover_title_font: trip.pdfCoverTitleFont || null,
    pdf_cover_title_align: trip.pdfCoverTitleAlign || null,
    pdf_cover_date_color: trip.pdfCoverDateColor || null,
    pdf_cover_date_size: trip.pdfCoverDateSize ?? null,
    pdf_cover_date_font: trip.pdfCoverDateFont || null,
    pdf_cover_date_align: trip.pdfCoverDateAlign || null,
    pdf_include_stop_briefs: trip.pdfIncludeStopBriefs ?? null,
    pdf_include_table_of_contents: trip.pdfIncludeTableOfContents ?? null,
    pdf_include_etappe_maps: trip.pdfIncludeEtappeMaps ?? null,
    pdf_include_teilstrecken: trip.pdfIncludeTeilstrecken ?? null,
    pdf_include_entdecken_highlights: trip.pdfIncludeEntdeckenHighlights ?? null,
    created_at: trip.createdAt,
    updated_at: trip.updatedAt,
  };
  if (includeRoutes) {
    base.routes = trip.routes || null;
  }
  return base;
}

function payloadWithinBudget(payload: Record<string, unknown>): boolean {
  try {
    return JSON.stringify(payload).length <= CLOUD_TRIP_PAYLOAD_MAX_CHARS;
  } catch {
    return false;
  }
}

let _hasRoutesColumn: boolean | null = null;

async function upsertTrip(payload: Record<string, unknown>): Promise<boolean> {
  if (!payloadWithinBudget(payload)) {
    console.warn(
      "[cloudSync] Payload zu gross – Upsert abgebrochen (Fotos gehören in die lokale Datei, nicht in die Cloud)"
    );
    return false;
  }

  const { error } = await supabase.from("trips").upsert(payload, { onConflict: "id" });

  if (!error) return true;

  const missingColumn =
    error.code === "PGRST204" ||
    error.message?.includes("column") ||
    error.message?.includes("schema cache");

  if (missingColumn) {
    const slim: Record<string, unknown> = { ...payload };
    for (const key of Object.keys(slim)) {
      if (key.startsWith("pdf_")) delete slim[key];
    }
    if ("routes" in slim) {
      const { error: routesErr } = await supabase.from("trips").upsert(slim, { onConflict: "id" });
      if (!routesErr) return true;
    }
    const minimal = { ...slim };
    delete minimal.routes;
    const { error: minErr } = await supabase.from("trips").upsert(minimal, { onConflict: "id" });
    if (!minErr) return true;
  }

  if (error.message?.includes("routes")) {
    return false;
  }
  console.error("Upsert error:", error.message);
  return false;
}

function cloudPayloadFromTrip(trip: Trip, userId: string, includeRoutes: boolean) {
  const lean = leanTripForCloud(trip);
  const stamped = {
    ...lean,
    updatedAt: trip.updatedAt || lean.updatedAt || new Date().toISOString(),
  };
  const payload = buildTripPayload(stamped, userId, includeRoutes);
  payload.updated_at = stamped.updatedAt;
  return payload;
}

export async function syncTripsToCloud(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  // Schlank speichern – keine Foto-Hydration in die Cloud
  const localTrips = getAllTrips();
  if (localTrips.length === 0) return;

  for (const trip of localTrips) {
    if (_hasRoutesColumn !== false) {
      const ok = await upsertTrip(cloudPayloadFromTrip(trip, userId, true));
      if (ok) {
        _hasRoutesColumn = true;
        continue;
      }
      _hasRoutesColumn = false;
    }
    await upsertTrip(cloudPayloadFromTrip(trip, userId, false));
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
      // Cloud-Fotos ignorieren / leeren – Medien kommen aus Datei/IndexedDB
      pdfPhotosByEtappe: {},
      pdfPhotoLibraryByEtappe: {},
      pdfPhotoCaptionsByEtappe: row.pdf_photo_captions_by_etappe || undefined,
      pdfPhotoPlacementByEtappe: row.pdf_photo_placement_by_etappe || undefined,
      pdfPhotoLayoutByEtappe: row.pdf_photo_layout_by_etappe || undefined,
      pdfPhotoPagesByEtappe: row.pdf_photo_pages_by_etappe || undefined,
      pdfCoverPhotoStyle: row.pdf_cover_photo_style || undefined,
      pdfCoverTitleColor: row.pdf_cover_title_color || undefined,
      pdfCoverTitleSize: row.pdf_cover_title_size ?? undefined,
      pdfCoverTitleFont: row.pdf_cover_title_font || undefined,
      pdfCoverTitleAlign: row.pdf_cover_title_align || undefined,
      pdfCoverDateColor: row.pdf_cover_date_color || undefined,
      pdfCoverDateSize: row.pdf_cover_date_size ?? undefined,
      pdfCoverDateFont: row.pdf_cover_date_font || undefined,
      pdfCoverDateAlign: row.pdf_cover_date_align || undefined,
      pdfIncludeStopBriefs: row.pdf_include_stop_briefs ?? undefined,
      pdfIncludeTableOfContents: row.pdf_include_table_of_contents ?? undefined,
      pdfIncludeEtappeMaps: row.pdf_include_etappe_maps ?? undefined,
      pdfIncludeTeilstrecken: row.pdf_include_teilstrecken ?? undefined,
      pdfIncludeEntdeckenHighlights: row.pdf_include_entdecken_highlights ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

export async function saveTripToCloud(trip: Trip, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  // updatedAt der lokalen Reise behalten – kein künstlich neueres Cloud-Datum
  const payload = cloudPayloadFromTrip(
    { ...trip, updatedAt: trip.updatedAt || new Date().toISOString() },
    userId,
    _hasRoutesColumn !== false
  );

  const ok = await upsertTrip(payload);
  if (ok) {
    _hasRoutesColumn = true;
    return true;
  }

  if (_hasRoutesColumn === null) {
    _hasRoutesColumn = false;
    return await upsertTrip(
      cloudPayloadFromTrip(
        { ...trip, updatedAt: trip.updatedAt || new Date().toISOString() },
        userId,
        false
      )
    );
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
    if (!existing) {
      merged.set(trip.id, trip);
    } else {
      merged.set(trip.id, mergeTripRecords(existing, trip));
    }
  }

  for (const trip of merged.values()) {
    saveTrip(trip);
  }

  notifyTripsMerged();
  await syncTripsToCloud(userId);
}
