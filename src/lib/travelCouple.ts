/** Fiktives Reisepaar – keine echte Person, kein Wohnort. */

/** Visuelle Referenz (KI): bewusst unauffällig, keine Promi-Ähnlichkeit. */
export const TRAVEL_COUPLE_LOOK = {
 anna: "Hellbraune Haare, ohne Brille, Teal-Mantel",
 thomas: "Volles dunkelbraunes Haar vorne, ohne Brille, kein Bart",
} as const;

export const TRAVEL_COUPLE = {
 herName: "Anna",
 hisName: "Thomas",
 displayName: "Anna & Thomas",
 tagline: "Reisetipps, die wir selbst ausprobieren würden",
 intro:
 "Wir sind Anna und Thomas – eine erfundene Stimme hinter SnifferTrek. Kein Nachname, kein fester Wohnort: nur ehrliche Tipps von unterwegs.",
 voice: "«Lieber eine Gasse tiefer als den vollen Platz.»",
 disclaimer:
 "Anna und Thomas sind fiktive Figuren. Porträts sind KI-generiert und zeigen keine reale Person.",
} as const;

/** Regeln für KI- oder Stock-Fotos mit Anna & Thomas in Reiseberichten. */
export const COUPLE_DEPICTION_RULES = {
 noFrontView: "Nicht von vorne abbilden – immer Rücken oder Seitenprofil.",
 seating:
 "Keine Bank: am Canalrand auf dem Boden sitzen, von hinten, Blick aufs Wasser.",
 background: "Nur echter Ort (z. B. Venedig-Lagune) – kein generischer Strand oder falsche Skyline.",
 reportsFallback:
 "In Berichten lieber Unsplash-Stimmungsfoto vom Ort statt falsches KI-Paar.",
} as const;

export const COUPLE_PHOTOS = {
 hero: "/couple/anna-thomas-together-v4.jpg",
 anna: "/couple/anna-portrait-v4.jpg",
 thomas: "/couple/thomas-portrait-v4.jpg",
 candid: "/couple/anna-thomas-candid-v4.jpg",
 /** Venedig · Zattere/Dorsoduro – von hinten, Blick Richtung San Marco */
 veniceCanalBack: "/couple/anna-thomas-canal-san-marco-back-v1.jpg",
} as const;
