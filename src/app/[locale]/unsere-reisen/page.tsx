import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TRAVEL_REPORT_NAV } from "@/lib/travelReports/travelReportNav";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localeLanguages, localeUrl } from "@/i18n/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "ideas" });
  const url = localeUrl(locale, "/unsere-reisen");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: url,
      languages: localeLanguages("/unsere-reisen"),
    },
  };
}

export default async function UnsereReisenPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const t = await getTranslations("ideas");
  const tReports = await getTranslations("reports");

  return (
    <div className="st-apple-hub">
      <div className="st-apple-hub__inner">
        <p className="st-apple-hub__eyebrow">{t("eyebrow")}</p>
        <h1 className="st-apple-hub__title">{t("title")}</h1>
        <p className="st-apple-hub__sub">
          {t.rich("subtitle", {
            trips: (chunks) => (
              <Link href="/meine-reisen" className="bcn-apple-link">
                {chunks}
              </Link>
            ),
          })}
        </p>

        <ul className="st-apple-hub__grid">
          {TRAVEL_REPORT_NAV.map((report) => (
            <li key={report.slug} id={report.slug}>
              <Link href={report.href} className="st-apple-hub__card">
                <div className="st-apple-hub__media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.photo}
                    alt={tReports(`${report.slug}.photoAlt` as Parameters<typeof tReports>[0])}
                    referrerPolicy="no-referrer"
                  />
                  <span className="st-apple-hub__badge">
                    {tReports(`${report.slug}.duration` as Parameters<typeof tReports>[0])}
                  </span>
                </div>
                <div className="st-apple-hub__body">
                  <h2 className="st-apple-hub__name">
                    {tReports(`${report.slug}.label` as Parameters<typeof tReports>[0])}
                  </h2>
                  <p className="st-apple-hub__text">
                    {tReports(`${report.slug}.tagline` as Parameters<typeof tReports>[0])}
                  </p>
                  <span className="st-apple-hub__cta">{t("openReport")}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <p
          className="st-apple-hub__sub"
          style={{ marginTop: "3rem", textAlign: "center", maxWidth: "none" }}
        >
          {t("saveOwn")}{" "}
          <Link href="/meine-reisen" className="bcn-apple-link">
            {t("myTrips")}
          </Link>
        </p>
      </div>
    </div>
  );
}
