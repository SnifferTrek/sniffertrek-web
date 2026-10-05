"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import type { LightboxSlide } from "@/lib/travelReports/veniceLightboxGallery";

type EnlargeableImageProps = {
 src: string;
 alt?: string;
 caption?: string;
 className?: string;
 figcaptionClassName?: string;
 variant?: "inline" | "tile" | "embedded" | "tip";
 fit?: "cover" | "contain";
 lightboxSrc?: string;
 gallery?: readonly LightboxSlide[];
 galleryIndex?: number;
};

export default function EnlargeableImage({
 src,
 alt = "",
 caption,
 className = "",
 figcaptionClassName = "",
 variant = "inline",
 fit = "cover",
 lightboxSrc,
 gallery,
 galleryIndex = 0,
}: EnlargeableImageProps) {
 const [open, setOpen] = useState(false);
 const [activeIndex, setActiveIndex] = useState(galleryIndex);
 const close = useCallback(() => setOpen(false), []);

 const hasGallery = gallery && gallery.length > 1;
 const safeIndex = hasGallery
 ? ((activeIndex % gallery.length) + gallery.length) % gallery.length
 : 0;
 const slide = hasGallery ? gallery[safeIndex] : null;
 const displaySrc = slide?.src ?? lightboxSrc ?? (src.includes("unsplash.com") ? src.replace(/w=\d+/, "w=2000") : src);
 const displayAlt = slide?.alt ?? alt;
 const displayCaption = slide?.caption ?? caption;

 const goPrev = useCallback(() => {
 if (!gallery?.length) return;
 setActiveIndex((i) => (i - 1 + gallery.length) % gallery.length);
 }, [gallery]);

 const goNext = useCallback(() => {
 if (!gallery?.length) return;
 setActiveIndex((i) => (i + 1) % gallery.length);
 }, [gallery]);

 const openLightbox = () => {
 setActiveIndex(galleryIndex);
 setOpen(true);
 };

 useEffect(() => {
 if (!open) return;
 const onKey = (e: KeyboardEvent) => {
 if (e.key === "Escape") close();
 if (hasGallery && e.key === "ArrowLeft") goPrev();
 if (hasGallery && e.key === "ArrowRight") goNext();
 };
 document.body.style.overflow = "hidden";
 window.addEventListener("keydown", onKey);
 return () => {
 document.body.style.overflow = "";
 window.removeEventListener("keydown", onKey);
 };
 }, [open, close, hasGallery, goPrev, goNext]);

 const fitClass = fit === "contain" ? "object-contain" : "object-cover";

 const imgClass =
 variant === "tip"
 ? `aspect-[462/273] w-full bg-stone-50 ${fitClass} transition-transform group-hover:scale-[1.01]`
 : variant === "tile" || variant === "embedded"
 ? `aspect-[4/3] w-full ${fitClass} transition-transform group-hover:scale-[1.02]`
 : `aspect-[16/10] w-full ${fitClass} transition-transform group-hover:scale-[1.01]`;

 const figureClass =
 variant === "tip"
 ? "mt-3 overflow-hidden rounded-lg border border-stone-100 bg-stone-50"
 : variant === "embedded"
 ? "overflow-hidden"
 : variant === "tile"
 ? "overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
 : "overflow-hidden rounded-2xl border border-stone-200 shadow-sm";

 return (
 <>
 <figure className={figureClass}>
 <button
 type="button"
 onClick={openLightbox}
 className={`group relative block w-full cursor-zoom-in text-left ${className}`}
 aria-label={caption ? `${caption} vergrössern` : "Bild vergrössern"}
 >
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={src}
 alt={alt}
 className={imgClass}
 loading="lazy"
 referrerPolicy="no-referrer"
 />
 <span className="pointer-events-none absolute inset-0 bg-stone-900/0 transition-colors group-hover:bg-stone-900/10" />
 <span className="pointer-events-none absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
 <ZoomIn className="h-4 w-4" />
 </span>
 </button>
 {caption ? (
 <figcaption className={figcaptionClassName || "px-4 py-2 text-xs text-stone-500"}>
 {caption}
 </figcaption>
 ) : null}
 </figure>

 {open ? (
 <div
 className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/90 p-4 sm:p-8"
 role="dialog"
 aria-modal="true"
 aria-label={displayCaption ?? displayAlt ?? "Bildvorschau"}
 onClick={close}
 >
 <button
 type="button"
 onClick={close}
 className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
 aria-label="Schliessen"
 >
 <X className="h-5 w-5" />
 </button>

 {hasGallery ? (
 <>
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 goPrev();
 }}
 className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:left-4"
 aria-label="Vorheriges Bild"
 >
 <ChevronLeft className="h-6 w-6" />
 </button>
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation();
 goNext();
 }}
 className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 sm:right-4"
 aria-label="Nächstes Bild"
 >
 <ChevronRight className="h-6 w-6" />
 </button>
 </>
 ) : null}

 <figure className="relative max-h-full max-w-5xl px-10 sm:px-14" onClick={(e) => e.stopPropagation()}>
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={displaySrc}
 alt={displayAlt}
 className="max-h-[min(85vh,900px)] w-auto max-w-full rounded-lg object-contain shadow-2xl"
 referrerPolicy="no-referrer"
 />
 {displayCaption ? (
 <figcaption className="mt-3 text-center text-sm text-white/80">{displayCaption}</figcaption>
 ) : null}
 {hasGallery ? (
 <p className="mt-2 text-center text-xs text-white/50">
 {safeIndex + 1} / {gallery.length}
 </p>
 ) : null}
 </figure>
 </div>
 ) : null}
 </>
 );
}
