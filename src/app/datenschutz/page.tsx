import { ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Datenschutzerklärung – SnifferTrek",
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Datenschutzerklärung
          </h1>
        </div>

        <div className="prose prose-gray max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. Allgemeines
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Der Schutz deiner persönlichen Daten ist uns ein wichtiges
              Anliegen. In dieser Datenschutzerklärung informieren wir dich über
              die Verarbeitung personenbezogener Daten bei der Nutzung von
              SnifferTrek.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Verantwortlich für die Datenverarbeitung ist:
            </p>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mt-3">
              <p className="text-gray-700">
                <strong>SnifferTrek</strong>
                <br />
                Josef Zwyssig
                <br />
                E-Mail:{" "}
                <a
                  href="mailto:info@sniffertrek.com"
                  className="text-blue-600 hover:text-blue-800"
                >
                  info@sniffertrek.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. Erhobene Daten
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Bei der Nutzung von SnifferTrek können folgende Daten erhoben
              werden:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
              <li>
                <strong>Technische Daten:</strong> IP-Adresse, Browsertyp,
                Betriebssystem, Zugriffszeit (automatisch durch den Webserver)
              </li>
              <li>
                <strong>Nutzungsdaten:</strong> Besuchte Seiten, Reiseziele,
                Suchanfragen (anonymisiert)
              </li>
              <li>
                <strong>Kontaktdaten:</strong> Name und E-Mail-Adresse, sofern
                du uns kontaktierst
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. Zweck der Datenverarbeitung
            </h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Bereitstellung und Verbesserung des Services</li>
              <li>Personalisierung der Reiseplanung</li>
              <li>Weiterleitung an Buchungspartner (nur bei Buchung)</li>
              <li>Analyse zur Verbesserung der Website (anonymisiert)</li>
              <li>Beantwortung von Anfragen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              4. Affiliate-Partner & Drittanbieter
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Wenn du über SnifferTrek einen externen Buchungslink anklickst
              (z.B. Booking.com, Expedia, Skyscanner), wirst du auf die Website
              des jeweiligen Anbieters weitergeleitet. Ab diesem Zeitpunkt gelten
              die Datenschutzbestimmungen des jeweiligen Partners.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              SnifferTrek erhält gegebenenfalls eine Provision für vermittelte
              Buchungen. Es werden keine persönlichen Daten an Affiliate-Partner
              übermittelt – lediglich ein Tracking-Cookie ermöglicht die
              Zuordnung der Buchung.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. Cookies
            </h2>
            <p className="text-gray-600 leading-relaxed">
              SnifferTrek verwendet Cookies, um die Funktionalität der Website
              sicherzustellen und dein Nutzungserlebnis zu verbessern. Es werden
              folgende Cookie-Typen eingesetzt:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
              <li>
                <strong>Technisch notwendige Cookies:</strong> Für die
                Grundfunktionen der Website
              </li>
              <li>
                <strong>Analyse-Cookies:</strong> Zur anonymisierten
                Auswertung der Websitenutzung
              </li>
              <li>
                <strong>Affiliate-Cookies:</strong> Zur Zuordnung von Buchungen
                an SnifferTrek
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Du kannst Cookies jederzeit in deinem Browser deaktivieren. Dies
              kann jedoch die Funktionalität der Website einschränken.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              6. Hosting
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Diese Website wird bei Vercel Inc. (San Francisco, USA) gehostet.
              Die Server befinden sich in verschiedenen Rechenzentren weltweit.
              Vercel verarbeitet technische Daten (z.B. IP-Adressen) gemäss ihrer
              eigenen Datenschutzrichtlinie.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. Deine Rechte
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Du hast jederzeit das Recht auf:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
              <li>Auskunft über deine gespeicherten Daten</li>
              <li>Berichtigung unrichtiger Daten</li>
              <li>Löschung deiner Daten</li>
              <li>Einschränkung der Verarbeitung</li>
              <li>Widerspruch gegen die Verarbeitung</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Wende dich hierzu an:{" "}
              <a
                href="mailto:info@sniffertrek.com"
                className="text-blue-600 hover:text-blue-800"
              >
                info@sniffertrek.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              8. Änderungen
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Wir behalten uns vor, diese Datenschutzerklärung jederzeit
              anzupassen. Die aktuelle Version ist stets auf dieser Seite
              einsehbar.
            </p>
            <p className="text-gray-500 text-sm mt-4">
              Stand: Februar 2026
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
