"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { TRAVEL_REPORT_NAV } from "@/lib/travelReports/travelReportNav";

export default function Footer() {
  const t = useTranslations("footer");
  const tChrome = useTranslations("chrome");
  const tReports = useTranslations("reports");

  return (
    <footer className="bg-[var(--bcn-black,#1d1d1f)] text-zinc-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-white/10">
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-4" aria-label={tChrome("homeAria")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sniffertrek-logo-light.svg"
                alt="SnifferTrek"
                className="h-8 w-auto"
                width={160}
                height={35}
              />
            </Link>
            <p className="text-sm leading-relaxed text-zinc-500">{t("tagline")}</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 tracking-tight">{t("product")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/reise-planen" className="hover:text-white transition-colors">
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
                <Link href="/meine-reisen" className="hover:text-white transition-colors">
                  {tChrome("myTrips")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 tracking-tight">{t("discover")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/unsere-reisen" className="hover:text-white transition-colors">
                  {tChrome("travelIdeas")}
                </Link>
              </li>
              <li>
                <Link href="/inspiration" className="hover:text-white transition-colors">
                  {t("inspiration")}
                </Link>
              </li>
              {TRAVEL_REPORT_NAV.map((report) => (
                <li key={report.slug}>
                  <Link href={report.href} className="hover:text-white transition-colors">
                    {tReports(`${report.slug}.label` as Parameters<typeof tReports>[0])}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/info" className="hover:text-white transition-colors">
                  {t("about")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 tracking-tight">{t("legalContact")}</h4>
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
              <li className="flex items-center gap-2 pt-1">
                <Mail className="w-4 h-4 text-zinc-500" />
                <a href="mailto:info@sniffertrek.com" className="hover:text-white transition-colors">
                  info@sniffertrek.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-zinc-500" />
                <span>{t("switzerland")}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-500" />
                <span>{t("onRequest")}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>
            © {new Date().getFullYear()} SnifferTrek. {t("allRights")}
          </p>
          <div className="flex items-center gap-4">
            <LanguageSwitcher className="text-zinc-500 [&_button]:hover:text-white" />
            <p className="text-xs text-zinc-600">
              {t.rich("madeIn", {
                heart: () => (
                  <Link
                    href="/geschichten"
                    className="text-inherit no-underline decoration-transparent outline-none hover:text-inherit focus:outline-none"
                    tabIndex={-1}
                  >
                    ♥
                  </Link>
                ),
              })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
