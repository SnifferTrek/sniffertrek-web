import { useTranslations } from "next-intl";

export default function V2ProductShow() {
  const t = useTranslations("v2Home");
  const blocks = [
    { title: t("productRoute"), lines: [t("exampleRoute")] },
    { title: t("productStays"), lines: [t("productNice"), t("productNights2")] },
    { title: t("productPlaces"), lines: ["Cours Saleya", "Èze", "Promenade des Anglais"] },
    { title: t("productPlan"), lines: [t("productNights5"), t("productStops4"), "PDF"] },
  ];

  return (
    <section className="v2-section v2-section--compact">
      <div className="v2-wrap">
        <h2 className="v2-display v2-display-section-sm">{t("productTitle")}</h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {blocks.map((block) => (
            <div key={block.title} className="v2-product-block">
              <p className="v2-product-block-title">{block.title}</p>
              <ul className="mt-3 space-y-1">
                {block.lines.map((line) => (
                  <li key={line} className="text-[0.92rem] leading-snug text-[var(--v2-ink)]">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
