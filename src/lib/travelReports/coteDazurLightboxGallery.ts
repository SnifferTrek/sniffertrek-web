import {
  COTE_DAZUR_POI_PHOTOS,
  coteDazurPhotoUrl,
  coteDazurPhotoAlt,
} from "@/lib/travelReports/coteDazurPhotos";
import type { LightboxSlide } from "@/lib/travelReports/types";

export type { LightboxSlide };

function toLarge(src: string): string {
  if (src.includes("unsplash.com")) {
    return src.replace(/w=\d+/, "w=2000");
  }
  return src;
}

export const COTE_DAZUR_LIGHTBOX_GALLERY: LightboxSlide[] = [
  ...COTE_DAZUR_POI_PHOTOS.map((poi) => ({
    src: toLarge(poi.photo),
    alt: poi.alt,
    caption: poi.name,
  })),
  {
    src: toLarge(coteDazurPhotoUrl.antibes),
    alt: coteDazurPhotoAlt.antibes,
    caption: "Antibes · Altstadt",
  },
  {
    src: toLarge(coteDazurPhotoUrl.saintTropez),
    alt: coteDazurPhotoAlt.saintTropez,
    caption: "Saint-Tropez · Hafen",
  },
  {
    src: toLarge(coteDazurPhotoUrl.eze),
    alt: coteDazurPhotoAlt.eze,
    caption: "Èze · Dorf über dem Meer",
  },
  {
    src: toLarge(coteDazurPhotoUrl.monaco),
    alt: coteDazurPhotoAlt.monaco,
    caption: "Monaco · Hafen",
  },
  {
    src: toLarge(coteDazurPhotoUrl.market),
    alt: coteDazurPhotoAlt.market,
    caption: "Essen · Meeresfrüchte",
  },
];

export function coteDazurGalleryIndexForSrc(src: string): number {
  const normalized = src.replace(/w=\d+/, "w=2000");
  const idx = COTE_DAZUR_LIGHTBOX_GALLERY.findIndex(
    (s) => s.src === normalized || s.src === src || src.includes(s.src.split("?")[0]!),
  );
  return idx >= 0 ? idx : 0;
}
