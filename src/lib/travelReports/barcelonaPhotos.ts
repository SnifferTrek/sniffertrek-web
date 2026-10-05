import { inspirationPhoto } from "@/lib/inspirationDestinations";

/**
 * Verifizierte Unsplash-Fotos (HTTP 200 + Motiv geprüft, Stand Juli 2026).
 * Keine Platzhalter-IDs – jedes Motiv passt zum Abschnitt.
 */
export const BARCELONA_PHOTOS = {
  hero: {
    url: inspirationPhoto("1583422409516-2895a77efded", 2000),
    alt: "Barcelona von oben – Sagrada Família im Eixample-Raster",
  },
  sagrada: {
    url: inspirationPhoto("1722863380905-539ae092fc5f", 1800),
    alt: "Sagrada Família – Türme durch Bäume",
  },
  sagradaSunset: {
    url: inspirationPhoto("1578095172812-dcc191c5aed8", 1800),
    alt: "Sagrada Família bei Sonnenuntergang über den Dächern",
  },
  parkGuell: {
    url: inspirationPhoto("1523531294919-4bcd7c65e216", 1800),
    alt: "Park Güell – Eingangspavillons und Blick zum Meer",
  },
  parkGuellBench: {
    url: inspirationPhoto("1544918877-460635b6d13e", 1600),
    alt: "Park Güell – Mosaikbank und Stadtpanorama",
  },
  gothic: {
    url: inspirationPhoto("1562861844-763c4ae2e696", 1800),
    alt: "Pont del Bisbe – Gasse im Barri Gòtic",
  },
  cathedral: {
    url: inspirationPhoto("1569530593429-de9d9e646a6f", 1800),
    alt: "Kathedrale von Barcelona am Pla de la Seu",
  },
  alley: {
    url: inspirationPhoto("1508939546992-1252a12b4299", 1600),
    alt: "Enge Gasse im historischen Zentrum von Barcelona",
  },
  batllo: {
    url: inspirationPhoto("1587043211963-0352f1528f6a", 1800),
    alt: "Casa Batlló – Fassade am Passeig de Gràcia",
  },
  pedrera: {
    url: inspirationPhoto("1558442240-6b455d590e15", 1800),
    alt: "Casa Milà · La Pedrera – wellenförmige Fassade",
  },
  barceloneta: {
    url: inspirationPhoto("1534001265532-393289eb8ed3", 1800),
    alt: "Barceloneta – Promenade, Palmen und Mittelmeer",
  },
  harbor: {
    url: inspirationPhoto("1603884969715-09a8b88e853c", 1600),
    alt: "Port Vell – Segelboote im Hafen von Barcelona",
  },
  born: {
    url: inspirationPhoto("1518474436123-0e44861523f7", 1600),
    alt: "Santa Maria del Mar – Turm im El Born",
  },
  boqueria: {
    url: inspirationPhoto("1547398847-19d7560a6257", 1600),
    alt: "Markt-Süßwaren – Stimmung wie an der Boquería",
  },
  tapas: {
    url: inspirationPhoto("1614126805335-80140f0107d6", 1600),
    alt: "Tapas und Pan con Tomate in Barcelona",
  },
  montjuic: {
    url: inspirationPhoto("1578853031105-8025ec148ce8", 1800),
    alt: "Montjuïc – Magic Fountain und Palau Nacional",
  },
  cityView: {
    url: inspirationPhoto("1577264940948-8e4de22849b7", 1800),
    alt: "Blick über Barcelona zum Meer mit Sagrada Família",
  },
  eixample: {
    url: inspirationPhoto("1571557750012-ea435944d011", 1600),
    alt: "Boulevard im Eixample mit Platanen",
  },
} as const;

export type BarcelonaPoiCard = {
  id: string;
  caption: string;
  photo: string;
  alt: string;
  tip: string;
};

export const BARCELONA_POI_PHOTOS: BarcelonaPoiCard[] = [
  {
    id: "sagrada",
    caption: "Sagrada Família",
    photo: BARCELONA_PHOTOS.sagrada.url,
    alt: BARCELONA_PHOTOS.sagrada.alt,
    tip: "Zeitfenster online buchen – ohne Ticket keine Chance.",
  },
  {
    id: "park-guell",
    caption: "Park Güell",
    photo: BARCELONA_PHOTOS.parkGuell.url,
    alt: BARCELONA_PHOTOS.parkGuell.alt,
    tip: "Erster Slot morgens – danach wird es eng auf der Mosaikbank.",
  },
  {
    id: "gothic",
    caption: "Barri Gòtic",
    photo: BARCELONA_PHOTOS.gothic.url,
    alt: BARCELONA_PHOTOS.gothic.alt,
    tip: "Kathedrale früh, Plaça del Rei vor den Gruppen.",
  },
  {
    id: "batllo",
    caption: "Casa Batlló",
    photo: BARCELONA_PHOTOS.batllo.url,
    alt: BARCELONA_PHOTOS.batllo.alt,
    tip: "Aussen reicht oft – innen nur mit Zeitfenster und Budget.",
  },
  {
    id: "boqueria",
    caption: "Mercat de la Boquería",
    photo: BARCELONA_PHOTOS.boqueria.url,
    alt: BARCELONA_PHOTOS.boqueria.alt,
    tip: "Vor neun Uhr echtes Barcelona – danach Touristenkegel.",
  },
  {
    id: "picasso",
    caption: "Museu Picasso · El Born",
    photo: BARCELONA_PHOTOS.born.url,
    alt: BARCELONA_PHOTOS.born.alt,
    tip: "Online-Ticket – mittags voll, morgens ruhiger.",
  },
  {
    id: "barceloneta",
    caption: "Barceloneta & Hafen",
    photo: BARCELONA_PHOTOS.barceloneta.url,
    alt: BARCELONA_PHOTOS.barceloneta.alt,
    tip: "Strand am Nachmittag, Abendessen eine Gasse landeinwärts.",
  },
  {
    id: "montjuic",
    caption: "Montjuïc",
    photo: BARCELONA_PHOTOS.montjuic.url,
    alt: BARCELONA_PHOTOS.montjuic.alt,
    tip: "Magic Fountain + Palau Nacional – Regen-Plan B: Miró.",
  },
];

export const barcelonaPhotoUrl = {
  hero: BARCELONA_PHOTOS.hero.url,
  sagrada: BARCELONA_PHOTOS.sagrada.url,
  sagradaSunset: BARCELONA_PHOTOS.sagradaSunset.url,
  parkGuell: BARCELONA_PHOTOS.parkGuell.url,
  parkGuellBench: BARCELONA_PHOTOS.parkGuellBench.url,
  gothic: BARCELONA_PHOTOS.gothic.url,
  cathedral: BARCELONA_PHOTOS.cathedral.url,
  alley: BARCELONA_PHOTOS.alley.url,
  batllo: BARCELONA_PHOTOS.batllo.url,
  passeig: BARCELONA_PHOTOS.batllo.url,
  pedrera: BARCELONA_PHOTOS.pedrera.url,
  barceloneta: BARCELONA_PHOTOS.barceloneta.url,
  harbor: BARCELONA_PHOTOS.harbor.url,
  born: BARCELONA_PHOTOS.born.url,
  boqueria: BARCELONA_PHOTOS.boqueria.url,
  tapas: BARCELONA_PHOTOS.tapas.url,
  montjuic: BARCELONA_PHOTOS.montjuic.url,
  gracia: BARCELONA_PHOTOS.cityView.url,
  cityView: BARCELONA_PHOTOS.cityView.url,
  eixample: BARCELONA_PHOTOS.eixample.url,
} as const;

export const barcelonaPhotoAlt = {
  hero: BARCELONA_PHOTOS.hero.alt,
  sagrada: BARCELONA_PHOTOS.sagrada.alt,
  sagradaSunset: BARCELONA_PHOTOS.sagradaSunset.alt,
  parkGuell: BARCELONA_PHOTOS.parkGuell.alt,
  parkGuellBench: BARCELONA_PHOTOS.parkGuellBench.alt,
  gothic: BARCELONA_PHOTOS.gothic.alt,
  cathedral: BARCELONA_PHOTOS.cathedral.alt,
  alley: BARCELONA_PHOTOS.alley.alt,
  batllo: BARCELONA_PHOTOS.batllo.alt,
  passeig: BARCELONA_PHOTOS.batllo.alt,
  pedrera: BARCELONA_PHOTOS.pedrera.alt,
  barceloneta: BARCELONA_PHOTOS.barceloneta.alt,
  harbor: BARCELONA_PHOTOS.harbor.alt,
  born: BARCELONA_PHOTOS.born.alt,
  boqueria: BARCELONA_PHOTOS.boqueria.alt,
  tapas: BARCELONA_PHOTOS.tapas.alt,
  montjuic: BARCELONA_PHOTOS.montjuic.alt,
  gracia: BARCELONA_PHOTOS.cityView.alt,
  cityView: BARCELONA_PHOTOS.cityView.alt,
  eixample: BARCELONA_PHOTOS.eixample.alt,
} as const;
