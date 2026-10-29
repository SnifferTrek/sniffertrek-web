"use client";

import { Bike } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { canAccessVeloSchweiz } from "@/lib/canAccessVeloSchweiz";
import { Link } from "@/i18n/navigation";

export default function VeloSchweizHomeStamp() {
  const { user, loading } = useAuth();

  if (loading || !canAccessVeloSchweiz(user)) return null;

  return (
    <Link
      href="/planer?tab=veloSchweiz"
      onClick={() => sessionStorage.setItem("sniffertrek_velo_focus", "1")}
      className="group block max-w-[11.5rem] sm:max-w-[13rem] select-none"
      aria-label="Velo Schweiz: Veloroute planen"
    >
      <div
        className={[
          "relative rounded-sm px-3 py-2.5 sm:px-3.5 sm:py-3 text-left",
          "bg-gradient-to-b from-emerald-100 to-emerald-200",
          "shadow-[2px_3px_0_rgba(40,120,80,0.2),4px_8px_18px_rgba(20,60,40,0.14)]",
          "rotate-[4deg] transition-transform duration-200 ease-out",
          "group-hover:rotate-[2deg] group-hover:shadow-[2px_3px_0_rgba(40,120,80,0.16),5px_12px_22px_rgba(20,60,40,0.18)]",
        ].join(" ")}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/55"
          aria-hidden
        />
        <div className="flex items-center gap-2 mb-1">
          <Bike className="h-4 w-4 shrink-0 text-emerald-900/75" aria-hidden />
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-950/80">
            Beta
          </span>
        </div>
        <p className="text-sm font-extrabold leading-tight text-emerald-950">
          Velo Schweiz
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-emerald-950/75">
          Route planen — SwissTopo-Karte
        </p>
      </div>
    </Link>
  );
}
