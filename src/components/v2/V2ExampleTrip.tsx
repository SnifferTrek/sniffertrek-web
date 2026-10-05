import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { V2_EXAMPLE_TRIP } from "@/lib/v2HomeData";

export default function V2ExampleTrip() {
  const t = useTranslations("v2Home");
  return (
    <section className="v2-section" id="beispiel">
      <div className="v2-wrap">
        <p className="v2-eyebrow">{t("exampleEyebrow")}</p>
        <h2 className="v2-display v2-display-section mt-3">{t("exampleTitle")}</h2>

        <div className="mt-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={V2_EXAMPLE_TRIP.photo}
            alt={t("examplePhotoAlt")}
            className="v2-example-photo-lg w-full rounded-2xl object-cover"
            width={1200}
            height={800}
          />

          <div className="pb-2">
            <dl className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-xs text-[var(--v2-muted)]">{t("exampleDuration")}</dt>
                <dd className="mt-0.5 font-medium">{t("exampleNights", { count: V2_EXAMPLE_TRIP.nights })}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--v2-muted)]">{t("exampleStops")}</dt>
                <dd className="mt-0.5 font-medium">{V2_EXAMPLE_TRIP.stops}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--v2-muted)]">{t("exampleType")}</dt>
                <dd className="mt-0.5 font-medium">{t("roadtrip")}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--v2-muted)]">{t("exampleDistance")}</dt>
                <dd className="mt-0.5 font-medium">{t("exampleDistanceValue")}</dd>
              </div>
            </dl>

            <p className="mt-5 text-sm text-[var(--v2-muted)]">{t("exampleRoute")}</p>

            <ul className="mt-4 flex flex-wrap gap-2">
              {V2_EXAMPLE_TRIP.highlights.map((h) => (
                <li key={h} className="v2-chip">{h}</li>
              ))}
            </ul>

            <Link href={V2_EXAMPLE_TRIP.href} className="v2-btn mt-7">
              {t("viewTrip")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
