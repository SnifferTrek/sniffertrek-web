export type PartnerStatus = "active" | "open" | "todo";

export interface AffiliatePartner {
  id: string;
  module: string;
  provider: string;
  api: string;
  commission: string;
  registrationLink: string;
  status: PartnerStatus;
  statusNote: string;
  affiliateId: string;
  baseUrl: string;
}

const STORAGE_KEY = "sniffertrek_affiliate_config";

export const defaultPartners: AffiliatePartner[] = [
  // --- Flüge ---
  {
    id: "google-flights",
    module: "Flüge",
    provider: "Google Flights",
    api: "Deeplink (kein Affiliate)",
    commission: "0%",
    registrationLink: "https://www.google.com/travel/flights",
    status: "active",
    statusNote: "Kein Affiliate nötig",
    affiliateId: "",
    baseUrl: "https://www.google.com/travel/flights",
  },
  {
    id: "booking-flights",
    module: "Flüge",
    provider: "Booking.com Flights",
    api: "Affiliate-Link",
    commission: "bis 25% der Booking-Provision",
    registrationLink: "https://affiliate.booking.com",
    status: "active",
    statusNote: "",
    affiliateId: "qGaAthMz3hClWbk8y9l_C32Opg",
    baseUrl: "https://www.booking.com/flights",
  },
  {
    id: "expedia-flights",
    module: "Flüge",
    provider: "Expedia Flights",
    api: "EPN Affiliate",
    commission: "≈3%",
    registrationLink: "https://partners.expediagroup.com/",
    status: "open",
    statusNote: "Anmeldung erforderlich",
    affiliateId: "95boiHC",
    baseUrl: "https://www.expedia.com/Flights-Search",
  },
  {
    id: "skyscanner",
    module: "Flüge",
    provider: "Skyscanner",
    api: "Affiliate-Link",
    commission: "1–3%",
    registrationLink: "https://www.partners.skyscanner.net/",
    status: "open",
    statusNote: "Affiliate ID eintragen",
    affiliateId: "",
    baseUrl: "https://www.skyscanner.com",
  },
  {
    id: "kiwi",
    module: "Flüge",
    provider: "Kiwi.com (Tequila)",
    api: "REST API",
    commission: "3–5%",
    registrationLink: "https://tequila.kiwi.com/",
    status: "open",
    statusNote: "API beantragen",
    affiliateId: "",
    baseUrl: "https://tequila.kiwi.com/",
  },
  {
    id: "kayak",
    module: "Flüge",
    provider: "Kayak",
    api: "Affiliate-Link",
    commission: "1–2%",
    registrationLink: "https://www.kayak.com/affiliates",
    status: "open",
    statusNote: "Affiliate ID eintragen",
    affiliateId: "",
    baseUrl: "https://www.kayak.com",
  },
  // --- Hotels ---
  {
    id: "hotels-com",
    module: "Hotels",
    provider: "Hotels.com",
    api: "EPN – Affiliate ID: 10ZQa9h",
    commission: "3–6%",
    registrationLink: "https://www.expedia.com/affiliate",
    status: "active",
    statusNote: "Tracking testen",
    affiliateId: "10ZQa9h",
    baseUrl: "https://www.hotels.com",
  },
  {
    id: "booking-hotels",
    module: "Hotels",
    provider: "Booking.com",
    api: "Affiliate-Link + Deep Link",
    commission: "bis 25% der Booking-Provision",
    registrationLink: "https://affiliate.booking.com",
    status: "active",
    statusNote: "",
    affiliateId: "qGaAthMz3hClWbk8y9l_C32Opg",
    baseUrl: "https://www.booking.com/searchresults.html",
  },
  {
    id: "expedia-hotels",
    module: "Hotels",
    provider: "Expedia",
    api: "EPN / EPS Rapid API",
    commission: "4–6%",
    registrationLink: "https://www.expedia.com/affiliate",
    status: "open",
    statusNote: "Anmeldung",
    affiliateId: "95boiHC",
    baseUrl: "https://www.expedia.com/Hotel-Search",
  },
  {
    id: "agoda",
    module: "Hotels",
    provider: "Agoda",
    api: "Awin / CJ Affiliate",
    commission: "4–7%",
    registrationLink: "https://www.agoda.com/partners/",
    status: "open",
    statusNote: "Anmeldung",
    affiliateId: "",
    baseUrl: "https://www.agoda.com/search",
  },
  {
    id: "airbnb",
    module: "Hotels",
    provider: "Airbnb",
    api: "Kein offizielles Affiliate",
    commission: "n/a",
    registrationLink: "https://www.airbnb.ch/affiliates",
    status: "todo",
    statusNote: "Konzept definieren",
    affiliateId: "",
    baseUrl: "https://www.airbnb.com/s",
  },
  {
    id: "hostelworld",
    module: "Hotels",
    provider: "Hostelworld",
    api: "Affiliate-Link",
    commission: "20%",
    registrationLink: "https://www.hostelworld.com/affiliates",
    status: "open",
    statusNote: "Anmeldung",
    affiliateId: "",
    baseUrl: "https://www.hostelworld.com/search",
  },
  {
    id: "amadeus",
    module: "Hotels",
    provider: "Amadeus Hotel API",
    api: "Self-Service API",
    commission: "Nutzung nach Calls",
    registrationLink: "https://developers.amadeus.com/",
    status: "open",
    statusNote: "API beantragen",
    affiliateId: "",
    baseUrl: "https://test.api.amadeus.com",
  },
  // --- Mietwagen ---
  {
    id: "rentalcars",
    module: "Mietwagen",
    provider: "Rentalcars.com",
    api: "Affiliate-Link",
    commission: "5–8%",
    registrationLink: "https://www.rentalcars.com/affiliates",
    status: "open",
    statusNote: "Anmeldung",
    affiliateId: "",
    baseUrl: "https://www.rentalcars.com",
  },
  {
    id: "booking-cars",
    module: "Mietwagen",
    provider: "Booking.com Cars",
    api: "Affiliate-Link",
    commission: "3–5%",
    registrationLink: "https://www.booking.com/cars",
    status: "active",
    statusNote: "",
    affiliateId: "qGaAthMz3hClWbk8y9l_C32Opg",
    baseUrl: "https://www.booking.com/cars",
  },
  {
    id: "expedia-cars",
    module: "Mietwagen",
    provider: "Expedia Cars",
    api: "EPN Affiliate",
    commission: "3–5%",
    registrationLink: "https://www.expedia.com/affiliate",
    status: "open",
    statusNote: "Anmeldung",
    affiliateId: "95boiHC",
    baseUrl: "https://www.expedia.com/Cars",
  },
  {
    id: "billiger-mietwagen",
    module: "Mietwagen",
    provider: "billiger-mietwagen.de",
    api: "Deep Link",
    commission: "≈5%",
    registrationLink: "https://www.billiger-mietwagen.de/partner.html",
    status: "open",
    statusNote: "Anmeldung",
    affiliateId: "",
    baseUrl: "https://www.billiger-mietwagen.de",
  },
  // --- Züge ---
  {
    id: "trainline",
    module: "Züge",
    provider: "Trainline",
    api: "Affiliate-Link",
    commission: "3–5%",
    registrationLink: "https://www.trainline.com/affiliates",
    status: "open",
    statusNote: "Affiliate ID eintragen",
    affiliateId: "",
    baseUrl: "https://www.trainline.com",
  },
  {
    id: "omio",
    module: "Züge",
    provider: "Omio",
    api: "Affiliate-Link",
    commission: "3–5%",
    registrationLink: "https://www.omio.com/affiliates",
    status: "open",
    statusNote: "Affiliate ID eintragen",
    affiliateId: "",
    baseUrl: "https://www.omio.com",
  },
  // --- POIs & Aktivitäten ---
  {
    id: "google-places",
    module: "POIs & Aktivitäten",
    provider: "Google Places / Maps",
    api: "API-Key vorhanden",
    commission: "0% (API-Kosten)",
    registrationLink: "https://console.cloud.google.com/",
    status: "active",
    statusNote: "",
    affiliateId: "",
    baseUrl: "https://console.cloud.google.com/",
  },
  {
    id: "getyourguide",
    module: "POIs & Aktivitäten",
    provider: "GetYourGuide",
    api: "Affiliate-Link",
    commission: "6–10%",
    registrationLink: "https://partner.getyourguide.com/",
    status: "open",
    statusNote: "Affiliate ID eintragen",
    affiliateId: "",
    baseUrl: "https://www.getyourguide.com",
  },
  {
    id: "viator",
    module: "POIs & Aktivitäten",
    provider: "Viator / TripAdvisor",
    api: "Affiliate Programm",
    commission: "4–8%",
    registrationLink: "https://www.tripadvisor.com/affiliates",
    status: "open",
    statusNote: "API beantragen",
    affiliateId: "",
    baseUrl: "https://www.viator.com",
  },
  {
    id: "klook",
    module: "POIs & Aktivitäten",
    provider: "Klook",
    api: "Affiliate-Link",
    commission: "5–8%",
    registrationLink: "https://www.klook.com/affiliates",
    status: "open",
    statusNote: "Affiliate ID eintragen",
    affiliateId: "",
    baseUrl: "https://www.klook.com",
  },
  // --- eSIM ---
  {
    id: "airalo",
    module: "eSIM",
    provider: "Airalo",
    api: "Affiliate-Link (Deeplink)",
    commission: "10–20%",
    registrationLink: "https://www.airalo.com/affiliates",
    status: "open",
    statusNote: "Affiliate ID eintragen",
    affiliateId: "",
    baseUrl: "https://ref.airalo.com",
  },
  {
    id: "holafly",
    module: "eSIM",
    provider: "Holafly",
    api: "Affiliate-Link (Deeplink)",
    commission: "10–15%",
    registrationLink: "https://www.holafly.com/affiliates",
    status: "open",
    statusNote: "Affiliate ID eintragen",
    affiliateId: "",
    baseUrl: "https://holafly.com",
  },
  {
    id: "nomad-esim",
    module: "eSIM",
    provider: "Nomad eSIM",
    api: "Affiliate-Link (Deeplink)",
    commission: "10–20%",
    registrationLink: "https://www.nomad-esim.com/affiliates",
    status: "open",
    statusNote: "Affiliate ID eintragen",
    affiliateId: "",
    baseUrl: "https://nomad-esim.com",
  },
  // --- Reiseversicherung ---
  {
    id: "allianz-travel",
    module: "Reiseversicherung",
    provider: "Allianz Travel",
    api: "Affiliate-Link",
    commission: "10–20%",
    registrationLink: "https://www.allianztravel.com/affiliates",
    status: "open",
    statusNote: "Affiliate ID eintragen",
    affiliateId: "",
    baseUrl: "https://www.allianztravel.com",
  },
  {
    id: "world-nomads",
    module: "Reiseversicherung",
    provider: "World Nomads",
    api: "Affiliate-Link",
    commission: "15–25%",
    registrationLink: "https://www.worldnomads.com/affiliates",
    status: "open",
    statusNote: "Affiliate ID eintragen",
    affiliateId: "",
    baseUrl: "https://www.worldnomads.com",
  },
  {
    id: "ergo",
    module: "Reiseversicherung",
    provider: "ERGO Reiseversicherung",
    api: "Affiliate-Link",
    commission: "8–15%",
    registrationLink: "https://www.ergo.de/reiseversicherung",
    status: "open",
    statusNote: "Affiliate ID eintragen",
    affiliateId: "",
    baseUrl: "https://www.ergo.de/reiseversicherung",
  },
  // --- AI / Tools ---
  {
    id: "openai",
    module: "AI / Tools",
    provider: "OpenAI (ChatGPT)",
    api: "API-Key (Usage-basiert)",
    commission: "0% – Kosten pro Token",
    registrationLink: "https://platform.openai.com/account/api-keys",
    status: "active",
    statusNote: "",
    affiliateId: "",
    baseUrl: "https://platform.openai.com/",
  },
];

export function loadPartners(): AffiliatePartner[] {
  if (typeof window === "undefined") return defaultPartners;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultPartners;
  try {
    return JSON.parse(stored) as AffiliatePartner[];
  } catch {
    return defaultPartners;
  }
}

export function savePartners(partners: AffiliatePartner[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(partners));
}

export function getPartner(id: string): AffiliatePartner | undefined {
  return loadPartners().find((p) => p.id === id);
}

export function updatePartner(
  id: string,
  updates: Partial<AffiliatePartner>
): void {
  const partners = loadPartners();
  const idx = partners.findIndex((p) => p.id === id);
  if (idx >= 0) {
    partners[idx] = { ...partners[idx], ...updates };
    savePartners(partners);
  }
}

export function getModules(): string[] {
  const modules = new Set(defaultPartners.map((p) => p.module));
  return Array.from(modules);
}

export function getPartnersByModule(
  module: string,
  partners?: AffiliatePartner[]
): AffiliatePartner[] {
  const list = partners ?? loadPartners();
  return list.filter((p) => p.module === module);
}

export function getActivePartners(
  partners?: AffiliatePartner[]
): AffiliatePartner[] {
  const list = partners ?? loadPartners();
  return list.filter((p) => p.status === "active");
}
