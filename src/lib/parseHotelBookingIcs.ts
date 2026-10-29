export type ParsedHotelBookingIcs = {
  hotelName?: string;
  address?: string;
  confirmation?: string;
  bookingLink?: string;
  provider?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
};

function unfoldIcsLines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function decodeIcsValue(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\N/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function parseIcsEvents(text: string): Map<string, string>[] {
  const unfolded = unfoldIcsLines(text);
  const events: Map<string, string>[] = [];
  let current: Map<string, string> | null = null;

  for (const rawLine of unfolded.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line === "BEGIN:VEVENT") {
      current = new Map();
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) events.push(current);
      current = null;
      continue;
    }
    if (!current) continue;

    const colon = line.indexOf(":");
    if (colon <= 0) continue;
    const keyPart = line.slice(0, colon);
    const value = decodeIcsValue(line.slice(colon + 1));
    const key = keyPart.split(";")[0].toUpperCase();
    const existing = current.get(key);
    current.set(key, existing ? `${existing}\n${value}` : value);
  }

  return events;
}

function icsDateToIso(raw: string): string | undefined {
  const value = raw.trim();
  if (!value) return undefined;
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length < 8) return undefined;
  const y = digits.slice(0, 4);
  const m = digits.slice(4, 6);
  const d = digits.slice(6, 8);
  return `${y}-${m}-${d}`;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const [y1, m1, d1] = checkIn.split("-").map(Number);
  const [y2, m2, d2] = checkOut.split("-").map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  const diff = Math.round((b - a) / (24 * 60 * 60 * 1000));
  return Math.max(1, diff);
}

const CONFIRMATION_RE =
  /(?:Bestätigungscode|Buchungsnummer|Confirmation(?:\s*(?:code|number|#))?|Reservation\s*(?:code|number|#)?|Itinerary\s*#?)[:\s#]+([A-Z0-9][A-Z0-9-]{5,})/i;

const PROVIDER_ALIASES: readonly { pattern: RegExp; label: string }[] = [
  { pattern: /hotels\.com/i, label: "Hotels.com" },
  { pattern: /booking\.com/i, label: "Booking.com" },
  { pattern: /expedia/i, label: "Expedia" },
  { pattern: /agoda/i, label: "Agoda" },
];

function detectProvider(text: string): string | undefined {
  for (const { pattern, label } of PROVIDER_ALIASES) {
    if (pattern.test(text)) return label;
  }
  const host = text.match(/(?:Gastgeber|Host|Organizer)[:\s]+([^\n]+)/i);
  if (host?.[1]) {
    const name = host[1].trim();
    if (name.length > 0 && !/^unterkunft$/i.test(name)) return name;
  }
  const summary = text.match(/Unterkunft:\s*([^\n]+)/i) || text.match(/Accommodation:\s*([^\n]+)/i);
  if (summary?.[1]) {
    const name = summary[1].trim();
    if (!/^hotels\.com$/i.test(name) && name.length > 2) return name;
    if (/hotels\.com/i.test(name)) return "Hotels.com";
  }
  return undefined;
}

function extractHotelName(summary: string, _location: string, description: string): string | undefined {
  const prop =
    description.match(/(?:Hotel|Property|Unterkunft|Accommodation)[:\s]+([^\n]+)/i) ||
    description.match(/^([^\n]+)\n(?:Bestätigung|Confirmation)/im);
  if (prop?.[1]) {
    const name = prop[1].trim();
    if (name.length > 2 && !/^hotels\.com$/i.test(name) && !/^unterkunft:/i.test(name)) {
      return name;
    }
  }
  const sum = summary.replace(/^Unterkunft:\s*/i, "").replace(/^Accommodation:\s*/i, "").trim();
  if (sum && !/^hotels\.com$/i.test(sum) && sum.length > 3) return sum;
  return undefined;
}

function extractAddress(location: string, description: string): string | undefined {
  const loc = location.replace(/\\n/g, ", ").trim();
  if (loc && loc.length > 8 && !/^https?:/i.test(loc)) return loc;
  const addr = description.match(/(?:Adresse|Address|Location)[:\s]+([^\n]+)/i);
  if (addr?.[1]?.trim()) return addr[1].trim();
  return undefined;
}

function extractUrl(text: string, eventUrl?: string): string | undefined {
  const fromField = eventUrl?.trim();
  if (fromField && /^https?:/i.test(fromField)) return fromField;
  const match = text.match(/https?:\/\/[^\s<>"']+/i);
  return match?.[0];
}

function eventToBooking(event: Map<string, string>): ParsedHotelBookingIcs {
  const summary = event.get("SUMMARY") || "";
  const description = event.get("DESCRIPTION") || "";
  const location = event.get("LOCATION") || "";
  const urlField = event.get("URL") || "";
  const combined = `${summary}\n${description}\n${location}\n${urlField}`;

  const checkIn = icsDateToIso(event.get("DTSTART") || "");
  const checkOut = icsDateToIso(event.get("DTEND") || "");
  const confirmation = combined.match(CONFIRMATION_RE)?.[1]?.trim();

  const provider = detectProvider(combined);
  const bookingLink = extractUrl(combined, urlField);
  const hotelName = extractHotelName(summary, location, description);
  const address = extractAddress(location, description);

  const out: ParsedHotelBookingIcs = {};
  if (hotelName) out.hotelName = hotelName;
  if (address) out.address = address;
  if (confirmation) out.confirmation = confirmation;
  if (bookingLink) out.bookingLink = bookingLink;
  if (provider) out.provider = provider;
  if (checkIn) out.checkIn = checkIn;
  if (checkOut) out.checkOut = checkOut;
  if (checkIn && checkOut) out.nights = nightsBetween(checkIn, checkOut);
  else if (checkIn && !checkOut) out.nights = 1;

  return out;
}

function scoreBookingCandidate(parsed: ParsedHotelBookingIcs, event: Map<string, string>): number {
  let score = 0;
  if (parsed.confirmation) score += 4;
  if (parsed.checkIn) score += 2;
  if (parsed.bookingLink) score += 2;
  if (parsed.provider) score += 1;
  const blob = `${event.get("SUMMARY") || ""} ${event.get("DESCRIPTION") || ""}`.toLowerCase();
  if (/hotel|unterkunft|accommodation|hotels\.com|booking\.com/.test(blob)) score += 2;
  return score;
}

/** Parse Hotels.com / Booking-style calendar invites (.ics). */
export function parseHotelBookingIcs(icsText: string): ParsedHotelBookingIcs {
  const events = parseIcsEvents(icsText);
  if (events.length === 0) {
    throw new Error("NO_VEVENT");
  }

  let best: ParsedHotelBookingIcs | null = null;
  let bestScore = -1;

  for (const event of events) {
    const parsed = eventToBooking(event);
    const score = scoreBookingCandidate(parsed, event);
    if (score > bestScore) {
      bestScore = score;
      best = parsed;
    }
  }

  if (!best || bestScore < 2) {
    throw new Error("NO_BOOKING_DATA");
  }

  return best;
}
