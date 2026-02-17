import { Scale } from "lucide-react";

export const metadata = {
  title: "Impressum – SnifferTrek",
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Scale className="w-5 h-5 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Impressum</h1>
        </div>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Angaben gemäss Schweizer Recht
            </h2>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <p className="text-gray-700 leading-relaxed">
                <strong>SnifferTrek</strong>
                <br />
                Josef Zwyssig
                <br />
                Schweiz
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Kontakt
            </h2>
            <p className="text-gray-600 leading-relaxed">
              E-Mail:{" "}
              <a
                href="mailto:info@sniffertrek.com"
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                info@sniffertrek.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Haftungsausschluss
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen
              Richtigkeit, Genauigkeit, Aktualität, Zuverlässigkeit und
              Vollständigkeit der Informationen.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Haftungsansprüche gegen den Autor wegen Schäden materieller oder
              immaterieller Art, welche aus dem Zugriff oder der Nutzung bzw.
              Nichtnutzung der veröffentlichten Informationen, durch Missbrauch
              der Verbindung oder durch technische Störungen entstanden sind,
              werden ausgeschlossen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Haftung für Links
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres
              Verantwortungsbereichs. Es wird jegliche Verantwortung für solche
              Webseiten abgelehnt. Der Zugriff und die Nutzung solcher Webseiten
              erfolgen auf eigene Gefahr des Nutzers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Urheberrechte
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos
              oder anderen Dateien auf der Website gehören ausschliesslich
              SnifferTrek oder den speziell genannten Rechtsinhabern. Für die
              Reproduktion jeglicher Elemente ist die schriftliche Zustimmung der
              Urheberrechtsträger im Voraus einzuholen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Affiliate-Hinweis
            </h2>
            <p className="text-gray-600 leading-relaxed">
              SnifferTrek enthält Affiliate-Links zu Reise-Anbietern. Wenn du
              über diese Links buchst, erhalten wir eine Provision – für dich
              entstehen keine zusätzlichen Kosten. Dies ermöglicht es uns, den
              Service kostenlos anzubieten.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
