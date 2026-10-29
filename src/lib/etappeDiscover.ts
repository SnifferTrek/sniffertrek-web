export type EtappeDiscoverMode = "ai" | "along" | "region";

export function getEtappeStopNames(etappe: {
 from: string;
 to: string;
 legs: Array<{ to: string }>;
}): string[] {
 const seen = new Set<string>();
 const out: string[] = [];
 const push = (name: string) => {
 const trimmed = name.trim();
 if (!trimmed || seen.has(trimmed)) return;
 seen.add(trimmed);
 out.push(trimmed);
 };
 push(etappe.from);
 for (const leg of etappe.legs) push(leg.to);
 push(etappe.to);
 return out;
}
