import { supabase, isSupabaseConfigured } from "./supabase";
import type { Trip, TripShareRole } from "./types";

export type ShareLinkRole = "viewer" | "editor";

export interface TripShareRow {
  id: string;
  trip_id: string;
  token: string;
  role: ShareLinkRole;
  created_at: string;
  revoked_at: string | null;
}

export interface TripSharePreview {
  ok: boolean;
  error?: string;
  tripId?: string;
  tripName?: string;
  role?: ShareLinkRole;
  isOwner?: boolean;
  alreadyJoined?: boolean;
  alreadyOwner?: boolean;
}

function randomShareToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function buildTripShareUrl(token: string): string {
  if (typeof window === "undefined") return `/teilen/${token}`;
  return `${window.location.origin}/teilen/${token}`;
}

export async function listTripShares(tripId: string): Promise<TripShareRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("trip_shares")
    .select("id, trip_id, token, role, created_at, revoked_at")
    .eq("trip_id", tripId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as TripShareRow[];
}

export async function createTripShare(
  tripId: string,
  userId: string,
  role: ShareLinkRole
): Promise<{ ok: boolean; share?: TripShareRow; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Cloud nicht konfiguriert" };
  }

  // RLS verlangt: Reise existiert in trips und gehört dem eingeloggten User.
  const { data: ownedTrip, error: tripErr } = await supabase
    .from("trips")
    .select("id, user_id")
    .eq("id", tripId)
    .maybeSingle();

  if (tripErr) {
    const msg = tripErr.message || "";
    if (msg.toLowerCase().includes("row-level security") || tripErr.code === "42501") {
      return {
        ok: false,
        error:
          "Keine Berechtigung auf Reisen. Bitte SQL-Migration für Freigaben prüfen (trip_shares).",
      };
    }
    return { ok: false, error: msg || "Reise konnte in der Cloud nicht geprüft werden." };
  }

  if (!ownedTrip) {
    return {
      ok: false,
      error:
        "Reise ist noch nicht in der Cloud. Bitte kurz speichern (Autosave), dann erneut teilen.",
    };
  }

  if (String(ownedTrip.user_id) !== String(userId)) {
    return {
      ok: false,
      error: "Nur der Besitzer der Reise kann Freigabe-Links erstellen.",
    };
  }

  const token = randomShareToken();
  const { data, error } = await supabase
    .from("trip_shares")
    .insert({
      trip_id: tripId,
      token,
      role,
      created_by: userId,
    })
    .select("id, trip_id, token, role, created_at, revoked_at")
    .single();

  if (error || !data) {
    const msg = error?.message || "";
    const isRls =
      msg.toLowerCase().includes("row-level security") ||
      error?.code === "42501" ||
      msg.toLowerCase().includes("permission denied");
    const isMissingTable =
      msg.toLowerCase().includes("trip_shares") &&
      (msg.toLowerCase().includes("does not exist") || error?.code === "42P01");

    return {
      ok: false,
      error: isMissingTable
        ? "Tabelle trip_shares fehlt. Bitte die Datei 20260820120000_trip_sharing.sql im SQL Editor ausführen."
        : isRls
          ? "Keine Berechtigung für Freigaben. SQL-Migration erneut ausführen (Run and enable RLS) und als Besitzer angemeldet sein."
          : msg || "Freigabe konnte nicht erstellt werden",
    };
  }
  return { ok: true, share: data as TripShareRow };
}

export async function revokeTripShare(shareId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await supabase
    .from("trip_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", shareId);
  return !error;
}

export async function getTripSharePreview(token: string): Promise<TripSharePreview> {
  if (!isSupabaseConfigured()) return { ok: false, error: "cloud" };
  const { data, error } = await supabase.rpc("get_trip_share_preview", {
    p_token: token,
  });
  if (error) {
    return { ok: false, error: error.message || "preview_failed" };
  }
  return (data || { ok: false, error: "invalid" }) as TripSharePreview;
}

export async function acceptTripShare(token: string): Promise<TripSharePreview> {
  if (!isSupabaseConfigured()) return { ok: false, error: "cloud" };
  const { data, error } = await supabase.rpc("accept_trip_share", {
    p_token: token,
  });
  if (error) {
    return { ok: false, error: error.message || "accept_failed" };
  }
  return (data || { ok: false, error: "invalid" }) as TripSharePreview;
}

export async function leaveSharedTrip(tripId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await supabase
    .from("trip_collaborators")
    .delete()
    .eq("trip_id", tripId)
    .eq("user_id", userId);
  return !error;
}

export interface TripEmailInviteRow {
  id: string;
  trip_id: string;
  email: string;
  role: ShareLinkRole;
  created_at: string;
  accepted_at: string | null;
}

export async function listTripEmailInvites(tripId: string): Promise<TripEmailInviteRow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("trip_invites")
    .select("id, trip_id, email, role, created_at, accepted_at")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as TripEmailInviteRow[];
}

/** Alle E-Mail-Freigaben zu mehreren Reisen (für Karten-Übersicht). */
export async function listTripEmailInvitesByTripIds(
  tripIds: string[]
): Promise<Record<string, TripEmailInviteRow[]>> {
  const out: Record<string, TripEmailInviteRow[]> = {};
  if (!isSupabaseConfigured() || tripIds.length === 0) return out;
  const { data, error } = await supabase
    .from("trip_invites")
    .select("id, trip_id, email, role, created_at, accepted_at")
    .in("trip_id", tripIds)
    .order("created_at", { ascending: false });
  if (error || !data) return out;
  for (const row of data as TripEmailInviteRow[]) {
    const key = row.trip_id;
    if (!out[key]) out[key] = [];
    out[key].push(row);
  }
  return out;
}

export async function inviteTripByEmail(
  tripId: string,
  email: string,
  role: ShareLinkRole
): Promise<{ ok: boolean; status?: "added" | "pending"; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Cloud nicht konfiguriert" };
  const { data, error } = await supabase.rpc("invite_trip_by_email", {
    p_trip_id: tripId,
    p_email: email.trim(),
    p_role: role,
  });
  if (error) {
    const msg = error.message || "";
    if (msg.includes("invite_trip_by_email") || msg.includes("Could not find")) {
      return {
        ok: false,
        error:
          "E-Mail-Einladung noch nicht aktiv. Bitte SQL-Datei 20260821133000_trip_invite_by_email.sql ausführen.",
      };
    }
    return { ok: false, error: msg || "Einladung fehlgeschlagen" };
  }
  const result = (data || {}) as {
    ok?: boolean;
    status?: "added" | "pending";
    error?: string;
  };
  if (!result.ok) {
    const map: Record<string, string> = {
      not_owner: "Nur der Besitzer kann Personen einladen.",
      invalid_email: "Bitte eine gültige E-Mail-Adresse eingeben.",
      self: "Du kannst dich nicht selbst einladen.",
      auth_required: "Bitte zuerst anmelden.",
    };
    return {
      ok: false,
      error: (result.error && map[result.error]) || result.error || "Einladung fehlgeschlagen",
    };
  }
  return { ok: true, status: result.status };
}

export async function revokeTripEmailInvite(inviteId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { error } = await supabase.from("trip_invites").delete().eq("id", inviteId);
  return !error;
}

export async function claimPendingTripInvites(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const { data, error } = await supabase.rpc("claim_trip_invites");
  if (error || !data) return 0;
  const claimed = Number((data as { claimed?: number }).claimed || 0);
  return Number.isFinite(claimed) ? claimed : 0;
}

export async function fetchCollaboratorRoles(
  userId: string
): Promise<Map<string, ShareLinkRole>> {
  const map = new Map<string, ShareLinkRole>();
  if (!isSupabaseConfigured()) return map;
  const { data, error } = await supabase
    .from("trip_collaborators")
    .select("trip_id, role")
    .eq("user_id", userId);
  if (error || !data) return map;
  for (const row of data) {
    if (row.trip_id && (row.role === "viewer" || row.role === "editor")) {
      map.set(row.trip_id, row.role);
    }
  }
  return map;
}

export function annotateTripSharing(
  trip: Trip,
  opts: {
    currentUserId: string;
    cloudOwnerId?: string | null;
    collaboratorRole?: ShareLinkRole | null;
  }
): Trip {
  const ownerId = opts.cloudOwnerId || undefined;
  const isOwner = !ownerId || ownerId === opts.currentUserId;
  let shareRole: TripShareRole = "owner";
  if (!isOwner) {
    shareRole = opts.collaboratorRole === "editor" ? "editor" : "viewer";
  }
  return {
    ...trip,
    cloudOwnerId: isOwner ? undefined : ownerId,
    shareRole,
  };
}

export function canEditSharedTrip(trip: Trip): boolean {
  const role = trip.shareRole || "owner";
  return role === "owner" || role === "editor";
}

export function isSharedTripCollaborator(trip: Trip): boolean {
  const role = trip.shareRole || "owner";
  return role === "viewer" || role === "editor";
}
