import { COUPLE_PHOTOS } from "@/lib/travelCouple";
import { VENICE_POI_PHOTOS } from "@/lib/travelReports/venicePhotos";
import { venicePhotoUrl, venicePhotoAlt } from "@/lib/travelReports/venicePhotos";

import type { LightboxSlide } from "@/lib/travelReports/types";

export type { LightboxSlide };

function toLarge(src: string): string {
 if (src.includes("unsplash.com")) {
 return src.replace(/w=\d+/, "w=2000");
 }
 return src;
}

/** Alle vergrösserbaren Bilder im Venedig-Bericht – Reihenfolge für Pfeil-Navigation. */
export const VENICE_LIGHTBOX_GALLERY: LightboxSlide[] = [
 ...VENICE_POI_PHOTOS.map((poi) => ({
 src: toLarge(poi.photo),
 alt: poi.alt,
 caption: poi.caption,
 })),
 {
 src: toLarge(venicePhotoUrl.rialtoMarket),
 alt: venicePhotoAlt.rialtoMarket,
 caption: "Mercato di Rialto am Morgen",
 },
 {
 src: toLarge(venicePhotoUrl.burano),
 alt: venicePhotoAlt.burano,
 caption: "Burano · bunte Fischerhäuser",
 },
 {
 src: toLarge(venicePhotoUrl.pauseCanal),
 alt: venicePhotoAlt.pauseCanal,
 caption: "Zattere · Dorsoduro am Abend",
 },
 {
 src: COUPLE_PHOTOS.veniceCanalBack,
 alt: "Anna und Thomas am Canalrand, Blick Richtung San Marco",
 caption: "Wir am Canalrand · Blick Richtung San Marco",
 },
];

/** Index in {@link VENICE_LIGHTBOX_GALLERY} für Thumbnail-URL. */
export function veniceGalleryIndexForSrc(thumbSrc: string): number {
 const large = toLarge(thumbSrc);
 const idx = VENICE_LIGHTBOX_GALLERY.findIndex(
 (s) => s.src === large || s.src.split("?")[0] === large.split("?")[0],
 );
 return idx >= 0 ? idx : 0;
}
