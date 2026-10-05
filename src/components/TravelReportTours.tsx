import { ExternalLink } from "lucide-react";

type Tour = {
 title: string;
 body: string;
 href: string;
 linkLabel: string;
};

type TravelReportToursProps = {
 id?: string;
 title: string;
 subtitle?: string;
 tours: readonly Tour[];
 disclosure?: string;
};

export default function TravelReportTours({
 id = "touren",
 title,
 subtitle = "Kuratiert – Tickets online spart Schlange. Links zu GetYourGuide (Affiliate möglich).",
 tours,
 disclosure,
}: TravelReportToursProps) {
 return (
 <section id={id} className="scroll-mt-24">
 <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">{title}</h2>
 <p className="mt-1 text-sm text-stone-600">{subtitle}</p>
 <ul className="mt-4 space-y-3">
 {tours.map((tour) => (
 <li
 key={tour.title}
 className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
 >
 <p className="text-sm font-semibold text-stone-900">{tour.title}</p>
 <p className="mt-1 text-sm text-stone-600">{tour.body}</p>
 <a
 href={tour.href}
 target="_blank"
 rel="noopener noreferrer"
 className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900"
 >
 {tour.linkLabel}
 <ExternalLink className="h-3.5 w-3.5 opacity-70" />
 </a>
 </li>
 ))}
 </ul>
 {disclosure ? <p className="mt-3 text-xs text-stone-500">{disclosure}</p> : null}
 </section>
 );
}
