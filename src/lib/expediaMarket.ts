import {
 type ResidenceCountry,
 resolveInsuranceCountry,
} from "@/lib/residenceCountry";

export type ExpediaMarket = {
 host: string;
 /** siteid auf der Hotel-Search-Landing-URL (regional). */
 siteid: string;
 locale: string;
 currency: string;
};

/**
 * siteid im expedia.com/affiliate-Wrapper — immer DE (6).
 * Nur so kommen clickref + affdtl (snf-…) zuverlässig an; 1/72/422 → kein Tracking.
 */
export const EXPEDIA_AFFILIATE_WRAPPER_SITEID = "6";

/** Expedia POS für DACH – siteid CH aus Live-Affiliate-URL verifiziert. */
const EXPEDIA_MARKET_BY_COUNTRY: Record<ResidenceCountry, ExpediaMarket> = {
 CH: {
 host: "www.expedia.ch",
 siteid: "72",
 locale: "de_CH",
 currency: "CHF",
 },
 DE: {
 host: "www.expedia.de",
 siteid: "6",
 locale: "de_DE",
 currency: "EUR",
 },
 AT: {
 host: "www.expedia.at",
 siteid: "422",
 locale: "de_AT",
 currency: "EUR",
 },
};

/** Ohne Sniffertrek-Login → US (Original-Affiliate). */
export const EXPEDIA_US_MARKET: ExpediaMarket = {
 host: "www.expedia.com",
 siteid: "1",
 locale: "en_US",
 currency: "USD",
};

export function resolveExpediaGuestMarket(): ExpediaMarket {
 return EXPEDIA_US_MARKET;
}

export function resolveExpediaMarket(
 user: { residenceCountry?: ResidenceCountry | null } | null
): ExpediaMarket {
 return EXPEDIA_MARKET_BY_COUNTRY[resolveInsuranceCountry(user)];
}

export function expediaOrigin(market: ExpediaMarket): string {
 return `https://${market.host}`;
}
