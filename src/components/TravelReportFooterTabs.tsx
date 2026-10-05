"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, ExternalLink } from "lucide-react";
import { getTravelReportInfo } from "@/lib/travelReportInfo";

type PartnerLink = {
 id: string;
 label: string;
 href: string;
 className: string;
};

export type HotelPickLink = {
 id: string;
 name: string;
 stars: string;
 area: string;
 note: string;
 audience?: string;
 href: string;
 tier: "standard" | "luxury" | "budget";
};

export type GeneralInfoSection = {
 heading: string;
 body: string;
};

type TravelReportFooterTabsProps = {
 hotelLinks: PartnerLink[];
 destinationLabel: string;
 hotelIntro: string;
 hotelPicks: HotelPickLink[];
 hotelSearchLabel?: string;
 generalInfo?: {
 title: string;
 sections: GeneralInfoSection[];
 };
};

const tierBadge: Record<HotelPickLink["tier"], string> = {
 standard: "bg-teal-100 text-teal-800",
 luxury: "bg-amber-100 text-amber-900",
 budget: "bg-stone-200 text-stone-700",
};

export default function TravelReportFooterTabs({
 hotelLinks,
 destinationLabel,
 hotelIntro,
 hotelPicks,
 hotelSearchLabel,
 generalInfo,
}: TravelReportFooterTabsProps) {
 const t = useTranslations("reportUi");
 const info = getTravelReportInfo(useLocale());
 const [tab, setTab] = useState<"hotels" | "info" | "destination">("hotels");

 /** Footer-Tab-Farben: aktiv stone-50 + teal, inaktiv transparent. */
 const tabBtn = (active: boolean) =>
 `flex-1 px-3 py-3 text-sm font-semibold transition-colors sm:px-4 ${
 active
 ? "border-b-2 border-teal-700 bg-stone-50 text-teal-900"
 : "bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-800"
 }`;

 return (
 <section id="hotels" className="mx-auto mt-16 max-w-3xl scroll-mt-24 px-4 sm:px-6">
 <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
 <div className="flex border-b border-stone-200">
 <button type="button" onClick={() => setTab("hotels")} className={tabBtn(tab === "hotels")}>
 {t("stayTab")}
 </button>
 <button type="button" onClick={() => setTab("info")} className={tabBtn(tab === "info")}>
 {info.title}
 </button>
 {generalInfo ? (
 <button
 type="button"
 onClick={() => setTab("destination")}
 className={tabBtn(tab === "destination")}
 >
 {generalInfo.title}
 </button>
 ) : null}
 </div>

 <div className="p-6">
 {tab === "hotels" ? (
 <>
 <h2 className="text-lg font-bold text-stone-900">{t("stayIn", { place: destinationLabel })}</h2>
 <p className="mt-2 text-sm leading-relaxed text-stone-600">{hotelIntro}</p>

 <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-stone-400">
 {t("recsByArea")}
 </h3>
 {hotelSearchLabel ? (
 <p className="mt-2 text-xs text-stone-500">
 {t("partnerLinks", { label: hotelSearchLabel })}
 </p>
 ) : null}
 <ul className="mt-3 space-y-3">
 {hotelPicks.map((pick) => (
 <li key={pick.id}>
 <a
 href={pick.href}
 target="_blank"
 rel="noopener noreferrer sponsored"
 className="group flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50/60 p-4 transition-colors hover:border-red-200 hover:bg-red-50/50"
 >
 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <span className="font-semibold text-stone-900 group-hover:text-red-900">
 {pick.name}
 </span>
 <span
 className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tierBadge[pick.tier]}`}
 >
 {pick.stars}
 </span>
 <span className="text-xs text-stone-500">{pick.area}</span>
 </div>
 <p className="mt-1 text-sm text-stone-600 group-hover:text-stone-700">
 {pick.audience ? (
 <>
 <span className="font-medium text-stone-800">{pick.audience}:</span>{" "}
 </>
 ) : null}
 {pick.note}
 </p>
 </div>
 <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-stone-300 transition-colors group-hover:text-red-600" />
 </a>
 </li>
 ))}
 </ul>

 <p className="mt-6 text-sm text-stone-600">Weitere Portale zum Vergleich:</p>
 <div className="mt-3 flex flex-wrap gap-2">
 {hotelLinks.map((link) => (
 <a
 key={link.id}
 href={link.href}
 target="_blank"
 rel="noopener noreferrer sponsored"
 className={link.className}
 >
 {link.label}
 <ExternalLink className="h-3.5 w-3.5 opacity-60" />
 </a>
 ))}
 </div>
 </>
 ) : tab === "info" ? (
 <>
 <h2 className="text-lg font-bold text-stone-900">{info.title}</h2>
 <div className="mt-4 space-y-4 text-sm leading-relaxed text-stone-700">
 {info.paragraphs.map((p, i) => (
 <p key={i}>{p}</p>
 ))}
 </div>
 </>
 ) : generalInfo ? (
 <>
 <h2 className="text-lg font-bold text-stone-900">{generalInfo.title}</h2>
 <div className="mt-4 space-y-5">
 {generalInfo.sections.map((section) => (
 <div key={section.heading}>
 <h3 className="text-sm font-bold text-stone-900">{section.heading}</h3>
 <p className="mt-1.5 text-sm leading-relaxed text-stone-700">{section.body}</p>
 </div>
 ))}
 </div>
 </>
 ) : null}
 </div>
 </div>
 </section>
 );
}
