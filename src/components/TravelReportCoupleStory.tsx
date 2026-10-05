import ReportRichText from "@/components/ReportRichText";

type TravelReportCoupleStoryProps = {
 text: string;
};

/** Kurze «wir waren dort»-Einblendung im Reisebericht. */
export default function TravelReportCoupleStory({ text }: TravelReportCoupleStoryProps) {
 return (
 <aside className="rounded-xl border-l-4 border-amber-300/90 bg-amber-50/80 px-4 py-3">
 <p className="text-[11px] font-bold uppercase tracking-wider text-amber-900/80">
 Aus unserer Reise
 </p>
 <p className="mt-1.5 text-sm leading-relaxed text-amber-950/90">
 <ReportRichText text={text} />
 </p>
 </aside>
 );
}
