import { inspirationPhoto } from "@/lib/inspirationDestinations";

/**
 * Unsplash – Côte d'Azur (Location/Beschreibung geprüft, Juli 2026).
 * Keine generischen Tropen-/Alpen-Motive – je Ort eine eigene ID.
 */
export const COTE_DAZUR_PHOTOS = {
  hero: {
    url: inspirationPhoto("1643914729809-4aa59fdc4c17", 2000),
    alt: "Nizza von oben – Baie des Anges und Promenade des Anglais",
  },
  nice: {
    url: inspirationPhoto("1694725330422-64ed85b9f26e", 1800),
    alt: "Promenade des Anglais in Nizza mit Palmen und Kieselstrand",
  },
  antibes: {
    url: inspirationPhoto("1688076164054-a3a7667befc3", 1800),
    alt: "Antibes Altstadt vom Meer – Türme und Alpen im Hintergrund",
  },
  plageKeller: {
    url: inspirationPhoto("1624184780131-189b96898b84", 1800),
    alt: "Cap d'Antibes – Felsküste und türkises Mittelmeer (Plage Keller)",
  },
  eze: {
    url: inspirationPhoto("1674676618294-032e247cd5f4", 1800),
    alt: "Èze – mittelalterliches Dorf hoch über dem Mittelmeer",
  },
  monaco: {
    url: inspirationPhoto("1747297207357-e3d65957131e", 1800),
    alt: "Monaco – Yachthafen und Stadt an den Hängen",
  },
  cannes: {
    url: inspirationPhoto("1677182302564-ffc6bb3252cd", 1800),
    alt: "Cannes – Yachthafen und Altstadt Suquet mit Turm",
  },
  coast: {
    url: inspirationPhoto("1703152792682-a1fe5f3dedb4", 1600),
    alt: "Küstenstrasse an der Riviera – bunte Häuser direkt am Meer",
  },
  market: {
    url: inspirationPhoto("1467003909585-2f8a72700288", 1400),
    alt: "Meeresfrüchte-Gericht – Stimmung wie Mittagessen an der Plage Keller",
  },
  mougins: {
    url: inspirationPhoto("1673423050661-134515109330", 1600),
    alt: "Hügeliges Dorf im Hinterland der Côte d'Azur – Stimmung wie Mougins",
  },
  village: {
    url: inspirationPhoto("1750850006401-5753cee77385", 1600),
    alt: "Gasse in Grimaud oder Ramatuelle – Steinmauern und Bougainvillea",
  },
  marina: {
    url: inspirationPhoto("1602419701915-77b7de4628b2", 1600),
    alt: "Port Grimaud – bunte Häuser an den Kanälen",
  },
  saintTropez: {
    url: inspirationPhoto("1662895450073-0cc13cfc562f", 1600),
    alt: "Saint-Tropez – Hafenpromenade und bunte Häuser am Wasser",
  },
  menton: {
    url: inspirationPhoto("1725522475767-2aace362f999", 1600),
    alt: "Menton – Basilika und bunte Altstadt am Hafen",
  },
} as const;

export const coteDazurPhotoUrl = {
  hero: COTE_DAZUR_PHOTOS.hero.url,
  nice: COTE_DAZUR_PHOTOS.nice.url,
  antibes: COTE_DAZUR_PHOTOS.antibes.url,
  plageKeller: COTE_DAZUR_PHOTOS.plageKeller.url,
  eze: COTE_DAZUR_PHOTOS.eze.url,
  monaco: COTE_DAZUR_PHOTOS.monaco.url,
  cannes: COTE_DAZUR_PHOTOS.cannes.url,
  coast: COTE_DAZUR_PHOTOS.coast.url,
  menton: COTE_DAZUR_PHOTOS.menton.url,
  market: COTE_DAZUR_PHOTOS.market.url,
  mougins: COTE_DAZUR_PHOTOS.mougins.url,
  village: COTE_DAZUR_PHOTOS.village.url,
  marina: COTE_DAZUR_PHOTOS.marina.url,
  saintTropez: COTE_DAZUR_PHOTOS.saintTropez.url,
};

export const coteDazurPhotoAlt = {
  hero: COTE_DAZUR_PHOTOS.hero.alt,
  nice: COTE_DAZUR_PHOTOS.nice.alt,
  antibes: COTE_DAZUR_PHOTOS.antibes.alt,
  plageKeller: COTE_DAZUR_PHOTOS.plageKeller.alt,
  eze: COTE_DAZUR_PHOTOS.eze.alt,
  monaco: COTE_DAZUR_PHOTOS.monaco.alt,
  cannes: COTE_DAZUR_PHOTOS.cannes.alt,
  coast: COTE_DAZUR_PHOTOS.coast.alt,
  menton: COTE_DAZUR_PHOTOS.menton.alt,
  market: COTE_DAZUR_PHOTOS.market.alt,
  mougins: COTE_DAZUR_PHOTOS.mougins.alt,
  village: COTE_DAZUR_PHOTOS.village.alt,
  marina: COTE_DAZUR_PHOTOS.marina.alt,
  saintTropez: COTE_DAZUR_PHOTOS.saintTropez.alt,
};

export type CoteDazurPoiCard = {
  id: string;
  name: string;
  photo: string;
  alt: string;
  caption: string;
  tip: string;
};

export const COTE_DAZUR_POI_PHOTOS: CoteDazurPoiCard[] = [
  {
    id: "nice",
    name: "Nizza · 1. Nacht",
    photo: coteDazurPhotoUrl.nice,
    alt: coteDazurPhotoAlt.nice,
    caption: "Nizza · Promenade",
    tip: "Erste Nacht nahe Nizza – Jetlag / Anreise verdauen.",
  },
  {
    id: "plage-keller",
    name: "Plage Keller · Antibes",
    photo: coteDazurPhotoUrl.plageKeller,
    alt: coteDazurPhotoAlt.plageKeller,
    caption: "Cap d'Antibes · Plage Keller",
    tip: "Mittagessen am Strand – unser Highlight bei Antibes.",
  },
  {
    id: "mougins",
    name: "Mougins",
    photo: coteDazurPhotoUrl.mougins,
    alt: coteDazurPhotoAlt.mougins,
    caption: "Mougins · 2 Nächte",
    tip: "Hotel de Mougins – oder Cannes als Alternative.",
  },
  {
    id: "cannes",
    name: "Cannes",
    photo: coteDazurPhotoUrl.cannes,
    alt: coteDazurPhotoAlt.cannes,
    caption: "Cannes · Hafen & Suquet",
    tip: "Corniche d'Or Richtung Agay – oder Croisette abends.",
  },
  {
    id: "port-grimaud",
    name: "Port Grimaud",
    photo: coteDazurPhotoUrl.marina,
    alt: coteDazurPhotoAlt.marina,
    caption: "Port Grimaud · Kanäle",
    tip: "Kanäle zu Fuss – ruhiger als St-Tropez-Hafen.",
  },
  {
    id: "ramatuelle",
    name: "Grimaud & Ramatuelle",
    photo: coteDazurPhotoUrl.village,
    alt: coteDazurPhotoAlt.village,
    caption: "Grimaud · Dorfgassen",
    tip: "2 Nächte Region St-Tropez – Dörfer statt nur Hafen.",
  },
];
