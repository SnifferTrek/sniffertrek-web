type TocItem = {
 id: string;
 label: string;
};

type TravelReportTocProps = {
 items: readonly TocItem[];
 title?: string;
};

export default function TravelReportToc({
 items,
 title = "Inhalt",
}: TravelReportTocProps) {
 return (
 <nav
 aria-label="Inhaltsverzeichnis"
 className="rounded-xl border border-stone-200 bg-white px-4 py-4 shadow-sm sm:px-5"
 >
 <p className="text-xs font-bold uppercase tracking-wider text-stone-400">{title}</p>
 <ul className="mt-3 flex flex-wrap gap-2">
 {items.map((item) => (
 <li key={item.id}>
 <a
 href={`#${item.id}`}
 className="inline-block rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900"
 >
 {item.label}
 </a>
 </li>
 ))}
 </ul>
 </nav>
 );
}
