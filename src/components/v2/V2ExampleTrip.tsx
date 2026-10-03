import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { V2_EXAMPLE_TRIP } from "@/lib/v2HomeData";

export default function V2ExampleTrip() {
  return (
    <section className="v2-section" id="beispiel">
      <div className="v2-wrap">
        <p className="v2-eyebrow">Echte Reise. Echter Plan.</p>
        <h2 className="v2-display v2-display-section mt-3">Ein paar Tage Côte d&apos;Azur?</h2>

        <div className="mt-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={V2_EXAMPLE_TRIP.photo}
            alt={V2_EXAMPLE_TRIP.photoAlt}
            className="v2-example-photo-lg w-full rounded-2xl object-cover"
            width={1200}
            height={800}
          />

          <div className="pb-2">
            <dl className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-[var(--v2-muted)]">Dauer</dt>
                <dd className="mt-0.5 font-medium">{V2_EXAMPLE_TRIP.nights} Nächte</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--v2-muted)]">Stopps</dt>
                <dd className="mt-0.5 font-medium">{V2_EXAMPLE_TRIP.stops}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--v2-muted)]">Art</dt>
                <dd className="mt-0.5 font-medium">{V2_EXAMPLE_TRIP.travelType}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--v2-muted)]">Distanz</dt>
                <dd className="mt-0.5 font-medium">{V2_EXAMPLE_TRIP.distance}</dd>
              </div>
            </dl>

            <p className="mt-5 text-sm text-[var(--v2-muted)]">{V2_EXAMPLE_TRIP.route}</p>

            <ul className="mt-4 flex flex-wrap gap-2">
              {V2_EXAMPLE_TRIP.highlights.map((h) => (
                <li key={h} className="v2-chip">{h}</li>
              ))}
            </ul>

            <Link href={V2_EXAMPLE_TRIP.href} className="v2-btn mt-7">
              Reise ansehen
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
