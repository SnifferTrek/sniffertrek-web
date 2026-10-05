"use client";

import type { TravelReportBudgetLine } from "@/lib/travelReports/types";
import { Link } from "@/i18n/navigation";

type TravelReportBudgetProps = {
 id?: string;
 lines: readonly TravelReportBudgetLine[];
 title: string;
 subtitle?: string;
 priceStandLabel: string;
};

export default function TravelReportBudget({
 id = "budget",
 lines,
 title,
 subtitle = "Richtwerte pro Person bzw. pro Doppelzimmer – je nach Saison variabel.",
 priceStandLabel,
}: TravelReportBudgetProps) {
 return (
 <section id={id} className="scroll-mt-24">
 <details className="group rounded-xl border border-stone-200 bg-white shadow-sm open:shadow-md">
 <summary className="cursor-pointer list-none px-4 py-4 marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
 <span className="flex items-start justify-between gap-3">
 <span>
 <span className="block text-xs font-bold uppercase tracking-wider text-stone-400">
 {title}
 </span>
 {subtitle ? (
 <span className="mt-1 block text-sm text-stone-600">{subtitle}</span>
 ) : null}
 <span className="mt-1 block text-xs text-stone-400">
 {priceStandLabel}
 </span>
 </span>
 <span
 className="mt-0.5 shrink-0 text-lg font-normal leading-none text-stone-400 transition-transform group-open:rotate-45"
 aria-hidden
 >
 +
 </span>
 </span>
 </summary>
 <div className="border-t border-stone-100 px-2 pb-2 pt-1 sm:px-3">
 <div className="overflow-hidden rounded-lg">
 <table className="w-full text-left text-sm">
 <thead>
 <tr className="border-b border-stone-100 bg-stone-50">
 <th className="px-3 py-3 font-semibold text-stone-700 sm:px-4">Posten</th>
 <th className="px-3 py-3 font-semibold text-stone-700 sm:px-4">Ca.</th>
 </tr>
 </thead>
 <tbody>
 {lines.map((line) => (
 <tr key={line.label} className="border-b border-stone-100 last:border-0">
 <td className="px-3 py-3 text-stone-800 sm:px-4">
 <span className="font-medium">{line.label}</span>
 {line.note ? (
 <span className="mt-0.5 block text-xs text-stone-500">
 {line.note}
 {line.anchorId ? (
 <>
 {" · "}
 <Link
 href={`#${line.anchorId}`}
 className="font-medium text-teal-700 hover:text-teal-900"
 >
 Im Bericht
 </Link>
 </>
 ) : null}
 </span>
 ) : null}
 </td>
 <td className="whitespace-nowrap px-3 py-3 font-semibold text-teal-800 sm:px-4">
 {line.price}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </details>
 </section>
 );
}
