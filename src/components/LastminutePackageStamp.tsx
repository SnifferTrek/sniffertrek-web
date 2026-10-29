"use client";

import { ExternalLink, Package } from "lucide-react";
import { getPartner } from "@/lib/affiliateConfig";
import { buildLastminutePackagesLink } from "@/lib/affiliateLinks";
import { trackAffiliateClick } from "@/lib/affiliateTracking";
import { useAuth } from "@/components/AuthProvider";

export default function LastminutePackageStamp() {
 const { user } = useAuth();
 const partner = getPartner("lastminute-hotels");

 if (!partner || partner.status !== "active") return null;

 const baseHref = buildLastminutePackagesLink();

 return (
 <a
 href={baseHref}
 target="_blank"
 rel="noopener noreferrer sponsored"
 onClick={(e) => {
 const clickRef = `snf-home-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
 const targetUrl = buildLastminutePackagesLink({ clickRef });
 void trackAffiliateClick({
 module: "packages",
 provider: partner.provider,
 targetUrl,
 userId: user?.id,
 context: { source: "home_hero_stamp" },
 });
 e.preventDefault();
 window.open(targetUrl, "_blank", "noopener,noreferrer");
 }}
 className="group block max-w-[11.5rem] sm:max-w-[13rem] select-none"
 aria-label="lastminute: Flug- und Hotel-Pakete — in neuem Tab öffnen"
 >
 <div
 className={[
 "relative rounded-sm px-3 py-2.5 sm:px-3.5 sm:py-3 text-left",
 "bg-gradient-to-b from-[#fff59a] to-[#f5e6a3]",
 "shadow-[2px_3px_0_rgba(180,140,40,0.22),4px_8px_18px_rgba(40,30,10,0.14)]",
 "rotate-[-5deg] transition-transform duration-200 ease-out",
 "group-hover:rotate-[-2deg] group-hover:shadow-[2px_3px_0_rgba(180,140,40,0.18),5px_12px_22px_rgba(40,30,10,0.18)]",
 ].join(" ")}
 >
 <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/55" aria-hidden />
 <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-white shadow-sm ring-2 ring-[#fff59a]/90 opacity-95 transition-opacity group-hover:opacity-100">
 <ExternalLink className="h-3 w-3" aria-hidden />
 </div>
 <div className="flex items-center gap-2 mb-1">
 <Package className="h-4 w-4 shrink-0 text-amber-900/75" aria-hidden />
 <span className="text-[10px] font-bold uppercase tracking-wider text-amber-950/80">
 Eigenes Angebot
 </span>
 </div>
 <p className="text-sm font-extrabold leading-tight text-amber-950">
 last minute
 </p>
 <p className="mt-0.5 text-[11px] leading-snug text-amber-950/75">
 Flug + Hotel &amp; Pakete — direkt buchen
 </p>
 </div>
 </a>
 );
}
