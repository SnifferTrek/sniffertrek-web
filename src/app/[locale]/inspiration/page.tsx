import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getInspirationDestinations } from "@/lib/inspirationDestinations";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localeLanguages, localeUrl } from "@/i18n/site";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "inspirationHub" });
  const url = localeUrl(locale, "/inspiration");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: url,
      languages: localeLanguages("/inspiration"),
    },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url,
    },
  };
}

export default async function InspirationHubPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return null;
  setRequestLocale(locale);
  const t = await getTranslations("inspirationHub");

  return (
    <div className="st-apple-hub">
      <div className="st-apple-hub__inner">
        <p className="st-apple-hub__eyebrow">{t("eyebrow")}</p>
        <h1 className="st-apple-hub__title">{t("title")}</h1>
        <p className="st-apple-hub__sub">
          {t.rich("subtitle", {
            ideas: (chunks) => (
              <Link href="/unsere-reisen" className="bcn-apple-link">
                {chunks}
              </Link>
            ),
          })}
        </p>

        <ul className="st-apple-hub__grid">
          {getInspirationDestinations(locale).map((d) => (
            <li key={d.slug}>
              <Link href={`/inspiration/${d.slug}`} className="st-apple-hub__card">
                <div className="st-apple-hub__media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={d.img}
                    alt={t("imgAlt", { name: d.name })}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="st-apple-hub__body">
                  <h2 className="st-apple-hub__name">{d.name}</h2>
                  <p
                    className="st-apple-hub__text"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {d.story[0]}
                  </p>
                  <span className="st-apple-hub__cta">{t("openCta")}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
