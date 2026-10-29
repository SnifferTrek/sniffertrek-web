import type { RouteStop } from "@/lib/types";

/** Feste Unterkunft: Hotelname oder Buchungsnr. → „Gebucht“, Datums-Sperre. */
export function stopHasLodgingBooking(
  stop: Pick<RouteStop, "bookingConfirmation" | "bookingHotelName">,
): boolean {
  return Boolean(stop.bookingConfirmation?.trim() || stop.bookingHotelName?.trim());
}

/** @deprecated Alias – gleiche Semantik wie stopHasLodgingBooking */
export function isBookedHotelStop(
  stop: Pick<RouteStop, "bookingConfirmation" | "bookingHotelName">,
): boolean {
  return stopHasLodgingBooking(stop);
}

export function addDaysIso(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

export type HotelStayDates = { checkIn: string; checkOut: string; nights: number };

/** Nur gespeicherte Felder – kein Cursor/Reise-Start. */
export function getBookedHotelDatesOnly(stop: RouteStop): HotelStayDates {
  const nights = Math.max(1, Number(stop.hotelNights) || 1);
  const checkIn = stop.hotelCheckIn || "";
  const checkOut = checkIn ? addDaysIso(checkIn, nights) : "";
  return { checkIn, checkOut, nights };
}

/**
 * Hotel-Kette: gebuchte Stopps nutzen nur hotelCheckIn/hotelNights (kein Auto-Fallback).
 * Nicht gebuchte Stopps folgen dem Cursor ab tripStartDate.
 */
export function computeHotelStaysTimeline(
  hotelStops: RouteStop[],
  tripStartDate: string,
): Map<string, HotelStayDates> {
  const out = new Map<string, HotelStayDates>();
  let cursor = tripStartDate || "";

  for (const stop of hotelStops) {
    const nights = Math.max(1, Number(stop.hotelNights) || 2);
    const booked = isBookedHotelStop(stop);
    const checkIn = booked ? stop.hotelCheckIn || "" : cursor || stop.hotelCheckIn || "";
    const checkOut = checkIn ? addDaysIso(checkIn, nights) : "";
    out.set(stop.id, { checkIn, checkOut, nights });
    if (checkIn) cursor = checkOut || cursor;
  }

  return out;
}
