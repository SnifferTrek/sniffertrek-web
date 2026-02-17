import { FileText } from "lucide-react";

export const metadata = {
  title: "AGB – SnifferTrek",
};

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Allgemeine Geschäftsbedingungen
          </h1>
        </div>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. Geltungsbereich
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung
              der Website sniffertrek.com und der zugehörigen Dienste
              (nachfolgend &quot;SnifferTrek&quot;). Mit der Nutzung von SnifferTrek
              akzeptierst du diese AGB.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. Leistungsbeschreibung
            </h2>
            <p className="text-gray-600 leading-relaxed">
              SnifferTrek ist ein kostenloser Reiseplanungs-Service, der
              Nutzern ermöglicht:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
              <li>Reiserouten zu planen und zu verwalten</li>
              <li>Hotels, Flüge und Mietwagen zu vergleichen</li>
              <li>Sehenswürdigkeiten zu entdecken und in Bucket Lists zu speichern</li>
              <li>Über Partnerlinks direkt bei Anbietern zu buchen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. Vermittlung & Buchung
            </h2>
            <p className="text-gray-600 leading-relaxed">
              SnifferTrek ist ein <strong>Vermittler</strong> und kein
              Reiseveranstalter. Buchungen werden direkt beim jeweiligen
              Drittanbieter (z.B. Booking.com, Expedia, Skyscanner)
              abgeschlossen. Für diese Buchungen gelten ausschliesslich die AGB
              des jeweiligen Anbieters.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              SnifferTrek übernimmt keine Haftung für:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
              <li>Die Verfügbarkeit von Angeboten bei Drittanbietern</li>
              <li>Die Richtigkeit von Preisen auf Partner-Websites</li>
              <li>Die Leistungserbringung durch Drittanbieter</li>
              <li>Stornierungen oder Änderungen durch Anbieter</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              4. Affiliate-Partnerschaften
            </h2>
            <p className="text-gray-600 leading-relaxed">
              SnifferTrek finanziert sich durch Affiliate-Provisionen. Wenn du
              über einen Link auf SnifferTrek eine Buchung bei einem Partner
              tätigst, erhält SnifferTrek eine Vermittlungsprovision. Für dich
              entstehen dadurch keine Mehrkosten.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. Gewährleistung & Haftung
            </h2>
            <p className="text-gray-600 leading-relaxed">
              SnifferTrek wird &quot;as is&quot; bereitgestellt. Wir bemühen uns um
              korrekte und aktuelle Informationen, können jedoch keine Garantie
              für Vollständigkeit, Richtigkeit oder Aktualität übernehmen.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Die Haftung für leichte Fahrlässigkeit wird ausgeschlossen, soweit
              gesetzlich zulässig.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              6. Geistiges Eigentum
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Alle Inhalte, Designs und Funktionen von SnifferTrek sind
              urheberrechtlich geschützt. Eine Vervielfältigung oder Nutzung ohne
              schriftliche Genehmigung ist untersagt.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. Nutzungsbedingungen
            </h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
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

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              8. Anwendbares Recht
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Es gilt Schweizer Recht. Gerichtsstand ist die Schweiz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              9. Änderungen
            </h2>
            <p className="text-gray-600 leading-relaxed">
              SnifferTrek behält sich das Recht vor, diese AGB jederzeit zu
              ändern. Die jeweils aktuelle Fassung ist auf dieser Seite abrufbar.
            </p>
            <p className="text-gray-500 text-sm mt-4">Stand: Februar 2026</p>
          </section>
        </div>
      </div>
    </div>
  );
}
