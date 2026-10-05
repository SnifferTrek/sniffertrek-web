import { inspirationPhoto } from "@/lib/inspirationDestinations";

/**
 * Unsplash – französische Alpen / Passstrassen / Cannes.
 * Hero und Etappen je eigene ID.
 */
export const GRANDES_ALPES_PHOTOS = {
  hero: {
    url: inspirationPhoto("1519904981063-b0cf448d479e", 2000),
    alt: "Serpentinen einer Passstrasse in den französischen Alpen",
  },
  geneva: {
    url: inspirationPhoto("1482192505345-5655af888cc4", 1800),
    alt: "Bergsee mit Gipfeln – Stimmung wie der Start am Genfersee",
  },
  megeve: {
    url: inspirationPhoto("1470071459604-3b5ec3a7fe05", 1800),
    alt: "Nebelige Alpenkämme – erste Nacht in Megève oder Grand-Bornand",
  },
  roselend: {
    url: inspirationPhoto("1454496522488-7a8e488e8606", 1800),
    alt: "Alpiner Stausee zwischen Gipfeln – wie der Lac de Roselend",
  },
  iseran: {
    url: inspirationPhoto("1464822759023-fed622ff2c3b", 1800),
    alt: "Hohe Gipfel über der Baumgrenze – Col de l'Iseran",
  },
  galibier: {
    url: inspirationPhoto("1506905925346-21bda4d32df4", 1800),
    alt: "Weite Bergkette ohne Wald – Stimmung Col du Galibier",
  },
  izoard: {
    url: inspirationPhoto("1551632811-561732d1e306", 1800),
    alt: "Steile Berghänge und Geröll – Casse Déserte am Izoard",
  },
  bonette: {
    url: inspirationPhoto("1469474968028-d17130b471c8", 1800),
    alt: "Abendlicht über den Südalpen – Cime de la Bonette",
  },
  vesubie: {
    url: inspirationPhoto("1549880338-65ddcdfd017b", 1600),
    alt: "Letzte Bergnacht vor dem Meer – Mercantour / Vésubie",
  },
  cannes: {
    url: inspirationPhoto("1677182302564-ffc6bb3252cd", 1800),
    alt: "Cannes – Yachthafen und Altstadt Suquet mit Turm",
  },
} as const;

export const grandesAlpesPhotoUrl = {
  hero: GRANDES_ALPES_PHOTOS.hero.url,
  geneva: GRANDES_ALPES_PHOTOS.geneva.url,
  megeve: GRANDES_ALPES_PHOTOS.megeve.url,
  roselend: GRANDES_ALPES_PHOTOS.roselend.url,
  iseran: GRANDES_ALPES_PHOTOS.iseran.url,
  galibier: GRANDES_ALPES_PHOTOS.galibier.url,
  izoard: GRANDES_ALPES_PHOTOS.izoard.url,
  bonette: GRANDES_ALPES_PHOTOS.bonette.url,
  vesubie: GRANDES_ALPES_PHOTOS.vesubie.url,
  cannes: GRANDES_ALPES_PHOTOS.cannes.url,
};

export const grandesAlpesPhotoAlt = {
  hero: GRANDES_ALPES_PHOTOS.hero.alt,
  geneva: GRANDES_ALPES_PHOTOS.geneva.alt,
  megeve: GRANDES_ALPES_PHOTOS.megeve.alt,
  roselend: GRANDES_ALPES_PHOTOS.roselend.alt,
  iseran: GRANDES_ALPES_PHOTOS.iseran.alt,
  galibier: GRANDES_ALPES_PHOTOS.galibier.alt,
  izoard: GRANDES_ALPES_PHOTOS.izoard.alt,
  bonette: GRANDES_ALPES_PHOTOS.bonette.alt,
  vesubie: GRANDES_ALPES_PHOTOS.vesubie.alt,
  cannes: GRANDES_ALPES_PHOTOS.cannes.alt,
};

export type GrandesAlpesPoiCard = {
  id: string;
  name: string;
  photo: string;
  alt: string;
  caption: string;
  tip: string;
};

export const GRANDES_ALPES_POI_PHOTOS: GrandesAlpesPoiCard[] = [
  {
    id: "megeve",
    name: "Megève · 1. Nacht",
    photo: grandesAlpesPhotoUrl.megeve,
    alt: grandesAlpesPhotoAlt.megeve,
    caption: "Megève / Grand-Bornand",
    tip: "Erste Bergnacht nach Genf – nicht noch Iseran am selben Tag.",
  },
  {
    id: "roselend",
    name: "Cormet de Roselend",
    photo: grandesAlpesPhotoUrl.roselend,
    alt: grandesAlpesPhotoAlt.roselend,
    caption: "Lac de Roselend",
    tip: "See, Staumauer, Kehren – der schönste Stopp vor Val-d'Isère.",
  },
  {
    id: "iseran",
    name: "Col de l'Iseran",
    photo: grandesAlpesPhotoUrl.iseran,
    alt: grandesAlpesPhotoAlt.iseran,
    caption: "2770 m · höchster Asphaltpass",
    tip: "Morgens fahren, Windjacke, nicht bei Neuschnee.",
  },
  {
    id: "galibier",
    name: "Col du Galibier",
    photo: grandesAlpesPhotoUrl.galibier,
    alt: grandesAlpesPhotoAlt.galibier,
    caption: "Galibier nach dem Iseran",
    tip: "Zwei grosse Pässe an einem Tag – Pause in Valloire.",
  },
  {
    id: "izoard",
    name: "Col d'Izoard",
    photo: grandesAlpesPhotoUrl.izoard,
    alt: grandesAlpesPhotoAlt.izoard,
    caption: "Casse Déserte",
    tip: "Kurze Etappe – extra Zeit für die Mondlandschaft.",
  },
  {
    id: "bonette",
    name: "Cime de la Bonette",
    photo: grandesAlpesPhotoUrl.bonette,
    alt: grandesAlpesPhotoAlt.bonette,
    caption: "2802 m · Schleife oben",
    tip: "Nicht nur durchfahren: die kurze Kamm-Schleife mitgehen.",
  },
  {
    id: "cannes",
    name: "Cannes · 7. Nacht",
    photo: grandesAlpesPhotoUrl.cannes,
    alt: grandesAlpesPhotoAlt.cannes,
    caption: "Cannes · Suquet",
    tip: "Ziel am Meer – Suquet statt Festival-Croisette.",
  },
];
