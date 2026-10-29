"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

function parseLocal(dateStr: string): Date {
 const [y, m, d] = dateStr.split("-").map(Number);
 return new Date(y, m - 1, d);
}

function toStr(date: Date): string {
 const y = date.getFullYear();
 const m = String(date.getMonth() + 1).padStart(2, "0");
 const d = String(date.getDate()).padStart(2, "0");
 return `${y}-${m}-${d}`;
}

function addDaysLocal(dateStr: string, days: number): string {
 const d = parseLocal(dateStr);
 d.setDate(d.getDate() + days);
 return toStr(d);
}

function dateLocale(locale: string): string {
 if (locale === "en") return "en-GB";
 if (locale === "es") return "es-ES";
 return "de-CH";
}

function fmtShort(dateStr: string, loc: string): string {
 if (!dateStr) return "–";
 const d = parseLocal(dateStr);
 return d.toLocaleDateString(dateLocale(loc), { day: "2-digit", month: "short" });
}

function fmtFull(dateStr: string, loc: string): string {
 if (!dateStr) return "–";
 const d = parseLocal(dateStr);
 return d.toLocaleDateString(dateLocale(loc), { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtCompact(dateStr: string, loc: string): string {
 if (!dateStr) return "–";
 const d = parseLocal(dateStr);
 return d.toLocaleDateString(dateLocale(loc), { day: "2-digit", month: "2-digit", year: "2-digit" });
}

interface Props {
 checkIn: string;
 checkOut: string;
 nights: number;
 onSelect: (checkIn: string, nights: number) => void;
 compact?: boolean;
 /** Gebuchtes Hotel: Anzeige fix, Kalender nur per Klick manuell änderbar */
 locked?: boolean;
}

export default function HotelDatePicker({ checkIn, checkOut, nights, onSelect, compact = false, locked = false }: Props) {
 const locale = useLocale();
 const t = useTranslations("dates");
 const loc = dateLocale(locale);
 const monthNames = useMemo(
  () => Array.from({ length: 12 }, (_, i) => new Date(2024, i, 1).toLocaleString(loc, { month: "long" })),
  [loc]
 );
 const dayNames = useMemo(
  () => Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(loc, { weekday: "short" })),
  [loc]
 );
 const [open, setOpen] = useState(false);
 const [phase, setPhase] = useState<"start" | "end">("start");
 const [tempStart, setTempStart] = useState(checkIn);
 const [hoverEnd, setHoverEnd] = useState("");
 const ref = useRef<HTMLDivElement>(null);

 const initMonth = checkIn ? parseLocal(checkIn) : new Date();
 const [viewYear, setViewYear] = useState(initMonth.getFullYear());
 const [viewMonth, setViewMonth] = useState(initMonth.getMonth());

 useEffect(() => {
 if (!open) return;
 const handler = (e: MouseEvent) => {
 if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
 };
 document.addEventListener("mousedown", handler);
 return () => document.removeEventListener("mousedown", handler);
 }, [open]);

 function handleOpen() {
 setPhase("start");
 setTempStart(checkIn);
 setHoverEnd("");
 if (checkIn) {
 const d = parseLocal(checkIn);
 setViewYear(d.getFullYear());
 setViewMonth(d.getMonth());
 } else {
 const now = new Date();
 setViewYear(now.getFullYear());
 setViewMonth(now.getMonth());
 }
 setOpen(true);
 }

 function handleDayClick(dateStr: string) {
 if (phase === "start") {
 setTempStart(dateStr);
 setHoverEnd("");
 setPhase("end");
 } else {
 if (dateStr <= tempStart) {
 setTempStart(dateStr);
 setHoverEnd("");
 return;
 }
 const ms = parseLocal(dateStr).getTime() - parseLocal(tempStart).getTime();
 const n = Math.round(ms / 86400000);
 onSelect(tempStart, Math.max(1, n));
 setOpen(false);
 }
 }

 function prevMonth() {
 if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
 else setViewMonth(m => m - 1);
 }

 function nextMonth() {
 if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
 else setViewMonth(m => m + 1);
 }

 const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
 const firstDow = (() => { const d = new Date(viewYear, viewMonth, 1).getDay(); return d === 0 ? 6 : d - 1; })();

 function dayStr(day: number) {
 return `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
 }

 const effectiveEnd = phase === "end" && hoverEnd > tempStart ? hoverEnd : (phase === "start" ? checkOut : "");

 return (
 <div ref={ref} className="relative">
 <button
 type="button"
 onClick={handleOpen}
 className={`w-full flex items-center gap-2 rounded-lg border transition-colors cursor-pointer px-3 py-1.5 ${
  locked
   ? "border-green-200 bg-green-50/90 hover:border-green-300"
   : "border-gray-200 hover:border-blue-300 bg-white"
 }`}
 >
 <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
 <span className="text-xs font-medium text-gray-900">{compact ? fmtCompact(checkIn, locale) : fmtFull(checkIn, locale)}</span>
 <span className="text-[10px] text-gray-400">–</span>
 <span className="text-xs font-medium text-gray-900">{compact ? fmtCompact(checkOut, locale) : fmtFull(checkOut, locale)}</span>
 <span className="text-[10px] text-gray-400 ml-auto shrink-0">{compact ? `${nights}N` : `${nights} ${nights === 1 ? t("night") : t("nights")}`}</span>
 </button>

 {open && (
 <div className="absolute z-50 top-full mt-1 left-0 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-[280px]">
 <div className="text-center text-[11px] text-[var(--st-primary)] font-semibold mb-2">
 {phase === "start" ? t("pickIn") : t("pickOut")}
 </div>

 <div className="flex items-center justify-between mb-2">
 <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
 <ChevronLeft className="w-4 h-4 text-gray-500" />
 </button>
 <span className="text-xs font-semibold text-gray-800">{monthNames[viewMonth]} {viewYear}</span>
 <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
 <ChevronRight className="w-4 h-4 text-gray-500" />
 </button>
 </div>

 <div className="grid grid-cols-7 mb-0.5">
 {dayNames.map(d => (
 <div key={d} className="text-[10px] text-center text-gray-400 font-medium py-0.5">{d}</div>
 ))}
 </div>

 <div className="grid grid-cols-7">
 {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
 {Array.from({ length: daysInMonth }).map((_, i) => {
 const day = i + 1;
 const ds = dayStr(day);
 const isStart = ds === tempStart;
 const isEnd = ds === effectiveEnd;
 const inRange = tempStart && effectiveEnd && ds > tempStart && ds < effectiveEnd;

 let cls = "text-[11px] h-7 w-full text-center transition-colors relative ";
 if (isStart && isEnd) {
 cls += "bg-[var(--st-primary)] text-white font-bold rounded-full";
 } else if (isStart) {
 cls += "bg-[var(--st-primary)] text-white font-bold rounded-l-full";
 } else if (isEnd) {
 cls += "bg-[var(--st-primary)] text-white font-bold rounded-r-full";
 } else if (inRange) {
 cls += "bg-[rgba(0,113,227,0.12)] text-[#1d1d1f]";
 } else {
 cls += "hover:bg-gray-100 text-gray-700";
 }

 return (
 <button
 key={day}
 type="button"
 onClick={() => handleDayClick(ds)}
 onMouseEnter={() => { if (phase === "end") setHoverEnd(ds); }}
 className={cls}
 >
 {day}
 </button>
 );
 })}
 </div>

 {tempStart && phase === "end" && (
 <div className="mt-2 text-[10px] text-gray-400 text-center">
 {fmtShort(tempStart, locale)} → {hoverEnd && hoverEnd > tempStart ? fmtShort(hoverEnd, locale) : "…"}
 </div>
 )}
 </div>
 )}
 </div>
 );
}
