import EnlargeableImage from "@/components/EnlargeableImage";
import type { LightboxSlide } from "@/lib/travelReports/types";

export type TravelReportPoiCard = {
 id: string;
 caption: string;
 photo: string;
 alt: string;
 tip: string;
};

type TravelReportPoiCardsProps = {
 pois: readonly TravelReportPoiCard[];
 title: string;
 subtitle: string;
 id?: string;
 gallery: readonly LightboxSlide[];
};

export default function TravelReportPoiCards({
 pois,
 title,
 subtitle,
 id = "poi-highlights",
 gallery,
}: TravelReportPoiCardsProps) {
 return (
 <section id={id} className="mx-auto mt-16 max-w-3xl scroll-mt-24 px-4 sm:px-6">
 <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">{title}</h2>
 <p className="mt-2 text-sm text-stone-600">{subtitle}</p>
 <ul className="mt-4 grid gap-4 sm:grid-cols-2">
 {pois.map((poi, index) => (
 <li
 key={poi.id}
 className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
 >
 <EnlargeableImage
 src={poi.photo}
 alt={poi.alt}
 caption={poi.caption}
 variant="embedded"
 gallery={gallery}
 galleryIndex={index}
 />
 <div className="px-4 py-3">
 <p className="text-sm font-semibold text-stone-900">{poi.caption}</p>
 <p className="mt-1 text-sm leading-relaxed text-stone-600">{poi.tip}</p>
 </div>
 </li>
 ))}
 </ul>
 </section>
 );
}
