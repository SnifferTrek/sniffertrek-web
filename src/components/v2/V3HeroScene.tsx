import Image from "next/image";

const ROUTE_MAP = {
  src: "/images/v3/cote-dazur-route.png",
  width: 1024,
  height: 999,
  alt: "Beispielroute an der Côte d'Azur mit Nizza, Cannes und Saint-Tropez",
} as const;

export default function V3HeroScene() {
  return (
    <div className="v3-hero-scene">
      <div className="v3-hero-scene-map-wrap">
        <Image
          src={ROUTE_MAP.src}
          alt={ROUTE_MAP.alt}
          width={ROUTE_MAP.width}
          height={ROUTE_MAP.height}
          className="v3-hero-scene-map-img"
          priority
          unoptimized
          sizes="(min-width: 1024px) 58vw, 100vw"
        />
      </div>
      <div className="v3-hero-scene-fade" aria-hidden="true" />
    </div>
  );
}
