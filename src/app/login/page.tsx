"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Globe,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Check,
  Map,
  KeyRound,
  ArrowLeft,
} from "lucide-react";
import {
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
} from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

const errorMessages: Record<string, string> = {
  "Invalid login credentials": "E-Mail oder Passwort ist falsch.",
  "Email not confirmed": "Bitte bestätige zuerst deine E-Mail-Adresse. Prüfe deinen Posteingang.",
  "User already registered": "Diese E-Mail ist bereits registriert. Versuche dich anzumelden.",
  "Password should be at least 6 characters": "Das Passwort muss mindestens 6 Zeichen lang sein.",
  "Unable to validate email address: invalid format": "Ungültiges E-Mail-Format.",
  "Email rate limit exceeded": "Zu viele Versuche. Bitte warte 5–10 Minuten und versuche es dann erneut.",
  "rate limit exceeded": "Zu viele Versuche. Bitte warte 5–10 Minuten und versuche es dann erneut.",
  "over_email_send_rate_limit": "E-Mail-Limit erreicht. Bitte warte einige Minuten.",
  "Signup requires a valid password": "Bitte gib ein gültiges Passwort ein.",
  "For security purposes": "Aus Sicherheitsgründen: Bitte warte einige Minuten vor dem nächsten Versuch.",
  "Load failed": "Netzwerkfehler. Bitte prüfe deine Internetverbindung, deaktiviere Ad-Blocker und versuche es erneut.",
  "Failed to fetch": "Netzwerkfehler. Bitte prüfe deine Internetverbindung und versuche es erneut.",
  "NetworkError": "Netzwerkfehler. Bitte versuche es erneut oder nutze einen anderen Browser.",
};

function translateError(msg: string): string {
  for (const [key, value] of Object.entries(errorMessages)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return msg;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const configured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "reset") {
        if (!email) {
          setError("Bitte gib deine E-Mail-Adresse ein.");
          setLoading(false);
          return;
        }
        const result = await resetPassword(email);
        if (result.error) {
          setError(translateError(result.error));
        } else {
          setSuccess("E-Mail zum Zurücksetzen wurde gesendet. Prüfe deinen Posteingang.");
        }
      } else if (mode === "login") {
        const result = await signInWithEmail(email, password);
        if (result.error) {
          setError(translateError(result.error));
        } else {
          router.push("/planer");
        }
      } else {
        if (password.length < 6) {
          setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
          setLoading(false);
          return;
        }
        const result = await signUpWithEmail(email, password, name);
        if (result.error) {
          setError(translateError(result.error));
        } else {
          setSuccess(
            "Konto erstellt! Bitte überprüfe deine E-Mail zur Bestätigung, danach kannst du dich anmelden."
          );
        }
      }
    } catch {
      setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: "login" | "register" | "reset") => {
    setMode(newMode);
    setError("");
    setSuccess("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 pt-20 pb-16 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "login"
              ? "Willkommen zurück"
              : mode === "register"
              ? "Konto erstellen"
              : "Passwort zurücksetzen"}
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            {mode === "login"
              ? "Melde dich an, um deine Reisen zu synchronisieren."
              : mode === "register"
              ? "Erstelle ein kostenloses Konto für SnifferTrek."
              : "Gib deine E-Mail ein und wir senden dir einen Link."}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          {!configured && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Login noch nicht verfügbar
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Die Anmeldung wird bald aktiviert. Du kannst den Planer
                    schon jetzt nutzen – deine Daten werden lokal gespeichert.
                  </p>
                  <Link
                    href="/planer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 mt-2"
                  >
                    <Map className="w-3.5 h-3.5" />
                    Zum Planer ohne Login
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Back button for reset mode */}
          {mode === "reset" && (
            <button
              onClick={() => switchMode("login")}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück zum Login
            </button>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dein Name"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block font-medium">
                E-Mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="deine@email.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {mode !== "reset" && (
              <div>
                <label className="text-xs text-gray-500 mb-1.5 block font-medium">
                  Passwort
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("reset")}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium"
                  >
                    Passwort vergessen?
                  </button>
                )}
              </div>
            )}

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
              disabled={!configured || loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === "login" ? (
                <>
                  Anmelden
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : mode === "register" ? (
                <>
                  Konto erstellen
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Link senden
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          {mode !== "reset" && (
            <p className="text-center text-sm text-gray-500 mt-6">
              {mode === "login" ? (
                <>
                  Noch kein Konto?{" "}
                  <button
                    onClick={() => switchMode("register")}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Registrieren
                  </button>
                </>
              ) : (
                <>
                  Bereits ein Konto?{" "}
                  <button
                    onClick={() => switchMode("login")}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Anmelden
                  </button>
                </>
              )}
            </p>
          )}
        </div>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          {[
            "Reisen synchronisieren",
            "Auf allen Geräten",
            "100% kostenlos",
            "Kein Spam",
          ].map((benefit) => (
            <div
              key={benefit}
              className="flex items-center gap-2 text-sm text-gray-500"
            >
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              {benefit}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
