type DurationOption = {
 days: string;
 summary: string;
};

type TravelReportDurationCompareProps = {
 id?: string;
 options: readonly DurationOption[];
 title?: string;
};

export default function TravelReportDurationCompare({
 id = "dauer-vergleich",
 options,
 title = "Wie viele Tage reichen?",
}: TravelReportDurationCompareProps) {
 return (
 <section id={id} className="scroll-mt-24">
 <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">{title}</h2>
 <ul className="mt-3 divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
 {options.map((opt) => (
 <li key={opt.days} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4">
 <span className="shrink-0 text-sm font-bold text-teal-800 sm:w-20">{opt.days}</span>
 <span className="text-sm leading-relaxed text-stone-600">{opt.summary}</span>
 </li>
 ))}
 </ul>
 </section>
 );
}
