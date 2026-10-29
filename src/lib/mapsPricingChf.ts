/**
 * Geschätzte CHF-Kosten für Google Maps Platform (Pay-as-you-go),
 * angelehnt an typische Listenpreise in CHF (Directions + Static Maps).
 * Freikontingente gelten pro Rechnungskonto und Monat — nicht pro Reise.
 */

/** Directions API: erste 10k/Monat frei, dann Staffeln (pro 1.000 Requests). */
const D_FREE = 10_000;
const D_TIER1_PER_1K = 3.98; // 10k–100k
const D_TIER2_PER_1K = 3.19; // >100k

/** Static Maps: erste 10k/Monat frei, dann Staffeln (pro 1.000 Requests). */
const S_FREE = 10_000;
const S_T1 = 100_000;
const S_T2 = 500_000;
const S_T3 = 1_000_000;
const S_P1 = 1.59;
const S_P2 = 1.27;
const S_P3 = 0.96;
const S_P4 = 0.48;

/** Kumulierte CHF, wenn im Monat genau `n` Directions-Requests abgerechnet würden (ab 0). */
export function directionsTotalChfFromZero(n: number): number {
 const x = Math.max(0, Math.floor(n));
 if (x <= D_FREE) return 0;
 const paid = x - D_FREE;
 const tier1 = Math.min(paid, 90_000);
 const tier2 = Math.max(0, paid - 90_000);
 const raw = (tier1 / 1000) * D_TIER1_PER_1K + (tier2 / 1000) * D_TIER2_PER_1K;
 return Math.round(raw * 100) / 100;
}

/** Kumulierte CHF für Static Maps ab 0 Requests (Staffeln wie typische CHF-Liste). */
export function staticMapsTotalChfFromZero(n: number): number {
 let x = Math.max(0, Math.floor(n));
 if (x <= S_FREE) return 0;
 x -= S_FREE;
 let cost = 0;
 const u1 = Math.min(x, S_T1 - S_FREE); // 10k–100k paid
 cost += (u1 / 1000) * S_P1;
 x -= u1;
 if (x <= 0) return Math.round(cost * 100) / 100;
 const u2 = Math.min(x, S_T2 - S_T1);
 cost += (u2 / 1000) * S_P2;
 x -= u2;
 if (x <= 0) return Math.round(cost * 100) / 100;
 const u3 = Math.min(x, S_T3 - S_T2);
 cost += (u3 / 1000) * S_P3;
 x -= u3;
 cost += (x / 1000) * S_P4;
 return Math.round(cost * 100) / 100;
}

/** Marginaler Anteil: Kosten für den Block `count` Requests am Ende eines Monats mit `monthTotalAlready`. */
function marginalDirectionsChf(monthTotal: number, tripCount: number): number {
 const t = Math.max(0, Math.floor(tripCount));
 if (t === 0) return 0;
 const m = Math.max(0, Math.floor(monthTotal));
 const before = Math.max(0, m - t);
 return Math.round((directionsTotalChfFromZero(m) - directionsTotalChfFromZero(before)) * 100) / 100;
}

function marginalStaticChf(monthTotal: number, tripCount: number): number {
 const t = Math.max(0, Math.floor(tripCount));
 if (t === 0) return 0;
 const m = Math.max(0, Math.floor(monthTotal));
 const before = Math.max(0, m - t);
 return Math.round((staticMapsTotalChfFromZero(m) - staticMapsTotalChfFromZero(before)) * 100) / 100;
}

export type TripMapsCostEstimate = {
 tripDirections: number;
 tripStaticMaps: number;
 monthDirections: number;
 monthStaticMaps: number;
 /** Als wären nur die Requests dieser Reise im Monat gezählt (Freikontingent je SKU von 0). */
 isolatedChf: number;
 /** Anteil dieser Reise, wenn ihre Requests „am Ende“ des lokal erfassten Monatsvolumens liegen. */
 marginalChf: number;
};

export function buildTripMapsCostEstimate(
 tripDirections: number,
 tripStatic: number,
 monthDirections: number,
 monthStatic: number
): TripMapsCostEstimate {
 const td = Math.max(0, Math.floor(tripDirections));
 const ts = Math.max(0, Math.floor(tripStatic));
 const md = Math.max(0, Math.floor(monthDirections));
 const ms = Math.max(0, Math.floor(monthStatic));
 const isolated = Math.round((directionsTotalChfFromZero(td) + staticMapsTotalChfFromZero(ts)) * 100) / 100;
 const marginal =
 Math.round((marginalDirectionsChf(md, td) + marginalStaticChf(ms, ts)) * 100) / 100;
 return {
 tripDirections: td,
 tripStaticMaps: ts,
 monthDirections: md,
 monthStaticMaps: ms,
 isolatedChf: isolated,
 marginalChf: marginal,
 };
}
