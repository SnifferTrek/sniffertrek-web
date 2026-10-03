import { V2_PROBLEM_SOURCES } from "@/lib/v2HomeData";

export default function V2ProblemSolution() {
  return (
    <section className="v2-section v2-section--compact">
      <div className="v2-wrap v2-problem-band">
        <h2 className="v2-display v2-display-section-sm">
          Reisen planen sollte nicht 15 offene Tabs brauchen.
        </h2>
        <p className="mt-2 text-[0.98rem] text-[var(--v2-muted)]">
          Alles, was zu deiner Reise gehört, an einem Ort.
        </p>
        <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-5">
          <div className="flex flex-wrap justify-center gap-2">
            {V2_PROBLEM_SOURCES.map((label) => (
              <span key={label} className="v2-problem-pill">{label}</span>
            ))}
          </div>
          <span className="text-lg text-[var(--v2-muted)]" aria-hidden>↓</span>
          <p className="text-[1rem] font-semibold tracking-tight">Dein SnifferTrek</p>
        </div>
      </div>
    </section>
  );
}
