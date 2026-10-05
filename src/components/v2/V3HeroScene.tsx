import Image from "next/image";
import { useTranslations } from "next-intl";

const ROUTE_MAP = {
  src: "/images/v3/cote-dazur-route.png",
  width: 1024,
  height: 999,
} as const;

export default function V3HeroScene() {
  const t = useTranslations("v2Home");
  return (
    <div className="v3-hero-scene">
      <div className="v3-hero-scene-map-wrap">
        <Image
          src={ROUTE_MAP.src}
          alt={t("mapAlt")}
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
