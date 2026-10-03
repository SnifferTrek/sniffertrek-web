import { Scale } from "lucide-react";
import { SITE_LEGAL } from "@/lib/siteLegal";

export const metadata = {
 title: "Impressum – SnifferTrek",
};

export default function ImpressumPage() {
 return (
 <div className="legal-apple">
 <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="legal-apple__card">
 <div className="flex items-center gap-3 mb-10">
 <div className="legal-apple__icon">
 <Scale className="w-5 h-5" />
 </div>
 <h1 className="legal-apple__title">Impressum</h1>
 </div>

 <div>
 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">Anbieter</h2>
 <div className="legal-apple__box">
 <p>
 <strong>{SITE_LEGAL.brand}</strong>
 <br />
 ein Angebot der
 <br />
 <br />
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
 Website:{" "}
 <a href={SITE_LEGAL.website}>{SITE_LEGAL.website.replace("https://", "")}</a>
 <br />
 E-Mail:{" "}
 <a href={`mailto:${SITE_LEGAL.email}`}>{SITE_LEGAL.email}</a>
 </p>
 </div>
 <p className="legal-apple__p">
 Angaben gemäss Schweizer Recht (UWG). Kontakt bevorzugt per E-Mail.
 </p>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">Kontakt</h2>
 <p className="legal-apple__p">
 Für inhaltliche und rechtliche Anfragen:{" "}
 <a href={`mailto:${SITE_LEGAL.email}`}>{SITE_LEGAL.email}</a>
 </p>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">Haftungsausschluss</h2>
 <p className="legal-apple__p">
 Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen
 Richtigkeit, Genauigkeit, Aktualität, Zuverlässigkeit und
 Vollständigkeit der Informationen.
 </p>
 <p className="legal-apple__p">
 Haftungsansprüche gegen den Autor wegen Schäden materieller oder
 immaterieller Art, welche aus dem Zugriff oder der Nutzung bzw.
 Nichtnutzung der veröffentlichten Informationen, durch Missbrauch
 der Verbindung oder durch technische Störungen entstanden sind,
 werden ausgeschlossen.
 </p>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">Haftung für Links</h2>
 <p className="legal-apple__p">
 Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres
 Verantwortungsbereichs. Es wird jegliche Verantwortung für solche
 Webseiten abgelehnt. Der Zugriff und die Nutzung solcher Webseiten
 erfolgen auf eigene Gefahr des Nutzers.
 </p>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">Urheberrechte</h2>
 <p className="legal-apple__p">
 Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos
 oder anderen Dateien auf der Website gehören ausschliesslich
 {SITE_LEGAL.brand} oder den speziell genannten Rechtsinhabern. Für die
 Reproduktion jeglicher Elemente ist die schriftliche Zustimmung der
 Urheberrechtsträger im Voraus einzuholen.
 </p>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">Affiliate-Hinweis</h2>
 <p className="legal-apple__p">
 {SITE_LEGAL.brand} enthält Affiliate-Links zu Reise-Anbietern. Wenn du
 über diese Links buchst, erhalten wir eine Provision – für dich
 entstehen keine zusätzlichen Kosten. Dies ermöglicht es uns, den
 Service kostenlos anzubieten.
 </p>
 </section>

 <section className="legal-apple__section">
 <h2 className="legal-apple__h2">Streitbeilegung</h2>
 <p className="legal-apple__p">
 {SITE_LEGAL.brand} ist nicht verpflichtet und nicht bereit, an
 Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
 teilzunehmen.
 </p>
 </section>
 </div>
 </div>
 </div>
 </div>
 );
}
