import { useTranslations } from "next-intl";

export default function V2HowItWorks() {
  const t = useTranslations("v2Home");
  const steps = [
    { step: "01", title: t("step1Title"), text: t("step1Text") },
    { step: "02", title: t("step2Title"), text: t("step2Text") },
    { step: "03", title: t("step3Title"), text: t("step3Text") },
  ];

  return (
    <section className="v2-section v2-section--compact bg-[var(--v2-bg-deep)]" id="so-funktionierts">
      <div className="v2-wrap">
        <h2 className="v2-display v2-display-section-sm">{t("howTitle")}</h2>

        <ol className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-2">
          {steps.map((item, i) => (
            <li key={item.step} className="v2-how-step flex-1">
              <p className="text-[0.7rem] font-semibold tracking-wider text-[var(--v2-accent)]">
                {item.step}
              </p>
              <h3 className="mt-1 text-[0.98rem] font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-0.5 text-[0.85rem] leading-relaxed text-[var(--v2-muted)]">{item.text}</p>
              {i < steps.length - 1 && (
                <span className="v2-how-arrow-mobile hidden sm:hidden" aria-hidden>↓</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
