import { supabase, isSupabaseConfigured } from "./supabase";
import type { User } from "@supabase/supabase-js";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
};

function mapUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.full_name || user.user_metadata?.name,
    avatarUrl: user.user_metadata?.avatar_url,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ? mapUser(data.user) : null;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  if (!isSupabaseConfigured())
    return { user: null, error: "Supabase nicht konfiguriert" };

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { user: null, error: error.message };
  return { user: data.user ? mapUser(data.user) : null, error: null };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  if (!isSupabaseConfigured())
    return { user: null, error: "Supabase nicht konfiguriert" };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });

  if (error) return { user: null, error: error.message };
  return { user: data.user ? mapUser(data.user) : null, error: null };
}

export async function signInWithGoogle(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function resetPassword(
  email: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured())
    return { error: "Supabase nicht konfiguriert" };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?type=recovery`,
  });

  if (error) return { error: error.message };
  return { error: null };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.auth.signOut();
}

export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
): () => void {
  if (!isSupabaseConfigured()) return () => {};

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? mapUser(session.user) : null);
  });

  return () => data.subscription.unsubscribe();
}
