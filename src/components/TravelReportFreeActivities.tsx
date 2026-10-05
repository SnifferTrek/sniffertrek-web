
import { Link } from "@/i18n/navigation";
type Activity = {
 label: string;
 anchor: string;
 note?: string;
};

type TravelReportFreeActivitiesProps = {
 id?: string;
 title?: string;
 subtitle?: string;
 activities: readonly Activity[];
};

export default function TravelReportFreeActivities({
 id = "kostenlos",
 title = "Kostenlos & fast gratis",
 subtitle = "Unsere schnelle Liste – Klick springt zum Abschnitt im Bericht.",
 activities,
}: TravelReportFreeActivitiesProps) {
 return (
 <section id={id} className="scroll-mt-24">
 <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">{title}</h2>
 <p className="mt-1 text-sm text-stone-600">{subtitle}</p>
 <ul className="mt-4 grid gap-2 sm:grid-cols-2">
 {activities.map((item) => (
 <li key={`${item.anchor}-${item.label}`}>
 <Link
 href={`#${item.anchor}`}
 className="flex flex-col rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-teal-300 hover:bg-teal-50/50"
 >
 <span className="font-semibold text-stone-900">{item.label}</span>
 {item.note ? (
 <span className="mt-0.5 text-xs text-stone-500">{item.note}</span>
 ) : null}
 </Link>
 </li>
 ))}
 </ul>
 </section>
 );
}
