type TransferOption = {
 title: string;
 body: string;
 price: string;
};

type TravelReportTransferProps = {
 options: readonly TransferOption[];
 title?: string;
};

export default function TravelReportTransfer({
 options,
 title = "Flughafen Marco Polo → Zentrum",
}: TravelReportTransferProps) {
 return (
 <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-4">
 <p className="text-xs font-bold uppercase tracking-wider text-stone-500">{title}</p>
 <ul className="mt-3 grid gap-3 sm:grid-cols-3">
 {options.map((opt) => (
 <li key={opt.title} className="rounded-lg border border-stone-200 bg-white px-3 py-3">
 <p className="text-sm font-semibold text-stone-900">
 {opt.title}
 <span className="ml-1.5 font-normal text-teal-700">{opt.price}</span>
 </p>
 <p className="mt-1 text-xs leading-relaxed text-stone-600">{opt.body}</p>
 </li>
 ))}
 </ul>
 </div>
 );
}
