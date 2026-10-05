import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

type RelatedLink = {
 href: string;
 label: string;
 description: string;
};

type TravelReportRelatedLinksProps = {
 links: RelatedLink[];
 title?: string;
};

export default function TravelReportRelatedLinks({
 links,
 title = "Weiter planen",
}: TravelReportRelatedLinksProps) {
 return (
 <section className="mx-auto mt-16 max-w-3xl px-4 sm:px-6">
 <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">{title}</h2>
 <ul className="mt-4 space-y-3">
 {links.map((link) => (
 <li key={link.href + link.label}>
 <Link
 href={link.href}
 className="group flex items-start gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition-colors hover:border-teal-200 hover:bg-teal-50/40"
 >
 <div className="min-w-0 flex-1">
 <p className="text-sm font-semibold text-stone-900 group-hover:text-teal-900">
 {link.label}
 </p>
 <p className="mt-0.5 text-sm text-stone-600">{link.description}</p>
 </div>
 <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-stone-300 group-hover:text-teal-600" />
 </Link>
 </li>
 ))}
 </ul>
 </section>
 );
}
