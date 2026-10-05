import { COUPLE_PHOTOS, TRAVEL_COUPLE } from "@/lib/travelCouple";

export type TravelVoice = {
  id: string;
  name: string;
  image?: string;
  tagline?: string;
  quote?: string;
  /** Übersetzungsschlüssel im Namespace `home`; hat Vorrang vor `quote`. */
  quoteKey?: "coupleVoice";
  trips?: string[];
  /** Slugs aus dem Namespace `reports`; haben Vorrang vor `trips`. */
  tripSlugs?: ("venedig" | "cinque-terre" | "barcelona" | "cote-dazur" | "provence" | "grandes-alpes")[];
};

/** Redaktionelle Reisestimmen – erweiterbar (z. B. Bernd & Frida). */
export const TRAVEL_VOICES: TravelVoice[] = [
  {
    id: "anna-thomas",
    name: TRAVEL_COUPLE.displayName,
    image: COUPLE_PHOTOS.candid,
    tagline: TRAVEL_COUPLE.tagline,
    quote: TRAVEL_COUPLE.voice,
    quoteKey: "coupleVoice",
    trips: ["Côte d'Azur", "Provence", "Venedig"],
    tripSlugs: ["cote-dazur", "provence", "venedig"],
  },
];
