"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Plane, ChevronDown, MapPin } from "lucide-react";

interface Airport {
  code: string;
  city: string;
  country: string;
  name: string;
}

interface SearchResult {
  type: "city" | "airport";
  airport?: Airport;
  city?: string;
  country?: string;
  codes?: string[];
  count?: number;
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
  const [results, setResults] = useState<SearchResult[]>([]);
  const ref = useRef<HTMLDivElement>(null);

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

    const cityGroups = new Map<string, Airport[]>();
    for (const a of matches) {
      const key = `${a.city}|${a.country}`;
      if (!cityGroups.has(key)) cityGroups.set(key, []);
      cityGroups.get(key)!.push(a);
    }

    const items: SearchResult[] = [];
    const seenCities = new Set<string>();

    for (const a of matches.slice(0, 20)) {
      const key = `${a.city}|${a.country}`;
      const group = cityGroups.get(key)!;

      if (group.length > 1 && !seenCities.has(key)) {
        seenCities.add(key);
        items.push({
          type: "city",
          city: a.city,
          country: a.country,
          codes: group.map((g) => g.code),
          count: group.length,
        });
        for (const ga of group) {
          items.push({ type: "airport", airport: ga });
        }
      } else if (group.length === 1) {
        items.push({ type: "airport", airport: a });
      }
    }

    setResults(items.slice(0, 20));
  }, [airports]);

  function handleInputChange(val: string) {
    setQuery(val);
    search(val);
    if (!open) setOpen(true);
  }

  function handleSelectAirport(airport: Airport) {
    const display = `${airport.city} (${airport.code})`;
    setQuery(display);
    onChange(display);
    setOpen(false);
  }

  function handleSelectCity(city: string) {
    const display = city;
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
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-200 max-h-[280px] overflow-y-auto">
          {results.map((item, idx) =>
            item.type === "city" ? (
              <button
                key={`city-${item.city}-${item.country}`}
                type="button"
                onClick={() => handleSelectCity(item.city!)}
                className="w-full text-left px-3 py-2.5 hover:bg-amber-50 transition-colors flex items-center gap-3 bg-gray-50 border-b border-gray-100"
              >
                <span className="flex items-center justify-center w-12 shrink-0">
                  <MapPin className="w-4 h-4 text-amber-600" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{item.city} <span className="text-[11px] font-normal text-gray-400">– alle Flughäfen</span></p>
                  <p className="text-[11px] text-gray-400">{item.count} Flughäfen · {item.codes?.join(", ")} · {item.country}</p>
                </div>
              </button>
            ) : (
              <button
                key={`${item.airport!.code}-${item.airport!.name}-${idx}`}
                type="button"
                onClick={() => handleSelectAirport(item.airport!)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
              >
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md w-12 text-center shrink-0">
                  {item.airport!.code}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.airport!.city}</p>
                  <p className="text-[11px] text-gray-400 truncate">{item.airport!.name} · {item.airport!.country}</p>
                </div>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
