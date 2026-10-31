import { supabase, isSupabaseConfigured } from "./supabase";

const TRIP_MEDIA_BUCKET = "trip-media";
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

/**
 * Phase-1: kein SnifferTrek-Object-Storage für Nutzerfotos.
 * Wahrheit = lokale Reisedatei (+ IndexedDB-Cache). Bucket bleibt ungenutzt.
 */
export const TRIP_MEDIA_CLOUD_UPLOAD_ENABLED = false;

function sanitizeSegment(value: string): string {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uploadTripMediaBlob(input: {
  userId: string;
  tripId: string;
  kind: "cover" | "photo" | "extra-text";
  blob: Blob;
  extension?: string;
}): Promise<{ path: string; signedUrl: string } | null> {
  if (!TRIP_MEDIA_CLOUD_UPLOAD_ENABLED) {
    console.warn(
      "[tripMediaStorage] Cloud-Foto-Upload deaktiviert – bitte «Als Datei speichern» nutzen"
    );
    return null;
  }
  if (!isSupabaseConfigured()) return null;
  const ext = sanitizeSegment(input.extension || "jpg") || "jpg";
  const path = `${sanitizeSegment(input.userId)}/${sanitizeSegment(input.tripId)}/${sanitizeSegment(input.kind)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: uploadError } = await supabase.storage.from(TRIP_MEDIA_BUCKET).upload(path, input.blob, {
    contentType: input.blob.type || "image/jpeg",
    upsert: false,
    cacheControl: "31536000",
  });
  if (uploadError) {
    console.error("trip-media upload failed:", uploadError.message);
    return null;
  }
  const { data, error: signedError } = await supabase.storage
    .from(TRIP_MEDIA_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (signedError || !data?.signedUrl) {
    console.error("trip-media signed url failed:", signedError?.message || "missing signed URL");
    return null;
  }
  return { path, signedUrl: data.signedUrl };
}
