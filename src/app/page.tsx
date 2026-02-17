export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌍</span>
              <span className="text-xl font-bold text-gray-900">
                Sniffer<span className="text-blue-600">Trek</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
                So funktioniert&apos;s
              </a>
              <a href="#services" className="text-gray-600 hover:text-gray-900 transition-colors">
                Services
              </a>
              <a
                href="#cta"
                className="bg-blue-600 text-white px-5 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                Reise planen
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <span>✨</span> Alles in einem Tool – kostenlos
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Plane deine Traumreise.
              <br />
              <span className="text-blue-600">Vergleiche & buche direkt.</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Route planen, Hotels vergleichen, Flüge finden, Sehenswürdigkeiten entdecken –
              alles an einem Ort. Spare Zeit und Geld bei deiner nächsten Reise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#cta"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-all hover:scale-105 shadow-lg shadow-blue-600/25"
              >
                🗺️ Jetzt Reise planen
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-full text-lg font-semibold border border-gray-200 hover:border-gray-300 transition-colors"
              >
                Mehr erfahren
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto">
            {[
              { value: "1000+", label: "Sehenswürdigkeiten" },
              { value: "50+", label: "Länder" },
              { value: "100%", label: "Kostenlos" },
              { value: "1", label: "Tool für alles" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Alles, was du für deine Reise brauchst
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Von der ersten Idee bis zur fertigen Buchung – SnifferTrek begleitet dich bei jedem Schritt.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "🗺️",
                title: "Routenplanung",
                description:
                  "Plane deine Route mit Zwischenstopps, berechne Distanzen und Fahrzeiten – für Auto, Zug oder Fahrrad.",
                color: "bg-blue-50 border-blue-100",
              },
              {
                icon: "🏨",
                title: "Hotels vergleichen",
                description:
                  "Finde die besten Hotels entlang deiner Route. Vergleiche Preise von Booking.com, Expedia und mehr.",
                color: "bg-purple-50 border-purple-100",
              },
              {
                icon: "✈️",
                title: "Flüge buchen",
                description:
                  "Suche und vergleiche Flüge von hunderten Airlines. Finde den besten Preis für deine Reisedaten.",
                color: "bg-cyan-50 border-cyan-100",
              },
              {
                icon: "📍",
                title: "Sehenswürdigkeiten",
                description:
                  "Entdecke über 1000 Points of Interest weltweit. Erstelle deine persönliche Bucket List.",
                color: "bg-green-50 border-green-100",
              },
              {
                icon: "🚗",
                title: "Mietwagen",
                description:
                  "Vergleiche Mietwagen-Angebote am Zielort. Von Kleinwagen bis SUV – zum besten Preis.",
                color: "bg-orange-50 border-orange-100",
              },
              {
                icon: "🛡️",
                title: "Reiseversicherung",
                description:
                  "Schütze deine Reise mit der passenden Versicherung. Vergleiche Angebote und buche direkt.",
                color: "bg-red-50 border-red-100",
              },
              {
                icon: "🚢",
                title: "Kreuzfahrten",
                description:
                  "Traumhafte Kreuzfahrten entdecken und buchen. Von Mittelmeer bis Karibik.",
                color: "bg-teal-50 border-teal-100",
              },
              {
                icon: "🚂",
                title: "Zug-Tickets",
                description:
                  "Europaweit Zugverbindungen finden und Tickets buchen. Schnell und bequem reisen.",
                color: "bg-indigo-50 border-indigo-100",
              },
              {
                icon: "📱",
                title: "eSIM",
                description:
                  "Bleibe weltweit verbunden. Finde die beste eSIM für dein Reiseziel – ohne Roaming-Kosten.",
                color: "bg-pink-50 border-pink-100",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`${feature.color} border rounded-2xl p-6 hover:shadow-lg transition-shadow`}
              >
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              In 3 Schritten zur perfekten Reise
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Route planen",
                description:
                  "Gib Start und Ziel ein, füge Zwischenstopps hinzu und wähle dein Verkehrsmittel.",
                icon: "📍",
              },
              {
                step: "2",
                title: "Vergleichen",
                description:
                  "Vergleiche Hotels, Flüge und Mietwagen von Top-Anbietern. Finde den besten Preis.",
                icon: "🔍",
              },
              {
                step: "3",
                title: "Buchen & losreisen",
                description:
                  "Buche direkt beim Anbieter deiner Wahl. Alles organisiert in deinem Reiseführer.",
                icon: "🎉",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Partners */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Vergleiche die besten Anbieter
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Wir durchsuchen hunderte Reise-Anbieter, damit du den besten Preis findest.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 items-center opacity-70">
            {[
              "Booking.com",
              "Expedia",
              "Skyscanner",
              "Hotels.com",
              "Rentalcars",
              "GetYourGuide",
              "Trainline",
              "Viator",
            ].map((partner) => (
              <div
                key={partner}
                className="bg-gray-100 px-6 py-3 rounded-xl text-gray-500 font-medium text-sm"
              >
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Bereit für dein nächstes Abenteuer?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Starte jetzt mit der Planung – kostenlos und unverbindlich. Deine Traumreise wartet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              🗺️ Reise planen (Web)
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-400 transition-colors border border-blue-400"
            >
               iOS App herunterladen
            </a>
          </div>
          <p className="text-blue-200 text-sm mt-6">
            Kostenlos. Keine Registrierung nötig. Sofort loslegen.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🌍</span>
                <span className="text-lg font-bold text-white">
                  Sniffer<span className="text-blue-400">Trek</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                Dein All-in-One Reiseplaner. Route, Hotels, Flüge und mehr – alles in einem Tool.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Planen</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Routenplanung</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Bucket List</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Reiseführer</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Buchen</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Hotels</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Flüge</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mietwagen</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kreuzfahrten</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Rechtliches</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Impressum</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Datenschutz</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AGB</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} SnifferTrek. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
