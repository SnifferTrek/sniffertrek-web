"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getInspirationDestinations } from "@/lib/inspirationDestinations";

export default function InspirationTicker() {
  const t = useTranslations("home");
  const locale = useLocale();
  const destinations = getInspirationDestinations(locale);
  const doubled = [...destinations, ...destinations];

  return (
    <section className="bcn-apple">
      <div className="bcn-apple-band bcn-apple-band--white" style={{ paddingTop: "3rem", paddingBottom: "3rem" }}>
        <p className="bcn-apple-eyebrow bcn-apple-eyebrow--dark" style={{ textAlign: "center" }}>
          {t("tickerEyebrow")}
        </p>
        <div className="info-apple-partners" style={{ marginTop: "1.5rem" }}>
          <div
            className="info-apple-partners__fade info-apple-partners__fade--left"
            style={{ background: "linear-gradient(to right, #fff, transparent)" }}
          />
          <div
            className="info-apple-partners__fade info-apple-partners__fade--right"
            style={{ background: "linear-gradient(to left, #fff, transparent)" }}
          />
          <div className="flex gap-6 animate-scroll-destinations w-max">
            {doubled.map((d, i) => {
              const href =
                d.slug === "venedig"
                  ? "/reisebericht/venedig"
                  : d.slug === "cinque-terre"
                    ? "/reisebericht/cinque-terre"
                    : d.slug === "cote-dazur"
                      ? "/reisebericht/cote-dazur"
                      : d.slug === "barcelona"
                        ? "/reisebericht/barcelona"
                        : d.slug === "grandes-alpes"
                          ? "/reisebericht/grandes-alpes"
                          : `/inspiration/${d.slug}`;
              return (
                <Link
                  key={`${d.slug}-${i}`}
                  href={href}
                  className="flex-shrink-0 text-center group rounded-full outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--bcn-blue)]"
                >
                  <div className="w-[110px] h-[110px] rounded-full overflow-hidden mx-auto shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition duration-300 group-hover:scale-[1.04]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={d.img}
                      alt={d.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="mt-2.5 text-xs font-semibold text-[var(--bcn-black)] group-hover:text-[var(--bcn-blue)] transition-colors">
                    {d.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
