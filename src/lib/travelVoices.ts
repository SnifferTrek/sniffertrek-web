import { COUPLE_PHOTOS, TRAVEL_COUPLE } from "@/lib/travelCouple";

export type TravelVoice = {
  id: string;
  name: string;
  image?: string;
  tagline?: string;
  quote?: string;
  trips?: string[];
};

/** Redaktionelle Reisestimmen – erweiterbar (z. B. Bernd & Frida). */
export const TRAVEL_VOICES: TravelVoice[] = [
  {
    id: "anna-thomas",
    name: TRAVEL_COUPLE.displayName,
    image: COUPLE_PHOTOS.candid,
    tagline: TRAVEL_COUPLE.tagline,
    quote: TRAVEL_COUPLE.voice,
    trips: ["Côte d'Azur", "Provence", "Venedig"],
  },
];
