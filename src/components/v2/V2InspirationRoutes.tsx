import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { V2_IDEAS_HREF, V2_INSPIRATION } from "@/lib/v2HomeData";

export default function V2InspirationRoutes() {
  return (
    <section className="v2-section v2-section--compact bg-[var(--v2-bg-deep)]">
      <div className="v2-wrap">
        <h2 className="v2-display v2-display-section-sm">Noch kein Ziel? Lass dich inspirieren.</h2>

        <ul className="v2-inspire-row mt-8">
          {V2_INSPIRATION.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="v2-inspire-card group">
                <div className="v2-inspire-card-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.photo}
                    alt={item.photoAlt}
                    className="v2-inspire-card-img"
                    width={800}
                    height={640}
                    loading="lazy"
                  />
                </div>
                <div className="v2-inspire-card-body">
                  <h3 className="v2-inspire-card-title">{item.label}</h3>
                  <p className="v2-inspire-card-tagline">{item.tagline}</p>
                  <p className="v2-inspire-card-meta">
                    {item.duration} · {item.travelType}
                  </p>
                  <span className="v2-inspire-card-cta">Reise ansehen →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <Link href={V2_IDEAS_HREF} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--v2-accent)] hover:underline">
            Alle Reiseideen entdecken
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
