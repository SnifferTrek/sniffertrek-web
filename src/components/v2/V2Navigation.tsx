"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import {
  V2_DESTINATIONS_HREF,
  V2_HOW_HREF,
  V2_IDEAS_HREF,
  V2_PLAN_HREF,
  V2_TRIPS_HREF,
} from "@/lib/v2HomeData";

type Props = {
  homeHref?: string;
};

export default function V2Navigation({ homeHref = "/" }: Props) {
  const tChrome = useTranslations("chrome");
  const tFooter = useTranslations("footer");
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);

  const links = [
    { href: V2_PLAN_HREF, label: tFooter("planTrip") },
    { href: V2_IDEAS_HREF, label: tChrome("travelIdeas") },
    { href: V2_DESTINATIONS_HREF, label: tChrome("destinations") },
    { href: V2_HOW_HREF, label: tChrome("howItWorks") },
  ];

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className={`v2-nav ${stuck ? "is-stuck" : ""}`}>
      <div className="v2-wrap flex h-[4.25rem] items-center justify-between gap-4">
        <Link href={homeHref} className="flex shrink-0 items-center" aria-label={tChrome("homeAria")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/sniffertrek-logo.svg"
            alt="SnifferTrek"
            className="h-8 w-auto sm:h-9"
            width={160}
            height={35}
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Hauptnavigation">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[0.9375rem] text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher className="hidden text-xs sm:inline-flex" compact />
          <Link
            href={V2_TRIPS_HREF}
            className="hidden text-[0.9375rem] text-[var(--v2-muted)] transition-colors hover:text-[var(--v2-ink)] sm:inline"
          >
            {tChrome("myTrips")}
          </Link>
          <Link href={V2_PLAN_HREF} className="v2-btn !hidden md:!inline-flex">
            {tFooter("planTrip")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full md:hidden"
            aria-expanded={open}
            aria-controls="v2-mobile-nav"
            aria-label={open ? tChrome("closeMenu") : tChrome("openMenu")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="v2-mobile-nav" className="border-t border-[var(--v2-line)] bg-[var(--v2-bg)] md:hidden">
          <nav className="v2-wrap flex flex-col gap-1 py-4" aria-label="Mobiles Menü">
            <div className="px-2 py-2">
              <LanguageSwitcher className="text-xs" />
            </div>
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-2 py-3 text-base text-[var(--v2-ink)]"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={V2_TRIPS_HREF}
              className="rounded-xl px-2 py-3 text-base text-[var(--v2-ink)]"
              onClick={() => setOpen(false)}
            >
              {tChrome("myTrips")}
            </Link>
            <Link href={V2_PLAN_HREF} className="v2-btn mt-3 justify-center" onClick={() => setOpen(false)}>
              {tFooter("planTrip")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
