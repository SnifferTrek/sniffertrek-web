import { V2_PRODUCT_DETAILS } from "@/lib/v2HomeData";

export default function V2ProductShow() {
  return (
    <section className="v2-section v2-section--compact">
      <div className="v2-wrap">
        <h2 className="v2-display v2-display-section-sm">Alles, was du für deine Reise brauchst.</h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {V2_PRODUCT_DETAILS.map((block) => (
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
