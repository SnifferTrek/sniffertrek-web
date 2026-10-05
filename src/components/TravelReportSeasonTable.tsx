"use client";

import { useTranslations } from "next-intl";

type SeasonRow = {
 season: string;
 months: string;
 temp: string;
 crowd: string;
 note: string;
};

type TravelReportSeasonTableProps = {
 id?: string;
 title?: string;
 rows: readonly SeasonRow[];
};

export default function TravelReportSeasonTable({
 id = "saison",
 title,
 rows,
}: TravelReportSeasonTableProps) {
 const t = useTranslations("reportUi");
 const heading = title ?? t("seasonTitle");
 return (
 <section id={id} className="scroll-mt-24">
 <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">{heading}</h2>
 <div className="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
 <table className="w-full text-left text-sm">
 <thead>
 <tr className="border-b border-stone-100 bg-stone-50">
 <th className="px-3 py-2.5 font-semibold text-stone-700 sm:px-4">{t("season")}</th>
 <th className="hidden px-3 py-2.5 font-semibold text-stone-700 sm:table-cell sm:px-4">
 {t("months")}
 </th>
 <th className="px-3 py-2.5 font-semibold text-stone-700 sm:px-4">{t("temp")}</th>
 <th className="px-3 py-2.5 font-semibold text-stone-700 sm:px-4">{t("crowd")}</th>
 </tr>
 </thead>
 <tbody>
 {rows.map((row) => (
 <tr key={row.season} className="border-b border-stone-100 last:border-0">
 <td className="px-3 py-3 sm:px-4">
 <span className="font-medium text-stone-900">{row.season}</span>
 <span className="mt-0.5 block text-xs text-stone-500 sm:hidden">{row.months}</span>
 <span className="mt-1 block text-xs text-stone-500">{row.note}</span>
 </td>
 <td className="hidden px-3 py-3 text-stone-600 sm:table-cell sm:px-4">
 {row.months}
 </td>
 <td className="whitespace-nowrap px-3 py-3 text-stone-700 sm:px-4">{row.temp}</td>
 <td className="px-3 py-3 text-stone-700 sm:px-4">{row.crowd}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </section>
 );
}
