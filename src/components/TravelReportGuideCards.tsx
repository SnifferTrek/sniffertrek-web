import { ExternalLink } from "lucide-react";

export type GuideCard = {
 id: string;
 title: string;
 verdict: string;
 price: string;
 timing: string;
 tip: string;
 href?: string;
 linkLabel?: string;
};

type TravelReportGuideCardsProps = {
 id?: string;
 title?: string;
 cards: readonly GuideCard[];
};

export default function TravelReportGuideCards({
 id = "tipps-sehenswertes",
 title = "Lohnt sich?",
 cards,
}: TravelReportGuideCardsProps) {
 return (
 <section id={id} className="scroll-mt-24">
 <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">{title}</h2>
 <div className="mt-4 space-y-3">
 {cards.map((card) => (
 <article
 key={card.id}
 className="rounded-xl border border-stone-200 bg-white px-4 py-4 shadow-sm sm:px-5"
 >
 <h3 className="text-sm font-bold text-stone-900">{card.title}</h3>
 <p className="mt-2 text-sm font-medium text-teal-900">{card.verdict}</p>
 <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">
 Preis
 </dt>
 <dd className="text-stone-700">{card.price}</dd>
 </div>
 <div>
 <dt className="text-xs font-semibold uppercase tracking-wide text-stone-400">
 Timing
 </dt>
 <dd className="text-stone-700">{card.timing}</dd>
 </div>
 </dl>
 <p className="mt-3 text-sm leading-relaxed text-stone-600">{card.tip}</p>
 {card.href ? (
 <a
 href={card.href}
 target="_blank"
 rel="noopener noreferrer"
 className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900"
 >
 {card.linkLabel ?? "Mehr"}
 <ExternalLink className="h-3.5 w-3.5 opacity-70" />
 </a>
 ) : null}
 </article>
 ))}
 </div>
 </section>
 );
}
