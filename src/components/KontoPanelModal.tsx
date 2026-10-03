"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
 Lock,
 Eye,
 EyeOff,
 AlertCircle,
 Check,
 User,
 X,
 LogOut,
 KeyRound,
 MapPin,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useKontoPanel } from "@/components/KontoPanelContext";
import {
 changePasswordWithCurrent,
 updateResidenceCountry,
 userCanChangePassword,
} from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
 RESIDENCE_COUNTRY_OPTIONS,
 type ResidenceCountry,
} from "@/lib/residenceCountry";

const COUNTRY_KEYS: Record<ResidenceCountry, "countryDE" | "countryAT" | "countryCH"> = {
 DE: "countryDE",
 AT: "countryAT",
 CH: "countryCH",
};

export default function KontoPanelModal() {
 const t = useTranslations("konto");
 const { open, closeKonto } = useKontoPanel();
 const { user, configured, logout } = useAuth();
 const [canChangePassword, setCanChangePassword] = useState<boolean | null>(
 null
 );
 const [currentPassword, setCurrentPassword] = useState("");
 const [newPassword, setNewPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [showCurrent, setShowCurrent] = useState(false);
 const [showNew, setShowNew] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState("");
 const [success, setSuccess] = useState("");
 const [passwordPanelOpen, setPasswordPanelOpen] = useState(false);
 const [residenceCountry, setResidenceCountry] = useState<ResidenceCountry>("DE");
 const [countrySaving, setCountrySaving] = useState(false);
 const [countrySuccess, setCountrySuccess] = useState("");
 const [countryError, setCountryError] = useState("");
 const [loggingOut, setLoggingOut] = useState(false);

 const translateError = (msg: string) => {
  const lower = msg.toLowerCase();
  if (lower.includes("same password")) return t("errDifferent");
  if (lower.includes("at least 6")) return t("errMinLength");
  return msg;
 };

 useEffect(() => {
 if (!open || !user || !configured) return;
 userCanChangePassword().then(setCanChangePassword);
 }, [open, user, configured]);

 useEffect(() => {
 if (!open || !user) return;
 setResidenceCountry(user.residenceCountry ?? "DE");
 setCountrySuccess("");
 setCountryError("");
 }, [open, user]);

 useEffect(() => {
 if (!open) {
 setError("");
 setSuccess("");
 setCurrentPassword("");
 setNewPassword("");
 setConfirmPassword("");
 setCanChangePassword(null);
 setPasswordPanelOpen(false);
 setCountrySuccess("");
 setCountryError("");
 setLoggingOut(false);
 }
 }, [open]);

 useEffect(() => {
 if (!open) return;
 const onKey = (e: KeyboardEvent) => {
 if (e.key === "Escape") closeKonto();
 };
 window.addEventListener("keydown", onKey);
 return () => window.removeEventListener("keydown", onKey);
 }, [open, closeKonto]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError("");
 setSuccess("");
 if (!user?.email) return;

 if (newPassword.length < 6) {
 setError(t("errMinLength"));
 return;
 }
 if (newPassword !== confirmPassword) {
 setError(t("errMismatch"));
 return;
 }

 setSubmitting(true);
 try {
 const result = await changePasswordWithCurrent(
 user.email,
 currentPassword,
 newPassword
 );
 if (result.error) {
 setError(translateError(result.error));
 } else {
 setSuccess(t("passwordChanged"));
 setCurrentPassword("");
 setNewPassword("");
 setConfirmPassword("");
 setPasswordPanelOpen(false);
 }
 } catch {
 setError(t("errUnexpected"));
 } finally {
 setSubmitting(false);
 }
 };

 if (!open || !configured || !user) return null;

 return (
 <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 sm:pt-24 px-4 pb-8 overflow-y-auto">
 <button
 type="button"
 className="absolute inset-0 bg-black/40"
 onClick={closeKonto}
 aria-label={t("close")}
 />
 <div
 className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-8 space-y-5 max-h-[min(90vh,calc(100vh-5rem))] overflow-y-auto"
 role="dialog"
 aria-modal="true"
 aria-labelledby="konto-panel-title"
 >
 <div className="flex items-start justify-between gap-3">
 <h2
 id="konto-panel-title"
 className="text-lg font-bold text-gray-900"
 >
 {t("title")}
 </h2>
 <button
 type="button"
 onClick={closeKonto}
 className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
 aria-label={t("close")}
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="flex gap-3 rounded-2xl bg-[#f5f5f7] border border-[var(--st-border)] p-4">
 <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(0,113,227,0.1)] text-[var(--st-primary)]">
 <User className="w-6 h-6" />
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
 {t("email")}
 </p>
 <p className="text-sm text-gray-800 break-all">{user.email}</p>
 </div>
 </div>

 <div className="rounded-2xl border border-[var(--st-border)] bg-[#f5f5f7] p-4 space-y-3">
 <div>
 <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
 {t("residence")}
 </p>
 <p className="mt-1 text-xs text-gray-500">
 {t("residenceCurrent")}{" "}
 <strong className="text-gray-700">
 {t(COUNTRY_KEYS[user.residenceCountry ?? "DE"])}
 </strong>
 {!user.residenceCountry && t("residenceDefault")}
 </p>
 </div>
 <div className="relative">
 <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
 <select
 value={residenceCountry}
 onChange={(e) => setResidenceCountry(e.target.value as ResidenceCountry)}
 className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--st-border)] rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--st-primary)] focus:border-transparent appearance-none"
 >
 {RESIDENCE_COUNTRY_OPTIONS.map((opt) => (
 <option key={opt.value} value={opt.value}>
 {opt.flag} {t(COUNTRY_KEYS[opt.value])}
 </option>
 ))}
 </select>
 </div>
 {countryError && (
 <p className="text-xs text-red-600 flex items-start gap-1.5">
 <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
 {countryError}
 </p>
 )}
 {countrySuccess && (
 <p className="text-xs text-green-600 flex items-start gap-1.5">
 <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
 {countrySuccess}
 </p>
 )}
 <button
 type="button"
 disabled={countrySaving || residenceCountry === (user.residenceCountry ?? "DE")}
 onClick={async () => {
 setCountryError("");
 setCountrySuccess("");
 setCountrySaving(true);
 try {
 const result = await updateResidenceCountry(residenceCountry);
 if (result.error) {
 setCountryError(result.error);
 } else {
 setCountrySuccess(t("residenceSaved"));
 }
 } catch {
 setCountryError(t("saveFailed"));
 } finally {
 setCountrySaving(false);
 }
 }}
 className="w-full rounded-full bg-[var(--st-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--st-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
 >
 {countrySaving ? t("savingResidence") : t("saveResidence")}
 </button>
 </div>

 <div className="space-y-2.5">
 <button
 type="button"
 disabled={loggingOut}
 onClick={async () => {
 setLoggingOut(true);
 try {
 await logout();
 closeKonto();
 } catch {
 setLoggingOut(false);
 }
 }}
 className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-white py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
 >
 <LogOut className="w-4 h-4" />
 {loggingOut ? t("loggingOut") : t("logout")}
 </button>

 {canChangePassword === true && (
 <button
 type="button"
 onClick={() => setPasswordPanelOpen((v) => !v)}
 aria-expanded={passwordPanelOpen}
 className="flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(0,113,227,0.22)] bg-white py-2.5 text-sm font-medium text-[var(--st-primary)] transition-colors hover:bg-[rgba(0,113,227,0.08)]"
 >
 <KeyRound className="w-4 h-4" />
 {t("changePassword")}
 </button>
 )}
 </div>

 {canChangePassword === false && (
 <div className="flex items-start gap-3 rounded-2xl bg-[rgba(0,113,227,0.08)] border border-[rgba(0,113,227,0.15)] p-4">
 <User className="w-5 h-5 text-[var(--st-primary)] flex-shrink-0 mt-0.5" />
 <div className="text-sm text-blue-900">
 <p className="font-medium">{t("passwordlessTitle")}</p>
 <p className="text-blue-800/90 mt-1">
 {t("passwordlessBody")}
 </p>
 </div>
 </div>
 )}

 {canChangePassword === true && passwordPanelOpen && (
 <div className="rounded-2xl border border-[var(--st-border)] bg-[#f5f5f7] p-3 sm:p-4 space-y-3">
 <div>
 <h3 className="text-sm font-semibold text-gray-900">
 {t("changePassword")}
 </h3>
 <p className="text-xs text-gray-500 mt-0.5">
 {t("passwordHint")}
 </p>
 </div>

 <form onSubmit={handleSubmit} className="space-y-3">
 <div>
 <label className="text-xs text-gray-500 mb-1.5 block font-medium">
 {t("currentPassword")}
 </label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type={showCurrent ? "text" : "password"}
 value={currentPassword}
 onChange={(e) => setCurrentPassword(e.target.value)}
 autoComplete="current-password"
 required
 className="w-full pl-10 pr-11 py-2.5 bg-white border border-[var(--st-border)] rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--st-primary)] focus:border-transparent"
 placeholder="••••••••"
 />
 <button
 type="button"
 onClick={() => setShowCurrent(!showCurrent)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
 >
 {showCurrent ? (
 <EyeOff className="w-4 h-4" />
 ) : (
 <Eye className="w-4 h-4" />
 )}
 </button>
 </div>
 <Link
 href="/login"
 onClick={closeKonto}
 className="text-xs text-[var(--st-primary)] hover:text-[var(--st-primary-hover)] mt-2 inline-block font-medium"
 >
 {t("forgotPassword")}
 </Link>
 </div>

 <div>
 <label className="text-xs text-gray-500 mb-1.5 block font-medium">
 {t("newPassword")}
 </label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type={showNew ? "text" : "password"}
 value={newPassword}
 onChange={(e) => setNewPassword(e.target.value)}
 autoComplete="new-password"
 required
 minLength={6}
 className="w-full pl-10 pr-11 py-2.5 bg-white border border-[var(--st-border)] rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--st-primary)] focus:border-transparent"
 placeholder={t("minChars")}
 />
 <button
 type="button"
 onClick={() => setShowNew(!showNew)}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
 >
 {showNew ? (
 <EyeOff className="w-4 h-4" />
 ) : (
 <Eye className="w-4 h-4" />
 )}
 </button>
 </div>
 </div>

 <div>
 <label className="text-xs text-gray-500 mb-1.5 block font-medium">
 {t("confirmPassword")}
 </label>
 <div className="relative">
 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
 <input
 type={showNew ? "text" : "password"}
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 autoComplete="new-password"
 required
 minLength={6}
 className="w-full pl-10 pr-4 py-2.5 bg-white border border-[var(--st-border)] rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--st-primary)] focus:border-transparent"
 placeholder={t("repeat")}
 />
 </div>
 </div>

 {error && (
 <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
 <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
 <span>{error}</span>
 </div>
 )}

 {success && (
 <div className="flex items-start gap-2 text-sm text-green-600 bg-green-50 px-4 py-3 rounded-xl">
 <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
 <span>{success}</span>
 </div>
 )}

 <button
 type="submit"
 disabled={submitting}
 className="w-full flex items-center justify-center gap-2 bg-[var(--st-primary)] text-white py-3 rounded-full text-sm font-medium hover:bg-[var(--st-primary-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {submitting ? (
 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
 ) : (
 t("savePassword")
 )}
 </button>
 </form>
 </div>
 )}

 {canChangePassword === null && (
 <div className="flex justify-center py-6">
 <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--st-primary)] border-t-transparent" />
 </div>
 )}
 </div>
 </div>
 );
}
