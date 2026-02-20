"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Plane, ChevronDown } from "lucide-react";

interface Airport {
  code: string;
  city: string;
  country: string;
  name: string;
}

let cachedAirports: Airport[] | null = null;
async function loadAirports(): Promise<Airport[]> {
  if (cachedAirports) return cachedAirports;
  const res = await fetch("/data/airports.json");
  cachedAirports = await res.json();
  return cachedAirports!;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function AirportSelect({ value, onChange, placeholder = "Flughafen...", label }: Props) {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Airport[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAirports().then(setAirports);
  }, []);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const search = useCallback((q: string) => {
    if (!q || q.length < 2) { setResults([]); return; }
    const lower = q.toLowerCase();
    const matches = airports.filter(
      (a) =>
        a.code.toLowerCase().includes(lower) ||
        a.city.toLowerCase().includes(lower) ||
        a.name.toLowerCase().includes(lower) ||
        a.country.toLowerCase().includes(lower)
    );
    matches.sort((a, b) => {
      const aExact = a.code.toLowerCase() === lower || a.city.toLowerCase().startsWith(lower);
      const bExact = b.code.toLowerCase() === lower || b.city.toLowerCase().startsWith(lower);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.city.localeCompare(b.city);
    });
    setResults(matches.slice(0, 15));
  }, [airports]);

  function handleInputChange(val: string) {
    setQuery(val);
    search(val);
    if (!open) setOpen(true);
  }

  function handleSelect(airport: Airport) {
    const display = `${airport.city} (${airport.code})`;
    setQuery(display);
    onChange(display);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-[11px] font-medium text-gray-400 mb-1">{label}</label>}
      <div className="relative">
        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (query.length >= 2) { search(query); setOpen(true); } }}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-200 max-h-[240px] overflow-y-auto">
          {results.map((a) => (
            <button
              key={`${a.code}-${a.name}`}
              type="button"
              onClick={() => handleSelect(a)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
            >
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md w-12 text-center shrink-0">
                {a.code}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{a.city}</p>
                <p className="text-[11px] text-gray-400 truncate">{a.name} · {a.country}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
