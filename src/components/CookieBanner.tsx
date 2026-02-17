"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const COOKIE_CONSENT_KEY = "sniffertrek_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              Wir verwenden Cookies
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              SnifferTrek verwendet Cookies für die Website-Funktionalität und
              zur Zuordnung von Affiliate-Buchungen. Keine persönlichen Daten
              werden an Dritte weitergegeben.{" "}
              <Link
                href="/datenschutz"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Mehr erfahren
              </Link>
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                onClick={handleAccept}
                className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all"
              >
                Alle akzeptieren
              </button>
              <button
                onClick={handleDecline}
                className="inline-flex items-center justify-center bg-gray-100 text-gray-600 px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Nur notwendige
              </button>
            </div>
          </div>
          <button
            onClick={handleDecline}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
