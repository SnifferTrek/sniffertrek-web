import { TRAVEL_COUPLE } from "@/lib/travelCouple";
import type { TravelReportConfig } from "@/lib/travelReports/types";
import { markerLetter } from "@/lib/travelReports/printMap";
import {
  buildTravelReportPrintModel,
  printText,
} from "@/lib/travelReports/printModel";
import { PRINT_PAGE1, trimToMaxChars } from "@/lib/travelReports/printSlotLimits";
import AtlasCoverImage from "@/components/AtlasCoverImage";
import { getPrintAtlasCopy } from "@/lib/printAtlasCopy";

function PrintRich({ text }: { text: string }) {
  const cleaned = printText(text);
  const parts = cleaned.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="ax-strong">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function Chapter({
  num,
  title,
  children,
  startPage,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
  startPage?: boolean;
}) {
  return (
    <section className={`ax-chapter${startPage ? " ax-page" : ""}`}>
      {startPage ? <div className="ax-pad" aria-hidden="true" /> : null}
      <header className="ax-chapter-head">
        <span className="ax-chapter-num" aria-hidden="true">
          {num}
        </span>
        <h2 className="ax-chapter-title">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function RuleLabel({ children }: { children: React.ReactNode }) {
  return <p className="ax-rule-label">{children}</p>;
}

type Props = {
  config: TravelReportConfig;
  className?: string;
  /** Sichtbare Bildschirm-Vorschau (kein print:hidden). */
  preview?: boolean;
  locale?: string;
  "data-print-active"?: string;
};

/**
 * Print-Variante «Atlas»: Magazin-/Field-Guide-Layout.
 * Gleicher Inhalt & Slot-Budgets wie Klassik – andere Optik.
 */
export default function TravelReportPrintDocumentAtlas({
  config,
  className = "",
  preview = false,
  locale = "de",
  "data-print-active": dataPrintActive,
}: Props) {
  const m = buildTravelReportPrintModel(config, locale);
  const copy = getPrintAtlasCopy(locale);

  return (
    <div
      className={`print-doc print-doc--atlas${preview ? " print-doc--atlas-preview" : ""} ${className}`.trim()}
      data-print-variant="atlas"
      data-print-active={dataPrintActive}
      data-locale={locale}
    >
      {/* Cover: volle Breite (kein Seiten-Padding am Root) */}
      <div className="ax-sheet-1">
        <section className="ax-cover">
          <div className="ax-cover-hero">
            <AtlasCoverImage
              src={config.hero.photo}
              alt={config.hero.photoAlt}
              className="ax-cover-img"
            />
            <div className="ax-cover-scrim" aria-hidden="true" />
            <div className="ax-cover-top">
              <span className="ax-brand">SnifferTrek</span>
              <span className="ax-cover-tag">{copy.tag}</span>
            </div>
            <div className="ax-cover-bottom">
              <h1 className="ax-cover-title">{config.hero.title}</h1>
              <p className="ax-cover-sub">{config.hero.subtitle}</p>
              <p className="ax-cover-meta">
                {config.hero.duration}
                <span className="ax-dot" aria-hidden="true" />
                {TRAVEL_COUPLE.displayName}
              </p>
            </div>
          </div>
        </section>

        <div className="ax-inner">
          <p className="ax-cover-lead">
            <PrintRich text={m.page1Lead} />
          </p>

          <Chapter num="01" title={copy.overview}>
        <div className="ax-split">
          <div className="ax-split-main">
            <RuleLabel>{copy.mustSees}</RuleLabel>
            <ol className="ax-index">
              {m.mustSees.map((item, i) => (
                <li key={item.id}>
                  <span className="ax-badge ax-badge-num">{i + 1}</span>
                  <span className="ax-index-label">
                    {trimToMaxChars(item.label, PRINT_PAGE1.markerLabelMaxChars)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <aside className="ax-split-side">
            <div className="ax-fact">
              <p className="ax-fact-k">{copy.quarters}</p>
              <p className="ax-fact-v">{m.quarters}</p>
            </div>
            <div className="ax-fact">
              <p className="ax-fact-k">{copy.transport}</p>
              <p className="ax-fact-v">{m.transport}</p>
            </div>
            <div className="ax-fact">
              <p className="ax-fact-k">{copy.rhythm}</p>
              <p className="ax-fact-v">
                <PrintRich text={m.rhythm} />
              </p>
            </div>
          </aside>
        </div>

        <div className="ax-callout">
          <p className="ax-callout-title">{config.specialCallout.title}</p>
          <p className="ax-body">
            <PrintRich text={m.calloutBody} />
          </p>
          {m.calloutBullets.length > 0 ? (
            <ul className="ax-bullets">
              {m.calloutBullets.map((b) => (
                <li key={b}>{printText(b)}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="ax-map-block">
          <div className="ax-map-copy">
            <RuleLabel>{copy.freeAlmost}</RuleLabel>
            <ul className="ax-index ax-index-compact">
              {m.orte.map((o, i) => (
                <li key={o.id}>
                  <span className="ax-badge ax-badge-letter">{markerLetter(i)}</span>
                  <span>
                    <span className="ax-index-label">
                      {trimToMaxChars(o.label, PRINT_PAGE1.markerLabelMaxChars)}
                    </span>
                    {o.note ? (
                      <span className="ax-muted">
                        {" "}
                        · {trimToMaxChars(o.note, PRINT_PAGE1.orteNoteMaxChars)}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
            <p className="ax-legend">
              <span className="ax-badge ax-badge-num">1</span> {copy.mustSees}
              <span className="ax-badge ax-badge-letter ax-ml">A</span> {copy.places}
            </p>
          </div>
          <div className="ax-map-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.mapUrl}
              alt={copy.mapAlt}
              className="ax-map-img"
              width={520}
              height={640}
              loading="eager"
              decoding="sync"
            />
          </div>
        </div>
      </Chapter>

          {/* Dauer-Raster füllt Seite 1 – Plan-Details folgen auf Seite 2 */}
          <div className="ax-page1-teaser">
            <RuleLabel>{copy.howManyDays}</RuleLabel>
            <div className="ax-duration">
              {m.durationOpts.map((opt) => (
                <div key={opt.days} className="ax-duration-item">
                  <p className="ax-duration-days">{opt.days}</p>
                  <p className="ax-body">{printText(opt.summary)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="ax-inner">
      {/* —— 02 PLAN —— */}
      <Chapter num="02" title={copy.plan} startPage>
        <RuleLabel>{config.itinerary.title}</RuleLabel>
        <div className="ax-days">
          {m.itineraryDays.map((day) => (
            <article key={day.day} className="ax-day">
              <div className="ax-day-rail" aria-hidden="true" />
              <div className="ax-day-num">{day.day}</div>
              <div className="ax-day-body">
                <h3 className="ax-day-title">{day.title}</h3>
                <ul className="ax-bullets">
                  {day.items.map((item) => (
                    <li key={item}>{printText(item)}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        <RuleLabel>{config.arrival.parking.title}</RuleLabel>
        {m.parkingIntro ? (
          <p className="ax-body ax-mb">{printText(m.parkingIntro)}</p>
        ) : null}
        <div className="ax-stack">
          {m.parkingItems.map((p) => (
            <div key={p.name} className="ax-row">
              <p className="ax-row-title">
                {p.name}
                {p.subtitle || p.price ? (
                  <span className="ax-muted">
                    {" "}
                    · {[p.subtitle, p.price].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
              </p>
              <p className="ax-body">{printText(p.description)}</p>
            </div>
          ))}
        </div>

        <RuleLabel>{config.arrival.transferTitle}</RuleLabel>
        <div className="ax-transfer">
          {m.transfers.map((t) => (
            <div key={t.title} className="ax-transfer-item">
              <p className="ax-row-title">
                {t.title}
                <span className="ax-muted"> · {t.price}</span>
              </p>
              <p className="ax-muted">{printText(t.body)}</p>
            </div>
          ))}
        </div>
      </Chapter>

      {/* —— 03 UNTERWEGS —— */}
      <Chapter num="03" title={copy.onTheGo} startPage>
        <div className="ax-stories">
          {m.storySections.map((section, idx) => (
            <article key={section.id} className="ax-story">
              <p className="ax-story-idx">{String(idx + 1).padStart(2, "0")}</p>
              <div>
                {section.kicker ? (
                  <p className="ax-story-kicker">{section.kicker}</p>
                ) : null}
                <h3 className="ax-story-title">{section.title}</h3>
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="ax-body">
                    <PrintRich text={p} />
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Chapter>

      {/* —— 04 PRAXIS —— */}
      <Chapter num="04" title={copy.practice} startPage>
        <RuleLabel>{config.specialVenueList.title}</RuleLabel>
        {m.venueIntro ? (
          <p className="ax-body ax-mb">{printText(m.venueIntro)}</p>
        ) : null}
        <div className="ax-stack">
          {m.venueItems.map((item) => (
            <div key={item.name} className="ax-row">
              <p className="ax-row-title">
                {item.name}
                <span className="ax-muted">
                  {" "}
                  · {[item.subtitle, item.price, item.duration]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </p>
              <p className="ax-body">{printText(item.description)}</p>
            </div>
          ))}
        </div>

        <RuleLabel>{config.mustSees.heading}</RuleLabel>
        <ol className="ax-ol">
          {m.mustSeeItems.map((item) => (
            <li key={item}>{printText(item)}</li>
          ))}
        </ol>

        <RuleLabel>{config.guideCards.title}</RuleLabel>
        <div className="ax-stack">
          {m.guideCards.map((card) => (
            <div key={card.id} className="ax-row">
              <p className="ax-row-title">
                {card.title}
                <span className="ax-muted">
                  {" "}
                  · {card.price} · {card.timing}
                </span>
              </p>
              <p className="ax-body">{card.body}</p>
            </div>
          ))}
        </div>

        {m.favoriteSpots.length > 0 ? (
          <>
            <RuleLabel>{copy.favorites}</RuleLabel>
            <div className="ax-stack">
              {m.favoriteSpots.map((spot) => (
                <div key={spot.id} className="ax-row">
                  <p className="ax-row-title">
                    {spot.name}
                    <span className="ax-muted"> · {spot.type}</span>
                  </p>
                  <p className="ax-body">{printText(spot.note)}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div className="ax-page">
          <div className="ax-pad" aria-hidden="true" />
          <RuleLabel>{config.budget.title}</RuleLabel>
          <p className="ax-muted ax-mb">{config.budget.priceStandLabel}</p>
          <table className="ax-table">
            <tbody>
              {m.budgetLines.map((line) => (
                <tr key={line.label}>
                  <td className="ax-row-title">{line.label}</td>
                  <td className="ax-muted">{line.note ?? ""}</td>
                  <td className="ax-price">{line.price}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <RuleLabel>{copy.seasonOverview}</RuleLabel>
          <table className="ax-table">
            <thead>
              <tr>
                <th>{copy.season}</th>
                <th>{copy.months}</th>
                <th>{copy.temp}</th>
                <th>{copy.crowd}</th>
                <th>{copy.note}</th>
              </tr>
            </thead>
            <tbody>
              {m.seasonRows.map((r) => (
                <tr key={r.season}>
                  <td className="ax-row-title">{r.season}</td>
                  <td>{r.months}</td>
                  <td>{r.temp}</td>
                  <td>{r.crowd}</td>
                  <td className="ax-muted">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {m.events.length > 0 ? (
            <>
              <RuleLabel>{copy.events}</RuleLabel>
              <div className="ax-stack">
                {m.events.map((e) => (
                  <div key={e.name} className="ax-row">
                    <p className="ax-row-title">
                      {e.name}
                      <span className="ax-muted"> · {e.when}</span>
                    </p>
                    <p className="ax-body">{printText(e.note)}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </Chapter>

      {/* —— 05 FAQ —— */}
      <Chapter num="05" title={copy.faq} startPage>
        <p className="ax-section-sub">{config.faq.title}</p>
        <div className="ax-faq">
          {m.faqItems.map((item) => (
            <div key={item.question} className="ax-faq-item">
              <p className="ax-faq-q">{printText(item.question)}</p>
              <p className="ax-body">{printText(item.answer)}</p>
            </div>
          ))}
        </div>
      </Chapter>

      {/* —— 06 ANHANG —— */}
      <Chapter num="06" title={copy.appendix} startPage>
        <RuleLabel>{copy.stay}</RuleLabel>
        <p className="ax-body ax-mb">{printText(m.hotelIntro)}</p>
        <div className="ax-stack">
          {m.hotelPicks.map((h) => (
            <div key={h.id} className="ax-row">
              <p className="ax-row-title">
                {h.name} ({h.stars})
                <span className="ax-muted">
                  {" "}
                  · {[h.area, h.audience].filter(Boolean).join(" · ")}
                </span>
              </p>
              <p className="ax-body">{printText(h.note)}</p>
            </div>
          ))}
        </div>

        <RuleLabel>{copy.infoTitle}</RuleLabel>
        {m.infoParagraphs.map((p) => (
          <p key={p.slice(0, 40)} className="ax-body">
            {printText(p)}
          </p>
        ))}

        <RuleLabel>{config.generalInfo.title}</RuleLabel>
        <div className="ax-stack">
          {m.generalSections.map((s) => (
            <div key={s.heading} className="ax-row">
              <p className="ax-row-title">{s.heading}</p>
              <p className="ax-body">{printText(s.body)}</p>
            </div>
          ))}
        </div>
      </Chapter>

      <section className="ax-outro">
        <p className="ax-outro-text">
          <PrintRich text={m.closing} />
        </p>
        <p className="ax-outro-meta">
          {config.hero.experienceNote} · {TRAVEL_COUPLE.displayName} · sniffertrek.com
        </p>
      </section>
      </div>
    </div>
  );
}
