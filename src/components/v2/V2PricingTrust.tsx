import { useTranslations } from "next-intl";

export default function V2PricingTrust() {
  const t = useTranslations("v2Home");
  return (
    <section className="v2-section v2-section--compact border-y border-[var(--v2-line)]">
      <div className="v2-wrap max-w-2xl text-center">
        <h2 className="v2-display v2-display-section-sm">{t("pricingTitle")}</h2>
        <p className="mx-auto mt-4 text-[0.98rem] leading-relaxed text-[var(--v2-muted)]">
          {t("pricingText")}
        </p>
      </div>
    </section>
  );
}
