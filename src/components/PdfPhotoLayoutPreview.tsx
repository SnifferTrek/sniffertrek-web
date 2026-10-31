"use client";

import type { PdfPhotoLayout } from "@/lib/types";
import {
 SMART_PAGES_MAX_PHOTOS,
 buildSmartPhotoPages,
 smartPageCellBoxes,
} from "@/lib/pdfSmartPages";
import MediaImg from "@/components/MediaImg";

export const PDF_PHOTO_LAYOUT_LABELS: Record<PdfPhotoLayout, string> = {
 auto: "Auto Layout",
 onePerPageMax: "1 Bild ganzseitig",
 onePortraitTopHalf: "1 Bild halbseitig oben",
 onePortraitBottomHalf: "1 Bild halbseitig unten",
 twoPortraitSideBySide: "2 Hochformat nebeneinander",
 twoPortraitStacked: "2 Hochformat oben/unten",
 twoMixedStacked: "1 Hoch + 1 Quer oben/unten",
 sixPortraitGrid: "6 Hochformat Grid",
 threePortraitOneLandscape: "3 Hoch + 1 Quer",
 twoPortraitTopOneLandscapeBottom: "2 Hoch oben + 1 Quer unten",
 oneLandscapeTopTwoPortraitBottom: "1 Quer oben + 2 Hoch unten",
 grid: "Raster",
 smartPages: "Smart Pages",
};

type PdfPhotoLayoutPreviewProps = {
 layout: PdfPhotoLayout;
 photos: string[];
 targetPages?: number;
 /** width/height — same source the PDF uses for landscape vs portrait rows */
 aspects?: Record<string, number>;
 /** Limit rendered Smart Pages (e.g. layout picker thumbnail). */
 maxPages?: number;
 showPageLabels?: boolean;
 className?: string;
 maxWidthClass?: string;
 draggable?: boolean;
 draggingSlot?: number | null;
 onDragStart?: (slotIndex: number) => void;
 onDragEnd?: () => void;
 onMoveSlot?: (fromIndex: number, toIndex: number) => void;
};

export function PdfPhotoLayoutPreview({
 layout,
 photos,
 targetPages = 1,
 aspects = {},
 maxPages,
 showPageLabels = true,
 className = "",
 maxWidthClass = "w-[220px]",
 draggable = false,
 draggingSlot = null,
 onDragStart,
 onDragEnd,
 onMoveSlot,
}: PdfPhotoLayoutPreviewProps) {
 const renderSlot = (slotIdx: number, slotClassName = "") => {
 const url = photos[slotIdx];
 const canDrag = draggable && !!url && !!onMoveSlot;
 return (
 <div
 className={`min-h-0 border rounded ${url ? "border-gray-300 bg-white" : "border-dashed border-gray-200 bg-gray-50/80"} ${slotClassName}`}
 onDragOver={(ev) => {
 if (!canDrag) return;
 ev.preventDefault();
 }}
 onDrop={(ev) => {
 if (!canDrag) return;
 ev.preventDefault();
 const fromIndex = Number(ev.dataTransfer.getData("text/plain"));
 if (Number.isFinite(fromIndex)) onMoveSlot(fromIndex, slotIdx);
 onDragEnd?.();
 }}
 title={canDrag ? "Foto hierhin ziehen" : undefined}
 >
 {url ? (
 <MediaImg
 src={url}
 alt={`Position ${slotIdx + 1}`}
 className={`h-full w-full object-contain ${draggingSlot === slotIdx ? "opacity-40" : ""}`}
 draggable={canDrag}
 onDragStart={(ev) => {
 if (!canDrag) return;
 ev.dataTransfer.setData("text/plain", String(slotIdx));
 onDragStart?.(slotIdx);
 }}
 onDragEnd={() => onDragEnd?.()}
 />
 ) : null}
 </div>
 );
 };

 if (layout === "smartPages") {
 const previewPhotos = Array.from(new Set(photos)).slice(0, SMART_PAGES_MAX_PHOTOS);
 const items = previewPhotos.map((url) => ({
 index: Math.max(0, photos.indexOf(url)),
 aspect: aspects[url] && aspects[url] > 0 ? aspects[url] : 0.75,
 }));
 const pages = buildSmartPhotoPages(items, targetPages).slice(
 0,
 maxPages && maxPages > 0 ? maxPages : undefined
 );
 const pageW = maxWidthClass;
 return (
 <div className={`flex flex-wrap items-start gap-2 ${className}`}>
 {pages.map((page, pageNo) => {
 const cells = smartPageCellBoxes(page);
 return (
 <div key={`smart-page-${pageNo}`} className={pageW}>
 {showPageLabels ? (
 <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
 Seite {pageNo + 1}
 </p>
 ) : null}
 <div className="relative aspect-[1/1.414] w-full overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
 {cells.length === 0 ? (
 <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
 Leer
 </div>
 ) : (
 cells.map((cell) => (
 <div
 key={`sp-${pageNo}-${cell.item.index}`}
 className="absolute"
 style={{
 top: `${cell.topPct}%`,
 left: `${cell.leftPct}%`,
 width: `${cell.widthPct}%`,
 height: `${cell.heightPct}%`,
 }}
 >
 {renderSlot(cell.item.index, "h-full w-full")}
 </div>
 ))
 )}
 </div>
 </div>
 );
 })}
 </div>
 );
 }

 return (
 <div className={`${maxWidthClass} ${className}`}>
 <div className="aspect-[1/1.414] w-full rounded-lg border border-gray-300 bg-white p-2 shadow-sm">
 {layout === "onePerPageMax" && renderSlot(0, "h-full border-2")}
 {layout === "onePortraitTopHalf" && (
 <div className="grid h-full grid-rows-2 gap-1">
 {renderSlot(0, "border-2")}
 <div className="rounded border border-dashed border-gray-200" />
 </div>
 )}
 {layout === "onePortraitBottomHalf" && (
 <div className="grid h-full grid-rows-2 gap-1">
 <div className="rounded border border-dashed border-gray-200" />
 {renderSlot(0, "border-2")}
 </div>
 )}
 {layout === "twoPortraitSideBySide" && (
 <div className="grid h-full grid-cols-2 gap-1">
 {renderSlot(0, "h-full")}
 {renderSlot(1, "h-full")}
 </div>
 )}
 {layout === "twoPortraitStacked" && (
 <div className="grid h-full grid-rows-2 gap-1">
 {renderSlot(0)}
 {renderSlot(1)}
 </div>
 )}
 {layout === "twoMixedStacked" && (
 <div className="grid h-full grid-rows-2 gap-1">
 {renderSlot(0, "mx-6")}
 {renderSlot(1)}
 </div>
 )}
 {layout === "sixPortraitGrid" && (
 <div className="grid h-full grid-cols-3 gap-1">
 {Array.from({ length: 6 }).map((_, i) => (
 <div key={i} className="aspect-[3/4]">
 {renderSlot(i, "h-full")}
 </div>
 ))}
 </div>
 )}
 {layout === "threePortraitOneLandscape" && (
 <div className="grid h-full grid-rows-[1.15fr_0.85fr] gap-1">
 <div className="grid min-h-0 grid-cols-3 gap-1">
 {renderSlot(0, "h-full")}
 {renderSlot(1, "h-full")}
 {renderSlot(2, "h-full")}
 </div>
 <div className="min-h-0">{renderSlot(3, "h-full w-full")}</div>
 </div>
 )}
 {layout === "twoPortraitTopOneLandscapeBottom" && (
 <div className="grid h-full grid-rows-[1fr_auto] gap-1">
 <div className="grid grid-cols-2 gap-1 min-h-0">
 {renderSlot(0, "h-full")}
 {renderSlot(1, "h-full")}
 </div>
 <div className="h-12">{renderSlot(2, "h-full")}</div>
 </div>
 )}
 {layout === "oneLandscapeTopTwoPortraitBottom" && (
 <div className="grid h-full grid-rows-[auto_1fr] gap-1">
 <div className="h-12">{renderSlot(0, "h-full")}</div>
 <div className="grid grid-cols-2 gap-1 min-h-0">
 {renderSlot(1, "h-full")}
 {renderSlot(2, "h-full")}
 </div>
 </div>
 )}
 {layout === "grid" && (
 <div className="grid h-full grid-cols-3 gap-1">
 {Array.from({ length: 6 }).map((_, i) => (
 <div key={i} className="aspect-square">
 {renderSlot(i, "h-full")}
 </div>
 ))}
 </div>
 )}
 {layout === "auto" && (
 <div className="flex h-full items-center justify-center text-[10px] text-gray-400">Auto</div>
 )}
 </div>
 </div>
 );
}
