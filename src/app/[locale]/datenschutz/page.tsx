import { ShieldCheck } from "lucide-react";
import { SITE_LEGAL } from "@/lib/siteLegal";

export const metadata = {
 title: "Datenschutzerklärung – SnifferTrek",
};

export default function DatenschutzPage() {
 return (
 <div className="legal-apple">
 <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="legal-apple__card">
 <div className="flex items-center gap-3 mb-10">
 <div className="legal-apple__icon">
 <ShieldCheck className="w-5 h-5" />
 </div>
 <h1 className="legal-apple__title">Datenschutzerklärung</h1>
 </div>

 <div>
 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">1. Allgemeines</h2>
 <p className="legal-apple__p">
 Der Schutz deiner persönlichen Daten ist uns ein wichtiges
 Anliegen. In dieser Datenschutzerklärung informieren wir dich über
 die Verarbeitung personenbezogener Daten bei der Nutzung von
 SnifferTrek.
 </p>
 <p className="legal-apple__p">
 Verantwortlich für die Datenverarbeitung ist:
 </p>
 <div className="legal-apple__box">
 <p>
 <strong>{SITE_LEGAL.operator}</strong>
 <br />
 {SITE_LEGAL.legalForm}
 <br />
 {SITE_LEGAL.city}
 <br />
 {SITE_LEGAL.country}
 <br />
 UID: {SITE_LEGAL.uid}
 <br />
 E-Mail:{" "}
 <a href={`mailto:${SITE_LEGAL.email}`}>{SITE_LEGAL.email}</a>
 </p>
 </div>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">2. Erhobene Daten</h2>
 <p className="legal-apple__p">
 Bei der Nutzung von SnifferTrek können folgende Daten erhoben
 werden:
 </p>
 <ul className="legal-apple__list">
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

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">3. Zweck der Datenverarbeitung</h2>
 <ul className="legal-apple__list !mt-0">
 <li>Bereitstellung und Verbesserung des Services</li>
 <li>Personalisierung der Reiseplanung</li>
 <li>Weiterleitung an Buchungspartner (nur bei Buchung)</li>
 <li>Analyse zur Verbesserung der Website (anonymisiert)</li>
 <li>Beantwortung von Anfragen</li>
 </ul>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">4. Affiliate-Partner & Drittanbieter</h2>
 <p className="legal-apple__p">
 Wenn du über SnifferTrek einen externen Buchungslink anklickst
 (z.B. Booking.com, Expedia, Skyscanner), wirst du auf die Website
 des jeweiligen Anbieters weitergeleitet. Ab diesem Zeitpunkt gelten
 die Datenschutzbestimmungen des jeweiligen Partners.
 </p>
 <p className="legal-apple__p">
 SnifferTrek erhält gegebenenfalls eine Provision für vermittelte
 Buchungen. Es werden keine persönlichen Daten an Affiliate-Partner
 übermittelt – lediglich ein Tracking-Cookie ermöglicht die
 Zuordnung der Buchung.
 </p>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">5. Cookies</h2>
 <p className="legal-apple__p">
 SnifferTrek verwendet Cookies, um die Funktionalität der Website
 sicherzustellen und dein Nutzungserlebnis zu verbessern. Es werden
 folgende Cookie-Typen eingesetzt:
 </p>
 <ul className="legal-apple__list">
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
 <p className="legal-apple__p">
 Du kannst Cookies jederzeit in deinem Browser deaktivieren. Dies
 kann jedoch die Funktionalität der Website einschränken.
 </p>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">6. Hosting</h2>
 <p className="legal-apple__p">
 Diese Website wird bei Vercel Inc. (San Francisco, USA) gehostet.
 Die Server befinden sich in verschiedenen Rechenzentren weltweit.
 Vercel verarbeitet technische Daten (z.B. IP-Adressen) gemäss ihrer
 eigenen Datenschutzrichtlinie.
 </p>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">7. Deine Rechte</h2>
 <p className="legal-apple__p">Du hast jederzeit das Recht auf:</p>
 <ul className="legal-apple__list">
 <li>Auskunft über deine gespeicherten Daten</li>
 <li>Berichtigung unrichtiger Daten</li>
 <li>Löschung deiner Daten</li>
 <li>Einschränkung der Verarbeitung</li>
 <li>Widerspruch gegen die Verarbeitung</li>
 </ul>
 <p className="legal-apple__p">
 Wende dich hierzu an:{" "}
 <a href="mailto:info@sniffertrek.com">info@sniffertrek.com</a>
 </p>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">8. Änderungen</h2>
 <p className="legal-apple__p">
 Wir behalten uns vor, diese Datenschutzerklärung jederzeit
 anzupassen. Die aktuelle Version ist stets auf dieser Seite
 einsehbar.
 </p>
 <p className="legal-apple__meta">Stand: Februar 2026</p>
 </section>
 </div>
 </div>
 </div>
 </div>
 );
}
