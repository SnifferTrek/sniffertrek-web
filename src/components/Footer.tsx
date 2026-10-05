import { useTranslations } from "next-intl";
import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("footer");
  const tChrome = useTranslations("chrome");

  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-gray-800">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Sniffer
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  Trek
                </span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">{t("plannerTagline")}</p>
          </div>

          {/* Produkt */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t("product")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  {t("planTrip")}
                </Link>
              </li>
              <li>
                <Link href="/info#features" className="hover:text-white transition-colors">
                  {tChrome("features")}
                </Link>
              </li>
              <li>
                <Link href="/info#how-it-works" className="hover:text-white transition-colors">
                  {tChrome("howItWorks")}
                </Link>
              </li>
              <li>
                <span className="text-gray-600">{t("iosSoon")}</span>
              </li>
            </ul>
          </div>

          {/* Rechtliches */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t("legal")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/impressum" className="hover:text-white transition-colors">
                  {t("imprint")}
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="hover:text-white transition-colors">
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link href="/agb" className="hover:text-white transition-colors">
                  {t("terms")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t("contact")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <a href="mailto:info@sniffertrek.com" className="hover:text-white transition-colors">
                  info@sniffertrek.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>{t("switzerland")}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400" />
                <span>{t("onRequest")}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>© {new Date().getFullYear()} SnifferTrek. {t("allRights")}</p>
          <p className="text-xs text-gray-600">{t("madeIn", { heart: "♥" })}</p>
        </div>
      </div>
    </footer>
  );
}
