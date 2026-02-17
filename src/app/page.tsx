import {
  MapPin,
  Hotel,
  Plane,
  Car,
  Ship,
  Train,
  Smartphone,
  Shield,
  Compass,
  Star,
  ChevronRight,
  Globe,
  Search,
  CreditCard,
  ArrowRight,
  Sparkles,
  Map,
  BookOpen,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Sniffer<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Trek</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                So funktioniert&apos;s
              </a>
              <a href="#services" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Services
              </a>
              <a
                href="#cta"
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all hover:scale-105"
              >
                Reise planen
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-cyan-50 animate-gradient" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-100/40 to-cyan-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-purple-100/30 to-blue-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        {/* Floating decorative elements */}
        <div className="absolute top-32 left-[10%] animate-float opacity-20">
          <Plane className="w-12 h-12 text-blue-400 rotate-[-30deg]" />
        </div>
        <div className="absolute top-48 right-[15%] animate-float-slow opacity-15">
          <Compass className="w-16 h-16 text-cyan-400" />
        </div>
        <div className="absolute bottom-32 left-[20%] animate-float-reverse opacity-15">
          <Map className="w-10 h-10 text-purple-400" />
        </div>
        <div className="absolute bottom-48 right-[10%] animate-float opacity-20">
          <Globe className="w-14 h-14 text-blue-300" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="animate-fade-in-up inline-flex items-center gap-2 bg-white/80 backdrop-blur text-blue-700 px-5 py-2 rounded-full text-sm font-medium mb-8 border border-blue-100 shadow-sm">
              <Sparkles className="w-4 h-4" />
              Alles in einem Tool – 100% kostenlos
            </div>

            <h1 className="animate-fade-in-up delay-100 text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] mb-8 tracking-tight">
              Plane deine
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500">
                Traumreise.
              </span>
            </h1>

            <p className="animate-fade-in-up delay-200 text-xl sm:text-2xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
              Route planen. Hotels vergleichen. Flüge finden.
              <br className="hidden sm:block" />
              Sehenswürdigkeiten entdecken. <strong className="text-gray-700 font-medium">Alles an einem Ort.</strong>
            </p>

            <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#cta"
                className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:shadow-xl hover:shadow-blue-500/25 transition-all hover:scale-105 animate-pulse-glow"
              >
                <Map className="w-5 h-5" />
                Jetzt Reise planen
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-2xl text-lg font-semibold border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
              >
                Entdecken
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="animate-fade-in-up delay-400 grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto">
            {[
              { value: "1000+", label: "Sehenswürdigkeiten", icon: MapPin },
              { value: "50+", label: "Länder", icon: Globe },
              { value: "100%", label: "Kostenlos", icon: Star },
              { value: "1", label: "Tool für alles", icon: Sparkles },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/80 shadow-sm"
              >
                <stat.icon className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Compass className="w-4 h-4" />
              Features
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-5">
              Alles für deine Reise
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Von der ersten Idee bis zur fertigen Buchung – SnifferTrek begleitet dich bei jedem Schritt.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Map,
                title: "Routenplanung",
                description:
                  "Plane deine Route mit Zwischenstopps, berechne Distanzen und Fahrzeiten – für Auto, Zug oder Fahrrad.",
                gradient: "from-blue-500 to-blue-600",
                bg: "bg-blue-50",
              },
              {
                icon: Hotel,
                title: "Hotels vergleichen",
                description:
                  "Finde die besten Hotels entlang deiner Route. Vergleiche Preise von Booking.com, Expedia und mehr.",
                gradient: "from-purple-500 to-purple-600",
                bg: "bg-purple-50",
              },
              {
                icon: Plane,
                title: "Flüge buchen",
                description:
                  "Suche und vergleiche Flüge von hunderten Airlines. Finde den besten Preis für deine Reisedaten.",
                gradient: "from-cyan-500 to-cyan-600",
                bg: "bg-cyan-50",
              },
              {
                icon: MapPin,
                title: "Sehenswürdigkeiten",
                description:
                  "Entdecke über 1000 Points of Interest weltweit. Erstelle deine persönliche Bucket List.",
                gradient: "from-green-500 to-emerald-600",
                bg: "bg-green-50",
              },
              {
                icon: Car,
                title: "Mietwagen",
                description:
                  "Vergleiche Mietwagen-Angebote am Zielort. Von Kleinwagen bis SUV – zum besten Preis.",
                gradient: "from-orange-500 to-orange-600",
                bg: "bg-orange-50",
              },
              {
                icon: Shield,
                title: "Reiseversicherung",
                description:
                  "Schütze deine Reise mit der passenden Versicherung. Vergleiche Angebote und buche direkt.",
                gradient: "from-red-500 to-red-600",
                bg: "bg-red-50",
              },
              {
                icon: Ship,
                title: "Kreuzfahrten",
                description:
                  "Traumhafte Kreuzfahrten entdecken und buchen. Von Mittelmeer bis Karibik.",
                gradient: "from-teal-500 to-teal-600",
                bg: "bg-teal-50",
              },
              {
                icon: Train,
                title: "Zug-Tickets",
                description:
                  "Europaweit Zugverbindungen finden und Tickets buchen. Schnell und bequem reisen.",
                gradient: "from-indigo-500 to-indigo-600",
                bg: "bg-indigo-50",
              },
              {
                icon: Smartphone,
                title: "eSIM",
                description:
                  "Bleibe weltweit verbunden. Finde die beste eSIM für dein Reiseziel – ohne Roaming-Kosten.",
                gradient: "from-pink-500 to-pink-600",
                bg: "bg-pink-50",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="card-hover shine-effect group bg-white rounded-2xl p-6 border border-gray-100 cursor-default"
              >
                <div
                  className={`${feature.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className={`w-6 h-6 bg-gradient-to-r ${feature.gradient} text-transparent`} style={{ stroke: 'currentColor', color: feature.gradient.includes('blue') ? '#3b82f6' : feature.gradient.includes('purple') ? '#a855f7' : feature.gradient.includes('cyan') ? '#06b6d4' : feature.gradient.includes('green') ? '#22c55e' : feature.gradient.includes('orange') ? '#f97316' : feature.gradient.includes('red') ? '#ef4444' : feature.gradient.includes('teal') ? '#14b8a6' : feature.gradient.includes('indigo') ? '#6366f1' : '#ec4899' }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <BookOpen className="w-4 h-4" />
              So einfach geht&apos;s
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-5">
              In 3 Schritten zur Traumreise
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-blue-200 via-cyan-200 to-green-200" />

            {[
              {
                step: "1",
                title: "Route planen",
                description:
                  "Gib Start und Ziel ein, füge Zwischenstopps hinzu und wähle dein Verkehrsmittel.",
                icon: MapPin,
                color: "from-blue-500 to-blue-600",
              },
              {
                step: "2",
                title: "Vergleichen",
                description:
                  "Vergleiche Hotels, Flüge und Mietwagen von Top-Anbietern. Finde den besten Preis.",
                icon: Search,
                color: "from-cyan-500 to-cyan-600",
              },
              {
                step: "3",
                title: "Buchen & losreisen",
                description:
                  "Buche direkt beim Anbieter deiner Wahl. Alles organisiert in deinem Reiseführer.",
                icon: CreditCard,
                color: "from-green-500 to-emerald-600",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className={`relative z-10 w-20 h-20 bg-gradient-to-br ${item.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <item.icon className="w-8 h-8 text-white" />
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-sm font-bold text-gray-900 shadow-md border border-gray-100">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Partners */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Wir durchsuchen die besten Anbieter
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Vergleiche Preise von hunderten Reise-Anbietern – damit du immer den besten Deal findest.
            </p>
          </div>

          {/* Scrolling logos */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />
            <div className="flex animate-scroll-left">
              {[
                "Booking.com",
                "Expedia",
                "Skyscanner",
                "Hotels.com",
                "Rentalcars",
                "GetYourGuide",
                "Trainline",
                "Viator",
                "Agoda",
                "HostelWorld",
                "Booking.com",
                "Expedia",
                "Skyscanner",
                "Hotels.com",
                "Rentalcars",
                "GetYourGuide",
                "Trainline",
                "Viator",
                "Agoda",
                "HostelWorld",
              ].map((partner, i) => (
                <div
                  key={`${partner}-${i}`}
                  className="flex-shrink-0 mx-4 bg-gray-50 px-8 py-4 rounded-2xl text-gray-400 font-semibold text-base border border-gray-100 whitespace-nowrap"
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Unique Selling Points */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Star className="w-4 h-4" />
                Warum SnifferTrek?
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Die Reiseplanung, die dir
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600"> wirklich hilft</span>
              </h2>
              <div className="space-y-5">
                {[
                  {
                    title: "Alles an einem Ort",
                    description: "Kein Tab-Chaos mehr. Route, Hotels, Flüge und POIs in einer Übersicht.",
                  },
                  {
                    title: "Beste Preise garantiert",
                    description: "Wir vergleichen dutzende Anbieter, damit du nie zu viel zahlst.",
                  },
                  {
                    title: "Persönlicher Reiseführer",
                    description: "Deine komplette Reise als Timeline – mit Buchungsstatus und Notizen.",
                  },
                  {
                    title: "Unterwegs dabei",
                    description: "Plane am Computer, nimm alles auf dem iPhone mit. Auch offline.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mt-0.5">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Card Stack */}
            <div className="relative h-[450px] hidden md:block">
              <div className="absolute top-0 right-0 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 rotate-3 animate-float">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Map className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Zürich → Barcelona</div>
                    <div className="text-xs text-gray-400">1&apos;247 km • 12h 30min</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Zürich
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    Lyon (Zwischenstopp)
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Barcelona
                  </div>
                </div>
              </div>

              <div className="absolute top-32 left-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 -rotate-2 animate-float-slow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Hotel className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Hotel Barcelona</div>
                    <div className="text-xs text-gray-400">23.-26. August 2026</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-3.5 h-3.5 ${s <= 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                  ))}
                  <span className="text-xs text-gray-400 ml-1">4.2</span>
                </div>
                <div className="text-lg font-bold text-gray-900">CHF 89 <span className="text-xs font-normal text-gray-400">/ Nacht</span></div>
              </div>

              <div className="absolute bottom-8 right-8 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 rotate-1 animate-float-reverse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Sagrada Família</div>
                    <div className="text-xs text-gray-400">Bucket List</div>
                  </div>
                </div>
                <div className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full inline-block font-medium">
                  ✓ In Route hinzugefügt
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-[10%] animate-float">
            <Plane className="w-20 h-20 text-white rotate-[-20deg]" />
          </div>
          <div className="absolute bottom-10 right-[15%] animate-float-slow">
            <Globe className="w-24 h-24 text-white" />
          </div>
          <div className="absolute top-1/2 left-[60%] animate-float-reverse">
            <Compass className="w-16 h-16 text-white" />
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Bereit für dein nächstes
            <br />
            Abenteuer?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto font-light">
            Starte jetzt mit der Planung – kostenlos und unverbindlich.
            <br />
            Deine Traumreise wartet.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="group inline-flex items-center justify-center gap-3 bg-white text-blue-700 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-blue-50 transition-all shadow-xl hover:scale-105"
            >
              <Map className="w-5 h-5" />
              Reise planen
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur text-white px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-white/20 transition-all border border-white/20"
            >
              <Smartphone className="w-5 h-5" />
              iOS App laden
            </a>
          </div>
          <p className="text-blue-200/80 text-sm mt-8">
            Kostenlos &bull; Keine Registrierung nötig &bull; Sofort loslegen
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-950 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">
                  Sniffer<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Trek</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed">
                Dein All-in-One Reiseplaner. Route, Hotels, Flüge und mehr – alles in einem Tool.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Planen</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Routenplanung</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Bucket List</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Reiseführer</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Buchen</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Hotels</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Flüge</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mietwagen</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kreuzfahrten</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Rechtliches</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Impressum</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Datenschutz</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AGB</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} SnifferTrek. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
