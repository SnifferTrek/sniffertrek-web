"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Map } from "lucide-react";

type TravelReportMapExportProps = {
 googleMapsUrl: string;
 poiListText: string;
};

export default function TravelReportMapExport({
 googleMapsUrl,
 poiListText,
}: TravelReportMapExportProps) {
 const [copied, setCopied] = useState(false);

 async function copyList() {
 try {
 await navigator.clipboard.writeText(poiListText);
 setCopied(true);
 window.setTimeout(() => setCopied(false), 2000);
 } catch {
 /* ignore */
 }
 }

 return (
 <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/50 px-4 py-4">
 <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Karte mitnehmen</p>
 <p className="mt-1 text-sm text-stone-700">
 Route in Google Maps öffnen oder POI-Liste kopieren und in eine eigene Karte einfügen.
 </p>
 <div className="mt-3 flex flex-wrap gap-2">
 <a
 href={googleMapsUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-white px-3 py-2 text-sm font-semibold text-teal-900 hover:bg-teal-50"
 >
 <Map className="h-4 w-4" />
 In Google Maps öffnen
 <ExternalLink className="h-3.5 w-3.5 opacity-60" />
 </a>
 <button
 type="button"
 onClick={copyList}
 className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
 >
 {copied ? (
 <>
 <Check className="h-4 w-4 text-green-600" />
 Kopiert
 </>
 ) : (
 <>
 <Copy className="h-4 w-4" />
 POI-Liste kopieren
 </>
 )}
 </button>
 </div>
 </div>
 );
}
