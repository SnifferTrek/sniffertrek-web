import jsPDF from "jspdf";
import { Trip, RouteStop, Etappe } from "./types";

// --- Constants (matching iOS TripPrintView.swift) ---
const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const M = 50; // margin
const CONTENT_W = PAGE_W - 2 * M;
const RIGHT = PAGE_W - M;

const BLUE = [0, 122, 255] as const;
const GREEN = [52, 199, 89] as const;
const RED = [255, 59, 48] as const;
const BLACK = [0, 0, 0] as const;
const GRAY = [142, 142, 147] as const;
const LIGHT_GRAY = [210, 210, 210] as const;

function setColor(doc: jsPDF, c: readonly [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}

function formatDateDE(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
}

function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function formatDur(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")} h`;
}

function extractCity(name: string): string {
  const firstLine = (name || "").split("\n")[0];
  const plzMatch = firstLine.match(/\b\d{4,5}\s+([^,\n]+)/);
  if (plzMatch) return plzMatch[1].trim();
  const parts = firstLine.split(",").map((p) => p.trim());
  if (parts.length >= 3) {
    if (/^\d/.test(parts[0]) || /\b(strasse|straße|weg|gasse|rue|route|via|avenue|road|str\.|chemin|place|boulevard|blvd)\b/i.test(parts[0])) {
      return parts[1].replace(/^\d{4,5}\s*/, "").trim();
    }
  }
  return parts[0].trim();
}

function splitTextLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

// Draw a filled circle (status dot replacement for Unicode issues)
function drawDot(doc: jsPDF, x: number, y: number, r: number, filled: boolean) {
  if (filled) {
    doc.circle(x, y - 3, r, "F");
  } else {
    doc.setLineWidth(0.8);
    doc.circle(x, y - 3, r, "S");
  }
}

// --- Collect hotel stops from all routes ---
function collectAllHotelStops(trip: Trip): RouteStop[] {
  const all = [
    ...trip.stops,
    ...(trip.routes?.flights?.stops || []),
    ...(trip.routes?.car?.stops || []),
    ...(trip.routes?.train?.stops || []),
  ];
  const seen = new Set<string>();
  return all.filter((s) => {
    if (!s.isHotel || !s.name.trim()) return false;
    const key = s.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getHotelDates(
  stop: RouteStop,
  idx: number,
  hotelStops: RouteStop[],
  tripStartDate: string
): { checkIn: string; checkOut: string; nights: number } {
  let checkIn = stop.hotelCheckIn || "";
  if (!checkIn) {
    if (idx === 0) {
      checkIn = tripStartDate;
    } else {
      const prev = getHotelDates(hotelStops[idx - 1], idx - 1, hotelStops, tripStartDate);
      checkIn = prev.checkOut;
    }
  }
  const nights = stop.hotelNights || 2;
  const checkOut = checkIn ? addDaysISO(checkIn, nights) : "";
  return { checkIn, checkOut, nights };
}

// --- Google Static Maps API ---
async function loadMapImage(
  stops: RouteStop[],
  apiKey: string
): Promise<string | null> {
  const valid = stops.filter((s) => s.lat && s.lng);
  if (valid.length < 2) return null;

  const markers = valid
    .map((s, i) => {
      const label = i === 0 ? "S" : i === valid.length - 1 ? "E" : String(i);
      return `markers=color:${i === 0 ? "green" : i === valid.length - 1 ? "red" : "blue"}|label:${label}|${s.lat},${s.lng}`;
    })
    .join("&");

  const path = valid.map((s) => `${s.lat},${s.lng}`).join("|");
  const url = `https://maps.googleapis.com/maps/api/staticmap?size=700x300&maptype=roadmap&${markers}&path=color:0x0066ff|weight:3|${path}&key=${apiKey}`;

  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return await blobToDataURL(blob);
  } catch {
    return null;
  }
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function loadImageAsDataURL(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return await blobToDataURL(blob);
  } catch {
    return null;
  }
}

// -------------------------------------------------------------------
// Main export
// -------------------------------------------------------------------
export interface PdfOptions {
  trip: Trip;
  etappen: Etappe[];
  routeInfo?: { distance: string; duration: string; stops: number };
  googleApiKey?: string;
  onProgress?: (pct: number, msg: string) => void;
}

export async function generateTripPDF(opts: PdfOptions): Promise<Blob> {
  const { trip, etappen, routeInfo, googleApiKey, onProgress } = opts;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const hotelStops = collectAllHotelStops(trip);
  let pageNumber = 1;

  const progress = (pct: number, msg: string) => onProgress?.(pct, msg);

  // Pre-load map images
  progress(5, "Lade Karten...");
  let overviewMapData: string | null = null;
  const etappeMapData: (string | null)[] = [];

  if (googleApiKey) {
    const mainStops = trip.stops.filter((s) => s.name.trim());
    overviewMapData = await loadMapImage(mainStops, googleApiKey);

    for (let i = 0; i < etappen.length; i++) {
      const et = etappen[i];
      const allStops = trip.stops.filter((s) => s.name.trim());
      const fromStop = allStops.find(
        (s) => extractCity(s.name).toLowerCase() === extractCity(et.from).toLowerCase()
      );
      const toStop = allStops.find(
        (s) => extractCity(s.name).toLowerCase() === extractCity(et.to).toLowerCase()
      );
      if (fromStop && toStop) {
        etappeMapData.push(await loadMapImage([fromStop, toStop], googleApiKey));
      } else {
        etappeMapData.push(null);
      }
    }
  }

  // Load logo
  progress(10, "Lade Logo...");
  let logoData: string | null = null;
  try {
    logoData = await loadImageAsDataURL("/images/sniffertrek-logo.png");
  } catch { /* ignore */ }

  // =====================================================================
  // PAGE 1 — Deckblatt
  // =====================================================================
  progress(15, "Erstelle Deckblatt...");

  let y = M + 30;

  // Trip name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  setColor(doc, BLUE);
  const title = trip.name || "Neue Reise";
  doc.text(title, PAGE_W / 2, y, { align: "center" });
  y += 40;

  // Date range
  if (trip.startDate && trip.endDate) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    setColor(doc, BLACK);
    doc.text(`${formatDateDE(trip.startDate)}  -  ${formatDateDE(trip.endDate)}`, PAGE_W / 2, y, {
      align: "center",
    });
    y += 25;
  }

  // Route as flowing text
  const routeParts: string[] = [];
  const startStop = trip.stops.find((s) => s.type === "start");
  const endStop = trip.stops.find((s) => s.type === "end");
  if (startStop?.name) routeParts.push(extractCity(startStop.name));
  trip.stops
    .filter((s) => s.type === "stop" && s.name.trim())
    .forEach((s) => routeParts.push(extractCity(s.name)));
  if (endStop?.name) routeParts.push(extractCity(endStop.name));

  if (routeParts.length > 0) {
    doc.setFontSize(11);
    setColor(doc, GRAY);
    const routeStr = routeParts.join("  -  ");
    const lines = splitTextLines(doc, routeStr, CONTENT_W - 40);
    doc.text(lines, PAGE_W / 2, y, { align: "center" });
    y += lines.length * 14 + 20;
  }

  // Thin decorative line
  doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.setLineWidth(0.5);
  doc.line(PAGE_W / 2 - 80, y, PAGE_W / 2 + 80, y);
  y += 25;

  // SnifferTrek logo image (portrait, centered, fills lower portion)
  if (logoData) {
    try {
      const imgW = 280;
      const imgH = 400; // portrait ratio ~2:3
      const availH = PAGE_H - y - 60;
      const finalH = Math.min(imgH, availH);
      const finalW = finalH * (imgW / imgH);
      const imgX = (PAGE_W - finalW) / 2;
      doc.addImage(logoData, "PNG", imgX, y, finalW, finalH);
    } catch { /* ignore */ }
  }

  // Footer on cover
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(doc, GRAY);
  doc.text("sniffertrek.com", PAGE_W / 2, PAGE_H - 25, { align: "center" });

  // =====================================================================
  // PAGE 2 — Reiseuebersicht
  // =====================================================================
  progress(25, "Erstelle Reiseuebersicht...");
  doc.addPage();
  pageNumber++;
  y = M;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setColor(doc, BLUE);
  doc.text("REISE\u00dcBERSICHT", M, y);
  y += 30;

  // Key stats in 2 columns with right-aligned values
  const TAB_X = M + 160; // tab stop for values

  doc.setFontSize(10);

  const drawStatRow = (label: string, value: string) => {
    doc.setFont("helvetica", "normal");
    setColor(doc, GRAY);
    doc.text(label, M, y);
    doc.setFont("helvetica", "bold");
    setColor(doc, BLACK);
    doc.text(value, TAB_X, y);
    y += 16;
  };

  if (trip.startDate && trip.endDate) {
    drawStatRow("Reisedatum", `${formatDateDE(trip.startDate)}  -  ${formatDateDE(trip.endDate)}`);
  }
  if (routeInfo) {
    drawStatRow("Gesamtstrecke", routeInfo.distance);
    drawStatRow("Gesamtfahrzeit", routeInfo.duration);
    drawStatRow("Stopps", `${routeInfo.stops}`);
  }
  drawStatRow("Etappen", `${etappen.length}`);
  drawStatRow("Hotels", `${hotelStops.length}`);

  const bookedCount = hotelStops.filter((s) => !!s.bookingConfirmation).length;
  if (hotelStops.length > 0) {
    drawStatRow("Hotels gebucht", `${bookedCount} / ${hotelStops.length}`);
  }
  y += 15;

  // Routenuebersicht in 2 columns
  if (etappen.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    setColor(doc, BLUE);
    doc.text("ROUTEN\u00dcBERSICHT", M, y);
    y += 22;

    doc.setFontSize(9);
    setColor(doc, BLACK);

    const COL_GAP = 30;
    const colW = (CONTENT_W - COL_GAP) / 2;
    const half = Math.ceil(etappen.length / 2);
    const col0X = M;
    const col1X = M + colW + COL_GAP;
    let col0Y = y;
    let col1Y = y;

    for (let i = 0; i < etappen.length; i++) {
      const et = etappen[i];
      const isLeft = i < half;
      const colX = isLeft ? col0X : col1X;
      const colY = isLeft ? col0Y : col1Y;

      doc.setFont("helvetica", "bold");
      const tagLabel = `Tag ${i + 1}:`;
      doc.text(tagLabel, colX, colY);

      doc.setFont("helvetica", "normal");
      const routeLabel = `${extractCity(et.from)} - ${extractCity(et.to)}`;
      doc.text(routeLabel, colX + 35, colY);

      const kmLabel = `${et.distanceKm} km`;
      doc.text(kmLabel, colX + colW, colY, { align: "right" });

      const blockH = 14;
      if (isLeft) col0Y += blockH; else col1Y += blockH;
    }
    y = Math.max(col0Y, col1Y) + 10;
  }

  // =====================================================================
  // PAGE 3 — Hotelliste (kompakt)
  // =====================================================================
  progress(35, "Erstelle Hotelliste...");
  doc.addPage();
  pageNumber++;
  y = M;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setColor(doc, BLUE);
  doc.text("UNTERK\u00dcNFTE", M, y);
  y += 25;

  if (hotelStops.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    setColor(doc, GRAY);
    doc.text("Keine Hotels geplant.", M, y);
    y += 20;
  } else {
    for (let idx = 0; idx < hotelStops.length; idx++) {
      const stop = hotelStops[idx];
      const isBooked = !!stop.bookingConfirmation;
      const { checkIn, checkOut, nights } = getHotelDates(stop, idx, hotelStops, trip.startDate);
      const guests = stop.hotelGuests || trip.travelers || 2;
      const rooms = stop.hotelRooms || 1;

      if (y > PAGE_H - 80) {
        doc.addPage();
        pageNumber++;
        y = M;
      }

      // Status dot (drawn as circle) + city name
      const dotColor = isBooked ? GREEN : RED;
      doc.setFillColor(dotColor[0], dotColor[1], dotColor[2]);
      doc.setDrawColor(dotColor[0], dotColor[1], dotColor[2]);
      drawDot(doc, M + 4, y, 3, isBooked);

      setColor(doc, isBooked ? GREEN : RED);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(extractCity(stop.name), M + 14, y);

      // Right side: dates compact
      if (checkIn) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(`${formatDateDE(checkIn)} - ${formatDateDE(checkOut)}, ${nights}N`, RIGHT, y, { align: "right" });
      }
      y += 13;

      // Details line: hotel name + guests/rooms + price + confirmation
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const detailParts: string[] = [];
      if (stop.bookingHotelName) detailParts.push(stop.bookingHotelName);
      if (stop.bookingAddress) detailParts.push(stop.bookingAddress);
      detailParts.push(`${guests} Pers., ${rooms} Zi.`);
      if (stop.bookingPrice) detailParts.push(`Preis: ${stop.bookingPrice}`);
      if (stop.bookingConfirmation) detailParts.push(`Nr: ${stop.bookingConfirmation}`);

      const detailStr = detailParts.join("  |  ");
      const detailLines = splitTextLines(doc, detailStr, CONTENT_W - 14);
      doc.text(detailLines, M + 14, y);
      y += detailLines.length * 10 + 6;

      // Separator
      if (idx < hotelStops.length - 1) {
        doc.setDrawColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
        doc.setLineWidth(0.3);
        doc.line(M, y, RIGHT, y);
        y += 8;
      }
    }
  }

  // =====================================================================
  // PAGE 4 — Inhaltsverzeichnis
  // =====================================================================
  progress(45, "Erstelle Inhaltsverzeichnis...");
  doc.addPage();
  pageNumber++;
  const tocPageNumber = pageNumber;
  y = M;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setColor(doc, BLUE);
  doc.text("INHALTSVERZEICHNIS", M, y);
  y += 30;

  doc.setFontSize(10);
  setColor(doc, BLACK);

  const KM_TAB = RIGHT - 70; // tab stop for km column
  const PAGE_TAB = RIGHT; // right-aligned page number

  const drawTocRow = (label: string, km: string, page: string) => {
    doc.setFont("helvetica", "normal");
    doc.text(label, M, y);
    if (km) {
      setColor(doc, GRAY);
      doc.text(km, KM_TAB, y, { align: "right" });
      setColor(doc, BLACK);
    }
    doc.text(page, PAGE_TAB, y, { align: "right" });
    y += 18;
  };

  drawTocRow("Deckblatt", "", "1");
  drawTocRow("Reiseuebersicht", "", "2");
  drawTocRow("Unterkuenfte", "", "3");
  drawTocRow("Inhaltsverzeichnis", "", `${tocPageNumber}`);

  y += 5;
  doc.setDrawColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
  doc.setLineWidth(0.3);
  doc.line(M, y, RIGHT, y);
  y += 10;

  // Day entries
  const dayPageStart = pageNumber + 1;

  for (let i = 0; i < etappen.length; i++) {
    const et = etappen[i];
    if (y > PAGE_H - 60) {
      doc.addPage();
      pageNumber++;
      y = M;
    }

    let dayLabel: string;
    if (trip.startDate) {
      const dateISO = addDaysISO(trip.startDate, i);
      dayLabel = formatDateDE(dateISO);
    } else {
      dayLabel = `Tag ${i + 1}`;
    }

    const routeLabel = `${dayLabel}    ${extractCity(et.from)} - ${extractCity(et.to)}`;
    const kmLabel = `${et.distanceKm} km`;
    const pageLabel = `${dayPageStart + i}`;

    setColor(doc, BLACK);
    drawTocRow(routeLabel, kmLabel, pageLabel);
  }

  // =====================================================================
  // PAGE 5+ — Tag fuer Tag
  // =====================================================================
  for (let i = 0; i < etappen.length; i++) {
    const pct = 50 + Math.round((i / Math.max(etappen.length, 1)) * 45);
    progress(pct, `Tag ${i + 1} von ${etappen.length}...`);

    const et = etappen[i];
    doc.addPage();
    pageNumber++;
    y = M;

    // Day header
    let dayLabel: string;
    if (trip.startDate) {
      const dateISO = addDaysISO(trip.startDate, i);
      dayLabel = formatDateDE(dateISO);
    } else {
      dayLabel = `Tag ${i + 1}`;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    setColor(doc, BLUE);

    const leftPart = `${dayLabel}    ${extractCity(et.from)} - ${extractCity(et.to)}`;
    const rightPart = `${et.distanceKm} km - ${et.durationFormatted}`;
    doc.text(leftPart, M, y);
    doc.text(rightPart, RIGHT, y, { align: "right" });
    y += 20;

    // Thin blue line
    doc.setDrawColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.setLineWidth(0.5);
    doc.line(M, y, RIGHT, y);
    y += 15;

    // Etappe map
    if (etappeMapData[i]) {
      try {
        const mapH = 180;
        doc.addImage(etappeMapData[i]!, "PNG", M, y, CONTENT_W, mapH);
        y += mapH + 15;
      } catch { /* ignore */ }
    }

    // Hotel info
    const matchedHotel = hotelStops.find(
      (s) => extractCity(s.name).toLowerCase() === extractCity(et.to).toLowerCase()
    );

    if (matchedHotel || et.hotelBooked !== undefined) {
      const isBooked = matchedHotel ? !!matchedHotel.bookingConfirmation : !!et.hotelBooked;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      setColor(doc, isBooked ? GREEN : RED);
      doc.text(isBooked ? "Hotel gebucht" : "Hotel offen", M, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      if (matchedHotel) {
        const hIdx = hotelStops.indexOf(matchedHotel);
        const { checkIn, checkOut, nights } = getHotelDates(matchedHotel, hIdx, hotelStops, trip.startDate);
        const guests = matchedHotel.hotelGuests || trip.travelers || 2;
        const rooms = matchedHotel.hotelRooms || 1;

        const colW = CONTENT_W / 2;
        const leftX = M;
        const rightX = M + colW + 5;
        let leftY = y;
        let rightY = y;

        if (matchedHotel.bookingHotelName) {
          doc.text(matchedHotel.bookingHotelName, leftX, leftY);
          leftY += 12;
        }
        if (matchedHotel.bookingAddress) {
          const addrLines = splitTextLines(doc, matchedHotel.bookingAddress, colW - 5);
          doc.text(addrLines, leftX, leftY);
          leftY += addrLines.length * 11;
        }

        if (checkIn) {
          doc.text(`${formatDateDE(checkIn)} - ${formatDateDE(checkOut)}`, rightX, rightY);
          rightY += 12;
        }
        doc.text(
          `${guests} Pers., ${rooms} Zimm., ${nights} Nacht${nights !== 1 ? "e" : ""}`,
          rightX,
          rightY
        );
        rightY += 12;
        if (matchedHotel.bookingPrice) {
          doc.text(`Preis: ${matchedHotel.bookingPrice}`, rightX, rightY);
          rightY += 12;
        }
        if (matchedHotel.bookingConfirmation) {
          doc.text(`Best.-Nr: ${matchedHotel.bookingConfirmation}`, rightX, rightY);
          rightY += 12;
        }

        y = Math.max(leftY, rightY) + 8;
      } else if (et.hotelName) {
        doc.text(et.hotelName, M, y);
        y += 12;
        if (et.hotelAddress) {
          doc.text(et.hotelAddress, M, y);
          y += 12;
        }
        y += 5;
      }
    }

    // Legs detail
    if (et.legs && et.legs.length > 1) {
      if (y > PAGE_H - 120) {
        doc.addPage();
        pageNumber++;
        y = M;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      setColor(doc, BLUE);
      doc.text("Teilstrecken", M, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setColor(doc, BLACK);

      for (const leg of et.legs) {
        if (y > PAGE_H - 40) {
          doc.addPage();
          pageNumber++;
          y = M;
        }
        const km = Math.round(leg.distanceMeters / 1000);
        const dur = formatDur(leg.durationSeconds);
        doc.text(`${extractCity(leg.from)}  ->  ${extractCity(leg.to)}`, M + 10, y);
        doc.text(`${km} km - ${dur}`, RIGHT, y, { align: "right" });
        y += 13;
      }
      y += 5;
    }

    // Notes (only on first day page)
    if (trip.notes && i === 0) {
      if (y > PAGE_H - 100) {
        doc.addPage();
        pageNumber++;
        y = M;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      setColor(doc, BLUE);
      doc.text("Notizen", M, y);
      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setColor(doc, BLACK);
      const noteLines = splitTextLines(doc, trip.notes, CONTENT_W);
      for (const line of noteLines) {
        if (y > PAGE_H - 40) {
          doc.addPage();
          pageNumber++;
          y = M;
        }
        doc.text(line, M, y);
        y += 12;
      }
    }
  }

  // Add page numbers + footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(doc, GRAY);
    if (p > 1) {
      doc.text(`Seite ${p} / ${totalPages}`, PAGE_W / 2, PAGE_H - 25, { align: "center" });
    }
    doc.text("sniffertrek.com", RIGHT, PAGE_H - 25, { align: "right" });
  }

  progress(100, "PDF erstellt!");
  return doc.output("blob");
}
