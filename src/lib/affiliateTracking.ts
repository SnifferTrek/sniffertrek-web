"use client";

import { isSupabaseConfigured, supabase } from "./supabase";

interface AffiliateClickPayload {
  module: string;
  provider: string;
  targetUrl: string;
  tripId?: string;
  userId?: string;
  destination?: string;
  origin?: string;
  context?: Record<string, unknown>;
}

const SESSION_KEY = "sniffertrek_affiliate_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(SESSION_KEY, generated);
  return generated;
}

export async function trackAffiliateClick(payload: AffiliateClickPayload): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const record = {
    module: payload.module,
    provider: payload.provider,
    target_url: payload.targetUrl,
    trip_id: payload.tripId || null,
    user_id: payload.userId || null,
    destination: payload.destination || null,
    origin: payload.origin || null,
    context: payload.context || {},
    page_url: typeof window !== "undefined" ? window.location.href : null,
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    session_id: getSessionId(),
    clicked_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("affiliate_clicks").insert(record);
  if (error) {
    console.warn("Affiliate click tracking failed:", error.message);
  }
}
