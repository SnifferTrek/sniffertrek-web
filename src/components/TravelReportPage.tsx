import { ArrowLeft, ExternalLink, MapPin, Sparkles } from "lucide-react";
import {
  buildExpediaHotelLink,
  buildHotelsComLink,
  buildBookingHotelLink,
} from "@/lib/affiliateLinks";
import { TRAVEL_COUPLE } from "@/lib/travelCouple";
import type { TravelReportConfig } from "@/lib/travelReports/types";
import TravelReportFooterTabs from "@/components/TravelReportFooterTabs";
import TravelReportAtAGlance from "@/components/TravelReportAtAGlance";
import TravelReportBudget from "@/components/TravelReportBudget";
import TravelReportCoupleStory from "@/components/TravelReportCoupleStory";
import TravelReportDurationCompare from "@/components/TravelReportDurationCompare";
import TravelReportEvents from "@/components/TravelReportEvents";
import TravelReportItinerary from "@/components/TravelReportItinerary";
import TravelReportJourneyAxis from "@/components/TravelReportJourneyAxis";
import TravelReportToc from "@/components/TravelReportToc";
import TravelReportTransfer from "@/components/TravelReportTransfer";
import EnlargeableImage from "@/components/EnlargeableImage";
import ReportRichText from "@/components/ReportRichText";
import TravelReportFaq from "@/components/TravelReportFaq";
import TravelReportPoiCards from "@/components/TravelReportPoiCards";
import TravelReportRelatedLinks from "@/components/TravelReportRelatedLinks";
import TravelReportCallout from "@/components/TravelReportCallout";
import TravelReportFreeActivities from "@/components/TravelReportFreeActivities";
import TravelReportGuideCards from "@/components/TravelReportGuideCards";
import TravelReportSeasonTable from "@/components/TravelReportSeasonTable";
import TravelReportTours from "@/components/TravelReportTours";
import TravelReportVenueList from "@/components/TravelReportVenueList";
import TravelReportSiblingNav from "@/components/TravelReportSiblingNav";
import {
  PrintVariantProvider,
  TravelReportPrintSource,
} from "@/components/TravelReportPrintChooser";
import TravelReportPrintDocumentAtlas from "@/components/TravelReportPrintDocumentAtlas";
import { Link } from "@/i18n/navigation";
import { localeLanguages, localeUrl } from "@/i18n/site";

const SITE_URL = "https://www.sniffertrek.com";

function localeHome(locale: string) {
  if (locale === "en") return "Home";
  if (locale === "es") return "Inicio";
  return "Startseite";
}

function localeAbout(locale: string, name: string) {
  if (locale === "en") return `About ${name}`;
  if (locale === "es") return `Sobre ${name}`;
  return `Über ${name}`;
}

function localePlanHint(locale: string) {
  if (locale === "en") return "Plan the route, dates and stages yourself – or start in the planner.";
  if (locale === "es") return "Planifica tú la ruta, las fechas y las etapas, o empieza en el planificador.";
  return "Route, Daten und Etappen selbst planen – oder direkt im Planer starten.";
}

const linkBtn =
  "inline-flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors";

type TravelReportPageProps = {
  config: TravelReportConfig;
  map: React.ReactNode;
  locale?: string;
};

export function buildTravelReportMetadata(config: TravelReportConfig, locale = "de") {
  const url = localeUrl(locale, config.path);
  return {
    title: config.meta.title,
    description: config.meta.description,
    alternates: {
      canonical: url,
      languages: localeLanguages(config.path),
    },
    openGraph: {
      title: config.meta.title,
      description: config.meta.description,
      type: "article" as const,
      url,
      images: [
        { url: config.hero.photo, width: 1200, height: 630, alt: config.hero.photoAlt },
      ],
    },
  };
}

function ReportSections({ config }: { config: TravelReportConfig }) {
  return (
    <>
      {config.sections.map((section, idx) => (
        <section
          key={section.id}
          id={section.id}
          className={`scroll-mt-24 ${idx === 0 ? "mt-14" : "mt-16"}`}
        >
          {section.photo ? (
            <div className="relative mb-8 min-h-[280px] overflow-hidden sm:min-h-[340px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={section.photo}
                alt={section.photoAlt ?? section.photoCaption ?? ""}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/45 to-stone-900/15" />
              <div className="relative z-10 mx-auto flex h-full min-h-[280px] max-w-3xl flex-col justify-end px-4 py-10 sm:min-h-[340px] sm:px-6">
                {section.kicker ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/90">
                    {section.kicker}
                  </p>
                ) : null}
                <h2 className="mt-1 max-w-xl text-2xl font-bold text-white sm:text-3xl">
                  {section.title}
                </h2>
                {section.photoCaption ? (
                  <p className="mt-2 text-xs text-white/75">{section.photoCaption}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 sm:px-6">
              {section.kicker ? (
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  {section.kicker}
                </p>
              ) : null}
              <h2 className="mt-1 text-2xl font-bold text-stone-900 sm:text-3xl">
                {section.title}
              </h2>
            </div>
          )}

          <div className="mx-auto max-w-3xl space-y-4 px-4 sm:px-6">
            {section.paragraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-stone-700">
                <ReportRichText text={p} />
              </p>
            ))}

            {section.inlinePhoto ? (
              <EnlargeableImage
                src={section.inlinePhoto}
                alt={section.inlinePhotoAlt ?? section.inlinePhotoCaption ?? ""}
                caption={section.inlinePhotoCaption}
                variant="inline"
                gallery={config.lightboxGallery}
                galleryIndex={config.galleryIndexForSrc(section.inlinePhoto)}
              />
            ) : null}

            {section.couplePhoto ? (
              <EnlargeableImage
                src={section.couplePhoto}
                alt={section.couplePhotoAlt ?? section.coupleCaption ?? ""}
                caption={section.coupleCaption}
                variant="inline"
                gallery={config.lightboxGallery}
                galleryIndex={config.galleryIndexForSrc(section.couplePhoto)}
              />
            ) : null}

            {section.story ? <TravelReportCoupleStory text={section.story} /> : null}

            {section.id === "essen" ? (
              <ul className="mt-4 grid gap-3 sm:grid-cols-1">
                {config.favoriteSpots.map((spot) => (
                  <li
                    key={spot.id}
                    className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-stone-900">
                      {spot.name}
                      <span className="ml-2 font-normal text-stone-500">· {spot.type}</span>
                    </p>
                    <p className="mt-1 text-sm text-stone-600">{spot.note}</p>
                  </li>
                ))}
              </ul>
            ) : null}

            {section.tips && section.tips.length > 0 ? (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {section.tips.map((tip) => (
                  <li
                    key={tip.title}
                    className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-stone-900">{tip.title}</p>
                    <p className="mt-1 text-sm text-stone-600">{tip.body}</p>
                    {tip.image ? (
                      <EnlargeableImage
                        src={tip.image}
                        alt={tip.imageAlt ?? tip.title}
                        caption={tip.imageCaption}
                        variant="tip"
                        fit="contain"
                        figcaptionClassName="px-2 pb-2 text-[11px] leading-snug text-stone-400"
                      />
                    ) : null}
                    {tip.href ? (
                      <a
                        href={tip.href}
                        {...(tip.href.startsWith("#")
                          ? {}
                          : { target: "_blank", rel: "noopener noreferrer" })}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900"
                      >
                        {tip.linkLabel ?? "Mehr & buchen"}
                        {!tip.href.startsWith("#") ? (
                          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                        ) : null}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ))}
    </>
  );
}

function PracticeBlock({ config }: { config: TravelReportConfig }) {
  return (
    <>
      <TravelReportFreeActivities activities={config.freeActivities} />

      <section id="anreise" className="scroll-mt-24 space-y-4">
        <TravelReportCallout
          title={config.arrival.callout.title}
          body={config.arrival.callout.body}
          bullets={config.arrival.callout.bullets}
          href={config.arrival.callout.href}
          linkLabel={config.arrival.callout.linkLabel}
          secondaryHref={config.arrival.callout.secondaryHref}
          secondaryLinkLabel={config.arrival.callout.secondaryLinkLabel}
          variant={config.arrival.callout.variant ?? "info"}
        />
        <TravelReportVenueList
          id={config.arrival.parking.id}
          title={config.arrival.parking.title}
          intro={config.arrival.parking.intro}
          items={config.arrival.parking.items}
          collapsible={config.arrival.parking.collapsible}
          priceStandLabel={config.budget.priceStandLabel}
        />
        <TravelReportTransfer
          title={config.arrival.transferTitle}
          options={config.arrival.transferOptions}
        />
      </section>

      <TravelReportGuideCards
        title={config.guideCards.title}
        cards={config.guideCards.cards}
      />

      <TravelReportVenueList
        id={config.rainAlternatives.id}
        title={config.rainAlternatives.title}
        intro={config.rainAlternatives.intro}
        items={config.rainAlternatives.items}
        collapsible={config.rainAlternatives.collapsible}
        priceStandLabel={config.budget.priceStandLabel}
      />

      <TravelReportVenueList
        id={config.specialVenueList.id}
        title={config.specialVenueList.title}
        intro={config.specialVenueList.intro}
        items={config.specialVenueList.items}
        collapsible={config.specialVenueList.collapsible}
        priceStandLabel={config.budget.priceStandLabel}
      />

      <TravelReportDurationCompare options={config.durationCompare} />
    </>
  );
}

function ClosingBlock({
  config,
  locale = "de",
}: {
  config: TravelReportConfig;
  locale?: string;
}) {
  return (
    <div className="mx-auto mt-12 max-w-3xl border-t border-stone-200 px-4 py-12 sm:px-6">
      <p className="text-sm leading-relaxed text-stone-700">
        <ReportRichText text={config.closing} />
      </p>
      <div className="mt-10 text-center">
        <p className="text-sm text-stone-500">
          {localePlanHint(locale)}
        </p>
        <Link
          href={config.planer.href}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[var(--st-primary)] px-8 py-3.5 text-base font-semibold text-white shadow-lg transition hover:shadow-xl"
        >
          <Sparkles className="h-5 w-5" />
          {config.planer.ctaLabel}
        </Link>
        <p className="mx-auto mt-3 max-w-md text-xs text-stone-500">{config.planer.hint}</p>
        <p className="mt-8 text-xs text-stone-400">
          <Link href="/geschichten" className="hover:text-stone-600">
            {localeAbout(locale, TRAVEL_COUPLE.displayName)}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function TravelReportPage({
  config,
  map,
  locale = "de",
}: TravelReportPageProps) {
  const isCoastal = config.layoutVariant === "coastal";

  const hotelSearch = {
    destination: config.hotels.affiliateDestination,
    checkIn: config.hotels.checkIn,
    checkOut: config.hotels.checkOut,
    travelers: 2,
    rooms: 1,
    clickRef: config.hotels.clickRef,
  };

  const hotelLinks = [
    {
      id: "booking",
      label: "Booking.com",
      href: buildBookingHotelLink(hotelSearch),
      className: `${linkBtn} border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100`,
    },
    {
      id: "hotels-com",
      label: "Hotels.com",
      href: buildHotelsComLink(hotelSearch),
      className: `${linkBtn} border-red-200 bg-red-50 text-red-800 hover:bg-red-100`,
    },
    {
      id: "expedia",
      label: "Expedia",
      href: buildExpediaHotelLink(hotelSearch),
      className: `${linkBtn} border-yellow-200 bg-yellow-50 text-yellow-900 hover:bg-yellow-100`,
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: config.meta.title,
    description: config.meta.description,
    datePublished: config.meta.datePublished,
    dateModified: config.meta.dateModified,
    author: {
      "@type": "Organization",
      name: "SnifferTrek",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "SnifferTrek",
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${config.path}`,
    },
    about: config.jsonLdAbout,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: localeHome(locale), item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: config.breadcrumbLabel,
        item: `${SITE_URL}${config.path}`,
      },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: config.mustSees.itemListName,
    itemListElement: config.mustSees.items.map((name, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
    })),
  };

  return (
    <PrintVariantProvider>
      <TravelReportPrintSource
        atlas={
          <TravelReportPrintDocumentAtlas
            config={config}
            className="hidden print:block"
            data-print-active="1"
            locale={locale}
          />
        }
      />
      <article
        className={`min-h-screen print:hidden ${
          isCoastal ? "travel-report--coastal" : "bg-[var(--st-bg)]"
        }`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />

        <header
          className={`relative flex items-end ${
            isCoastal
              ? "min-h-[min(88vh,720px)]"
              : "min-h-[min(70vh,560px)]"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.hero.photo}
            alt={config.hero.photoAlt}
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div
            className={
              isCoastal
                ? "absolute inset-0 bg-gradient-to-t from-[#042f4a] via-[#0c4a6e]/55 to-[#0ea5e9]/15"
                : "absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-stone-900/20"
            }
          />
          {isCoastal ? (
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse 80% 50% at 70% 20%, rgba(56,189,248,0.35), transparent 55%)",
              }}
              aria-hidden
            />
          ) : null}
          <div
            className={`relative z-10 mx-auto w-full max-w-3xl px-4 pt-28 sm:px-6 ${
              isCoastal ? "pb-16 sm:pb-20" : "pb-12 sm:pb-16"
            }`}
          >
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {localeHome(locale)}
            </Link>
            {isCoastal ? (
              <p
                className="text-2xl font-bold tracking-tight text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-atlas), var(--font-display), system-ui, sans-serif" }}
              >
                SnifferTrek
              </p>
            ) : (
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200/90">
                Reisebericht
              </p>
            )}
            <h1
              className={`mt-3 font-extrabold tracking-tight text-white ${
                isCoastal
                  ? "text-4xl sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]"
                  : "text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-tight"
              }`}
              style={
                isCoastal
                  ? {
                      fontFamily:
                        "var(--font-atlas), var(--font-display), system-ui, sans-serif",
                    }
                  : undefined
              }
            >
              {config.hero.title}
            </h1>
            <p
              className={`mt-3 text-white/90 ${
                isCoastal ? "max-w-md text-lg font-medium sm:text-xl" : "text-xl font-semibold sm:text-2xl"
              }`}
            >
              {config.hero.subtitle}
            </p>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/75">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {config.hero.duration}
              </span>
              {!isCoastal ? (
                <>
                  <span className="text-white/50" aria-hidden>
                    ·
                  </span>
                  <span>{config.hero.seoSubtitle}</span>
                </>
              ) : null}
            </p>
            {!isCoastal ? (
              <>
                <p className="mt-3 text-xs text-white/60">
                  {config.hero.experienceNote} · {TRAVEL_COUPLE.displayName}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  Zuletzt aktualisiert: {config.hero.dateModifiedLabel}
                </p>
              </>
            ) : (
              <p className="mt-5 text-sm text-sky-100/80">
                {TRAVEL_COUPLE.displayName} · Reisebericht
              </p>
            )}
          </div>
        </header>

        {isCoastal ? (
          <>
            {/* Level A · Orientierung */}
            <div className="travel-report-coastal-lead mx-auto max-w-3xl px-4 sm:px-6">
              <p className="travel-report-coastal-lead__text">
                <ReportRichText text={config.lead} />
              </p>
              <p className="mt-3 text-xs text-sky-900/50">
                {config.hero.experienceNote} · Aktualisiert {config.hero.dateModifiedLabel}
              </p>
            </div>

            <div className="mx-auto max-w-3xl space-y-8 px-4 pb-4 sm:px-6">
              <TravelReportSiblingNav current={config.slug} />

              <p className="text-xs leading-relaxed text-stone-500">
                {config.affiliateDisclosure}
              </p>

              {config.journeyAxis ? (
                <TravelReportJourneyAxis
                  title={config.journeyAxis.title}
                  subtitle={config.journeyAxis.subtitle}
                  stops={config.journeyAxis.stops}
                  outro={config.journeyAxis.outro}
                />
              ) : null}

              <TravelReportAtAGlance
                mustSees={config.atAGlance.mustSees}
                quarters={config.atAGlance.quarters}
                transport={config.atAGlance.transport}
                planHint={config.atAGlance.planHint}
                planerHref={config.atAGlance.planerHref}
                planAnchorId={config.atAGlance.planAnchorId}
                planAnchorLabel={config.atAGlance.planAnchorLabel}
              />

              <div id={config.specialCallout.id} className="scroll-mt-24">
                <TravelReportCallout
                  title={config.specialCallout.title}
                  body={config.specialCallout.body}
                  bullets={config.specialCallout.bullets}
                  href={config.specialCallout.href}
                  linkLabel={config.specialCallout.linkLabel}
                  secondaryHref={config.specialCallout.secondaryHref}
                  secondaryLinkLabel={config.specialCallout.secondaryLinkLabel}
                  variant={config.specialCallout.variant}
                />
              </div>

              <TravelReportItinerary
                id={config.itinerary.id}
                title={config.itinerary.title}
                subtitle={config.itinerary.subtitle}
                days={config.itinerary.days}
              />

              <TravelReportToc items={config.toc} title="Springen zu" />
            </div>

            {/* Level B · Geschichte */}
            <div className="travel-report-coastal-band">
              <p className="travel-report-coastal-band__label">Unterwegs</p>
            </div>
            <ReportSections config={config} />

            {/* Level C · Praxis */}
            {map}

            <TravelReportPoiCards
              id="poi-highlights"
              title={config.poiCards.title}
              subtitle={config.poiCards.subtitle}
              pois={[...config.poiCards.pois]}
              gallery={config.lightboxGallery}
            />

            <section
              id="sehenswuerdigkeiten"
              className="mx-auto mb-4 mt-16 max-w-3xl scroll-mt-24 px-4 sm:px-6"
            >
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                {config.mustSees.heading}
              </h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-stone-800 marker:font-semibold marker:text-sky-700">
                {config.mustSees.items.map((item) => (
                  <li key={item} className="pl-1">
                    {item}
                  </li>
                ))}
              </ol>
            </section>

            <div className="travel-report-coastal-band travel-report-coastal-band--practice">
              <p className="travel-report-coastal-band__label">Praxis</p>
            </div>

            <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
              <PracticeBlock config={config} />
            </div>

            <div className="mx-auto mt-16 max-w-3xl space-y-12 border-t border-sky-100/80 px-4 pt-12 sm:px-6">
              <TravelReportSeasonTable rows={config.seasonRows} />
              <TravelReportTours
                title={config.tours.title}
                tours={config.tours.items}
                disclosure={config.affiliateDisclosure}
              />
              <TravelReportBudget
                title={config.budget.title}
                lines={config.budget.lines}
                priceStandLabel={config.budget.priceStandLabel}
              />
              <TravelReportEvents events={config.events} />
            </div>

            <TravelReportFaq items={[...config.faq.items]} title={config.faq.title} />

            {config.relatedLinks.length > 0 ? (
              <TravelReportRelatedLinks links={[...config.relatedLinks]} />
            ) : null}

            <TravelReportFooterTabs
              hotelLinks={hotelLinks}
              destinationLabel={config.hotels.destinationLabel}
              hotelIntro={config.hotels.intro}
              hotelPicks={[...config.hotels.picks]}
              hotelSearchLabel={config.hotels.searchLabel}
              generalInfo={{
                title: config.generalInfo.title,
                sections: [...config.generalInfo.sections],
              }}
            />

            <ClosingBlock config={config} locale={locale} />
          </>
        ) : (
          <>
            <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
              <p className="-mt-6 relative z-20 rounded-2xl border border-stone-200/80 bg-white px-6 py-5 text-sm leading-relaxed text-stone-700 shadow-lg sm:py-6">
                <ReportRichText text={config.lead} />
              </p>

              <TravelReportSiblingNav current={config.slug} />

              <p className="text-xs leading-relaxed text-stone-500">
                {config.affiliateDisclosure}
              </p>

              <div id={config.specialCallout.id} className="scroll-mt-24">
                <TravelReportCallout
                  title={config.specialCallout.title}
                  body={config.specialCallout.body}
                  bullets={config.specialCallout.bullets}
                  href={config.specialCallout.href}
                  linkLabel={config.specialCallout.linkLabel}
                  secondaryHref={config.specialCallout.secondaryHref}
                  secondaryLinkLabel={config.specialCallout.secondaryLinkLabel}
                  variant={config.specialCallout.variant}
                />
              </div>

              <TravelReportAtAGlance
                mustSees={config.atAGlance.mustSees}
                quarters={config.atAGlance.quarters}
                transport={config.atAGlance.transport}
                planHint={config.atAGlance.planHint}
                planerHref={config.atAGlance.planerHref}
                planAnchorId={config.atAGlance.planAnchorId}
                planAnchorLabel={config.atAGlance.planAnchorLabel}
              />

              <TravelReportFreeActivities activities={config.freeActivities} />

              <section id="anreise" className="scroll-mt-24 space-y-4">
                <TravelReportCallout
                  title={config.arrival.callout.title}
                  body={config.arrival.callout.body}
                  bullets={config.arrival.callout.bullets}
                  href={config.arrival.callout.href}
                  linkLabel={config.arrival.callout.linkLabel}
                  secondaryHref={config.arrival.callout.secondaryHref}
                  secondaryLinkLabel={config.arrival.callout.secondaryLinkLabel}
                  variant={config.arrival.callout.variant ?? "info"}
                />
                <TravelReportVenueList
                  id={config.arrival.parking.id}
                  title={config.arrival.parking.title}
                  intro={config.arrival.parking.intro}
                  items={config.arrival.parking.items}
                  collapsible={config.arrival.parking.collapsible}
                  priceStandLabel={config.budget.priceStandLabel}
                />
                <TravelReportTransfer
                  title={config.arrival.transferTitle}
                  options={config.arrival.transferOptions}
                />
              </section>

              <TravelReportToc items={config.toc} />

              <TravelReportGuideCards
                title={config.guideCards.title}
                cards={config.guideCards.cards}
              />

              <TravelReportVenueList
                id={config.rainAlternatives.id}
                title={config.rainAlternatives.title}
                intro={config.rainAlternatives.intro}
                items={config.rainAlternatives.items}
                collapsible={config.rainAlternatives.collapsible}
                priceStandLabel={config.budget.priceStandLabel}
              />

              <TravelReportVenueList
                id={config.specialVenueList.id}
                title={config.specialVenueList.title}
                intro={config.specialVenueList.intro}
                items={config.specialVenueList.items}
                collapsible={config.specialVenueList.collapsible}
                priceStandLabel={config.budget.priceStandLabel}
              />

              <TravelReportDurationCompare options={config.durationCompare} />

              <TravelReportItinerary
                id={config.itinerary.id}
                title={config.itinerary.title}
                subtitle={config.itinerary.subtitle}
                days={config.itinerary.days}
              />
            </div>

            <ReportSections config={config} />

            {map}

            <TravelReportPoiCards
              id="poi-highlights"
              title={config.poiCards.title}
              subtitle={config.poiCards.subtitle}
              pois={[...config.poiCards.pois]}
              gallery={config.lightboxGallery}
            />

            <section
              id="sehenswuerdigkeiten"
              className="mx-auto mb-4 mt-16 max-w-3xl scroll-mt-24 px-4 sm:px-6"
            >
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                {config.mustSees.heading}
              </h2>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-stone-800 marker:font-semibold marker:text-teal-700">
                {config.mustSees.items.map((item) => (
                  <li key={item} className="pl-1">
                    {item}
                  </li>
                ))}
              </ol>
            </section>

            <div className="mx-auto mt-24 max-w-3xl space-y-12 border-t border-stone-200/80 px-4 pt-12 sm:px-6">
              <TravelReportSeasonTable rows={config.seasonRows} />
              <TravelReportTours
                title={config.tours.title}
                tours={config.tours.items}
                disclosure={config.affiliateDisclosure}
              />
              <TravelReportBudget
                title={config.budget.title}
                lines={config.budget.lines}
                priceStandLabel={config.budget.priceStandLabel}
              />
              <TravelReportEvents events={config.events} />
            </div>

            <TravelReportFaq items={[...config.faq.items]} title={config.faq.title} />

            {config.relatedLinks.length > 0 ? (
              <TravelReportRelatedLinks links={[...config.relatedLinks]} />
            ) : null}

            <TravelReportFooterTabs
              hotelLinks={hotelLinks}
              destinationLabel={config.hotels.destinationLabel}
              hotelIntro={config.hotels.intro}
              hotelPicks={[...config.hotels.picks]}
              hotelSearchLabel={config.hotels.searchLabel}
              generalInfo={{
                title: config.generalInfo.title,
                sections: [...config.generalInfo.sections],
              }}
            />

            <ClosingBlock config={config} locale={locale} />
          </>
        )}
      </article>
    </PrintVariantProvider>
  );
}
