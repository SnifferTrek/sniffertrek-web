type ItineraryDay = {
 day: number;
 title: string;
 items: readonly string[];
};

type TravelReportItineraryProps = {
 id: string;
 days: readonly ItineraryDay[];
 title: string;
 subtitle?: string;
};

export default function TravelReportItinerary({
 id,
 days,
 title,
 subtitle = "Zum Abhaken – der Reisebericht darunter erzählt, wie es sich angefühlt hat.",
}: TravelReportItineraryProps) {
 return (
 <section id={id} className="scroll-mt-24">
 <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">{title}</h2>
 {subtitle ? <p className="mt-2 text-sm text-stone-600">{subtitle}</p> : null}
 <ol className="mt-4 space-y-4">
 {days.map((day) => (
 <li
 key={day.day}
 className="rounded-xl border border-stone-200 bg-white px-4 py-4 shadow-sm sm:px-5"
 >
 <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
 Tag {day.day}
 </p>
 <p className="mt-0.5 text-sm font-semibold text-stone-900">{day.title}</p>
 <ul className="mt-3 space-y-2">
 {day.items.map((item) => (
 <li key={item} className="flex gap-2 text-sm leading-relaxed text-stone-600">
 <span className="text-teal-600" aria-hidden>
 →
 </span>
 {item}
 </li>
 ))}
 </ul>
 </li>
 ))}
 </ol>
 </section>
 );
}
