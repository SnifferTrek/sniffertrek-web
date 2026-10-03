import { TRAVEL_VOICES } from "@/lib/travelVoices";

export default function V2TravelVoices() {
  return (
    <section className="v2-section v2-section--compact">
      <div className="v2-wrap">
        <p className="v2-eyebrow">Unterwegs mit SnifferTrek</p>
        <h2 className="v2-display v2-display-section-sm mt-3">Reisen, die Geschichten erzählen.</h2>
        <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-[var(--v2-muted)]">
          Unsere Reiseberichte begleiten unterschiedliche Reisende auf ihren Touren – mit persönlichen
          Eindrücken, Lieblingsorten und Erfahrungen entlang der Route.
        </p>

        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TRAVEL_VOICES.map((voice) => (
            <li key={voice.id} className="v2-voice-card">
              {voice.image && (
                <div className="v2-voice-card-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={voice.image} alt="" className="h-full w-full object-cover" width={400} height={320} />
                </div>
              )}
              <div className="v2-voice-card-body">
                <p className="text-[1.05rem] font-semibold tracking-tight">{voice.name}</p>
                {voice.trips && voice.trips.length > 0 && (
                  <p className="mt-1 text-sm text-[var(--v2-muted)]">{voice.trips.join(" · ")}</p>
                )}
                {voice.quote && (
                  <blockquote className="mt-4 text-[0.95rem] font-medium leading-snug text-[var(--v2-ink)]">
                    {voice.quote}
                  </blockquote>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
