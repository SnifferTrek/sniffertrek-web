"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ExternalLink } from "lucide-react";
import { COTE_DAZUR_GOLF_CLUBS } from "@/lib/travelReports/coteDazurGolfClubs";

const CoteDazurGolfLeafletMap = dynamic(() => import("@/components/CoteDazurGolfLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[min(420px,55vh)] items-center justify-center bg-stone-100 text-sm text-stone-500">
      Golf-Karte wird geladen …
    </div>
  ),
});

export default function CoteDazurGolfSection() {
  const [selectedId, setSelectedId] = useState<string | null>(
    COTE_DAZUR_GOLF_CLUBS[0]?.id ?? null,
  );
  const selected =
    COTE_DAZUR_GOLF_CLUBS.find((c) => c.id === selectedId) ?? COTE_DAZUR_GOLF_CLUBS[0];

  return (
    <div id="golf" className="mt-14 scroll-mt-24">
      <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
        Golf · Clubs auf der Route
      </h2>
      <p className="mt-2 text-sm text-stone-600">
        Marker antippen – Kurzinfo, Handicap-Hinweis, Greenfee-Richtwert und Link zum Club.
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <CoteDazurGolfLeafletMap
          clubs={COTE_DAZUR_GOLF_CLUBS}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {COTE_DAZUR_GOLF_CLUBS.map((club) => (
          <li key={club.id}>
            <button
              type="button"
              onClick={() => setSelectedId(club.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                club.id === selectedId
                  ? "border-sky-600 bg-sky-50 text-sky-900"
                  : "border-stone-200 bg-stone-50 text-stone-700 hover:border-sky-300 hover:bg-sky-50"
              }`}
            >
              {club.name.replace(/^Golf (Club de |de )?/i, "")}
            </button>
          </li>
        ))}
      </ul>

      {selected ? (
        <article className="mt-5 rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm sm:px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              {selected.area}
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-stone-900">{selected.name}</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-stone-700">{selected.intro}</p>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            <span className="font-semibold text-stone-800">Eigenarten · </span>
            {selected.quirks}
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {selected.handicapMin ? (
              <div className="rounded-xl bg-stone-50 px-3 py-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Handicap
                </dt>
                <dd className="mt-0.5 text-stone-800">{selected.handicapMin}</dd>
              </div>
            ) : null}
            <div className="rounded-xl bg-stone-50 px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Greenfees
              </dt>
              <dd className="mt-0.5 text-stone-800">{selected.greenFees}</dd>
            </div>
          </dl>
          <a
            href={selected.clubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-800 hover:text-sky-950"
          >
            Zur Club-Website
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        </article>
      ) : null}
    </div>
  );
}
