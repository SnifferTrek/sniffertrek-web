import { CINQUE_TERRE_POI_PHOTOS, cinqueTerrePhotoUrl, cinqueTerrePhotoAlt } from "@/lib/travelReports/cinqueTerrePhotos";
import type { LightboxSlide } from "@/lib/travelReports/types";

export type { LightboxSlide };

function toLarge(src: string): string {
 if (src.includes("unsplash.com")) {
 return src.replace(/w=\d+/, "w=2000");
 }
 return src;
}

export const CINQUE_TERRE_LIGHTBOX_GALLERY: LightboxSlide[] = [
 ...CINQUE_TERRE_POI_PHOTOS.map((poi) => ({
 src: toLarge(poi.photo),
 alt: poi.alt,
 caption: poi.caption,
 })),
 {
 src: toLarge(cinqueTerrePhotoUrl.ferry),
 alt: cinqueTerrePhotoAlt.ferry,
 caption: "Fähre · Golfo dei Poeti",
 },
];

export function cinqueTerreGalleryIndexForSrc(src: string): number {
 const normalized = src.replace(/w=\d+/, "w=2000");
 const idx = CINQUE_TERRE_LIGHTBOX_GALLERY.findIndex(
 (s) => s.src === normalized || s.src === src || src.includes(s.src.split("?")[0]!),
 );
 return idx >= 0 ? idx : 0;
}
