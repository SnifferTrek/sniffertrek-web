/** Fliesstext mit **fett**-Markern. */
export default function ReportRichText({
 text,
 className = "",
}: {
 text: string;
 className?: string;
}) {
 const parts = text.split(/\*\*(.*?)\*\*/g);
 return (
 <span className={className}>
 {parts.map((part, i) =>
 i % 2 === 1 ? (
 <strong key={i} className="font-semibold text-stone-900">
 {part}
 </strong>
 ) : (
 part
 )
 )}
 </span>
 );
}
