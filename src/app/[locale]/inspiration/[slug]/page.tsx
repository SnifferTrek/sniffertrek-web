import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  INSPIRATION_DESTINATIONS,
  getInspirationBySlug,
  getInspirationBookingDestination,
} from "@/lib/inspirationDestinations";
import { buildBookingHotelLink } from "@/lib/affiliateLinks";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localeLanguages, localeUrl } from "@/i18n/site";

type Props = { params: Promise<{ locale: string; slug: string }> };

function defaultHotelWindow(nights = 4): { checkIn: string; checkOut: string } {
  const checkIn = new Date();
  checkIn.setHours(12, 0, 0, 0);
  checkIn.setDate(checkIn.getDate() + 14);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + nights);
  return {
    checkIn: checkIn.toISOString().slice(0, 10),
    checkOut: checkOut.toISOString().slice(0, 10),
  };
}

export function generateStaticParams() {
  return INSPIRATION_DESTINATIONS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const d = getInspirationBySlug(slug, locale);
  const t = hasLocale(routing.locales, locale)
    ? await getTranslations({ locale, namespace: "inspirationPage" })
    : null;
  if (!d) return { title: t?.("fallbackTitle") ?? "Reiseziel" };
  const ogImage = d.gallery[0] ?? d.img;
  const url = localeUrl(locale, `/inspiration/${d.slug}`);
  return {
    title: `${d.name} · Inspiration`,
    description: d.story[0],
    alternates: {
      canonical: url,
      languages: localeLanguages(`/inspiration/${d.slug}`),
    },
    openGraph: {
      title: `${d.name} · Inspiration · SnifferTrek`,
      description: d.story[0],
      url,
      images: [{ url: ogImage, alt: d.name }],
    },
  };
}

export default async function InspirationDestinationPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const d = getInspirationBySlug(slug, locale);
  if (!d) notFound();
  const t = await getTranslations("inspirationPage");

  const heroSrc = d.gallery[0] ?? d.img;
  const galleryRest = d.gallery.slice(1);
  const { checkIn, checkOut } = defaultHotelWindow();
  const bookingHref = buildBookingHotelLink({
    destination: getInspirationBookingDestination(d),
    checkIn,
    checkOut,
    travelers: 2,
    rooms: 1,
    clickRef: `inspiration-${d.slug}`,
  });

  return (
    <div className="bcn-apple min-h-screen">
      <header className="relative h-[min(58vh,520px)] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSrc}
          alt={t("heroAlt", { name: d.name })}
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/25" />
        <div className="relative z-10 mx-auto flex h-full max-w-3xl flex-col justify-end px-4 pb-12 pt-24 sm:px-6">
          <Link
            href="/inspiration"
            className="mb-5 inline-flex w-fit text-sm font-medium text-white/85 hover:text-white"
          >
            {t("back")}
          </Link>
          <h1
            className="text-[clamp(2.25rem,6vw,3.75rem)] font-bold leading-[1.02] tracking-[-0.035em] text-white"
            style={{ fontFamily: "var(--font-bcn), var(--font-display), system-ui, sans-serif" }}
          >
            {d.name}.
          </h1>
          <p className="mt-3 max-w-xl text-base font-medium text-white/90 sm:text-lg">
            {d.story[0]}
          </p>
        </div>
      </header>

      <main>
        <section className="bcn-apple-band bcn-apple-band--white">
          <div className="mx-auto max-w-3xl space-y-4 text-left text-[1.05rem] leading-relaxed text-[var(--bcn-black)]">
            {d.story.map((p, i) => (
              <p key={i} className={i === 0 ? "sr-only" : undefined}>
                {p}
              </p>
            ))}
          </div>
        </section>

        <section className="bcn-apple-band bcn-apple-band--soft">
          <p className="bcn-apple-eyebrow bcn-apple-eyebrow--dark">{t("historyEyebrow")}</p>
          <h2 className="bcn-apple-h2">{t("historyTitle")}</h2>
          <div className="mx-auto mt-8 max-w-3xl space-y-3 text-left text-[1.05rem] leading-relaxed text-[var(--bcn-black)]">
            {d.history.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        <section className="bcn-apple-band bcn-apple-band--white">
          <p className="bcn-apple-eyebrow bcn-apple-eyebrow--dark">{t("mustSeeEyebrow")}</p>
          <h2 className="bcn-apple-h2">{t("mustSeeTitle")}</h2>
          <ol className="mx-auto mt-8 max-w-3xl space-y-3 list-none p-0">
            {d.mustSee.map((item, i) => (
              <li key={i} className="info-apple-feature">
                <p className="info-apple-feature__title" style={{ fontSize: "1.05rem" }}>
                  <span style={{ color: "var(--bcn-blue)" }}>{i + 1}.</span> {item}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {galleryRest.length > 0 ? (
          <section className="bcn-apple-band bcn-apple-band--soft">
            <p className="bcn-apple-eyebrow bcn-apple-eyebrow--dark">{t("galleryEyebrow")}</p>
            <h2 className="bcn-apple-h2">{t("galleryTitle")}</h2>
            <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2">
              {galleryRest.map((url, idx) => (
                <div key={`${d.slug}-g-${idx}`} className="overflow-hidden rounded-[1.25rem]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={t("photoAlt", { name: d.name, n: idx + 2 })}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section id="hotels" className="bcn-apple-band bcn-apple-band--black">
          <p className="bcn-apple-eyebrow">{t("stayEyebrow")}</p>
          <h2 className="bcn-apple-h2" style={{ color: "#f5f5f7" }}>
            {t("hotelsTitle", { name: d.name })}
          </h2>
          <p
            className="bcn-apple-sub bcn-apple-sub--on-dark"
            style={{ opacity: 1, color: "rgba(245, 245, 247, 0.88)" }}
          >
            {t("hotelsBlurb")}
          </p>
          <div className="bcn-apple-hero__cta" style={{ justifyContent: "center" }}>
            <a
              href={bookingHref}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="bcn-apple-btn bcn-apple-btn--blue"
            >
              {t("bookingCta")}
            </a>
            <Link href="/planer?tab=hotels&hptype=hotel" className="bcn-apple-btn bcn-apple-btn--ghost">
              {t("planTrip")}
            </Link>
          </div>
          <p
            className="bcn-apple-fine"
            style={{ marginTop: "1.5rem", color: "rgba(245, 245, 247, 0.65)" }}
          >
            {t("affiliate")}
          </p>
        </section>
      </main>
    </div>
  );
}
