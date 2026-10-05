import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import V2DestinationForm from "./V2DestinationForm";
import V3HeroScene from "./V3HeroScene";

export default function V3Hero() {
  const t = useTranslations("v2Home");
  const trustPoints = [t("trustFree"), t("trustNoSignup"), t("trustPdf")];

  return (
    <section className="v2-hero v3-hero" id="hero">
      <div className="v3-hero-inner">
        <div className="v3-hero-content">
          <p className="v2-eyebrow">{t("heroEyebrow")}</p>
          <h1 className="v2-display v2-display-hero mt-4">
            <span className="block">{t("heroTitle1")}</span>
            <span className="block">{t("heroTitle2")}</span>
          </h1>
          <p className="v2-hero-sub">{t("heroSub")}</p>

          <V2DestinationForm className="mt-6" id="hero-destination" />

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-center gap-1.5 text-sm text-[var(--v2-muted)]">
                <Check className="h-4 w-4 text-[var(--v2-accent)]" strokeWidth={2.5} aria-hidden />
                {point}
              </li>
            ))}
          </ul>

          <div className="v3-hero-example">
            <p className="v3-hero-example-label">{t("exampleLabel")}</p>
            <p className="v3-hero-example-route">{t("exampleRoute")}</p>
            <a href="#beispiel" className="v3-hero-example-link">
              {t("exampleScroll")}
            </a>
          </div>
        </div>

        <V3HeroScene />
      </div>
    </section>
  );
}
