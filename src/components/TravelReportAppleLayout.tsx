"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { buildBookingHotelLink } from "@/lib/affiliateLinks";
import { Link } from "@/i18n/navigation";

export type TravelReportAppleViewModel = {
  displayTitle: string;
  heroSubtitle: readonly [string, string?];
  lead: string;
  closing: string;
  experienceNote: string;
  heroPhoto: string;
  heroPhotoAlt: string;
  affiliateDisclosure: string;
  planerHref: string;
  hotelIntro: string;
  hotelTitle: string;
  hotelSearchLabel: string;
  hotelDestination: string;
  hotelCheckIn: string;
  hotelCheckOut: string;
  bookingClickRef: string;
  hotelPicks: readonly {
    id: string;
    name: string;
    stars: string;
    area: string;
    note: string;
    audience?: string;
    href: string;
  }[];
  journeyTitle: string;
  journeySubtitle: string;
  journeyOutro?: string;
  journeyStops: readonly { nights: string; place: string; note: string }[];
  transferTitle: string;
  transferSubtitle: string;
  transferOptions: readonly {
    title: string;
    body: string;
    price: string;
    href?: string;
    linkLabel?: string;
    secondaryHref?: string;
    secondaryLinkLabel?: string;
  }[];
  mustSees: readonly string[];
  glanceTitle: string;
  quarters: string;
  transport: string;
  map: ReactNode;
  mapTitle: string;
  mapSubtitle: string;
  faqTitle: string;
  faqItems: readonly {
    question: string;
    answer: string;
    href?: string;
    linkLabel?: string;
  }[];
  inspirationHref: string;
  storySections: readonly {
    id: string;
    kicker?: string;
    title: string;
    paragraphs: readonly string[];
    story?: string;
    photo?: string;
    photoAlt?: string;
    photoCaption?: string;
    bookLinks?: readonly {
      title: string;
      body?: string;
      href: string;
      linkLabel: string;
    }[];
  }[];
};

type Props = {
  model: TravelReportAppleViewModel;
};

function stripMd(text: string): string {
  return text.replace(/\*\*/g, "");
}

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("bcn-apple-reveal--in");
          io.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`bcn-apple-reveal ${className}`}>
      {children}
    </div>
  );
}

function ExtLink({
  href,
  children,
  className = "bcn-apple-link",
  sponsored = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  sponsored?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel={sponsored ? "noopener noreferrer sponsored" : "noopener noreferrer"}
      className={className}
    >
      {children}
    </a>
  );
}

export default function TravelReportAppleLayout({ model }: Props) {
  const t = useTranslations("reportUi");
  const bookingHref = buildBookingHotelLink({
    destination: model.hotelDestination,
    checkIn: model.hotelCheckIn,
    checkOut: model.hotelCheckOut,
    travelers: 2,
    rooms: 1,
    clickRef: model.bookingClickRef,
  });

  return (
    <div className="bcn-apple">
      <header className="bcn-apple-hero">
        <div className="bcn-apple-hero__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={model.heroPhoto}
            alt={model.heroPhotoAlt}
            className="bcn-apple-hero__img"
            fetchPriority="high"
          />
          <div className="bcn-apple-hero__veil" />
        </div>
        <div className="bcn-apple-hero__copy">
          <p className="bcn-apple-eyebrow">SnifferTrek</p>
          <h1 className="bcn-apple-display">{model.displayTitle}</h1>
          <p className="bcn-apple-hero__sub">
            {model.heroSubtitle[0]}
            {model.heroSubtitle[1] ? (
              <>
                <br />
                {model.heroSubtitle[1]}
              </>
            ) : null}
          </p>
          <div className="bcn-apple-hero__cta">
            <a href="#route" className="bcn-apple-btn bcn-apple-btn--light">
              {t("viewRoute")}
            </a>
            <a
              href={bookingHref}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="bcn-apple-btn bcn-apple-btn--ghost"
            >
              {t("hotelsBooking")}
            </a>
          </div>
        </div>
        <p className="bcn-apple-hero__meta">{model.experienceNote}</p>
      </header>

      <section className="bcn-apple-band bcn-apple-band--white">
        <Reveal>
          <p className="bcn-apple-lead">{stripMd(model.lead)}</p>
        </Reveal>
      </section>

      <section id="route" className="bcn-apple-band bcn-apple-band--soft scroll-mt-20">
        <Reveal>
          <p className="bcn-apple-eyebrow bcn-apple-eyebrow--dark">{t("routeEyebrow")}</p>
          <h2 className="bcn-apple-h2">{model.journeyTitle}</h2>
          <p className="bcn-apple-sub">{model.journeySubtitle}</p>
        </Reveal>
        <ol className="bcn-apple-days">
          {model.journeyStops.map((stop, i) => (
            <li key={`${stop.place}-${i}`} className="bcn-apple-day">
              <Reveal>
                <span className="bcn-apple-day__n">{stop.nights}</span>
                <h3 className="bcn-apple-day__place">{stop.place}</h3>
                <p className="bcn-apple-day__note">{stop.note}</p>
              </Reveal>
            </li>
          ))}
        </ol>
        {model.journeyOutro ? (
          <p className="bcn-apple-outro">{model.journeyOutro}</p>
        ) : null}
      </section>

      <section id="anreise" className="bcn-apple-band bcn-apple-band--white scroll-mt-20">
        <Reveal>
          <p className="bcn-apple-eyebrow bcn-apple-eyebrow--dark">{t("arrivalEyebrow")}</p>
          <h2 className="bcn-apple-h2">{model.transferTitle}</h2>
          <p className="bcn-apple-sub">{model.transferSubtitle}</p>
        </Reveal>
        <ul className="bcn-apple-days bcn-apple-transfer">
          {model.transferOptions.map((opt) => (
            <li key={opt.title} className="bcn-apple-day">
              <Reveal>
                <h3 className="bcn-apple-day__place">{opt.title}</h3>
                <p className="bcn-apple-day__note">{opt.body}</p>
                <p className="bcn-apple-day__price">{opt.price}</p>
                {(opt.href && opt.linkLabel) ||
                (opt.secondaryHref && opt.secondaryLinkLabel) ? (
                  <p className="bcn-apple-book-row">
                    {opt.href && opt.linkLabel ? (
                      <ExtLink href={opt.href}>{opt.linkLabel}</ExtLink>
                    ) : null}
                    {opt.secondaryHref && opt.secondaryLinkLabel ? (
                      <ExtLink href={opt.secondaryHref}>
                        {opt.secondaryLinkLabel}
                      </ExtLink>
                    ) : null}
                  </p>
                ) : null}
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {model.storySections.map((section, idx) => {
        const dark = idx % 2 === 0;
        return (
          <section
            key={section.id}
            id={section.id}
            className={`bcn-apple-story ${dark ? "bcn-apple-story--dark" : "bcn-apple-story--light"}`}
          >
            <div className="bcn-apple-story__copy">
              <Reveal>
                {section.kicker ? (
                  <p
                    className={`bcn-apple-eyebrow ${dark ? "" : "bcn-apple-eyebrow--dark"}`}
                  >
                    {section.kicker}
                  </p>
                ) : null}
                <h2 className="bcn-apple-h2">{section.title}</h2>
                <p className="bcn-apple-body">
                  {stripMd(section.paragraphs[0] ?? "")}
                </p>
                {section.paragraphs[1] ? (
                  <p className="bcn-apple-body bcn-apple-body--muted">
                    {stripMd(section.paragraphs[1])}
                  </p>
                ) : null}
                {section.story ? (
                  <p className="bcn-apple-quote">{stripMd(section.story)}</p>
                ) : null}
                {section.bookLinks && section.bookLinks.length > 0 ? (
                  <ul className="bcn-apple-tips">
                    {section.bookLinks.map((tip) => (
                      <li key={`${tip.href}-${tip.linkLabel}`} className="bcn-apple-tip">
                        <span className="bcn-apple-tip__title">{tip.title}</span>
                        {tip.body ? (
                          <span className="bcn-apple-tip__body">{tip.body}</span>
                        ) : null}
                        <ExtLink
                          href={tip.href}
                          className={
                            dark
                              ? "bcn-apple-link bcn-apple-link--on-dark"
                              : "bcn-apple-link"
                          }
                        >
                          {tip.linkLabel}
                        </ExtLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Reveal>
            </div>
            {section.photo ? (
              <div className="bcn-apple-story__media">
                <Reveal>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={section.photo}
                    alt={section.photoAlt ?? ""}
                    className="bcn-apple-story__img"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  {section.photoCaption ? (
                    <p className="bcn-apple-caption">{section.photoCaption}</p>
                  ) : null}
                </Reveal>
              </div>
            ) : null}
          </section>
        );
      })}

      <section className="bcn-apple-band bcn-apple-band--white">
        <Reveal>
          <p className="bcn-apple-eyebrow bcn-apple-eyebrow--dark">{t("glanceEyebrow")}</p>
          <h2 className="bcn-apple-h2">{model.glanceTitle}</h2>
        </Reveal>
        <ul className="bcn-apple-grid">
          {model.mustSees.slice(0, 6).map((item) => (
            <li key={item} className="bcn-apple-grid__item">
              <Reveal>
                <p>{item}</p>
              </Reveal>
            </li>
          ))}
        </ul>
        <div className="bcn-apple-meta-row">
          <div>
            <h3>{t("quarters")}</h3>
            <p>{model.quarters}</p>
          </div>
          <div>
            <h3>{t("onTheGo")}</h3>
            <p>{model.transport}</p>
          </div>
        </div>
      </section>

      <section id="karte" className="bcn-apple-band bcn-apple-band--soft scroll-mt-20">
        <Reveal>
          <p className="bcn-apple-eyebrow bcn-apple-eyebrow--dark">{t("mapEyebrow")}</p>
          <h2 className="bcn-apple-h2">{model.mapTitle}</h2>
          <p className="bcn-apple-sub">{model.mapSubtitle}</p>
        </Reveal>
        {model.map}
      </section>

      <section id="hotels" className="bcn-apple-band bcn-apple-band--black">
        <Reveal>
          <p className="bcn-apple-eyebrow">{t("stayEyebrow")}</p>
          <h2 className="bcn-apple-h2">{model.hotelTitle}</h2>
          <p className="bcn-apple-sub bcn-apple-sub--on-dark">{model.hotelIntro}</p>
        </Reveal>
        <ul className="bcn-apple-hotels">
          {model.hotelPicks.map((pick) => (
            <li key={pick.id} className="bcn-apple-hotel">
              <Reveal>
                {pick.audience ? (
                  <p className="bcn-apple-hotel__tag">{pick.audience}</p>
                ) : null}
                <h3 className="bcn-apple-hotel__name">{pick.name}</h3>
                <p className="bcn-apple-hotel__meta">
                  {pick.stars} · {pick.area}
                </p>
                <p className="bcn-apple-hotel__note">{pick.note}</p>
                <ExtLink
                  href={pick.href}
                  className="bcn-apple-link bcn-apple-link--on-dark"
                  sponsored
                >
                  {t("searchBooking")}
                </ExtLink>
              </Reveal>
            </li>
          ))}
        </ul>
        <div className="bcn-apple-hero__cta" style={{ justifyContent: "center" }}>
          <a
            href={bookingHref}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="bcn-apple-btn bcn-apple-btn--blue"
          >
            {model.hotelSearchLabel}
          </a>
          <Link href={model.planerHref} className="bcn-apple-btn bcn-apple-btn--ghost">
            {t("addInPlanner")}
          </Link>
        </div>
        <p className="bcn-apple-fine">{model.affiliateDisclosure}</p>
      </section>

      <section id="faq" className="bcn-apple-band bcn-apple-band--soft">
        <Reveal>
          <p className="bcn-apple-eyebrow bcn-apple-eyebrow--dark">{t("faq")}</p>
          <h2 className="bcn-apple-h2">{model.faqTitle}</h2>
        </Reveal>
        <div className="bcn-apple-faq">
          {model.faqItems.slice(0, 8).map((item) => (
            <details key={item.question} className="bcn-apple-faq__item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
              {item.href && item.linkLabel ? (
                <p className="bcn-apple-book-row" style={{ justifyContent: "flex-start" }}>
                  <ExtLink href={item.href}>{item.linkLabel}</ExtLink>
                </p>
              ) : null}
            </details>
          ))}
        </div>
      </section>

      <section className="bcn-apple-band bcn-apple-band--white bcn-apple-close">
        <Reveal>
          <h2 className="bcn-apple-display bcn-apple-display--sm">
            {stripMd(model.closing).split(".")[0]}.
          </h2>
          <p className="bcn-apple-sub" style={{ maxWidth: "36rem", marginInline: "auto" }}>
            {stripMd(model.closing)}
          </p>
          <div className="bcn-apple-hero__cta" style={{ justifyContent: "center" }}>
            <Link href="/unsere-reisen" className="bcn-apple-link">
              {t("allIdeas")}
            </Link>
            <Link href={model.inspirationHref} className="bcn-apple-link">
              {t("shortInspiration")}
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
