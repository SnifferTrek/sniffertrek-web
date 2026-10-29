"use client";

import { useCallback, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink } from "lucide-react";
import {
 EXPEDIA_SHOP_LISTS,
 EXPEDIA_SHOP_SHARE_BLURB,
 buildExpediaShopHotelLink,
 type ExpediaShopList,
} from "@/lib/expediaTravelShopLists";
import { Link } from "@/i18n/navigation";

function CopyBlock({ label, text }: { label: string; text: string }) {
 const [copied, setCopied] = useState(false);
 const copy = useCallback(async () => {
 await navigator.clipboard.writeText(text);
 setCopied(true);
 window.setTimeout(() => setCopied(false), 2000);
 }, [text]);

 return (
 <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
 <div className="mb-2 flex items-center justify-between gap-2">
 <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
 <button
 type="button"
 onClick={() => void copy()}
 className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
 >
 {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
 {copied ? "Kopiert" : "Kopieren"}
 </button>
 </div>
 <p className="whitespace-pre-wrap text-sm text-gray-800">{text}</p>
 </div>
 );
}

function ListCard({ list, priority }: { list: ExpediaShopList; priority?: boolean }) {
 return (
 <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
 <div className="mb-4 flex flex-wrap items-center gap-2">
 <h2 className="text-lg font-bold text-gray-900">{list.titleDe}</h2>
 {priority && (
 <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
 Zuerst anlegen
 </span>
 )}
 </div>
 <p className="mb-4 text-sm text-gray-600">{list.introDe}</p>

 <div className="mb-4 space-y-3">
 <CopyBlock label="Expedia · Listentitel (EN)" text={list.titleEn} />
 <CopyBlock label="Expedia · Intro (EN)" text={list.introEn} />
 </div>

 <ol className="space-y-4">
 {list.items.map((item, idx) => {
 const link = buildExpediaShopHotelLink(item, list.id);
 return (
 <li key={item.id} className="rounded-xl border border-gray-100 p-4">
 <p className="mb-1 text-sm font-semibold text-gray-900">
 {idx + 1}. {item.expediaSearch}
 </p>
 <p className="mb-2 text-xs text-gray-500">{item.noteDe}</p>
 <CopyBlock label="Beschreibung in Liste (EN)" text={item.noteEn} />
 <a
 href={link}
 target="_blank"
 rel="noopener noreferrer"
 className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-900 border border-yellow-200 hover:bg-yellow-100"
 >
 <ExternalLink className="h-3.5 w-3.5" />
 In Expedia suchen &amp; zur Liste hinzufügen
 </a>
 </li>
 );
 })}
 </ol>
 </section>
 );
}

export default function ExpediaShopCuratorPage() {
 return (
 <div className="min-h-screen bg-[var(--st-bg)]">
 <div className="mx-auto max-w-3xl px-4 py-10">
 <Link
 href="/planer"
 className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--st-primary)] hover:text-blue-800"
 >
 <ArrowLeft className="h-4 w-4" />
 Zurück zum Planer
 </Link>

 <header className="mb-8">
 <p className="text-xs font-semibold uppercase tracking-wider text-[var(--st-primary)]">Expedia Travel Shop</p>
 <h1 className="mt-1 text-2xl font-bold text-gray-900">Listen-Kurator</h1>
 <p className="mt-2 text-sm text-gray-600">
 Schritt für Schritt: Text kopieren → in Expedia <strong>+ Erstellen → Sammlung</strong> einfügen →
 Hotel-Link öffnen → Property zur Sammlung hinzufügen.
 </p>
 </header>

 <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
 <h3 className="text-sm font-bold text-blue-900">Ablauf (ca. 20 Min. pro Liste)</h3>
 <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-blue-900/90">
 <li>Expedia-Profil öffnen → <strong>+ Erstellen</strong> → <strong>Sammlung</strong> (nicht Video)</li>
 <li>Titel &amp; Intro (EN) von unten kopieren</li>
 <li>Pro Zeile «In Expedia suchen» → passendes Hotel wählen → zur Liste</li>
 <li>Englische Beschreibung pro Hotel einfügen</li>
 <li>Veröffentlichen → <strong>Teilen</strong></li>
 </ol>
 <p className="mt-3 text-xs text-blue-800/80">
 Profilbild:{" "}
 <a className="underline" href="/expedia-shop/profile-square.png" target="_blank" rel="noreferrer">
 profile-square.png
 </a>
 {" · "}
 Hintergrund:{" "}
 <a className="underline" href="/expedia-shop/background-banner.jpg" target="_blank" rel="noreferrer">
 background-banner.jpg
 </a>
 </p>
 </div>

 <div className="mb-8">
 <CopyBlock label="Teilen-Text (Social / Sniffertrek)" text={EXPEDIA_SHOP_SHARE_BLURB} />
 </div>

 <div className="space-y-8">
 <ListCard list={EXPEDIA_SHOP_LISTS[0]} priority />
 <ListCard list={EXPEDIA_SHOP_LISTS[1]} />
 </div>
 </div>
 </div>
 );
}
