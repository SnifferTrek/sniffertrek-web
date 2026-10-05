import { useTranslations } from "next-intl";

export default function V2ProblemSolution() {
  const t = useTranslations("v2Home");
  const sources = [
    t("sourceRoute"),
    t("sourceHotels"),
    t("sourceFlights"),
    t("sourceNotes"),
    t("sourcePlaces"),
  ];

  return (
    <section className="v2-section v2-section--compact">
      <div className="v2-wrap v2-problem-band">
        <h2 className="v2-display v2-display-section-sm">{t("problemTitle")}</h2>
        <p className="mt-2 text-[0.98rem] text-[var(--v2-muted)]">{t("problemSub")}</p>
        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-5">
          <div className="flex flex-wrap justify-center gap-2">
            {sources.map((label) => (
              <span key={label} className="v2-problem-pill">{label}</span>
            ))}
          </div>
          <span className="text-lg text-[var(--v2-muted)]" aria-hidden>↓</span>
          <p className="text-[1rem] font-semibold tracking-tight">{t("problemResult")}</p>
        </div>
      </div>
    </section>
  );
}
