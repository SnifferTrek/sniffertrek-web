"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function ExampleTrips() {
  const t = useTranslations("home");

  const trips = [
    {
      title: t("tripSouthFrance"),
      route: "Zürich → Côte d'Azur → Provence → Zürich",
      days: 14,
      tags: ["Auto", "Hotels", "POIs", "2'340 km"],
      img: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&q=80",
      href: "/reisebericht/cote-dazur",
    },
    {
      title: t("tripItaly"),
      route: "Cinque Terre → Rom → Amalfi → Venedig",
      days: 10,
      tags: ["Zug", "Hotels", "Bucket List", "1'800 km"],
      img: "https://images.unsplash.com/photo-1534008897995-27a23e859048?w=800&q=80",
      href: "/reisebericht/cinque-terre",
    },
    {
      title: t("tripIberia"),
      route: "Barcelona → Madrid → Lissabon → Porto",
      days: 21,
      tags: ["Auto", "Flug", "Hotels", "3'100 km"],
      img: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
      href: "/reisebericht/barcelona",
    },
  ] as const;

  return (
    <section className="bcn-apple">
      <div className="bcn-apple-band bcn-apple-band--soft">
        <p className="bcn-apple-eyebrow bcn-apple-eyebrow--dark">{t("popularEyebrow")}</p>
        <h2 className="bcn-apple-h2">{t("popularTitle")}</h2>
        <p className="bcn-apple-sub">{t("popularSubtitle")}</p>
        <ul className="st-apple-hub__grid" style={{ marginTop: "2.5rem" }}>
          {trips.map((trip) => (
            <li key={trip.href}>
              <Link href={trip.href} className="st-apple-hub__card">
                <div className="st-apple-hub__media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={trip.img} alt={trip.title} loading="lazy" />
                  <span className="st-apple-hub__badge">{t("days", { count: trip.days })}</span>
                </div>
                <div className="st-apple-hub__body">
                  <h3 className="st-apple-hub__name">{trip.title}</h3>
                  <p className="st-apple-hub__text">{trip.route}</p>
                  <p className="st-apple-hub__text" style={{ marginTop: "0.65rem", fontSize: "0.8rem" }}>
                    {trip.tags.join(" · ")}
                  </p>
                  <span className="st-apple-hub__cta">{t("learnMore")}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
