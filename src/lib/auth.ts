import { supabase, isSupabaseConfigured, getAuthCallbackUrl } from "./supabase";
import type { User } from "@supabase/supabase-js";
import {
 parseResidenceCountry,
 type ResidenceCountry,
 RESIDENCE_COUNTRY_META_KEY,
} from "./residenceCountry";

export type AuthUser = {
 id: string;
 email: string;
 name?: string;
 avatarUrl?: string;
 residenceCountry: ResidenceCountry | null;
};

function mapUser(user: User): AuthUser {
 return {
 id: user.id,
 email: user.email || "",
 name: user.user_metadata?.full_name || user.user_metadata?.name,
 avatarUrl: user.user_metadata?.avatar_url,
 residenceCountry: parseResidenceCountry(
 user.user_metadata?.[RESIDENCE_COUNTRY_META_KEY]
 ),
 };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
 if (!isSupabaseConfigured()) return null;

 const { data: sessionData } = await supabase.auth.getSession();
 const fromSession = sessionData.session?.user;
 if (fromSession) return mapUser(fromSession);

 try {
 const verify = await Promise.race([
 supabase.auth.getUser(),
 new Promise<null>((resolve) => {
 setTimeout(() => resolve(null), 5000);
 }),
 ]);
 if (verify && typeof verify === "object" && "data" in verify && verify.data.user) {
 return mapUser(verify.data.user);
 }
 } catch {
 /* Supabase offline / pausiert */
 }

 return null;
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
  name?: string,
  residenceCountry?: ResidenceCountry
): Promise<{ user: AuthUser | null; error: string | null }> {
  if (!isSupabaseConfigured())
    return { user: null, error: "Supabase nicht konfiguriert" };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl(),
      data: {
        full_name: name,
        ...(residenceCountry
          ? { [RESIDENCE_COUNTRY_META_KEY]: residenceCountry }
          : {}),
      },
    },
  });

  if (error) return { user: null, error: error.message };
  return { user: data.user ? mapUser(data.user) : null, error: null };
}

/** Bestätigungsmail erneut senden (wenn Konto noch nicht bestätigt). */
export async function resendSignupConfirmation(
  email: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured())
    return { error: "Supabase nicht konfiguriert" };

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: getAuthCallbackUrl() },
  });
  if (error) return { error: error.message };
  return { error: null };
}

export async function updateResidenceCountry(
 country: ResidenceCountry
): Promise<{ user: AuthUser | null; error: string | null }> {
 if (!isSupabaseConfigured())
 return { user: null, error: "Supabase nicht konfiguriert" };

 const { data, error } = await supabase.auth.updateUser({
 data: { [RESIDENCE_COUNTRY_META_KEY]: country },
 });

 if (error) return { user: null, error: error.message };
 return { user: data.user ? mapUser(data.user) : null, error: null };
}

export async function signInWithGoogle(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl(),
    },
  });
}

export async function resetPassword(
  email: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured())
    return { error: "Supabase nicht konfiguriert" };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthCallbackUrl("type=recovery"),
  });

  if (error) return { error: error.message };
  return { error: null };
}

export async function updatePassword(
 newPassword: string
): Promise<{ error: string | null }> {
 const { error } = await supabase.auth.updateUser({
 password: newPassword,
 });
 if (error) return { error: error.message };
 return { error: null };
}

/** True if the user has an email/password identity (not Google-only). */
export async function userCanChangePassword(): Promise<boolean> {
 if (!isSupabaseConfigured()) return false;
 const { data } = await supabase.auth.getUser();
 const ids = data.user?.identities ?? [];
 return ids.some((i) => i.provider === "email");
}

/**
 * Verifies the current password, then sets a new one (user must be logged in).
 */
export async function changePasswordWithCurrent(
 email: string,
 currentPassword: string,
 newPassword: string
): Promise<{ error: string | null }> {
 if (!isSupabaseConfigured())
 return { error: "Supabase nicht konfiguriert" };
 if (newPassword.length < 6)
 return { error: "Das neue Passwort muss mindestens 6 Zeichen lang sein." };
 if (newPassword === currentPassword)
 return { error: "Das neue Passwort muss sich vom aktuellen unterscheiden." };

 const { error: signErr } = await supabase.auth.signInWithPassword({
 email,
 password: currentPassword,
 });
 if (signErr) {
 if (
 signErr.message.toLowerCase().includes("invalid login") ||
 signErr.message.toLowerCase().includes("invalid credentials")
 ) {
 return { error: "Aktuelles Passwort ist falsch." };
 }
 return { error: signErr.message };
 }

 const { error: upErr } = await supabase.auth.updateUser({
 password: newPassword,
 });
 if (upErr) return { error: upErr.message };
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
