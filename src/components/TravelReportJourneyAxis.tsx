export type JourneyAxisStop = {
  nights: string;
  place: string;
  note: string;
};

type TravelReportJourneyAxisProps = {
  id?: string;
  title?: string;
  subtitle?: string;
  stops: readonly JourneyAxisStop[];
  outro?: string;
};

export default function TravelReportJourneyAxis({
  id = "route-achse",
  title = "Die Route in drei Basen",
  subtitle = "Küste, nicht Autobahn – Provence erst auf der Rückfahrt.",
  stops,
  outro,
}: TravelReportJourneyAxisProps) {
  return (
    <section id={id} className="travel-report-axis scroll-mt-24">
      <div className="travel-report-axis__head">
        <p className="travel-report-axis__kicker">Achse</p>
        <h2 className="travel-report-axis__title">{title}</h2>
        {subtitle ? <p className="travel-report-axis__subtitle">{subtitle}</p> : null}
      </div>

      <ol className="travel-report-axis__track">
        {stops.map((stop, index) => (
          <li key={stop.place} className="travel-report-axis__stop">
            <span className="travel-report-axis__dot" aria-hidden>
              {index + 1}
            </span>
            <p className="travel-report-axis__nights">{stop.nights}</p>
            <p className="travel-report-axis__place">{stop.place}</p>
            <p className="travel-report-axis__note">{stop.note}</p>
          </li>
        ))}
      </ol>

      {outro ? <p className="travel-report-axis__outro">{outro}</p> : null}
    </section>
  );
}
