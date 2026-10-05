import { ExternalLink } from "lucide-react";

export type VenueListItem = {
 name: string;
 subtitle?: string;
 description: string;
 price?: string;
 duration?: string;
 href?: string;
 linkLabel?: string;
};

type TravelReportVenueListProps = {
 id: string;
 title: string;
 intro?: string;
 items: readonly VenueListItem[];
 /** Aufklappbar wie Budget (details/summary). */
 collapsible?: boolean;
 /** Preisstand-Hinweis im aufklappbaren Header. */
 priceStandLabel?: string;
};

function VenueListItems({ items }: { items: readonly VenueListItem[] }) {
 return (
 <ul className="space-y-3">
 {items.map((item) => (
 <li
 key={item.name}
 className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
 >
 <p className="text-sm font-semibold text-stone-900">
 {item.name}
 {item.subtitle ? (
 <span className="ml-2 font-normal text-stone-500">· {item.subtitle}</span>
 ) : null}
 </p>
 <p className="mt-1 text-sm leading-relaxed text-stone-600">{item.description}</p>
 {(item.price || item.duration) && (
 <p className="mt-2 text-xs text-stone-500">
 {[item.price, item.duration].filter(Boolean).join(" · ")}
 </p>
 )}
 {item.href ? (
 <a
 href={item.href}
 target="_blank"
 rel="noopener noreferrer"
 className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900"
 >
 {item.linkLabel ?? "Infos & Tickets"}
 <ExternalLink className="h-3.5 w-3.5 opacity-70" />
 </a>
 ) : null}
 </li>
 ))}
 </ul>
 );
}

export default function TravelReportVenueList({
 id,
 title,
 intro,
 items,
 collapsible = false,
 priceStandLabel,
}: TravelReportVenueListProps) {
 if (collapsible) {
 return (
 <section id={id} className="scroll-mt-24">
 <details className="group rounded-xl border border-stone-200 bg-white shadow-sm open:shadow-md">
 <summary className="cursor-pointer list-none px-4 py-4 marker:content-none sm:px-5 [&::-webkit-details-marker]:hidden">
 <span className="flex items-start justify-between gap-3">
 <span>
 <span className="block text-xs font-bold uppercase tracking-wider text-stone-400">
 {title}
 </span>
 {intro ? (
 <span className="mt-1 block text-sm text-stone-600">{intro}</span>
 ) : null}
 {priceStandLabel ? (
 <span className="mt-1 block text-xs text-stone-400">{priceStandLabel}</span>
 ) : null}
 </span>
 <span
 className="mt-0.5 shrink-0 text-lg font-normal leading-none text-stone-400 transition-transform group-open:rotate-45"
 aria-hidden
 >
 +
 </span>
 </span>
 </summary>
 <div className="border-t border-stone-100 px-4 pb-4 pt-3 sm:px-5">
 <VenueListItems items={items} />
 </div>
 </details>
 </section>
 );
 }

 return (
 <section id={id} className="scroll-mt-24">
 <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">{title}</h2>
 {intro ? <p className="mt-1 text-sm text-stone-600">{intro}</p> : null}
 <div className="mt-4">
 <VenueListItems items={items} />
 </div>
 </section>
 );
}
