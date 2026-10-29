"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import {
 Globe,
 Lock,
 Eye,
 EyeOff,
 Check,
 AlertCircle,
 ArrowRight,
 KeyRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { updatePassword } from "@/lib/auth";

export default function AuthCallbackPage() {
 return (
 <Suspense
 fallback={
 <div className="min-h-screen bg-[var(--st-bg)] flex items-center justify-center">
 <div className="text-center">
 <div className="w-14 h-14 bg-[var(--st-primary)] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
 <Globe className="w-7 h-7 text-white" />
 </div>
 <p className="text-gray-500 text-sm">Wird verarbeitet...</p>
 </div>
 </div>
 }
 >
 <AuthCallbackContent />
 </Suspense>
 );
}

function AuthCallbackContent() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const [mode, setMode] = useState<"loading" | "recovery" | "redirecting">(
 "loading"
 );
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [showPassword, setShowPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [success, setSuccess] = useState(false);

 useEffect(() => {
 const handleCallback = async () => {
 const hashParams = new URLSearchParams(
 window.location.hash.substring(1)
 );
 const type =
 searchParams.get("type") ||
 hashParams.get("type") ||
 "";
 const accessToken = hashParams.get("access_token");
 const refreshToken = hashParams.get("refresh_token");

 if (accessToken && refreshToken) {
 await supabase.auth.setSession({
 access_token: accessToken,
 refresh_token: refreshToken,
 });
 }

 if (type === "recovery") {
 setMode("recovery");
 } else {
 const { error } = await supabase.auth.getSession();
 if (error) {
 router.push("/login?error=auth_failed");
 } else {
 setMode("redirecting");
 router.push("/planer");
 }
 }
 };

 handleCallback();
 }, [router, searchParams]);

 const handlePasswordUpdate = async (e: React.FormEvent) => {
 e.preventDefault();
 setError("");

 if (password.length < 6) {
 setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
 return;
 }

 if (password !== confirmPassword) {
 setError("Die Passwörter stimmen nicht überein.");
 return;
 }

 setLoading(true);
 const result = await updatePassword(password);
 setLoading(false);

 if (result.error) {
 if (result.error.includes("same password")) {
 setError(
 "Das neue Passwort muss sich vom alten unterscheiden."
 );
 } else {
 setError(result.error);
 }
 } else {
 setSuccess(true);
 setTimeout(() => {
 router.push("/planer");
 }, 2000);
 }
 };

 if (mode === "loading" || mode === "redirecting") {
 return (
 <div className="min-h-screen bg-[var(--st-bg)] flex items-center justify-center">
 <div className="text-center">
 <div className="w-14 h-14 bg-[var(--st-primary)] rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
 <Globe className="w-7 h-7 text-white" />
 </div>
 <p className="text-gray-500 text-sm">
 {mode === "loading"
 ? "Wird verarbeitet..."
 : "Anmeldung erfolgreich. Du wirst weitergeleitet..."}
 </p>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-[var(--st-bg)] pt-20 pb-16 flex items-center justify-center px-4">
 <div className="w-full max-w-md">
 <div className="text-center mb-8">
 <div className="w-14 h-14 bg-[var(--st-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
 <KeyRound className="w-7 h-7 text-white" />
 </div>
 <h1 className="text-2xl font-semibold tracking-tight text-[#1d1d1f]">
 Neues Passwort setzen
 </h1>
 <p className="text-gray-500 text-sm mt-2">
 Gib dein neues Passwort ein (mindestens 6 Zeichen).
 </p>
 </div>

 <div className="st-card p-6 sm:p-8">
 {success ? (
 <div className="text-center py-4">
 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <Check className="w-8 h-8 text-green-600" />
 </div>
 <h2 className="text-lg font-semibold text-gray-900 mb-2">
 Passwort geändert!
 </h2>
 <p className="text-sm text-gray-500">
 Dein Passwort wurde erfolgreich aktualisiert. Du wirst
 zum Planer weitergeleitet...
 </p>
 </div>
 ) : (
 <form onSubmit={handlePasswordUpdate} className="space-y-4">
 <div>
 <label className="text-xs text-gray-500 mb-1.5 block font-medium">
 Neues Passwort
 </label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type={showPassword ? "text" : "password"}
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="Mindestens 6 Zeichen"
 required
 minLength={6}
 autoFocus
 className="w-full pl-10 pr-11 py-2.5 bg-[#f5f5f7] border border-[var(--st-border)] rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--st-primary)] focus:border-transparent"
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
 >
 {showPassword ? (
 <EyeOff className="w-4 h-4" />
 ) : (
 <Eye className="w-4 h-4" />
 )}
 </button>
 </div>
 </div>

 <div>
 <label className="text-xs text-gray-500 mb-1.5 block font-medium">
 Passwort bestätigen
 </label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type={showPassword ? "text" : "password"}
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 placeholder="Passwort wiederholen"
 required
 minLength={6}
 className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f7] border border-[var(--st-border)] rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--st-primary)] focus:border-transparent"
 />
 </div>
 </div>

 {error && (
 <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
 <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
 <span>{error}</span>
 </div>
 )}

 <button
 type="submit"
 disabled={loading}
 className="w-full flex items-center justify-center gap-2 bg-[var(--st-primary)] text-white py-3 rounded-full text-sm font-medium hover:bg-[var(--st-primary-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {loading ? (
 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : (
 <>
 Passwort speichern
 <ArrowRight className="w-4 h-4" />
 </>
 )}
 </button>
 </form>
 )}
 </div>
 </div>
 </div>
 );
}
