import {
  GRANDES_ALPES_POI_PHOTOS,
  grandesAlpesPhotoUrl,
  grandesAlpesPhotoAlt,
} from "@/lib/travelReports/grandesAlpesPhotos";
import type { LightboxSlide } from "@/lib/travelReports/types";

export type { LightboxSlide };

function toLarge(src: string): string {
  if (src.includes("unsplash.com")) {
    return src.replace(/w=\d+/, "w=2000");
  }
  return src;
}

export const GRANDES_ALPES_LIGHTBOX_GALLERY: LightboxSlide[] = [
  ...GRANDES_ALPES_POI_PHOTOS.map((poi) => ({
    src: toLarge(poi.photo),
    alt: poi.alt,
    caption: poi.name,
  })),
  {
    src: toLarge(grandesAlpesPhotoUrl.geneva),
    alt: grandesAlpesPhotoAlt.geneva,
    caption: "Start · Genfersee / Alpen",
  },
  {
    src: toLarge(grandesAlpesPhotoUrl.vesubie),
    alt: grandesAlpesPhotoAlt.vesubie,
    caption: "Mercantour · letzte Bergnacht",
  },
];

export function grandesAlpesGalleryIndexForSrc(src: string): number {
  const normalized = src.replace(/w=\d+/, "w=2000");
  const idx = GRANDES_ALPES_LIGHTBOX_GALLERY.findIndex(
    (s) => s.src === normalized || s.src === src || src.includes(s.src.split("?")[0]!),
  );
  return idx >= 0 ? idx : 0;
}
