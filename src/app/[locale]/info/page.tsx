import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const SITE = "https://www.sniffertrek.com";

const PARTNERS = [
  "Booking.com",
  "Expedia",
  "Skyscanner",
  "Hotels.com",
  "Rentalcars",
  "GetYourGuide",
  "Trainline",
  "Viator",
  "Agoda",
  "HostelWorld",
] as const;

type Props = { params: Promise<{ locale: string }> };

function infoPath(locale: string) {
  return locale === "de" ? `${SITE}/info` : `${SITE}/${locale}/info`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "info" });
  const url = infoPath(locale);
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: url,
      languages: {
        de: `${SITE}/info`,
        en: `${SITE}/en/info`,
        es: `${SITE}/es/info`,
        "x-default": `${SITE}/info`,
      },
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("ogDescription"),
      url,
    },
  };
}

export default async function InfoPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const t = await getTranslations("info");
  const tChrome = await getTranslations("chrome");

  const features = [
    { title: t("f1Title"), description: t("f1Text") },
    { title: t("f2Title"), description: t("f2Text") },
    { title: t("f3Title"), description: t("f3Text") },
    { title: t("f4Title"), description: t("f4Text") },
    { title: t("f5Title"), description: t("f5Text") },
    { title: t("f6Title"), description: t("f6Text") },
    { title: t("f7Title"), description: t("f7Text") },
    { title: t("f8Title"), description: t("f8Text") },
    { title: t("f9Title"), description: t("f9Text") },
  ];

  const steps = [
    { step: "1", title: t("s1Title"), description: t("s1Text") },
    { step: "2", title: t("s2Title"), description: t("s2Text") },
    { step: "3", title: t("s3Title"), description: t("s3Text") },
    { step: "4", title: t("s4Title"), description: t("s4Text") },
  ];

  const why = [
    { title: t("w1Title"), description: t("w1Text") },
    { title: t("w2Title"), description: t("w2Text") },
    { title: t("w3Title"), description: t("w3Text") },
    { title: t("w4Title"), description: t("w4Text") },
  ];

  const stats = [
    { value: "1000+", label: t("statPois") },
    { value: "50+", label: t("statCountries") },
    { value: "100%", label: t("statFree") },
    { value: "1", label: t("statOneTool") },
  ];

  return (
    <div className="bcn-apple min-h-screen overflow-x-hidden">
      <section className="bcn-apple-band bcn-apple-band--white" style={{ paddingTop: "7rem" }}>
        <p className="bcn-apple-eyebrow bcn-apple-eyebrow--dark">SnifferTrek</p>
        <h1 className="bcn-apple-display bcn-apple-display--sm" style={{ textAlign: "center" }}>
          {t("heroTitle")}
        </h1>
        <p className="bcn-apple-sub" style={{ marginTop: "1.25rem" }}>
          {t("heroSubtitle")}
        </p>
        <div className="bcn-apple-hero__cta" style={{ justifyContent: "center" }}>
          <Link href="/reise-planen" className="bcn-apple-btn bcn-apple-btn--blue">
            {t("planNow")}
          </Link>
          <a href="#features" className="bcn-apple-btn bcn-apple-btn--light">
            {t("discover")}
          </a>
        </div>
        <ul className="info-apple-stats">
          {stats.map((stat) => (
            <li key={stat.label} className="info-apple-stat">
              <span className="info-apple-stat__value">{stat.value}</span>
              <span className="info-apple-stat__label">{stat.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="features" className="scroll-mt-20">
        <div className="bcn-apple-band bcn-apple-band--soft">
          <p className="bcn-apple-eyebrow bcn-apple-eyebrow--dark">{t("featuresEyebrow")}</p>
          <h2 className="bcn-apple-h2">{t("featuresTitle")}</h2>
          <p className="bcn-apple-sub">{t("featuresSubtitle")}</p>
          <ul className="info-apple-features">
            {features.map((feature) => (
              <li key={feature.title} className="info-apple-feature">
                <h3 className="info-apple-feature__title">{feature.title}</h3>
                <p className="info-apple-feature__body">{feature.description}</p>
              </li>
            ))}
          </ul>
          <div
            className="bcn-apple-hero__cta"
            style={{ justifyContent: "center", marginTop: "2.5rem" }}
          >
            <Link href="/reise-planen" className="bcn-apple-btn bcn-apple-btn--blue">
              {t("planNow")}
            </Link>
            <Link href="/unsere-reisen" className="bcn-apple-btn bcn-apple-btn--light">
              {tChrome("travelIdeas")}
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20">
        <div className="bcn-apple-band bcn-apple-band--white">
          <p className="bcn-apple-eyebrow bcn-apple-eyebrow--dark">{t("howEyebrow")}</p>
          <h2 className="bcn-apple-h2">{t("howTitle")}</h2>
          <ol className="info-apple-steps">
            {steps.map((item) => (
              <li key={item.step} className="info-apple-step">
                <span className="info-apple-step__n">{item.step}</span>
                <h3 className="info-apple-step__title">{item.title}</h3>
                <p className="info-apple-step__body">{item.description}</p>
              </li>
            ))}
          </ol>
          <div
            className="bcn-apple-hero__cta"
            style={{ justifyContent: "center", marginTop: "2.5rem" }}
          >
            <Link href="/reise-planen" className="bcn-apple-btn bcn-apple-btn--blue">
              {t("planNow")}
            </Link>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-20">
        <div className="bcn-apple-band bcn-apple-band--soft">
          <p className="bcn-apple-eyebrow bcn-apple-eyebrow--dark">{t("partnersEyebrow")}</p>
          <h2 className="bcn-apple-h2">{t("partnersTitle")}</h2>
          <p className="bcn-apple-sub">{t("partnersSubtitle")}</p>
          <div className="info-apple-partners">
            <div className="info-apple-partners__fade info-apple-partners__fade--left" />
            <div className="info-apple-partners__fade info-apple-partners__fade--right" />
            <div className="info-apple-partners__track">
              {[...PARTNERS, ...PARTNERS].map((partner, i) => (
                <span key={`${partner}-${i}`} className="info-apple-partner">
                  {partner}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="bcn-apple-band bcn-apple-band--white">
          <p className="bcn-apple-eyebrow bcn-apple-eyebrow--dark">{t("whyEyebrow")}</p>
          <h2 className="bcn-apple-h2">{t("whyTitle")}</h2>
          <ul className="info-apple-why">
            {why.map((item) => (
              <li key={item.title} className="info-apple-why__item">
                <h3 className="info-apple-why__title">{item.title}</h3>
                <p className="info-apple-why__body">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="cta">
        <div className="bcn-apple-band bcn-apple-band--black">
          <h2 className="bcn-apple-h2" style={{ color: "#f5f5f7" }}>
            {t("ctaTitle")}
          </h2>
          <p
            className="bcn-apple-sub bcn-apple-sub--on-dark"
            style={{ opacity: 1, color: "rgba(245, 245, 247, 0.88)" }}
          >
            {t("ctaSubtitle")}
          </p>
          <div className="bcn-apple-hero__cta" style={{ justifyContent: "center" }}>
            <Link href="/reise-planen" className="bcn-apple-btn bcn-apple-btn--blue">
              {t("planNow")}
            </Link>
          </div>
          <p
            className="bcn-apple-fine"
            style={{ marginTop: "1.5rem", color: "rgba(245, 245, 247, 0.65)" }}
          >
            {t("ctaFine")}
          </p>
        </div>
      </section>
    </div>
  );
}
