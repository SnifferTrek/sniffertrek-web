import type { TravelReportAppleCopy } from "@/lib/travelReports/appleCopy";

export const PROVENCE_APPLE_ES: TravelReportAppleCopy = {
  metaTitle: "Ruta por la Provenza: 6 días, lugares y hoteles",
  metaDescription:
    "Ruta de 6 días por la Provenza: Aviñón, Gordes, Roussillon, Aix-en-Provence, Valensole y el Verdon. Con mapa, bases hoteleras, FAQ y plantilla del planificador.",
  breadcrumbLabel: "Ruta Provenza",
  displayTitle: "Provenza.",
  heroSubtitle: ["Seis días. Cuatro bases.", "Aviñón, ocre, Aix y Verdon."],
  heroPhotoAlt: "Paisaje de la Provenza con lavanda",
  experienceNote: "Curado por SnifferTrek · Estado de planificación agosto 2026",
  lead:
    "Una **ruta de 6 días por la Provenza** no necesita doce pueblos. Nuestra ruta une **Aviñón**, dos noches en el **Luberon**, **Aix-en-Provence** y el **Verdon**, con bases hoteleras en vez de hacer la maleta cada día.",
  closing:
    "La Provenza no gana por encadenar el mayor número de pueblos. Con cuatro bases te queda tiempo para el polvo de ocre, un mercado largo y un día en el Verdon que, si el tiempo empeora, también puede saltarse.",
  affiliateDisclosure:
    "Los enlaces de hoteles pueden ser de afiliación. Para ti el precio no cambia; SnifferTrek puede recibir una comisión.",
  transferTitle: "Coche, TGV o vuelo a Marsella",
  transferSubtitle:
    "En coche por el Luberon: puedes llegar en TGV a Aviñón o en avión a Marsella.",
  glanceTitle: "Menos pueblos. Más Provenza.",
  hotelTitle: "Cuatro bases. Cinco noches.",
  hotelSearchLabel: "Hoteles en la Provenza",
  hotelIntro: "Cuatro bases reducen los viajes de ida y vuelta y hacer la maleta cada día.",
  mapTitle: "Ruta y lugares",
  mapSubtitle:
    "Azul = ruta principal. Gris = de temporada u opcional. Toca un marcador para ver las notas.",
  journeyTitle: "La ruta",
  journeySubtitle: "5 noches. Cuatro bases. Menos maletas que paradas para fotos.",
  journeyOutro:
    "La ruta tiene unos 300 kilómetros: los días lentos importan más que la distancia.",
  journeyStops: [
    { nights: "1 noche", place: "Aviñón", note: "Historia y llegada" },
    { nights: "2 noches", place: "Gordes / Luberon", note: "Pueblos y ocre" },
    { nights: "1 noche", place: "Aix-en-Provence", note: "Mercado y casco antiguo" },
    { nights: "1 noche", place: "Moustiers", note: "Valensole y Verdon" },
  ],
  transferOptions: [
    {
      title: "Coche propio",
      body: "Flexible para el Luberon y el Verdon; cuenta aparte un trayecto largo.",
      price: "Peajes + combustible",
    },
    {
      title: "TGV hasta Aviñón",
      body: "Buen arranque sin tráfico urbano; puedes alquilar el coche en Aviñón.",
      price: "Precio según fecha",
    },
    {
      title: "Vuelo a Marsella + coche de alquiler",
      body: "Práctico para Aix y el regreso; revisa las tasas de ida.",
      price: "Precio según fecha",
    },
  ],
  mustSees: ["Aviñón", "Gordes", "Roussillon", "Aix", "Moustiers"],
  quarters: "4 bases: Aviñón · Gordes · Aix · Moustiers",
  transport: "Coche propio o de alquiler; cascos antiguos a pie",
  faqTitle: "Preguntas frecuentes sobre la ruta por la Provenza",
  faqItems: [
    {
      question: "¿Cuántos días necesitas para la Provenza?",
      answer:
        "Para Aviñón, el Luberon, Aix y el Verdon, seis días son un buen comienzo. Con cuatro días deberías dejar el Verdon; con ocho la ruta se vuelve bastante más tranquila.",
    },
    {
      question: "¿Necesitas coche en la Provenza?",
      answer:
        "Para esta ruta, sí. Aviñón y Aix se alcanzan en tren, pero los pueblos del Luberon y el Verdon se unen mucho mejor en coche.",
    },
    {
      question: "¿Cuándo florece la lavanda?",
      answer:
        "Depende de la altitud, el tiempo y la cosecha. En vez de promesas fijas, revisa las indicaciones regionales justo antes del viaje y trata Valensole solo como extra de temporada.",
      linkLabel: "Indicaciones regionales",
    },
    {
      question: "¿Dónde deberías dormir?",
      answer:
        "En esta ruta: una noche en Aviñón y otra en Aix, dos noches en el Luberon alrededor de Gordes y una noche en Moustiers-Sainte-Marie.",
    },
    {
      question: "¿Es la ruta apta con niños?",
      answer:
        "En principio sí, si las distancias diarias se quedan cortas. En los senderos de ocre, con calor y en las actividades del Verdon, ten en cuenta la edad, el tiempo y las normas de seguridad locales.",
    },
  ],
  hotelPicks: {
    avignon: {
      area: "Aviñón",
      note: "Para el arranque compacto.",
      audience: "Historia y llegada en TGV",
    },
    luberon: {
      area: "Gordes",
      note: "Dos noches para pueblos y ocre.",
      audience: "Ruta en coche",
    },
    aix: {
      area: "Aix",
      note: "Una noche de ciudad sin seguir viajando.",
      audience: "Mercado y casco antiguo",
    },
    moustiers: {
      area: "Verdon",
      note: "Para un arranque temprano en el Verdon.",
      audience: "Naturaleza y margen de tiempo",
    },
  },
  sections: {
    avignon: {
      kicker: "Día 1 · Aviñón",
      title: "Llegar detrás de la muralla",
      photoAlt: "Palacio de los Papas en Aviñón",
      photoCaption: "Aviñón · Palacio de los Papas",
      story:
        "Nosotros hemos curado esta ruta; no la presentamos como una experiencia personal in situ. Por eso volvemos a comprobar horarios y accesos siempre en las fuentes oficiales.",
      paragraphs: [
        "**Aviñón** concentra historia y trayectos cortos. Deja el coche en el hotel o en un parking fuera del casco más estrecho; el Palacio de los Papas, las plazas y la orilla del Ródano se unen a pie.",
        "Para un solo día: no intentes todas las exposiciones. Una visita principal, un paseo lento y una plaza por la noche bastan como arranque.",
      ],
      tips: [
        {
          title: "Información oficial",
          body: "Horarios, entradas e indicaciones actuales.",
          linkLabel: "Avignon Tourisme",
        },
      ],
    },
    luberon: {
      kicker: "Día 2 · Luberon",
      title: "Gordes como base, no como parada de fotos",
      photoAlt: "Pueblo de montaña de Gordes en el Luberon",
      photoCaption: "Gordes · dos noches como base tranquila",
      paragraphs: [
        "El Luberon funciona mejor con una base fija que cambiando de maleta cada día. **Gordes** es prominente y, por tanto, visitado; si sales temprano y te quedas por la noche, vives el pueblo más tranquilo.",
        "Para la segunda mitad del día elige solo un extra: Abadía de Sénanque, Bonnieux o Lacoste. Demasiados pueblos convierten el paisaje en una lista de tareas.",
      ],
    },
    ocker: {
      kicker: "Día 3 · Roussillon y Lourmarin",
      title: "Ocre por la mañana, plaza del pueblo por la noche",
      photoAlt: "Casas color ocre en Roussillon",
      photoCaption: "Roussillon · ocre en el pueblo",
      paragraphs: [
        "En **Roussillon** el color es lo primero: fachadas, tierra y el corto sendero de ocre. Ayudan los zapatos firmes; la ropa clara es poco práctica por el polvo.",
        "Después encaja **Lourmarin** como contraste al sur del Luberon. El trayecto debe formar parte del día, no ser solo el enlace entre dos puntos de foto.",
      ],
    },
    aix: {
      kicker: "Día 4 · Aix-en-Provence",
      title: "Un día de ciudad entre mercados y sombra",
      photoAlt: "Mercado en Aix-en-Provence",
      photoCaption: "Aix · mercado y pausa urbana",
      paragraphs: [
        "En **Aix-en-Provence** el coche se queda parado. Casco antiguo, mercados y plazas quedan lo bastante cerca para un día entero a pie; en verano la sombra marca el ritmo.",
        "Los lugares de Cézanne son una posible profundización, no un programa obligatorio. Si prefieres perderte por callejones, no te pierdes nada.",
      ],
      tips: [
        {
          title: "Planificar la visita",
          body: "Mercados actuales, museos y movilidad.",
          linkLabel: "Turismo de Aix",
        },
      ],
    },
    "ruhige-doerfer": {
      kicker: "Consejos ocultos · Luberon",
      title: "Goult y Saignon en vez de otra cola",
      paragraphs: [
        "**Goult** está entre Gordes y Roussillon y la oficina de turismo lo describe como «village caché». El núcleo pequeño, el camino del molino y el mercado del jueves son una alternativa cuando los pueblos con vistas más conocidos se llenan.",
        "**Saignon** encaja mejor de camino a Aix: callejones cortos, una roca con vistas y menos programa obligatorio. Ninguno de los dos es una etapa extra: elige uno, no marques los dos.",
      ],
      tips: [
        {
          title: "Goult oficial",
          body: "Pueblo, mercado e indicaciones actuales en la oficina de turismo Pays d’Apt Luberon.",
          linkLabel: "Descubrir Goult",
        },
      ],
    },
    "markt-genuss": {
      kicker: "Consejos ocultos · mercado y comida",
      title: "Meter el día de mercado en la ruta",
      paragraphs: [
        "El mejor consejo gastronómico no es un restaurante concreto, sino un **día de mercado** que encaje. En Goult el mercado es de temporada, el jueves por la mañana; en Aix hay varios mercados con días y focos distintos.",
        "Compra solo lo que puedas comer el mismo día: pan, queso, fruta y algo para el picnic. Los horarios del mercado cambian con la temporada, así que compruébalos en el ayuntamiento o en la oficina de turismo justo antes del viaje.",
      ],
      tips: [
        {
          title: "No lo vendas como secreto",
          body: "Lourmarin y Gordes son conocidos. Se pone más tranquilo por la hora, el día de la semana y un pueblo más pequeño, no por un motivo secreto de Instagram.",
        },
      ],
    },
    verdon: {
      kicker: "Días 5–6 · Valensole y Verdon",
      title: "La lavanda es de temporada. El desfiladero se queda.",
      photoAlt: "Gargantas del Verdon con un río turquesa",
      photoCaption: "Gorges du Verdon · cierre con margen de tiempo",
      paragraphs: [
        "La meseta de **Valensole** no es una promesa violeta todo el año. Fuera de la floración sigue siendo una parada de paisaje; los campos son zonas de trabajo y no se pisan para fotos.",
        "**Moustiers-Sainte-Marie** es la última base. Para el Verdon hace falta margen de tiempo: el viento, el calor, el nivel del agua y el estado de las carreteras pueden cambiar el plan.",
      ],
      tips: [
        {
          title: "Parque natural del Verdon",
          body: "Protección, acceso e indicaciones actuales.",
          linkLabel: "Parc du Verdon",
        },
      ],
    },
  },
  mapPois: {
    avignon: {
      name: "Aviñón",
      tip: "Palacio de los Papas y casco antiguo temprano o a última hora de la tarde.",
    },
    gordes: {
      name: "Gordes",
      tip: "Mirador antes del pueblo, luego a pie por las callejuelas.",
    },
    roussillon: {
      name: "Roussillon",
      tip: "Sendero de ocre con zapatos firmes; la ropa puede llenarse de polvo.",
    },
    lourmarin: {
      name: "Lourmarin",
      tip: "Parada de pueblo tranquila al sur del Luberon.",
    },
    goult: {
      name: "Goult",
      tip: "Parada más pequeña del Luberon entre Gordes y Roussillon.",
    },
    saignon: {
      name: "Saignon",
      tip: "Pueblo y roca con vistas cerca de Apt; añádelo solo si te queda tiempo.",
    },
    aix: {
      name: "Aix-en-Provence",
      tip: "Casco antiguo a pie; deja el coche fuera del centro.",
    },
    valensole: {
      name: "Valensole",
      tip: "Lavanda solo en temporada; no entres en los campos.",
    },
    moustiers: {
      name: "Moustiers-Sainte-Marie",
      tip: "Última base antes de las Gargantas del Verdon.",
    },
    verdon: {
      name: "Pont du Galetas",
      tip: "Revisa el nivel del agua, el viento y las indicaciones locales antes de las actividades.",
    },
  },
};
