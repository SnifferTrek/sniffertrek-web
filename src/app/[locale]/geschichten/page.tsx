import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLeft, Heart } from "lucide-react";
import { COUPLE_PHOTOS, TRAVEL_COUPLE } from "@/lib/travelCouple";
import { VENICE_PHOTOS } from "@/lib/travelReports/venicePhotos";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
 title: `${TRAVEL_COUPLE.displayName} · SnifferTrek`,
 description: TRAVEL_COUPLE.intro,
 robots: { index: false, follow: false },
};

export default function GeschichtenPage() {
 return (
 <div className="min-h-screen bg-[var(--st-bg)]">
 <header className="relative mx-auto max-w-5xl px-4 pt-10 sm:px-6 sm:pt-14">
 <Link
 href="/"
 className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800"
 >
 <ArrowLeft className="h-4 w-4" />
 Zur Startseite
 </Link>

 <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Unterwegs mit</p>
 <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#1d1d1f] sm:text-5xl">
 {TRAVEL_COUPLE.displayName}
 </h1>
 <p className="mt-4 max-w-lg text-lg leading-relaxed text-[#6e6e73]">{TRAVEL_COUPLE.tagline}</p>
 <p className="mt-3 text-sm italic text-[#86868b]">{TRAVEL_COUPLE.voice}</p>
 </div>

 <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg lg:-mb-16 lg:translate-y-8">
 <Image
 src={COUPLE_PHOTOS.hero}
 alt=""
 fill
 className="object-cover"
 sizes="(max-width: 1024px) 100vw, 45vw"
 priority
 />
 </div>
 </div>
 </header>

 <main className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 lg:pt-24">
 <p className="max-w-2xl text-base leading-relaxed text-[#6e6e73]">{TRAVEL_COUPLE.intro}</p>

 <section className="mt-12 grid gap-6 sm:grid-cols-2">
 <figure className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06]">
 <div className="relative aspect-[3/4] bg-[#f5f5f7]">
 <Image
 src={COUPLE_PHOTOS.anna}
 alt=""
 fill
 className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
 sizes="(max-width: 640px) 100vw, 320px"
 />
 </div>
 <figcaption className="border-t border-black/[0.06] px-4 py-3">
 <p className="text-sm font-semibold text-[#1d1d1f]">{TRAVEL_COUPLE.herName}</p>
 <p className="text-xs text-[#86868b]">Plant die Route – Karte in der Hand statt nur App.</p>
 </figcaption>
 </figure>

 <figure className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.06] sm:mt-10">
 <div className="relative aspect-[3/4] bg-[#f5f5f7]">
 <Image
 src={COUPLE_PHOTOS.thomas}
 alt=""
 fill
 className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
 sizes="(max-width: 640px) 100vw, 320px"
 />
 </div>
 <figcaption className="border-t border-black/[0.06] px-4 py-3">
 <p className="text-sm font-semibold text-[#1d1d1f]">{TRAVEL_COUPLE.hisName}</p>
 <p className="text-xs text-[#86868b]">Hält unterwegs fest, was uns gefällt – ohne Pose.</p>
 </figcaption>
 </figure>
 </section>

 <section className="mt-10 overflow-hidden rounded-2xl bg-stone-900 shadow-lg">
 <div className="relative aspect-[21/9] min-h-[180px]">
 <Image
 src={VENICE_PHOTOS.pauseCanal.url}
 alt={VENICE_PHOTOS.pauseCanal.alt}
 fill
 className="object-cover opacity-90"
 sizes="(max-width: 1024px) 100vw, 960px"
 />
 <div className="absolute inset-0 bg-gradient-to-r from-stone-900/80 via-stone-900/30 to-transparent" />
 <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
 <p className="text-xs font-semibold uppercase tracking-wider text-stone-300">Demnächst</p>
 <p className="mt-1 max-w-md text-lg font-semibold text-white">
 Unsere Reiseberichte:{" "}
 <Link href="/reisebericht/venedig" className="underline decoration-white/40 underline-offset-2 hover:decoration-white">
 Venedig
 </Link>
 {" · "}
 <Link href="/reisebericht/cinque-terre" className="underline decoration-white/40 underline-offset-2 hover:decoration-white">
 Cinque Terre
 </Link>
 {" · "}
 <Link href="/reisebericht/cote-dazur" className="underline decoration-white/40 underline-offset-2 hover:decoration-white">
 Côte d&apos;Azur
 </Link>
 {" "}– Tipps, Routen und Buchungslinks.
 </p>
 </div>
 </div>
 </section>

 <p className="mt-10 flex items-start gap-2 text-xs leading-relaxed text-stone-400">
 <Heart className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-300" />
 {TRAVEL_COUPLE.disclaimer}
 </p>
 </main>
 </div>
 );
}
