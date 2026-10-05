import { BARCELONA_POI_PHOTOS } from "@/lib/travelReports/barcelonaPhotos";
import { barcelonaPhotoAlt, barcelonaPhotoUrl } from "@/lib/travelReports/barcelonaPhotos";

import type { LightboxSlide } from "@/lib/travelReports/types";

function toLarge(src: string): string {
  if (src.includes("unsplash.com")) {
    return src.replace(/w=\d+/, "w=2000");
  }
  return src;
}

export const BARCELONA_LIGHTBOX_GALLERY: LightboxSlide[] = [
  ...BARCELONA_POI_PHOTOS.map((poi) => ({
    src: toLarge(poi.photo),
    alt: poi.alt,
    caption: poi.caption,
  })),
  {
    src: toLarge(barcelonaPhotoUrl.cityView),
    alt: barcelonaPhotoAlt.cityView,
    caption: "Blick über Barcelona",
  },
  {
    src: toLarge(barcelonaPhotoUrl.harbor),
    alt: barcelonaPhotoAlt.harbor,
    caption: "Port Vell",
  },
];

export function barcelonaGalleryIndexForSrc(thumbSrc: string): number {
  const large = toLarge(thumbSrc);
  const idx = BARCELONA_LIGHTBOX_GALLERY.findIndex(
    (s) => s.src === large || s.src.split("?")[0] === large.split("?")[0],
  );
  return idx >= 0 ? idx : 0;
}
