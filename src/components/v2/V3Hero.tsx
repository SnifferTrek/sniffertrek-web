import { Check } from "lucide-react";
import { V2_DEMO_TRIP } from "@/lib/v2HomeData";
import V2DestinationForm from "./V2DestinationForm";
import V3HeroScene from "./V3HeroScene";

const TRUST_POINTS = ["Kostenlos", "Keine Registrierung", "Als PDF mitnehmen"] as const;

export default function V3Hero() {
  return (
    <section className="v2-hero v3-hero" id="hero">
      <div className="v3-hero-inner">
        <div className="v3-hero-content">
          <p className="v2-eyebrow">Dein persönlicher Reiseplaner</p>
          <h1 className="v2-display v2-display-hero mt-4">
            <span className="block">Deine ganze Reise.</span>
            <span className="block">Ein Plan.</span>
          </h1>
          <p className="v2-hero-sub">
            Route, Hotels, Flüge und Sehenswürdigkeiten – alles in deinem persönlichen Reiseplan.
          </p>

          <V2DestinationForm className="mt-6" id="hero-destination" />

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-1.5 text-sm text-[var(--v2-muted)]">
                <Check className="h-4 w-4 text-[var(--v2-accent)]" strokeWidth={2.5} aria-hidden />
                {point}
              </li>
            ))}
          </ul>

          <p className="v3-hero-route-corridor">{V2_DEMO_TRIP.corridor}</p>

          <a href="#beispiel" className="v2-hero-example-link mt-4 inline-flex">
            Beispielreise ansehen ↓
          </a>
        </div>

        <V3HeroScene />
      </div>
    </section>
  );
}
