import { FileText } from "lucide-react";

export const metadata = {
 title: "AGB – SnifferTrek",
};

export default function AGBPage() {
 return (
 <div className="legal-apple">
 <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="legal-apple__card">
 <div className="flex items-center gap-3 mb-10">
 <div className="legal-apple__icon">
 <FileText className="w-5 h-5" />
 </div>
 <h1 className="legal-apple__title">Allgemeine Geschäftsbedingungen</h1>
 </div>

 <div>
 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">1. Geltungsbereich</h2>
 <p className="legal-apple__p">
 Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung
 der Website sniffertrek.com und der zugehörigen Dienste
 (nachfolgend &quot;SnifferTrek&quot;). Mit der Nutzung von SnifferTrek
 akzeptierst du diese AGB.
 </p>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">2. Leistungsbeschreibung</h2>
 <p className="legal-apple__p">
 SnifferTrek ist ein kostenloser Reiseplanungs-Service, der
 Nutzern ermöglicht:
 </p>
 <ul className="legal-apple__list">
 <li>Reiserouten zu planen und zu verwalten</li>
 <li>Hotels, Flüge und Mietwagen zu vergleichen</li>
 <li>Sehenswürdigkeiten zu entdecken und in Bucket Lists zu speichern</li>
 <li>Über Partnerlinks direkt bei Anbietern zu buchen</li>
 </ul>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">3. Vermittlung & Buchung</h2>
 <p className="legal-apple__p">
 SnifferTrek ist ein <strong>Vermittler</strong> und kein
 Reiseveranstalter. Buchungen werden direkt beim jeweiligen
 Drittanbieter (z.B. Booking.com, Expedia, Skyscanner)
 abgeschlossen. Für diese Buchungen gelten ausschliesslich die AGB
 des jeweiligen Anbieters.
 </p>
 <p className="legal-apple__p">
 SnifferTrek übernimmt keine Haftung für:
 </p>
 <ul className="legal-apple__list">
 <li>Die Verfügbarkeit von Angeboten bei Drittanbietern</li>
 <li>Die Richtigkeit von Preisen auf Partner-Websites</li>
 <li>Die Leistungserbringung durch Drittanbieter</li>
 <li>Stornierungen oder Änderungen durch Anbieter</li>
 </ul>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">4. Affiliate-Partnerschaften</h2>
 <p className="legal-apple__p">
 SnifferTrek finanziert sich durch Affiliate-Provisionen. Wenn du
 über einen Link auf SnifferTrek eine Buchung bei einem Partner
 tätigst, erhält SnifferTrek eine Vermittlungsprovision. Für dich
 entstehen dadurch keine Mehrkosten.
 </p>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">5. Gewährleistung & Haftung</h2>
 <p className="legal-apple__p">
 SnifferTrek wird &quot;as is&quot; bereitgestellt. Wir bemühen uns um
 korrekte und aktuelle Informationen, können jedoch keine Garantie
 für Vollständigkeit, Richtigkeit oder Aktualität übernehmen.
 </p>
 <p className="legal-apple__p">
 Die Haftung für leichte Fahrlässigkeit wird ausgeschlossen, soweit
 gesetzlich zulässig.
 </p>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">6. Geistiges Eigentum</h2>
 <p className="legal-apple__p">
 Alle Inhalte, Designs und Funktionen von SnifferTrek sind
 urheberrechtlich geschützt. Eine Vervielfältigung oder Nutzung ohne
 schriftliche Genehmigung ist untersagt.
 </p>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">7. Nutzungsbedingungen</h2>
 <ul className="legal-apple__list !mt-0">
 <li>Die Nutzung von SnifferTrek ist kostenlos</li>
 <li>
 Eine missbräuchliche Nutzung (z.B. automatisierte Abfragen,
 Scraping) ist untersagt
 </li>
 <li>
 SnifferTrek behält sich vor, den Zugang bei Verstössen zu
 sperren
 </li>
 </ul>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">8. Anwendbares Recht</h2>
 <p className="legal-apple__p">
 Es gilt Schweizer Recht. Gerichtsstand ist die Schweiz.
 </p>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">9. Änderungen</h2>
 <p className="legal-apple__p">
 SnifferTrek behält sich das Recht vor, diese AGB jederzeit zu
 ändern. Die jeweils aktuelle Fassung ist auf dieser Seite abrufbar.
 </p>
 <p className="legal-apple__meta">Stand: Februar 2026</p>
 </section>
 </div>
 </div>
 </div>
 </div>
 );
}
