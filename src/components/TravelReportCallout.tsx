import { ExternalLink } from "lucide-react";

type TravelReportCalloutProps = {
 title: string;
 body: string;
 bullets?: readonly string[];
 href?: string;
 linkLabel?: string;
 secondaryHref?: string;
 secondaryLinkLabel?: string;
 variant?: "info" | "warn";
};

export default function TravelReportCallout({
 title,
 body,
 bullets,
 href,
 linkLabel,
 secondaryHref,
 secondaryLinkLabel,
 variant = "info",
}: TravelReportCalloutProps) {
 const styles =
 variant === "warn"
 ? "border-amber-200 bg-amber-50/80"
 : "border-teal-200 bg-teal-50/60";

 return (
 <aside
 className={`rounded-xl border px-4 py-4 shadow-sm sm:px-5 ${styles}`}
 role="note"
 >
 <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{title}</p>
 <p className="mt-2 text-sm leading-relaxed text-stone-800">{body}</p>
 {bullets && bullets.length > 0 ? (
 <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-700">
 {bullets.map((b) => (
 <li key={b}>{b}</li>
 ))}
 </ul>
 ) : null}
 {href || secondaryHref ? (
 <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
 {href ? (
 <a
 href={href}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:text-teal-950"
 >
 {linkLabel ?? "Mehr erfahren"}
 <ExternalLink className="h-3.5 w-3.5 opacity-70" />
 </a>
 ) : null}
 {secondaryHref ? (
 <a
 href={secondaryHref}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 text-sm font-semibold text-stone-600 hover:text-stone-900"
 >
 {secondaryLinkLabel ?? "FAQ"}
 <ExternalLink className="h-3.5 w-3.5 opacity-70" />
 </a>
 ) : null}
 </div>
 ) : null}
 </aside>
 );
}
