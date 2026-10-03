"use client";

import { Menu, X, LogIn, User, Settings, Printer, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "./AuthProvider";
import { isMasterUser } from "@/lib/isMasterUser";
import { TRAVEL_REPORT_NAV } from "@/lib/travelReports/travelReportNav";
import { printTravelReport } from "@/lib/printTravelReport";
import LanguageSwitcher from "./LanguageSwitcher";

const navLink =
  "text-sm text-[var(--bcn-muted,#86868b)] hover:text-[var(--bcn-black,#1d1d1f)] transition-colors";
const navLinkActive = "text-sm font-semibold text-[var(--bcn-blue,#0071e3)]";

export default function Header() {
  const t = useTranslations("chrome");
  const tReports = useTranslations("reports");
  const [menuOpen, setMenuOpen] = useState(false);
  const [unsereOpen, setUnsereOpen] = useState(false);
  const unsereRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isAdmin = isMasterUser(user);
  const onReportPage = pathname.startsWith("/reisebericht/");
  const unsereActive =
    pathname === "/unsere-reisen" || pathname.startsWith("/unsere-reisen/") || onReportPage;

  useEffect(() => {
    setUnsereOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!unsereOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!unsereRef.current?.contains(e.target as Node)) setUnsereOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [unsereOpen]);

  return (
    <nav className="st-apple-nav">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label={t("homeAria")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/sniffertrek-logo.svg"
              alt="SnifferTrek"
              className="h-8 w-auto sm:h-9"
              width={160}
              height={35}
            />
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link href="/info#features" className={navLink}>
              {t("features")}
            </Link>
            <Link href="/info#how-it-works" className={navLink}>
              {t("howItWorks")}
            </Link>
            <Link
              href="/meine-reisen"
              className={
                pathname === "/meine-reisen" || pathname.startsWith("/meine-reisen/")
                  ? navLinkActive
                  : navLink
              }
              aria-current={pathname === "/meine-reisen" ? "page" : undefined}
            >
              {t("myTrips")}
            </Link>

            <div className="relative border-l border-black/8 pl-4" ref={unsereRef}>
              <button
                type="button"
                onClick={() => setUnsereOpen((v) => !v)}
                className={`inline-flex items-center gap-1 text-sm transition-colors ${
                  unsereActive ? navLinkActive : navLink
                }`}
                aria-expanded={unsereOpen}
                aria-haspopup="menu"
              >
                {t("travelIdeas")}
                <ChevronDown
                  className={`h-3.5 w-3.5 opacity-70 transition ${unsereOpen ? "rotate-180" : ""}`}
                />
              </button>
              {unsereOpen ? (
                <div role="menu" className="st-apple-nav__menu">
                  <Link
                    href="/unsere-reisen"
                    role="menuitem"
                    onClick={() => setUnsereOpen(false)}
                    className={`block px-4 py-2.5 text-sm font-semibold transition-colors ${
                      pathname === "/unsere-reisen"
                        ? "bg-[rgba(0,113,227,0.08)] text-[var(--bcn-blue)]"
                        : "text-[var(--bcn-black)] hover:bg-black/[0.03]"
                    }`}
                  >
                    {t("overview")}
                  </Link>
                  <div className="my-1 border-t border-black/6" />
                  {TRAVEL_REPORT_NAV.map((report) => (
                    <Link
                      key={report.href}
                      href={report.href}
                      role="menuitem"
                      onClick={() => setUnsereOpen(false)}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        pathname === report.href
                          ? "bg-[rgba(0,113,227,0.08)] font-semibold text-[var(--bcn-blue)]"
                          : "text-[var(--bcn-black)] hover:bg-black/[0.03]"
                      }`}
                    >
                      {tReports(`${report.slug}.label` as Parameters<typeof tReports>[0])}
                      <span className="mt-0.5 block text-xs font-normal text-[var(--bcn-muted)]">
                        {tReports(`${report.slug}.duration` as Parameters<typeof tReports>[0])} · {tReports(`${report.slug}.tagline` as Parameters<typeof tReports>[0])}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            {onReportPage ? (
              <button
                type="button"
                onClick={() => void printTravelReport()}
                title={t("savePdfTitle")}
                aria-label={t("savePdfAria")}
                className="st-apple-nav__icon-btn"
              >
                <Printer className="h-4 w-4" />
              </button>
            ) : null}

            <LanguageSwitcher />

            {isAdmin && (
              <Link
                href="/admin/partner"
                className="text-[var(--bcn-muted)] transition-colors hover:text-[var(--bcn-black)]"
                title={t("partnerAdmin")}
              >
                <Settings className="h-4 w-4" />
              </Link>
            )}
            {!loading &&
              (user ? (
                <div className="flex items-center border-l border-black/8 pl-2">
                  <Link
                    href="/meine-reisen"
                    title={t("account")}
                    aria-label={t("openAccount")}
                    className="st-apple-nav__user-btn"
                  >
                    <User className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <Link href="/login" className="bcn-apple-btn bcn-apple-btn--blue !px-4 !py-1.5 !text-sm">
                  <LogIn className="h-3.5 w-3.5" />
                  {t("signIn")}
                </Link>
              ))}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher compact />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-[var(--bcn-muted)] hover:text-[var(--bcn-black)]"
              aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mt-2 space-y-3 border-t border-black/6 pb-4 pt-4 md:hidden">
            <Link
              href="/info#features"
              onClick={() => setMenuOpen(false)}
              className={`block py-2 ${navLink}`}
            >
              {t("features")}
            </Link>
            <Link
              href="/info#how-it-works"
              onClick={() => setMenuOpen(false)}
              className={`block py-2 ${navLink}`}
            >
              {t("howItWorks")}
            </Link>
            <Link
              href="/meine-reisen"
              onClick={() => setMenuOpen(false)}
              className={`block py-2 ${
                pathname === "/meine-reisen" || pathname.startsWith("/meine-reisen/")
                  ? navLinkActive
                  : navLink
              }`}
              aria-current={pathname === "/meine-reisen" ? "page" : undefined}
            >
              {t("myTrips")}
            </Link>
            <div className="space-y-2 border-t border-black/6 pt-3">
              <Link
                href="/unsere-reisen"
                onClick={() => setMenuOpen(false)}
                className={`block py-2 text-sm ${
                  pathname === "/unsere-reisen" ? navLinkActive : navLink
                }`}
              >
                {t("travelIdeasOverview")}
              </Link>
              <div className="flex flex-wrap gap-2">
                {TRAVEL_REPORT_NAV.map((report) => (
                  <Link
                    key={report.href}
                    href={report.href}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      pathname === report.href
                        ? "border-[var(--bcn-blue)] bg-[rgba(0,113,227,0.08)] text-[var(--bcn-blue)]"
                        : "border-black/8 bg-white text-[var(--bcn-muted)]"
                    }`}
                  >
                    {tReports(`${report.slug}.label` as Parameters<typeof tReports>[0])}
                  </Link>
                ))}
              </div>
            </div>

            {onReportPage ? (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  void printTravelReport();
                }}
                className="flex w-full items-center gap-2 rounded-xl border border-black/8 px-3 py-2.5 text-sm font-medium text-[var(--bcn-black)] hover:bg-black/[0.03]"
              >
                <Printer className="h-4 w-4" />
                {t("savePdf")}
              </button>
            ) : null}

            {!loading &&
              (user ? (
                <button
                  type="button"
                  onClick={() => {
                    toggleKonto();
                    setMenuOpen(false);
                  }}
                  className={`-mx-1 mt-2 flex w-full items-center gap-3 rounded-xl border-t border-black/6 px-1 py-3 pt-4 text-left transition-colors hover:bg-black/[0.03] ${
                    kontoOpen ? "bg-[rgba(0,113,227,0.06)]" : ""
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(0,113,227,0.1)] text-[var(--bcn-blue)] ${
                      kontoOpen ? "ring-2 ring-[var(--bcn-blue)]" : ""
                    }`}
                  >
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--bcn-black)]">{t("account")}</p>
                    <p className="truncate text-xs text-[var(--bcn-muted)]">
                      {user.name || user.email}
                    </p>
                  </div>
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-sm font-medium text-[var(--bcn-blue)]"
                >
                  <LogIn className="h-4 w-4" />
                  {t("signInRegister")}
                </Link>
              ))}
          </div>
        )}
      </div>
    </nav>
  );
}
