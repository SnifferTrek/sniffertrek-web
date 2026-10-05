import { MapPin, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";

type AtAGlanceProps = {
 id?: string;
 mustSees: readonly string[];
 quarters: string;
 transport: string;
 planHint: string;
 planerHref: string;
 planAnchorId?: string;
 planAnchorLabel?: string;
};

export default function TravelReportAtAGlance({
 id = "auf-einen-blick",
 mustSees,
 quarters,
 transport,
 planHint,
 planerHref,
 planAnchorId = "plan-3-tage",
 planAnchorLabel = "3-Tage-Plan ansehen",
}: AtAGlanceProps) {
 return (
 <section
 id={id}
 className="scroll-mt-24 st-card px-5 py-6 sm:px-6"
 >
 <h2 className="text-xs font-bold uppercase tracking-wider text-teal-800">Auf einen Blick</h2>
 <div className="mt-4 grid gap-5 sm:grid-cols-2">
 <div>
 <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Must-sees</p>
 <ul className="mt-2 space-y-1.5">
 {mustSees.map((item) => (
 <li key={item} className="flex gap-2 text-sm leading-snug text-stone-700">
 <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-600" aria-hidden />
 {item}
 </li>
 ))}
 </ul>
 </div>
 <div className="space-y-4">
 <div>
 <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Quartier</p>
 <p className="mt-1 text-sm leading-relaxed text-stone-700">{quarters}</p>
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Transport</p>
 <p className="mt-1 text-sm leading-relaxed text-stone-700">{transport}</p>
 </div>
 <div>
 <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Planung</p>
 <p className="mt-1 text-sm leading-relaxed text-stone-700">{planHint}</p>
 </div>
 </div>
 </div>
 <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-teal-100 pt-4">
 <Link
 href={planerHref}
 className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
 >
 <Sparkles className="h-4 w-4" />
 Im Planer anlegen
 </Link>
 <a
 href={`#${planAnchorId}`}
 className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:text-teal-950"
 >
 <MapPin className="h-4 w-4 opacity-70" />
 {planAnchorLabel}
 </a>
 </div>
 </section>
 );
}
