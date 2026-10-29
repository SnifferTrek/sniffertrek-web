export type PartnerLabelInfo = {
  brandName: string;
  isAffiliate: boolean;
};

const BRAND_BY_DOMAIN: readonly { domain: string; brand: string }[] = [
  { domain: "booking.com", brand: "Booking.com" },
  { domain: "hotels.com", brand: "Hotels.com" },
  { domain: "expedia.com", brand: "Expedia" },
  { domain: "expedia.de", brand: "Expedia" },
  { domain: "expedia.ch", brand: "Expedia" },
  { domain: "expedia.at", brand: "Expedia" },
  { domain: "agoda.com", brand: "Agoda" },
  { domain: "trivago.de", brand: "trivago" },
  { domain: "trivago.com", brand: "trivago" },
  { domain: "skyscanner.com", brand: "Skyscanner" },
  { domain: "skyscanner.de", brand: "Skyscanner" },
  { domain: "kayak.com", brand: "KAYAK" },
  { domain: "rentalcars.com", brand: "Rentalcars.com" },
  { domain: "billiger-mietwagen.de", brand: "billiger-mietwagen.de" },
  { domain: "getyourguide.com", brand: "GetYourGuide" },
  { domain: "viator.com", brand: "Viator" },
  { domain: "lastminute.de", brand: "lastminute.de" },
  { domain: "airalo.com", brand: "Airalo" },
  { domain: "holafly.com", brand: "Holafly" },
  { domain: "nomad-esim.com", brand: "Nomad eSIM" },
  { domain: "trainline.com", brand: "Trainline" },
  { domain: "omio.com", brand: "Omio" },
  { domain: "hostelworld.com", brand: "Hostelworld" },
  { domain: "google.com", brand: "Google Flights" },
];

function hostMatches(hostname: string, domain: string): boolean {
  const h = hostname.toLowerCase();
  const d = domain.toLowerCase();
  return h === d || h.endsWith(`.${d}`);
}

function brandFromHostname(hostname: string): string {
  const bare = hostname.toLowerCase().replace(/^www\./, "");
  for (const { domain, brand } of BRAND_BY_DOMAIN) {
    if (hostMatches(bare, domain)) return brand;
  }
  if (bare.includes("google") && bare.includes("travel")) return "Google Flights";
  return bare;
}

/** Final landing URL after known affiliate redirect wrappers (for brand detection). */
export function resolvePartnerTargetUrl(href: string): string {
  const trimmed = href.trim();
  if (!trimmed) return trimmed;
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    if (host.includes("hotels.com") && /\/affiliates?\//i.test(url.pathname)) {
      const landing = url.searchParams.get("landingPage");
      if (landing?.trim()) return landing.trim();
    }
  } catch {
    return trimmed;
  }
  return trimmed;
}

export function isBookingAffiliateAid(aid: string | undefined | null): boolean {
  const id = aid?.trim();
  if (!id) return false;
  return /^\d{4,12}$/.test(id);
}

function detectAffiliate(href: string, resolvedHref: string): boolean {
  const hay = `${href} ${resolvedHref}`.toLowerCase();
  if (hay.includes("/affiliates/")) return true;
  if (hay.includes("hotels.com/affiliate")) return true;
  if (/\baffcid=/.test(hay)) return true;
  if (/\bcamref=/.test(hay)) return true;
  if (/\brffrid=/.test(hay)) return true;
  if (/\bpartner_id=/.test(hay)) return true;
  if (hay.includes("ref.airalo.com")) return true;
  if (/\b(?:[?&])aid=\d{4,12}\b/.test(hay)) return true;
  if (/\bclickref=/.test(hay) && hay.includes("hotels.com")) return true;
  if (/\bclickref=/.test(hay) && hay.includes("expedia.")) return true;
  return false;
}

export function partnerLabelFromUrl(href: string): PartnerLabelInfo {
  const trimmed = href.trim();
  if (!trimmed) {
    return { brandName: "Partner", isAffiliate: false };
  }
  const resolved = resolvePartnerTargetUrl(trimmed);
  let brandName = "Partner";
  try {
    brandName = brandFromHostname(new URL(resolved).hostname);
  } catch {
    try {
      brandName = brandFromHostname(new URL(trimmed).hostname);
    } catch {
      brandName = "Partner";
    }
  }
  return {
    brandName,
    isAffiliate: detectAffiliate(trimmed, resolved),
  };
}

type PartnerCtaVariant = "search" | "open" | "brand";

export function partnerLinkCta(
  href: string,
  variant: PartnerCtaVariant,
  locale: string = "de",
): string {
  const { brandName } = partnerLabelFromUrl(href);
  const loc = locale.split("-")[0];
  if (variant === "brand") return brandName;
  if (loc === "en") {
    return variant === "search" ? `Search on ${brandName}` : `Open on ${brandName}`;
  }
  if (loc === "es") {
    return variant === "search" ? `Buscar en ${brandName}` : `Abrir en ${brandName}`;
  }
  return variant === "search" ? `Bei ${brandName} suchen` : `Bei ${brandName} öffnen`;
}
