"use client";

import { useEffect } from "react";

import { useAuth } from "@/components/AuthProvider";
import { useKontoPanel } from "@/components/KontoPanelContext";
import { useRouter } from "@/i18n/navigation";

/**
 * Öffnet das Konto-Panel und leitet zum Planer weiter (kein eigenes Vollbild-Formular).
 */
export default function KontoPage() {
 const router = useRouter();
 const { user, loading, configured } = useAuth();
 const { openKonto } = useKontoPanel();

 useEffect(() => {
 if (!configured) return;
 if (loading) return;
 if (!user) {
 router.replace("/login?next=/konto");
 return;
 }
 openKonto();
 router.replace("/planer");
 }, [loading, user, router, openKonto, configured]);

 return (
 <div className="min-h-[50vh] flex items-center justify-center pt-20 px-4">
 <div className="w-8 h-8 border-2 border-[var(--st-primary)] border-t-transparent rounded-full animate-spin" />
 </div>
 );
}
