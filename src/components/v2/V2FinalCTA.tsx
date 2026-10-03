import V2DestinationForm from "./V2DestinationForm";

const TRUST = "Kostenlos · Keine Registrierung";

export default function V2FinalCTA() {
  return (
    <section className="v2-final-cta">
      <div className="v2-wrap text-center">
        <h2 className="v2-display v2-display-section">Wohin geht deine nächste Reise?</h2>

        <V2DestinationForm
          className="mx-auto mt-8 max-w-xl"
          id="final-destination"
          hideLabel
          label="Reiseziel"
          placeholder="z.B. Sardinien, Südfrankreich oder Japan"
        />

        <p className="mt-4 text-sm text-[var(--v2-muted)]">{TRUST}</p>
      </div>
    </section>
  );
}
