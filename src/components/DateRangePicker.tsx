"use client";
import { useState, useRef, useEffect } from "react";
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

function fmtFull(dateStr: string): string {
  if (!dateStr) return "–";
  const d = parseLocal(dateStr);
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtShort(dateStr: string): string {
  if (!dateStr) return "…";
  const d = parseLocal(dateStr);
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "short" });
}

const MONTH_NAMES = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const DAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

interface Props {
  startDate: string;
  endDate: string;
  onSelect: (startDate: string, endDate: string) => void;
  startLabel?: string;
  endLabel?: string;
}

export default function DateRangePicker({ startDate, endDate, onSelect, startLabel = "Abreise", endLabel = "Rückkehr" }: Props) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"start" | "end">("start");
  const [tempStart, setTempStart] = useState(startDate);
  const [hoverEnd, setHoverEnd] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const initMonth = startDate ? parseLocal(startDate) : new Date();
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
    setTempStart(startDate);
    setHoverEnd("");
    if (startDate) {
      const d = parseLocal(startDate);
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
      onSelect(tempStart, dateStr);
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

  const effectiveEnd = phase === "end" && hoverEnd > tempStart ? hoverEnd : (phase === "start" ? endDate : "");

  const days = startDate && endDate
    ? Math.ceil((parseLocal(endDate).getTime() - parseLocal(startDate).getTime()) / 86400000)
    : 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center gap-2 rounded-xl border border-gray-200 hover:border-blue-300 bg-gray-50 transition-colors cursor-pointer px-3 py-2.5"
      >
        <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
        <div className="flex-1 flex items-center gap-1.5 text-sm">
          <div className="text-left">
            <span className="text-[10px] text-gray-400 block leading-tight">{startLabel}</span>
            <span className="font-medium text-gray-800">{fmtFull(startDate)}</span>
          </div>
          <span className="text-gray-300 px-1">→</span>
          <div className="text-left">
            <span className="text-[10px] text-gray-400 block leading-tight">{endLabel}</span>
            <span className="font-medium text-gray-800">{fmtFull(endDate)}</span>
          </div>
        </div>
        {days > 0 && (
          <span className="text-[10px] text-gray-400 shrink-0">{days} Tage</span>
        )}
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-[280px]">
          <div className="text-center text-[11px] text-blue-600 font-semibold mb-2">
            {phase === "start" ? `${startLabel} wählen` : `${endLabel} wählen`}
          </div>

          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <span className="text-xs font-semibold text-gray-800">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-0.5">
            {DAY_NAMES.map(d => (
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
                cls += "bg-blue-500 text-white font-bold rounded-full";
              } else if (isStart) {
                cls += "bg-blue-500 text-white font-bold rounded-l-full";
              } else if (isEnd) {
                cls += "bg-blue-500 text-white font-bold rounded-r-full";
              } else if (inRange) {
                cls += "bg-blue-100 text-blue-800";
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
              {fmtShort(tempStart)} → {hoverEnd && hoverEnd > tempStart ? fmtShort(hoverEnd) : "…"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
