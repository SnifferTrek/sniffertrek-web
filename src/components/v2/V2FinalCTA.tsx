import { useTranslations } from "next-intl";
import V2DestinationForm from "./V2DestinationForm";

export default function V2FinalCTA() {
  const t = useTranslations("v2Home");
  return (
    <section className="v2-final-cta">
      <div className="v2-wrap text-center">
        <h2 className="v2-display v2-display-section">{t("finalTitle")}</h2>

        <V2DestinationForm
          className="mx-auto mt-8 max-w-xl"
          id="final-destination"
          hideLabel
          label={t("formShortLabel")}
        />

        <p className="mt-4 text-sm text-[var(--v2-muted)]">{t("finalTrust")}</p>
      </div>
    </section>
  );
}
