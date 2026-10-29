"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { PdfCoverExtraTextPlacement, Trip } from "@/lib/types";
import { getPdfCopy } from "@/lib/pdfCopy";

export type CoverLayoutStyle = "background" | "belowTitle";
import {
 COVER_CONTENT_W_PT,
 COVER_MARGIN_PT,
 COVER_PAGE_H_PT,
 COVER_PAGE_W_PT,
 computeCoverLayout,
 coverAlignToCss,
 coverTextBoxStylePlain,
 getCoverDateDisplayText,
} from "@/lib/coverSheetLayout";

export type CoverSheetTypography = {
 titleColor: string;
 dateColor: string;
 extraColor: string;
 titleSize: number;
 dateSize: number;
 extraSize: number;
 titleFont: string;
 dateFont: string;
 extraFont: string;
 titleAlign: "left" | "center" | "right";
 dateAlign: "left" | "center" | "right";
 extraAlign: "left" | "center" | "right";
};

function coverFontFamily(font: string): string {
 if (font === "times") return "Times New Roman, Times, serif";
 if (font === "courier") return "Courier New, Courier, monospace";
 return "Helvetica, Arial, sans-serif";
}

export function buildCoverTypography(trip: Trip): CoverSheetTypography {
 return {
 titleColor: trip.pdfCoverTitleColor || "#007aff",
 dateColor: trip.pdfCoverDateColor || "#007aff",
 extraColor: trip.pdfCoverExtraTextColor || "#ffffff",
 titleSize: Math.max(18, Math.min(64, Number(trip.pdfCoverTitleSize) || 32)),
 dateSize: Math.max(10, Math.min(36, Number(trip.pdfCoverDateSize) || 14)),
 extraSize: Math.max(10, Math.min(28, Number(trip.pdfCoverExtraTextSize) || 14)),
 titleFont: trip.pdfCoverTitleFont || "helvetica",
 dateFont: trip.pdfCoverDateFont || "helvetica",
 extraFont: trip.pdfCoverExtraTextFont || "helvetica",
 titleAlign:
 trip.pdfCoverTitleAlign === "left" || trip.pdfCoverTitleAlign === "right"
 ? trip.pdfCoverTitleAlign
 : "center",
 dateAlign:
 trip.pdfCoverDateAlign === "left" || trip.pdfCoverDateAlign === "right"
 ? trip.pdfCoverDateAlign
 : "center",
 extraAlign:
 trip.pdfCoverExtraTextAlign === "left" || trip.pdfCoverExtraTextAlign === "right"
 ? trip.pdfCoverExtraTextAlign
 : "center",
 };
}

export const COVER_LAYOUT_THUMB_W = 112;

type CoverLayoutTextOverlayProps = {
 trip: Trip;
 coverIsPortrait: boolean;
 layoutStyle: CoverLayoutStyle;
 previewWidthPx: number;
 /** Hintergrund-Karte bei Querformat zeigt Layout „unter Titel“. */
 previewAsBelowTitle?: boolean;
};

/** Titel, Datum und Zusatztext auf Layout-Vorschau (proportional zur PDF-Grösse). */
export function CoverLayoutTextOverlay({
 trip,
 coverIsPortrait,
 layoutStyle,
 previewWidthPx,
 previewAsBelowTitle = false,
}: CoverLayoutTextOverlayProps) {
 const locale = useLocale();
 const pdfCopy = getPdfCopy(locale);
 const styleForLayout = previewAsBelowTitle ? "belowTitle" : layoutStyle;
 const tripForLayout: Trip = { ...trip, pdfCoverPhotoStyle: styleForLayout };
 const layout = computeCoverLayout(tripForLayout, coverIsPortrait);
 const scale = previewWidthPx / COVER_PAGE_W_PT;
 const typography = buildCoverTypography(trip);
 const extraText = trip.pdfCoverExtraText || "";
 const useShadow = layout.useBackground;

 const padLeftPct = (COVER_MARGIN_PT / COVER_PAGE_W_PT) * 100;
 const contentWidthPct = (COVER_CONTENT_W_PT / COVER_PAGE_W_PT) * 100;
 const titleTopPct = (layout.titleStartYPt / COVER_PAGE_H_PT) * 100;
 const titlePx = layout.titleFontSizePt * scale;

 const titleStyle: CSSProperties = {
 top: `${titleTopPct}%`,
 left: typography.titleAlign === "center" ? "50%" : `${padLeftPct}%`,
 width: `${contentWidthPct}%`,
 transform: typography.titleAlign === "center" ? "translateX(-50%)" : undefined,
 textAlign: coverAlignToCss(typography.titleAlign),
 color: typography.titleColor,
 fontFamily: coverFontFamily(typography.titleFont),
 fontSize: `${titlePx}px`,
 lineHeight: 1.25,
 textShadow: useShadow ? "0 1px 2px rgba(0,0,0,0.45)" : undefined,
 wordBreak: "break-word",
 };

 const dateStyle: CSSProperties = {
 top: `${(layout.date.topPt / COVER_PAGE_H_PT) * 100}%`,
 left: typography.dateAlign === "center" ? "50%" : `${padLeftPct}%`,
 width: `${contentWidthPct}%`,
 transform: typography.dateAlign === "center" ? "translateX(-50%)" : undefined,
 textAlign: coverAlignToCss(typography.dateAlign),
 color: typography.dateColor,
 fontFamily: coverFontFamily(typography.dateFont),
 fontSize: `${layout.date.fontSizePt * scale}px`,
 lineHeight: 1.35,
 textShadow: useShadow ? "0 1px 2px rgba(0,0,0,0.45)" : undefined,
 };

 const extraBox =
 layout.extra && extraText.trim()
 ? coverTextBoxStylePlain(layout.extra, scale, trip, layout.useBackground)
 : null;

 return (
 <>
 <div className="absolute z-10 font-bold leading-snug" style={titleStyle}>
 {trip.name || pdfCopy.newTrip}
 </div>
 <div className="absolute z-10" style={dateStyle}>
 {getCoverDateDisplayText(trip, locale)}
 </div>
 {extraBox && (
 <div className={extraBox.className} style={extraBox.style}>
 {extraText}
 </div>
 )}
 </>
 );
}

type CoverSheetPreviewProps = {
 trip: Trip;
 typography: CoverSheetTypography;
 coverIsPortrait: boolean;
 className?: string;
};

export function CoverSheetPreview({
 trip,
 typography,
 coverIsPortrait,
 className = "",
}: CoverSheetPreviewProps) {
 const locale = useLocale();
 const pdfCopy = getPdfCopy(locale);
 const rootRef = useRef<HTMLDivElement>(null);
 const [pageScale, setPageScale] = useState(COVER_PAGE_W_PT ? 132 / COVER_PAGE_W_PT : 0.22);

 useEffect(() => {
 const el = rootRef.current;
 if (!el) return;
 const update = () => {
 const w = el.getBoundingClientRect().width;
 if (w > 0) setPageScale(w / COVER_PAGE_W_PT);
 };
 update();
 const ro = new ResizeObserver(update);
 ro.observe(el);
 return () => ro.disconnect();
 }, []);

 const layout = computeCoverLayout(trip, coverIsPortrait);
 const extraText = trip.pdfCoverExtraText || "";
 const padLeftPct = (COVER_MARGIN_PT / COVER_PAGE_W_PT) * 100;
 const contentWidthPct = (COVER_CONTENT_W_PT / COVER_PAGE_W_PT) * 100;
 const titleTopPct = (layout.titleStartYPt / COVER_PAGE_H_PT) * 100;
 const titlePx = layout.titleFontSizePt * pageScale;
 const datePx = (layout.date?.fontSizePt ?? typography.dateSize) * pageScale;

 const titleStyle = {
 top: `${titleTopPct}%`,
 left: typography.titleAlign === "center" ? "50%" : `${padLeftPct}%`,
 width: typography.titleAlign === "center" ? `${contentWidthPct}%` : `${contentWidthPct}%`,
 transform: typography.titleAlign === "center" ? "translateX(-50%)" : undefined,
 textAlign: coverAlignToCss(typography.titleAlign),
 color: typography.titleColor,
 fontFamily: coverFontFamily(typography.titleFont),
 fontSize: `${titlePx}px`,
 lineHeight: 1.25,
 textShadow: layout.useBackground ? "0 1px 2px rgba(0,0,0,0.45)" : undefined,
 wordBreak: "break-word" as const,
 };

 const dateStyle = {
 top: `${(layout.date.topPt / COVER_PAGE_H_PT) * 100}%`,
 left: typography.dateAlign === "center" ? "50%" : `${padLeftPct}%`,
 width: `${contentWidthPct}%`,
 transform: typography.dateAlign === "center" ? "translateX(-50%)" : undefined,
 textAlign: coverAlignToCss(typography.dateAlign),
 color: typography.dateColor,
 fontFamily: coverFontFamily(typography.dateFont),
 fontSize: `${datePx}px`,
 lineHeight: 1.35,
 textShadow: layout.useBackground ? "0 1px 2px rgba(0,0,0,0.45)" : undefined,
 };

 const extraBox =
 layout.extra && extraText.trim()
 ? coverTextBoxStylePlain(layout.extra, pageScale, trip, layout.useBackground)
 : null;

 const imageTopPct = layout.imageTopPt ? (layout.imageTopPt / COVER_PAGE_H_PT) * 100 : 32;

 return (
 <div
 ref={rootRef}
 className={`relative aspect-[1/1.414] overflow-hidden rounded-lg border border-gray-200 bg-slate-200 ${className}`}
 >
 {layout.useBackground ? (
 <>
 <img src={trip.pdfCoverPhotoDataUrl} alt="" className="absolute inset-0 h-full w-full object-fill" />
 <div className="absolute inset-0 bg-black/20" />
 </>
 ) : (
 <>
 <div className="absolute inset-0 bg-white" />
 {trip.pdfCoverPhotoDataUrl ? (
 <div className="absolute inset-x-0 bottom-0 bg-white" style={{ top: `${imageTopPct}%` }}>
 <img src={trip.pdfCoverPhotoDataUrl} alt="" className="h-full w-full object-contain" />
 </div>
 ) : (
 <div className="absolute inset-x-0 bottom-0 bg-slate-300" style={{ top: `${imageTopPct}%` }} />
 )}
 </>
 )}

 <div className="absolute z-10 font-bold" style={titleStyle}>
 {trip.name || pdfCopy.newTrip}
 </div>

 <div className="absolute z-10" style={dateStyle}>
 {getCoverDateDisplayText(trip, locale)}
 </div>

 {extraBox && (
 <div className={extraBox.className} style={extraBox.style}>
 {extraText}
 </div>
 )}
 </div>
 );
}

type CoverExtraTextPlacementPickerProps = {
 value: PdfCoverExtraTextPlacement;
 onChange: (value: PdfCoverExtraTextPlacement) => void;
 className?: string;
};

function CoverLayoutWireframe({ variant, large }: { variant: CoverLayoutStyle; large?: boolean }) {
 const gradId = `cover-layout-grad-${variant}`;
 const sizeClass = large ? "h-[64px] w-[46px]" : "h-14 w-10";
 if (variant === "background") {
 return (
 <svg viewBox="0 0 40 56" className={`${sizeClass} shrink-0`} aria-hidden>
 <rect x="1" y="1" width="38" height="54" rx="3" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1.2" />
 <rect x="1" y="1" width="38" height="54" rx="3" fill={`url(#${gradId})`} opacity="0.85" />
 <line x1="8" y1="12" x2="32" y2="12" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
 <line x1="10" y1="18" x2="26" y2="18" stroke="#818cf8" strokeWidth="1.2" strokeLinecap="round" />
 <defs>
 <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
 <stop offset="0%" stopColor="#c7d2fe" />
 <stop offset="100%" stopColor="#a7f3d0" />
 </linearGradient>
 </defs>
 </svg>
 );
 }
 return (
 <svg viewBox="0 0 40 56" className={`${sizeClass} shrink-0`} aria-hidden>
 <rect x="1" y="1" width="38" height="54" rx="3" fill="#fff" stroke="#d1d5db" strokeWidth="1.2" />
 <line x1="8" y1="10" x2="32" y2="10" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
 <line x1="10" y1="16" x2="24" y2="16" stroke="#9ca3af" strokeWidth="1.2" strokeLinecap="round" />
 <rect x="4" y="22" width="32" height="30" rx="2" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
 </svg>
 );
}

type CoverLayoutStylePickerProps = {
 value: CoverLayoutStyle;
 onChange: (value: CoverLayoutStyle) => void;
 hasCoverPhoto?: boolean;
 coverIsPortrait?: boolean;
 className?: string;
};

export function CoverLayoutStylePicker({
 value,
 onChange,
 hasCoverPhoto = false,
 coverIsPortrait = true,
 className = "",
}: CoverLayoutStylePickerProps) {
 const tt = useTranslations("planerTabs");
 const showLandscapeHint = hasCoverPhoto && !coverIsPortrait;

 const options: CoverLayoutStyle[] = ["background", "belowTitle"];
 const labels: Record<CoverLayoutStyle, string> = {
 background: tt("coverBg"),
 belowTitle: tt("coverBelow"),
 };

 return (
 <div className={`flex flex-col items-center justify-center ${className}`}>
 <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Layout</p>
 <div
 className="flex flex-col items-center gap-2.5 rounded-xl bg-gray-50/90 p-2.5"
 role="radiogroup"
 aria-label={tt("cover")}
 >
 {options.map((id) => {
 const selected = value === id;
 return (
 <button
 key={id}
 type="button"
 role="radio"
 aria-checked={selected}
 aria-label={labels[id]}
 title={labels[id]}
 onClick={() => onChange(id)}
 className={`rounded-lg border-2 p-1.5 transition-all ${
 selected
 ? "border-indigo-500 bg-white shadow-sm ring-2 ring-indigo-200"
 : "border-transparent bg-white/80 hover:border-indigo-200"
 }`}
 >
 <CoverLayoutWireframe variant={id} large />
 </button>
 );
 })}
 </div>
 {showLandscapeHint && value === "background" && (
 <p className="mt-2 max-w-[88px] text-center text-[9px] leading-snug text-amber-700">
 {tt("coverLandscape")}
 </p>
 )}
 </div>
 );
}

export function CoverExtraTextPlacementPicker({
 value,
 onChange,
 className = "",
}: CoverExtraTextPlacementPickerProps) {
 const tt = useTranslations("planerTabs");
 const placements: PdfCoverExtraTextPlacement[] = ["beforeDate", "afterDate", "middle", "bottom"];
 const titles: Record<PdfCoverExtraTextPlacement, string> = {
 beforeDate: tt("extraBeforeDate"),
 afterDate: tt("extraAfterDate"),
 middle: tt("extraMiddle"),
 bottom: tt("extraBottom"),
 };

 return (
 <div className={`flex shrink-0 flex-col ${className}`}>
 <p className="mb-2 shrink-0 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">
 {tt("extraPos")}
 </p>
 <div className="relative mx-auto flex w-[116px] aspect-[1/1.414] flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
 <div className="shrink-0 space-y-1.5 px-2.5 pb-0.5 pt-2.5" aria-hidden>
 <div className="h-1 rounded-sm bg-gray-300" />
 <div className="mx-auto h-0.5 w-4/5 rounded-sm bg-gray-200" />
 </div>
 <div className="relative z-10 flex flex-1 flex-col items-center justify-evenly py-1.5">
 {placements.map((id) => {
 const active = value === id;
 return (
 <button
 key={id}
 type="button"
 title={titles[id]}
 aria-label={titles[id]}
 aria-pressed={active}
 onClick={() => onChange(id)}
 className={`h-3.5 w-3.5 shrink-0 rounded-full border transition-all ${
 active
 ? "border-white bg-indigo-600 ring-[1.5px] ring-indigo-400"
 : "border-indigo-400 bg-white hover:bg-indigo-50"
 }`}
 />
 );
 })}
 </div>
 <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[26%] rounded-b bg-gray-100" aria-hidden />
 </div>
 </div>
 );
}
