import { V2_HOW_STEPS } from "@/lib/v2HomeData";

export default function V2HowItWorks() {
  return (
    <section className="v2-section v2-section--compact bg-[var(--v2-bg-deep)]" id="so-funktionierts">
      <div className="v2-wrap">
        <h2 className="v2-display v2-display-section-sm">Von der Idee zum fertigen Reiseplan.</h2>

        <ol className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-2">
          {V2_HOW_STEPS.map((item, i) => (
            <li key={item.step} className="v2-how-step flex-1">
              <p className="text-[0.7rem] font-semibold tracking-wider text-[var(--v2-accent)]">
                {item.step}
              </p>
              <h3 className="mt-1 text-[0.98rem] font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-0.5 text-[0.85rem] leading-relaxed text-[var(--v2-muted)]">{item.text}</p>
              {i < V2_HOW_STEPS.length - 1 && (
                <span className="v2-how-arrow-mobile hidden sm:hidden" aria-hidden>↓</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
