type EventItem = {
 name: string;
 when: string;
 note: string;
};

type TravelReportEventsProps = {
 events: readonly EventItem[];
 title?: string;
};

export default function TravelReportEvents({
 events,
 title = "Events & Besonderheiten",
}: TravelReportEventsProps) {
 return (
 <section className="mt-6">
 <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">{title}</h3>
 <ul className="mt-3 grid gap-2 sm:grid-cols-2">
 {events.map((event) => (
 <li
 key={event.name}
 className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5"
 >
 <p className="text-sm font-semibold text-stone-900">
 {event.name}
 <span className="ml-2 font-normal text-stone-500">· {event.when}</span>
 </p>
 <p className="mt-0.5 text-xs leading-relaxed text-stone-600">{event.note}</p>
 </li>
 ))}
 </ul>
 </section>
 );
}
