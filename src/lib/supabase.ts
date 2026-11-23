import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabasePublicConfig";

const { url, anonKey } = getSupabasePublicConfig();

export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    flowType: "pkce",
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function isSupabaseConfigured(): boolean {
  return true;
}

/** Öffentliche Origin für Auth-Redirects (Bestätigung / Passwort-Reset). */
export function getAuthRedirectOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://www.sniffertrek.com";
}

export function getAuthCallbackUrl(query?: string): string {
  const q = query ? (query.startsWith("?") ? query : `?${query}`) : "";
  return `${getAuthRedirectOrigin()}/auth/callback${q}`;
}
