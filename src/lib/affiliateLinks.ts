import { loadPartners } from "./affiliateConfig";

interface SearchParams {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  travelers?: number;
  rooms?: number;
  origin?: string;
  clickRef?: string;
}

function getPartnerConfig(id: string) {
  const partners = loadPartners();
  return partners.find((p) => p.id === id);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return dateStr;
}

function formatBookingDate(dateStr: string): string {
  if (!dateStr) return "";
  return dateStr.replace(/-/g, "-");
}

// --- HOTELS ---

export function buildBookingHotelLink(params: SearchParams): string {
  const partner = getPartnerConfig("booking-hotels");
  const base = "https://www.booking.com/searchresults.html";
  const query = new URLSearchParams();
  if (params.destination) query.set("ss", params.destination);
  if (params.checkIn) query.set("checkin", formatBookingDate(params.checkIn));
  if (params.checkOut) query.set("checkout", formatBookingDate(params.checkOut));
  if (params.travelers) query.set("group_adults", String(params.travelers));
  if (params.rooms) query.set("no_rooms", String(params.rooms));
  if (partner?.affiliateId) query.set("aid", partner.affiliateId);
  return `${base}?${query.toString()}`;
}

export function buildExpediaHotelLink(params: SearchParams): string {
  // Creator link + tracking params + dynamic search values.
  const url = new URL("https://expedia.com/affiliates/sniffertrek/zuerich-mar10-mar12");
  const clickRef = params.clickRef?.trim() || "1101lCkMQ5EE";
  url.searchParams.set("siteid", "1");
  url.searchParams.set("langid", "1033");
  url.searchParams.set("clickref", clickRef);
  url.searchParams.set("affcid", "US.DIRECT.PHG.1011l412531.0");
  url.searchParams.set("ref_id", clickRef);
  url.searchParams.set("my_ad", "AFF.US.DIRECT.PHG.1011l412531.0");
  url.searchParams.set("afflid", "1101lCkMQ5EE");
  url.searchParams.set("affdtl", "PHG.1101lCkMQ5EE.VPWYLDv9bf");

  if (params.destination) url.searchParams.set("destination", params.destination);
  if (params.checkIn) url.searchParams.set("startDate", formatDate(params.checkIn));
  if (params.checkOut) url.searchParams.set("endDate", formatDate(params.checkOut));
  if (params.travelers) url.searchParams.set("adults", String(params.travelers));
  if (params.rooms) url.searchParams.set("rooms", String(params.rooms));

  return url.toString();
}

export function buildHotelsComLink(params: SearchParams): string {
  void params;
  // Safe tracking-first link (no destination/date prefill).
  return "https://www.hotels.com/affiliates/hotelscom-home.10ZQa9h";
}

export function buildHotelsComDeeplink(params: SearchParams): string {
  const url = new URL("https://www.hotels.com/Hotel-Search");
  const clickRef = params.clickRef?.trim() || "1101lCkMQ5EE";
  if (params.destination) url.searchParams.set("destination", params.destination);
  if (params.checkIn) url.searchParams.set("startDate", formatDate(params.checkIn));
  if (params.checkOut) url.searchParams.set("endDate", formatDate(params.checkOut));
  if (params.rooms) url.searchParams.set("rooms", String(params.rooms));
  if (params.travelers) url.searchParams.set("adults", String(params.travelers));
  url.searchParams.set("pos", "HCOM_CH");
  url.searchParams.set("locale", "de_CH");
  url.searchParams.set("clickref", clickRef);
  url.searchParams.set("rffrid", clickRef);
  url.searchParams.set("AFFCID", "US.DIRECT.PHG.1011l412531.0");
  url.searchParams.set("affcid", "US.DIRECT.PHG.1011l412531.0");
  url.searchParams.set("afflid", "1101lCkMQ5EE");
  url.searchParams.set("affdtl", "PHG.1101lCkMQ5EE.VPWYLDv9bf");
  return url.toString();
}

export function buildExpediaHotelDeeplink(params: SearchParams): string {
  const url = new URL("https://www.expedia.com/go/hotel/search/Destination");
  const clickRef = params.clickRef?.trim() || "1101lCkMQ5EE";
  url.searchParams.set("SearchType", "Destination");
  if (params.destination) url.searchParams.set("CityName", params.destination);
  if (params.checkIn) url.searchParams.set("InDate", formatDate(params.checkIn));
  if (params.checkOut) url.searchParams.set("OutDate", formatDate(params.checkOut));
  if (params.rooms) url.searchParams.set("NumRoom", String(params.rooms));
  if (params.travelers) url.searchParams.set("NumAdult-Room1", String(params.travelers));
  url.searchParams.set("siteid", "1");
  url.searchParams.set("langid", "1033");
  url.searchParams.set("clickref", clickRef);
  url.searchParams.set("affcid", "US.DIRECT.PHG.1011l412531.0");
  url.searchParams.set("ref_id", clickRef);
  url.searchParams.set("my_ad", "AFF.US.DIRECT.PHG.1011l412531.0");
  url.searchParams.set("afflid", "1101lCkMQ5EE");
  url.searchParams.set("affdtl", "PHG.1101lCkMQ5EE.VPWYLDv9bf");
  url.searchParams.set("mdpcid", "US.DIRECT.PHG.1011l412531.0");
  return url.toString();
}

export function buildAgodaHotelLink(params: SearchParams): string {
  const partner = getPartnerConfig("agoda");
  const base = "https://www.agoda.com/search";
  const query = new URLSearchParams();
  if (params.destination) query.set("city", params.destination);
  if (params.checkIn) query.set("checkIn", params.checkIn);
  if (params.checkOut) query.set("checkOut", params.checkOut);
  if (params.travelers) query.set("adults", String(params.travelers));
  if (params.rooms) query.set("rooms", String(params.rooms));
  if (partner?.affiliateId) query.set("cid", partner.affiliateId);
  return `${base}?${query.toString()}`;
}

export function buildHostelworldLink(params: SearchParams): string {
  const base = "https://www.hostelworld.com/search";
  const query = new URLSearchParams();
  if (params.destination) query.set("search_keywords", params.destination);
  if (params.checkIn) query.set("DateRange.Start", params.checkIn);
  if (params.checkOut) query.set("DateRange.End", params.checkOut);
  if (params.travelers) query.set("NumberOfGuests", String(params.travelers));
  return `${base}?${query.toString()}`;
}

export function buildTrivagoLink(params: SearchParams): string {
  const base = "https://www.trivago.de/de/srl";
  const query = new URLSearchParams();
  if (params.destination) query.set("q", params.destination);
  if (params.checkIn && params.checkOut) {
    const dr = params.checkIn.replace(/-/g, "") + "-" + params.checkOut.replace(/-/g, "");
    query.set("dr", dr);
  }
  if (params.travelers) query.set("ga", String(params.travelers));
  if (params.rooms) query.set("gr", String(params.rooms));
  return `${base}?${query.toString()}`;
}

// --- FLIGHTS ---

export function buildGoogleFlightsLink(params: SearchParams): string {
  const base = "https://www.google.com/travel/flights";
  const query = new URLSearchParams();
  if (params.origin && params.destination) {
    return `${base}?q=flights+from+${encodeURIComponent(params.origin)}+to+${encodeURIComponent(params.destination)}`;
  }
  if (params.destination) {
    return `${base}?q=flights+to+${encodeURIComponent(params.destination)}`;
  }
  return base;
}

export function buildBookingFlightsLink(params: SearchParams): string {
  const partner = getPartnerConfig("booking-flights");
  const base = "https://www.booking.com/flights/search.html";
  const query = new URLSearchParams();
  if (params.destination) query.set("to", params.destination);
  if (params.origin) query.set("from", params.origin);
  if (params.checkIn) query.set("depart", params.checkIn);
  if (params.checkOut) query.set("return", params.checkOut);
  if (params.travelers) query.set("adults", String(params.travelers));
  if (partner?.affiliateId) query.set("aid", partner.affiliateId);
  return `${base}?${query.toString()}`;
}

export function buildSkyscannerLink(params: SearchParams): string {
  const base = "https://www.skyscanner.com/transport/flights";
  if (params.origin && params.destination) {
    const from = encodeURIComponent(params.origin);
    const to = encodeURIComponent(params.destination);
    let url = `${base}/${from}/${to}`;
    if (params.checkIn) url += `/${params.checkIn.replace(/-/g, "")}`;
    if (params.checkOut) url += `/${params.checkOut.replace(/-/g, "")}`;
    return url;
  }
  return "https://www.skyscanner.com";
}

export function buildKayakLink(params: SearchParams): string {
  const base = "https://www.kayak.com/flights";
  if (params.origin && params.destination) {
    const from = encodeURIComponent(params.origin);
    const to = encodeURIComponent(params.destination);
    let url = `${base}/${from}-${to}`;
    if (params.checkIn) url += `/${params.checkIn}`;
    if (params.checkOut) url += `/${params.checkOut}`;
    return url;
  }
  return "https://www.kayak.com/flights";
}

// --- CAR RENTAL ---

export function buildBookingCarsLink(params: SearchParams): string {
  const partner = getPartnerConfig("booking-cars");
  const base = "https://www.booking.com/cars/search.html";
  const query = new URLSearchParams();
  if (params.destination) query.set("ss", params.destination);
  if (params.checkIn) query.set("pick_date", params.checkIn);
  if (params.checkOut) query.set("drop_date", params.checkOut);
  if (partner?.affiliateId) query.set("aid", partner.affiliateId);
  return `${base}?${query.toString()}`;
}

export function buildRentalcarsLink(params: SearchParams): string {
  const base = "https://www.rentalcars.com/search";
  const query = new URLSearchParams();
  if (params.destination) query.set("location", params.destination);
  if (params.checkIn) query.set("puDay", params.checkIn);
  if (params.checkOut) query.set("doDay", params.checkOut);
  return `${base}?${query.toString()}`;
}

export function buildBilligerMietwagenLink(params: SearchParams): string {
  const base = "https://www.billiger-mietwagen.de/search.html";
  const query = new URLSearchParams();
  if (params.destination) query.set("location", params.destination);
  return `${base}?${query.toString()}`;
}

// --- eSIM ---

export function buildAiraloLink(destination?: string): string {
  const partner = getPartnerConfig("airalo");
  if (partner?.affiliateId) {
    return `https://ref.airalo.com/${partner.affiliateId}`;
  }
  if (destination) {
    return `https://www.airalo.com/search?keyword=${encodeURIComponent(destination)}`;
  }
  return "https://www.airalo.com";
}

export function buildHolaflyLink(destination?: string): string {
  const partner = getPartnerConfig("holafly");
  if (partner?.affiliateId) {
    return `https://holafly.com/?ref=${partner.affiliateId}`;
  }
  if (destination) {
    return `https://holafly.com/search?q=${encodeURIComponent(destination)}`;
  }
  return "https://holafly.com";
}

export function buildNomadEsimLink(destination?: string): string {
  const partner = getPartnerConfig("nomad-esim");
  if (partner?.affiliateId) {
    return `https://www.nomad-esim.com/?ref=${partner.affiliateId}`;
  }
  return "https://www.nomad-esim.com";
}

// --- ACTIVITIES ---

export function buildGetYourGuideLink(destination?: string): string {
  const partner = getPartnerConfig("getyourguide");
  const base = "https://www.getyourguide.com";
  if (destination) {
    const query = new URLSearchParams({ q: destination });
    if (partner?.affiliateId) query.set("partner_id", partner.affiliateId);
    return `${base}/s/?${query.toString()}`;
  }
  return base;
}

export function buildViatorLink(destination?: string): string {
  const partner = getPartnerConfig("viator");
  const base = "https://www.viator.com";
  if (destination) {
    return `${base}/searchResults/all?text=${encodeURIComponent(destination)}`;
  }
  return base;
}

// --- TRAINS ---

export function buildTrainlineLink(params: SearchParams): string {
  const base = "https://www.trainline.com/search";
  if (params.origin && params.destination) {
    const query = new URLSearchParams({
      origin: params.origin,
      destination: params.destination,
    });
    if (params.checkIn) query.set("outwardDate", params.checkIn);
    if (params.travelers) query.set("adults", String(params.travelers));
    return `${base}?${query.toString()}`;
  }
  return "https://www.trainline.com";
}

export function buildOmioLink(params: SearchParams): string {
  const base = "https://www.omio.com/search";
  if (params.origin && params.destination) {
    return `${base}/${encodeURIComponent(params.origin)}/${encodeURIComponent(params.destination)}`;
  }
  return "https://www.omio.com";
}

// --- INSURANCE ---

export function buildAllianzTravelLink(): string {
  return "https://www.allianztravel.com";
}

export function buildWorldNomadsLink(): string {
  return "https://www.worldnomads.com";
}
